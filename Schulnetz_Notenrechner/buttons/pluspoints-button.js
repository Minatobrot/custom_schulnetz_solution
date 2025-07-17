// Pluspoints Button Component
(function() {
  'use strict';
  
  console.log('Loading PluspointsButton script...');

  class PluspointsButton {
    constructor(buttonManager) {
      this.buttonManager = buttonManager;
      this.buttonId = "pluspoints-overlay-btn";
      this.panelId = "pluspoints-overlay-panel";
    }

    isPanelOpen() {
      return !!document.getElementById(this.panelId);
    }

    getDefaultPosition() {
      const winWMK = window.innerWidth, winHMK = window.innerHeight;
      return {
        left: winWMK - 50 - 20, // Right edge
        top: winHMK - 50 - 140  // Above other buttons
      };
    }

    // Watch for gaps and move to fill them (Priority: middle in stack)
    startWatching() {
      const myButton = document.getElementById(this.buttonId);
      if (!myButton) return;

      // Store original position
      if (!myButton.dataset.originalTop) {
        myButton.dataset.originalTop = myButton.style.top;
      }

      const checkAndSlide = () => {
        const winH = window.innerHeight;
        
        // Define positions
        const improvementPos = winH - 50 - 80;  // Top of stack
        const myOriginalPos = winH - 50 - 140;  // Middle of stack
        const gamePos = winH - 50 - 200;        // Bottom of stack
        
        // Pluspoints should fill Improvement's space when Improvement is hidden (move DOWN towards gamification)
        let targetPosition = myOriginalPos; // Default to original position
        
        // Check if Improvement button is hidden - move DOWN to its position (towards gamification)
        const improvementButton = document.getElementById('improvement-overlay-btn');
        if (!improvementButton || improvementButton.style.display === 'none') {
          targetPosition = improvementPos; // Move DOWN (bigger coordinate, towards gamification)
        }
        
        myButton.style.transition = 'top 0.3s ease';
        myButton.style.top = `${targetPosition}px`;
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

    openPluspointsPanelAt(btnLeft, btnTop) {
      const existingPanelMK = document.getElementById(this.panelId);
      if (existingPanelMK) existingPanelMK.remove();
      const panelMK = document.createElement("div");
      panelMK.id = this.panelId;
      const panelWidthMK = 420, panelHeightMK = 660, offsetMK = 10, buttonSizeMK = 50, gapMK = 10;
      const winWMK = window.innerWidth, winHMK = window.innerHeight;
      
      // Position panel at bottom-right corner, 60px up and 60px left from corner
      const panelLeftMK = window.innerWidth - panelWidthMK - 75;
      const panelTopMK = window.innerHeight - panelHeightMK - 80;
      
      panelMK.style.cssText = `
        position: fixed;
        left: ${panelLeftMK}px;
        top: ${panelTopMK}px;
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
        color: #388e3c;
        border: 1px solid #388e3c;
        border-radius: 50%;
        width: 26px; height: 26px;
        font-size: 15px;
        cursor: pointer;
        z-index: 10002;
      `;
      closeBtnMK.onclick = () => panelMK.remove();
      // Panel-Inhalt (Pluspunkte-Tabelle)
      const contentMK = document.createElement('div');
      contentMK.style.cssText = 'padding: 0; overflow-y: auto; flex: 1; display: flex; flex-direction: column;';
      contentMK.innerHTML = `
        <div style="background: linear-gradient(135deg, #388e3c, #2e7d32); color: white; padding: 20px 18px 16px 18px; margin: 0;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 6px;">📊 Pluspunkte Übersicht</div>
          <div style="font-size: 14px; opacity: 0.9;">Verwalte deine Fach-Sichtbarkeit und sieh deine Punkteverteilung</div>
        </div>
        <div style="padding: 18px; flex: 1;">
          <div style="background: #f8f9fa; border-radius: 8px; padding: 12px; margin-bottom: 16px; border: 1px solid #e9ecef;">
            <label style="font-size: 13px; font-weight: 600; color: #495057; margin-bottom: 8px; display: block;">⚙️ Fächer ein-/ausblenden:</label>
            <div id="pluspoints-switch-wrap"></div>
          </div>
          <div id="pluspoints-table-wrap"></div>
        </div>
      `;
      panelMK.appendChild(contentMK);
      panelMK.appendChild(closeBtnMK);
      document.body.appendChild(panelMK);
      
      // Tabelle laden
      this.renderPluspointsTable();
    }

    renderPluspointsTable() {
      this.loadNotenDaten((notenDatenMK) => {
        // Switches für Fächer
        let hiddenFaecherMK = JSON.parse(localStorage.getItem('pluspointsHiddenFaecher') || '[]');
        // Tabelle mit Switch-Spalte
        let htmlMK = `
          <div style="background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.08); overflow: hidden; border: 1px solid #e9ecef;">
            <table style="width:100%;border-collapse:collapse;font-size:14px;">
              <thead>
                <tr style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                  <th style="text-align:center;padding:12px 8px;width:40px;font-weight:600;color:#495057;">📋</th>
                  <th style="text-align:left;padding:12px 8px;font-weight:600;color:#495057;">Fach</th>
                  <th style="text-align:right;padding:12px 8px;font-weight:600;color:#495057;">Schnitt</th>
                  <th style="text-align:right;padding:12px 8px;font-weight:600;color:#495057;">+ Punkte</th>
                  <th style="text-align:right;padding:12px 8px;font-weight:600;color:#495057;">- Punkte</th>
                </tr>
              </thead>
              <tbody>
        `;
        let plusMK = 0, minusMK = 0, schnittSumMK = 0, schnittCountMK = 0;
        for (const fachMK of notenDatenMK) {
          const idMK = 'pluspoints-switch-' + encodeURIComponent(fachMK.fach);
          const checkedMK = !hiddenFaecherMK.includes(fachMK.fach);
          // Moderner Switch (statt Checkbox)
          const swMK = `<label style="display:inline-block;width:32px;height:20px;position:relative;cursor:pointer;">
            <input type="checkbox" id="${idMK}" style="opacity:0;width:0;height:0;"${checkedMK ? ' checked' : ''}>
            <span style="position:absolute;top:0;left:0;right:0;bottom:0;background:${checkedMK ? '#388e3c' : '#ccc'};border-radius:10px;transition:all 0.3s ease;"></span>
            <span style="position:absolute;left:${checkedMK ? '14px' : '2px'};top:2px;width:16px;height:16px;background:#fff;border-radius:50%;transition:all 0.3s ease;box-shadow:0 2px 4px rgba(0,0,0,0.2);"></span>
          </label>`;
          let rowStyleMK = '';
          let fachCellMK = '', schnittCellMK = '', plusCellMK = '', minusCellMK = '';
          if (!checkedMK) {
            // Ausgegraut und durchgestrichen, keine Berechnung
            fachCellMK = `<td style="padding:10px 8px;color:#aaa;text-decoration:line-through;white-space:pre-line;border-bottom:1px solid #f1f3f4;">${fachMK.fach.replace(/ /g, '\n')}</td>`;
            schnittCellMK = `<td style="text-align:right;padding:10px 8px;color:#aaa;text-decoration:line-through;border-bottom:1px solid #f1f3f4;">-</td>`;
            plusCellMK = `<td style="text-align:right;padding:10px 8px;color:#aaa;border-bottom:1px solid #f1f3f4;">-</td>`;
            minusCellMK = `<td style="text-align:right;padding:10px 8px;color:#aaa;border-bottom:1px solid #f1f3f4;">-</td>`;
            rowStyleMK = 'background:#f8f9fa;';
          } else {
            const punkteMK = this.punkteFuerNote(fachMK.durchschnitt);
            let fachNameDisplayMK = fachMK.fach.replace(/ /g, '\n');
            if (punkteMK < 0) {
              fachCellMK = `<td style="padding:10px 8px;color:#dc3545;font-weight:600;white-space:pre-line;border-bottom:1px solid #f1f3f4;">${fachNameDisplayMK}</td>`;
              minusCellMK = `<td style="text-align:right;padding:10px 8px;color:#dc3545;font-weight:600;border-bottom:1px solid #f1f3f4;">${punkteMK}</td>`;
            } else {
              fachCellMK = `<td style="padding:10px 8px;white-space:pre-line;border-bottom:1px solid #f1f3f4;color:#495057;">${fachNameDisplayMK}</td>`;
              minusCellMK = `<td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f3f4;color:#6c757d;">${punkteMK < 0 ? punkteMK : '-'}</td>`;
            }
            schnittCellMK = `<td style="text-align:right;padding:10px 8px;border-bottom:1px solid #f1f3f4;color:#495057;font-weight:500;">${fachMK.durchschnitt}</td>`;
            plusCellMK = `<td style="text-align:right;padding:10px 8px;color:#28a745;font-weight:600;border-bottom:1px solid #f1f3f4;">${punkteMK > 0 ? '+'+punkteMK : '-'}</td>`;
            // Nur berechnen, wenn aktiv
            if (punkteMK > 0) plusMK += punkteMK;
            if (punkteMK < 0) minusMK += punkteMK;
            if (typeof fachMK.durchschnitt === 'number' && !isNaN(fachMK.durchschnitt)) {
              schnittSumMK += fachMK.durchschnitt;
              schnittCountMK++;
            }
          }
          htmlMK += `<tr style="${rowStyleMK}">
            <td style="text-align:center;padding:10px 8px;border-bottom:1px solid #f1f3f4;">${swMK}</td>
            ${fachCellMK}${schnittCellMK}${plusCellMK}${minusCellMK}
          </tr>`;
        }
        let schnittAvgMK = schnittCountMK > 0 ? (schnittSumMK / schnittCountMK).toFixed(2) : '-';
        htmlMK += `
              </tbody>
              <tfoot style="background: linear-gradient(135deg, #f8f9fa, #e9ecef);">
                <tr style="font-weight:600;">
                  <td style="padding:10px 8px;"></td>
                  <td style="padding:10px 8px;color:#495057;">Summe</td>
                  <td style="padding:10px 8px;"></td>
                  <td style="text-align:right;padding:10px 8px;color:#28a745;font-weight:700;">+${plusMK}</td>
                  <td style="text-align:right;padding:10px 8px;color:#dc3545;font-weight:700;">${minusMK}</td>
                </tr>`;
        let gesamtpunkteMK = plusMK + minusMK;
        let gesamtColorMK = gesamtpunkteMK < 0 ? '#dc3545' : '#28a745';
        htmlMK += `
                <tr style="font-weight:700;background:rgba(${gesamtpunkteMK < 0 ? '220,53,69' : '40,167,69'},0.1);">
                  <td style="padding:10px 8px;"></td>
                  <td colspan="2" style="padding:10px 8px;color:#495057;">🎯 Gesamtpunkte</td>
                  <td style="text-align:right;padding:10px 8px;color:${gesamtColorMK};font-size:16px;">${gesamtpunkteMK}</td>
                  <td style="padding:10px 8px;"></td>
                </tr>
                <tr style="font-weight:600;">
                  <td style="padding:10px 8px;"></td>
                  <td style="padding:10px 8px;color:#495057;">📊 Durchschnitt</td>
                  <td style="text-align:right;padding:10px 8px;color:#388e3c;font-weight:700;font-size:15px;">${schnittAvgMK}</td>
                  <td style="padding:10px 8px;"></td>
                  <td style="padding:10px 8px;"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        `;
        document.getElementById('pluspoints-table-wrap').innerHTML = htmlMK;
        // Switch-Events nachträglich binden
        for (const fachMK of notenDatenMK) {
          const idMK = 'pluspoints-switch-' + encodeURIComponent(fachMK.fach);
          const elMK = document.getElementById(idMK);
          if (!elMK) continue;
          elMK.addEventListener('change', () => {
            let hiddenFaecherMK = JSON.parse(localStorage.getItem('pluspointsHiddenFaecher') || '[]');
            if (!elMK.checked) {
              if (!hiddenFaecherMK.includes(fachMK.fach)) hiddenFaecherMK.push(fachMK.fach);
            } else {
              hiddenFaecherMK = hiddenFaecherMK.filter(fMK => fMK !== fachMK.fach);
            }
            localStorage.setItem('pluspointsHiddenFaecher', JSON.stringify(hiddenFaecherMK));
            this.renderPluspointsTable();
          });
        }
      });
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
      buttonMK.title = "Pluspunkte-Übersicht";
      buttonMK.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: white;
        border: 1px solid #388e3c;
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
      // SVG-Icon
      buttonMK.innerHTML = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="14" y="6" width="4" height="20" rx="2" fill="#388e3c"/><rect x="6" y="14" width="20" height="4" rx="2" fill="#388e3c"/></svg>`;
      
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
        // Sonst: Nur ein Panel gleichzeitig offen: schließe andere Panels und deaktiviere alle gloqws
        this.closeAllPanels();
        // Animation: Button hervorheben
        this.buttonManager.markButtonOpening(this.buttonId);
        buttonMK.style.outline = "3px solid #4afc7a";
        buttonMK.style.boxShadow = "0 0 16px 4px #4afc7a, 0 2px 8px rgba(0,0,0,0.18)";
        buttonMK.style.width = "58px";
        buttonMK.style.height = "58px";
        const btnLeftMK = parseInt(buttonMK.style.left);
        const btnTopMK = parseInt(buttonMK.style.top);
        this.openPluspointsPanelAt(btnLeftMK, btnTopMK);
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
      
      // Start watching for the improvement button
      this.startWatching();
    }
  }

  // Ensure class is available on window object immediately
  window.PluspointsButton = PluspointsButton;
  console.log('✓ PluspointsButton class registered on window object');

  // Ensure class is available on window object immediately
  window.PluspointsButton = PluspointsButton;
  console.log('✓ PluspointsButton class registered on window object');

})();
