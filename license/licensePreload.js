const { contextBridge, ipcRenderer } = require('electron');

// Define APIs exposed to the renderer
const licenseAPI = {
  // License validation
  validateLicense: (licenseKey) => ipcRenderer.invoke('validate-license', licenseKey),
  
  // Retrieve license info
  getLicenseStatus: () => ipcRenderer.invoke('get-license-status'),
  getSavedLicense: () => ipcRenderer.invoke('get-saved-license'),
  getHardwareId: () => ipcRenderer.invoke('get-hardware-id'),
  getActivationDate: () => ipcRenderer.invoke('get-activation-date'),
  
  // Game mode management
  isGameModeAvailable: (mode) => ipcRenderer.invoke('is-game-mode-available', mode),
  getAvailableGameModes: () => ipcRenderer.invoke('get-available-game-modes'),
  
  // Update management
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  downloadUpdate: (updateInfo) => ipcRenderer.invoke('download-update', updateInfo),
  getVersionHistory: (limit = 5) => ipcRenderer.invoke('get-version-history', limit),
  
  // Language management
  changeLanguage: (language) => ipcRenderer.invoke('change-language', language),
  
  // Miscellaneous actions
  clearLicense: () => ipcRenderer.invoke('clear-license'),
  signalLicenseValidated: () => ipcRenderer.send('license-validated'),
  quitApp: () => ipcRenderer.send('quit-app'),
  openExternalLink: (url) => ipcRenderer.invoke('open-external-link', url),
  
  // Event listeners - License
  onLicenseResult: createEventListener('license-result'),
  onLicenseChecking: createEventListener('license-checking'),
  onLicenseError: createEventListener('license-error'),
  
  // Event listeners - Updates
  onUpdateCheckResult: createEventListener('update-check-result'),
  onUpdateCheckError: createEventListener('update-check-error')
};

/**
 * Creates a wrapper for event listeners
 * @param {string} eventName - Name of the event
 * @returns {Function} - Event listener function
 */
function createEventListener(eventName) {
  return (callback) => {
    const eventHandler = (_, data) => callback(data);
    ipcRenderer.on(eventName, eventHandler);
    
    // Returns a function to remove the listener
    return () => ipcRenderer.removeListener(eventName, eventHandler);
  };
}

// Expose secure APIs to the renderer process
contextBridge.exposeInMainWorld('licenseAPI', licenseAPI);