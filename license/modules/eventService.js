/**
 * License event management service
 */
class EventService {
  constructor(mainWindow) {
    this.mainWindow = mainWindow;
  }

  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[eventService] ${message}`);
  }

  /**
   * Warning log with service name prefix
   * @private
   * @param {string} message - Warning message to log
   */
  _logWarning(message) {
    console.warn(`[eventService] ${message}`);
  }

  /**
   * Error log with service name prefix
   * @private
   * @param {string} message - Error message to log
   * @param {Error} error - Possible error object
   */
  _logError(message, error) {
    if (error) {
      console.error(`[eventService] ${message}`, error);
    } else {
      console.error(`[eventService] ${message}`);
    }
  }

  /**
   * Updates the main window
   * @param {BrowserWindow} window - New main window
   */
  setMainWindow(window) {
    this.mainWindow = window;
    this._log('Main window updated');
  }

  /**
   * Sends an event to the renderer
   * @private
   * @param {string} channel - Event channel
   * @param {any} data - Data to send (optional)
   */
  _sendEvent(channel, data = null) {
    if (!this.mainWindow) {
      this._logWarning(`Cannot send event "${channel}": no main window`);
      return false;
    }
    
    try {
      if (data) {
        this.mainWindow.webContents.send(channel, data);
      } else {
        this.mainWindow.webContents.send(channel);
      }
      this._log(`Event "${channel}" sent`);
      return true;
    } catch (error) {
      this._logError(`Error sending event "${channel}"`, error);
      return false;
    }
  }

  /**
   * Sends an event indicating license check is in progress
   */
  sendLicenseChecking() {
    this._sendEvent('license-checking');
  }

  /**
   * Sends the result of the license check
   * @param {Object} result - Check result
   */
  sendLicenseResult(result) {
    const status = result.valid ? 'valid' : 'invalid';
    this._log(`Sending license result: ${status}`);
    this._sendEvent('license-result', result);
  }

  /**
   * Sends a license check error
   * @param {string} errorMessage - Error message
   */
  sendLicenseError(errorMessage) {
    this._log(`Sending license error: ${errorMessage}`);
    this._sendEvent('license-error', errorMessage);
  }

  /**
   * Sends the result of the update check
   * @param {Object} result - Check result
   */
  sendUpdateCheckResult(result) {
    const hasUpdate = result.hasUpdate ? 'available' : 'not available';
    this._log(`Sending update check result: ${hasUpdate}`);
    this._sendEvent('update-check-result', result);
  }

  /**
   * Sends an update check error
   * @param {Object} error - Check error
   */
  sendUpdateCheckError(error) {
    this._log(`Sending update check error: ${error.message || 'Unknown error'}`);
    this._sendEvent('update-check-error', error);
  }
}

module.exports = EventService;