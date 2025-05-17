const config = require('../config');

/**
 * Game mode management service
 */
class GameModeService {
  constructor(licenseStatusProvider) {
    this.getLicenseStatus = licenseStatusProvider;
  }

  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[gameModeService] ${message}`);
  }

  /**
   * Checks if a specific game mode is available with the current license
   * @param {string} mode - The game mode to check ('multiplayer', 'warzone', or 'cdl')
   * @returns {boolean} - true if the mode is available, false otherwise
   */
  isGameModeAvailable(mode) {
    const licenseStatus = this.getLicenseStatus();
    
    // Check if license is valid
    if (!licenseStatus || !licenseStatus.valid) {
      this._log(`Mode ${mode} not available: license not valid`);
      return false;
    }
    
    // Check if game modes info exists
    if (!licenseStatus.gameModes) {
      this._log(`Mode ${mode} not available: missing modes information`);
      return false;
    }
    
    // Check if specific mode is available
    const isAvailable = !!licenseStatus.gameModes[mode];
    this._log(`Mode ${mode}: ${isAvailable ? 'available' : 'not available'}`);
    return isAvailable;
  }
  
  /**
   * Retrieves the list of available game modes
   * @returns {Object} - An object containing game modes and their availability
   */
  getAvailableGameModes() {
    const licenseStatus = this.getLicenseStatus();
    
    if (!licenseStatus || !licenseStatus.valid || !licenseStatus.gameModes) {
      this._log('No game modes available: license not valid or missing modes information');
      return config.defaultGameModes;
    }
    
    const modes = licenseStatus.gameModes;
    this._log(`Available game modes: ${
      Object.entries(modes)
        .filter(([_, enabled]) => enabled)
        .map(([mode]) => mode)
        .join(', ') || 'None'
    }`);
    
    return modes;
  }
}

module.exports = GameModeService;