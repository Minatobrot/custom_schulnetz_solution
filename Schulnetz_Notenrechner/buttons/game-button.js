// Game Button Component
(function() {
  'use strict';
  
  console.log('Loading GameButton script...');

  class GameButton {
    constructor(buttonManager) {
      this.buttonManager = buttonManager;
      this.buttonId = "game-overlay-btn";
      this.panelId = "game-overlay-panel";
    }

    isPanelOpen() {
      return !!document.getElementById(this.panelId);
    }

    getDefaultPosition() {
      const winWidth = window.innerWidth, winHeight = window.innerHeight;
      return {
        left: winWidth - 50 - 20, // Right edge
        top: winHeight - 50 - 200  // Above other buttons
      };
    }

    // Watch for gaps and move to fill them (Priority: bottom of vertical stack)
    startWatching() {
      const myButton = document.getElementById(this.buttonId);
      if (!myButton) return;

      // Store original position
      if (!myButton.dataset.originalTop) {
        myButton.dataset.originalTop = myButton.style.top;
      }

      const checkAndSlide = () => {
        const winH = window.innerHeight;
        
        // Define positions - same pattern as PluspointsButton
        const improvementPos = winH - 50 - 80;  // Top of stack
        const pluspointsPos = winH - 50 - 140;  // Middle of stack
        const myOriginalPos = winH - 50 - 200;  // Bottom of stack
        
        // Game button should fill gaps from bottom up, similar to pluspoints logic
        let targetPosition = myOriginalPos; // Default to original position
        
        // Check if Pluspoints button is hidden - move UP to its position
        const pluspointsButton = document.getElementById('pluspoints-overlay-btn');
        if (!pluspointsButton || pluspointsButton.style.display === 'none') {
          targetPosition = pluspointsPos; // Move UP to pluspoints position
          
          // If both pluspoints AND improvement are hidden, move to improvement position
          const improvementButton = document.getElementById('improvement-overlay-btn');
          if (!improvementButton || improvementButton.style.display === 'none') {
            targetPosition = improvementPos; // Move UP to improvement position
          }
        }
        
        myButton.style.transition = 'top 0.3s ease';
        myButton.style.top = `${targetPosition}px`;
      };

      // Check immediately and then periodically
      checkAndSlide();
      setInterval(checkAndSlide, 100);
    }

    openGamePanelAt(btnLeft, btnTop) {
      const existingPanel = document.getElementById(this.panelId);
      if (existingPanel) existingPanel.remove();
      
      const panel = document.createElement("div");
      panel.id = this.panelId;
      const panelWidth = 400, panelHeight = 500;
      
      // Position panel at bottom-right corner, offset from edge
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

      // Close button
      const closeBtn = document.createElement("button");
      closeBtn.textContent = "✕";
      closeBtn.style.cssText = `
        position: absolute;
        top: 6px;
        right: 12px;
        background: #fff;
        color: #ff6b35;
        border: 1px solid #ff6b35;
        border-radius: 50%;
        width: 26px; height: 26px;
        font-size: 15px;
        cursor: pointer;
        z-index: 10002;
      `;
      closeBtn.onclick = () => panel.remove();

      // Panel content
      const content = document.createElement('div');
      content.style.cssText = 'padding: 0; overflow-y: auto; flex: 1; display: flex; flex-direction: column;';
      content.innerHTML = `
        <div style="background: linear-gradient(135deg, #ff6b35, #f7931e); color: white; padding: 20px 18px 16px 18px; margin: 0;">
          <div style="font-size: 20px; font-weight: bold; margin-bottom: 6px;">🎮 Game Panel</div>
          <div style="font-size: 14px; opacity: 0.9;">Simple game functionality coming soon!</div>
        </div>
        <div style="padding: 18px; flex: 1; display: flex; align-items: center; justify-content: center;">
          <div style="text-align: center; color: #666;">
            <div style="font-size: 48px; margin-bottom: 16px;">🎯</div>
            <div style="font-size: 18px; font-weight: 600; margin-bottom: 8px;">Game Content</div>
            <div style="font-size: 14px;">This is where game content will be displayed</div>
          </div>
        </div>
      `;

      panel.appendChild(content);
      panel.appendChild(closeBtn);
      document.body.appendChild(panel);
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
        const panel = document.getElementById(id);
        if (panel) panel.remove();
        if (btn) {
          btn.style.outline = "none";
          btn.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          btn.style.width = "50px";
          btn.style.height = "50px";
        }
      });
    }

    checkInitialVisibility(button) {
      // Check chrome storage first, then localStorage fallback
      if (window.chrome && chrome.storage && chrome.storage.local) {
        try {
          chrome.storage.local.get(['buttonEnabled_game'], (result) => {
            if (chrome.runtime && chrome.runtime.lastError) {
              console.warn('Chrome storage error, falling back to localStorage');
              this.checkLocalStorageVisibility(button);
              return;
            }
            
            // Default to true for game button (like other buttons)
            const isEnabled = result.buttonEnabled_game !== undefined ? result.buttonEnabled_game : true;
            button.style.display = isEnabled ? 'flex' : 'none';
            console.log(`🎮 Game button visibility set to: ${isEnabled ? 'visible' : 'hidden'}`);
          });
        } catch (error) {
          console.warn('Error accessing chrome storage, using localStorage fallback:', error);
          this.checkLocalStorageVisibility(button);
        }
      } else {
        this.checkLocalStorageVisibility(button);
      }
    }

    checkLocalStorageVisibility(button) {
      try {
        const stored = localStorage.getItem('buttonEnabled_game');
        const isEnabled = stored !== null ? JSON.parse(stored) : true; // Default to true
        button.style.display = isEnabled ? 'flex' : 'none';
        console.log(`🎮 Game button visibility (localStorage) set to: ${isEnabled ? 'visible' : 'hidden'}`);
      } catch (error) {
        console.warn('Error reading from localStorage:', error);
        // Default to visible for game button
        button.style.display = 'flex';
      }
    }

    create() {
      if (document.getElementById(this.buttonId)) return;
      
      const position = this.getDefaultPosition();
      const button = document.createElement("button");
      button.id = this.buttonId;
      button.title = "Game Panel";
      button.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: white;
        border: 1px solid #ff6b35;
        border-radius: 10px;
        cursor: pointer;
        z-index: 10000;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        display: none;
        align-items: center; 
        justify-content: center;
        left: ${position.left}px; top: ${position.top}px;
        overflow: visible;
        padding: 0;
        transition: box-shadow 0.25s, outline 0.25s, width 0.25s, height 0.25s, transform 0.15s;
      `;

      // Game controller SVG icon
      button.innerHTML = `
        <svg width="28" height="28" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M8 12C6.89543 12 6 12.8954 6 14V18C6 19.1046 6.89543 20 8 20H24C25.1046 20 26 19.1046 26 18V14C26 12.8954 25.1046 12 24 12H8Z" stroke="#ff6b35" stroke-width="2" fill="none"/>
          <circle cx="10" cy="16" r="1.5" fill="#ff6b35"/>
          <circle cx="22" cy="14" r="1.5" fill="#ff6b35"/>
          <circle cx="24" cy="16" r="1.5" fill="#ff6b35"/>
          <rect x="14" y="8" width="4" height="2" rx="1" fill="#ff6b35"/>
          <rect x="14" y="22" width="4" height="2" rx="1" fill="#ff6b35"/>
        </svg>
      `;
      
      // Register with button manager
      this.buttonManager.registerButton(this.buttonId, button, {});
      
      // Check if button should be enabled based on stored settings
      this.checkInitialVisibility(button);
      
      button.addEventListener("click", (e) => {
        // If panel is open: close it and remove glow
        if (this.isPanelOpen()) {
          const panel = document.getElementById(this.panelId);
          if (panel) panel.remove();
          button.style.outline = "none";
          button.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          button.style.width = "50px";
          button.style.height = "50px";
          return;
        }
        
        // Close all other panels and remove their glows
        this.closeAllPanels();
        
        // Animate button: make it bigger and add glow
        this.buttonManager.markButtonOpening(this.buttonId);
        button.style.outline = "3px solid #ff9d7a";
        button.style.boxShadow = "0 0 16px 4px #ff9d7a, 0 2px 8px rgba(0,0,0,0.18)";
        button.style.width = "58px";
        button.style.height = "58px";
        
        const btnLeft = parseInt(button.style.left);
        const btnTop = parseInt(button.style.top);
        this.openGamePanelAt(btnLeft, btnTop);
      });
      
      // Reset button style when panel is closed externally
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
      
      // Start watching for positioning gaps
      this.startWatching();
    }
  }

  // Make class available on window object
  window.GameButton = GameButton;
  console.log('✓ GameButton class registered on window object');

})();