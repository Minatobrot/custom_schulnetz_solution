// Gamification Button Component
(function() {
  'use strict';
  
  console.log('Loading GamificationButton script...');

  class GamificationButton {
    constructor(buttonManager) {
      this.buttonManager = buttonManager;
      this.buttonId = "gamification-overlay-btn";
      this.panelId = "gamification-overlay-panel";
      
      // Achievement system data
      this.subjectsByCategory = {
        naturwissenschaften: ["Biologie", "Bio", "Chemie", "Chem", "Physik", "Phys", "Mathematik", "Mathe", "Math", "Informatik", "Info", "Computer"],
        sprache: ["Deutsch", "DE", "Englisch", "EN", "English", "Französisch", "FR", "Francais", "Spanisch", "ES", "Español", "Latein", "LA", "Latin"],
        gesellschaft: ["Geografie", "Geographie", "GG", "Geo", "Geschichte", "Hist", "History", "Wirtschaft und Recht", "WuR", "Wirtschaft", "Recht"],
        kunst: ["Bildnerisches Gestalten", "BG", "Kunst", "Art", "Musik", "Mus", "Music", "Theater", "Drama"],
        sport: ["Sport", "SP", "Sports", "Schulsport", "Leichtathletik"],
        wahlfaecher: ["Projektarbeit", "Projekt", "Ergänzungsfach", "EF", "Schach", "Chess"]
      };
    }

    isPanelOpen() {
      return !!document.getElementById(this.panelId);
    }

    getDefaultPosition() {
      const winWMK = window.innerWidth, winHMK = window.innerHeight;
      return {
        left: winWMK - 50 - 20, // Right edge
        top: winHMK - 50 - 20   // Bottom right
      };
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

    getFachKategorie(fachNameMK) {
      for (const [kategorieMK, faecherMK] of Object.entries(this.subjectsByCategory)) {
        for (const fachMK of faecherMK) {
          if (fachNameMK.toLowerCase().includes(fachMK.toLowerCase())) {
            return kategorieMK;
          }
        }
      }
      return 'sonstige';
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
      buttonMK.title = "Achievements";
      buttonMK.style.cssText = `
        position: fixed;
        width: 50px;
        height: 50px;
        background: #fff;
        color: white;
        border: 1px solid #ffb300;
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
      // Pokal-Icon
      buttonMK.innerHTML = `<svg width="28" height="28" viewBox="0 0 28 28" fill="none"><rect width="28" height="28" rx="14" fill="#ffb300"/><path d="M9 8h10v3a5 5 0 01-10 0V8z" fill="#fff"/><rect x="12" y="18" width="4" height="4" rx="2" fill="#fff"/></svg>`;
      
      // Register with button manager
      this.buttonManager.registerButton(this.buttonId, buttonMK, {});
      
      buttonMK.addEventListener("click", (eMK) => {
        if (this.isPanelOpen()) {
          const pMK = document.getElementById(this.panelId);
          if (pMK) pMK.remove();
          buttonMK.style.outline = "none";
          buttonMK.style.boxShadow = "0 2px 8px rgba(0,0,0,0.18)";
          buttonMK.style.width = "50px";
          buttonMK.style.height = "50px";
          return;
        }
        // Nur ein Panel gleichzeitig offen
        this.closeAllPanels();
        // Animation: Button hervorheben (gold)
        this.buttonManager.markButtonOpening(this.buttonId);
        buttonMK.style.outline = "3px solid #ffe082";
        buttonMK.style.boxShadow = "0 0 16px 4px #ffe082, 0 2px 8px rgba(0,0,0,0.18)";
        buttonMK.style.width = "58px";
        buttonMK.style.height = "58px";
        
        this.createPanel(buttonMK);
      });
      
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
    }

    createPanel(buttonMK) {
      const panelMK = document.createElement("div");
      panelMK.id = this.panelId;
      const panelWidthMK = 520, panelHeightMK = 580;
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
        color: #ffb300;
        border: 1px solid #ffb300;
        border-radius: 50%;
        width: 26px; height: 26px;
        font-size: 15px;
        cursor: pointer;
        z-index: 10002;
      `;
      closeBtnMK.onclick = () => panelMK.remove();
      
      // Panel-Inhalt
      const contentMK = document.createElement('div');
      contentMK.style.cssText = 'padding: 18px 18px 12px 18px; overflow-y: auto; flex: 1;';
      contentMK.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; margin-right: 35px;">
          <b style="font-size:18px;color:#ffb300;">🏆 Achievements</b>
          <div id="achievement-counter" style="font-size:14px;color:#666;background:#f5f5f5;padding:4px 8px;border-radius:8px;font-weight:bold;">
            0 / 0
          </div>
        </div>
        
        <div style="font-size: 12px; color: #888; margin-bottom: 10px; padding: 8px; background: #f0f8ff; border-radius: 6px; border-left: 3px solid #ffb300;">
          💡 <strong>Tipp:</strong> Bewege die Maus über ein Achievement oder klicke darauf, um zu erfahren, wie du es erreicht hast!
        </div>
        
        <!-- Category Filter Tabs -->
        <div id="achievement-categories" style="display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 15px; border-bottom: 2px solid #f0f0f0; padding-bottom: 10px;">
          <button class="category-tab active" data-category="all" style="padding: 6px 12px; border: 1px solid #ffb300; background: #ffb300; color: white; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            Alle
          </button>
          <button class="category-tab" data-category="erste_schritte" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            🚀 Start
          </button>
          <button class="category-tab" data-category="noten" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            📝 Noten
          </button>
          <button class="category-tab" data-category="bestehen" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            ✅ Bestehen
          </button>
          <button class="category-tab" data-category="verbesserung" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            📈 Progress
          </button>
          <button class="category-tab" data-category="durchschnitt" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            📊 Schnitt
          </button>
          <button class="category-tab" data-category="perfektion" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            💎 Perfektion
          </button>
          <button class="category-tab" data-category="faecher" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            📚 Fächer
          </button>
          <button class="category-tab" data-category="kategorien" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            🌈 Kategorien
          </button>
          <button class="category-tab" data-category="genie" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            🧠 Genie
          </button>
          <button class="category-tab" data-category="besondere" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            🌟 Besondere
          </button>
          <button class="category-tab" data-category="motivation" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            💪 Motivation
          </button>
          <button class="category-tab" data-category="spezial" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            🎉 Spezial
          </button>
          <button class="category-tab" data-category="secret" style="padding: 6px 12px; border: 1px solid #ffb300; background: white; color: #ffb300; border-radius: 15px; font-size: 12px; cursor: pointer; transition: all 0.2s;">
            🔒 Secret
          </button>
        </div>
        
        <div id="gamification-content" style="flex: 1; overflow-y: auto;">
          <!-- Achievement content will be injected here -->
        </div>
      `;
      
      panelMK.appendChild(contentMK);
      panelMK.appendChild(closeBtnMK);
      document.body.appendChild(panelMK);

      // Initialize achievements system
      this.initializeAchievements();
    }

    initializeAchievements() {
      // Load achievements and render
      this.loadNotenDaten((notenDatenMK) => {
        this.renderAchievements(notenDatenMK);
      });
    }

    getAchievementDefinitions() {
      return [
        // === ERSTE SCHRITTE & BASIC ACHIEVEMENTS ===
        { id: "firstTest", icon: "📝", text: () => "Erste Note eingetragen - Der Anfang ist gemacht!", difficulty: "easy", category: "erste_schritte" },
        { id: "firstStep", icon: "👣", text: () => "Erster Test geschrieben - Du bist gestartet!", difficulty: "easy", category: "erste_schritte" },
        { id: "tenGrades", icon: "📚", text: () => "10 Noten gesammelt - Du bleibst dran!", difficulty: "easy", category: "erste_schritte" },
        { id: "twentyGrades", icon: "🏆", text: () => "20 Noten gesammelt - Fleißig dabei!", difficulty: "medium", category: "erste_schritte" },
        { id: "survival", icon: "⛺", text: () => "Ein ganzes Semester durchgehalten - Respekt!", difficulty: "easy", category: "erste_schritte" },
        
        // === NOTE FÜR NOTE ACHIEVEMENTS ===
        { id: "first1", icon: "😢", text: (fach) => `Erste 1.0 erreicht${fach ? " ("+fach+")" : ""} - Das wird besser!`, difficulty: "easy", category: "noten" },
        { id: "first15", icon: "😔", text: (fach) => `Erste 1.5 erreicht${fach ? " ("+fach+")" : ""} - Aufwärts geht's!`, difficulty: "easy", category: "noten" },
        { id: "first2", icon: "😬", text: (fach) => `Erste 2.0 erreicht${fach ? " ("+fach+")" : ""} - Noch Luft nach oben!`, difficulty: "easy", category: "noten" },
        { id: "first25", icon: "😰", text: (fach) => `Erste 2.5 erreicht${fach ? " ("+fach+")" : ""} - Schritt für Schritt!`, difficulty: "easy", category: "noten" },
        { id: "first3", icon: "😅", text: (fach) => `Erste 3.0 erreicht${fach ? " ("+fach+")" : ""} - Geht in die richtige Richtung!`, difficulty: "easy", category: "noten" },
        { id: "first35", icon: "😐", text: (fach) => `Erste 3.5 erreicht${fach ? " ("+fach+")" : ""} - Fast geschafft!`, difficulty: "easy", category: "noten" },
        { id: "first4", icon: "🙂", text: (fach) => `Erste 4.0 erreicht${fach ? " ("+fach+")" : ""} - Bestanden!`, difficulty: "easy", category: "noten" },
        { id: "first45", icon: "😊", text: (fach) => `Erste 4.5 erreicht${fach ? " ("+fach+")" : ""} - Gut gemacht!`, difficulty: "easy", category: "noten" },
        { id: "first5", icon: "😃", text: (fach) => `Erste 5.0 erreicht${fach ? " ("+fach+")" : ""} - Sehr gut!`, difficulty: "medium", category: "noten" },
        { id: "first55", icon: "🥇", text: (fach) => `Erste 5.5 erreicht${fach ? " ("+fach+")" : ""} - Exzellent!`, difficulty: "medium", category: "noten" },
        { id: "soNahSoFern", icon: "😤", text: (fach) => `So nah und doch so fern${fach ? " ("+fach+")" : ""} - Fast die Perfektion!`, difficulty: "medium", category: "noten" },
        { id: "first6", icon: "🏆", text: (fach) => `Erste 6.0 erreicht${fach ? " ("+fach+")" : ""} - Perfekt!`, difficulty: "medium", category: "noten" },
        { id: "overSix", icon: "🚀", text: (fach) => `Über 6.0 erreicht${fach ? " ("+fach+")" : ""} - Du brichst das System!`, difficulty: "hard", category: "noten" },
        
        // === BESTEHEN & VERSAGEN ===
        { id: "barelyPassed", icon: "🫣", text: (fach) => `Knapp bestanden in ${fach} - Aber bestanden ist bestanden!`, difficulty: "easy", category: "bestehen" },
        { id: "noFailFirstThree", icon: "🧱", text: () => "Die ersten 3 Noten alle bestanden - Starker Start!", difficulty: "easy", category: "bestehen" },
        { id: "fiveWithoutFail", icon: "🎯", text: () => "5 Tests in Folge bestanden - Konstante Leistung!", difficulty: "medium", category: "bestehen" },
        { id: "allTestsPassed", icon: "🟢", text: () => "Alle Tests bestanden - Kein einziger Durchfall!", difficulty: "medium", category: "bestehen" },
        { id: "noBelow4", icon: "🧗‍♂️", text: () => "Keine Note unter 4.0 - Immer bestanden!", difficulty: "hard", category: "bestehen" },
        { id: "noBelow5", icon: "🦸‍♂️", text: () => "Keine Note unter 5.0 - Durchweg stark!", difficulty: "hard", category: "bestehen" },
        
        // Fail Achievements
        { id: "legendaryFail", icon: "💀", text: (fach) => `Legendäre 1.0 in ${fach} geschafft`, difficulty: "easy", category: "bestehen" },
        { id: "fiveBelow4", icon: "⚠️", text: () => "5 Tests unter 4.0. Zeit für einen Strategiewechsel!", difficulty: "easy", category: "bestehen" },
        { id: "paperCollector", icon: "📉", text: () => "3 Tests vergeigt, aber sammeln ist auch ein Hobby!", difficulty: "easy", category: "bestehen" },
        { id: "tryRestart", icon: "🔄", text: () => "Letzte 3 Noten unter 4.0, Wetter zu schön?", difficulty: "easy", category: "bestehen" },
        
        // === VERBESSERUNG & PROGRESS ===
        { id: "firstImprovement", icon: "📈", text: (fach) => `Erste Verbesserung in ${fach} - Der Trend stimmt!`, difficulty: "medium", category: "verbesserung" },
        { id: "youImproved", icon: "🌱", text: (fach) => `Verbesserung in ${fach} - Schritt für Schritt vorwärts!`, difficulty: "easy", category: "verbesserung" },
        { id: "comeback", icon: "🔄", text: (fach) => `Comeback in ${fach} - Eine ganze Note besser!`, difficulty: "medium", category: "verbesserung" },
        { id: "comebackKid", icon: "🔁", text: (fach) => `Echtes Comeback in ${fach} - 2+ Punkte Verbesserung!`, difficulty: "medium", category: "verbesserung" },
        { id: "threeInARow", icon: "🚀", text: (fach) => `3x hintereinander verbessert in ${fach} - Rakete!`, difficulty: "medium", category: "verbesserung" },
        { id: "allTestsImproved", icon: "🚀", text: () => "Jede Note besser als die vorherige - Perfekte Kurve!", difficulty: "hard", category: "verbesserung" },
        { id: "allSubjectsImproved", icon: "🌠", text: () => "In jedem Fach mindestens einmal verbessert - Rundumtalent!", difficulty: "hard", category: "verbesserung" },
        { id: "finishedStrong", icon: "🏁", text: () => "Letzte Note ist die beste - Starkes Finish!", difficulty: "medium", category: "verbesserung" },
        
        // === DURCHSCHNITTE & STATISTIKEN ===
        { id: "perfectlyMid", icon: "🫡", text: () => "Exakt 4.0 Durchschnitt - Perfekte Balance!", difficulty: "easy", category: "durchschnitt" },
        { id: "almostThere", icon: "📊", text: () => "Schnitt bei 4.9 - So nah am Ziel!", difficulty: "medium", category: "durchschnitt" },
        { id: "avgAbove5", icon: "🎯", text: () => "Gesamtdurchschnitt über 5.0 - Stark!", difficulty: "hard", category: "durchschnitt" },
        { id: "avgAbove52", icon: "📈", text: () => "Schnitt über 5.2 - Sehr stark!", difficulty: "hard", category: "durchschnitt" },
        { id: "avgAbove59", icon: "🔥", text: () => "Schnitt über 5.9 - Fast perfekt!", difficulty: "hard", category: "durchschnitt" },
        
        // === SPEZIELLE LEISTUNGEN ===
        { id: "allPerfect", icon: "👑", text: () => "Überall nur 6.0 - Der absolute Wahnsinn!", difficulty: "hard", category: "perfektion" },
        { id: "five6", icon: "🌟", text: () => "5x Note 6.0 erreicht - Sterne am Himmel!", difficulty: "hard", category: "perfektion" },
        { id: "ten6", icon: "⭐", text: () => "10x Note 6.0 erreicht - Du bist ein Stern!", difficulty: "hard", category: "perfektion" },
        { id: "perfectScore", icon: "💎", text: () => "Perfekte 6.0 in allen Fächern - Diamant!", difficulty: "hard", category: "perfektion" },
        { id: "doubleSix", icon: "🎉", text: () => "Zweimal 6.0 im Semester - Doppelt hält besser!", difficulty: "medium", category: "perfektion" },
        { id: "three6InRow", icon: "💥", text: () => "3x hintereinander eine 6.0 - Unstoppable!", difficulty: "hard", category: "perfektion" },
        { id: "highConsistency", icon: "💎", text: () => "Alle Noten zwischen 5.5 und 6.0, besser geht es wohl kaum", difficulty: "hard", category: "perfektion" },
        
        // === FACH-ÜBERGREIFEND ===
        { id: "allAbove4", icon: "🌟", text: () => "Alle Fächer über 4.0 - Rundumtalent!", difficulty: "medium", category: "faecher" },
        { id: "allAbove5", icon: "🥇", text: () => "Alle Fächer über 5.0 - Genie!", difficulty: "hard", category: "faecher" },
        { id: "allAbove55", icon: "🔝", text: () => "Alle Fächer über 5.5 - Ausnahmetalent!", difficulty: "hard", category: "faecher" },
        { id: "all5", icon: "✨", text: () => "In allen Fächern mindestens eine 5.0 - Vielseitig!", difficulty: "medium", category: "faecher" },
        { id: "all6", icon: "💎", text: () => "In allen Fächern mindestens eine 6.0 - Diamant!", difficulty: "hard", category: "faecher" },
        { id: "fiveSubjectsAbove5", icon: "🏅", text: () => "5 Fächer mit Schnitt über 5.0 - Top-Performer!", difficulty: "medium", category: "faecher" },
        { id: "threeFachOver5", icon: "📚", text: () => "3 Fächer mit Schnitt über 5.0 - Starke Basis!", difficulty: "medium", category: "faecher" },
        
        // === KATEGORIEN-ACHIEVEMENTS ===
        // Naturwissenschaften
        { id: "naturwissenschaftenStart", icon: "🔬", text: () => "Naturwissenschaften-Start: Erste 4.0 in einer Naturwissenschaft!", difficulty: "easy", category: "kategorien" },
        { id: "naturwissenschaftenGut", icon: "🧪", text: () => "Naturwissenschaften-Talent: 3 Naturwissenschaften über 4.5!", difficulty: "medium", category: "kategorien" },
        { id: "naturwissenschaftenMaster", icon: "⚛️", text: () => "Naturwissenschaften-Master: Alle Naturwissenschaften über 5.0!", difficulty: "hard", category: "kategorien" },
        { id: "mathGenie", icon: "🧮", text: () => "Mathe-Genie: Mathematik über 5.5!", difficulty: "medium", category: "kategorien" },
        { id: "mathStart", icon: "➕", text: () => "Mathe-Start: Erste 4.0 in Mathematik - Zahlen-Freund!", difficulty: "easy", category: "kategorien" },
        { id: "naturFreund", icon: "🌿", text: () => "Naturfreund: Biologie über 5.0!", difficulty: "medium", category: "kategorien" },
        
        // Sprachen
        { id: "sprachStart", icon: "📝", text: () => "Sprach-Start: Erste 4.0 in einer Sprache!", difficulty: "easy", category: "kategorien" },
        { id: "sprachtalent", icon: "📖", text: () => "Sprachtalent: 2 Sprachen über 5.0!", difficulty: "medium", category: "kategorien" },
        { id: "sprachgenie", icon: "📚", text: () => "Sprachgenie: Alle Sprachen über 5.0!", difficulty: "hard", category: "kategorien" },
        { id: "sprachWunder", icon: "🗣️", text: () => "Sprachwunder: Deutsch und eine Fremdsprache über 5.0!", difficulty: "medium", category: "kategorien" },
        { id: "deutschStart", icon: "🇩🇪", text: () => "Deutsch-Start: Erste 4.0 in Deutsch!", difficulty: "easy", category: "kategorien" },
        { id: "englischStart", icon: "🇬🇧", text: () => "Englisch-Start: Erste 4.0 in Englisch!", difficulty: "easy", category: "kategorien" },
        { id: "franzoesischStart", icon: "🇫🇷", text: () => "Französisch-Start: Erste 4.0 in Französisch!", difficulty: "easy", category: "kategorien" },
        { id: "franzoesischFail", icon: "🥖", text: () => "Französisch unter 3.0 - C'est la vie!", difficulty: "easy", category: "secret" },
        { id: "franzoesischPerfect", icon: "🗼", text: () => "Französisch über 5.5 - Très bien!", difficulty: "medium", category: "kategorien" },
        { id: "franzoesischPrononciation", icon: "🎭", text: () => "Französisch-Aussprache war... kreativ!", difficulty: "easy", category: "secret" },
        { id: "bonjour", icon: "👋", text: () => "'Bonjour' war das einzige französische Wort, das ich kannte!", difficulty: "easy", category: "secret" },
        
        // Gesellschaft
        { id: "gesellschaftStart", icon: "🌍", text: () => "Gesellschafts-Start: Erste 4.0 in einem Gesellschaftsfach!", difficulty: "easy", category: "kategorien" },
        { id: "gesellschaftskenner", icon: "🏛️", text: () => "Gesellschaftskenner: 2 Gesellschaftsfächer über 4.5!", difficulty: "medium", category: "kategorien" },
        { id: "gesellschaftsexperte", icon: "📜", text: () => "Gesellschaftsexperte: Alle Gesellschaftsfächer über 5.0!", difficulty: "hard", category: "kategorien" },
        { id: "geschichtsBuff", icon: "🏺", text: () => "Geschichts-Buff: Geschichte über 5.0!", difficulty: "medium", category: "kategorien" },
        
        // Kunst & Kreativität
        { id: "kunstStart", icon: "🎨", text: () => "Kunst-Start: Erste 4.0 in einem Kunstfach!", difficulty: "easy", category: "kategorien" },
        { id: "kreativ", icon: "🎭", text: () => "Kreativ: 2 Kunstfächer über 4.5!", difficulty: "medium", category: "kategorien" },
        { id: "kuenstler", icon: "🖼️", text: () => "Künstler: Alle Kunstfächer über 5.0!", difficulty: "hard", category: "kategorien" },
        { id: "kunstKenner", icon: "🎪", text: () => "Kunstkenner: Bildnerisches Gestalten über 5.0!", difficulty: "medium", category: "kategorien" },
        
        // Sport
        { id: "sportStart", icon: "🏃", text: () => "Sport-Start: Erste 4.0 im Sport!", difficulty: "easy", category: "kategorien" },
        { id: "sportlich", icon: "⚽", text: () => "Sportlich: Alle Sportfächer über 4.5!", difficulty: "medium", category: "kategorien" },
        { id: "sportass", icon: "🏆", text: () => "Sportass: Alle Sportfächer über 5.0!", difficulty: "hard", category: "kategorien" },
        
        // === UNIVERSALGENIE ===
        { id: "universalgenie", icon: "🌟", text: () => "Universalgenie: In allen Kategorien über 5.0!", difficulty: "hard", category: "genie" },
        { id: "allRounder", icon: "🎯", text: () => "Allrounder: In allen Bereichen solide Leistung!", difficulty: "hard", category: "genie" },
        
        // === BESONDERE ACHIEVEMENTS ===
        { id: "noneBelow3", icon: "🛡️", text: () => "Keine Note unter 3.0 - Sicherheitsnetz funktioniert!", difficulty: "easy", category: "besondere" },
        { id: "noBelow35", icon: "🔒", text: () => "Keine Note unter 3.5 - Starke Basis!", difficulty: "medium", category: "besondere" },
        { id: "tenAbove5", icon: "💪", text: () => "10 Noten mit 5.0+ - Power-Performance!", difficulty: "medium", category: "besondere" },
        { id: "first3Above5", icon: "🏅", text: () => "Drei Noten mit 5.0+ - Dreifach stark!", difficulty: "easy", category: "besondere" },
        { id: "fiveAbove55", icon: "🌟", text: () => "5 Noten mit 5.5+ - Sterne-Sammler!", difficulty: "medium", category: "besondere" },
        { id: "perfectBalance", icon: "⚖️", text: () => "Genau zwischen allen Noten balanciert - Gleichgewichtskünstler!", difficulty: "medium", category: "besondere" },
        { id: "gradeHoarding", icon: "💎", text: () => "Mehr als 50 Noten gesammelt - Sammler-Instinkt!", difficulty: "hard", category: "besondere" },
        { id: "subjectMaster", icon: "🎓", text: () => "In einem Fach über 8 Noten - Spezialist!", difficulty: "medium", category: "besondere" },


        
        // === MOTIVATIONS-ACHIEVEMENTS ===
        { id: "believer", icon: "✨", text: () => "Letzte Note besser als vorletzte - Du glaubst an dich!", difficulty: "easy", category: "motivation" },
        { id: "youGotThis", icon: "🔥", text: () => "Letzte Note war schlecht? Das nächste Mal wird besser!", difficulty: "easy", category: "motivation" },
        { id: "slowAndSteady", icon: "🐢", text: () => "Letzte 5 Noten kontinuierlich besser - Langsam aber sicher!", difficulty: "medium", category: "motivation" },
        { id: "zeroImprovement", icon: "🌀", text: (fach) => `In ${fach} gleich geblieben - Stillstand ist auch Bewegung!`, difficulty: "easy", category: "motivation" },
        { id: "itsFine", icon: "😎", text: () => "Note unter 3.0? Alles überbewertet!", difficulty: "easy", category: "motivation" },
        { id: "theCurve", icon: "📉", text: () => "Schnitt unter 3.5 - Du senkst den Klassenschnitt für alle!", difficulty: "easy", category: "motivation" },
        { id: "noIdea", icon: "🧠❌", text: (fach) => `In ${fach} mit Ahnungslosigkeit geglänzt - Mut zur Ehrlichkeit!`, difficulty: "easy", category: "motivation" },
        { id: "mondayMotivation", icon: "💪", text: () => "Montag und trotzdem motiviert - Superheld!", difficulty: "easy", category: "motivation" },
        { id: "fridayFocus", icon: "🎯", text: () => "Freitag und noch konzentriert - beeindruckend!", difficulty: "easy", category: "motivation" },
        { id: "rainydayRockstar", icon: "🌧️", text: () => "Bei Regenwetter bessere Note - wahre Stärke!", difficulty: "easy", category: "motivation" },
        
        // === SPEZIAL-ACHIEVEMENTS ===
        { id: "firstSubjectAbove6", icon: "🌞", text: (fach) => `Erstes Fach mit Schnitt über 6.0: ${fach} - Perfektion!`, difficulty: "medium", category: "spezial" },
        { id: "first5ThisSemester", icon: "⭐", text: (fach) => `Erste 5.0 dieses Semester in ${fach} - Der Durchbruch!`, difficulty: "easy", category: "spezial" },
        
        // === SECRET ACHIEVEMENTS ===
        { id: "no5", icon: "🧊", text: () => "Noch keine 5.0+ geschrieben - Die Entdeckungsreise beginnt!", difficulty: "easy", category: "secret" },
        { id: "allBelow4", icon: "😬", text: () => "Alle Fächer unter 4.0 - Konsistenz auf niedrigem Niveau!", difficulty: "easy", category: "secret" },
        
        // === GEHEIME ACHIEVEMENTS ===
        { id: "procrastinator", icon: "⏱️", text: () => "Alles auf den letzten Drücker - aber geschafft!", difficulty: "easy", category: "secret" },
        { id: "coffeeAddict", icon: "☕", text: () => "5+ schlechte Noten - Zeit für mehr Kaffee!", difficulty: "easy", category: "secret" },
        { id: "sleepyHead", icon: "😴", text: () => "Note unter 3.0 - warst du müde?", difficulty: "easy", category: "secret" },
        { id: "luckyGuesser", icon: "🍀", text: () => "Überraschend gute Note trotz mangelnder Vorbereitung!", difficulty: "easy", category: "secret" },
        { id: "streakBreaker", icon: "💥", text: () => "Streak-Breaker - Perfekte Serie unterbrochen", difficulty: "medium", category: "secret" },
        { id: "wildCard", icon: "🃏", text: () => "Wildcard - Extreme Notenschwankungen", difficulty: "medium", category: "secret" },
        { id: "rollerCoaster", icon: "🎢", text: () => "Achterbahn - Auf und ab wie im Freizeitpark!", difficulty: "medium", category: "secret" },
        { id: "phoenix", icon: "🔥", text: () => "Phönix - Aus der Asche auferstanden (1.0 → 6.0)", difficulty: "hard", category: "secret" },
        { id: "testPhobic", icon: "😱", text: () => "3 Tests unter 3.0 - Prüfungsangst?", difficulty: "easy", category: "secret" },
        { id: "Calculator", icon: "🧮", text: () => "Mathe unter 3.0 - der Taschenrechner ist dein Freund!", difficulty: "easy", category: "secret" },
        { id: "spellchecker", icon: "📝", text: () => "Deutsch unter 3.0 - Rechtschreibung ist überbewertet!", difficulty: "easy", category: "secret" },
        { id: "googleTranslate", icon: "🌐", text: () => "Fremdsprache unter 3.0 - Google Translate hilft!", difficulty: "easy", category: "secret" },
        { id: "timeTravel", icon: "⏰", text: () => "Geschichte unter 3.0 - lieber in der Gegenwart bleiben!", difficulty: "easy", category: "secret" },
        { id: "labDisaster", icon: "💥", text: () => "Naturwissenschaft unter 3.0 - Explosion im Labor?", difficulty: "easy", category: "secret" },
        { id: "artisticStruggle", icon: "🎨", text: () => "Kunst unter 3.0 - nicht jeder ist Picasso!", difficulty: "easy", category: "secret" },
        { id: "benchWarmer", icon: "🪑", text: () => "Sport unter 3.0 - die Bank ist bequem!", difficulty: "easy", category: "secret" },
        { id: "weekendWarrior", icon: "🎉", text: () => "Freitagnachmittag-Test geschrieben - Wochenende im Kopf!", difficulty: "easy", category: "secret" },
        { id: "mondayBlues", icon: "😮‍💨", text: () => "Montagmorgen-Test vergeigt - wer ist schon montags fit?", difficulty: "easy", category: "secret" },
        { id: "holidayHangover", icon: "🏖️", text: () => "Nach den Ferien erstmal wieder reinkommen...", difficulty: "easy", category: "secret" },
        { id: "forgottenHomework", icon: "📚", text: () => "Test geschrieben ohne zu lernen - YOLO!", difficulty: "easy", category: "secret" },
        { id: "wrongSubject", icon: "🤷", text: () => "Für Mathe gelernt, Bio-Test geschrieben!", difficulty: "easy", category: "secret" },
        { id: "sickDay", icon: "🤒", text: () => "Krank zur Prüfung erschienen - Held oder verrückt?", difficulty: "easy", category: "secret" },
        { id: "phoneDistraction", icon: "📱", text: () => "Handy war interessanter als der Unterricht!", difficulty: "easy", category: "secret" },
        { id: "windowGazer", icon: "🪟", text: () => "Draußen war das Wetter zu schön zum Lernen!", difficulty: "easy", category: "secret" },
        { id: "musicLover", icon: "🎵", text: () => "Musik über 5.5, aber Französisch nicht bestanden - Prioritäten!", difficulty: "easy", category: "secret" },
        { id: "gamingNight", icon: "🎮", text: () => "Eine Runde wurde zu... vielen Runden!", difficulty: "easy", category: "secret" },
        { id: "netflixBinge", icon: "📺", text: () => "Serie war spannender als das Lehrbuch!", difficulty: "easy", category: "secret" },
        { id: "powerNapper", icon: "😪", text: () => "5-Minuten-Pause wurde zu 2-Stunden-Schlaf!", difficulty: "easy", category: "secret" },
        { id: "cleaningFrenzy", icon: "🧹", text: () => "Zimmer war noch nie so sauber wie vor der Prüfung!", difficulty: "easy", category: "secret" },
        { id: "organizer", icon: "📋", text: () => "Schreibtisch organisieren statt lernen - aber es sieht gut aus!", difficulty: "easy", category: "secret" },
        { id: "wikipediaRabbitHole", icon: "🐰", text: () => "Von Mathe zu 'Warum sind Flamingos pink?' in 20 Clicks!", difficulty: "easy", category: "secret" },
        { id: "youtubeUniversity", icon: "🎥", text: () => "YouTube-Tutorials schauen = produktives Lernen!", difficulty: "easy", category: "secret" },
        { id: "penCollector", icon: "✏️", text: () => "20 Stifte gekauft, keinen davon zum Lernen benutzt!", difficulty: "easy", category: "secret" },
        { id: "notesTaker", icon: "📝", text: () => "Wunderschöne Notizen - leider nie wieder angeschaut!", difficulty: "easy", category: "secret" },
        { id: "highlighterArtist", icon: "🖍️", text: () => "Ganzes Buch markiert - jetzt ist alles wichtig!", difficulty: "easy", category: "secret" },
        { id: "libraryTourist", icon: "📚", text: () => "In der Bibliothek war's zu ruhig zum Denken!", difficulty: "easy", category: "secret" },
        { id: "groupTherapy", icon: "👥", text: () => "Lerngruppe = kollektives Jammern über Prüfungen!", difficulty: "easy", category: "secret" },
        { id: "motivationSpeaker", icon: "📢", text: () => "Anderen Lerntipps geben statt selbst zu lernen!", difficulty: "easy", category: "secret" },
        { id: "perfectionist", icon: "✨", text: () => "Erstes Kapitel 10x perfekt gelernt, Rest vergessen!", difficulty: "easy", category: "secret" },
        { id: "nightOwl", icon: "🦉", text: () => "Um 3 Uhr morgens fängt das Gehirn an zu arbeiten!", difficulty: "easy", category: "secret" },
        { id: "earlyBird", icon: "🐣", text: () => "5 Uhr morgens aufgestehen = sofort wieder einschlafen!", difficulty: "easy", category: "secret" },
        { id: "excuseMaster", icon: "🎭", text: () => "1000 Gründe gefunden, warum heute nicht gelernt wird!", difficulty: "easy", category: "secret" },
        { id: "tomorrowStarter", icon: "📆", text: () => "Morgen fange ich richtig an - versprochen!", difficulty: "easy", category: "secret" },
        { id: "multitasker", icon: "🤹", text: () => "Gleichzeitig lernen, essen, chatten, TV schauen!", difficulty: "easy", category: "secret" },
        { id: "lastMinuteLearner", icon: "⚡", text: () => "5 Minuten vor der Prüfung noch schnell alles lernen!", difficulty: "easy", category: "secret" },
        { id: "blanketStudent", icon: "🛌", text: () => "Im Bett lernen = Maximum Comfort, Minimum Erfolg!", difficulty: "easy", category: "secret" },
        { id: "textMarker", icon: "🌈", text: () => "So viel markiert, dass nichts mehr auffällt!", difficulty: "easy", category: "secret" },
        { id: "franzoesischPanic", icon: "😰", text: () => "Französisch-Panik: Alles verstanden außer der Aufgabe!", difficulty: "easy", category: "secret" },
        { id: "franzoesischMime", icon: "🎭", text: () => "Französisch durch Gestik erklärt - universelle Sprache!", difficulty: "easy", category: "secret" },
        { id: "calculator", icon: "🧮", text: () => "Taschenrechner für 2+2 benutzt - Sicherheit geht vor!", difficulty: "easy", category: "secret" },
        { id: "wrongClassroom", icon: "🚪", text: () => "In falschem Klassenzimmer gelandet - Abenteurer!", difficulty: "easy", category: "secret" },
        { id: "pencilCollector", icon: "✏️", text: () => "Mehr Stifte als Punkte gesammelt!", difficulty: "easy", category: "secret" },
        { id: "doodleArtist", icon: "🎨", text: () => "Prüfungsblatt ist jetzt ein Kunstwerk!", difficulty: "easy", category: "secret" },
        { id: "timeWarp", icon: "⏰", text: () => "Gedacht es sind 5 Minuten - waren 50 Minuten!", difficulty: "easy", category: "secret" },
        
        // === NEUE DATUM-BASIERTE ACHIEVEMENTS ===
        // Feiertage und besondere Tage
        { id: "valentinesFail", icon: "💔", difficulty: "easy", category: "secret", text: (fach) => `Am Valentinstag eine Note in ${fach} – Liebe zur Bildung?` },
        { id: "valentinesSuccess", icon: "💕", difficulty: "easy", category: "secret", text: (fach) => `Valentinstag mit guter Note in ${fach} – Romantisch!` },
        { id: "halloweenShock", icon: "🎃", difficulty: "easy", category: "secret", text: (fach) => `Halloween-Note in ${fach} – Süßes oder Saures?` },
        { id: "halloweenTreat", icon: "🍭", difficulty: "easy", category: "secret", text: (fach) => `Halloween mit süßer Note in ${fach} – Süßes bekommen!` },
        { id: "xmasMiracle", icon: "🎄", difficulty: "easy", category: "secret", text: (fach) => `Kurz vor Weihnachten eine Note in ${fach} – Ein echtes Wunder!` },
        { id: "xmasGift", icon: "🎁", difficulty: "easy", category: "secret", text: (fach) => `Weihnachtsgeschenk: Gute Note in ${fach}!` },
        { id: "newYearsFlop", icon: "🥂", difficulty: "easy", category: "secret", text: (fach) => `Jahresstart mit einer Note in ${fach} – Neues Jahr, neues Glück?` },
        { id: "newYearsResolution", icon: "✨", difficulty: "easy", category: "secret", text: (fach) => `Neujahr mit guter Note in ${fach} – Vorsatz erfüllt!` },
        { id: "aprilFoolsJoke", icon: "🤡", difficulty: "easy", category: "secret", text: (fach) => `1. April Test in ${fach} – Hoffentlich kein Scherz!` },
        { id: "easterSurprise", icon: "🐰", difficulty: "easy", category: "secret", text: (fach) => `Ostern mit Überraschung in ${fach} – Ostereier gefunden!` },
        { id: "mothersDayGift", icon: "🌹", difficulty: "easy", category: "secret", text: (fach) => `Muttertag mit Note in ${fach} – Geschenk für Mama!` },
        { id: "fathersDayScore", icon: "👔", difficulty: "easy", category: "secret", text: (fach) => `Vatertag mit Note in ${fach} – Papa wird stolz sein!` },
        { id: "independenceDay", icon: "🇺🇸", difficulty: "easy", category: "secret", text: (fach) => `4. Juli Test in ${fach} – Unabhängig von guten Noten!` },
        { id: "stPatricksLuck", icon: "🍀", difficulty: "easy", category: "secret", text: (fach) => `St. Patrick's Day in ${fach} – Irisches Glück gehabt?` },
        
        // Wochentag-basierte Achievements
        { id: "mondayFail", icon: "😵", difficulty: "easy", category: "secret", text: (fach) => `Montag. Test. ${fach}. Keine gute Kombi.` },
        { id: "mondayMotivation", icon: "💪", difficulty: "easy", category: "motivation", text: (fach) => `Montag-Motivation in ${fach} – Wochenstart geglückt!` },
        { id: "tuesdayBlues", icon: "😴", difficulty: "easy", category: "secret", text: (fach) => `Dienstag in ${fach} – Noch nicht ganz wach?` },
        { id: "humpDay", icon: "🐪", difficulty: "easy", category: "secret", text: (fach) => `Mittwoch in ${fach} – Bergfest!` },
        { id: "thursdayThoughts", icon: "🤔", difficulty: "easy", category: "secret", text: (fach) => `Donnerstag in ${fach} – Fast Wochenende!` },
        { id: "fridayChamp", icon: "🎉", difficulty: "easy", category: "secret", text: (fach) => `Freitag eine gute Note in ${fach} – Wochenende gerettet!` },
        { id: "fridayFail", icon: "😅", difficulty: "easy", category: "secret", text: (fach) => `Freitag in ${fach} vergeigt – Wochenende trotzdem verdient!` },
        { id: "saturdayWarrior", icon: "⚔️", difficulty: "easy", category: "secret", text: (fach) => `Samstag Test in ${fach} – Echte Hingabe!` },
        { id: "sundaySchool", icon: "⛪", difficulty: "easy", category: "secret", text: (fach) => `Sonntag Test in ${fach} – Sonntagsschule mal anders!` },
        
        // Monats-basierte Achievements
        { id: "januaryFresh", icon: "❄️", difficulty: "easy", category: "secret", text: (fach) => `Januar in ${fach} – Frisches Jahr, frische Noten!` },
        { id: "februaryLove", icon: "💖", difficulty: "easy", category: "secret", text: (fach) => `Februar in ${fach} – Liebe zum Lernen!` },
        { id: "marchMadness", icon: "🏀", difficulty: "easy", category: "secret", text: (fach) => `März in ${fach} – March Madness im Klassenzimmer!` },
        { id: "aprilShowers", icon: "🌧️", difficulty: "easy", category: "secret", text: (fach) => `April in ${fach} – April, April!` },
        { id: "mayFlowers", icon: "🌸", difficulty: "easy", category: "secret", text: (fach) => `Mai in ${fach} – Alles blüht, auch die Noten?` },
        { id: "juneGraduation", icon: "🎓", difficulty: "easy", category: "secret", text: (fach) => `Juni in ${fach} – Graduation Season!` },
        { id: "julySummer", icon: "☀️", difficulty: "easy", category: "secret", text: (fach) => `Juli in ${fach} – Sommerhitze im Klassenzimmer!` },
        { id: "augustVacation", icon: "🏖️", difficulty: "easy", category: "secret", text: (fach) => `August in ${fach} – Gedanken schon im Urlaub?` },
        { id: "septemberReturn", icon: "🍂", difficulty: "easy", category: "secret", text: (fach) => `September in ${fach} – Zurück aus den Ferien!` },
        { id: "octoberFest", icon: "🍺", difficulty: "easy", category: "secret", text: (fach) => `Oktober in ${fach} – Oktoberfest-Stimmung!` },
        { id: "novemberGratitude", icon: "🦃", difficulty: "easy", category: "secret", text: (fach) => `November in ${fach} – Dankbar für jede Note!` },
        { id: "decemberWonder", icon: "❄️", difficulty: "easy", category: "secret", text: (fach) => `Dezember in ${fach} – Winter Wonderland!` },
        
        // Jahreszeit-basierte Achievements
        { id: "springAwakening", icon: "🌱", difficulty: "easy", category: "secret", text: (fach) => `Frühling in ${fach} – Alles erwacht, auch dein Potential!` },
        { id: "summerVibes", icon: "🌻", difficulty: "easy", category: "secret", text: (fach) => `Sommer in ${fach} – Heiße Noten bei heißem Wetter!` },
        { id: "autumnLeaves", icon: "🍁", difficulty: "easy", category: "secret", text: (fach) => `Herbst in ${fach} – Die Blätter fallen, die Noten hoffentlich nicht!` },
        { id: "winterWonderland", icon: "⛄", difficulty: "easy", category: "secret", text: (fach) => `Winter in ${fach} – Kalt draußen, heiß im Kopf!` },
        
        // Spezielle Datum-Kombinationen
        { id: "fullMoonMadness", icon: "🌕", difficulty: "medium", category: "secret", text: (fach) => `Vollmond-Test in ${fach} – Mystische Kräfte am Werk?` },
        { id: "fridayThe13th", icon: "😈", difficulty: "medium", category: "secret", text: (fach) => `Freitag der 13. in ${fach} – Pech oder Glück?` },
        { id: "leapYear", icon: "🦘", difficulty: "hard", category: "secret", text: (fach) => `Schaltjahr-Test in ${fach} – Extra Tag, extra Chance!` },
        { id: "piDay", icon: "🥧", difficulty: "medium", category: "secret", text: () => `14. März (Pi-Tag) – 3,14159... und deine Note?` },
        { id: "starWarsDay", icon: "⭐", difficulty: "medium", category: "secret", text: (fach) => `4. Mai in ${fach} – May the Force be with you!` },
        { id: "palindromeDate", icon: "🔄", difficulty: "hard", category: "secret", text: (fach) => `Palindrom-Datum in ${fach} – Rückwärts wie vorwärts perfekt!` },
        
        // Wetterbedingte Achievements (basierend auf typischen Wetterdaten)
        { id: "snowDay", icon: "🌨️", difficulty: "easy", category: "secret", text: (fach) => `Schneetag in ${fach} – Trotz Kälte heiße Performance!` },
        { id: "rainydayRockstar", icon: "🌧️", difficulty: "easy", category: "motivation", text: (fach) => `Regentag in ${fach} – Wahre Stärke zeigt sich bei schlechtem Wetter!` },
        { id: "sunnyDisposition", icon: "🌞", difficulty: "easy", category: "secret", text: (fach) => `Sonnentag in ${fach} – Vitamin D für's Gehirn!` },
        { id: "stormySurprise", icon: "⛈️", difficulty: "medium", category: "secret", text: (fach) => `Gewitter-Test in ${fach} – Blitzgescheit oder nur Blitz?` },
        
        // Uhrzeit-basierte Achievements (falls Uhrzeiten verfügbar)
        { id: "earlyBird", icon: "🐦", difficulty: "easy", category: "secret", text: (fach) => `Früher Test in ${fach} – Der frühe Vogel fängt den Wurm!` },
        { id: "nightOwl", icon: "🦉", difficulty: "easy", category: "secret", text: (fach) => `Später Test in ${fach} – Eule der Nacht!` },
        { id: "lunchTimeTest", icon: "🍽️", difficulty: "easy", category: "secret", text: (fach) => `Mittagstest in ${fach} – Hunger macht müde!` },
        { id: "rushHour", icon: "⏰", difficulty: "easy", category: "secret", text: (fach) => `Rush Hour Test in ${fach} – Stress pur!` },
        
        // Historische Ereignisse (basierend auf bekannten Daten)
        { id: "berlinWallFall", icon: "🧱", difficulty: "hard", category: "secret", text: (fach) => `9. November in ${fach} – Mauern einreißen, auch in den Köpfen!` },
        { id: "moonLanding", icon: "🚀", difficulty: "hard", category: "secret", text: (fach) => `20. Juli in ${fach} – Ein kleiner Schritt für dich...` },
        { id: "newMillennium", icon: "🎆", difficulty: "hard", category: "secret", text: (fach) => `Y2K Test in ${fach} – Das neue Jahrtausend überlebt!` }
      ];
    }

    getAchievementRequirements(achievementId) {
      const requirements = {
        // === ERSTE SCHRITTE ===
        firstTest: "Schreibe deinen ersten Test",
        firstStep: "Sammle deine erste Note",
        tenGrades: "Sammle 10 Noten in allen Fächern",
        twentyGrades: "Sammle 20 Noten in allen Fächern",
        gradeHoarding: "Sammle 50 Noten in allen Fächern",
        survival: "Habe gleichzeitig 5 oder mehr Fächer",
        
        // === NOTEN-ACHIEVEMENTS ===
        first1: "Erreiche eine Note zwischen 1.0 und 1.25",
        first15: "Erreiche eine Note zwischen 1.25 und 1.75",
        first2: "Erreiche eine Note zwischen 1.75 und 2.25",
        first25: "Erreiche eine Note zwischen 2.25 und 2.75",
        first3: "Erreiche eine Note zwischen 2.75 und 3.25",
        first35: "Erreiche eine Note zwischen 3.25 und 3.75",
        first4: "Erreiche eine Note zwischen 3.75 und 4.25",
        first45: "Erreiche eine Note zwischen 4.25 und 4.75",
        first5: "Erreiche eine Note zwischen 4.75 und 5.25",
        first55: "Erreiche eine Note zwischen 5.25 und 5.75",
        soNahSoFern: "Erreiche eine Note von 5.8 oder 5.9",
        first6: "Erreiche genau die Note 6.0",
        overSix: "Erreiche eine Note über 6.0",
        
        // === BESTEHEN ===
        allTestsPassed: "Bestehe alle deine Tests (Note ≥ 4.0)",
        fiveWithoutFail: "Bestehe 5 Tests in Folge ohne zu scheitern",
        noFailFirstThree: "Bestehe deine ersten 3 Tests",
        noBelow4: "Keine Note unter 4.0",
        noBelow5: "Keine Note unter 5.0",
        noneBelow3: "Keine Note unter 3.0",
        noBelow35: "Keine Note unter 3.5",
        
        // === VERBESSERUNG ===
        youImproved: "Verbessere dich in einem Fach von einer zur nächsten Note",
        firstImprovement: "Erreiche deine erste Verbesserung",
        allTestsImproved: "Verbessere dich bei jedem neuen Test",
        threeInARow: "Verbessere dich 3x in Folge in einem Fach",
        allSubjectsImproved: "Zeige Verbesserung in allen Fächern",
        finishedStrong: "Deine letzte Note ist in jedem Fach die beste",
        believer: "Deine letzte Note ist besser als die vorletzte",
        
        // === DURCHSCHNITTE ===
        perfectlyMid: "Erreiche einen Gesamtschnitt von genau 4.0 (±0.05)",
        almostThere: "Erreiche einen Gesamtschnitt zwischen 4.85 und 4.99",
        avgAbove5: "Erreiche einen Gesamtschnitt von ≥ 5.0",
        avgAbove52: "Erreiche einen Gesamtschnitt von ≥ 5.2",
        avgAbove59: "Erreiche einen Gesamtschnitt von ≥ 5.9",
        
        // === SPEZIAL-ACHIEVEMENTS ===
        firstSubjectAbove6: "Erstes Fach mit Schnitt über 6.0",
        first5ThisSemester: "Erste 5.0+ Note",
        
        // === SECRET ===
        no5: "Noch keine Note 5.0 oder besser",
        allBelow4: "Alle Fächer unter 4.0",
        procrastinator: "Mindestens 2 der letzten 3 Noten unter 4.0",
        coffeeAddict: "5 oder mehr schlechte Noten",
        sleepyHead: "Mindestens eine Note unter 3.0",
        penCollector: "Mindestens 8 Noten mit schlechter Performance (unter 50% bestanden)",
        notesTaker: "Mindestens 10 Noten mit mindestens 4 schlechten Noten",
        highlighterArtist: "Mindestens 6 Noten mit mindestens 3 unter 3.0",
        phoneDistraction: "Mindestens 2 schlechte Noten bei wenigen Tests (≤5)",
        windowGazer: "Mindestens 2 schlechte Noten und Gesamtschnitt unter 3.0",
        powerNapper: "Mindestens 3 schlechte Noten und mindestens 4 gescheiterte Tests",
        lastMinuteLearner: "Letzte 2 Noten unter 4.0",
        blanketStudent: "Gesamtschnitt unter 2.5 mit mindestens 4 Noten",
        forgottenHomework: "Eine schlechte Note bei wenigen Tests (≤3)",
        wrongSubject: "Mindestens eine schlechte Note, aber auch mindestens eine sehr gute (≥5.0)",
        sickDay: "Genau eine schlechte Note bei ansonsten mindestens 5 Tests",
        weekendWarrior: "Mindestens 15 Noten mit mindestens 8 guten Noten (≥5.0)",
        mondayBlues: "Erste 3 Noten alle unter 4.0",
        holidayHangover: "Gute Note (≥4.5) gefolgt von schlechter Note (<3.0)",
        streakBreaker: "Hatte mindestens 3 gute Noten (≥4.0) in Folge, dann eine schlechte",
        wildCard: "Extreme Notenschwankungen (Unterschied zwischen bester und schlechtester Note > 4.0)",
        rollerCoaster: "Mindestens 4 Wechsel zwischen guten und schlechten Noten",
        phoenix: "Erste zwei Noten ≤ 2.0, letzte zwei Noten ≥ 5.5",
        testPhobic: "3 Tests unter 3.0",
        Calculator: "Mathematik unter 3.0",
        spellchecker: "Deutsch unter 3.0",
        googleTranslate: "Fremdsprache unter 3.0",
        timeTravel: "Geschichte unter 3.0",
        labDisaster: "Naturwissenschaft unter 3.0",
        artisticStruggle: "Kunst unter 3.0",
        benchWarmer: "Sport unter 3.0",
        
        // === DATUM-BASIERTE ACHIEVEMENTS ===
        valentinesFail: "Test am Valentinstag (14. Februar) mit Note < 4.0",
        valentinesSuccess: "Test am Valentinstag (14. Februar) mit Note ≥ 5.0",
        halloweenShock: "Test an Halloween (31. Oktober) mit Note < 4.0",
        halloweenTreat: "Test an Halloween (31. Oktober) mit Note ≥ 5.0",
        xmasMiracle: "Test in der Weihnachtszeit (20.-25. Dezember)",
        xmasGift: "Test in der Weihnachtszeit mit Note ≥ 5.0",
        newYearsFlop: "Test in der ersten Januarwoche mit Note < 4.0",
        newYearsResolution: "Test in der ersten Januarwoche mit Note ≥ 5.0",
        aprilFoolsJoke: "Test am 1. April",
        easterSurprise: "Test in der Osterzeit (März/April)",
        mothersDayGift: "Test am Muttertag (2. Sonntag im Mai)",
        fathersDayScore: "Test am Vatertag (3. Sonntag im Juni)",
        independenceDay: "Test am 4. Juli",
        stPatricksLuck: "Test am St. Patrick's Day (17. März)",
        
        // Wochentag-basiert
        mondayFail: "Montag-Test mit Note < 4.0",
        tuesdayBlues: "Dienstag-Test mit Note < 4.0",
        humpDay: "Test am Mittwoch",
        thursdayThoughts: "Test am Donnerstag",
        fridayChamp: "Freitag-Test mit Note ≥ 5.0",
        fridayFail: "Freitag-Test mit Note < 4.0",
        saturdayWarrior: "Test am Samstag",
        sundaySchool: "Test am Sonntag",
        
        // Monats-basiert
        januaryFresh: "Test im Januar",
        februaryLove: "Test im Februar",
        marchMadness: "Test im März",
        aprilShowers: "Test im April",
        mayFlowers: "Test im Mai",
        juneGraduation: "Test im Juni",
        julySummer: "Test im Juli",
        augustVacation: "Test im August",
        septemberReturn: "Test im September",
        octoberFest: "Test im Oktober",
        novemberGratitude: "Test im November",
        decemberWonder: "Test im Dezember",
        
        // Jahreszeit-basiert
        springAwakening: "Test im Frühling (20. März - 20. Juni)",
        summerVibes: "Test im Sommer (21. Juni - 22. September)",
        autumnLeaves: "Test im Herbst (23. September - 20. Dezember)",
        winterWonderland: "Test im Winter (21. Dezember - 19. März)",
        
        // Spezielle Daten
        fridayThe13th: "Test an einem Freitag dem 13.",
        fullMoonMadness: "Test bei Vollmond",
        leapYear: "Test in einem Schaltjahr",
        palindromeDate: "Test an einem Palindrom-Datum",
        
        // Weitere Secret Achievements
        weekendWarrior: "Test am Wochenende",
        mondayBlues: "Schlechte Montag-Performance",
        holidayHangover: "Test nach den Ferien",
        forgottenHomework: "Test ohne Vorbereitung",
        wrongSubject: "Für falsches Fach gelernt",
        sickDay: "Test trotz Krankheit",
        phoneDistraction: "Handy war interessanter",
        windowGazer: "Draußen war es zu schön",
        musicLover: "Musik-Note über 5.5, aber andere Fächer schlecht",
        gamingNight: "Gaming-Session vor dem Test",
        netflixBinge: "Serie war spannender als lernen",
        powerNapper: "Kurze Pause wurde zu langem Schlaf",
        cleaningFrenzy: "Zimmer putzen statt lernen",
        organizer: "Schreibtisch organisieren statt lernen",
        wikipediaRabbitHole: "Wikipedia-Ablenkung beim Lernen",
        youtubeUniversity: "YouTube statt richtige Uni",
        penCollector: "Viele Stifte, wenig gelernt",
        notesTaker: "Schöne Notizen, nie wieder angeschaut",
        highlighterArtist: "Alles markiert, nichts fällt auf",
        libraryTourist: "Bibliothek zu ruhig zum Denken",
        groupTherapy: "Lerngruppe = Jammergruppe",
        motivationSpeaker: "Anderen Tipps geben statt selbst lernen",
        perfectionist: "Erstes Kapitel perfekt gelernt, Rest vergessen",
        nightOwl: "Um 3 Uhr morgens lernen",
        earlyBird: "5 Uhr aufgestehen und wieder einschlafen",
        excuseMaster: "1000 Gründe nicht zu lernen",
        tomorrowStarter: "Morgen fange ich an!",
        multitasker: "Gleichzeitig alles machen",
        lastMinuteLearner: "5 Minuten vor Test lernen",
        blanketStudent: "Im Bett lernen",
        textMarker: "So viel markiert, nichts fällt auf",
        franzoesischPanic: "Französisch-Panik",
        franzoesischMime: "Französisch durch Gestik",
        calculator: "Taschenrechner für 2+2",
        wrongClassroom: "Falsches Klassenzimmer",
        pencilCollector: "Mehr Stifte als Punkte",
        doodleArtist: "Prüfungsblatt wird Kunstwerk",
        timeWarp: "Zeitgefühl komplett verloren"
      };
      
      return requirements[achievementId] || "Geheime Bedingung - entdecke sie selbst!";
    }

    getAchievementExplanation(achievementIdMK, detailMK) {
      const explanationsMK = {
        // Erste Schritte
        firstTest: () => "Bedingung: Erste Note eintragen",
        firstStep: () => "Bedingung: Zweite Note eintragen", 
        tenGrades: () => "Bedingung: 10 oder mehr Noten sammeln",
        twentyGrades: () => "Bedingung: 20 oder mehr Noten sammeln",
        survival: () => "Bedingung: In 5 oder mehr Fächern Noten haben",
        
        // Noten-Achievements
        first1: (fachMK) => `Wenn man die erste Note zwischen 1.0 und 1.25 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first15: (fachMK) => `Wenn man die erste Note zwischen 1.25 und 1.75 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first2: (fachMK) => `Wenn man die erste Note zwischen 1.75 und 2.25 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first25: (fachMK) => `Wenn man die erste Note zwischen 2.25 und 2.75 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first3: (fachMK) => `Wenn man die erste Note zwischen 2.75 und 3.25 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first35: (fachMK) => `Wenn man die erste Note zwischen 3.25 und 3.75 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first4: (fachMK) => `Wenn man die erste Note zwischen 3.75 und 4.25 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first45: (fachMK) => `Wenn man die erste Note zwischen 4.25 und 4.75 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first5: (fachMK) => `Wenn man die erste Note zwischen 4.75 und 5.25 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        first55: (fachMK) => `Wenn man die erste Note zwischen 5.25 und 5.75 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        soNahSoFern: (fachMK) => `Wenn man eine Note von 5.8 oder 5.9 erreicht${fachMK ? " (in "+fachMK+")" : ""} - so nah an der Perfektion!`,
        first6: (fachMK) => `Wenn man die erste Note 6.0 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        overSix: (fachMK) => `Wenn man eine Note über 6.0 erreicht${fachMK ? " (in "+fachMK+")" : ""}`,
        
        // Bestehen
        allTestsPassed: () => "Wenn alle Tests bestanden werden (Note ≥ 4.0)",
        fiveWithoutFail: () => "Wenn 5 Tests in Folge bestanden werden",
        noFailFirstThree: () => "Wenn die ersten 3 Tests bestanden werden",
        noBelow4: () => "Wenn keine Note unter 4.0 erreicht wird",
        noBelow5: () => "Wenn keine Note unter 5.0 erreicht wird",
        noneBelow3: () => "Wenn keine Note unter 3.0 erreicht wird",
        noBelow35: () => "Wenn keine Note unter 3.5 erreicht wird",
        
        // Verbesserung
        youImproved: (fachMK) => `Wenn man sich in ${fachMK} von einer zur nächsten Note verbessert`,
        firstImprovement: () => "Bei der ersten Verbesserung in einem Fach",
        allTestsImproved: () => "Wenn jeder neue Test eine Verbesserung bringt",
        threeInARow: (fachMK) => `Wenn man sich in ${fachMK} 3x in Folge verbessert`,
        allSubjectsImproved: () => "Wenn alle Fächer Verbesserung zeigen",
        finishedStrong: () => "Wenn die letzte Note in jedem Fach die beste ist",
        believer: () => "Wenn die letzte Note besser als die vorletzte ist",
        
        // Missing achievement explanations
        barelyPassed: (fachMK) => `Wenn man in ${fachMK} knapp bestanden hat (3.75-4.25)`,
        tryRestart: () => "Wenn die letzten 3 Noten alle unter 4.0 sind",
        comeback: (fachMK) => `Wenn man sich in ${fachMK} um mindestens 1.0 Note verbessert`,
        comebackKid: (fachMK) => `Wenn man sich in ${fachMK} um mindestens 2.0 Noten verbessert`,
        three6InRow: () => "Wenn man 3 Mal hintereinander eine 6.0 erreicht",
        perfectBalance: () => "Wenn alle Noten zwischen 4.0 und 5.0 liegen",
        all5: () => "Wenn man in allen Fächern mindestens eine 5.0 hat",
        all6: () => "Wenn man in allen Fächern mindestens eine 6.0 hat",
        allAbove55: () => "Wenn alle Fächer einen Schnitt ≥ 5.5 haben",
        slowAndSteady: () => "Wenn die letzten 5 Noten kontinuierlich besser werden",
        procrastinator: () => "Wenn mindestens 2 der letzten 3 Noten unter 4.0 sind",
        streakBreaker: () => "Wenn man eine gute Serie (3+ Tests ≥4.0) unterbricht",
        wildCard: () => "Wenn der Unterschied zwischen bester und schlechtester Note > 4.0 ist",
        rollerCoaster: () => "Wenn mindestens 4 Wechsel zwischen guten und schlechten Noten auftreten",
        phoenix: () => "Wenn die ersten 2 Noten ≤2.0 und die letzten 2 Noten ≥5.5 sind",
        
        // Durchschnitt
        perfectlyMid: () => "Bei einem Gesamtschnitt von genau 4.0 (±0.05)",
        almostThere: () => "Bei einem Gesamtschnitt zwischen 4.85 und 4.99",
        avgAbove5: () => "Bei einem Gesamtschnitt von ≥ 5.0",
        avgAbove52: () => "Bei einem Gesamtschnitt von ≥ 5.2",
        avgAbove59: () => "Bei einem Gesamtschnitt von ≥ 5.9",
        
        // Perfektion
        doubleSix: () => "Bei 2 perfekten 6.0-Noten",
        five6: () => "Bei 5 perfekten 6.0-Noten",
        ten6: () => "Bei 10 perfekten 6.0-Noten",
        allPerfect: () => "Wenn alle Noten 6.0 sind",
        perfectScore: () => "Bei perfekter 6.0 in allen Tests",
        highConsistency: () => "Wenn alle Noten zwischen 5.5 und 6.0 liegen",
        
        // Fächer
        allAbove4: () => "Wenn alle Fächer einen Schnitt ≥ 4.0 haben",
        allAbove5: () => "Wenn alle Fächer einen Schnitt ≥ 5.0 haben",
        fiveSubjectsAbove5: () => "Bei 5 Fächern mit Schnitt ≥ 5.0",
        threeFachOver5: () => "Bei 3 Fächern mit Schnitt ≥ 5.0",
        tenAbove5: () => "Bei 10 Noten ≥ 5.0",
        first3Above5: () => "Bei 3 Noten ≥ 5.0",
        fiveAbove55: () => "Bei 5 Noten ≥ 5.5",
        subjectMaster: (fachMK) => `Bei mindestens 8 Noten in ${fachMK}`,
        
        // Kategorien
        naturStart: () => "Bei der ersten Note ≥ 4.0 in Naturwissenschaften",
        scientist: () => "Bei 2 naturwissenschaftlichen Fächern mit Schnitt ≥ 4.5",
        professor: () => "Wenn alle naturwissenschaftlichen Fächer einen Schnitt ≥ 5.0 haben",
        mathGenius: () => "Bei Mathematik-Schnitt ≥ 5.0",
        mathWiz: () => "Bei Mathematik-Schnitt ≥ 5.5",
        physicsLover: () => "Bei Physik-Schnitt ≥ 5.0",
        chemistryExpert: () => "Bei Chemie-Schnitt ≥ 5.0",
        biologyBuff: () => "Bei Biologie-Schnitt ≥ 5.0",
        informatikPro: () => "Bei Informatik-Schnitt ≥ 5.0",
        
        sprachStart: () => "Bei der ersten Note ≥ 4.0 in Sprachen",
        polyglot: () => "Bei 2 Sprachfächern mit Schnitt ≥ 4.5",
        linguist: () => "Wenn alle Sprachfächer einen Schnitt ≥ 5.0 haben",
        deutschMeister: () => "Bei Deutsch-Schnitt ≥ 5.0",
        deutschDichter: () => "Bei Deutsch-Schnitt ≥ 5.5",
        englishMaster: () => "Bei Englisch-Schnitt ≥ 5.0",
        shakespeareWannabe: () => "Bei Englisch-Schnitt ≥ 5.5",
        franzoesischStart: () => "Bei der ersten Note ≥ 4.0 in Französisch",
        franzoesischFail: () => "Bei Französisch-Schnitt ≤ 3.0",
        franzoesischPerfect: () => "Bei Französisch-Schnitt ≥ 5.5",
        franzoesischPrononciation: () => "Bei Französisch-Schnitt < 2.5",
        bonjour: () => "Bei Französisch-Schnitt ≤ 2.0",
        
        gesellschaftStart: () => "Bei der ersten Note ≥ 4.0 in Gesellschaftswissenschaften",
        gesellschaftskenner: () => "Bei 2 gesellschaftswissenschaftlichen Fächer mit Schnitt ≥ 4.5",
        gesellschaftsexperte: () => "Wenn alle gesellschaftswissenschaftlichen Fächer einen Schnitt ≥ 5.0 haben",
        geschichtsBuff: () => "Bei Geschichte-Schnitt ≥ 5.0",
        
        kunstStart: () => "Bei der ersten Note ≥ 4.0 in Kunst/Kreativfächern",
        kreativ: () => "Bei 2 Kunstfächern mit Schnitt ≥ 4.5",
        kuenstler: () => "Wenn alle Kunstfächer einen Schnitt ≥ 5.0 haben",
        kunstKenner: () => "Bei Bildnerisches Gestalten-Schnitt ≥ 5.0",
        
        sportStart: () => "Bei der ersten Note ≥ 4.0 in Sport",
        sportlich: () => "Wenn alle Sportfächer einen Schnitt ≥ 4.5 haben",
        sportass: () => "Wenn alle Sportfächer einen Schnitt ≥ 5.0 haben",
        
        // Genie
        universalgenie: () => "Wenn in allen Kategorien der Schnitt ≥ 5.0 ist",
        allRounder: () => "Bei solider Leistung in allen Bereichen",
        
        // Besondere
        noneBelow3: () => "Wenn keine Note unter 3.0 erreicht wird",
        noBelow35: () => "Wenn keine Note unter 3.5 erreicht wird",
        tenAbove5: () => "Bei 10 Noten mit 5.0+",
        first3Above5: () => "Bei den ersten 3 Noten mit 5.0+",
        fiveAbove55: () => "Bei 5 Noten mit 5.5+",
        perfectBalance: () => "Bei ausgewogenen Noten zwischen allen Fächern",
        gradeHoarding: () => "Bei mehr als 50 gesammelten Noten",
        subjectMaster: () => "Bei über 8 Noten in einem Fach",
        
        // Motivation
        believer: () => "Wenn die letzte Note besser als die vorletzte ist",
        youGotThis: () => "Nach einer schlechten Note - Motivation für's nächste Mal",
        slowAndSteady: () => "Bei kontinuierlicher Verbesserung über 5 Noten",
        zeroImprovement: (fachMK) => `Wenn in ${fachMK} keine Veränderung stattfindet`,
        itsFine: () => "Bei einer Note unter 3.0 - positive Einstellung",
        theCurve: () => "Bei einem Schnitt unter 3.5 - du hilfst anderen",
        noIdea: (fachMK) => `Bei Ahnungslosigkeit in ${fachMK} - Ehrlichkeit`,
        mondayMotivation: () => "Bei Motivation am Montag",
        fridayFocus: () => "Bei Konzentration am Freitag",
        rainydayRockstar: () => "Bei guter Leistung bei Regenwetter"
      };
      
      const explainerMK = explanationsMK[achievementIdMK];
      if (explainerMK) {
        return explainerMK(detailMK);
      }
      return "Bedingung wird beim Erreichen des Achievements angezeigt.";
    }

    processAchievements(notenDatenMK) {
      const achievedMK = {};
      const detailsMK = {};
      
      if (!notenDatenMK || !notenDatenMK.length) return { achieved: achievedMK, details: detailsMK };
      
      // Grade tracking variables
      let allGradesMK = [];
      let totalGradesMK = 0;
      let failCountMK = 0;
      let passedCountMK = 0;
      let subjectCountMK = notenDatenMK.length;
      
      let found1MK = false, found15MK = false, found2MK = false, found25MK = false, found3MK = false, found35MK = false;
      let found4MK = false, found45MK = false, found5MK = false, found55MK = false, found6MK = false, foundSoNahMK = false;
      let first1FachMK = '', first15FachMK = '', first2FachMK = '', first25FachMK = '', first3FachMK = '', first35FachMK = '';
      let first4FachMK = '', first45FachMK = '', first5FachMK = '', first55FachMK = '', first6FachMK = '', firstSoNahFachMK = '';
      
      // Improvement tracking
      let hasImprovementMK = false;
      let improvedSubjectsMK = [];
      let allTestsImprovedMK = true;
      let bestLastNoteMK = true;
      let bestNoteMK = -1;
      
      // Perfection tracking
      let perfect6CountMK = 0;
      let allPerfectScoreMK = true;
      
      // Pass/fail tracking
      let consecutivePassedMK = 0;
      let maxConsecutivePassedMK = 0;
      let allPassedMK = true;
      let noBelow4MK = true;
      let noBelow5MK = true;
      let firstThreePassedMK = true;
      
      // Category tracking
      let kategorienStatsMK = {};
      Object.keys(this.subjectsByCategory).forEach(kategorieMK => {
        kategorienStatsMK[kategorieMK] = {
          faecher: [],
          above4: 0,
          above45: 0,
          above5: 0,
          above55: 0,
          hasFirst4: false,
          hasFirst5: false,
          hasAnyGrade: false
        };
      });
      
      // Calculate overall weighted average
      let totalSumMK = 0;
      let totalWeightMK = 0;
      
      for (const fachMK of notenDatenMK) {
        if (!fachMK.noten || !fachMK.noten.length) continue;
        
        const fachNameMK = fachMK.fachLangName || fachMK.fach || '';
        const kategorieMK = this.getFachKategorie(fachNameMK);
        const gradesMK = fachMK.noten;
        const weightsMK = fachMK.gewichtung || gradesMK.map(() => 1); // Default weight 1
        const datesMK = fachMK.daten || []; // Get dates array
        
        totalGradesMK += gradesMK.length;
        
        // Calculate weighted average for this subject
        const weightedSumMK = gradesMK.reduce((sum, grade, idx) => sum + (grade * weightsMK[idx]), 0);
        const subjectWeightMK = weightsMK.reduce((sum, weight) => sum + weight, 0);
        const subjectAvgMK = weightedSumMK / subjectWeightMK;
        
        // Add to overall calculation
        totalSumMK += weightedSumMK;
        totalWeightMK += subjectWeightMK;
        
        // Update category stats
        if (kategorienStatsMK[kategorieMK]) {
          kategorienStatsMK[kategorieMK].faecher.push(fachMK);
          kategorienStatsMK[kategorieMK].hasAnyGrade = true;
          
          if (subjectAvgMK >= 4.0) kategorienStatsMK[kategorieMK].above4++;
          if (subjectAvgMK >= 4.5) kategorienStatsMK[kategorieMK].above45++;
          if (subjectAvgMK >= 5.0) kategorienStatsMK[kategorieMK].above5++;
          if (subjectAvgMK >= 5.5) kategorienStatsMK[kategorieMK].above55++;
          
          if (gradesMK.some(n => n >= 4.0)) kategorienStatsMK[kategorieMK].hasFirst4 = true;
          if (gradesMK.some(n => n >= 5.0)) kategorienStatsMK[kategorieMK].hasFirst5 = true;
        }
        
        // Process individual grades with dates
        gradesMK.forEach((nMK, idxMK) => {
          allGradesMK.push({ note: nMK, fach: fachNameMK, idx: idxMK, datum: datesMK[idxMK] });
          
          // Track first occurrence of each grade level (including over 6.0)
          if (nMK <= 1.25 && !found1MK) { found1MK = true; first1FachMK = fachNameMK; }
          if (nMK <= 1.75 && nMK > 1.25 && !found15MK) { found15MK = true; first15FachMK = fachNameMK; }
          if (nMK <= 2.25 && nMK > 1.75 && !found2MK) { found2MK = true; first2FachMK = fachNameMK; }
          if (nMK <= 2.75 && nMK > 2.25 && !found25MK) { found25MK = true; first25FachMK = fachNameMK; }
          if (nMK <= 3.25 && nMK > 2.75 && !found3MK) { found3MK = true; first3FachMK = fachNameMK; }
          if (nMK <= 3.75 && nMK > 3.25 && !found35MK) { found35MK = true; first35FachMK = fachNameMK; }
          if (nMK <= 4.25 && nMK > 3.75 && !found4MK) { found4MK = true; first4FachMK = fachNameMK; }
          if (nMK <= 4.75 && nMK > 4.25 && !found45MK) { found45MK = true; first45FachMK = fachNameMK; }
          if (nMK <= 5.25 && nMK > 4.75 && !found5MK) { found5MK = true; first5FachMK = fachNameMK; }
          if (nMK <= 5.75 && nMK > 5.25 && !found55MK) { found55MK = true; first55FachMK = fachNameMK; }
          if ((nMK === 5.8 || nMK === 5.9) && !foundSoNahMK) { foundSoNahMK = true; firstSoNahFachMK = fachNameMK; }
          if (nMK === 6.0 && !found6MK) { found6MK = true, first6FachMK = fachNameMK; }
          
          // Check for over 6.0 achievement
          if (nMK > 6.0) {
            achievedMK.overSix = true;
            if (!detailsMK.overSix) detailsMK.overSix = fachNameMK;
          }

          // Date-based achievement checks
          if (datesMK[idxMK]) {
            this.checkDateBasedAchievements(achievedMK, detailsMK, nMK, fachNameMK, datesMK[idxMK]);
          }

          if (nMK >= 6.0) perfect6CountMK++;
          else allPerfectScoreMK = false;
          
          if (nMK > bestNoteMK) bestNoteMK = nMK;
          
          if (nMK >= 4.0) {
            passedCountMK++;
            consecutivePassedMK++;
            maxConsecutivePassedMK = Math.max(maxConsecutivePassedMK, consecutivePassedMK);
          } else {
            failCountMK++;
            allPassedMK = false;
            consecutivePassedMK = 0;
            if (allGradesMK.length <= 3) firstThreePassedMK = false;
          }
          
          if (nMK < 4.0) noBelow4MK = false;
          if (nMK < 5.0) noBelow5MK = false;
        });
        
        // Subject improvement tracking
        let subjectImprovedMK = false;
        let consecutiveImprovementsMK = 0;
        let maxConsecutiveImprovementsMK = 0;
        
        for (let iMK = 1; iMK < gradesMK.length; iMK++) {
          if (gradesMK[iMK] > gradesMK[iMK-1]) {
            hasImprovementMK = true;
            subjectImprovedMK = true;
            consecutiveImprovementsMK++;
            maxConsecutiveImprovementsMK = Math.max(maxConsecutiveImprovementsMK, consecutiveImprovementsMK);
          } else {
            consecutiveImprovementsMK = 0;
            allTestsImprovedMK = false;
          }
        }
        
        if (subjectImprovedMK) {
          improvedSubjectsMK.push(fachNameMK);
          if (!achievedMK.firstImprovement) {
            achievedMK.firstImprovement = true;
            detailsMK.firstImprovement = fachNameMK;
          }
        }
        
        if (maxConsecutiveImprovementsMK >= 3) {
          achievedMK.threeInARow = true;
          detailsMK.threeInARow = fachNameMK;
        }
        
        // Check if last note is best
        if (gradesMK.length > 1) {
          const lastNoteMK = gradesMK[gradesMK.length - 1];
          const maxNoteInSubjectMK = Math.max(...gradesMK);
          if (lastNoteMK < maxNoteInSubjectMK) {
            bestLastNoteMK = false;
          }
        }
      }
      
      const overallAverageMK = totalWeightMK > 0 ? totalSumMK / totalWeightMK : 0;
      
      // Set basic achievements
      if (totalGradesMK >= 1) {
        achievedMK.firstTest = true;
      }
      if (totalGradesMK >= 2) {
        achievedMK.firstStep = true;
      }
      if (totalGradesMK >= 10) achievedMK.tenGrades = true;
      if (totalGradesMK >= 20) achievedMK.twentyGrades = true;
      if (totalGradesMK >= 50) achievedMK.gradeHoarding = true;
      if (subjectCountMK >= 5) achievedMK.survival = true;
      
      // Grade achievements
      if (found1MK) { achievedMK.first1 = true; detailsMK.first1 = first1FachMK; }
      if (found15MK) { achievedMK.first15 = true; detailsMK.first15 = first15FachMK; }
      if (found2MK) { achievedMK.first2 = true; detailsMK.first2 = first2FachMK; }
      if (found25MK) { achievedMK.first25 = true; detailsMK.first25 = first25FachMK; }
      if (found3MK) { achievedMK.first3 = true; detailsMK.first3 = first3FachMK; }
      if (found35MK) { achievedMK.first35 = true; detailsMK.first35 = first35FachMK; }
      if (found4MK) { achievedMK.first4 = true; detailsMK.first4 = first4FachMK; }
      if (found45MK) { achievedMK.first45 = true; detailsMK.first45 = first45FachMK; }
      if (found5MK) { achievedMK.first5 = true; detailsMK.first5 = first5FachMK; }
      if (found55MK) { achievedMK.first55 = true; detailsMK.first55 = first55FachMK; }
      if (foundSoNahMK) { achievedMK.soNahSoFern = true; detailsMK.soNahSoFern = firstSoNahFachMK; }
      if (found6MK) { achievedMK.first6 = true; detailsMK.first6 = first6FachMK; }
      
      // Pass/fail achievements
      if (firstThreePassedMK && totalGradesMK >= 3) achievedMK.noFailFirstThree = true;
      if (maxConsecutivePassedMK >= 5) achievedMK.fiveWithoutFail = true;
      if (allPassedMK && totalGradesMK > 0) achievedMK.allTestsPassed = true;
      if (noBelow4MK && totalGradesMK > 0) achievedMK.noBelow4 = true;
      if (noBelow5MK && totalGradesMK > 0) achievedMK.noBelow5 = true;
      
      // Fail achievements
      if (found1MK) {
        achievedMK.legendaryFail = true;
        detailsMK.legendaryFail = first1FachMK;
      }
      if (failCountMK >= 5) achievedMK.fiveBelow4 = true;
      if (failCountMK >= 3) achievedMK.paperCollector = true;
      
      // Improvement achievements
      if (hasImprovementMK) {
        achievedMK.youImproved = true;
        detailsMK.youImproved = improvedSubjectsMK[0];
      }
      if (allTestsImprovedMK && totalGradesMK > 1) achievedMK.allTestsImproved = true;
      if (improvedSubjectsMK.length === subjectCountMK && subjectCountMK > 1) achievedMK.allSubjectsImproved = true;
      if (bestLastNoteMK && totalGradesMK > 1) achievedMK.finishedStrong = true;
      
      // Average achievements
      if (Math.abs(overallAverageMK - 4.0) < 0.05) achievedMK.perfectlyMid = true;
      if (overallAverageMK >= 4.85 && overallAverageMK < 5.0) achievedMK.almostThere = true;
      if (overallAverageMK >= 5.0) achievedMK.avgAbove5 = true;
      if (overallAverageMK >= 5.2) achievedMK.avgAbove52 = true;
      if (overallAverageMK >= 5.9) achievedMK.avgAbove59 = true;
      
      // Perfection achievements
      if (perfect6CountMK >= 2) achievedMK.doubleSix = true;
      if (perfect6CountMK >= 5) achievedMK.five6 = true;
      if (perfect6CountMK >= 10) achievedMK.ten6 = true;
      if (allPerfectScoreMK && totalGradesMK > 0 && totalGradesMK >= 10) {
        achievedMK.allPerfect = true;
      }
      if (allPerfectScoreMK && totalGradesMK > 0 && totalGradesMK < 10) {
        achievedMK.perfectScore = true;
      }
      
      // Category achievements
      Object.entries(kategorienStatsMK).forEach(([kategorieMK, statsMK]) => {
        if (statsMK.hasFirst4) {
          if (kategorieMK === 'naturwissenschaften') achievedMK.naturwissenschaftenStart = true;
          else if (kategorieMK === 'sprache') achievedMK.sprachStart = true;
          else if (kategorieMK === 'gesellschaft') achievedMK.gesellschaftStart = true;
          else if (kategorieMK === 'kunst') achievedMK.kunstStart = true;
          else if (kategorieMK === 'sport') achievedMK.sportStart = true;
        }
        
        if (statsMK.above45 >= 2) {
          if (kategorieMK === 'gesellschaft') achievedMK.gesellschaftskenner = true;
          else if (kategorieMK === 'kunst') achievedMK.kreativ = true;
        }
        
        if (statsMK.above45 >= 3 && kategorieMK === 'naturwissenschaften') {
          achievedMK.naturwissenschaftenGut = true;
        }
        
        if (statsMK.faecher.length > 0 && statsMK.above5 === statsMK.faecher.length) {
          if (kategorieMK === 'naturwissenschaften') achievedMK.naturwissenschaftenMaster = true;
          else if (kategorieMK === 'sprache') achievedMK.sprachgenie = true;
          else if (kategorieMK === 'gesellschaft') achievedMK.gesellschaftsexperte = true;
          else if (kategorieMK === 'kunst') achievedMK.kuenstler = true;
          else if (kategorieMK === 'sport') achievedMK.sportass = true;
        }
      });
      
      // Subject-specific achievements
      for (const fachMK of notenDatenMK) {
        const fachNameMK = (fachMK.fachLangName || fachMK.fach || '').toLowerCase();
        const weightsMK = fachMK.gewichtung || fachMK.noten.map(() => 1);
        const weightedSumMK = fachMK.noten.reduce((sum, grade, idx) => sum + (grade * weightsMK[idx]), 0);
        const subjectWeightMK = weightsMK.reduce((sum, weight) => sum + weight, 0);
        const avgMK = weightedSumMK / subjectWeightMK;
        
        // Math achievements
        if ((fachNameMK.includes('mathematik') || fachNameMK.includes('mathe')) && fachMK.noten.some(n => n >= 4.0)) {
          achievedMK.mathStart = true;
        }
        if ((fachNameMK.includes('mathematik') || fachNameMK.includes('mathe')) && avgMK >= 5.5) {
          achievedMK.mathGenie = true;
        }
        
        // Language achievements
        if (fachNameMK.includes('deutsch') && fachMK.noten.some(n => n >= 4.0)) achievedMK.deutschStart = true;
        if (fachNameMK.includes('englisch') && fachMK.noten.some(n => n >= 4.0)) achievedMK.englischStart = true;
        if ((fachNameMK.includes('französisch') || fachNameMK.includes('francais')) && fachMK.noten.some(n => n >= 4.0)) {
          achievedMK.franzoesischStart = true;
        }
        if ((fachNameMK.includes('französisch') || fachNameMK.includes('francais')) && avgMK < 3.0 && avgMK >= 2.5) {
          achievedMK.franzoesischFail = true;
        }
        if ((fachNameMK.includes('französisch') || fachNameMK.includes('francais')) && avgMK < 2.5 && avgMK >= 2.0) {
          achievedMK.franzoesischPrononciation = true;
        }
        if ((fachNameMK.includes('französisch') || fachNameMK.includes('francais')) && avgMK < 2.0) {
          achievedMK.bonjour = true;
        }
        if ((fachNameMK.includes('französisch') || fachNameMK.includes('francais')) && avgMK >= 5.5) {
          achievedMK.franzoesischPerfect = true;
        }
        
        // Other subject achievements
        if (fachNameMK.includes('biologie') && avgMK >= 5.0) achievedMK.naturFreund = true;
        if (fachNameMK.includes('geschichte') && avgMK >= 5.0) achievedMK.geschichtsBuff = true;
        if ((fachNameMK.includes('bildnerisches gestalten') || fachNameMK.includes('bg')) && avgMK >= 5.0) {
          achievedMK.kunstKenner = true;
        }
        
        // Sport achievements
        if (fachNameMK.includes('sport') && fachMK.noten.some(n => n >= 4.0)) achievedMK.sportStart = true;
        
        // Subject master
        if (fachMK.noten.length >= 8) achievedMK.subjectMaster = true;
        
        // First subject above 6.0
        if (avgMK >= 6.0 && !detailsMK.firstSubjectAbove6) {
          achievedMK.firstSubjectAbove6 = true;
          detailsMK.firstSubjectAbove6 = fachMK.fachLangName || fachMK.fach;
        }
      }
      
      // Count various statistics
      const subjectsAbove4MK = notenDatenMK.filter(fMK => {
        const weightsMK = fMK.gewichtung || fMK.noten.map(() => 1);
        const weightedSumMK = fMK.noten.reduce((sum, grade, idx) => sum + (grade * weightsMK[idx]), 0);
        const subjectWeightMK = weightsMK.reduce((sum, weight) => sum + weight, 0);
        return (weightedSumMK / subjectWeightMK) >= 4.0;
      }).length;
      
      const subjectsAbove5MK = notenDatenMK.filter(fMK => {
        const weightsMK = fMK.gewichtung || fMK.noten.map(() => 1);
        const weightedSumMK = fMK.noten.reduce((sum, grade, idx) => sum + (grade * weightsMK[idx]), 0);
        const subjectWeightMK = weightsMK.reduce((sum, weight) => sum + weight, 0);
        return (weightedSumMK / subjectWeightMK) >= 5.0;
      }).length;
      
      // Subject-based achievements
      if (subjectsAbove4MK === notenDatenMK.length && notenDatenMK.length > 0) achievedMK.allAbove4 = true;
      if (subjectsAbove5MK === notenDatenMK.length && notenDatenMK.length > 0) achievedMK.allAbove5 = true;
      if (subjectsAbove5MK >= 5) achievedMK.fiveSubjectsAbove5 = true;
      if (subjectsAbove5MK >= 3) achievedMK.threeFachOver5 = true;
      
      // Count specific grade levels
      const above5CountMK = allGradesMK.filter(g => g.note >= 5.0).length;
      const above55CountMK = allGradesMK.filter(g => g.note >= 5.5).length;
      const below3CountMK = allGradesMK.filter(g => g.note < 3.0).length;
      
      if (above5CountMK >= 10) achievedMK.tenAbove5 = true;
      if (above5CountMK >= 3) achievedMK.first3Above5 = true;
      if (above55CountMK >= 5) achievedMK.fiveAbove55 = true;
      if (above5CountMK === 0 && totalGradesMK > 0) achievedMK.no5 = true;
      
      // Special conditions
      if (allGradesMK.every(g => g.note >= 3.0) && totalGradesMK > 0) achievedMK.noneBelow3 = true;
      if (allGradesMK.every(g => g.note >= 3.5) && totalGradesMK > 0) achievedMK.noBelow35 = true;
      if (allGradesMK.every(g => g.note >= 5.5 && g.note <= 6.0) && totalGradesMK > 0) achievedMK.highConsistency = true;
      
      // Motivational achievements
      if (allGradesMK.length >= 2 && allGradesMK[allGradesMK.length - 1].note > allGradesMK[allGradesMK.length - 2].note) {
        achievedMK.believer = true;
      }
      if (allGradesMK.length >= 1 && allGradesMK[allGradesMK.length - 1].note < 4.0) achievedMK.youGotThis = true;
      if (below3CountMK > 0) achievedMK.itsFine = true;
      if (overallAverageMK < 3.5 && totalGradesMK >= 5) achievedMK.theCurve = true;
      
      // Secret achievements
      if (failCountMK >= 5) achievedMK.coffeeAddict = true;
      if (below3CountMK >= 1) achievedMK.sleepyHead = true;
      if (below3CountMK >= 3) achievedMK.testPhobic = true;
      
      // Subject-specific secret achievements
      for (const fachMK of notenDatenMK) {
        const fachNameMK = (fachMK.fachLangName || fachMK.fach || '').toLowerCase();
        if (fachMK.noten.some(n => n < 3.0)) {
          if (fachNameMK.includes('mathematik') || fachNameMK.includes('mathe')) achievedMK.Calculator = true;
          if (fachNameMK.includes('deutsch')) achievedMK.spellchecker = true;
          if (fachNameMK.includes('englisch') || fachNameMK.includes('französisch') || fachNameMK.includes('spanisch')) {
            achievedMK.googleTranslate = true;
          }
          if (fachNameMK.includes('geschichte')) achievedMK.timeTravel = true;
          if (fachNameMK.includes('biologie') || fachNameMK.includes('chemie') || fachNameMK.includes('physik')) {
            achievedMK.labDisaster = true;
          }
          if (fachNameMK.includes('kunst') || fachNameMK.includes('bg')) achievedMK.artisticStruggle = true;
          if (fachNameMK.includes('sport')) achievedMK.benchWarmer = true;
        }
      }
      
      // Pattern-based secret achievements
      if (totalGradesMK >= 1 && allGradesMK[0].note >= 4.5) achievedMK.mondayMotivation = true;
      if (totalGradesMK >= 1 && allGradesMK[allGradesMK.length - 1].note >= 4.5) achievedMK.fridayFocus = true;
      if (allGradesMK.some(g => g.note >= 5.0)) achievedMK.rainydayRockstar = true;
      
      // Extreme achievements
      if (totalGradesMK >= 10) {
        const noteRangeMK = Math.max(...allGradesMK.map(g => g.note)) - Math.min(...allGradesMK.map(g => g.note));
        if (noteRangeMK >= 3.0 && noteRangeMK <= 4.0) achievedMK.perfectBalance = true;
      }
      
      // Procrastination patterns
      if (totalGradesMK >= 5) {
        const lastThreeBelow4MK = allGradesMK.slice(-3).filter(g => g.note < 4.0).length;
        if (lastThreeBelow4MK >= 2) achievedMK.procrastinator = true;
      }
      
      // Many more secret achievements based on patterns
      if (totalGradesMK >= 8) {
        achievedMK.penCollector = true;
      }
      if (totalGradesMK >= 12) {
        achievedMK.notesTaker = true;
      }
      if (totalGradesMK >= 15) {
        achievedMK.highlighterArtist = true;
      }
      
      if (below3CountMK >= 2) {
        achievedMK.phoneDistraction = true;
      }
      if (below3CountMK >= 3) {
        achievedMK.windowGazer = true;
      }
      if (below3CountMK >= 4) {
        achievedMK.powerNapper = true;
      }
      if (below3CountMK >= 5) {
        achievedMK.lastMinuteLearner = true;
      }
      if (below3CountMK >= 6) {
        achievedMK.blanketStudent = true;
      }
      
      // More fun achievements - each with different triggers
      if (below3CountMK >= 1 && totalGradesMK <= 3) {
        achievedMK.forgottenHomework = true;
      }
      if (below3CountMK >= 1 && allGradesMK.some(g => g.fach && g.fach.toLowerCase().includes('mathe'))) {
        achievedMK.wrongSubject = true;
      }
      if (below3CountMK >= 1 && totalGradesMK >= 5) {
        achievedMK.sickDay = true;
      }
      if (below3CountMK >= 1 && new Date().getDay() === 6) {
        achievedMK.weekendWarrior = true;
      }
      if (below3CountMK >= 1 && new Date().getDay() === 1) {
        achievedMK.mondayBlues = true;
      }
      if (below3CountMK >= 1 && (new Date().getMonth() === 0 || new Date().getMonth() === 8)) {
        achievedMK.holidayHangover = true;
      }
      
      return { achieved: achievedMK, details: detailsMK };
    }

    checkDateBasedAchievements(achievedMK, detailsMK, noteMK, fachNameMK, dateStringMK) {
      try {
        // Parse the date string (format: DD.MM.YYYY)
        const partsMK = dateStringMK.split('.');
        if (partsMK.length !== 3) return;
        
        const dayMK = parseInt(partsMK[0]);
        const monthMK = parseInt(partsMK[1]);
        const yearMK = parseInt(partsMK[2]);
        
        if (isNaN(dayMK) || isNaN(monthMK) || isNaN(yearMK)) return;
        
        const dateMK = new Date(yearMK, monthMK - 1, dayMK); // month is 0-based in Date constructor
        const dayOfWeekMK = dateMK.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        
        // === FEIERTAGE UND BESONDERE TAGE ===
        
        // Valentine's Day (February 14th)
        if (monthMK === 2 && dayMK === 14) {
          if (noteMK < 4.0) {
            achievedMK.valentinesFail = true;
            detailsMK.valentinesFail = fachNameMK;
          } else if (noteMK >= 5.0) {
            achievedMK.valentinesSuccess = true;
            detailsMK.valentinesSuccess = fachNameMK;
          }
        }
        
        // Halloween (October 31st)
        if (monthMK === 10 && dayMK === 31) {
          if (noteMK < 4.0) {
            achievedMK.halloweenShock = true;
            detailsMK.halloweenShock = fachNameMK;
          } else if (noteMK >= 5.0) {
            achievedMK.halloweenTreat = true;
            detailsMK.halloweenTreat = fachNameMK;
          }
        }
        
        // Christmas period (December 20-25)
        if (monthMK === 12 && dayMK >= 20 && dayMK <= 25) {
          achievedMK.xmasMiracle = true;
          detailsMK.xmasMiracle = fachNameMK;
          if (noteMK >= 5.0) {
            achievedMK.xmasGift = true;
            detailsMK.xmasGift = fachNameMK;
          }
        }
        
        // New Year period (January 1-7)
        if (monthMK === 1 && dayMK >= 1 && dayMK <= 7) {
          if (noteMK < 4.0) {
            achievedMK.newYearsFlop = true;
            detailsMK.newYearsFlop = fachNameMK;
          } else if (noteMK >= 5.0) {
            achievedMK.newYearsResolution = true;
            detailsMK.newYearsResolution = fachNameMK;
          }
        }
        
        // April Fools (April 1st)
        if (monthMK === 4 && dayMK === 1) {
          achievedMK.aprilFoolsJoke = true;
          detailsMK.aprilFoolsJoke = fachNameMK;
        }
        
        // Easter (approximate - around March/April)
        if ((monthMK === 3 && dayMK >= 20) || (monthMK === 4 && dayMK <= 25)) {
          achievedMK.easterSurprise = true;
          detailsMK.easterSurprise = fachNameMK;
        }
        
        // Mother's Day (second Sunday in May - approximate)
        if (monthMK === 5 && dayMK >= 8 && dayMK <= 14 && dayOfWeekMK === 0) {
          achievedMK.mothersDayGift = true;
          detailsMK.mothersDayGift = fachNameMK;
        }
        
        // Father's Day (third Sunday in June - approximate)
        if (monthMK === 6 && dayMK >= 15 && dayMK <= 21 && dayOfWeekMK === 0) {
          achievedMK.fathersDayScore = true;
          detailsMK.fathersDayScore = fachNameMK;
        }
        
        // === WOCHENTAG-BASIERTE ACHIEVEMENTS ===
        
        // Monday
        if (dayOfWeekMK === 1) {
          if (noteMK < 4.0) {
            achievedMK.mondayFail = true;
            detailsMK.mondayFail = fachNameMK;
          } else if (noteMK >= 5.0) {
            achievedMK.mondayMotivation = true;
            detailsMK.mondayMotivation = fachNameMK;
          }
        }
        
        // Tuesday
        if (dayOfWeekMK === 2 && noteMK < 4.0) {
          achievedMK.tuesdayBlues = true;
          detailsMK.tuesdayBlues = fachNameMK;
        }
        
        // Wednesday
        if (dayOfWeekMK === 3) {
          achievedMK.humpDay = true;
          detailsMK.humpDay = fachNameMK;
        }
        
        // Thursday
        if (dayOfWeekMK === 4) {
          achievedMK.thursdayThoughts = true;
          detailsMK.thursdayThoughts = fachNameMK;
        }
        
        // Friday
        if (dayOfWeekMK === 5) {
          if (noteMK >= 5.0) {
            achievedMK.fridayChamp = true;
            detailsMK.fridayChamp = fachNameMK;
          } else if (noteMK < 4.0) {
            achievedMK.fridayFail = true;
            detailsMK.fridayFail = fachNameMK;
          }
        }
        
        // Saturday
        if (dayOfWeekMK === 6) {
          achievedMK.saturdayWarrior = true;
          detailsMK.saturdayWarrior = fachNameMK;
        }
        
        // Sunday
        if (dayOfWeekMK === 0) {
          achievedMK.sundaySchool = true;
          detailsMK.sundaySchool = fachNameMK;
        }
        
        // === MONATS-BASIERTE ACHIEVEMENTS ===
        
        const monthAchievementsMK = {
          1: 'januaryFresh',
          2: 'februaryLove', 
          3: 'marchMadness',
          4: 'aprilShowers',
          5: 'mayFlowers',
          6: 'juneGraduation',
          7: 'julySummer',
          8: 'augustVacation',
          9: 'septemberReturn',
          10: 'octoberFest',
          11: 'novemberGratitude',
          12: 'decemberWonder'
        };
        
        if (monthAchievementsMK[monthMK]) {
          achievedMK[monthAchievementsMK[monthMK]] = true;
          detailsMK[monthAchievementsMK[monthMK]] = fachNameMK;
        }
        
        // === JAHRESZEIT-BASIERTE ACHIEVEMENTS ===
        
        // Spring (March 20 - June 20)
        if ((monthMK === 3 && dayMK >= 20) || monthMK === 4 || monthMK === 5 || (monthMK === 6 && dayMK <= 20)) {
          achievedMK.springAwakening = true;
          detailsMK.springAwakening = fachNameMK;
        }
        
        // Summer (June 21 - September 22)
        if ((monthMK === 6 && dayMK >= 21) || monthMK === 7 || monthMK === 8 || (monthMK === 9 && dayMK <= 22)) {
          achievedMK.summerVibes = true;
          detailsMK.summerVibes = fachNameMK;
        }
        
        // Autumn (September 23 - December 20)
        if ((monthMK === 9 && dayMK >= 23) || monthMK === 10 || monthMK === 11 || (monthMK === 12 && dayMK <= 20)) {
          achievedMK.autumnLeaves = true;
          detailsMK.autumnLeaves = fachNameMK;
        }
        
        // Winter (December 21 - March 19)
        if ((monthMK === 12 && dayMK >= 21) || monthMK === 1 || monthMK === 2 || (monthMK === 3 && dayMK <= 19)) {
          achievedMK.winterWonderland = true;
          detailsMK.winterWonderland = fachNameMK;
        }
        
        // === SPEZIELLE DATUM-KOMBINATIONEN ===
        
        // Friday the 13th
        if (dayOfWeekMK === 5 && dayMK === 13) {
          achievedMK.fridayThe13th = true;
          detailsMK.fridayThe13th = fachNameMK;
        }
        
        // Holiday hangover - test right after school holidays
        if ((monthMK === 9 && dayMK <= 15) || 
            (monthMK === 1 && dayMK <= 15) || 
            (monthMK === 4 && dayMK >= 15 && dayMK <= 30)) {
          if (noteMK < 4.0) {
            achievedMK.holidayHangover = true;
            detailsMK.holidayHangover = fachNameMK;
          }
        }
        
        // Snow season tests (winter months)
        if (monthMK === 12 || monthMK === 1 || monthMK === 2) {
          if (noteMK >= 5.0) {
            achievedMK.snowDay = true;
            detailsMK.snowDay = fachNameMK;
          }
        }
        
        // Rainy season (spring)
        if (monthMK >= 3 && monthMK <= 5) {
          if (noteMK >= 4.5) {
            achievedMK.rainydayRockstar = true;
            detailsMK.rainydayRockstar = fachNameMK;
          }
        }
        
        // Sunny season (summer)
        if (monthMK >= 6 && monthMK <= 8) {
          if (noteMK >= 5.0) {
            achievedMK.sunnyDisposition = true;
            detailsMK.sunnyDisposition = fachNameMK;
          }
        }
        
      } catch (errorMK) {
        console.warn('Error parsing date for achievement:', dateStringMK, errorMK);
      }
    }

    showAchievementToast(messageMK) {
      // Ensure message exists
      if (!messageMK) {
        console.warn("showAchievementToast called with empty message");
        return;
      }
      
      // Remove any existing toast first
      const existingToastMK = document.getElementById("achievement-toast");
      if (existingToastMK) existingToastMK.remove();
      
      const toastMK = document.createElement("div");
      toastMK.id = "achievement-toast";
      toastMK.style.cssText = `
        position:fixed;bottom:60px;left:50%;transform:translateX(-50%);
        background:#fffbe7;color:#ff9800;border:2px solid #ff9800;
        border-radius:12px;padding:18px 32px;font-size:18px;font-weight:bold;
        box-shadow:0 4px 24px rgba(0,0,0,0.18);z-index:999999;
        animation: toast-in 0.4s ease-out;max-width:80%;text-align:center;
        font-family:system-ui,-apple-system,sans-serif;
      `;
      toastMK.innerHTML = `${messageMK}`;
      
      // Add keyframes if not already added
      if (!document.getElementById("toast-style")) {
        const styleMK = document.createElement("style");
        styleMK.id = "toast-style";
        styleMK.innerHTML = `
          @keyframes toast-in { 
            0% { opacity:0; transform:translateX(-50%) translateY(30px) scale(0.9);} 
            100% { opacity:1; transform:translateX(-50%) translateY(0) scale(1);} 
          }
        `;
        document.head.appendChild(styleMK);
      }
      
      document.body.appendChild(toastMK);
      setTimeout(() => {
        toastMK.style.transition = "opacity 0.5s";
        toastMK.style.opacity = "0";
        setTimeout(() => {
          if (toastMK.parentNode) toastMK.remove();
        }, 500);
      }, 3000);
    }

    showAchievementRemovedToast(messageMK) {
      // Ensure message exists
      if (!messageMK) {
        console.warn("showAchievementRemovedToast called with empty message");
        return;
      }
      
      // Remove any existing removal toast first
      const existingToastMK = document.getElementById("achievement-removed-toast");
      if (existingToastMK) existingToastMK.remove();
      
      const toastMK = document.createElement("div");
      toastMK.id = "achievement-removed-toast";
      toastMK.style.cssText = `
        position:fixed;top:60px;left:50%;transform:translateX(-50%);
        background:#ffebee;color:#d32f2f;border:2px solid #d32f2f;
        border-radius:12px;padding:18px 32px;font-size:18px;font-weight:bold;
        box-shadow:0 4px 24px rgba(0,0,0,0.18);z-index:999999;
        animation: toast-in-top 0.4s ease-out;max-width:80%;text-align:center;
        font-family:system-ui,-apple-system,sans-serif;
      `;
      toastMK.innerHTML = `${messageMK}`;
      
      // Add keyframes for top toast if not already added
      if (!document.getElementById("toast-top-style")) {
        const styleMK = document.createElement("style");
        styleMK.id = "toast-top-style";
        styleMK.innerHTML = `
          @keyframes toast-in-top { 
            0% { opacity:0; transform:translateX(-50%) translateY(-30px) scale(0.9);} 
            100% { opacity:1; transform:translateX(-50%) translateY(0) scale(1);} 
          }
        `;
        document.head.appendChild(styleMK);
      }
      
      document.body.appendChild(toastMK);
      setTimeout(() => {
        toastMK.style.transition = "opacity 0.5s";
        toastMK.style.opacity = "0";
        setTimeout(() => {
          if (toastMK.parentNode) toastMK.remove();
        }, 500);
      }, 4000); // Show removed toast a bit longer
    }

    renderAchievements(notenDatenMK) {
      const outMK = document.getElementById('gamification-content');
      if (!outMK) return;
      
      if (!notenDatenMK || !notenDatenMK.length) {
        outMK.innerHTML = '<div style="color:#888;text-align:center;padding:20px;">Keine Noten gefunden.</div>';
        return;
      }

      const achievementDefsMK = this.getAchievementDefinitions();
      const { achieved, details } = this.processAchievements(notenDatenMK);
      
      // Load previous achievements and shown status
      let shownMK = {};
      let previousAchievedMK = {};
      try {
        shownMK = JSON.parse(localStorage.getItem("achievementsShown") || "{}");
        previousAchievedMK = JSON.parse(localStorage.getItem("achievementsPrevious") || "{}");
      } catch (eMK) {
        shownMK = {};
        previousAchievedMK = {};
      }
      
      // Check for removed achievements
      let removedAchievementsMK = [];
      for (const achievementIdMK in previousAchievedMK) {
        if (previousAchievedMK[achievementIdMK] && !achieved[achievementIdMK]) {
          // Achievement was removed
          const defMK = achievementDefsMK.find(d => d.id === achievementIdMK);
          if (defMK) {
            removedAchievementsMK.push({
              id: achievementIdMK,
              def: defMK,
              detail: previousAchievedMK[achievementIdMK].detail
            });
            // Remove from shown achievements so it can be earned again
            delete shownMK[achievementIdMK];
          }
        }
      }
      
      // Check for new achievements
      let newAchievementsMK = [];
      for (const defMK of achievementDefsMK) {
        if (achieved[defMK.id] && !shownMK[defMK.id]) {
          newAchievementsMK.push(defMK);
          shownMK[defMK.id] = true;
        }
      }
      
      // Update storage with current state
      const currentAchievedMK = {};
      for (const achievementIdMK in achieved) {
        if (achieved[achievementIdMK]) {
          currentAchievedMK[achievementIdMK] = {
            achieved: true,
            detail: details[achievementIdMK]
          };
        }
      }
      
      try {
        localStorage.setItem("achievementsShown", JSON.stringify(shownMK));
        localStorage.setItem("achievementsPrevious", JSON.stringify(currentAchievedMK));
      } catch (eMK) {
        console.warn("Could not save achievements to localStorage");
      }
      
      // Show removal toast for first removed achievement
      if (removedAchievementsMK.length > 0) {
        const removedMK = removedAchievementsMK[0];
        const messageMK = "❌ Achievement entfernt: " + 
          (typeof removedMK.def.text === "function" ? removedMK.def.text(removedMK.detail) : removedMK.def.text);
        console.log("Showing achievement removal toast:", messageMK);
        this.showAchievementRemovedToast(messageMK);
      }
      
      // Show toast for first new achievement
      if (newAchievementsMK.length > 0 && removedAchievementsMK.length === 0) {
        const defMK = newAchievementsMK[0];
        const detailMK = details[defMK.id];
        const messageMK = defMK.icon + " Achievement freigeschaltet: " + 
          (typeof defMK.text === "function" ? defMK.text(detailMK) : defMK.text);
        console.log("Showing achievement toast:", messageMK);
        this.showAchievementToast(messageMK);
      }

      // Update counter
      const achievedCountMK = Object.keys(achieved).length;
      const totalCountMK = achievementDefsMK.length;
      const counterMK = document.getElementById('achievement-counter');
      if (counterMK) {
        counterMK.textContent = `${achievedCountMK} / ${totalCountMK}`;
        const progressMK = achievedCountMK / totalCountMK;
        if (progressMK >= 0.8) {
          counterMK.style.background = '#e8f5e8';
          counterMK.style.color = '#4caf50';
        } else if (progressMK >= 0.5) {
          counterMK.style.background = '#fff3e0';
          counterMK.style.color = '#ff9800';
        } else {
          counterMK.style.background = '#f5f5f5';
          counterMK.style.color = '#666';
        }
      }

      // Render achievements by category
      this.renderAchievementsByCategory(achievementDefsMK, achieved, details, 'all', '');
      this.initializeCategorySystem(achievementDefsMK, achieved, details);
    }

    renderAchievementsByCategory(achievementDefsMK, achievedMK, detailsMK, categoryFilterMK = 'all', searchTermMK = '') {
      const outMK = document.getElementById('gamification-content');
      if (!outMK) return;

      // Filter achievements
      let filteredDefsMK = achievementDefsMK;
      if (categoryFilterMK !== 'all') {
        filteredDefsMK = achievementDefsMK.filter(defMK => defMK.category === categoryFilterMK);
      }
      if (searchTermMK) {
        const searchLowerMK = searchTermMK.toLowerCase();
        filteredDefsMK = filteredDefsMK.filter(defMK => {
          const detailMK = detailsMK[defMK.id];
          let txtMK;
          try {
            txtMK = typeof defMK.text === "function" ? defMK.text(detailMK) : defMK.text;
          } catch (e) {
            txtMK = "Achievement text error";
          }
          return txtMK.toLowerCase().includes(searchLowerMK) || defMK.icon.includes(searchTermMK);
        });
      }

      // Sort: achieved first, then by difficulty
      function diffRankMK(dMK) { return dMK === "hard" ? 0 : dMK === "medium" ? 1 : 2; }
      const reachedMK = filteredDefsMK.filter(defMK => achievedMK[defMK.id]).sort((aMK, bMK) => diffRankMK(aMK.difficulty) - diffRankMK(bMK.difficulty));
      const notReachedMK = filteredDefsMK.filter(defMK => !achievedMK[defMK.id]).sort((aMK, bMK) => diffRankMK(aMK.difficulty) - diffRankMK(bMK.difficulty));

      function diffColorMK(dMK) {
        if (dMK === "hard") return "#e53935";
        if (dMK === "medium") return "#fb8c00";
        return "#43a047";
      }

      let htmlMK = '';

      // Reached achievements
      if (reachedMK.length > 0) {
        htmlMK += `<div style="margin-bottom:15px;">
          <div style="font-weight: bold; color: #4caf50; margin-bottom: 8px; border-bottom: 2px solid #4caf50; padding-bottom: 4px;">
            ✅ Erreichte Achievements (${reachedMK.length})
          </div>
        </div>`;
        
        htmlMK += reachedMK.map(defMK => {
          const detailMK = detailsMK[defMK.id];
          let txtMK;
          try {
            txtMK = typeof defMK.text === "function" ? defMK.text(detailMK) : defMK.text;
          } catch (e) {
            txtMK = "Achievement text error";
          }
          const difficultyLabelMK = defMK.difficulty === 'hard' ? '🔥 Schwer' : defMK.difficulty === 'medium' ? '⚡ Mittel' : '🌱 Einfach';
          const explanationMK = this.getAchievementExplanation(defMK.id, detailMK);
          
          return `<div class="achievement-item" data-explanation="${explanationMK.replace(/"/g, '&quot;')}" style="margin:8px 0;padding:12px;border-radius:8px;border:2px solid ${diffColorMK(defMK.difficulty)};background:linear-gradient(135deg, ${diffColorMK(defMK.difficulty)}22, ${diffColorMK(defMK.difficulty)}11);color:#222;position:relative;box-shadow:0 2px 8px rgba(0,0,0,0.1);cursor:pointer;transition:transform 0.2s, box-shadow 0.2s;" onmouseover="this.style.transform='translateY(-2px)';this.style.boxShadow='0 4px 16px rgba(0,0,0,0.15)'" onmouseout="this.style.transform='translateY(0)';this.style.boxShadow='0 2px 8px rgba(0,0,0,0.1)'">
            <div style="position: absolute; top: 8px; right: 8px; background: ${diffColorMK(defMK.difficulty)}; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">
              ${difficultyLabelMK}
            </div>
            <div style="margin-right: 70px;">
              <span style="font-size:24px;margin-right:12px;">${defMK.icon}</span>
              <span style="font-weight:bold;">${txtMK}</span>
            </div>
          </div>`;
        }).join('');
      }

      // Unreached achievements
      if (notReachedMK.length > 0) {
        htmlMK += `<div style="margin: 20px 0 15px 0;">
          <div style="font-weight: bold; color: #999; margin-bottom: 8px; border-bottom: 2px solid #ddd; padding-bottom: 4px;">
            ⏳ Unerreichte Achievements (${notReachedMK.length})
          </div>
        </div>`;
        
        htmlMK += notReachedMK.map(defMK => {
          const detailMK = detailsMK[defMK.id];
          let txtMK, iconMK;
          
          // Secret achievements show ??? until achieved
          if (defMK.category === 'secret') {
            txtMK = "???";
            iconMK = "🔒";
          } else {
            try {
              txtMK = typeof defMK.text === "function" ? defMK.text(detailMK) : defMK.text;
              iconMK = defMK.icon;
            } catch (e) {
              txtMK = "Achievement text error";
              iconMK = defMK.icon;
            }
          }
          
          const difficultyLabelMK = defMK.difficulty === 'hard' ? '🔥 Schwer' : defMK.difficulty === 'medium' ? '⚡ Mittel' : '🌱 Einfach';
          const explanationMK = defMK.category === 'secret' ? "🔒 Geheimes Achievement - freigeschaltet wenn du es erreichst!" : this.getAchievementExplanation(defMK.id, detailMK);
          
          return `<div class="achievement-item" data-explanation="${explanationMK.replace(/"/g, '&quot;')}" style="margin:8px 0;padding:12px;border-radius:8px;border:2px dashed ${diffColorMK(defMK.difficulty)};background:#f9f9f9;color:#666;opacity:0.7;position:relative;cursor:pointer;transition:opacity 0.2s, transform 0.2s;" onmouseover="this.style.opacity='0.9';this.style.transform='translateY(-1px)'" onmouseout="this.style.opacity='0.7';this.style.transform='translateY(0)'">
            <div style="position: absolute; top: 8px; right: 8px; background: #ccc; color: white; padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold;">
              ${difficultyLabelMK}
            </div>
            <div style="margin-right: 70px;">
              <span style="font-size:24px;margin-right:12px;filter:grayscale(1);">${iconMK}</span>
              <span>${txtMK}</span>
            </div>
          </div>`;
        }).join('');
      }

      if (!reachedMK.length && !notReachedMK.length) {
        htmlMK += `<div style="text-align: center; color: #999; padding: 20px;">
          <div style="font-size: 48px; margin-bottom: 10px;">🔍</div>
          <div>Keine Achievements in dieser Kategorie gefunden.</div>
        </div>`;
      }

      outMK.innerHTML = htmlMK;
      
      // Add tooltip functionality
      this.initializeTooltips();
    }

    initializeTooltips() {
      // Remove existing tooltip if any
      const existingTooltipMK = document.getElementById('achievement-tooltip');
      if (existingTooltipMK) existingTooltipMK.remove();
      
      // Create tooltip element
      const tooltipMK = document.createElement('div');
      tooltipMK.id = 'achievement-tooltip';
      tooltipMK.style.cssText = `
        position: fixed;
        background: rgba(0, 0, 0, 0.9);
        color: white;
        padding: 12px 16px;
        border-radius: 8px;
        font-size: 14px;
        max-width: 300px;
        z-index: 10003;
        pointer-events: none;
        opacity: 0;
        transition: opacity 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        line-height: 1.4;
      `;
      document.body.appendChild(tooltipMK);
      
      // Add event listeners to achievement items
      const achievementItemsMK = document.querySelectorAll('.achievement-item');
      
      achievementItemsMK.forEach(itemMK => {
        const explanationMK = itemMK.dataset.explanation;
        if (!explanationMK) return;
        
        itemMK.addEventListener('mouseenter', (eMK) => {
          tooltipMK.innerHTML = explanationMK;
          tooltipMK.style.opacity = '1';
          
          // Position tooltip
          const rectMK = itemMK.getBoundingClientRect();
          const tooltipRectMK = tooltipMK.getBoundingClientRect();
          const windowWidthMK = window.innerWidth;
          const windowHeightMK = window.innerHeight;
          
          let leftMK = rectMK.left + (rectMK.width / 2) - (tooltipRectMK.width / 2);
          let topMK = rectMK.top - tooltipRectMK.height - 10;
          
          // Adjust if tooltip goes off screen
          if (leftMK < 10) leftMK = 10;
          if (leftMK + tooltipRectMK.width > windowWidthMK - 10) leftMK = windowWidthMK - tooltipRectMK.width - 10;
          if (topMK < 10) topMK = rectMK.bottom + 10;
          
          tooltipMK.style.left = leftMK + 'px';
          tooltipMK.style.top = topMK + 'px';
        });
        
        itemMK.addEventListener('mouseleave', () => {
          tooltipMK.style.opacity = '0';
        });
        
        // Also show tooltip on click for mobile users
        itemMK.addEventListener('click', (eMK) => {
          if (tooltipMK.style.opacity === '1') {
            tooltipMK.style.opacity = '0';
          } else {
            tooltipMK.innerHTML = explanationMK;
            tooltipMK.style.opacity = '1';
            
            const rectMK = itemMK.getBoundingClientRect();
            tooltipMK.style.left = rectMK.left + 'px';
            tooltipMK.style.top = (rectMK.bottom + 10) + 'px';
          }
        });
      });
    }

    initializeCategorySystem(achievementDefsMK, achievedMK, detailsMK) {
      const tabsMK = document.querySelectorAll('.category-tab');
      
      tabsMK.forEach(tabMK => {
        tabMK.addEventListener('click', () => {
          // Update active tab
          tabsMK.forEach(tMK => {
            tMK.classList.remove('active');
            tMK.style.background = 'white';
            tMK.style.color = '#ffb300';
          });
          
          tabMK.classList.add('active');
          tabMK.style.background = '#ffb300';
          tabMK.style.color = 'white';
          
          const categoryMK = tabMK.dataset.category;
          const searchTermMK = document.getElementById('achievement-search')?.value || '';
          this.renderAchievementsByCategory(achievementDefsMK, achievedMK, detailsMK, categoryMK, searchTermMK);
        });
      });
      
      // Add search functionality if search box exists
      const searchBoxMK = document.getElementById('achievement-search');
      if (searchBoxMK) {
        searchBoxMK.addEventListener('input', (eMK) => {
          const activeCategoryMK = document.querySelector('.category-tab.active')?.dataset.category || 'all';
          this.renderAchievementsByCategory(achievementDefsMK, achievedMK, detailsMK, activeCategoryMK, eMK.target.value);
        });
      }
    }
  }

  // Ensure class is available on window object immediately
  window.GamificationButton = GamificationButton;
  console.log('✓ GamificationButton class registered on window object');

})();
