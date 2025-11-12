const { contextBridge, ipcRenderer } = require('electron');

/**
 * Expose safe APIs to React app
 */
contextBridge.exposeInMainWorld('electron', {
  // Auth
  login: (credentials) => ipcRenderer.invoke('login', credentials),
  logout: () => ipcRenderer.invoke('logout'),
  checkAuth: () => ipcRenderer.invoke('check-auth'),

  // Tracking
  getStats: () => ipcRenderer.invoke('get-stats'),
  syncNow: () => ipcRenderer.invoke('sync-now'),

  // Settings
  getSettings: () => ipcRenderer.invoke('get-settings'),
  updateSettings: (settings) => ipcRenderer.invoke('update-settings', settings),

  // Utilities
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Event listeners
  onProductivityUpdate: (callback) => {
    ipcRenderer.on('productivity-update', (event, data) => callback(data));
  },

  onNavigate: (callback) => {
    ipcRenderer.on('navigate', (event, path) => callback(path));
  },

  // Platform info
  platform: process.platform,
  isElectron: true
});
console.log('✓ Preload script loaded');
