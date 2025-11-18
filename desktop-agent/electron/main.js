const { app, BrowserWindow, ipcMain, Tray, Menu } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let tray;
let agentProcess = null;
let isAgentRunning = false;

// Create main window
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, '../public/icons/icon.png')
  });

  // Load your frontend (adjust URL based on your setup)
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173'); // Vite dev server
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html')); // Production build
  }

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('close', (event) => {
    if (isAgentRunning) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

// Create system tray
function createTray() {
  tray = new Tray(path.join(__dirname, '../public/icons/icon.png'));
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => {
        mainWindow.show();
      }
    },
    {
      label: 'Agent Status',
      enabled: false
    },
    {
      label: isAgentRunning ? '🟢 Running' : '⚫ Stopped',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        stopAgent();
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.setToolTip('Employee Monitoring Agent');
  
  tray.on('click', () => {
    mainWindow.show();
  });
}

// Start Python agent
function startAgent(token, employeeEmail) {
  if (isAgentRunning) {
    console.log('⚠️ Agent already running');
    return;
  }

  console.log('🚀 Starting agent...');

  // Path to agent.py (adjust based on your structure)
  const agentPath = path.join(__dirname, '../agent.py');
  const pythonPath = 'python'; // or 'python3' on Mac/Linux

  // Start the agent process
  agentProcess = spawn(pythonPath, [agentPath], {
    env: {
      ...process.env,
      EMPLOYEE_TOKEN: token,
      EMPLOYEE_EMAIL: employeeEmail
    }
  });

  agentProcess.stdout.on('data', (data) => {
    console.log(`[Agent]: ${data}`);
    // Send logs to renderer if needed
    if (mainWindow) {
      mainWindow.webContents.send('agent-log', data.toString());
    }
  });

  agentProcess.stderr.on('data', (data) => {
    console.error(`[Agent Error]: ${data}`);
  });

  agentProcess.on('close', (code) => {
    console.log(`Agent process exited with code ${code}`);
    isAgentRunning = false;
    updateTrayMenu();
    
    if (mainWindow) {
      mainWindow.webContents.send('agent-stopped');
    }
  });

  isAgentRunning = true;
  updateTrayMenu();
  
  if (mainWindow) {
    mainWindow.webContents.send('agent-started');
  }
}

// Stop Python agent
// Stop Python agent
// Stop Python agent with graceful shutdown
function stopAgent() {
  if (agentProcess) {
    console.log('⏹️ Stopping agent gracefully...');
    
    try {
      // Send SIGTERM (polite shutdown request)
      agentProcess.kill('SIGTERM');
      console.log('📤 SIGTERM sent to Python agent (PID: ' + agentProcess.pid + ')');
      
      // Set 5-second grace period
      const killTimer = setTimeout(() => {
        if (agentProcess) {
          console.log('⚠️ Agent still running after 5s, forcing kill...');
          try {
            agentProcess.kill('SIGKILL');
          } catch (err) {
            console.error('Force kill error:', err);
          }
          // Cleanup
          agentProcess = null;
          isAgentRunning = false;
          updateTrayMenu();
          if (mainWindow) mainWindow.webContents.send('agent-stopped');
        }
      }, 5000);
      
      // Handle natural exit
      agentProcess.once('close', (code) => {
        clearTimeout(killTimer);
        console.log(`✅ Agent exited gracefully (code: ${code})`);
        agentProcess = null;
        isAgentRunning = false;
        updateTrayMenu();
        if (mainWindow) mainWindow.webContents.send('agent-stopped');
      });
      
    } catch (error) {
      console.error('❌ Error stopping agent:', error);
      agentProcess = null;
      isAgentRunning = false;
      updateTrayMenu();
    }
  }
}

// Update tray menu
function updateTrayMenu() {
  if (!tray) return;
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => mainWindow.show()
    },
    {
      label: 'Agent Status',
      enabled: false
    },
    {
      label: isAgentRunning ? '🟢 Running' : '⚫ Stopped',
      enabled: false
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        stopAgent();
        app.quit();
      }
    }
  ]);
  
  tray.setContextMenu(contextMenu);
}

// IPC Handlers
ipcMain.handle('clock-in', async (event, { token, email }) => {
  console.log('📥 Received clock-in request');
  startAgent(token, email);
  return { success: true };
});

ipcMain.handle('clock-out', async () => {
  console.log('📥 Received clock-out request');
  stopAgent();
  return { success: true };
});

ipcMain.handle('get-agent-status', async () => {
  return { isRunning: isAgentRunning };
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();
  
  // Check for updates
  autoUpdater.checkForUpdatesAndNotify();
  
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    stopAgent();
    app.quit();
  }
});

app.on('before-quit', () => {
  stopAgent();
});

// Auto-updater events
autoUpdater.on('update-available', () => {
  console.log('Update available');
});

autoUpdater.on('update-downloaded', () => {
  const { dialog } = require('electron');
  dialog.showMessageBox({
    type: 'info',
    title: 'Update Ready',
    message: 'A new version has been downloaded. Restart to apply updates?',
    buttons: ['Restart', 'Later']
  }).then((result) => {
    if (result.response === 0) {
      stopAgent();
      autoUpdater.quitAndInstall();
    }
  });
});