const Store = require('electron-store');
const config = require('../config');

/**
 * Service for managing license data storage
 */
class StorageService {
  constructor(encryptionKey = config.storage.encryptionKey) {
    this.store = new Store({
      name: config.storage.name,
      encryptionKey
    });
  }

  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[storageService] ${message}`);
  }

  /**
   * Error log with service name prefix
   * @private
   * @param {string} message - Error message to log
   * @param {Error} error - Possible error object
   */
  _logError(message, error) {
    console.error(`[storageService] ${message}`, error);
  }

  /**
   * Retrieve a value from storage
   * @param {string} key - Key to retrieve
   * @param {*} defaultValue - Default value if key doesn't exist
   * @returns {*} - Retrieved value or default value
   */
  get(key, defaultValue = null) {
    const value = this.store.get(key, defaultValue);
    if (value === defaultValue) {
      this._log(`Key "${key}" not found, default value used`);
    } else {
      this._log(`Key "${key}" retrieved from storage`);
    }
    return value;
  }

  /**
   * Save a value in storage
   * @param {string} key - Key to save
   * @param {*} value - Value to save
   */
  set(key, value) {
    try {
      this.store.set(key, value);
      this._log(`Key "${key}" saved to storage`);
    } catch (error) {
      this._logError(`❌ Error saving key "${key}"`, error);
      throw error;
    }
  }

  /**
   * Delete a key from storage
   * @param {string} key - Key to delete
   */
  delete(key) {
    try {
      this.store.delete(key);
      this._log(`Key "${key}" deleted from storage`);
    } catch (error) {
      this._logError(`❌ Error deleting key "${key}"`, error);
      throw error;
    }
  }

  /**
   * Retrieve license data from storage
   * @returns {Object} - License data (licenseKey, hardwareId, licenseStatus)
   */
  getLicenseData() {
    this._log('Retrieving license data from storage');
    return {
      licenseKey: this.get('licenseKey'),
      hardwareId: this.get('hardwareId'),
      licenseStatus: this.get('licenseStatus')
    };
  }

  /**
   * Save license status
   * @param {Object} licenseStatus - License status to save
   */
  saveLicenseStatus(licenseStatus) {
    if (!licenseStatus) {
      this._log('❌ Attempted to save a null license status');
      return;
    }
    this._log('Saving license status');
    this.set('licenseStatus', licenseStatus);
  }

  /**
   * Save license key
   * @param {string} licenseKey - License key to save
   */
  saveLicenseKey(licenseKey) {
    if (!licenseKey) {
      this._log('❌ Attempted to save a null license key');
      return;
    }
    this._log(`Saving license key: ${licenseKey.substring(0, 4)}...`);
    this.set('licenseKey', licenseKey);
  }

  /**
   * Save hardware ID
   * @param {string} hardwareId - Hardware ID to save
   */
  saveHardwareId(hardwareId) {
    if (!hardwareId) {
      this._log('❌ Attempted to save a null hardware ID');
      return;
    }
    this._log(`Saving hardware ID: ${hardwareId.substring(0, 8)}...`);
    this.set('hardwareId', hardwareId);
  }

  /**
   * Clear all license data
   */
  clearLicenseData() {
    this._log('Clearing all license data');
    this.delete('licenseKey');
    this.delete('licenseStatus');
  }
}

module.exports = StorageService;