const config = require('../config');
const UpdateChecker = require('../../update/updateChecker');
const fs = require('fs');
const path = require('path');

/**
 * Service for managing updates and version histories
 */
class UpdateService {
  constructor() {
    // Initialize with default language (en)
    this.language = 'en';
    this.translations = null;
    this.translationsCache = {};
    
    // Load default translations
    this.loadTranslations(this.language).then(translations => {
      this.translations = translations;
      
      // Initialize UpdateChecker after loading translations
      this.updateChecker = new UpdateChecker({
        serverUrl: config.server.baseUrl,
        checkOnStartup: false,
        enableLogs: false,
        language: this.language,
        translations: this.translations
      });
      
      this._log(`Service initialized with language: ${this.language}`);
    }).catch(error => {
      this._logError('Error loading initial translations', error);
      
      // Still initialize UpdateChecker even without translations
      this.updateChecker = new UpdateChecker({
        serverUrl: config.server.baseUrl,
        checkOnStartup: false,
        enableLogs: false
      });
      
      this._log('Service initialized without translations');
    });
  }

  /**
   * Change the language used for messages
   * @param {string} language - Language code (en, fr, etc.)
   */
  async setLanguage(language) {
    if (language === this.language) return;
    
    this.language = language || 'en';
    await this.loadTranslations(this.language);
    
    // Update translations in UpdateChecker
    if (this.updateChecker) {
      this.updateChecker.setLanguage(this.language, this.translations);
      this._log(`Language changed to: ${this.language}`);
    } else {
      this._log(`Language changed to: ${this.language}, but UpdateChecker is not yet initialized`);
    }
  }
  
  /**
   * Load translation files
   * @param {string} language - Language code to load
   */
  async loadTranslations(language) {
    try {
      // If already cached, use directly
      if (this.translationsCache[language]) {
        this._log(`Using cached translations for language: ${language}`);
        this.translations = this.translationsCache[language];
        return this.translations;
      }
      
      // Path to translation file
      const translationPath = path.join(__dirname, '..', '..', 'translations', `${language}.json`);
      
      // Check if file exists
      if (!fs.existsSync(translationPath)) {
        this._logError(`Translation file not found: ${translationPath}`);
        return null;
      }
      
      // Read and parse file
      const content = fs.readFileSync(translationPath, 'utf8');
      this.translations = JSON.parse(content);
      
      // Check that 'updates' section exists
      if (!this.translations.updates) {
        this._logError(`'updates' section missing in translations for ${language}`);
      } else {
        const keysToCheck = ['available', 'noUpdates', 'upToDate', 'alreadyLatest', 'newVersion'];
        let missingKeys = [];
        
        keysToCheck.forEach(key => {
          if (!this.translations.updates[key]) {
            missingKeys.push(key);
          }
        });
        
        if (missingKeys.length > 0) {
          this._logError(`Missing keys in 'updates' section for ${language}: ${missingKeys.join(', ')}`);
        } else {
          this._log(`'updates' translation keys verified for ${language}`);
        }
      }
      
      // Cache translations
      this.translationsCache[language] = this.translations;
      
      this._log(`Translations loaded for language: ${language}`);
      return this.translations;
    } catch (error) {
      this._logError(`Error loading translations for ${language}`, error);
      this.translations = null;
      return null;
    }
  }

  /**
   * Log with service name prefix
   * @private
   * @param {string} message - Message to log
   */
  _log(message) {
    console.log(`[updateService] ${message}`);
  }

  /**
   * Error log with service name prefix
   * @private
   * @param {string} message - Error message to log
   * @param {Error} error - Optional error object
   */
  _logError(message, error) {
    if (error) {
      console.error(`[updateService] ${message}`, error);
    } else {
      console.error(`[updateService] ${message}`);
    }
  }

  /**
   * Check if an update is available
   * @param {boolean} silent - If true, do not show popup if no update
   * @param {boolean} ignoreErrors - If true, do not show error messages
   * @returns {Promise<Object>} - Update information
   */
  async checkForUpdates(silent = true, ignoreErrors = false) {
    try {
      this._log(`Checking for updates from ${config.server.baseUrl}...`);
      
      // Ensure UpdateChecker initialized
      if (!this.updateChecker) {
        throw new Error('Update service is not yet initialized');
      }
      
      const updateResult = await this.updateChecker.checkForUpdates(silent, ignoreErrors);
      
      // Ensure current version is included in the result
      if (updateResult && !updateResult.currentVersion) {
        updateResult.currentVersion = require('electron').app.getVersion();
      }
      
      const status = updateResult.hasUpdate ? 'Update available' : 'No update available';
      this._log(`Update check result: ${status}`);
      
      return updateResult;
    } catch (error) {
      this._logError('Error checking for updates', error);
      throw error;
    }
  }

  /**
   * Get version history
   * @param {number} limit - Number of versions to fetch
   * @returns {Promise<Object>} - Version history
   */
  async getVersionHistory(limit = 5) {
    try {
      this._log(`Fetching version history (limit: ${limit})...`);
      
      // Ensure UpdateChecker initialized
      if (!this.updateChecker) {
        throw new Error('Update service is not yet initialized');
      }
      
      const historyResult = await this.updateChecker.getVersionHistory(limit);
      
      // Ensure current version is included in the result
      if (historyResult && !historyResult.currentVersion) {
        historyResult.currentVersion = require('electron').app.getVersion();
      }
      
      this._log(`Version history retrieved: ${historyResult.versions?.length || 0} versions`);
      
      if (historyResult.versions && historyResult.versions.length > 0) {
        this._log('Available versions:');
        historyResult.versions.forEach((version, index) => {
          this._log(`[${index + 1}] Version ${version.version} (${version.releaseDate || 'unknown date'})`);
        });
      }
      
      return historyResult;
    } catch (error) {
      this._logError(`Error fetching version history`, error);
      
      return { 
        success: false, 
        message: `Error: ${error.message}`,
        versions: [],
        currentVersion: require('electron').app.getVersion()
      };
    }
  }

  /**
   * Download an update
   * @param {Object} updateInfo - Update information to download
   * @returns {Promise<Object>} - Download result
   */
  async downloadUpdate(updateInfo) {
    try {
      this._log('Downloading update...');
      
      // Ensure UpdateChecker initialized
      if (!this.updateChecker) {
        throw new Error('Update service is not yet initialized');
      }
      
      if (updateInfo && updateInfo.downloadUrl) {
        this._log(`Direct download from: ${updateInfo.downloadUrl}`);
        await this.updateChecker.downloadUpdate(updateInfo);
        this._log('Download completed successfully');
        return { success: true };
      } else {
        this._log('No download URL provided, checking for updates');
        const result = await this.updateChecker.checkForUpdates(false, false);
        return result;
      }
    } catch (error) {
      this._logError('Error downloading update', error);
      throw error;
    }
  }
}

module.exports = UpdateService;