
  import { doc } from "../../sidepanel.js";

  const projectManagementBackButton = doc.getElementById("pm-back-button");
  const projectManagementOptionsContainer = doc.getElementById("pm-options-container");

  projectManagementBackButton.addEventListener("click", (e)=>{
    ScreenManager.showHomeScreen();
  });

  projectManagementOptionsContainer.addEventListener("click", async (e)=>{
    const target = e.target;

    if (target.closest("#pm-color-themes")) {
      doc.getElementById("project-name-colors-screen").innerText = CacheOperations.activeProject;

      currentPrimitiveRowId = 1;
      currentSemanticRowId = 1;

      getAllPrimitiveColors(CacheOperations.activeProject);
      
      getAllSemanticColors(CacheOperations.activeProject);

      ScreenManager.showColorsScreen();
      
      
    }else if (target.closest("#pm-fonts")) {
      doc.getElementById("project-name-fonts-screen").innerText = CacheOperations.activeProject;

      currentFontsRowId = 1;
      getAllFonts(CacheOperations.activeProject);
      ScreenManager.showFontsScreen();
      
      
    }else if (target.closest("#pm-translations")) {
      const statusError = doc.getElementById("translation-status-error");
      const statusImported = doc.getElementById("translation-status-imported");

      if (statusImported.classList.contains("hidden")) {
        importTranslations();
      } else {
        const message = "Importing translations will overwrite the existing translations. Are you sure you want to continue?";
        openConfirmation(message, async () => {
          importTranslations();
        }, "Yes, Update");
      }

      async function importTranslations() {
        try {
          const translationJson = await getTranslationFile();

          try {
            addTranslations(CacheOperations.activeProject, translationJson);
            AlertManager.success("Translations imported successfully.");
            statusImported.classList.toggle("hidden", false);
            statusError.classList.toggle("hidden", true);
          } catch (error) {
            AlertManager.error("Error importing translations. Please check the logs.");
            console.error("Error importing translations:", error);
          }
          
        } catch (error) {
          //console.error("Translation JSON contains errors:", error);
          showMessage("Translation JSON contains errors", error);
        }
      };
    }
  });

  