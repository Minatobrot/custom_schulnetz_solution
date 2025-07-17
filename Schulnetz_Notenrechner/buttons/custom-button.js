// Custom Notes Button Component
(function() {
  'use strict';
  
  console.log('Loading CustomButton script...');

  class CustomButton {
    constructor(buttonManager) {
      this.buttonManager = buttonManager;
      this.buttonId = "notenrechner-custom-btn";
      this.panelId = "notenrechner-custom-panel";
    }

    isPanelOpen() {
      return !!document.getElementById(this.panelId);
    }

    getDefaultPosition() {
      const winWMK = window.innerWidth, winHMK = window.innerHeight;
      return {
        left: winWMK - 50 - 140, // Left of calculator button
        top: winHMK - 50 - 20
      };
    }

    // Watch for gaps and move to fill them (Priority: leftmost, moves last)
    startWatching() {
      const myButton = document.getElementById(this.buttonId);
      if (!myButton) return;

      // Store original position
      if (!myButton.dataset.originalLeft) {
        myButton.dataset.originalLeft = myButton.style.left;
      }

      const checkAndSlide = () => {
        const winW = window.innerWidth;
        
        // Custom button has LOWEST priority in bottom row (farthest from gamification)
        // Can move right to fill gaps from Calculator or Gamification buttons
        const calculatorPos = winW - 50 - 80;   // Middle of bottom row
        const gamificationPos = winW - 50 - 20; // Right of bottom row (closest to gamification)
        const myOriginalPos = parseInt(myButton.dataset.originalLeft);
        
        let targetPosition = myOriginalPos; // Default to original position
        
        // Get button references
        const calculatorButton = document.getElementById('notenrechner-calc-btn');
        const gamificationButton = document.getElementById('gamification-overlay-btn');
        
        const calculatorHidden = !calculatorButton || calculatorButton.style.display === 'none';
        const gamificationHidden = !gamificationButton || gamificationButton.style.display === 'none';
        
        // Priority logic: Custom button fills the rightmost available gap (towards gamification)
        if (calculatorHidden && gamificationHidden) {
          // Both hidden: fill Gamification's position (highest priority, rightmost)
          targetPosition = gamificationPos;
        } else if (calculatorHidden && !gamificationHidden) {
          // Only Calculator hidden: fill Calculator's position
          targetPosition = calculatorPos;
        } else if (!calculatorHidden && gamificationHidden) {
          // Only Gamification hidden: Calculator should move there, but if Calculator hasn't moved yet, Custom can move to Calculator's position
          const calculatorCurrentLeft = parseInt(calculatorButton.style.left || calculatorPos);
          if (calculatorCurrentLeft !== calculatorPos) {
            // Calculator has moved to Gamification position, fill Calculator's original position
            targetPosition = calculatorPos;
          } else {
            // Calculator hasn't moved yet, stay at original position for now
            targetPosition = myOriginalPos;
          }
        } else {
          // Both visible: check if Calculator has moved away from its original position
          const calculatorCurrentLeft = parseInt(calculatorButton.style.left || calculatorPos);
          if (calculatorCurrentLeft !== calculatorPos) {
            // Calculator has moved away, fill its original position
            targetPosition = calculatorPos;
          }
        }
        
        myButton.style.transition = 'left 0.3s ease';
        myButton.style.left = `${targetPosition}px`;
      };

      // Check immediately and then periodically
      checkAndSlide();
      setInterval(checkAndSlide, 100);
    }

    punkteFuerNote(note) {
      const nMK = Math.round(note * 2) / 2;
      if (nMK >= 6.0)   return 2;
      if (nMK === 5.5)  return 1.5;
      if (nMK === 5.0)  return 1;
      if (nMK === 4.5)  return 0.5;
      if (nMK === 4.0)  return 0;
      if (nMK === 3.5)  return -1;
      if (nMK === 3.0)  return -2;
      if (nMK === 2.5)  return -3;
      if (nMK === 2.0)  return -4;
      if (nMK === 1.5)  return -6;
      if (nMK <= 1.0)   return -8;
      return 0;
    }

    loadNotenDaten(cb) {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['notenDaten'], resMK => {
          if (resMK && Array.isArray(resMK.notenDaten)) cb(resMK.notenDaten);
          else {
            try {
              const arrMK = JSON.parse(localStorage.getItem('notenDaten'));
              if (Array.isArray(arrMK)) cb(arrMK); else cb([]);
            } catch { cb([]); }
          }
        });
      } else {
        try {
          const arrMK = JSON.parse(localStorage.getItem('notenDaten'));
          if (Array.isArray(arrMK)) cb(arrMK); else cb([]);
        } catch { cb([]); }
      }
    }

    closeAllPanels() {
      [
        { id: "notenrechner-calc-panel", btn: document.getElementById("notenrechner-calc-btn") },
        { id: "notenrechner-custom-panel", btn: document.getElementById("notenrechner-custom-btn") },
        { id: "pluspoints-overlay-panel", btn: document.getElementById("pluspoints-overlay-btn") },
        { id: "improvement-overlay-panel", btn: document.getElementById("improvement-overlay-btn") },
        { id: "gamification-overlay-panel", btn: document.getElementById("gamification-overlay-btn") },
        { id: "game-overlay-panel", btn: document.getElementById("game-overlay-btn") }
      ].forEach(({ id, btn }) => {
        const pMK = document.getElementById(id);
        if (pMK) pMK.remove();
        if (btn) {
          btn.style.outline = "none";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          btn.style.width = "50px";
          btn.style.height = "50px";
        }
      });
    }

    create() {
      if (document.getElementById(this.buttonId)) return;
      
      const positionMK = this.getDefaultPosition();
      const buttonMK = document.createElement("button");
      buttonMK.id = this.buttonId;
      buttonMK.title = "Eigene Noten ausprobieren";
      buttonMK.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: white;
        border: 1px solid #b36a00;
        border-radius: 10px;
        cursor: pointer;
        z-index: 10000;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        display: flex; align-items: center; justify-content: center;
        left: ${positionMK.left}px; top: ${positionMK.top}px;
        overflow: visible;
        padding: 0;
        transition: box-shadow 0.25s, outline 0.25s, width 0.25s, height 0.25s;
      `;
      // Custom Note SVG Icon (pencil)
      buttonMK.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="20" height="20" rx="4" fill="#b36a00"/><path d="M9 19l1.5-5.5L18 6.99a1.4 1.4 0 012 2l-6.51 7.5L9 19z" fill="#fff"/><rect x="7" y="21" width="14" height="2" rx="1" fill="#fff"/></svg>`;
      
      // Register with button manager
      this.buttonManager.registerButton(this.buttonId, buttonMK, {});
      
      buttonMK.addEventListener("click", (eMK) => {
        // Wenn Panel offen: schließe es und entferne Glow
        if (this.isPanelOpen()) {
          const pMK = document.getElementById(this.panelId);
          if (pMK) pMK.remove();
          buttonMK.style.outline = "none";
          buttonMK.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          buttonMK.style.width = "50px";
          buttonMK.style.height = "50px";
          return;
        }
        // Sonst: Nur ein Panel gleichzeitig offen
        this.closeAllPanels();
        // Animation: Button hervorheben (orange)
        this.buttonManager.markButtonOpening(this.buttonId);
        buttonMK.style.outline = "3px solid #ffa726";
        buttonMK.style.boxShadow = "0 0 16px 4px #ffa726, 0 2px 8px rgba(0,0,0,0.18)";
        buttonMK.style.width = "58px";
        buttonMK.style.height = "58px";
        
        this.createPanel(buttonMK);
      });
      
      // Wenn Panel geschlossen wird, Button wieder normal
      document.addEventListener("click", (eMK) => {
        const panelMK = document.getElementById(this.panelId);
        if (!panelMK && buttonMK.style.outline !== "none") {
          buttonMK.style.outline = "none";
          buttonMK.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          buttonMK.style.width = "50px";
          buttonMK.style.height = "50px";
        }
      }, true);
      
      document.body.appendChild(buttonMK);
      
      // Start watching for the calculator button
      this.startWatching();
    }

    createPanel(buttonMK) {
      const panelMK = document.createElement("div");
      panelMK.id = this.panelId;
      const panelWidthMK = 370, panelHeightMK = 420;
      const btnLeftMK = parseInt(buttonMK.style.left);
      const btnTopMK = parseInt(buttonMK.style.top);

      // Position panel at bottom-right corner, 60px up and 60px left from corner
      const panelLeft = window.innerWidth - panelWidthMK - 75;
      const panelTop = window.innerHeight - panelHeightMK - 80;
      
      panelMK.style.cssText = `
        position: fixed;
        left: ${panelLeft}px;
        top: ${panelTop}px;
        width: ${panelWidthMK}px;
        height: ${panelHeightMK}px;
        background: #fff;
        border-radius: 12px;
        box-shadow: 0 4px 24px rgba(0,0,0,0.18);
        z-index: 9999;
        padding: 0;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      `;
      
      // Schließen-Button
      const closeBtnMK = document.createElement("button");
      closeBtnMK.textContent = "✕";
      closeBtnMK.style.cssText = `
        position: absolute;
        top: 6px;
        right: 12px;
        background: #fff;
        color: #b36a00;
        border: 1px solid #b36a00;
        border-radius: 50%;
        width: 26px; height: 26px;
        font-size: 15px;
        cursor: pointer;
        z-index: 10002;
      `;
      closeBtnMK.onclick = () => panelMK.remove();
      
      // Panel-Inhalt
      const contentMK = document.createElement('div');
      contentMK.style.cssText = 'padding: 0; overflow-y: auto; flex: 1; display: flex; flex-direction: column;';
      contentMK.innerHTML = `
        <div style="background: linear-gradient(135deg, #b36a00, #9c5a00); color: white; padding: 20px 18px 16px 18px; margin: 0;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 6px;">✏️ Eigene Noten ausprobieren</div>
          <div style="font-size: 14px; opacity: 0.9;">Teste verschiedene Notenszenarien und sieh die Auswirkungen</div>
        </div>
        <div style="padding: 18px; flex: 1;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid #e9ecef;">
            <label for="custom-calc-subject-select" style="font-weight: 600; color: #495057; margin-bottom: 8px; display: block;">📚 Fach auswählen:</label>
            <select id="custom-calc-subject-select" style="width:100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; margin-bottom: 12px; background: white; color: #495057;">
            </select>
            <div id="custom-calc-info" style="background: white; padding: 12px; border-radius: 6px; font-size: 13px; white-space: pre-wrap; border: 1px solid #e9ecef; color: #495057;">
            </div>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
            <div style="font-weight: 600; color: #495057; margin-bottom: 12px; display: flex; align-items: center;">
              <span style="margin-right: 8px;">📝</span>
              <span>Zusätzliche Noten hinzufügen:</span>
            </div>
            <div id="custom-note-fields"></div>
            <div id="custom-calc-result" style="margin-top: 16px; font-weight: 600; padding: 12px; border-radius: 6px; text-align: center;">
            </div>
          </div>
        </div>
      `;
      
      panelMK.appendChild(contentMK);
      panelMK.appendChild(closeBtnMK);
      document.body.appendChild(panelMK);
      
      // Initialize custom calculator logic
      this.updateCustomCalcPanel(panelMK);
    }

    updateCustomCalcPanel(panelMK) {
      this.loadNotenDaten((notenDatenMK) => {
        const selectMK = panelMK.querySelector('#custom-calc-subject-select');
        const infoMK = panelMK.querySelector('#custom-calc-info');
        const resultMK = panelMK.querySelector('#custom-calc-result');
        const fieldsDivMK = panelMK.querySelector('#custom-note-fields');
        
        selectMK.innerHTML = '';
        if (!notenDatenMK.length) {
          let optMK = document.createElement('option');
          optMK.textContent = 'Keine Noten gefunden';
          selectMK.appendChild(optMK);
          infoMK.textContent = '';
          resultMK.textContent = '';
          return;
        }
        
        for (const fachMK of notenDatenMK) {
          let optMK = document.createElement('option');
          optMK.value = fachMK.fach;
          const punkteMK = this.punkteFuerNote(fachMK.durchschnitt);
          optMK.textContent = `${fachMK.fach} (Ø ${fachMK.durchschnitt} | ${punkteMK >= 0 ? "+" : ""}${punkteMK} Punkte)`;
          selectMK.appendChild(optMK);
        }
        
        selectMK.selectedIndex = 0;
        this.onSelectChange(selectMK, notenDatenMK, infoMK, resultMK, fieldsDivMK);
        selectMK.addEventListener('change', () => this.onSelectChange(selectMK, notenDatenMK, infoMK, resultMK, fieldsDivMK));
      });
    }

    onSelectChange(selectMK, notenDatenMK, infoMK, resultMK, fieldsDivMK) {
      const fachNameMK = selectMK.value;
      const objMK = notenDatenMK.find(eMK => eMK.fach === fachNameMK);
      if (!objMK) {
        infoMK.textContent = 'Fach nicht gefunden.';
        resultMK.textContent = '';
        return;
      }
      const punkteMK = this.punkteFuerNote(objMK.durchschnitt);
      infoMK.textContent =
        `Bisherige Noten: ${objMK.noten.join(", ")}\n` +
        `Gewichtungen: ${objMK.gewichtungen.join(", ")}\n` +
        `Aktueller Schnitt: ${objMK.durchschnitt}\n` +
        `Punkte für dieses Fach: ${punkteMK >= 0 ? "+" : ""}${punkteMK}`;
      resultMK.textContent = '';
      
      // Initialize custom notes system
      this.initCustomNotesSystem(objMK, fieldsDivMK, resultMK);
    }

    initCustomNotesSystem(fachObjMK, fieldsDivMK, resultMK) {
      let customNotesMK = [];
      let customWeightsMK = [];
      
      const renderFieldsMK = () => {
        fieldsDivMK.innerHTML = '';
        for (let iMK = 0; iMK < customNotesMK.length; ++iMK) {
          const nMK = customNotesMK[iMK], wMK = customWeightsMK[iMK];
          const rowMK = document.createElement('div');
          rowMK.style.cssText = 'display: flex; gap: 8px; margin-bottom: 8px; align-items: center;';
          rowMK.innerHTML = `
            <input type="number" step="0.01" min="1" max="6" placeholder="Note (1.0-6.0)" value="${nMK ?? ''}" 
                   style="flex:1; padding: 8px 10px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; background: white;" />
            <input type="number" step="0.01" min="0.1" placeholder="Gewichtung" value="${wMK ?? ''}" 
                   style="flex:1; padding: 8px 10px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; background: white;" />
            <button style="background: linear-gradient(135deg, #dc3545, #c82333); color: white; border: none; border-radius: 6px; padding: 8px 10px; cursor: pointer; font-weight: 600; transition: all 0.3s;" 
                    title="Entfernen" onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">🗑️</button>
          `;
          const noteInputMK = rowMK.children[0];
          const weightInputMK = rowMK.children[1];
          const delBtnMK = rowMK.children[2];
          
          // Input focus effects
          [noteInputMK, weightInputMK].forEach(inputMK => {
            inputMK.addEventListener('focus', () => inputMK.style.borderColor = '#b36a00');
            inputMK.addEventListener('blur', () => inputMK.style.borderColor = '#e9ecef');
          });
          
          noteInputMK.addEventListener('input', () => { customNotesMK[iMK] = noteInputMK.value ? parseFloat(noteInputMK.value) : null; updateMK(); });
          weightInputMK.addEventListener('input', () => { customWeightsMK[iMK] = weightInputMK.value ? parseFloat(weightInputMK.value) : null; updateMK(); });
          delBtnMK.addEventListener('click', () => { customNotesMK.splice(iMK,1); customWeightsMK.splice(iMK,1); updateMK(); });
          fieldsDivMK.appendChild(rowMK);
        }
        
        // Add new empty field if last is filled
        if (customNotesMK.length === 0 || (customNotesMK[customNotesMK.length-1] && customWeightsMK[customWeightsMK.length-1])) {
          customNotesMK.push(null);
          customWeightsMK.push(null);
          renderFieldsMK();
        }
        
        // Add a "+ Add Note" button at the end
        const addBtnMK = document.createElement('button');
        addBtnMK.style.cssText = `
          width: 100%; padding: 10px; margin-top: 8px; 
          background: linear-gradient(135deg, #b36a00, #9c5a00); 
          color: white; border: none; border-radius: 6px; 
          font-weight: 600; cursor: pointer; transition: all 0.3s;
          box-shadow: 0 2px 4px rgba(179,106,0,0.3);
        `;
        addBtnMK.innerHTML = '➕ Weitere Note hinzufügen';
        addBtnMK.onmouseover = () => addBtnMK.style.transform = 'translateY(-1px)';
        addBtnMK.onmouseout = () => addBtnMK.style.transform = 'translateY(0)';
        addBtnMK.onclick = () => {
          customNotesMK.push(null);
          customWeightsMK.push(null);
          renderFieldsMK();
        };
        fieldsDivMK.appendChild(addBtnMK);
      };
      
      const updateMK = () => {
        // Remove trailing empty fields
        while (customNotesMK.length > 1 && !customNotesMK[customNotesMK.length-1] && !customWeightsMK[customWeightsMK.length-1]) {
          customNotesMK.pop();
          customWeightsMK.pop();
        }
        renderFieldsMK();
        
        // Calculate new Schnitt
        const origNotenMK = fachObjMK.noten.slice();
        const origGewMK = fachObjMK.gewichtungen.slice();
        let allNotenMK = origNotenMK.concat(customNotesMK.filter(xMK => typeof xMK === 'number' && !isNaN(xMK)));
        let allGewMK = origGewMK.concat(customWeightsMK.filter(xMK => typeof xMK === 'number' && !isNaN(xMK)));
        
        if (allNotenMK.length !== allGewMK.length || allNotenMK.length === 0) {
          resultMK.textContent = '';
          return;
        }
        
        let summeWMK = allGewMK.reduce((aMK, bMK) => aMK + bMK, 0);
        let summeMK = allNotenMK.reduce((aMK, nMK, iMK) => aMK + nMK * allGewMK[iMK], 0);
        let schnittMK = summeWMK > 0 ? (summeMK / summeWMK).toFixed(2) : '-';
        let punkteMK = schnittMK !== '-' ? this.punkteFuerNote(parseFloat(schnittMK)) : '-';
        
        if (schnittMK === '-') {
          resultMK.style.background = '#f8f9fa';
          resultMK.style.color = '#6c757d';
          resultMK.style.border = '1px solid #e9ecef';
          resultMK.innerHTML = '📊 Füge Noten hinzu, um die Berechnung zu sehen';
          return;
        }
        
        // Styling based on grade
        let bgColorMK, textColorMK, borderColorMK, iconMK;
        const schnittNumMK = parseFloat(schnittMK);
        if (schnittNumMK < 4.0) {
          bgColorMK = 'linear-gradient(135deg, #ffebee, #ffcdd2)';
          textColorMK = '#c62828';
          borderColorMK = '#ef9a9a';
          iconMK = '⚠️';
        } else if (schnittNumMK < 5.0) {
          bgColorMK = 'linear-gradient(135deg, #fff8e1, #ffecb3)';
          textColorMK = '#ef6c00';
          borderColorMK = '#ffcc02';
          iconMK = '📈';
        } else {
          bgColorMK = 'linear-gradient(135deg, #e8f5e8, #c8e6c9)';
          textColorMK = '#2e7d32';
          borderColorMK = '#81c784';
          iconMK = '🎉';
        }
        
        resultMK.style.background = bgColorMK;
        resultMK.style.color = textColorMK;
        resultMK.style.border = `1px solid ${borderColorMK}`;
        resultMK.innerHTML = `
          ${iconMK} <strong>Neuer Schnitt:</strong> <span style="font-size: 18px; font-weight: 700;">${schnittMK}</span><br>
          <strong>Neue Punkte:</strong> <span style="font-size: 16px; font-weight: 600;">${punkteMK > 0 ? '+' : ''}${punkteMK}</span>
        `;
      };
      
      // Start with one field
      customNotesMK = [];
      customWeightsMK = [];
      renderFieldsMK();
    }
  }

  // Ensure class is available on window object immediately
  window.CustomButton = CustomButton;
  console.log('✓ CustomButton class registered on window object');

})();
