
  import cacheManager from "../../../utils/cache/cacheManager.js";
  import DatabaseManager from "../../../db/DatabaseManager.js";
  import { primitiveModal } from "../../modals/primitiveColorModal.js";
  import { screenManager, screens} from "../../../utils/screenManager.js";
  import { fontModal } from "../../modals/fontModal.js";
import { fontTableManager } from "../../../utils/fontsTableManager.js";

  let init = false;
  let fontsTableScreen = null;
  let noFontsScreen = null;
  let isFontsDataInitialized = false;

  let listenersAdded = false;

  // Exported Entry Point
  export async function showFontsManagementScreen() {
    await screenManager.switchScreen(screens.FONTS_MANAGEMENT);
    await initializeFontsScreen();
    await populateFontsData();

    updateProjectName();

    if (listenersAdded) return;
    addEventListeners();
    listenersAdded = true;
  }

  // Initialize Fonts Screen DOM elements (once)
  async function initializeFontsScreen() {
    if (!init) {
      fontsTableScreen = document.getElementById("fonts-table-container");
      noFontsScreen = document.getElementById("no-fonts-screen");
    }

    const projectName = cacheManager.projects.activeProjectName();
    const currentName = document.getElementById("fonts-screen-project-name").innerText.trim();

    if (projectName !== currentName) {
      isFontsDataInitialized = false;
    }
  }

  // Fetch and render fonts data
  async function populateFontsData() {
    if (isFontsDataInitialized) {
      console.log("[INFO] Fonts data already initialized");
      return;
    }

    const projectId = cacheManager.projects.activeProjectId;
    const fontsData = await DatabaseManager.fonts.getAll({ projectId });

    fontTableManager.deleteAllRows();

    fontsData.forEach(({ fontId, fontName, fontValue }) => {
      fontTableManager.addRow({ fontId, fontName, fontValue });
    });

    fontsData.length === 0 ? showNoFontsScreen() : showFontsScreen();
    isFontsDataInitialized = true;
  }

  // Set project name in UI
  function updateProjectName() {
    document.getElementById("fonts-screen-project-name").innerText =
      cacheManager.projects.activeProjectName();
  }

  // Attach UI event listeners
  function addEventListeners() {
    document
      .getElementById("fonts-screen-back-button")
      .addEventListener("click", () => {
        screenManager.switchScreen(screens.PROJECT_MANAGEMENT);
      });

    document
      .getElementById("fonts-add-button")
      .addEventListener("click", () => {
        fontModal.show({ mode: fontModal.modes.ADD });
      });
  }

  
  export function showFontsScreen(){
    if(fontsTableScreen.classList.contains("hidden")) {
      fontsTableScreen.classList.remove("hidden");
      noFontsScreen.classList.add("hidden");
    }
    
  }
  
  export function showNoFontsScreen(){
    if (noFontsScreen.classList.contains("hidden")){
      fontsTableScreen.classList.add("hidden");
      noFontsScreen.classList.remove("hidden");
    }
  
  }

