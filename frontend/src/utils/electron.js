// frontend/src/utils/electron.js

/**
 * Check if running in Electron
 */
export const isElectron = () => {
    return window.electron?.isElectron || false;
  };
  
  /**
   * Get Electron API
   */
  export const getElectronAPI = () => {
    if (!isElectron()) {
      console.warn('Not running in Electron');
      return null;
    }
    return window.electron;
  };
  
  /**
   * Electron API wrapper
   */
  export const electronAPI = {
    // Auth
    login: async (credentials) => {
      if (!isElectron()) return null;
      return await window.electron.login(credentials);
    },
  
    logout: async () => {
      if (!isElectron()) return null;
      return await window.electron.logout();
    },
  
    checkAuth: async () => {
      if (!isElectron()) return null;
      return await window.electron.checkAuth();
    },
  
    // Tracking
    getStats: async () => {
      if (!isElectron()) return null;
      return await window.electron.getStats();
    },
  
    syncNow: async () => {
      if (!isElectron()) return null;
      return await window.electron.syncNow();
    },
  
    // Settings
    getSettings: async () => {
      if (!isElectron()) return null;
      return await window.electron.getSettings();
    },
  
    updateSettings: async (settings) => {
      if (!isElectron()) return null;
      return await window.electron.updateSettings(settings);
    },
  
    // Events
    onProductivityUpdate: (callback) => {
      if (!isElectron()) return;
      window.electron.onProductivityUpdate(callback);
    },
  
    onNavigate: (callback) => {
      if (!isElectron()) return;
      window.electron.onNavigate(callback);
    },
  
    // Utils
    openExternal: (url) => {
      if (!isElectron()) {
        window.open(url, '_blank');
        return;
      }
      window.electron.openExternal(url);
    },
  
    // Platform
    getPlatform: () => {
      if (!isElectron()) return 'web';
      return window.electron.platform;
    }
  };
  
  export default electronAPI;