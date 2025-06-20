
  import cacheManager from "../../../utils/cache/cacheManager.js";
  import { screenManager, screens} from "../../../utils/screenManager.js";
  import { fontModal } from "../../modals/fontModal.js";
  import { fontTableManager } from "../../../utils/fontsTableManager.js";
  import sessionManager from "../../../utils/sessionManager.js";
  import { getDatabaseManager } from "../../../db/DatabaseManager.js";
  import { typographyTableManager } from "../../../utils/typographyTableManager.js";
  import { typographyModal } from "../../modals/typographyModal.js";

  let fontsTableScreen = null;
  let noFontsScreen = null;

  let typographyTableScreen = null;
  let noTypographyScreen = null;
  
  let typographyManagementAddButtonText = null;

  let isDataInitialized = false;

  let projectNameElement = null;

  let listenersAdded = false;


  let db = null;

  export async function showTypographyManagementScreen() {

    await fontTableManager.init();
    await typographyTableManager.init();
    
    if (!db) {
      db = await getDatabaseManager();
    }

    await screenManager.switchScreen(screens.TYPOGRAPHY_MANAGEMENT);
    addEventListeners();

    await sessionManager.set(sessionManager.DATA.SCREEN, screens.TYPOGRAPHY_MANAGEMENT.id);

    await init();
    await populateData();

    updateProjectName();
  }

  async function init() {

    const projectName = cacheManager.projects.activeProjectName();
    const currentName = projectNameElement.innerText.trim();

    if (projectName !== currentName) {
      isDataInitialized = false;
    }
    
  }

  // Fetch and render data
  async function populateData() {
    if (isDataInitialized) {
      console.log("[INFO] Fonts and Typography data already initialized");
      return;
    }

    const projectId = cacheManager.projects.activeProjectId;

    const fontsData = await db.fonts.getAll({ projectId });

    fontTableManager.deleteAllRows();

    fontsData.forEach(({ fontId, fontName, fontValue, orderIndex }) => {
      fontTableManager.addRow({ fontId, fontName, fontValue, orderIndex });
    });

    fontsData.length === 0 ? showNoFontsScreen() : showFontsScreen();

    // Typography Screen
    const typographyData = await db.typography.getAll({ 
      projectId,
      doCache: true
    });

    typographyTableManager.deleteAllRows();

    if (typographyData.length === 0) {
      showNoTypographyScreen();
    } else {
      typographyData.forEach(({ typographyId, typographyName, linkedFont, fontSize, lineHeight, letterSpacing, orderIndex }) => {
        typographyTableManager.addRow({
          typographyId,
          typographyName,
          linkedFont,
          fontSize,
          lineHeight,
          letterSpacing,
          orderIndex
        });
      });

      showTypographyScreen();
    }


    isDataInitialized = true;
  }

  // Set project name in UI
  function updateProjectName() {
    projectNameElement.innerText = cacheManager.projects.activeProjectName();
  }

  // Attach UI event listeners
  function addEventListeners() {
    if (listenersAdded) return;

    // ====== GLOBAL VARIABLES START ===== //

    fontsTableScreen = document.getElementById("fonts-table-container");
    noFontsScreen = document.getElementById("no-fonts-screen");

    typographyTableScreen = document.getElementById("typography-table-container");
    noTypographyScreen = document.getElementById("no-typography-screen");

    projectNameElement = document.getElementById("typography-screen-project-name");

    typographyManagementAddButtonText = document.getElementById("typography-management-add-button-text");

    // ====== GLOBAL VARIABLES END ===== //

    document.getElementById("fonts-tab").addEventListener('click', () => {
      showFontsTab();
    }); 

    document.getElementById("typography-tab").addEventListener('click', () => {
      showTypographyTab();
    });

    document
      .getElementById("typography-screen-back-button")
      .addEventListener("click", () => {
        screenManager.switchScreen(screens.PROJECT_MANAGEMENT);
      });

    document.getElementById("typography-management-add-button").addEventListener("click", () => {
      if (typographyManagementAddButtonText.textContent === "Add Font"){
        fontModal.show({ mode: fontModal.modes.ADD });
      } else if (typographyManagementAddButtonText.textContent === "Add Typography"){
        typographyModal.show({ mode: typographyModal.modes.ADD })
      }        
    });

      listenersAdded = true;
  }

  const TABS = {
    FONT: "fonts",
    TYPOGRAPHY: "typography"
  };

  function SwitchTabs(tabName) {
  
    Object.values(TABS).forEach(tab => {
      if (!tab) return;
      document.getElementById(`${tab}-screen`).classList.replace("visible", "hidden");
      document.getElementById(`${tab}-tab`).className = "inline-block p-2 hover:text-blue-600";
    });
  
    document.getElementById(`${tabName}-screen`).classList.replace("hidden", "visible");
    document.getElementById(`${tabName}-tab`).className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
  }

  export async function showFontsTab(){

    SwitchTabs(TABS.FONT);
    typographyManagementAddButtonText.textContent = "Add Font";

  }

  export async function showTypographyTab(){

    SwitchTabs(TABS.TYPOGRAPHY);
    typographyManagementAddButtonText.textContent = "Add Typography"; 

  }

  
  function toggleFontsScreen(showFonts = true) {
    fontsTableScreen.classList.toggle("hidden", !showFonts);
    noFontsScreen.classList.toggle("hidden", showFonts);
  }

  export function showFontsScreen() {
    toggleFontsScreen(true);
  }

  export function showNoFontsScreen() {
    toggleFontsScreen(false);
  }

  function toggleTypographyScreen(showTable = true) {
    typographyTableScreen.classList.toggle("hidden", !showTable);
    noTypographyScreen.classList.toggle("hidden", showTable);
  }

  export function showTypographyScreen() {
    toggleTypographyScreen(true);
  }

  export function showNoTypographyScreen() {
    toggleTypographyScreen(false);
  }

