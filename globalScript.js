  class CacheOperations {
    static activeProjectName = "";
    static activeThemeModesInSemantic = [];
    static activeSemanticNames = new Set();
    static activeSemantics = new Map();
    static activePrimitiveNames = [];
    static activePrimitives = new Map();
    static activeProjectNames = [];

    static updateProjectName(projectName) {
      this.activeProjectName = projectName;
    }

    static getProjectName() {
      return this.activeProjectName;
    }

    static addProject(projectName) {
      if (!this.activeProjectNames.includes(projectName)) {
        this.activeProjectNames.push(projectName);
      }
    }

    static deleteProject(projectName) {
      const index = this.activeProjectNames.indexOf(projectName);
      if (index !== -1) {
        this.activeProjectNames.splice(index, 1);
      }
    }

    static isProjectExist(projectName) {
      return this.activeProjectNames.includes(projectName);
    }

    static getAllProjects() {
      return [...this.activeProjectNames];
    }

    static addNewThemeMode(themeMode) {
      if (!this.activeThemeModesInSemantic.includes(themeMode)) {
        this.activeThemeModesInSemantic.push(themeMode);
      }
    }

    static getAllThemeModes() {
      return this.activeThemeModesInSemantic;
    }

    static renameThemeMode(oldThemeMode, newThemeMode) {
      this.deleteThemeMode(oldThemeMode);
      this.addNewThemeMode(newThemeMode);
    }

    static deleteThemeMode(themeMode) {
      this.activeThemeModesInSemantic = this.activeThemeModesInSemantic.filter(item => item !== themeMode);
    }

    static isThemeModeExist(themeMode) {
      return this.activeThemeModesInSemantic.includes(themeMode);
    }

    static addSemantic(semanticName, themeMode, semanticValue) {
      if (!this.activeSemantics.has(themeMode)) {
        this.activeSemantics.set(themeMode, {});
      }
      this.activeSemantics.get(themeMode)[semanticName] = semanticValue;
      this.activeSemanticNames.add(semanticName);
    }

    static getAllSemanticNames() {
      return Array.from(this.activeSemanticNames);
    }

    static getAllSemantics() {
      return this.activeSemantics;
    }

    static getSemanticValueForThemeMode(semanticName, themeMode) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        return themeData[semanticName] || null;
      }
      return null;
    }

    static updateSemantic(semanticName, themeMode, newSemanticValue) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        if (themeData.hasOwnProperty(semanticName)) {
          themeData[semanticName] = newSemanticValue;
          return true;
        }
      }
      return false;
    }

    static renameSemantic(oldSemanticName, newSemanticName) {
      if (this.activeSemanticNames.has(oldSemanticName)) {
        for (const [themeMode, themeData] of this.activeSemantics.entries()) {
          if (themeData.hasOwnProperty(oldSemanticName)) {
            const value = themeData[oldSemanticName];
            delete themeData[oldSemanticName];
            themeData[newSemanticName] = value;
          }
        }
        this.activeSemanticNames.delete(oldSemanticName);
        this.activeSemanticNames.add(newSemanticName);
        return true;
      }
      return false;
    }

    static deleteSemantic(semanticName) {
      if (this.activeSemanticNames.has(semanticName)) {
        for (const [themeMode, themeData] of this.activeSemantics.entries()) {
          if (themeData.hasOwnProperty(semanticName)) {
            delete themeData[semanticName];
          }
        }
        this.activeSemanticNames.delete(semanticName);
        return true;
      }
      return false;
    }

    static deleteSemanticForThemeMode(semanticName, themeMode) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        if (themeData.hasOwnProperty(semanticName)) {
          delete themeData[semanticName];
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
          return true;
        }
      }
      return false;
    }

    static isSemanticExist(semanticName) {
      return this.activeSemanticNames.has(semanticName);
    }

    static isSemanticExistInThemeMode(semanticName, themeMode) {
      if (this.activeSemantics.has(themeMode)) {
        const themeData = this.activeSemantics.get(themeMode);
        return themeData.hasOwnProperty(semanticName);
      }
      return false;
    }

    static addPrimitive(primitiveName, primitiveValue) {
      if (!this.activePrimitives.has(primitiveName)) {
        this.activePrimitives.set(primitiveName, primitiveValue);
        this.activePrimitiveNames.push(primitiveName);
      }
    }

    static getPrimitiveValue(primitiveName) {
      return this.activePrimitives.has(primitiveName) 
        ? this.activePrimitives.get(primitiveName) 
        : null;
    }

    static getAllPrimitives() {
      return Array.from(this.activePrimitives.entries());
    }

    static getAllPrimitiveNames() {
      return [...this.activePrimitiveNames];
    }

    static renamePrimitive(oldPrimitiveName, newPrimitiveName) {
      if (this.activePrimitives.has(oldPrimitiveName)) {
        const value = this.activePrimitives.get(oldPrimitiveName);
        this.deletePrimitive(oldPrimitiveName);
        this.addPrimitive(newPrimitiveName, value);
      }
    }

    static updatePrimitive(primitiveName, newPrimitiveValue) {
      if (this.activePrimitives.has(primitiveName)) {
        this.activePrimitives.set(primitiveName, newPrimitiveValue);
      }
    }

    static deletePrimitive(primitiveName) {
      if (this.activePrimitives.has(primitiveName)) {
        this.activePrimitives.delete(primitiveName);
        this.activePrimitiveNames = this.activePrimitiveNames.filter(name => name !== primitiveName);
      }
    }

    static isPrimitiveExist(primitiveName) {
      return this.activePrimitives.has(primitiveName);
    }

    static clearCache() {
      this.activeProjectName = "";
      this.activeThemeModesInSemantic = [];
      this.activeSemanticNames.clear();
      this.activeSemantics.clear();
      this.activePrimitiveNames = [];
      this.activePrimitives.clear();
      this.activeProjectNames = [];
    }
  }

  class SessionManager {
    static HOME_SCREEN = "home-screeen";
    static COLORS_SCREEN = "colors-screen";
    static TOOLS_SCREEN = "tools-screen";
    static INFO_SCREEN = "info-screen";
    static IMPORT_JSON_SCREEN = "import-json-screen";

    static PRIMITIVES_COLOR_TAB = "primitives";
    static SEMANTIC_COLOR_TAB = "semantic";

    static setSessionData(key, value) {
      chrome.storage.session.set({ [key]: value }, () => {
        //console.log(`[info] : ${key} set to '${value}' in current session.`);
      });
    }
    
    static getSessionData(key) {
      return new Promise((resolve) => {
        chrome.storage.session.get(key, (result) => {
          resolve(result[key]);
        });
      });
    }
    
    static setScreen(screenName){
      this.setSessionData("screen", screenName);
    }
    
    static async getScreen() {
      return await this.getSessionData("screen");
    }
    
    static setColorTab(colorTab){
      this.setSessionData("colorTab", colorTab);
    }
    
    static async getColorTab() {
      return await this.getSessionData("colorTab");
    }
    
    static setProject(project){
      this.setSessionData("project", project);
    }
    
    static async getProject() {
      return await this.getSessionData("project");
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

  class CreateElement {
    static projectTemplate(projectName, author, version) {
      return `<div project-id="${projectName}" class="project-preview-parent visible max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 bg-gray-50 border border-gray-200 rounded-lg shadow hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                            <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">${projectName}</h5>
                            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Author: ${author}</p>
                            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Version: ${version}</p>
                        </div>`
    }

    static semanticThemeModeCell(themeMode, isDefault = false) {
      const newTh = document.createElement('td');
      newTh.setAttribute("data-modal-target", "edit-theme-mode-modal");
      newTh.setAttribute("data-modal-toggle", "edit-theme-mode-modal");
      newTh.setAttribute("theme-mode", themeMode);
      newTh.setAttribute("default-theme-header", isDefault);  newTh.classList.add("semantic-table-cell");
      newTh.classList.add("semantic-table-cell-has-padding");
      newTh.innerHTML = themeMode;

      return newTh;
    }

    static semanticTableNameCell(dataIndex, semanticName) {
      return `<td data-index = "${dataIndex}" class="cursor-copy semantic-table-cell semantic-table-cell-has-padding">
                  <div class="flex flex-row items-center w-full overflow-hidden gap-2 select-none">
                      <div class="row-icon">
                          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                              <path fill="var(--color-icon)" fill-rule="evenodd"
                                  d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
                                  clip-rule="evenodd"></path>
                          </svg>
                      </div>
                      <div class="semantic-name inline-flex min-w-0 ">
                          ${semanticName}
                      </div>
                  </div>
                </td>
              `;
    }

    static semanticTableValueCell(dataIndex, semanticValue, themeMode) {
      return `
                <td class="semantic-table-cell semantic-value-cell" data-index = "${dataIndex}" theme-mode = ${themeMode}>
                    <div class="semantic-mode-value semantic-mode-cell hide-border ${semanticValue === "Click to link color" ? 'bg-red-200' : 'bg-white'} bg-red-200">
                        <div class="semantic-alias-pill-cell semantic-alias-pill-base">
                            <div class="semantic-pill-cover "
                                aria-disabled="false" 
                                style="transform: translate(0px, 0px);">
                                <div class="semantic-pill" >
                                    <div class="semantic-color-thumbnail-container">
                                        <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                                            style="background-color: ${semanticValue === "Click to link color" ? "#ffffff" : CacheOperations.getPrimitiveValue(semanticValue)}">
                                        </div>
                                    </div>
                                    <div class="semantic-pill-text">
                                                ${semanticValue === "Click to link color" ? semanticValue : "/ " + semanticValue}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </td>
              `;
    }
     
  }

  class ScreenManager {
    static mainNavScreens = ["home-screen", "tools-screen", "info-screen"]; 
    static activeNavScreen = "home-screen";
    static activeScreen = "home-screen";
    

    static switchScreen(screenName) {
      const targetScreen = document.getElementById(screenName);

      document.getElementById(this.activeScreen).classList.replace("visible", "hidden");
      targetScreen.classList.replace("hidden", "visible");

      if (this.mainNavScreens.includes(screenName)) {
        this.mainNavScreens.forEach(screenId => {
          document.getElementById(`${screenId}-icon`).classList.replace("text-blue-600", "text-gray-500");
          
        });
        document.getElementById(`${screenName}-icon`).classList.replace("text-gray-500", "text-blue-600");
        
        // this.activeNavScreen = screenName;
        // const activeIcon = document.getElementById(this.activeNavScreen + "-icon");
        // const targetIcon = document.getElementById(screenName + "-icon");

        // activeIcon.classList.replace("text-blue-600", "text-gray-500");
        // targetIcon.classList.replace("text-gray-500", "text-blue-600");
      }
      this.activeScreen = screenName;
    }

    static showBottomNavBar() {
      document.getElementById("bottom-nav-bar").classList.replace("hidden", "visible");
    }

    static hideBottomNavBar() {
      document.getElementById("bottom-nav-bar").classList.replace("visible", "hidden");
    }

    static showHomeScreen() { 
      this.switchScreen("home-screen"); 
      this.showBottomNavBar();

      SessionManager.setScreen(SessionManager.HOME_SCREEN);
    }

    static showNoProjectScreen() {
      document.getElementById("projects-container").classList.replace("visible", "hidden");
      document.getElementById("no-projects-container").classList.replace("hidden", "visible");
    }

    static showProjectsScreen() {
      document.getElementById("no-projects-container").classList.replace("visible", "hidden");
      document.getElementById("projects-container").classList.replace("hidden", "visible");
    }

    static showColorsScreen() {
      this.switchScreen("colors-screen");
      this.hideBottomNavBar();

      SessionManager.setScreen(SessionManager.COLORS_SCREEN);
      SessionManager.setColorTab(SessionManager.PRIMITIVES_COLOR_TAB);
      SessionManager.setProject(CacheOperations.getProjectName());
    }

    static showImportJsonScreen() {
    this.switchScreen("import-json-screen");
    this.hideBottomNavBar();

    SessionManager.setScreen(SessionManager.IMPORT_JSON_SCREEN);
    }

    static showToolsScreen() {
      this.switchScreen("tools-screen");
      this.showBottomNavBar();
    }

    static showInfoScreen() {
      this.switchScreen("info-screen");
      this.showBottomNavBar();
    }
  }

  class AlertManager {
    static showAlert(alertId, message = "", duration = 5000) {
      const alert = document.getElementById(alertId + "-alert");
      const alertText = document.getElementById(alertId + "-alert-text");
      if (alert && alertText) {
        alertText.innerHTML = message;
        alert.classList.replace('hidden', 'flex'); // Show the alert
        if (duration > 0) {
          setTimeout(() => alert.classList.replace('flex', 'hidden'), duration); // Hide after duration
        }
      }
    }

    static success(message = "", duration = 5000) {
      this.showAlert("success", message, duration);
    }

    static error(message = "", duration = 5000) {
      this.showAlert("danger", message, duration);
    }

    static info(message = "", duration = 5000) {
      this.showAlert("info", message, duration);
    }

    static warning(message = "", duration = 5000) {
      this.showAlert("warning", message, duration);
    }

    static dark(message = "", duration = 5000) {
      this.showAlert("dark", message, duration);
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


  let currentPrimitiveRowId = 1;
  let currentSemanticRowId = 1;

  const nameRegex = /^[A-Za-z0-9-_]+$/;

  let oldPrimitiveInputValues = new Map();

  let semanticTableColumns = 2;

  const bottomNavBar = document.getElementById("bottom-nav-bar");
  
  document.addEventListener('DOMContentLoaded', () => {
    
    document.querySelectorAll('[data-nav-button-screen-target]').forEach(button => {
      button.addEventListener('click', () => {
        ScreenManager.switchScreen(button.getAttribute("data-nav-button-screen-target"));
      });
    });
    ScreenManager.showHomeScreen();
  });

  async function restoreSession() {
    
      const sessionScreen = await SessionManager.getScreen();
      const sessionColorTab = await SessionManager.getColorTab();
      const sessionProject = await SessionManager.getProject();

      if(sessionScreen){
        console.log(...Logger.multiLog(
          ["[SESSION FOUND]", Logger.Types.DEBUG, Logger.Formats.BOLD],
          ["Restoring previous session."]
        ));
      }

      let restoreComplete = false;

      if (sessionScreen === SessionManager.COLORS_SCREEN && CacheOperations.isProjectExist(sessionProject)) {

        console.log(...Logger.multiLog(
          ["[SESSION PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
          ["Opening Colors-Screen for the previous session"]
        ));
        

        currentPrimitiveRowId = 1;
        currentSemanticRowId = 1;

        CacheOperations.updateProjectName(sessionProject);

        getAllPrimitiveColors(sessionProject);
        getAllSemanticColors(sessionProject);

        ScreenManager.showColorsScreen();

        // homeScreen.classList.replace("visible", "hidden");
        // colorsScreen.classList.replace("hidden", "visible");
        console.log(...Logger.multiLog(
          ["[SESSION PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
          ["Switching Color tab for the previous session"]
        ));
        SwitchTabs(sessionColorTab);

        restoreComplete = true;
    
      }else if (sessionScreen === SessionManager.HOME_SCREEN) {
        console.log(...Logger.multiLog(
          ["[SESSION PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
          ["Opening Home-Screen for the previous session"]
        ));
        ScreenManager.showHomeScreen();

        restoreComplete = true
        
      }

      if (restoreComplete) {
        console.log(...Logger.multiLog(
          ["[SESSION RESTORE COMPLETE]", Logger.Types.DEBUG, Logger.Formats.BOLD],
          ["Previous session restored successfully!"]
        ));
        
      } else {
        console.log(...Logger.multiLog(
          ["[NO SESSION FOUND]", Logger.Types.DEBUG, Logger.Formats.BOLD],
          ["Starting new session."]
        ));
      }


  }



  





