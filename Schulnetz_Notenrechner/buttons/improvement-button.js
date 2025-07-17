// Improvement Button Component
(function() {
  'use strict';
  
  console.log('Loading ImprovementButton script...');

  class ImprovementButton {
    constructor(buttonManager) {
      this.buttonManager = buttonManager;
      this.buttonId = "improvement-overlay-btn";
      this.panelId = "improvement-overlay-panel";
    }

    isPanelOpen() {
      return !!document.getElementById(this.panelId);
    }

    getDefaultPosition() {
      const winW = window.innerWidth, winH = window.innerHeight;
      return {
        left: winW - 50 - 20, // Right edge
        top: winH - 50 - 80   // Above pluspoints button
      };
    }

    // Watch for gaps and move to fill them (Priority: lowest in stack)
    startWatching() {
      const myButton = document.getElementById(this.buttonId);
      if (!myButton) return;

      // Store original position
      if (!myButton.dataset.originalTop) {
        myButton.dataset.originalTop = myButton.style.top;
      }

      const checkAndSlide = () => {
        const winH = window.innerHeight;
        
        // Improvement button has LOWEST priority (farthest from gamification)
        // Can move down to fill gaps from Pluspoints or Game buttons
        const pluspointsPos = winH - 50 - 140;   // Middle of stack
        const gamePos = winH - 50 - 200;         // Bottom of stack
        const myOriginalPos = parseInt(myButton.dataset.originalTop);
        
        // Improvement button should STAY in its position (anchor for vertical stack)
        const targetPosition = myOriginalPos;
        
        myButton.style.transition = 'top 0.3s ease';
        myButton.style.top = `${targetPosition}px`;
        
        myButton.style.transition = 'top 0.3s ease';
        myButton.style.top = `${targetPosition}px`;
      };

      // Check immediately and then periodically
      checkAndSlide();
      setInterval(checkAndSlide, 100);
    }

    loadNotenDaten(cb) {
      if (window.chrome && chrome.storage && chrome.storage.local) {
        chrome.storage.local.get(['notenDaten'], res => {
          if (res && Array.isArray(res.notenDaten)) cb(res.notenDaten);
          else {
            try {
              const arr = JSON.parse(localStorage.getItem('notenDaten'));
              if (Array.isArray(arr)) cb(arr); else cb([]);
            } catch { cb([]); }
          }
        });
      } else {
        try {
          const arr = JSON.parse(localStorage.getItem('notenDaten'));
          if (Array.isArray(arr)) cb(arr); else cb([]);
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
        const p = document.getElementById(id);
        if (p) p.remove();
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
      
      const position = this.getDefaultPosition();
      const button = document.createElement("button");
      button.id = this.buttonId;
      button.title = "Chancen und Risiken";
      button.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: white;
        border: 1px solid #ff5722;
        border-radius: 10px;
        cursor: pointer;
        z-index: 10000;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        display: flex; align-items: center; justify-content: center;
        left: ${position.left}px; top: ${position.top}px;
        overflow: visible;
        padding: 0;
        transition: box-shadow 0.25s, outline 0.25s, width 0.25s, height 0.25s;
      `;
      // Trend Chart SVG Icon (Zeigt sowohl positive als auch negative Trends)
      button.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><circle cx="14" cy="14" r="12" fill="#ff5722"/><path d="M7 12l4 4 3-3 7-7" stroke="#fff" stroke-width="2" fill="none"/><path d="M7 16l4-4 3 3 7 7" stroke="#fff" stroke-width="2" fill="none"/></svg>`;
      
      // Register with button manager
      this.buttonManager.registerButton(this.buttonId, button, {});
      
      button.addEventListener("click", (e) => {
        // Wenn Panel offen: schließe es und entferne Glow
        if (this.isPanelOpen()) {
          const p = document.getElementById(this.panelId);
          if (p) p.remove();
          button.style.outline = "none";
          button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          button.style.width = "50px";
          button.style.height = "50px";
          return;
        }
        // Nur ein Panel gleichzeitig offen
        this.closeAllPanels();
        // Animation: Button hervorheben (rot-orange)
        this.buttonManager.markButtonOpening(this.buttonId);
        button.style.outline = "3px solid #ff8a65";
        button.style.boxShadow = "0 0 16px 4px #ff8a65, 0 2px 8px rgba(0,0,0,0.18)";
        button.style.width = "58px";
        button.style.height = "58px";
        
        this.createPanel(button);
      });
      
      document.addEventListener("click", (e) => {
        const panel = document.getElementById(this.panelId);
        if (!panel && button.style.outline !== "none") {
          button.style.outline = "none";
          button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          button.style.width = "50px";
          button.style.height = "50px";
        }
      }, true);
      
      document.body.appendChild(button);
      
      // Start watching for the game button
      this.startWatching();
    }

    createPanel(button) {
      const panel = document.createElement("div");
      panel.id = this.panelId;
      const panelWidth = 420, panelHeight = 480;
      const btnLeft = parseInt(button.style.left);
      const btnTop = parseInt(button.style.top);

      // Position panel at bottom-right corner, 60px up and 60px left from corner
      const panelLeft = window.innerWidth - panelWidth - 75;
      const panelTop = window.innerHeight - panelHeight - 80;
      
      panel.style.cssText = `
        position: fixed;
        left: ${panelLeft}px;
        top: ${panelTop}px;
        width: ${panelWidth}px;
        height: ${panelHeight}px;
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
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.style.cssText = `
        position: absolute;
        top: 6px;
        right: 12px;
        background: #fff;
        color: #ff5722;
        border: 1px solid #ff5722;
        border-radius: 50%;
        width: 26px; height: 26px;
        font-size: 15px;
        cursor: pointer;
        z-index: 10002;
      `;
      closeBtn.onclick = () => panel.remove();
      
      // Panel-Inhalt
      const content = document.createElement('div');
      content.style.cssText = 'padding: 18px 18px 12px 18px; overflow-y: auto; flex: 1;';
      content.innerHTML = `
        <b style="font-size:18px;color:#ff5722;">📈 Chancen und Risiken</b>
        <div style="margin-top:12px;" id="improvement-content"></div>
      `;
      
      panel.appendChild(content);
      panel.appendChild(closeBtn);
      document.body.appendChild(panel);

      // Load and render improvement data
      this.renderImprovementPanel();
    }

    renderImprovementPanel() {
      this.loadNotenDaten((notenDaten) => {
        const out = document.getElementById('improvement-content');
        if (!notenDaten || !notenDaten.length) {
          out.innerHTML = '<div style="color:#888;">Keine Noten gefunden.</div>';
          return;
        }
        
        // Für alle Fächer: Verbesserungs- und Verschlechterungschancen suchen
        let improvementItems = [];
        let riskItems = [];
        let allEinzelnoten = [];
        let bestNote = null, worstNote = null, bestFach = '', worstFach = '', bestTest = '', worstTest = '';
        
        for (const fach of notenDaten) {
          if (!fach.noten || !fach.noten.length) continue;
          const grades = fach.noten;
          const weights = fach.gewichtung || grades.map(() => 1); // Default weight 1 if no weighting
          
          // Einzelnoten sammeln
          grades.forEach((n, idx) => {
            allEinzelnoten.push({ note: n, fach: fach.fach, idx: idx });
            if (bestNote === null || n > bestNote) {
              bestNote = n;
              bestFach = fach.fach;
              bestTest = `Test ${idx+1}`;
            }
            if (worstNote === null || n < worstNote) {
              worstNote = n;
              worstFach = fach.fach;
              worstTest = `Test ${idx+1}`;
            }
          });
          
          const examNames = grades.map((_, i) => `Test ${i+1}`);
          
          // Gewichteten Durchschnitt berechnen
          const weightedSum = grades.reduce((sum, grade, idx) => sum + (grade * weights[idx]), 0);
          const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
          const currentAvg = weightedSum / totalWeight;
          const decimal = currentAvg % 1;
          
          // Verbesserungschancen berechnen
          let nextImprovementThreshold;
          if (decimal < 0.25) {
            nextImprovementThreshold = Math.floor(currentAvg) + 0.25;
          } else if (decimal < 0.75) {
            nextImprovementThreshold = Math.floor(currentAvg) + 0.75;
          } else {
            nextImprovementThreshold = Math.ceil(currentAvg) + 0.25;
          }
          
          // Verschlechterungsrisiken berechnen
          let nextRiskThreshold;
          if (decimal <= 0.25) {
            nextRiskThreshold = Math.floor(currentAvg) - 0.25;
          } else if (decimal <= 0.75) {
            nextRiskThreshold = Math.floor(currentAvg) + 0.25;
          } else {
            nextRiskThreshold = Math.floor(currentAvg) + 0.75;
          }
          
          // Verbesserungschancen prüfen
          const distanceToImprovement = Math.abs(currentAvg - nextImprovementThreshold);
          if (distanceToImprovement <= 0.20) {
            // Annahme: nächste Klassenarbeit hat Gewichtung 1 (kann angepasst werden)
            const newExamWeight = 1;
            const newTotalWeight = totalWeight + newExamWeight;
            // Benötigte Note: (Ziel * neues Gesamtgewicht - aktuelle gewichtete Summe) / Gewichtung der neuen Arbeit
            const requiredGrade = (nextImprovementThreshold * newTotalWeight - weightedSum) / newExamWeight;
            
            if (requiredGrade <= 6.0) {
              improvementItems.push({
                subject: fach.fach,
                currentAverage: currentAvg,
                nextThreshold: nextImprovementThreshold,
                requiredGrade: requiredGrade,
                numExams: grades.length,
                grades: grades.map((g, i) => `${examNames[i]}: ${g} (×${weights[i]})`).join(', '),
                newExamWeight: newExamWeight
              });
            }
          }
          
          // Verschlechterungsrisiken prüfen
          const distanceToRisk = Math.abs(currentAvg - nextRiskThreshold);
          if (distanceToRisk <= 0.20 && nextRiskThreshold > 0) {
            // Annahme: nächste Klassenarbeit hat Gewichtung 1
            const newExamWeight = 1;
            const newTotalWeight = totalWeight + newExamWeight;
            // Schlechteste Note ohne Verschlechterung
            const dangerousGrade = (nextRiskThreshold * newTotalWeight - weightedSum) / newExamWeight;
            
            if (dangerousGrade >= 1.0) {
              riskItems.push({
                subject: fach.fach,
                currentAverage: currentAvg,
                nextThreshold: nextRiskThreshold,
                dangerousGrade: dangerousGrade,
                numExams: grades.length,
                grades: grades.map((g, i) => `${examNames[i]}: ${g} (×${weights[i]})`).join(', '),
                newExamWeight: newExamWeight
              });
            }
          }
        }
        
        let html = '';
        
        // Verbesserungschancen Sektion
        html += '<div style="margin-bottom: 20px;">';
        html += '<h3 style="color:#4caf50; margin: 0 0 10px 0; font-size: 16px;">🟢 Verbesserungschancen</h3>';
        if (!improvementItems.length) {
          html += '<div style="color:#888; font-style: italic;">Keine Verbesserungschancen erkannt.</div>';
        } else {
          html += improvementItems.map(grade => `
            <div style="margin: 8px 0; padding: 8px; background-color: #e8f5e8; border-radius: 6px; border:1px solid #c8e6c9;">
              <b>${grade.subject}</b><br>
              Gewichteter Schnitt: <b>${grade.currentAverage.toFixed(2)}</b> → Ziel: <b>${grade.nextThreshold.toFixed(2)}</b><br>
              <span style="color:#666;font-size:12px;">
                Bisherige Noten: ${grade.grades}<br>
                Benötigte Note im nächsten Test (×${grade.newExamWeight}): <b style="color:#4caf50;">${Math.min(6, grade.requiredGrade).toFixed(2)}</b>
              </span>
            </div>
          `).join('');
        }
        html += '</div>';
        
        // Verschlechterungsrisiken Sektion
        html += '<div style="margin-bottom: 20px;">';
        html += '<h3 style="color:#f44336; margin: 0 0 10px 0; font-size: 16px;">🔴 Verschlechterungsrisiken</h3>';
        if (!riskItems.length) {
          html += '<div style="color:#888; font-style: italic;">Keine Verschlechterungsrisiken erkannt.</div>';
        } else {
          html += riskItems.map(risk => `
            <div style="margin: 8px 0; padding: 8px; background-color: #ffebee; border-radius: 6px; border:1px solid #ffcdd2;">
              <b>${risk.subject}</b><br>
              Gewichteter Schnitt: <b>${risk.currentAverage.toFixed(2)}</b> → Risiko: <b>${risk.nextThreshold.toFixed(2)}</b><br>
              <span style="color:#666;font-size:12px;">
                Bisherige Noten: ${risk.grades}<br>
                Schlechteste Note ohne Verschlechterung (×${risk.newExamWeight}): <b style="color:#f44336;">${Math.max(1, risk.dangerousGrade).toFixed(2)}</b>
              </span>
            </div>
          `).join('');
        }
        html += '</div>';
        
        // Beste und schlechteste Einzelnote anzeigen
        if (allEinzelnoten.length > 0) {
          html += `
            <div style="margin-top:18px;padding:8px 8px 6px 8px;border-top:1px solid #e0e0e0;color:#444;font-size:14px;">
              <b>Beste Einzelnote:</b> <span style="color:#388e3c;">${bestNote.toFixed(2)}</span> (${bestFach}, ${bestTest})<br>
              <b>Schlechteste Einzelnote:</b> <span style="color:#c62828;">${worstNote.toFixed(2)}</span> (${worstFach}, ${worstTest})
            </div>
          `;
        }
        
        out.innerHTML = html;
      });
    }
  }

  // Ensure class is available on window object immediately
  window.ImprovementButton = ImprovementButton;
  console.log('✓ ImprovementButton class registered on window object');

})();
