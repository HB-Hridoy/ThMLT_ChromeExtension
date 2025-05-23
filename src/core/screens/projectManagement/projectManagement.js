import cacheManager from "../../../utils/cache/cacheManager.js";
import DatabaseManager from "../../../db/DatabaseManager.js";
import { components } from "../../../utils/components.js";
import { screenManager, screens } from "../../../utils/screenManager.js";
import { alertManager } from "../../../utils/alertsManager.js";
import { showColorManagementScreen, showPrimitivesTab } from "../color/colorManagement.js";
import { showFontsManagementScreen } from "../font/fontsManagement.js";
import { confirmationModal } from "../../modals/confirmationModal.js";
import { showMessageModal } from "../../modals/messageModal.js";
import { showProjectSettingsScreen } from "../projectSettings/projectSettings.js";
import sessionManager from "../../../utils/sessionManager.js";
import { showHomeScreen } from "../home/home.js";

let listenersAdded = false;

let projectManagementBackButton;
let projectManagementOptionsContainer;

let translationStatusError;
let translationStatusImported;

export async function showProjectManagementScreen() {
  await screenManager.switchScreen(screens.PROJECT_MANAGEMENT);

  await sessionManager.set(sessionManager.DATA.PROJECT_ID, cacheManager.projects.activeProjectId);
  await sessionManager.set(sessionManager.DATA.SCREEN, screens.PROJECT_MANAGEMENT.id);

  screenManager.bottomNavigationBar(false);

  document.getElementById("pm-project-name").innerText = cacheManager.projects.activeProjectName();

  try {
    const statusError = document.getElementById("translation-status-error");
    const statusImported = document.getElementById("translation-status-imported");

    const hasTranslation = await DatabaseManager.translations.hasTranslationForProject({ 
      projectId: cacheManager.projects.activeProjectId 
    })
    statusError.classList.toggle("hidden", hasTranslation);
    statusImported.classList.toggle("hidden", !hasTranslation);
  } catch (error) {
    console.error("[PROJECT MANAGEMENT] Error checking translation data availability:", error);
  }

  if (listenersAdded) return;

  projectManagementBackButton = document.getElementById("pm-back-button");
  projectManagementOptionsContainer = document.getElementById("pm-options-container");

  translationStatusError = document.getElementById("translation-status-error");
  translationStatusImported = document.getElementById("translation-status-imported");

  projectManagementBackButton.addEventListener("click", async () => {
    showHomeScreen();
    sessionManager.clear();
  });

  document.getElementById("open-project-settings").addEventListener('click', ()=>{
    showProjectSettingsScreen();
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
    else if (target.closest("#pm-translations")) {

      if (translationStatusImported.classList.contains("hidden")) {
        importTranslations();
      } else {
        
        const confirmed = await confirmationModal.confirm({
          message: "Importing translations will overwrite the existing translations. Are you sure you want to continue?",
          confirmButtonText: "Yes, Update"
        });

        if (confirmed) {
          importTranslations();
        }
      }

      async function importTranslations() {
        try {
          const translationJson = await getTranslationFile();

          DatabaseManager.translations.add({
            projectId: cacheManager.projects.activeProjectId,
            translationData: translationJson
          });

          translationStatusError.classList.toggle("hidden", true);
          translationStatusImported.classList.toggle("hidden", false);

        } catch (error) {
          
          showMessageModal({
            title: "Invalid Translations JSON",
            message: error,
          });
        }
      };

      function getTranslationFile() {
        return new Promise((resolve, reject) => {
  
          const input = document.createElement("input");
          input.type = "file";
          input.accept = "application/json"; // Only allow JSON files
      
          input.onchange = function(event) {
              const file = event.target.files[0]; // Get selected file
              if (!file) return;
      
              const reader = new FileReader();
              reader.onload = function(e) {
                  try {
                      let jsonData = JSON.parse(e.target.result); // Parse JSON
                      let errors = [];
      
                      // Validate SupportedLanguages and DefaultLanguage
                      if (!jsonData.SupportedLanguages || !Array.isArray(jsonData.SupportedLanguages)) {
                          errors.push("SupportedLanguages must be an array.");
                          jsonData.SupportedLanguages = []; // Fix issue
                      }
      
                      if (!jsonData.DefaultLanguage || !jsonData.SupportedLanguages.includes(jsonData.DefaultLanguage)) {
                          errors.push("DefaultLanguage must be one of the SupportedLanguages.");
                          jsonData.DefaultLanguage = jsonData.SupportedLanguages[0] || "en"; // Auto-fix
                      }
      
                      if (!jsonData.Translations || typeof jsonData.Translations !== "object") {
                          errors.push("Translations must be an object.");
                          jsonData.Translations = {}; // Fix issue
                      }
      
                      // Validate each translation entry
                      for (const key in jsonData.Translations) {
                          const value = jsonData.Translations[key];
      
                          if (typeof value === "string") {
                              // Section Object (Valid)
                          } else if (typeof value === "object") {
                              // Translation Object - Check if all SupportedLanguages exist
                              jsonData.SupportedLanguages.forEach(lang => {
                                  if (!(lang in value)) {
                                      errors.push(`Missing translation for '${key}' in language '${lang}'.`);
                                      value[lang] = ""; // Auto-fix
                                  }
                              });
                          } else {
                              errors.push(`Invalid translation entry for '${key}'. Must be a string (section) or object (translation).`);
                              delete jsonData.Translations[key]; // Remove invalid entry
                          }
                      }
  
                      if (errors.length === 0) {
                        resolve(jsonData);
                      } else {
                        reject(errors.join("\n"));        
                      }
                  } catch (err) {
                      console.error("Invalid JSON file:", err);
                      reject("Invalid JSON file.");
                  }
              };
      
              reader.readAsText(file);
          };
      
          input.click(); // Open file dialog
        });
        
      }
    }
  });

  // end of the listeners
  listenersAdded = true;
}
