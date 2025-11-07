// desktop-agent/public/electron.js

const { app, BrowserWindow, ipcMain, Tray, Menu, Notification } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const Store = require('electron-store');

// Import custom modules
const ActivityTracker = require('../electron/tracker');
const API = require('../electron/api');

// Initialize persistent storage
const store = new Store();

// Global references
let mainWindow = null;
let tray = null;
let tracker = null;
let api = null;

// App configuration
const TRACKING_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Create main window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false, // Start hidden in system tray
    icon: path.join(__dirname, 'icons/icon.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, '../electron/preload.js')
    }
  });

  // Load React app
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Open DevTools in development
  if (isDev) {
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  }

  // Handle window close
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      
      // Show notification
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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    // Check if user is logged in
    const token = store.get('token');
    if (token) {
      // Auto-login: start tracker
      startTracking();
    }
    
    // Don't show window initially - it runs in tray
    // mainWindow.show();
  });
}

/**
 * Create system tray
 */
function createTray() {
  const iconPath = path.join(__dirname, 'icons/icon.png');
  tray = new Tray(iconPath);

  const updateTrayMenu = (score = '--') => {
    const contextMenu = Menu.buildFromTemplate([
      {
        label: 'Productivity Tracker',
        enabled: false,
        icon: iconPath
      },
      { type: 'separator' },
      {
        label: `Productivity Score: ${score}`,
        enabled: false
      },
      { type: 'separator' },
      {
        label: 'Show Dashboard',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
          }
        }
      },
      {
        label: 'Sync Now',
        click: async () => {
          if (tracker) {
            await tracker.sendActivity();
            new Notification({
              title: 'Sync Complete',
              body: 'Activity data synced successfully'
            }).show();
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Settings',
        click: () => {
          if (mainWindow) {
            mainWindow.show();
            mainWindow.webContents.send('navigate', '/settings');
          }
        }
      },
      { type: 'separator' },
      {
        label: 'Quit',
        click: () => {
          app.isQuitting = true;
          app.quit();
        }
      }
    ]);

    tray.setContextMenu(contextMenu);
  };

  updateTrayMenu();
  tray.setToolTip('Productivity Tracker');

  // Double-click to show window
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  // Store update function for later use
  tray.updateMenu = updateTrayMenu;
}

/**
 * Start activity tracking
 */
function startTracking() {
  const token = store.get('token');
  const apiUrl = store.get('api_url', process.env.REACT_APP_API_URL || 'http://localhost:8000/api');

  if (!token) {
    console.log('⚠ No token found. Cannot start tracking.');
    return;
  }

  // Initialize API client
  api = new API(apiUrl, token);

  // Initialize tracker
  tracker = new ActivityTracker(api, TRACKING_INTERVAL);

  // Listen for productivity updates
  tracker.on('activity-sent', (data) => {
    console.log('✓ Activity sent:', data);
    
    // Update tray
    if (tray && data.productivity_score) {
      tray.updateMenu(data.productivity_score);
    }

    // Notify React app
    if (mainWindow) {
      mainWindow.webContents.send('productivity-update', data);
    }

    // Show notification for low productivity
    if (data.productivity_score < 50) {
      new Notification({
        title: 'Low Productivity Alert',
        body: `Your current score is ${data.productivity_score}. Stay focused!`
      }).show();
    }
  });

  tracker.on('error', (error) => {
    console.error('✗ Tracker error:', error);
  });

  // Start tracking
  tracker.start();
  console.log('✓ Activity tracking started');
}
async function checkClockStatus() {
    if (!api) return;
    
    try {
      const status = await api.getStatus();
      
      if (status.is_clocked_in && !tracker) {
        // User clocked in - start tracking
        startTracking();
      } else if (!status.is_clocked_in && tracker) {
        // User clocked out - stop tracking
        stopTracking();
      }
    } catch (error) {
      console.error('Error checking clock status:', error);
    }
  }
  
  // Check clock status every 30 seconds
  setInterval(checkClockStatus, 30000);
  
  // Also listen for manual clock in/out from React app
  ipcMain.on('clock-status-changed', (event, isClockedIn) => {
    if (isClockedIn) {
      startTracking();
    } else {
      stopTracking();
    }
  });
/**
 * Stop activity tracking
 */
function stopTracking() {
  if (tracker) {
    tracker.stop();
    tracker = null;
    console.log('✓ Activity tracking stopped');
  }
}

/**
 * App lifecycle events
 */

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on('window-all-closed', () => {
  // Keep app running on all platforms when window is closed
  // if (process.platform !== 'darwin') {
  //   app.quit();
  // }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  } else {
    mainWindow.show();
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  stopTracking();
});

/**
 * IPC Handlers - Communication with React app
 */

// Login
ipcMain.handle('login', async (event, credentials) => {
  try {
    const tempAPI = new API(
      store.get('api_url', process.env.REACT_APP_API_URL || 'http://localhost:8000/api')
    );
    
    const result = await tempAPI.login(credentials);
    
    // Store credentials
    store.set('token', result.access_token);
    store.set('user', result.user);
    
    // Start tracking
    startTracking();
    
    return { success: true, user: result.user };
  } catch (error) {
    console.error('Login error:', error);
    return { success: false, error: error.message };
  }
});

// Logout
ipcMain.handle('logout', async (event) => {
  try {
    // Stop tracking
    stopTracking();
    
    // Clear storage
    store.delete('token');
    store.delete('user');
    
    // Update tray
    if (tray) {
      tray.updateMenu('--');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Logout error:', error);
    return { success: false, error: error.message };
  }
});

// Check auth status
ipcMain.handle('check-auth', async (event) => {
  const token = store.get('token');
  const user = store.get('user');
  
  return {
    isAuthenticated: !!token,
    user: user || null
  };
});

// Get current stats
ipcMain.handle('get-stats', async (event) => {
  if (tracker) {
    return tracker.getCurrentStats();
  }
  return null;
});

// Manual sync
ipcMain.handle('sync-now', async (event) => {
  if (tracker) {
    try {
      await tracker.sendActivity();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: false, error: 'Tracker not initialized' };
});

// Get settings
ipcMain.handle('get-settings', async (event) => {
  return {
    api_url: store.get('api_url', 'http://localhost:8000/api'),
    tracking_interval: TRACKING_INTERVAL / 1000,
    auto_start: store.get('auto_start', false)
  };
});

// Update settings
ipcMain.handle('update-settings', async (event, settings) => {
  if (settings.api_url) {
    store.set('api_url', settings.api_url);
  }
  if (settings.auto_start !== undefined) {
    store.set('auto_start', settings.auto_start);
    
    // Set auto-launch
    app.setLoginItemSettings({
      openAtLogin: settings.auto_start
    });
  }
  
  return { success: true };
});

// Open external link
ipcMain.handle('open-external', async (event, url) => {
  const { shell } = require('electron');
  await shell.openExternal(url);
});

console.log('✓ Electron app initialized');