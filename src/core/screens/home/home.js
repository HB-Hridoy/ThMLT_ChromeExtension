    
// import {
//   openConfirmation,
//   showMessage,
//   replaceClass,
//   nameRegex,
//   currentPrimitiveRowId,
//   currentSemanticRowId,
//   currentFontsRowId,
//   semanticTableColumns,
//   shouldUpdateBlocky,
//   CacheOperations,
//   CACHE_KEYS,
//   cache_temp,
//   SessionManager,
//   Logger,
//   CreateElement,
//   ScreenManager,
//   AlertManager,
//   BlockyInjector,
//   pickrInstance,
//   oldPrimitiveInputValues,
//   confirmationModal,
//   messageModal,
  
//   restoreSession
// } from "./globalScript.js";

// import {addProject,
//   getAllProjects,
//   duplicateProject,
//   getAllPrimitiveColors,
//   addPrimitiveColor,
//   updatePrimitive,
//   deletePrimitiveColor,
//   addSemantic,
//   updateSemantic,
//   getAllSemanticColors,
//   deleteSemantic,
//   updateDefaultThemeMode,
//   getDefaultThemeMode,
//   deleteTheme,
//   renameThemeMode,
//   getColorThemesData,
//   deleteProject,
//   importProjectFromJson,
//   getAllFonts,
//   addFont,
//   updateFont,
//   deleteFont,
//   getFontsData,
//   addTranslations,
//   getTranslationData,
//   isTranslationDataAvailable} from "../db/dbOperations.js";

  import sidepanelCache from "../../../utils/sidepanelCache.js";
  import DatabaseManager from "../../../db/DatabaseManager.js";
  import components from "../../../utils/components.js";

  const comp = new components();


  document.addEventListener("DOMContentLoaded", async () => {

    const projectsContainer = document.getElementById("projects-container");
    
    try {

      const projects = await DatabaseManager.projects.getAll();

      projects.forEach(project => {
        const projectCard = comp.projectCard({
          projectId: project.projectId,
          projectName: project.projectName,
          author: project.author,
          version: project.version
        })
        projectsContainer.insertAdjacentHTML("beforeend", projectCard);

        console.log(project);
        
      });

      
      



      // for (let i = 1; i <= 5; i++) {
      //   await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for 2 seconds
      //   await DatabaseManager.projects.create({
      //     projectName: `Test Project ${i}`,
      //     author: `Test Author ${i}`,
      //     version: `1.0.${i}`
      //   });
      // }    
      
    } catch (error) {
      console.error(error);
    }
  });



  



    

  // document.getElementById("projects-container").addEventListener("click", async function(event) {
    
  //   const projectCard = event.target.closest('.project-preview-parent');
  
  //   if (projectCard) {
      
  //     CacheOperations.clearCache();
        
  //     const projectDiv = event.target.closest('.project-preview-parent');
  
  //     CacheOperations.activeProject = projectDiv.getAttribute('project-id')

  //     document.getElementById("pm-project-name").innerText = CacheOperations.activeProject;

  //     ScreenManager.showProjectManagementScreen();

  //     try {
  //       const statusError = document.getElementById("translation-status-error");
  //       const statusImported = document.getElementById("translation-status-imported");

  //       const isTranslationsAvailable = await isTranslationDataAvailable(CacheOperations.activeProject);
  //       statusError.classList.toggle("hidden", isTranslationsAvailable);
  //       statusImported.classList.toggle("hidden", !isTranslationsAvailable);
  //     } catch (error) {
  //       console.error("Error checking translation data availability:", error);
  //     }

  //   }
  // });
      

  //   function validateJsonStructure(data) {
  //     const errors = [];

  //     try {
  //       data = JSON.parse(data);
  //     } catch (error) {
  //       errors.push("Invalid JSON format");
  //     }

  //     if (errors.length === 0) {

  //       const requiredFields = ["ProjectName", "Author", "Version", "Modes", "DefaultMode", "Primitives", "Semantic"];
  //       requiredFields.forEach(field => {
  //         if (!data.hasOwnProperty(field)) {
  //           errors.push(`Missing required field: ${field}`);
  //         }
  //       });

  //       if (!Array.isArray(data.Modes) || data.Modes.length === 0) {
  //         errors.push("Modes should be a non-empty array");
  //       }
  //       if (!data.Modes.includes(data.DefaultMode)) {
  //         errors.push(`DefaultMode should be one of the Modes: ${data.Modes.join(", ")}`);
  //       }

  //       if (typeof data.Primitives !== "object" || Array.isArray(data.Primitives)) {
  //         errors.push("Primitives must be an object with key-value pairs.");
  //       } else {
  //         Object.entries(data.Primitives).forEach(([key, value]) => {
  //           if (!/^#[0-9A-F]{6}$/i.test(value)) {
  //             errors.push(`Invalid color format for key '${key}' in Primitives: ${value}`);
  //           }
  //         });
  //       }

  //       if (typeof data.Semantic !== "object" || Array.isArray(data.Semantic)) {
  //         errors.push("Semantic must be an object.");
  //       } else {
  //         const modeKeys = data.Modes;
  //         modeKeys.forEach(mode => {
  //           if (!data.Semantic.hasOwnProperty(mode)) {
  //             errors.push(`Semantic is missing the '${mode}' property.`);
  //           }
  //         });

  //         const modeKeySets = modeKeys.map(mode => (data.Semantic[mode] ? Object.keys(data.Semantic[mode]) : []));
  //         if (modeKeySets.length > 1) {
  //           const referenceKeys = modeKeySets[0];
  //           modeKeySets.forEach((keySet, index) => {
  //             const modeName = modeKeys[index];
  //             const extraKeys = keySet.filter(key => !referenceKeys.includes(key));
  //             const missingKeys = referenceKeys.filter(key => !keySet.includes(key));
  //             if (extraKeys.length > 0) {
  //               errors.push(`Extra keys found in Semantic.${modeName}: ${extraKeys.join(", ")}`);
  //             }
  //             if (missingKeys.length > 0) {
  //               errors.push(`Missing keys in Semantic.${modeName}: ${missingKeys.join(", ")}`);
  //             }
  //           });
  //         }

  //         modeKeys.forEach(mode => {
  //           const modeSemantic = data.Semantic[mode];
  //           if (typeof modeSemantic === "object" && !Array.isArray(modeSemantic)) {
  //             Object.values(modeSemantic).forEach(value => {
  //               if (!data.Primitives.hasOwnProperty(value)) {
  //                 errors.push(`Value '${value}' in Semantic.${mode} does not reference a valid key in Primitives.`);
  //               }
  //             });
  //           }
  //         });
  //       }
  //     }

  //     if (errors.length > 0) {
  //       importJsonEditorErrors = errors;
  //       importJsonErrorCount.innerHTML = errors.length;
  //       importJsonErrorButton.classList.replace("hidden", "inline-flex");
  //       importJsonDoneButton.classList.replace("inline-flex", "hidden");

  //       console.log(...Logger.multiLog(
  //         ["[STRUCTURE ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
  //         ["Invalid JSON structure", Logger.Types.DEFAULT, Logger.Formats.ITALIC],
  //         ["Errors:", Logger.Types.ERROR],
  //         [errors.length, Logger.Types.ERROR, Logger.Formats.BOLD]
  //       ));
  //     } else {
  //       importJsonErrorButton.classList.replace("inline-flex", "hidden");
  //       importJsonDoneButton.classList.replace("hidden", "inline-flex");

  //       return true;
  //     }
  //   }

  //   function getTranslationFile() {
  //     return new Promise((resolve, reject) => {

  //       const input = document.createElement("input");
  //       input.type = "file";
  //       input.accept = "application/json"; // Only allow JSON files
    
  //       input.onchange = function(event) {
  //           const file = event.target.files[0]; // Get selected file
  //           if (!file) return;
    
  //           const reader = new FileReader();
  //           reader.onload = function(e) {
  //               try {
  //                   let jsonData = JSON.parse(e.target.result); // Parse JSON
  //                   let errors = [];
    
  //                   // Validate SupportedLanguages and DefaultLanguage
  //                   if (!jsonData.SupportedLanguages || !Array.isArray(jsonData.SupportedLanguages)) {
  //                       errors.push("SupportedLanguages must be an array.");
  //                       jsonData.SupportedLanguages = []; // Fix issue
  //                   }
    
  //                   if (!jsonData.DefaultLanguage || !jsonData.SupportedLanguages.includes(jsonData.DefaultLanguage)) {
  //                       errors.push("DefaultLanguage must be one of the SupportedLanguages.");
  //                       jsonData.DefaultLanguage = jsonData.SupportedLanguages[0] || "en"; // Auto-fix
  //                   }
    
  //                   if (!jsonData.Translations || typeof jsonData.Translations !== "object") {
  //                       errors.push("Translations must be an object.");
  //                       jsonData.Translations = {}; // Fix issue
  //                   }
    
  //                   // Validate each translation entry
  //                   for (const key in jsonData.Translations) {
  //                       const value = jsonData.Translations[key];
    
  //                       if (typeof value === "string") {
  //                           // Section Object (Valid)
  //                       } else if (typeof value === "object") {
  //                           // Translation Object - Check if all SupportedLanguages exist
  //                           jsonData.SupportedLanguages.forEach(lang => {
  //                               if (!(lang in value)) {
  //                                   errors.push(`Missing translation for '${key}' in language '${lang}'.`);
  //                                   value[lang] = ""; // Auto-fix
  //                               }
  //                           });
  //                       } else {
  //                           errors.push(`Invalid translation entry for '${key}'. Must be a string (section) or object (translation).`);
  //                           delete jsonData.Translations[key]; // Remove invalid entry
  //                       }
  //                   }

  //                   // Log errors as text
  //                   let logText = "";
  //                   if (errors.length === 0) {
  //                     resolve(jsonData);
  //                   } else {
  //                     reject(errors.join("\n"));        
  //                   }
  //               } catch (err) {
  //                   console.error("Invalid JSON file:", err);
  //                   reject("Invalid JSON file.");
  //               }
  //           };
    
  //           reader.readAsText(file);
  //       };
    
  //       input.click(); // Open file dialog
  //     });
      
  // }
  
  
