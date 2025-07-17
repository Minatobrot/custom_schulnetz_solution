// Notenrechner Plugin – (c) 2025 Minoshek Kishokumar (M.K) Kontakt bei minoshekk@gmail.com
document.addEventListener("DOMContentLoaded", function() {
  const storage = chrome.storage.local;

  // Button Settings Configuration
  const buttonSettings = {
    pluspoints: {
      id: 'switch-pluspoints',
      storageKey: 'buttonEnabled_pluspoints',
      buttonId: 'pluspoints-overlay-btn',
      default: true
    },
    calculator: {
      id: 'switch-calculator',
      storageKey: 'buttonEnabled_calculator',
      buttonId: 'notenrechner-calc-btn',
      default: true
    },
    custom: {
      id: 'switch-custom',
      storageKey: 'buttonEnabled_custom',
      buttonId: 'notenrechner-custom-btn',
      default: true
    },
    game: {
      id: 'switch-game',
      storageKey: 'buttonEnabled_game',
      buttonId: 'game-overlay-btn',
      default: false
    },
    improvement: {
      id: 'switch-improvement',
      storageKey: 'buttonEnabled_improvement',
      buttonId: 'improvement-overlay-btn',
      default: true
    },
    achievements: {
      id: 'switch-achievements',
      storageKey: 'buttonEnabled_achievements',
      buttonId: 'gamification-overlay-btn',
      default: true
    }
  };

  // Lade gespeicherte Einstellungen
  function loadSettings() {
    const keys = Object.values(buttonSettings).map(setting => setting.storageKey);
    
    storage.get(keys, (result) => {
      Object.entries(buttonSettings).forEach(([key, setting]) => {
        const switchElement = document.getElementById(setting.id);
        const isEnabled = result[setting.storageKey] !== undefined ? result[setting.storageKey] : setting.default;
        
        if (switchElement) {
          switchElement.checked = isEnabled;
          updateButtonVisibility(setting, isEnabled);
        }
      });
    });
  }

  // Speichere Einstellung und aktualisiere Button-Sichtbarkeit
  function saveSettingAndUpdateButton(setting, isEnabled) {
    // Speichere in Chrome Storage
    storage.set({ [setting.storageKey]: isEnabled });
    
    // Sende Nachricht an Content Script um Button zu aktualisieren
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleButton',
          buttonId: setting.buttonId,
          enabled: isEnabled
        }).catch((error) => {
          // Ignoriere Fehler falls Content Script nicht geladen ist
          console.warn('Could not communicate with content script:', error);
        });
      }
    });
  }

  // Aktualisiere Button-Sichtbarkeit im Content Script
  function updateButtonVisibility(setting, isEnabled) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: 'toggleButton',
          buttonId: setting.buttonId,
          enabled: isEnabled
        }).catch((error) => {
          // Ignoriere Fehler falls Content Script nicht geladen ist
          console.warn('Could not communicate with content script:', error);
        });
      }
    });
  }

  // Event Listener für alle Switches
  Object.entries(buttonSettings).forEach(([key, setting]) => {
    const switchElement = document.getElementById(setting.id);
    
    if (switchElement) {
      switchElement.addEventListener('change', function() {
        const isEnabled = this.checked;
        saveSettingAndUpdateButton(setting, isEnabled);
        
        // Visuelles Feedback
        const buttonSetting = this.closest('.button-setting');
        if (buttonSetting) {
          buttonSetting.style.opacity = isEnabled ? '1' : '0.6';
          buttonSetting.style.transform = isEnabled ? 'scale(1)' : 'scale(0.98)';
        }
      });
    }
  });

  // Lade Einstellungen beim Start
  loadSettings();

  // Sende Ping an Content Script um zu prüfen ob es geladen ist
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'ping' }).then((response) => {
        if (response && response.loaded) {
          console.log('Content Script loaded successfully');
        }
      }).catch((error) => {
        // Content Script nicht geladen - zeige Info
        console.warn('Content Script not loaded on current page:', error);
      });
    }
  });
});