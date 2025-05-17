const si = require('systeminformation');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');

/**
 * Hardware ID management service
 */
class HardwareService {
  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[hardwareService] ${message}`);
  }

  /**
   * Error log with service name prefix
   * @private
   * @param {string} message - Error message to log
   * @param {Error} error - Optional error object
   */
  _logError(message, error) {
    console.error(`[hardwareService] ${message}`, error);
  }

  /**
   * Generates a unique hardware ID based on system characteristics
   * @returns {Promise<string>} - The generated hardware ID
   */
  async generateHardwareId() {
    try {
      this._log('Generating a hardware ID');
      
      const [cpu, system, uuid, disk] = await Promise.all([
        si.cpu(),
        si.system(),
        si.uuid(),
        si.diskLayout()
      ]);

      this._log('System information retrieved, creating hash');

      const hardwareInfo = JSON.stringify({
        cpuId: cpu.manufacturer + cpu.brand + cpu.family + cpu.model + cpu.stepping,
        systemId: system.manufacturer + system.model + system.serial,
        diskId: disk.length > 0 ? disk[0].serialNum : '',
        uuid: uuid.os
      });

      const hardwareId = crypto
        .createHash('sha256')
        .update(hardwareInfo)
        .digest('hex');

      this._log(`Hardware ID generated: ${hardwareId.substring(0, 8)}...`);
      return hardwareId;
    } catch (error) {
      this._logError('❌ Error generating hardware ID:', error);
      
      // On failure, generate a fallback UUID
      const fallbackId = uuidv4();
      this._log(`Using fallback UUID: ${fallbackId.substring(0, 8)}...`);
      
      return fallbackId;
    }
  }
}

module.exports = HardwareService;