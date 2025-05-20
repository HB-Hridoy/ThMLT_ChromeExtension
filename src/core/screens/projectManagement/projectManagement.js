import cacheManager from "../../../utils/cache/cacheManager.js";
import DatabaseManager from "../../../db/DatabaseManager.js";
import { components } from "../../../utils/components.js";
import { screenManager, screens } from "../../../utils/screenManager.js";
import { alertManager } from "../../../utils/alertsManager.js";
import { showColorManagementScreen, showPrimitivesTab } from "../color/colorManagement.js";
import { showFontsManagementScreen } from "../font/fontsManagement.js";

let listenersAdded = false;

let projectManagementBackButton;
let projectManagementOptionsContainer;

export async function showProjectManagementScreen() {
  await screenManager.switchScreen(screens.PROJECT_MANAGEMENT);

  document.getElementById("pm-project-name").innerText = cacheManager.projects.activeProjectName();

  if (listenersAdded) return;

  projectManagementBackButton = document.getElementById("pm-back-button");
  projectManagementOptionsContainer = document.getElementById("pm-options-container");

  projectManagementBackButton.addEventListener("click", async () => {
    await screenManager.switchScreen(screens.HOME);
  });

  projectManagementOptionsContainer.addEventListener("click", async (e)=>{
    const target = e.target;

    if (target.closest("#pm-color-themes")) {
      
      await showColorManagementScreen();
      await showPrimitivesTab();
      

    }
    else if (target.closest("#pm-fonts")) {

      await showFontsManagementScreen();

    }
    // else if (target.closest("#pm-translations")) {
    //   const statusError = document.getElementById("translation-status-error");
    //   const statusImported = document.getElementById("translation-status-imported");

    //   if (statusImported.classList.contains("hidden")) {
    //     importTranslations();
    //   } else {
    //     const message = "Importing translations will overwrite the existing translations. Are you sure you want to continue?";
    //     openConfirmation(message, async () => {
    //       importTranslations();
    //     }, "Yes, Update");
    //   }

    //   async function importTranslations() {
    //     try {
    //       const translationJson = await getTranslationFile();

    //       try {
    //         addTranslations(CacheOperations.activeProject, translationJson);
    //         AlertManager.success("Translations imported successfully.");
    //         statusImported.classList.toggle("hidden", false);
    //         statusError.classList.toggle("hidden", true);
    //       } catch (error) {
    //         AlertManager.error("Error importing translations. Please check the logs.");
    //         console.error("Error importing translations:", error);
    //       }

    //     } catch (error) {
    //       //console.error("Translation JSON contains errors:", error);
    //       showMessage("Translation JSON contains errors", error);
    //     }
    //   };
    // }
  });

  // end of the listeners
  listenersAdded = true;
}
