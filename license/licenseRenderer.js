document.addEventListener('DOMContentLoaded', async () => {
  function _log(message) {
    console.log(`[licenseRenderer] ${message}`);
  }
  
  function _logError(message, error) {
    if (error) {
      console.error(`[licenseRenderer] ${message}`, error);
    } else {
      console.error(`[licenseRenderer] ${message}`);
    }
  }

  const licenseKeyInput = document.getElementById('licenseKey');
  const validateBtn = document.getElementById('validateBtn');
  const retryBtn = document.getElementById('retryBtn');
  const useYesBtn = document.getElementById('useYesBtn');
  const useNoBtn = document.getElementById('useNoBtn');
  const useSavedBtn = document.getElementById('useSavedBtn');
  const enterNewBtn = document.getElementById('enterNewBtn');
  const buyLicenseBtn = document.getElementById('buyLicenseBtn');
  const buyLicenseBtnInvalid = document.getElementById('buyLicenseBtnInvalid');
  const licenseForm = document.getElementById('license-form');
  const licenseInputForm = document.getElementById('license-input-form');
  const savedLicenseNotification = document.getElementById('saved-license-notification');
  const savedLicenseDisplay = document.getElementById('saved-license-display');
  const checkingResult = document.getElementById('checking-result');
  const validResult = document.getElementById('valid-result');
  const invalidResult = document.getElementById('invalid-result');
  const invalidMessage = document.getElementById('invalid-message');
  const expirationInfo = document.getElementById('expiration-info');
  const licenseKeyDisplay = document.getElementById('license-key-display');
  
  const checkUpdatesBtn = document.getElementById('checkUpdatesBtn');
  const viewChangelogBtn = document.getElementById('viewChangelogBtn');
  const updateInfo = document.getElementById('update-info');
  const updateIcon = document.getElementById('update-icon');
  const updateTitle = document.getElementById('update-title');
  const updateMessage = document.getElementById('update-message');
  const updateAction = document.getElementById('update-action');
  const downloadUpdateBtn = document.getElementById('downloadUpdateBtn');
  const changelogInfo = document.getElementById('changelog-info');
  const changelogContent = document.getElementById('changelog-content');
  
  let lastUpdateInfo = null;
  
  document.addEventListener('languageChanged', (event) => {
    _log(`Language changed: ${event.detail.language}`);
    
    if (updateInfo.style.display === 'block') {
      if (lastUpdateInfo) {
        displayUpdateResult(lastUpdateInfo);
      }
    }
    
    if (changelogInfo.style.display === 'block') {
      displayVersionHistory();
    }
    
    if (validResult.style.display === 'block' && lastLicenseResult) {
      displayValidLicense(lastLicenseResult);
    }
  });
  
  const savedLicense = await window.licenseAPI.getSavedLicense();
  if (savedLicense) {
    savedLicenseDisplay.textContent = maskLicenseKey(savedLicense);
    savedLicenseNotification.style.display = 'block';
    licenseInputForm.style.display = 'none';
    licenseKeyInput.value = savedLicense;
  }

  function maskLicenseKey(key) {
    if (!key || key.length <= 4) return key;
    return '•'.repeat(key.length - 4) + key.slice(-4);
  }

  function hideAllResults() {
    licenseForm.style.display = 'block';
    checkingResult.style.display = 'none';
    validResult.style.display = 'none';
    invalidResult.style.display = 'none';
    updateInfo.style.display = 'none';
  }
  
  function showLicenseInputForm() {
    savedLicenseNotification.style.display = 'none';
    licenseInputForm.style.display = 'block';
    licenseForm.style.display = 'block';
    validResult.style.display = 'none';
    invalidResult.style.display = 'none';
  }
  
  function formatDate(dateString) {
    const date = new Date(dateString);
    const dateOptions = { year: 'numeric', month: 'long', day: 'numeric' };
    const timeOptions = { hour: '2-digit', minute: '2-digit' };
    
    const languageSelect = document.getElementById('language-select');
    const currentLanguage = languageSelect ? languageSelect.value : 'en';
    
    return date.toLocaleDateString(currentLanguage, dateOptions) + ' ' + 
           getTranslation('datetime.at', 'at') + ' ' + 
           date.toLocaleTimeString(currentLanguage, timeOptions);
  }
  
  function displayValidLicense(result) {
    licenseForm.style.display = 'none';
    checkingResult.style.display = 'none';
    validResult.style.display = 'block';
    invalidResult.style.display = 'none';
    
    const expiration = new Date(result.expiration);
    const now = new Date();
    const daysUntilExpiration = Math.ceil((expiration - now) / (1000 * 60 * 60 * 24));
    
    let expirationHtml = '';
    
    if (result.activationDate) {
      const activationDate = formatDate(result.activationDate);
      expirationHtml += `<p><strong>${getTranslation('license.activatedOn', 'Activated on:')}</strong> ${activationDate}</p>`;
    }
    
    const formattedExpiration = formatDate(result.expiration);
    expirationHtml += `<p><strong>${getTranslation('license.expiresOn', 'Expires on:')}</strong> ${formattedExpiration}</p>`;
    
    expirationInfo.innerHTML = expirationHtml;
    
    if (daysUntilExpiration <= 7) {
      expirationInfo.innerHTML += `
        <p style="color: var(--warning-color); font-weight: bold;">
          ${getTranslation('license.expirationWarning', `Warning: Your license expires in ${daysUntilExpiration} days`)}
        </p>
      `;
      validResult.classList.add('warning');
    } else {
      validResult.classList.remove('warning');
    }
    
    updateInfo.style.display = 'none';
    
    setTimeout(() => {
      checkForUpdates();
    }, 500);
  }
  
  let lastLicenseResult = null;
  
  function displayInvalidLicense(message) {
    licenseForm.style.display = 'none';
    checkingResult.style.display = 'none';
    validResult.style.display = 'none';
    invalidResult.style.display = 'block';
    
    invalidMessage.textContent = message || 'Unable to validate your license.';
  }
  
  function getTranslation(key, params = {}) {
    const fallbackTranslations = {
      'updates.upToDate': 'Your application is up to date.',
      'updates.alreadyLatest': 'You are already using the latest version.',
      'updates.checking': 'Checking for updates...',
      'updates.available': 'Update available',
      'updates.newVersion': 'A new version ({0}) is available!',
      'updates.currentVersion': 'Your current version: {0}',
      'updates.releaseNotes': 'Release notes:',
      'updates.noReleaseNotes': 'No release notes available.',
      'updates.connectionError': 'Connection Error',
      'updates.unableToCheck': 'Unable to check for updates',
      'updates.retrievalError': 'Retrieval Error',
      'updates.unableToRetrieveHistory': 'Unable to retrieve version history',
      'updates.error': 'Error',
      'updates.unexpectedError': 'An unexpected error occurred',
      'updates.noHistory': 'No version history available.',
      'updates.historyEnd': 'End of version history'
    };
    
    const translationsDiv = document.getElementById('translations-data');
    if (!translationsDiv) {
      console.warn(`[i18n] Translations element not found for key: ${key}`);
      if (fallbackTranslations[key]) {
        let result = fallbackTranslations[key];
        if (params) {
          result = result.replace(/\{(\d+)\}/g, (match, number) => {
            return params[number] !== undefined ? params[number] : match;
          });
        }
        return result;
      }
      return key;
    }
    
    try {
      const translations = JSON.parse(translationsDiv.textContent);
      
      const parts = key.split('.');
      let result = translations;
      
      for (const part of parts) {
        if (result && result[part] !== undefined) {
          result = result[part];
        } else {
          console.warn(`[i18n] Translation key not found: ${key}`);
          if (fallbackTranslations[key]) {
            let fallbackResult = fallbackTranslations[key];
            if (params) {
              fallbackResult = fallbackResult.replace(/\{(\d+)\}/g, (match, number) => {
                return params[number] !== undefined ? params[number] : match;
              });
            }
            return fallbackResult;
          }
          return key;
        }
      }
      
      if (typeof result !== 'string') {
        console.warn(`[i18n] Translation key ${key} is not a string: ${typeof result}`);
        if (fallbackTranslations[key]) {
          let fallbackResult = fallbackTranslations[key];
          if (params) {
            fallbackResult = fallbackResult.replace(/\{(\d+)\}/g, (match, number) => {
              return params[number] !== undefined ? params[number] : match;
            });
          }
          return fallbackResult;
        }
        return key;
      }
      
      if (params) {
        return result.replace(/\{(\d+)\}/g, (match, number) => {
          return params[number] !== undefined ? params[number] : match;
        });
      }
      
      return result;
    } catch (error) {
      console.error(`[i18n] Error translating key ${key}:`, error);
      if (fallbackTranslations[key]) {
        let fallbackResult = fallbackTranslations[key];
        if (params) {
          fallbackResult = fallbackResult.replace(/\{(\d+)\}/g, (match, number) => {
            return params[number] !== undefined ? params[number] : match;
          });
        }
        return fallbackResult;
      }
      return key;
    }
  }
  
  async function checkForUpdates() {
    try {
      changelogInfo.style.display = 'none';
      
      updateInfo.style.display = 'block';
      updateInfo.classList.remove('update-available');
      updateIcon.textContent = '🔄';
      updateTitle.textContent = getTranslation('updates.checking');
      updateMessage.textContent = getTranslation('updates.checking');
      updateAction.style.display = 'none';
      
      const updateResult = await window.licenseAPI.checkForUpdates();
      
      displayUpdateResult(updateResult);
    } catch (error) {
      _logError('Error checking for updates:', error);
      displayUpdateError(error);
    }
  }
  
  function displayUpdateResult(updateData) {
    lastUpdateInfo = updateData;
    
    updateInfo.style.display = 'block';
    
    const currentVersion = updateData.currentVersion || getTranslation('updates.currentVersion', {0: 'N/A'});
    
    if (updateData.hasUpdate) {
      updateInfo.classList.add('update-available');
      updateIcon.textContent = '⚠️';
      updateTitle.textContent = getTranslation('updates.available');
      updateMessage.innerHTML = `
        ${getTranslation('updates.currentVersion', {0: currentVersion})}<br>
        ${getTranslation('updates.newVersion', {0: updateData.version || 'N/A'})}<br>
        ${updateData.changelog ? `<strong>${getTranslation('updates.releaseNotes')}</strong> ${updateData.changelog}` : getTranslation('updates.noReleaseNotes')}
      `;
      
      updateAction.style.display = 'block';
      
      downloadUpdateBtn.onclick = function() {
        window.licenseAPI.downloadUpdate(updateData);
      };
    } else {
      updateInfo.classList.remove('update-available');
      updateIcon.textContent = '✓';
      updateTitle.textContent = getTranslation('updates.upToDate');
      updateMessage.textContent = getTranslation('updates.alreadyLatest');
      updateAction.style.display = 'none';
    }
  }
  
  function displayUpdateError(error) {
    updateInfo.style.display = 'block';
    updateInfo.classList.remove('update-available');
    updateIcon.textContent = '⚠️';
    updateTitle.textContent = getTranslation('updates.connectionError');
    updateMessage.textContent = error.message || getTranslation('updates.unableToCheck');
    updateAction.style.display = 'none';
  }
  
  async function displayVersionHistory() {
    try {
      updateInfo.style.display = 'none';
      
      changelogInfo.style.display = 'block';
      changelogContent.innerHTML = `<div class="spinner" style="margin: 20px auto;"></div><p>${getTranslation('updates.checking')}</p>`;
      
      const historyResult = await window.licenseAPI.getVersionHistory();
      
      if (historyResult.success) {
        const currentVersion = historyResult.currentVersion || getTranslation('updates.currentVersion', {0: 'N/A'});
        let htmlContent = '';
        
        if (historyResult.versions && historyResult.versions.length > 0) {
          htmlContent += `<div class="current-version">
            <p><strong>${getTranslation('updates.currentVersion', {0: ''})}</strong> ${currentVersion}</p>
          </div>`;
          
          historyResult.versions.forEach((version, index) => {
            const isCurrentVersion = version.version === currentVersion;
            
            htmlContent += `
              <div class="version-item ${isCurrentVersion ? 'current' : ''}" style="margin-top: 20px; padding: 15px; background-color: rgba(0, 0, 0, 0.2); border-radius: 5px; border-left: 3px solid ${isCurrentVersion ? 'var(--success-color)' : 'var(--primary-color)'}">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                  <h3 style="margin: 0; ${isCurrentVersion ? 'color: var(--success-color)' : ''}">Version ${version.version}</h3>
                  <span style="font-size: 0.9em; opacity: 0.8;">${version.releaseDate ? formatDate(version.releaseDate) : ''}</span>
                </div>
                ${version.changelog ? `<div class="changelog" style="white-space: pre-wrap;">${version.changelog}</div>` : `<p style="font-style: italic; opacity: 0.6;">${getTranslation('updates.noReleaseNotes')}</p>`}
              </div>
            `;
          });
          
          htmlContent += `
            <div style="margin-top: 20px; padding: 15px; opacity: 0.7; background-color: rgba(0, 0, 0, 0.2); border-radius: 5px;">
              <h3>${getTranslation('app.title')}</h3>
              <p style="margin-top: 10px;">${getTranslation('updates.autoUpdateInfo', 'This application is regularly updated to improve your experience.')}</p>
              <p>${getTranslation('updates.updateInclude', 'Updates may include:')}</p>
              <ul style="margin-left: 20px; margin-top: 10px;">
                <li>${getTranslation('updates.newFeatures', 'New features')}</li>
                <li>${getTranslation('updates.bugFixes', 'Bug fixes')}</li>
                <li>${getTranslation('updates.performance', 'Performance improvements')}</li>
                <li>${getTranslation('updates.security', 'Security updates')}</li>
              </ul>
              <p style="margin-top: 15px;">${getTranslation('updates.recommendation', 'We recommend always using the latest version available.')}</p>
            </div>
            
            <div style="height: 300px; padding-top: 30px; text-align: center; color: rgba(255,255,255,0.4);">
              <p>— ${getTranslation('updates.historyEnd', 'End of version history')} —</p>
            </div>
          `;
        } else {
          htmlContent = `<p>${getTranslation('updates.noHistory', 'No version history available.')}</p>`;
        }
        
        changelogContent.innerHTML = htmlContent;
        
        setTimeout(() => {
          changelogContent.style.display = 'none';
          changelogContent.offsetHeight;
          changelogContent.style.display = 'block';
          
          setupScrollControls();
        }, 50);
      } else {
        changelogContent.innerHTML = `
          <div style="text-align: center; padding: 20px;">
            <span style="font-size: 30px; color: var(--danger-color);">⚠️</span>
            <p style="margin-top: 10px; font-weight: bold;">${getTranslation('updates.retrievalError', 'Retrieval Error')}</p>
            <p>${historyResult.message || getTranslation('updates.unableToRetrieveHistory', 'Unable to retrieve version history')}</p>
          </div>
        `;
      }
    } catch (error) {
      _logError('Error displaying version history:', error);
      changelogContent.innerHTML = `
        <div style="text-align: center; padding: 20px;">
          <span style="font-size: 30px; color: var(--danger-color);">⚠️</span>
          <p style="margin-top: 10px; font-weight: bold;">${getTranslation('updates.error', 'Error')}</p>
          <p>${error.message || getTranslation('updates.unexpectedError', 'An unexpected error occurred')}</p>
        </div>
      `;
    }
  }
  
  function setupScrollControls() {
    changelogContent.addEventListener('wheel', (e) => {
      e.preventDefault();
      const delta = e.deltaY || e.detail || e.wheelDelta;
      changelogContent.scrollTop += delta > 0 ? 60 : -60;
    }, { passive: false });
    
    changelogContent.tabIndex = 0;
    changelogContent.style.outline = 'none';
    
    changelogContent.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        changelogContent.scrollTop -= 60;
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        changelogContent.scrollTop += 60;
      }
    });
    
    changelogContent.focus();
  }
  
  async function validateLicenseKey(licenseKey) {
    if (!licenseKey) return;
    
    licenseForm.style.display = 'none';
    checkingResult.style.display = 'block';
    validResult.style.display = 'none';
    invalidResult.style.display = 'none';
    
    try {
      await window.licenseAPI.validateLicense(licenseKey);
    } catch (error) {
      _logError('Error during validation:', error);
      displayInvalidLicense('An unexpected error occurred.');
    }
  }
  
  checkUpdatesBtn.addEventListener('click', checkForUpdates);
  
  viewChangelogBtn.addEventListener('click', () => {
    if (changelogInfo.style.display === 'block') {
      changelogInfo.style.display = 'none';
      return;
    }
    
    updateInfo.style.display = 'none';
    
    displayVersionHistory();
  });
  
  useSavedBtn.addEventListener('click', () => {
    validateLicenseKey(savedLicense);
  });
  
  enterNewBtn.addEventListener('click', () => {
    showLicenseInputForm();
  });
  
  useYesBtn.addEventListener('click', () => {
    _log("Yes button clicked - Signal sent to main process");
    window.licenseAPI.signalLicenseValidated();
  });
  
  useNoBtn.addEventListener('click', () => {
    licenseKeyInput.value = '';
    showLicenseInputForm();
  });
  
  window.licenseAPI.onLicenseChecking(() => {
    licenseForm.style.display = 'none';
    checkingResult.style.display = 'block';
    validResult.style.display = 'none';
    invalidResult.style.display = 'none';
  });
  
  window.licenseAPI.onLicenseResult((result) => {
    if (result.valid) {
      const savedLicense = licenseKeyInput.value.trim();
      licenseKeyDisplay.textContent = maskLicenseKey(savedLicense);
      lastLicenseResult = result;
      displayValidLicense(result);
    } else {
      displayInvalidLicense(result.message);
    }
  });
  
  window.licenseAPI.onLicenseError((errorMessage) => {
    displayInvalidLicense(errorMessage);
  });
  
  window.licenseAPI.onUpdateCheckResult((result) => {
    lastUpdateInfo = result;
  });
  
  window.licenseAPI.onUpdateCheckError((error) => {
    _logError('Error checking for updates:', error);
  });
  
  validateBtn.addEventListener('click', async () => {
    const licenseKey = licenseKeyInput.value.trim();
    
    if (!licenseKey) {
      invalidMessage.textContent = 'Please enter a license key.';
      invalidResult.style.display = 'block';
      return;
    }
    
    validateLicenseKey(licenseKey);
  });
  
  retryBtn.addEventListener('click', () => {
    hideAllResults();
    if (savedLicense) {
      savedLicenseDisplay.textContent = maskLicenseKey(savedLicense);
      savedLicenseNotification.style.display = 'block';
      licenseInputForm.style.display = 'none';
    } else {
      licenseInputForm.style.display = 'block';
    }
  });
  
  licenseKeyInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      validateBtn.click();
    }
  });
  
  buyLicenseBtn.addEventListener('click', () => {
    _log("Redirecting to license purchase page");
    window.licenseAPI.openExternalLink('https://6truc.mysellauth.com/');
  });
  
  buyLicenseBtnInvalid.addEventListener('click', () => {
    _log("Redirecting to license purchase page from invalid screen");
    window.licenseAPI.openExternalLink('https://6truc.mysellauth.com/');
  });
});