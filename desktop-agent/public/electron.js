// desktop-agent/public/electron.js
const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');
const { spawn } = require('child_process');
const fs = require('fs');

const ActivityTracker = require('../electron/tracker');
const API = require('../electron/api');

const store = new Store();

// ✅ ADD THIS LINE - Force set API URL to IPv4
if (!store.get('api_url')) {
  store.set('api_url', 'http://127.0.0.1:8000');
  console.log('✓ API URL set to http://127.0.0.1:8000');
}

let mainWindow = null;
let tray = null;
let tracker = null;
let api = null;
let agentProcess = null;
const TRACKING_INTERVAL = 5 * 60 * 1000;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    icon: path.join(__dirname, 'icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../electron/preload.js')
    }
  });
  
  const startUrl = isDev 
  ? 'http://localhost:3000'  // ✅ Change to YOUR main frontend port
  : `file://${path.join(__dirname, '../build/index.html')}`;

  mainWindow.loadURL(startUrl);
  if (isDev) mainWindow.webContents.openDevTools({ mode: 'detach' });

  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (Notification.isSupported()) {
        new Notification({
          title: 'Productivity Tracker',
          body: 'App is still running in the system tray',
          icon: path.join(__dirname, 'icons/icon.png')
        }).show();
      }
    }
    return false;
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  mainWindow.once('ready-to-show', () => {
    const token = store.get('token');
    if (token) checkClockStatus();
  });
}

function createTray() {
  const iconPath = path.join(__dirname, 'icons/icon.png');
  tray = new Tray(iconPath);

  const updateTrayMenu = (status = 'Not Tracking') => {
    const contextMenu = Menu.buildFromTemplate([
      { label: 'Employee Productivity Tracker', enabled: false, icon: iconPath },
      { type: 'separator' },
      { label: `Status: ${status}`, enabled: false },
      { type: 'separator' },
      { label: 'Show Dashboard', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } } },
      { label: 'Sync Now', click: async () => { 
          if (agentProcess) new Notification({ title: 'Sync Triggered', body: 'Forcing activity sync...' }).show();
          else new Notification({ title: 'Not Tracking', body: 'Please clock in first' }).show();
        }
      },
      { type: 'separator' },
      { label: 'Settings', click: () => { if (mainWindow) { mainWindow.show(); mainWindow.webContents.send('navigate', '/settings'); } } },
      { type: 'separator' },
      { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } }
    ]);
    tray.setContextMenu(contextMenu);
  };

  updateTrayMenu();
  tray.setToolTip('Employee Productivity Tracker');
  tray.on('double-click', () => { if (mainWindow) { mainWindow.show(); mainWindow.focus(); } });
  tray.updateMenu = updateTrayMenu;
}

function startTracking() {
  const token = store.get('token');
  const user = store.get('user');
  // Around line 79 - CHANGE THIS:
  const apiUrl = store.get('api_url', 'http://127.0.0.1:8000');


  if (!token || !user) { console.log('⚠️ No token/user found.'); return; }
  if (agentProcess) { console.log('⚠️ Agent already running.'); stopTracking(); }

  console.log('🚀 Starting Python agent...');

  const agentPath = path.join(__dirname, '..', 'agent.py');
  const agentDir = path.join(__dirname, '..');
  const configPath = path.join(agentDir, 'config.json');

  if (!fs.existsSync(agentPath)) {
    console.error('❌ agent.py not found');
    startSimpleTracking();
    return;
  }

  const spawnEnv = {
    ...process.env,
    EMPLOYEE_TOKEN: token,
    EMPLOYEE_EMAIL: user?.email || '',
    API_URL: apiUrl
  };

  agentProcess = spawn('python', ['agent.py'], {
    cwd: agentDir,
    stdio: ['ignore', 'pipe', 'pipe'],
    env: spawnEnv
  });
  console.log('✅ Agent started (PID:', agentProcess.pid, ')');

  agentProcess.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('🐍', output.trim());
    if (output.includes('Login successful') || output.includes('Using token from Electron')) {
      if (tray) tray.updateMenu('Tracking Active');
      if (mainWindow) mainWindow.webContents.send('tracking-started', { status: 'active' });
    }
    if (output.includes('Activity logged') || output.includes('Activity data sent successfully')) {
      if (mainWindow) mainWindow.webContents.send('productivity-update', { timestamp: new Date().toISOString() });
    }
    if (output.includes('Top 5 Applications') || output.includes('ACTIVE') || output.includes('IDLE')) {
      if (mainWindow) mainWindow.webContents.send('productivity-update', { timestamp: new Date().toISOString() });
    }
  });

  agentProcess.stderr.on('data', (data) => {
    const error = data.toString().trim();
    console.error('🐍 Error:', error);
    // Also send errors to renderer for debugging
    if (mainWindow) {
      mainWindow.webContents.send('agent-error', { error });
    }
  });

  agentProcess.on('close', (code) => {
    console.log(`🐍 Agent exited: ${code}`);
    agentProcess = null;
    if (tray) tray.updateMenu('Not Tracking');
    if (mainWindow) mainWindow.webContents.send('tracking-stopped', { status: 'stopped' });
  });

  agentProcess.on('error', (error) => {
    console.error('❌ Agent spawn failed:', error);
    agentProcess = null;
    startSimpleTracking();
  });

  if (tray) tray.updateMenu('Starting...');
}

function startSimpleTracking() {
  const token = store.get('token');
  const apiUrl = store.get('api_url', process.env.REACT_APP_API_URL || 'http://localhost:8000/api');
  if (!token) return;

  console.log('🔄 Starting simple tracker (fallback)...');
  api = new API(apiUrl, token);
  tracker = new ActivityTracker(api, TRACKING_INTERVAL);

  tracker.on('activity-sent', (data) => {
    console.log('✓ Activity sent:', data);
    if (tray && data.productivity_score) tray.updateMenu(`Score: ${data.productivity_score}`);
    if (mainWindow) mainWindow.webContents.send('productivity-update', data);
  });

  tracker.on('error', (error) => console.error('✗ Tracker error:', error));
  tracker.start();
  if (tray) tray.updateMenu('Simple Tracking Active');
}

function stopTracking() {
  if (agentProcess) {
    console.log('🛑 Stopping agent...');
    
    // Step 1: Create clock-out signal file
    const fs = require('fs');
    const path = require('path');
    const signalFile = path.join(__dirname, '..', '.clockout_signal');
    
    try {
      fs.writeFileSync(signalFile, 'clockout', 'utf8');
      console.log('✅ Clock-out signal created');
    } catch (err) {
      console.error('❌ Failed to create signal:', err);
    }
    
    // Step 2: Wait 3 seconds for agent to send data and exit
    setTimeout(() => {
      if (agentProcess) {
        console.log('⏹️ Killing agent process...');
        try {
          agentProcess.kill('SIGTERM');
        } catch (err) {
          console.error('Kill error:', err);
        }
        agentProcess = null;
        isAgentRunning = false;
      }
      
      if (tray) tray.updateMenu('Not Tracking');
      if (mainWindow) mainWindow.webContents.send('tracking-stopped', { status: 'stopped' });
      console.log('✓ Tracking stopped');
    }, 3000); // 3 seconds grace period
  }

  if (tracker) {
    tracker.stop();
    tracker = null;
  }
}

async function checkClockStatus() {
  const token = store.get('token');
  const apiUrl = store.get('api_url', 'http://127.0.0.1:8000');
  if (!token) return;

  try {
    const tempAPI = new API(apiUrl + '/api', token);
    const status = await tempAPI.getStatus();
    console.log('Clock status:', status);

    if (status.is_clocked_in && !agentProcess && !tracker) {
      console.log('✅ Clocked in - starting tracking');
      startTracking();
    } else if (!status.is_clocked_in && (agentProcess || tracker)) {
      console.log('⏹️ Clocked out - stopping tracking');
      stopTracking();
    }
  } catch (error) {
    console.error('Status check error:', error.message);
  }
}

//setInterval(() => {
//  const token = store.get('token');
//  if (token) checkClockStatus();
//}, 30000);

ipcMain.handle('store-credentials', async (event, { token, email }) => {
  console.log('💾 Storing credentials for:', email);
  
  store.set('token', token);
  store.set('user', { email: email });
  
  // Update API URL if needed
  const apiUrl = store.get('api_url', 'http://127.0.0.1:8000');
  store.set('api_url', apiUrl);
  
  console.log('   API URL:', apiUrl);
  
  return { success: true };
});

ipcMain.on('clock-status-changed', (event, isClockedIn) => {
  console.log('Clock status changed:', isClockedIn);
  if (isClockedIn) startTracking();
  else stopTracking();
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  console.log('✓ App ready');
});

app.on('window-all-closed', () => {});
app.on('activate', () => { if (mainWindow === null) createWindow(); else mainWindow.show(); });
app.on('before-quit', () => { app.isQuitting = true; stopTracking(); });

ipcMain.handle('login', async (event, credentials) => {
  try {
    const apiUrl = store.get('api_url', 'http://127.0.0.1:8000');
    const tempAPI = new API(apiUrl);
    const result = await tempAPI.login(credentials);
    store.set('token', result.access_token);
    store.set('user', result.user);
    console.log('✅ Login:', result.user.email);
    //setTimeout(() => checkClockStatus(), 2000);
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('logout', async (event) => {
  stopTracking();
  store.delete('token');
  store.delete('user');
  if (tray) tray.updateMenu('Not Tracking');
  return { success: true };
});

ipcMain.handle('check-auth', async (event) => {
  return { isAuthenticated: !!store.get('token'), user: store.get('user') || null };
});

ipcMain.handle('get-stats', async (event) => {
  if (agentProcess) return { tracking_type: 'enhanced', status: 'active' };
  if (tracker) return tracker.getCurrentStats();
  return { tracking_type: 'none', status: 'inactive' };
});

ipcMain.handle('sync-now', async (event) => {
  if (agentProcess) return { success: true, message: 'Agent syncs automatically' };
  if (tracker) {
    try {
      await tracker.sendActivity();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Not tracking' };
});

ipcMain.handle('get-settings', async (event) => {
  return {
    api_url: store.get('api_url', 'http://localhost:8000'),
    tracking_interval: TRACKING_INTERVAL / 1000,
    auto_start: store.get('auto_start', false)
  };
});

ipcMain.handle('update-settings', async (event, settings) => {
  if (settings.api_url) store.set('api_url', settings.api_url);
  if (settings.auto_start !== undefined) {
    store.set('auto_start', settings.auto_start);
    app.setLoginItemSettings({ openAtLogin: settings.auto_start });
  }
  return { success: true };
});

ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

ipcMain.handle('force-start-tracking', async (event) => {
  startTracking();
  return { success: true };
});

ipcMain.handle('force-stop-tracking', async (event) => {
  stopTracking();
  return { success: true };
});

ipcMain.handle('get-tracking-status', async (event) => {
  return {
    isTracking: !!(agentProcess || tracker),
    trackingType: agentProcess ? 'enhanced' : tracker ? 'simple' : 'none',
    agentRunning: !!agentProcess,
    simpleTrackerRunning: !!tracker
  };
});

console.log('✓ Electron initialized');