  class CacheOperations {
    constructor() {
      this.activeTemplateName = "";

      this.activeThemeModesInSemantic = [];
      this.activeSemanticNames = new Set();
      this.activeSemantics = new Map();
    
      this.activePrimitiveNames = [];
      this.activePrimitives = new Map();

      this.activeTemplateNames = [];
    }

    updateTemplateName(templateName){
      this.activeTemplateName = templateName;
    }
    getTemplateName(){
      return this.activeTemplateName;
    }

    addTemplate(templateName) {
      if (!this.activeTemplateNames.includes(templateName)) {
          this.activeTemplateNames.push(templateName);
      }
    }

    deleteTemplate(templateName) {
        const index = this.activeTemplateNames.indexOf(templateName);
        if (index !== -1) {
            this.activeTemplateNames.splice(index, 1);
        }
    }

    isTemplateExist(templateName) {
        return this.activeTemplateNames.includes(templateName);
    }

    getAllTemplates() {
        return [...this.activeTemplateNames];
    }

    addNewThemeMode(themeMode) {
      if (!this.activeThemeModesInSemantic.includes(themeMode)) {
        this.activeThemeModesInSemantic.push(themeMode);
      }
    }

    getAllThemeModes() {
      return this.activeThemeModesInSemantic;
    }

    updateThemeMode(oldThemeMode, newThemeMode) {
      this.deleteThemeMode(oldThemeMode);
      this.addNewThemeMode(newThemeMode);
    }

    deleteThemeMode(themeMode) {
      this.activeThemeModesInSemantic = this.activeThemeModesInSemantic.filter(item => item !== themeMode);
    }

    isThemeModeExist(themeMode) {
      return this.activeThemeModesInSemantic.includes(themeMode);
    }

    addSemantic(semanticName, themeMode, semanticValue) {
      // Check if the themeMode exists in the map, if not, create a new object for it
      if (!this.activeSemantics.has(themeMode)) {
        this.activeSemantics.set(themeMode, {});
      }

      // Add the semanticName and semanticValue to the themeMode
      this.activeSemantics.get(themeMode)[semanticName] = semanticValue;
      this.activeSemanticNames.add(semanticName);
    }

    getAllSemanticNames() {
      return Array.from(this.activeSemanticNames);
    }

    getAllSemantics(){
      return this.activeSemantics;
    }

    getSemanticValueForThemeMode(semanticName, themeMode) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        return themeData[semanticName] || null; // Return the value or null if not found
      }
      return null; // Theme mode doesn't exist
    }

    updateSemantic(semanticName, themeMode, newSemanticValue) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        if (themeData.hasOwnProperty(semanticName)) {
          themeData[semanticName] = newSemanticValue; // Update the value
          return true; // Update successful
        }
      }
      return false; // Update failed
    }

    renameSemantic(oldSemanticName, newSemanticName) {
      // Check if the old semantic name exists
      if (this.activeSemanticNames.has(oldSemanticName)) {
        // Rename the semantic name for each theme mode
        for (const [themeMode, themeData] of this.activeSemantics.entries()) {
          if (themeData.hasOwnProperty(oldSemanticName)) {
            const value = themeData[oldSemanticName]; // Get the value of the old semantic name
            delete themeData[oldSemanticName]; // Delete the old semantic name
            themeData[newSemanticName] = value; // Add the new semantic name with the same value
          }
        }
    
        // Remove the old semantic name from the activeSemanticNames set and add the new name
        this.activeSemanticNames.delete(oldSemanticName);
        this.activeSemanticNames.add(newSemanticName);
    
        return true; // Renaming successful
      }
      return false; // Renaming failed, old semantic name not found
    }
    

    deleteSemantic(semanticName) {
      // First check if the semantic name exists in the active semantic names
      if (this.activeSemanticNames.has(semanticName)) {
        // If exists, delete the semantic name from all theme modes
        for (const [themeMode, themeData] of this.activeSemantics.entries()) {
          if (themeData.hasOwnProperty(semanticName)) {
            delete themeData[semanticName]; // Delete the semantic from each theme
          }
        }
    
        // Remove the semantic name from the activeSemanticNames set
        this.activeSemanticNames.delete(semanticName);
        return true; // Deletion successful
      }
      return false; // Deletion failed, semantic name not found
    }

    deleteSemanticForThemeMode(semanticName, themeMode) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        if (themeData.hasOwnProperty(semanticName)) {
          delete themeData[semanticName]; // Delete the semantic

          // If the semantic name is no longer used across any theme modes, remove it from the set
          let isUsedElsewhere = false;
          for (const data of this.activeSemantics.values()) {
            if (data.hasOwnProperty(semanticName)) {
              isUsedElsewhere = true;
              break;
            }
          }

          if (!isUsedElsewhere) {
            this.activeSemanticNames.delete(semanticName);
          }

          return true; // Deletion successful
        }
      }
      return false; // Deletion failed
    }

    isSemanticExist(semanticName) {
      return this.activeSemanticNames.has(semanticName);
    }

    isSemanticExistInThemeMode(semanticName, themeMode) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        return themeData.hasOwnProperty(semanticName);
      }
      return false;
    }

    addPrimitive(primitiveName, primitiveValue) {
      if (!this.activePrimitives.has(primitiveName)) {
        this.activePrimitives.set(primitiveName, primitiveValue);
        this.activePrimitiveNames.push(primitiveName);
      }
    }

    getPrimitiveValue(primitiveName) {
      return this.activePrimitives.has(primitiveName) 
        ? this.activePrimitives.get(primitiveName) 
        : null;
    }

    getAllPrimitives() {
      return Array.from(this.activePrimitives.entries());
    }

    getAllPrimitiveNames() {
      return [...this.activePrimitiveNames];
    }

    renamePrimitive(oldPrimitiveName, newPrimitiveName) {
      if (this.activePrimitives.has(oldPrimitiveName)) {
        const value = this.activePrimitives.get(oldPrimitiveName);
        this.deletePrimitive(oldPrimitiveName);
        this.addPrimitive(newPrimitiveName, value);
      }
    }

    updatePrimitive(primitiveName, newPrimitiveValue) {
      if (this.activePrimitives.has(primitiveName)) {
        this.activePrimitives.set(primitiveName, newPrimitiveValue);
      }
    }

    deletePrimitive(primitiveName) {
      if (this.activePrimitives.has(primitiveName)) {
        this.activePrimitives.delete(primitiveName);
        this.activePrimitiveNames = this.activePrimitiveNames.filter(name => name !== primitiveName);
      }
    }

    isPrimitiveExist(primitiveName) {
      return this.activePrimitives.has(primitiveName);
    }

    clearCache() {
      this.activeTemplateName = "";
      this.activeThemeModesInSemantic = [];
      this.activeSemanticNames.clear();
      this.activeSemantics.clear();
      this.activePrimitiveNames = [];
      this.activePrimitives.clear();
      this.activeTemplateNames = [];
    }
  }

  class SessionManager {
    constructor() {
      this.HOME_SCREEN = "home-screeen";
      this.COLORS_SCREEN = "colors-screen";
      this.TOOLS_SCREEN = "tools-screen";
      this.INFO_SCREEN = "info-screen";

      this.PRIMITIVES_COLOR_TAB = "primitives";
      this.SEMANTIC_COLOR_TAB = "semantic";


    }

    setSessionData(key, value) {
      chrome.storage.session.set({ [key]: value }, () => {
          //console.log(`[info] : ${key} set to '${value}' in current session.`);
      });
    }
    
    getSessionData(key) {
        return new Promise((resolve) => {
            chrome.storage.session.get(key, (result) => {
                resolve(result[key]);
            });
        });
    }
    
    setScreen(screenName){
      this.setSessionData("screen", screenName);
    }
    async getScreen() {
      return await this.getSessionData("screen");
    }
    setColorTab(colorTab){
      this.setSessionData("colorTab", colorTab);
      
    }
    async getColorTab() {
      return await this.getSessionData("colorTab");
    }
    setTemplate(template){
      this.setSessionData("template", template);
      
    }
    async getTemplate() {
      return await this.getSessionData("template");
    }

  }

  class Logger {
    static Types = {
        DEFAULT: "default",
        SUCCESS: "success",
        INFO: "info",
        WARNING: "warning",
        ERROR: "error",
        SUBTLE: "subtle",
        DEBUG: "debug",
        CRITICAL: "critical",
    };

    static Formats = {
        REGULAR: "", 
        BOLD: "font-weight: bold;",
        ITALIC: "font-style: italic;",
        UNDERLINE: "text-decoration: underline;",
        STRIKETHROUGH: "text-decoration: line-through;",
        MONOSPACE: "font-family: monospace;",
        HIGHLIGHT: "background: rgba(255, 255, 0, 0.2); padding: 2px 4px; border-radius: 3px;",
        SHADOW: "text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);",
        UPPERCASE: "text-transform: uppercase;",
    };

    static styles = {
        default: "color: #ccc;",
        success: "color: #4CAF50;",
        info: "color: #2196F3;",
        warning: "color: #FFC107;",
        error: "color: #F44336;",
        subtle: "color: #888;",
        debug: "color: #8e44ad;",
        critical: "color: #ff5722; font-weight: bold; text-transform: uppercase;",
    };

    static log(...args) {
        let message = args[0];
        let type = args[1] || Logger.Types.DEFAULT;
        let format = args[2] || Logger.Formats.REGULAR;

        let style = Logger.styles[type] + format;
        return [`%c${message}`, style];
    }

    static multiLog(...args) {
        let msg = "", styles = [];
        
        args.forEach(([text, type = Logger.Types.DEFAULT, format = Logger.Formats.REGULAR]) => {
            msg += `%c${text} `;
            styles.push(Logger.styles[type] + format);
        });

        return [msg, ...styles];
    }
  }



  // **Example Usage**

/* 1. Single Log */
// console.log(...Logger.log("✔ Operation successful!", Logger.Types.SUCCESS, Logger.Formats.BOLD));
// Output: ✔ Operation successful! *(Green, Bold)*

// console.log(...Logger.log("System initialized."));
// Output: System initialized. *(Gray, Regular)*

// console.log(...Logger.log("⚠ Low disk space.", Logger.Types.WARNING, Logger.Formats.UNDERLINE));
// Output: ⚠ Low disk space. *(Yellow, Underlined)*

// console.log(...Logger.log("❌ Connection lost!", Logger.Types.ERROR, Logger.Formats.STRIKETHROUGH));
// Output: ❌ Connection lost! *(Red, Strikethrough)*

// console.log(...Logger.log("ℹ Data fetching...", Logger.Types.INFO, Logger.Formats.ITALIC));
// Output: ℹ Data fetching... *(Blue, Italic)*

// console.log(...Logger.log("🚨 Critical failure!", Logger.Types.CRITICAL, Logger.Formats.UPPERCASE));
// Output: 🚨 CRITICAL FAILURE! *(Red, Bold, Uppercase)*


/* 2. Multi Log */
// console.log(...Logger.multiLog(
//     ["[INFO] ", Logger.Types.INFO, Logger.Formats.BOLD],
//     ["Fetching data...", Logger.Types.DEFAULT],
//     [" Done!", Logger.Types.SUCCESS, Logger.Formats.ITALIC]
// ));
// Output: **[INFO]** *(Blue, Bold)* **Fetching data...** *(Gray, Regular)* **Done!** *(Green, Italic)*

// console.log(...Logger.multiLog(
//     ["Old Price: $100", Logger.Types.WARNING],
//     [" New Price: $50", Logger.Types.SUCCESS, Logger.Formats.BOLD]
// ));
// Output: Old Price: $100 *(Yellow, Regular)* **New Price: $50** *(Green, Bold)*

// console.log(...Logger.multiLog(
//     ["Initializing system... ", Logger.Types.INFO],
//     ["⚠ Low memory! ", Logger.Types.WARNING, Logger.Formats.ITALIC],
//     ["✔ Operation completed", Logger.Types.SUCCESS, Logger.Formats.HIGHLIGHT]
// ));
// Output: Initializing system... *(Blue, Regular)* ⚠ *Low memory!* *(Yellow, Italic)* ✔ **Operation completed** *(Green, Highlight)*



console.log(...Logger.log("System initialized.", Logger.Types.WARNING, Logger.Formats.HIGHLIGHT));
  
  let activeScreen = "home-screen";

  const cacheOperations = new CacheOperations();
  const sessionManager = new SessionManager();

  let currentPrimitiveRowId = 1;
  let currentSemanticRowId = 1;

  const nameRegex = /^[A-Za-z0-9-_]+$/;

  let oldPrimitiveInputValues = new Map();

  let semanticTableColumns = 2;
  
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-nav-button-screen-target]');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.getAttribute("data-nav-button-screen-target");

            console.log(targetScreenId);
            

            SwitchScreen(targetScreenId);
        });
    });

    
      
  });


  function SwitchScreen(screenName){
    const targetScreen = document.getElementById(screenName);
    
    document.getElementById(activeScreen).classList.replace("visible", "hidden");
    targetScreen.classList.replace("hidden", "visible");

    const activeIcon = document.getElementById(activeScreen + "-icon");
    const targetIcon = document.getElementById(screenName + "-icon");

    activeIcon.classList.replace("text-blue-600", "text-gray-500");
    targetIcon.classList.replace("text-gray-500", "text-blue-600");

    activeScreen = screenName;
  }

  function ShowAlert(alertId, meassage = "", duration = 5000) {
    const alert = document.getElementById(alertId+"-alert");
    const alertText = document.getElementById(alertId+"-alert-text");
    if (alert && alertText) {
      alertText.innerHTML = meassage;
      alert.classList.replace('hidden', 'flex'); // Show the alert
      if (duration > 0) {
        setTimeout(() => alert.classList.replace('flex', 'hidden'), duration); // Hide after duration
      }
    }
  }
  





