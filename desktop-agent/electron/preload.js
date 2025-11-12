const { contextBridge, ipcRenderer } = require('electron');

console.log('🔵 Preload script starting...');

try {
  // Expose Electron API to the renderer process
  contextBridge.exposeInMainWorld('electron', {
    // Check if running in Electron
    isElectron: true,
    
    // Clock In - notify Electron that user clocked in
    onClockIn: async (token, email) => {
      console.log('🔵 Preload: Clock in triggered for', email);
      
      try {
        // Store credentials
        await ipcRenderer.invoke('store-credentials', { token, email });
        
        // Notify that user is clocked in
        ipcRenderer.send('clock-status-changed', true);
        
        console.log('✅ Preload: Clock in complete');
        return { success: true };
      } catch (error) {
        console.error('❌ Preload: Clock in error', error);
        return { success: false, error: error.message };
      }
    },
    
    // Clock Out - notify Electron that user clocked out
    onClockOut: async () => {
      console.log('🔵 Preload: Clock out triggered');
      
      try {
        // Notify that user is clocked out
        ipcRenderer.send('clock-status-changed', false);
        
        console.log('✅ Preload: Clock out complete');
        return { success: true };
      } catch (error) {
        console.error('❌ Preload: Clock out error', error);
        return { success: false, error: error.message };
      }
    },
    
    // Get tracking status
    getTrackingStatus: () => {
      return ipcRenderer.invoke('get-tracking-status');
    },
    
    // Force start tracking (manual trigger)
    forceStartTracking: () => {
      return ipcRenderer.invoke('force-start-tracking');
    },
    
    // Force stop tracking (manual trigger)
    forceStopTracking: () => {
      return ipcRenderer.invoke('force-stop-tracking');
    },
    
    // Listen for tracking events
    onTrackingStarted: (callback) => {
      ipcRenderer.on('tracking-started', (event, data) => callback(data));
    },
    
    onTrackingStopped: (callback) => {
      ipcRenderer.on('tracking-stopped', (event, data) => callback(data));
    },
    
    onProductivityUpdate: (callback) => {
      ipcRenderer.on('productivity-update', (event, data) => callback(data));
    }
  });

  console.log('✅ Preload script loaded - Electron bridge ready');
} catch (error) {
  console.error('❌ Preload script error:', error);
}