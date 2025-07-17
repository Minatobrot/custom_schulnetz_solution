// Calculator Button Component
(function() {
  'use strict';
  
  console.log('Loading CalculatorButton script...');

  class CalculatorButton {
    constructor(buttonManager) {
      this.buttonManager = buttonManager;
      this.buttonId = "notenrechner-calc-btn";
      this.panelId = "notenrechner-calc-panel";
    }

    isPanelOpen() {
      return !!document.getElementById(this.panelId);
    }

    getDefaultPosition() {
      const winWMK = window.innerWidth, winHMK = window.innerHeight;
      return {
        left: winWMK - 50 - 80, // Middle bottom
        top: winHMK - 50 - 20
      };
    }

    // Watch for gaps and move to fill them
    startWatching() {
      const myButton = document.getElementById(this.buttonId);
      if (!myButton) return;

      // Store original position
      if (!myButton.dataset.originalLeft) {
        myButton.dataset.originalLeft = myButton.style.left;
      }

      const checkAndSlide = () => {
        const winW = window.innerWidth;
        
        // Define positions
        const customPos = winW - 50 - 140;      // Left of bottom row
        const myOriginalPos = winW - 50 - 80;   // Middle of bottom row
        const gamificationPos = winW - 50 - 20; // Right of bottom row
        
        // Calculator should try filling GAMIFICATION direction (towards BIGGEST left coordinates)
        let targetPosition = myOriginalPos; // Default to original position
        
        // Check if Gamification button is hidden - move RIGHT to its position (BIGGER left coordinate)
        const gamificationButton = document.getElementById('gamification-overlay-btn');
        if (!gamificationButton || gamificationButton.style.display === 'none') {
          targetPosition = gamificationPos;
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
        chrome.storage.local.get(['notenDaten'], res => {
          if (res && Array.isArray(res.notenDaten)) cb(res.notenDaten);
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
      buttonMK.title = "Notenrechner";
      buttonMK.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: white;
        border: 1px solid #1976d2;
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
      // Calculator SVG Icon
      buttonMK.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="4" y="4" width="20" height="20" rx="4" fill="#1976d2"/><rect x="7" y="7" width="14" height="4" rx="1.5" fill="#fff"/><rect x="7" y="13" width="4" height="4" rx="1.5" fill="#fff"/><rect x="12" y="13" width="4" height="4" rx="1.5" fill="#fff"/><rect x="17" y="13" width="4" height="4" rx="1.5" fill="#fff"/><rect x="7" y="18" width="4" height="4" rx="1.5" fill="#fff"/><rect x="12" y="18" width="4" height="4" rx="1.5" fill="#fff"/></svg>`;
      
      // Register with button manager
      this.buttonManager.registerButton(this.buttonId, buttonMK, {});
      
      buttonMK.addEventListener("click", (e) => {
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
        // Sonst: Nur ein Panel gleichzeitig offen: schließe andere Panels und deaktiviere alle Button-Glow-Styles
        this.closeAllPanels();
        // Animation: Button hervorheben (blau)
        this.buttonManager.markButtonOpening(this.buttonId);
        buttonMK.style.outline = "3px solid #4ad2fc";
        buttonMK.style.boxShadow = "0 0 16px 4px #4ad2fc, 0 2px 8px rgba(0,0,0,0.18)";
        buttonMK.style.width = "58px";
        buttonMK.style.height = "58px";
        
        this.createPanel(buttonMK);
      });
      
      // Wenn Panel geschlossen wird, Button wieder normal
      document.addEventListener("click", (e) => {
        const panelMK = document.getElementById(this.panelId);
        if (!panelMK && buttonMK.style.outline !== "none") {
          buttonMK.style.outline = "none";
          buttonMK.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          buttonMK.style.width = "50px";
          buttonMK.style.height = "50px";
        }
      }, true);
      
      document.body.appendChild(buttonMK);
      
      // Start watching for the gamification button
      this.startWatching();
    }

    createPanel(button) {
      // Panel erstellen
      const panelMK = document.createElement("div");
      panelMK.id = this.panelId;
      const panelWidthMK = 370, panelHeightMK = 420;
      const btnLeftMK = parseInt(button.style.left);
      const btnTopMK = parseInt(button.style.top);
      
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
        color: #1976d2;
        border: 1px solid #1976d2;
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
        <div style="background: linear-gradient(135deg, #1976d2, #1565c0); color: white; padding: 20px 18px 16px 18px; margin: 0;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 6px;">🧮 Notenrechner</div>
          <div style="font-size: 14px; opacity: 0.9;">Berechne deine benötigte Note für das gewünschte Ziel</div>
        </div>
        <div style="padding: 18px; flex: 1;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; border: 1px solid #e9ecef;">
            <label for="calc-subject-select" style="font-weight: 600; color: #495057; margin-bottom: 8px; display: block;">📚 Fach auswählen:</label>
            <select id="calc-subject-select" style="width:100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; margin-bottom: 12px; background: white; color: #495057;">
            </select>
            <div id="calc-info" style="background: white; padding: 12px; border-radius: 6px; font-size: 13px; white-space: pre-wrap; border: 1px solid #e9ecef; color: #495057;">
            </div>
          </div>
          
          <div style="background: white; border-radius: 8px; padding: 16px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); border: 1px solid #e9ecef;">
            <div style="margin-bottom: 12px;">
              <label style="font-weight: 600; color: #495057; margin-bottom: 6px; display: block;">🎯 Zielnote:</label>
              <input id="calc-goal-input" placeholder="z.B. 5.0" style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; box-sizing: border-box;" />
            </div>
            <div style="margin-bottom: 16px;">
              <label style="font-weight: 600; color: #495057; margin-bottom: 6px; display: block;">⚖️ Gewichtung nächster Test:</label>
              <input id="calc-weight-input" placeholder="z.B. 1.0" style="width: 100%; padding: 10px; border: 2px solid #e9ecef; border-radius: 6px; font-size: 14px; box-sizing: border-box;" />
            </div>
            <button id="calc-btn" style="width: 100%; background: linear-gradient(135deg, #1976d2, #1565c0); color: white; border: none; border-radius: 8px; padding: 12px 0; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.3s ease; box-shadow: 0 2px 4px rgba(25,118,210,0.3);" 
                    onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 8px rgba(25,118,210,0.4)'" 
                    onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 4px rgba(25,118,210,0.3)'">
              ✨ Berechnen
            </button>
            <div id="calc-result" style="margin-top: 12px; font-weight: 600; padding: 12px; border-radius: 6px; text-align: center;">
            </div>
          </div>
        </div>
      `;
      
      panelMK.appendChild(contentMK);
      panelMK.appendChild(closeBtnMK);
      document.body.appendChild(panelMK);
      
      // Initialize calculator logic
      this.updateCalcPanel(panelMK);
    }

    updateCalcPanel(panel) {
      this.loadNotenDaten((notenDaten) => {
        const selectMK = panel.querySelector('#calc-subject-select');
        const infoMK = panel.querySelector('#calc-info');
        const resultMK = panel.querySelector('#calc-result');
        const goalInputMK = panel.querySelector('#calc-goal-input');
        const weightInputMK = panel.querySelector('#calc-weight-input');
        
        selectMK.innerHTML = '';
        if (!notenDaten.length) {
          let optMK = document.createElement('option');
          optMK.textContent = 'Keine Noten gefunden';
          selectMK.appendChild(optMK);
          infoMK.textContent = '';
          resultMK.textContent = '';
          return;
        }
        
        for (const fachMK of notenDaten) {
          let optMK = document.createElement('option');
          optMK.value = fachMK.fach;
          const punkteMK = this.punkteFuerNote(fachMK.durchschnitt);
          // Zeige auch den Schnitt im Dropdown
          optMK.textContent = `${fachMK.fach} (Ø ${fachMK.durchschnitt} | ${punkteMK >= 0 ? "+" : ""}${punkteMK} Punkte)`;
          selectMK.appendChild(optMK);
        }
        
        selectMK.selectedIndex = 0;
        this.onSelectChange(selectMK, notenDaten, infoMK, resultMK);
        selectMK.addEventListener('change', () => this.onSelectChange(selectMK, notenDaten, infoMK, resultMK));
        
        panel.querySelector('#calc-btn').onclick = () => {
          this.calculateRequiredGrade(selectMK, notenDaten, goalInputMK, weightInputMK, resultMK);
        };
      });
    }

    onSelectChange(select, notenDaten, info, result) {
      const fachNameMK = select.value;
      const objMK = notenDaten.find(e => e.fach === fachNameMK);
      if (!objMK) {
        info.textContent = 'Fach nicht gefunden.';
        result.textContent = '';
        return;
      }
      const punkteMK = this.punkteFuerNote(objMK.durchschnitt);
      info.textContent =
        `Bisherige Noten: ${objMK.noten.join(", ")}\n` +
        `Gewichtungen: ${objMK.gewichtungen.join(", ")}\n` +
        `Aktueller Schnitt: ${objMK.durchschnitt}\n` +
        `Punkte für dieses Fach: ${punkteMK >= 0 ? "+" : ""}${punkteMK}`;
      result.textContent = '';
    }

    calculateRequiredGrade(select, notenDaten, goalInput, weightInput, result) {
      const fachNameMK = select.value;
      const objMK = notenDaten.find(e => e.fach === fachNameMK);
      if (!objMK) {
        result.textContent = 'Fach nicht gefunden.';
        return;
      }
      const zielMK = parseFloat(goalInput.value.replace(",", "."));
      const gewichtMK = parseFloat(weightInput.value.replace(",", "."));
      if (isNaN(zielMK) || isNaN(gewichtMK) || gewichtMK <= 0) {
        result.style.background = 'linear-gradient(135deg, #fff3e0, #ffe0b2)';
        result.style.color = '#ef6c00';
        result.style.border = '1px solid #ffcc02';
        result.innerHTML = '⚠️ Bitte Zielnote und Gewichtung korrekt eingeben!';
        return;
      }
      const gwSummeMK = objMK.gewichtungen.reduce((a, b) => a + b, 0);
      const summeMK = objMK.noten.reduce((sum, n, i) => sum + n * objMK.gewichtungen[i], 0);
      const xMK = (zielMK * (gwSummeMK + gewichtMK) - summeMK) / gewichtMK;
      if (isNaN(xMK) || !isFinite(xMK)) {
        result.style.background = 'linear-gradient(135deg, #ffebee, #ffcdd2)';
        result.style.color = '#c62828';
        result.style.border = '1px solid #ef9a9a';
        result.innerHTML = '❌ Berechnung nicht möglich.';
        return;
      }
      if (xMK > 6) {
        // Berechne maximal erreichbaren Durchschnitt mit Note 6
        const maxSchnittMK = ((summeMK + 6 * gewichtMK) / (gwSummeMK + gewichtMK)).toFixed(2);
        result.style.background = 'linear-gradient(135deg, #ffebee, #ffcdd2)';
        result.style.color = '#c62828';
        result.style.border = '1px solid #ef9a9a';
        result.innerHTML = `❌ Nicht möglich!<br><span style="font-size: 13px;">Benötigte Note > 6.0</span><br><span style="font-size: 12px; opacity: 0.8;">Maximal erreichbar: ${maxSchnittMK}</span>`;
        return;
      }
      if (xMK < 1) {
        // Berechne minimal erreichbaren Durchschnitt mit Note 1
        const minSchnittMK = ((summeMK + 1 * gewichtMK) / (gwSummeMK + gewichtMK)).toFixed(2);
        result.style.background = 'linear-gradient(135deg, #ffebee, #ffcdd2)';
        result.style.color = '#c62828';
        result.style.border = '1px solid #ef9a9a';
        result.innerHTML = `❌ Nicht möglich!<br><span style="font-size: 13px;">Benötigte Note < 1.0</span><br><span style="font-size: 12px; opacity: 0.8;">Minimal erreichbar: ${minSchnittMK}</span>`;
        return;
      }
      
      // Erfolgreiche Berechnung
      let bgColorMK, textColorMK, borderColorMK, iconMK;
      if (xMK <= 4.0) {
        bgColorMK = 'linear-gradient(135deg, #ffebee, #ffcdd2)';
        textColorMK = '#c62828';
        borderColorMK = '#ef9a9a';
        iconMK = '⚠️';
      } else if (xMK <= 5.0) {
        bgColorMK = 'linear-gradient(135deg, #fff8e1, #ffecb3)';
        textColorMK = '#ef6c00';
        borderColorMK = '#ffcc02';
        iconMK = '⚡';
      } else {
        bgColorMK = 'linear-gradient(135deg, #e8f5e8, #c8e6c9)';
        textColorMK = '#2e7d32';
        borderColorMK = '#81c784';
        iconMK = '✅';
      }
      
      result.style.background = bgColorMK;
      result.style.color = textColorMK;
      result.style.border = `1px solid ${borderColorMK}`;
      result.innerHTML = `${iconMK} <strong>Benötigte Note:</strong><br><span style="font-size: 18px; font-weight: 700;">${xMK.toFixed(2)}</span>`;
    }
  }
  // Ensure class is available on window object immediately
  window.CalculatorButton = CalculatorButton;
  console.log('✓ CalculatorButton class registered on window object');

})();
