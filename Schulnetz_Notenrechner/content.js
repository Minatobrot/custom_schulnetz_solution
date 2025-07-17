// Notenrechner Plugin – (c) 2025 Minoshek Kishokumar (M.K)  @Minatobrot on GitHub  @brotinant on Discord
 
(function () {
  // Polyfill für browser-kompatibilität (Edge, Opera, Chromium, Firefox)
  const storage = (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local)
    ? chrome.storage.local
    : (typeof browser !== "undefined" && browser.storage && browser.storage.local)
      ? browser.storage.local
      : null;

  // Cross-browser runtime API
  const runtimeAPI = (typeof chrome !== "undefined" && chrome.runtime) 
    ? chrome.runtime 
    : (typeof browser !== "undefined" && browser.runtime) 
      ? browser.runtime 
      : null;

  // === SIMPLIFIED BUTTON MANAGEMENT SYSTEM ===
  const buttonManager = {
    buttons: new Map(), // Store all button references and their data
    
    // Register a button with the global system
    registerButton(buttonId, element, config) {
      this.buttons.set(buttonId, {
        element: element,
        config: config
      });
    },
    
    // Mark a button as opening (for visual effects)
    markButtonOpening(buttonId) {
      // Simple visual feedback only
    },
    
    // Find a free position for panels that avoids buttons
    findFreePanelPosition(panelWidth, panelHeight, preferredLeft, preferredTop) {
      // Ensure panel stays within screen bounds
      let bestLeft = Math.max(20, Math.min(preferredLeft, window.innerWidth - panelWidth - 20));
      let bestTop = Math.max(20, Math.min(preferredTop, window.innerHeight - panelHeight - 20));
      
      return { left: bestLeft, top: bestTop };
    }
  };

  // Missing variables
  let buttonInstancesMK = {};

  // Fallback function for when extension loading fails
  function createFallbackButtons() {
    console.log('🔧 Creating fallback buttons...');
    
    // Simple button creation without external dependencies
    const buttonsMK = [
      { id: 'pluspoints-overlay-btn', title: '+Punkte', color: '#388e3c', icon: '➕', position: { rightOffset: 20, bottomOffset: 140 } },
      { id: 'notenrechner-calc-btn', title: 'Notenrechner', color: '#1976d2', icon: '🧮', position: { rightOffset: 80, bottomOffset: 20 } },
      { id: 'notenrechner-custom-btn', title: 'Eigene Noten', color: '#b36a00', icon: '✏️', position: { rightOffset: 140, bottomOffset: 20 } },
      { id: 'improvement-overlay-btn', title: 'Chancen & Risiken', color: '#ff5722', icon: '📈', position: { rightOffset: 20, bottomOffset: 80 } },
      { id: 'gamification-overlay-btn', title: 'Achievements', color: '#ffb300', icon: '🏆', position: { rightOffset: 20, bottomOffset: 20 } }
    ];
    
    buttonsMK.forEach((btnConfig) => {
      if (document.getElementById(btnConfig.id)) return; // Skip if already exists
      
      const buttonMK = document.createElement('button');
      buttonMK.id = btnConfig.id;
      buttonMK.title = btnConfig.title;
      
      // Fixed positioning
      const winWMK = window.innerWidth;
      const winHMK = window.innerHeight;
      const leftMK = winWMK - 50 - btnConfig.position.rightOffset;
      const topMK = winHMK - 50 - btnConfig.position.bottomOffset;
      
      buttonMK.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: ${btnConfig.color};
        border: 2px solid ${btnConfig.color};
        border-radius: 10px;
        cursor: pointer;
        z-index: 10000;
        font-size: 18px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        display: flex;
        align-items: center;
        justify-content: center;
        left: ${leftMK}px;
        top: ${topMK}px;
        transition: all 0.3s ease;
      `;
      
      buttonMK.textContent = btnConfig.icon;
      
      // Simple click handler that shows a message
      buttonMK.addEventListener('click', () => {
        const existingMsgMK = document.getElementById('fallback-message');
        if (existingMsgMK) existingMsgMK.remove();
        
        const messageMK = document.createElement('div');
        messageMK.id = 'fallback-message';
        messageMK.style.cssText = `
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          z-index: 20000;
          text-align: center;
          border: 2px solid ${btnConfig.color};
        `;
        
        messageMK.innerHTML = `
          <div style="font-size: 18px; margin-bottom: 10px;">${btnConfig.icon}</div>
          <div style="font-weight: bold; margin-bottom: 10px;">${btnConfig.title}</div>
          <div style="color: #666; margin-bottom: 15px;">Button im Fallback-Modus</div>
          <button onclick="this.parentElement.remove()" style="padding: 8px 16px; background: ${btnConfig.color}; color: white; border: none; border-radius: 4px; cursor: pointer;">OK</button>
        `;
        
        document.body.appendChild(messageMK);
        
        // Auto-remove after 3 seconds
        setTimeout(() => {
          if (messageMK.parentElement) messageMK.remove();
        }, 3000);
      });
      
      document.body.appendChild(buttonMK);
    });
    
    console.log('✅ Fallback buttons created');
  }

  // Fehleranzeige deaktiviert
  function showError(msg) {
    // Fehler werden nicht mehr angezeigt
  }

  function findDetailRows() {
    return Array.from(document.querySelectorAll('tr')).filter(trMK =>
      Array.from(trMK.classList).some(cls => cls.endsWith("_detailrow"))
      && trMK.querySelector("table.clean")
    );
  }

  // Erweiterte Fachkategorien für kategoriebasierte Achievements
  const subjectsByCategory = {
    naturwissenschaften: [
      "Biologie", "Bio",
      "Chemie", "Chem", 
      "Physik", "Phys",
      "Mathematik", "Mathe", "Math",
      "Informatik", "Info", "Computer",
      "Geowissenschaften", "Geo",
      "Astronomie",
      "Umweltwissenschaften",
      "Technik", "Technisches Zeichnen"
    ],
    sprache: [
      "Deutsch", "DE",
      "Englisch", "EN", "English",
      "Französisch", "FR", "Francais", 
      "Spanisch", "ES", "Español",
      "Latein", "LA", "Latin",
      "Italienisch", "IT", "Italiano",
      "Griechisch", "GR",
      "Chinesisch", "CN",
      "Russisch", "RU",
      "Englisch Konversation", "English Conversation"
    ],
    gesellschaft: [
      "Geografie", "Geographie", "GG", "Geo",
      "Geschichte", "Hist", "History",
      "Wirtschaft und Recht", "WuR", "Wirtschaft", "Recht",
      "Politik", "Pol",
      "Sozialkunde", "Sozi",
      "Religion", "Rel", "Reli",
      "Ethik", "Philosophie", "Phil"
    ],
    kunst: [
      "Bildnerisches Gestalten", "BG", "Kunst", "Art",
      "Musik", "Mus", "Music",
      "Theater", "Drama",
      "Tanz", "Dance",
      "Chor", "Choir",
      "Fotografie", "Photo",
      "Design", "Gestaltung"
    ],
    sport: [
      "Sport", "SP", "Sports",
      "Schulsport",
      "Leichtathletik",
      "Turnen", "Gymnastik",
      "Schwimmen", "Swimming"
    ],
    wahlfaecher: [
      "Projektarbeit", "Projekt",
      "Ergänzungsfach", "EF",
      "Schach", "Chess",
      "Debattieren", "Debate",
      "Robotik", "Robotics",
      "Psychologie", "Psych"
    ]
  };

  // Hilfsfunktion: Kategorie eines Fachs bestimmen
  function getFachKategorie(fachName) {
    for (const [kategorie, faecher] of Object.entries(subjectsByCategory)) {
      for (const fach of faecher) {
        if (fachName.toLowerCase().includes(fach.toLowerCase())) {
          return kategorie;
        }
      }
    }
    return 'sonstige';
  }

  function extractNotenFromTable(tr) {
    let prevMK = tr.previousElementSibling;
    let fachMK = "Unbekannt";
    let fachCodeMK = "";
    let fachLangNameMK = "";
    
    if (prevMK) {
      let bMK = prevMK.querySelector("b");
      if (bMK) {
        // Extrahiere sowohl Fachcode als auch Fachname
        const fullTextMK = bMK.textContent.trim();
        const linesMK = fullTextMK.split("\n");
        if (linesMK.length >= 2) {
          fachCodeMK = linesMK[0].trim(); // z.B. "BG-M1a-CrN"
          fachLangNameMK = linesMK[1].trim(); // z.B. "Bildnerisches Gestalten"
          fachMK = `${fachCodeMK} - ${fachLangNameMK}`; // Kombinierter Name
        } else {
          fachMK = linesMK[0].trim();
          fachCodeMK = fachMK;
          fachLangNameMK = fachMK;
        }
      }
    }

    let notenMK = [], gewichtungenMK = [], datenMK = [], themenMK = [];
    let tabelleMK = tr.querySelector("table.clean");
    if (!tabelleMK) return null;

    let rowsMK = Array.from(tabelleMK.querySelectorAll("tbody > tr"));
    let foundMK = false;
    for (const rowMK of rowsMK) {
      let tdsMK = rowMK.querySelectorAll("td");
      if (tdsMK.length >= 4) {
        // Extract date from first column
        const dateCellMK = tdsMK[0];
        const dateTextMK = dateCellMK ? dateCellMK.textContent.trim() : '';
        
        // Extract theme from second column
        const themaCellMK = tdsMK[1];
        const themaMK = themaCellMK ? themaCellMK.textContent.trim() : '';
        
        // Skip summary rows
        if (themaMK.toLowerCase().includes('aktueller durchschnitt') || 
            themaMK.toLowerCase().includes('durchschnitt') ||
            dateTextMK.toLowerCase().includes('aktueller')) {
          continue;
        }
        
        let noteTxtMK = tdsMK[2].textContent.trim().replace(",", ".").replace("*","");
        let gewTxtMK = tdsMK[3].textContent.trim().replace(",", ".");
        let noteMK = parseFloat(noteTxtMK);
        let gewMK = parseFloat(gewTxtMK);
        if (!isNaN(noteMK) && !isNaN(gewMK)) {
          notenMK.push(noteMK);
          gewichtungenMK.push(gewMK);
          datenMK.push(dateTextMK); // Store the date
          themenMK.push(themaMK);
          foundMK = true;
        }
      }
    }
    if (!foundMK) return null;
    let durchschnittMK = berechneDurchschnitt(notenMK, gewichtungenMK);
    
    // Bestimme die Kategorie des Fachs
    const kategorieMK = getFachKategorie(fachLangNameMK);
    
    return { 
      fach: fachMK, 
      fachCode: fachCodeMK, 
      fachLangName: fachLangNameMK, 
      kategorie: kategorieMK, 
      noten: notenMK, 
      gewichtungen: gewichtungenMK, 
      daten: datenMK, // Include dates in return object
      durchschnitt: durchschnittMK 
    };
  }

  function berechneDurchschnitt(noten, gew) {
    let summeWMK = gew.reduce((a, b) => a + b, 0);
    let summeMK = noten.reduce((a, n, i) => a + n * gew[i], 0);
    return summeWMK > 0 ? +(summeMK / summeWMK).toFixed(2) : 0;
  }

  // Funktion zum Zurücksetzen aller gespeicherten Daten
  function resetAllData() {
    
    // Liste aller zu löschenden localStorage-Keys
    const localStorageKeys = [
      'pluspointsBtnPos',
      'notenrechnerCalcBtnPos', 
      'notenrechnerCustomBtnPos',
      'improvementBtnPos',
      'gamificationBtnPos',
      'pluspointsHiddenFaecher',
      'achievementsShown',
      'buttonEnabled_pluspoints',
      'buttonEnabled_calculator',
      'buttonEnabled_custom',
      'buttonEnabled_improvement',
      'buttonEnabled_achievements',
      'notenDaten'
    ];
    
    // Alle localStorage-Einträge löschen
    localStorageKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    // Chrome Storage löschen (falls verfügbar)
    if (storage && storage.clear) {
      storage.clear(() => {
        // Storage cleared
      });
    } else if (storage && storage.remove) {
      storage.remove(['notenDaten'], () => {
        // Storage cleared
      });
    }
    
    // Success-Nachricht anzeigen
    let resetMsg = document.getElementById("notenResetMsg");
    if (resetMsg) resetMsg.remove();
    let div = document.createElement("div");
    div.id = "notenResetMsg";
    div.style.cssText = "background:#ffecb3;color:#e65100;z-index:99999;position:fixed;top:0;left:0;right:0;padding:10px;font-weight:bold;text-align:center;border-bottom:2px solid #ff9800;";
    div.textContent = "🔄 Alle Daten wurden zurückgesetzt (keine Noten gefunden)";
    document.body.appendChild(div);
    setTimeout(() => { div.remove(); }, 5000);
  }

  function scanAndSaveAll() {
    let datenMK = [];
    let rowsMK = findDetailRows();
    if (rowsMK.length === 0) {
      // Keine Fehleranzeige!
      return;
    }
    for (let trMK of rowsMK) {
      let infoMK = extractNotenFromTable(trMK);
      if (infoMK) datenMK.push(infoMK);
    }
    if (datenMK.length === 0) {
      // Prüfe ob vorher Daten vorhanden waren
      const checkPreviousData = () => {
        // Check extension context before using storage
        try {
          if (chrome.runtime?.id && storage && storage.get) {
            storage.get(['notenDaten'], (result) => {
              const hadData = result.notenDaten && result.notenDaten.length > 0;
              if (hadData) {
                resetAllData();
              }
            });
          } else {
            // Fallback: localStorage prüfen
            try {
              const savedDataMK = JSON.parse(localStorage.getItem('notenDaten') || '[]');
              if (savedDataMK.length > 0) {
                resetAllData();
              }
            } catch (e) {
              // Could not parse localStorage
            }
          }
        } catch (error) {
          console.warn('Extension context invalid in checkPreviousData:', error);
          // Fallback: localStorage prüfen
          try {
            const savedDataMK = JSON.parse(localStorage.getItem('notenDaten') || '[]');
            if (savedDataMK.length > 0) {
              resetAllData();
            }
          } catch (e) {
            // Could not parse localStorage
          }
        }
      };
      checkPreviousData();
    } else {
      // Check extension context before using storage
      try {
        if (chrome.runtime?.id && storage && storage.set) {
          storage.set({ notenDaten: datenMK }, () => {
            if (runtimeAPI && runtimeAPI.lastError) {
              // Keine Fehleranzeige!
            } else {
              let okMK = document.getElementById("notenExtractorOkMsg");
              if (okMK) okMK.remove();
              let divMK = document.createElement("div");
              divMK.id = "notenExtractorOkMsg";
              divMK.style.cssText = "background:#cfc;color:#060;z-index:99999;position:fixed;top:0;left:0;right:0;padding:10px;font-weight:bold;text-align:center;";
              divMK.textContent = `Noten für ${datenMK.length} Fächer extrahiert!`;
              document.body.appendChild(divMK);
              setTimeout(() => { divMK.remove(); }, 4000);
            }
          });
        } else {
          throw new Error('Extension storage not available');
        }
      } catch (error) {
        console.warn('Extension context invalid in scanAndSaveAll, using localStorage:', error);
        // Fallback: Use localStorage
        try {
          localStorage.setItem('notenDaten', JSON.stringify(datenMK));
          let okMK = document.getElementById("notenExtractorOkMsg");
          if (okMK) okMK.remove();
          let divMK = document.createElement("div");
          divMK.id = "notenExtractorOkMsg";
          divMK.style.cssText = "background:#cfc;color:#060;z-index:99999;position:fixed;top:0;left:0;right:0;padding:10px;font-weight:bold;text-align:center;";
          divMK.textContent = `Noten für ${datenMK.length} Fächer extrahiert!`;
          document.body.appendChild(divMK);
          setTimeout(() => { divMK.remove(); }, 4000);
        } catch (storageError) {
          console.error('Failed to save data to localStorage:', storageError);
        }
      }
    }
  }

  // Watch for AJAX changes
  let lastCountMK = 0;
  function watchForChanges() {
    try {
      const targetMK = document.body;
      if (!targetMK) return;
      const observerMK = new MutationObserver(() => {
        let rowsMK = findDetailRows();
        if (rowsMK.length !== lastCountMK) {
          lastCountMK = rowsMK.length;
          scanAndSaveAll();
        }
      });
      observerMK.observe(targetMK, { childList: true, subtree: true });
      scanAndSaveAll();
    } catch (error) {
      console.error('Error in watchForChanges:', error);
    }
  }

  // Simplified button loading since scripts are pre-loaded via manifest
  function loadButtonComponents() {
    return new Promise((resolve) => {
      console.log('🔄 Initializing pre-loaded button components...');
      
      // Check if extension context is valid
      try {
        if (!chrome.runtime?.id) {
          console.warn('Extension context invalid, creating fallback buttons');
          createFallbackButtons();
          resolve();
          return;
        }
      } catch (error) {
        console.warn('Extension context check failed:', error);
        createFallbackButtons();
        resolve();
        return;
      }

      // Since scripts are loaded via manifest, classes should be immediately available
      const expectedClassesMK = ['PluspointsButton', 'CalculatorButton', 'CustomButton', 'ImprovementButton', 'GamificationButton'];
      const missingClassesMK = expectedClassesMK.filter(className => !window[className]);
      
      if (missingClassesMK.length > 0) {
        console.warn('❌ Missing button classes:', missingClassesMK);
        createFallbackButtons();
        resolve();
        return;
      }
      
      console.log('✅ All button classes available, initializing...');
      initializeButtonsDirectly();
      resolve();
    });
  }

  // Initialize buttons directly without delays
  function initializeButtonsDirectly() {
    console.log('🔧 Initializing buttons directly...');
    
    // Reset button instances
    buttonInstancesMK = {};
    
    // Create button instances immediately
    const constructorArgsMK = [buttonManager];
    
    try {
      if (window.PluspointsButton) {
        buttonInstancesMK.pluspoints = new window.PluspointsButton(...constructorArgsMK);
        buttonInstancesMK.pluspoints.create();
        console.log('✓ PluspointsButton created');
      } else {
        console.warn('⚠ PluspointsButton class not available');
      }
    } catch (e) {
      console.error('✗ Failed to create PluspointsButton:', e);
    }
    
    try {
      if (window.CalculatorButton) {
        buttonInstancesMK.calculator = new window.CalculatorButton(...constructorArgsMK);
        buttonInstancesMK.calculator.create();
        console.log('✓ CalculatorButton created');
      } else {
        console.warn('⚠ CalculatorButton class not available');
      }
    } catch (e) {
      console.error('✗ Failed to create CalculatorButton:', e);
    }
    
    try {
      if (window.CustomButton) {
        buttonInstancesMK.custom = new window.CustomButton(...constructorArgsMK);
        buttonInstancesMK.custom.create();
        console.log('✓ CustomButton created');
      } else {
        console.warn('⚠ CustomButton class not available');
      }
    } catch (e) {
      console.error('✗ Failed to create CustomButton:', e);
    }
    
    try {
      if (window.ImprovementButton) {
        buttonInstancesMK.improvement = new window.ImprovementButton(...constructorArgsMK);
        buttonInstancesMK.improvement.create();
        console.log('✓ ImprovementButton created');
      } else {
        console.warn('⚠ ImprovementButton class not available');
      }
    } catch (e) {
      console.error('✗ Failed to create ImprovementButton:', e);
    }
    
    try {
      if (window.GamificationButton) {
        buttonInstancesMK.gamification = new window.GamificationButton(...constructorArgsMK);
        buttonInstancesMK.gamification.create();
        console.log('✓ GamificationButton created');
      } else {
        console.warn('⚠ GamificationButton class not available');
      }
    } catch (e) {
      console.error('✗ Failed to create GamificationButton:', e);
    }
    
    try {
      if (window.GameButton) {
        buttonInstancesMK.game = new window.GameButton(...constructorArgsMK);
        buttonInstancesMK.game.create();
        console.log('✓ GameButton created');
      } else {
        console.warn('⚠ GameButton class not available');
      }
    } catch (e) {
      console.error('✗ Failed to create GameButton:', e);
    }
    
    console.log('✅ Button initialization complete');
    
    // Load button settings immediately after creation
    setTimeout(() => {
      try {
        console.log('⚙️ Loading button settings...');
        loadButtonSettings();
      } catch (error) {
        console.warn('Failed to load button settings:', error);
      }
    }, 1000);
  }

  // Message listener for popup communication - Fixed for cross-browser compatibility
  if (runtimeAPI && runtimeAPI.onMessage) {
    runtimeAPI.onMessage.addListener((message, sender, sendResponse) => {
      try {
        if (message.action === 'toggleButton') {
          const buttonMK = document.getElementById(message.buttonId);
          if (buttonMK) {
            if (message.enabled) {
              buttonMK.style.display = 'flex';
            } else {
              buttonMK.style.display = 'none';
              // Also close any open panels for this button
              const panelIdMK = message.buttonId.replace('-btn', '-panel');
              const panelMK = document.getElementById(panelIdMK);
              if (panelMK) {
                panelMK.style.display = 'none';
              }
            }
          }
          sendResponse({ success: true });
        } else if (message.action === 'ping') {
          sendResponse({ success: true, loaded: true });
        }
      } catch (error) {
        console.error('Error handling message:', error);
        sendResponse({ success: false, error: error.message });
      }
      return true; // Keep message channel open for async response
    });
  }

  // Load button visibility settings on page load - Improved with fallbacks
  function loadButtonSettings() {
    // Check extension context first
    try {
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalid, skipping button settings');
        return;
      }
    } catch (error) {
      console.warn('Extension context check failed in loadButtonSettings:', error);
      return;
    }

    const buttonSettingsMK = {
      'pluspoints-overlay-btn': 'buttonEnabled_pluspoints',
      'notenrechner-calc-btn': 'buttonEnabled_calculator', 
      'notenrechner-custom-btn': 'buttonEnabled_custom',
      'improvement-overlay-btn': 'buttonEnabled_improvement',
      'gamification-overlay-btn': 'buttonEnabled_achievements',
      'game-overlay-btn': 'buttonEnabled_game'
    };

    const storageKeysMK = Object.values(buttonSettingsMK);
    
    if (storage && storage.get) {
      try {
        storage.get(storageKeysMK, (result) => {
          if (runtimeAPI && runtimeAPI.lastError) {
            console.warn('Storage error:', runtimeAPI.lastError);
            // Fallback to localStorage
            loadButtonSettingsFromLocalStorage(buttonSettingsMK);
            return;
          }
          
          Object.entries(buttonSettingsMK).forEach(([buttonId, storageKey]) => {
            const buttonMK = document.getElementById(buttonId);
            if (buttonMK) {
              // Default to true for all buttons except game button
              const defaultValue = buttonId === 'game-overlay-btn' ? false : true;
              const isEnabledMK = result[storageKey] !== undefined ? result[storageKey] : defaultValue;
              buttonMK.style.display = isEnabledMK ? 'flex' : 'none';
            }
          });
        });
      } catch (error) {
        console.warn('Error accessing extension storage:', error);
        loadButtonSettingsFromLocalStorage(buttonSettingsMK);
      }
    } else {
      // Fallback to localStorage
      loadButtonSettingsFromLocalStorage(buttonSettingsMK);
    }
  }

  // Fallback function for localStorage
  function loadButtonSettingsFromLocalStorage(buttonSettings) {
    Object.entries(buttonSettings).forEach(([buttonId, storageKey]) => {
      const buttonMK = document.getElementById(buttonId);
      if (buttonMK) {
        try {
          const storedMK = localStorage.getItem(storageKey);
          // Default to true for all buttons except game button
          const defaultValue = buttonId === 'game-overlay-btn' ? false : true;
          const isEnabledMK = storedMK !== null ? JSON.parse(storedMK) : defaultValue;
          buttonMK.style.display = isEnabledMK ? 'flex' : 'none';
        } catch (error) {
          console.warn(`Error loading setting ${storageKey}:`, error);
          // Default fallback - false for game button, true for others
          const defaultValue = buttonId === 'game-overlay-btn' ? false : true;
          buttonMK.style.display = defaultValue ? 'flex' : 'none';
        }
      }
    });
  }

  // Initialize the system when DOM is ready - Simplified since scripts are pre-loaded
  async function initializeSystem() {
    console.log('🚀 Initializing Notenrechner system...');
    
    // Check extension context at the start
    try {
      if (!chrome.runtime?.id) {
        console.warn('Extension context invalid at initialization start');
        createFallbackButtons();
        return;
      }
      console.log('🔍 Extension info:', {
        chromeRuntime: !!chrome.runtime,
        extensionId: chrome.runtime?.id,
        manifest: chrome.runtime?.getManifest?.()?.name
      });
    } catch (error) {
      console.warn('Extension context check failed:', error);
      createFallbackButtons();
      return;
    }
    
    // Wait for DOM to be fully ready
    if (document.readyState === 'loading') {
      console.log('⏳ Waiting for DOM to be ready...');
      await new Promise(resolve => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }
    console.log('✅ DOM is ready');
    
    try {
      console.log('📦 Loading pre-loaded button components...');
      await loadButtonComponents();
      
      // Start watching for grade changes
      console.log('👀 Starting grade change watcher...');
      setTimeout(() => {
        try {
          watchForChanges();
        } catch (error) {
          console.error('Failed to start grade watcher:', error);
        }
      }, 1000);
      
      console.log('✅ Notenrechner system initialization complete');
      
    } catch (error) {
      console.error('❌ Failed to initialize button system:', error);
      createFallbackButtons();
    }
  }

  // Enhanced DOM ready detection
  function initWhenReady() {
    if (document.readyState === "complete" || document.readyState === "interactive") {
      // Add a small delay to ensure the page is fully rendered
      setTimeout(initializeSystem, 1000);
    } else {
      document.addEventListener("DOMContentLoaded", () => {
        setTimeout(initializeSystem, 1000);
      });
      
      // Fallback timeout in case DOMContentLoaded doesn't fire
      setTimeout(() => {
        if (document.readyState !== "complete") {
          console.warn('DOM not ready after timeout, initializing anyway...');
          initializeSystem();
        }
      }, 10000);
    }
  }

  // Start initialization
  initWhenReady();

})();