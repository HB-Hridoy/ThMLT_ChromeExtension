
  import cacheManager from "../../../utils/cache/cacheManager.js";
  import { screenManager, screens, COLOR_TABS } from "../../../utils/screenManager.js";
  import { primitiveModal } from "../../modals/primitiveColorModal.js";
  import { InitializePrimitivesScreen, populatePrimitiveData } from "../primitiveColor/primitiveColor.js";
  import { semanticModal } from "../../modals/semanticColorModal.js";
  import { InitializeSemanticScreen, populateSemanticData } from "../semanticColor/semanticColor.js";
  import sessionManager from "../../../utils/sessionManager.js";

  let listenersAdded = false;
  let colorsAddButtonText = null;

  const TABS = {
    PRIMITIVE: "primitives",
    SEMANTIC: "semantic"
  };

  export async function showColorManagementScreen() {
    await screenManager.switchScreen(screens.COLOR_MANAGEMENT);

    await sessionManager.set(sessionManager.DATA.SCREEN, screens.COLOR_MANAGEMENT.id);

    await InitializePrimitivesScreen();
    await InitializeSemanticScreen();

    const colorScreenProjectName = document.getElementById("color-screen-project-name");
    colorScreenProjectName.innerText = cacheManager.projects.activeProjectName();

    populatePrimitiveData();
    populateSemanticData();

    if (listenersAdded) return;

    await primitiveModal.show(primitiveModal.modes.ADD);
    primitiveModal.hide();

    colorsAddButtonText = document.getElementById("colors-add-button-text");

    // ========== EVENT LISTENERS BEGIN ========== // 

    document.getElementById("primitives-tab").addEventListener('click', () => {
       showPrimitivesTab();
    }); 

    document.getElementById("semantic-tab").addEventListener('click', () => {
      showSemanticTab();
    });

    // Add event listeners and other initialization code here
    document.getElementById("color-screen-back-button").addEventListener("click", () => {
      screenManager.switchScreen(screens.PROJECT_MANAGEMENT);
    });

    document.getElementById("colors-add-button").addEventListener("click", () => {
      if (colorsAddButtonText.textContent === "Add Primitive"){
        primitiveModal.show(primitiveModal.modes.ADD);
      } else if (colorsAddButtonText.textContent === "Add Semantic"){
        semanticModal.show(semanticModal.modes.ADD);
      }
      
    });

    // ========== EVENT LISTENERS BEGIN ========== // 

    listenersAdded = true;
  }

  function SwitchTabs(tabName) {
  
    Object.values(TABS).forEach(tab => {
      if (!tab) return;
      document.getElementById(`${tab}-screen`).classList.replace("visible", "hidden");
      document.getElementById(`${tab}-tab`).className = "inline-block p-2 hover:text-blue-600";
    });
  
    document.getElementById(`${tabName}-screen`).classList.replace("hidden", "visible");
    document.getElementById(`${tabName}-tab`).className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
  }

  export async function showPrimitivesTab(){

    SwitchTabs(TABS.PRIMITIVE);
    colorsAddButtonText.textContent = "Add Primitive";
    await sessionManager.set(sessionManager.DATA.COLOR_TAB, COLOR_TABS.PRIMITIVES.id);

  }

  export async function showSemanticTab(){

    SwitchTabs(TABS.SEMANTIC);
    colorsAddButtonText.textContent = "Add Semantic"; 
    await sessionManager.set(sessionManager.DATA.COLOR_TAB, COLOR_TABS.SEMANTIC.id);

  }
  