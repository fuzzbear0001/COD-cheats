/**
 * Global configuration for the license system
 * This file centralizes all application constants
 * to avoid duplication and ease future changes
 */

const path = require('path');

module.exports = {
  // URLs for the license server
  server: {
    baseUrl: 'XXXXXXXX',
    licenseValidation: 'XXXXXXXX',
    licenseActivation: 'XXXXXXXX',
    purchaseUrl: 'XXXXXXXX'
  },

  // Storage configuration
  storage: {
    name: 'license-data',
    encryptionKey: 'app-license-secure-key'
  },

  // Default game modes
  defaultGameModes: {
    multiplayer: false,
    warzone: false,
    cdl: false
  },

  // API request timeouts (in ms)
  timeouts: {
    apiRequest: 10000
  },

  // File paths
  paths: {
    licenseView: path.join(__dirname, 'licenseView.html'),
    licensePreload: path.join(__dirname, 'licensePreload.js'),
    appIcon: path.join(__dirname, '../assets/icon.ico')
  },

  // License window configuration
  licenseWindow: {
    width: 800,
    height: 1200,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // The preload path will be set dynamically
    }
  },

  // Log levels (for future filtering implementation)
  logLevels: {
    DEBUG: 0, 
    INFO: 1,
    WARNING: 2,
    ERROR: 3
  },

  // Other constants
  constants: {
    licenseNotValidError: 'License verification aborted'
  }
};