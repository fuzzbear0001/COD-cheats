const config = require('../config');

/**
 * License validation service
 */
class LicenseValidator {
  constructor(apiService, eventService) {
    this.apiService = apiService;
    this.eventService = eventService;
  }

  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[licenseValidator] ${message}`);
  }

  /**
   * Error log with service name prefix
   * @private
   * @param {string} message - Error message to log
   * @param {Error} error - Optional error object
   */
  _logError(message, error) {
    if (error) {
      console.error(`[licenseValidator] ${message}`, error);
    } else {
      console.error(`[licenseValidator] ${message}`);
    }
  }

  /**
   * Processes validation result and updates license status
   * @param {Object} result - Validation API result
   * @returns {Object} - Formatted license status
   */
  processLicenseResult(result) {
    if (result.valid) {
      this._logSuccessfulValidation(result);
    } else {
      this._logFailedValidation(result);
    }

    return {
      valid: result.valid,
      expiration: result.expiration,
      clientId: result.clientId,
      clientName: result.clientName,
      activationDate: result.activationDate,
      timestamp: new Date().toISOString(),
      gameModes: result.gameModes || config.defaultGameModes
    };
  }

  /**
   * Activates a license
   * @param {string} licenseKey - License key to activate
   * @param {string} hardwareId - Hardware ID
   * @param {Object} currentLicenseStatus - Current license status (optional)
   * @returns {Promise<Object>} - Activation result
   */
  async activateLicense(licenseKey, hardwareId, currentLicenseStatus = null) {
    try {
      this._log(`Starting license activation (${licenseKey.substring(0, 4)}...)`);
      this.eventService.sendLicenseChecking();

      if (currentLicenseStatus && currentLicenseStatus.valid) {
        this._log('License already activated, using standard validation');
        return this.validateLicense(licenseKey, hardwareId);
      }

      // Include current activation date with request
      const activationDate = new Date().toISOString();
      this._log(`Proposed activation date: ${activationDate}`);

      const result = await this.apiService.activateLicense(licenseKey, hardwareId, activationDate);
      this._log(`Activation result received, processing`);

      const licenseStatus = this.processLicenseResult(result);

      this.eventService.sendLicenseResult(result);

      return licenseStatus;
    } catch (error) {
      this._logError(`Error during license activation: ${error.message || 'Unknown error'}`, error);

      const errorStatus = {
        valid: false,
        message: error.message || 'Activation error'
      };

      this.eventService.sendLicenseError(errorStatus.message);

      return errorStatus;
    }
  }

  /**
   * Validates an existing license
   * @param {string} licenseKey - License key to validate
   * @param {string} hardwareId - Hardware ID
   * @returns {Promise<Object>} - Updated license status
   */
  async validateLicense(licenseKey, hardwareId) {
    try {
      this._log(`Starting license validation (${licenseKey.substring(0, 4)}...)`);
      this.eventService.sendLicenseChecking();

      const result = await this.apiService.validateLicense(licenseKey, hardwareId);
      this._log(`Validation result received, processing`);

      const licenseStatus = this.processLicenseResult(result);

      this.eventService.sendLicenseResult(result);

      return licenseStatus;
    } catch (error) {
      this._logError(`Error during license validation: ${error.message || 'Unknown error'}`, error);

      const errorStatus = {
        valid: false,
        message: error.message || 'Validation error'
      };

      this.eventService.sendLicenseError(errorStatus.message);

      return errorStatus;
    }
  }

  /**
   * Logs a successful validation
   * @private
   * @param {Object} result - Validation result
   */
  _logSuccessfulValidation(result) {
    this._log('✅ License validation successful');
    this._log(`Client: ${result.clientName || 'Not specified'} (ID: ${result.clientId || 'Not specified'})`);
    this._log(`Activation date: ${result.activationDate || 'Not specified'}`);
    this._log(`Expiration date: ${result.expiration || 'Not specified'}`);

    if (result.gameModes) {
      this._log(`Available game modes: ${
        Object.entries(result.gameModes)
          .filter(([_, enabled]) => enabled)
          .map(([mode]) => mode)
          .join(', ') || 'None'
      }`);
    }
  }

  /**
   * Logs a failed validation
   * @private
   * @param {Object} result - Validation result
   */
  _logFailedValidation(result) {
    this._log('❌ License validation failed');
    this._log(`Error message: ${result.message || 'No error message'}`);
  }
}

module.exports = LicenseValidator;