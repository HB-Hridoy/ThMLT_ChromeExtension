import { loadHtmlFragment } from "./components.js";

const bottomNavBar = document.getElementById("bottom-nav-bar");

const screens = {
  HOME: {
    id: "home-screen",
    path: "src/core/screens/home/home.html",
  },
  TOOLS: {
    id: "tools-screen",
    path: "src/core/screens/tools/tools.html",
  },
  FONTS_MANAGEMENT: {
    id: "fonts-management-screen",
    path: "src/core/screens/font/fontsManagement.html",
  },
  COLOR_MANAGEMENT: {
    id: "color-management-screen",
    path: "src/core/screens/color/colorManagement.html",
  },
  PROJECT_MANAGEMENT: {
    id: "project-management-screen",
    path: "src/core/screens/projectManagement/projectManagement.html",
  },
  PROJECT_SETTINGS: {
    id: "project-settings-screen",
    path: "src/core/screens/projectSettings/projectSettings.html",
  },
};

const COLOR_TABS = {
  PRIMITIVES: {
    id: "primitives-screen",
    path: "src/core/screens/primitiveColor/primitiveColor.html"
  },
  SEMANTIC: {
    id: "semantic-screen",
    path: "src/core/screens/semanticColor/semanticColor.html"
  }
}

class ScreenManager {
  constructor() {
    this.debug = true; 

    this._loadedScreens = [];
    this._currentScreen = "";

    this._loadedTabs = [];

    this._navBarScreens = ["home-screen", "tools-screen", "info-screen"];
    this._currentNavBarScreen = "";
  }

  log(message, isError = false) {
    if (this.debug) {
      isError ? console.error(message) : console.log(message);
    }
  }

  setDebugMode(enabled) {
    this.debug = enabled;
    this.log(`Debug mode set to: ${enabled}`);
  }

  async switchScreen(screen) {
    this.log(`Switching to screen: ${screen.id}`);
    const screenId = screen.id;

    if (this._currentScreen === screenId) {
      this.log(`Already on screen: ${screenId}`);
      return;
    }

    await this.loadScreen(screen);

    if (this._currentScreen) {
      const prevEl = document.getElementById(this._currentScreen);
      prevEl?.classList.replace("visible", "hidden");
    }

    const targetScreen = document.getElementById(screenId);
    targetScreen?.classList.replace("hidden", "visible");

    if (this._navBarScreens.includes(screenId)) {
      this._navBarScreens.forEach((id) => {
        document
          .getElementById(`${id}-icon`)
          ?.classList.replace("text-blue-600", "text-gray-500");
      });
      document
        .getElementById(`${screenId}-icon`)
        ?.classList.replace("text-gray-500", "text-blue-600");
      this._currentNavBarScreen = screenId;
    }

    this._currentScreen = screenId;
    this.log(`Switched to: ${screenId}`);
  }

  _waitForElement(selector, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const start = performance.now();

      function check() {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start > timeout)
          return reject(`Element ${selector} not found in time`);
        requestAnimationFrame(check);
      }

      check();
    });
  }

  async loadScreen(screen) {
    if (this._loadedScreens.includes(screen.id)) {
      this.log(`Screen already loaded: ${screen.id}`);
      return;
    }
    const screenId = screen.id;
    const screenPath = screen.path;
    this.log(`Loading screen: ${screenId} from ${screenPath}`);
    const html = await loadHtmlFragment(screenPath);
    const screensContainer = document.getElementById("screens-container");

    screensContainer.insertAdjacentHTML("beforeend", html);

    // Wait until DOM element actually exists
    await this._waitForElement(`#${screenId}`);

    this._loadedScreens.push(screenId);
    this.log(`Screen loaded: ${screenId}`);
  }

  async loadTab(tab) {
    if (this._loadedTabs.includes(tab.id)) {
      this.log(`Tab already loaded: ${tab.id}`);
      return;
    }
    const tabId = tab.id;
    const tabPath = tab.path;
    this.log(`Loading tab: ${tabId} from ${tabPath}`);
    const html = await loadHtmlFragment(tabPath);
    const tabsContainer = document.getElementById("colors-tab-content");

    tabsContainer.insertAdjacentHTML("beforeend", html);

    // Wait until DOM element actually exists
    await this._waitForElement(`#${tabId}`);

    this._loadedTabs.push(tabId);
    this.log(`Tab loaded: ${tabId}`);
  }

  bottomNavigationBar(show){

    if (show) {
      bottomNavBar.classList.replace("hidden", "visible");
    } else {
      bottomNavBar.classList.replace("visible", "hidden");
    }


  }
}




const screenManager = new ScreenManager();

export { screenManager, screens, COLOR_TABS };
