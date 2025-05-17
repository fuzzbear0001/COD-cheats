const axios = require('axios');
const config = require('../config');

/**
 * API call management service for license verification
 */
class ApiService {
  constructor(options = {}) {
    this.options = {
      licenseServerUrl: config.server.licenseValidation,
      activationServerUrl: config.server.licenseActivation,
      ...options
    };
  }

  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[apiService] ${message}`);
  }

  /**
   * Error log with service name prefix
   * @private
   * @param {string} message - Error message to log
   * @param {Error} error - Possible error object
   */
  _logError(message, error) {
    console.error(`[apiService] ${message}`, error);
  }

  /**
   * Makes an API call to activate a license
   * @param {string} licenseKey - License key to activate
   * @param {string} hardwareId - Hardware identifier
   * @param {string} activationDate - Activation date
   * @returns {Promise<Object>} - Activation result
   */
  async activateLicense(licenseKey, hardwareId, activationDate) {
    try {
      this._log(`Activating license from: ${this.options.activationServerUrl}`);
      this._log(`Activating license (***key hidden***)`);
      this._log(`Hardware ID: ${hardwareId.substring(0, 8)}...`);
      this._log(`Proposed activation date: ${activationDate}`);

      const response = await axios.post(this.options.activationServerUrl, {
        licenseKey,
        hardwareId,
        activationDate
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: config.timeouts.apiRequest,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      this._log(`Response received from activation server: ${response.status}`);
      return response.data;
    } catch (error) {
      this._logError(`❌ License activation error:`, error);
      
      const errorMessage = error.response 
        ? error.response.data.message || 'Activation error'
        : 'Unable to contact license server';
      
      this._log(`Error message: ${errorMessage}`);
      
      throw {
        valid: false,
        message: errorMessage
      };
    }
  }

  /**
   * Makes an API call to validate a license
   * @param {string} licenseKey - License key to validate
   * @param {string} hardwareId - Hardware identifier
   * @returns {Promise<Object>} - Validation result
   */
  async validateLicense(licenseKey, hardwareId) {
    try {
      this._log(`Validating license from: ${this.options.licenseServerUrl}`);
      this._log(`Validating license (***key hidden***)`);
      this._log(`Hardware ID: ${hardwareId.substring(0, 8)}...`);

      const response = await axios.post(this.options.licenseServerUrl, {
        licenseKey,
        hardwareId
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: config.timeouts.apiRequest,
        httpsAgent: new (require('https').Agent)({
          rejectUnauthorized: false
        })
      });

      this._log(`Response received from validation server: ${response.status}`);
      return response.data;
    } catch (error) {
      this._logError(`❌ License validation error:`, error);
      
      const errorMessage = error.response 
        ? error.response.data.message || 'Validation error'
        : 'Unable to contact license server';
      
      this._log(`Error message: ${errorMessage}`);
      
      throw {
        valid: false,
        message: errorMessage
      };
    }
  }
}

module.exports = ApiService;