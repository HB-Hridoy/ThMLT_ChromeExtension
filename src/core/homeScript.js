    
    const projectsContainer = document.getElementById("projects-container");
    const homeScreen = document.getElementById("home-screen");
    const colorsScreen = document.getElementById("colors-screen");
    let importJsonEditor; 
    let importJsonEditorErrors = [];
    let importJsonEditorOldValue = "";
    const importJsonErrorButton = document.getElementById("import-json-error-button");
    const importJsonDoneButton = document.getElementById("import-json-screen-done-button");
    const importJsonErrorCount = document.getElementById("import-json-error-count");
    const importJsonTitle = document.getElementById("import-json-screen-title");

    const projectManagementBackButton = document.getElementById("pm-back-button");
    const projectManagementOptionsContainer = document.getElementById("pm-options-container");
    

    document.addEventListener('DOMContentLoaded', () => {

      importJsonEditor = CodeMirror.fromTextArea(document.getElementById("import-json-code-editor"), {
        mode: "application/json",       
        theme: "dracula",
        lineWrapping: true,
        tabSize: 2,  
        indentUnit: 2, 
        indentWithTabs: true
      });

      importJsonEditor.on("change", () => {
        if (importJsonTitle.innerHTML !== "Error Logs") {
          const editorValueInJson = importJsonEditor.getValue().trim();
          if (editorValueInJson) {
            validateJsonStructure(editorValueInJson);
          }
        }
      });
    });

    document.getElementById("open-import-json").addEventListener("click", function(){
      ScreenManager.showImportJsonScreen();
    });

    projectManagementBackButton.addEventListener("click", (e)=>{
      ScreenManager.showHomeScreen();
    });

    projectManagementOptionsContainer.addEventListener("click", async (e)=>{
      const target = e.target;

      if (target.closest("#pm-color-themes")) {
        document.getElementById("project-name-colors-screen").innerText = CacheOperations.activeProject;

        currentPrimitiveRowId = 1;
        currentSemanticRowId = 1;

        getAllPrimitiveColors(CacheOperations.activeProject);
        
        getAllSemanticColors(CacheOperations.activeProject);

        ScreenManager.showColorsScreen();
        
        
      }else if (target.closest("#pm-fonts")) {
        document.getElementById("project-name-fonts-screen").innerText = CacheOperations.activeProject;

        currentFontsRowId = 1;
        getAllFonts(CacheOperations.activeProject);
        ScreenManager.showFontsScreen();
        
        
      }else if (target.closest("#pm-translations")) {
        const statusError = document.getElementById("translation-status-error");
        const statusImported = document.getElementById("translation-status-imported");

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

    document.getElementById("import-json-screen-back-button").addEventListener("click", function(){
      if (importJsonTitle.innerHTML === "Error Logs"){
        importJsonTitle.innerHTML = "Import from JSON";
        importJsonEditor.setValue(importJsonEditorOldValue);
        importJsonErrorButton.classList.replace("hidden", "inline-flex");
      } else {
        ScreenManager.showHomeScreen();
      }
      
    });

    importJsonDoneButton.addEventListener("click", async function(){
      try {
        console.log(...Logger.log("Import Started.", Logger.Types.SUCCESS, Logger.Formats.HIGHLIGHT));
        const isJsonDataValid = validateJsonStructure(importJsonEditor.getValue().trim());
        if (isJsonDataValid){
          const parsedData = JSON.parse(importJsonEditor.getValue().trim());
          await importProjectFromJson(parsedData);
        
          AlertManager.success("Project imported successfully");

          projectsContainer.insertAdjacentHTML("beforeend", CreateElement.projectTemplate(parsedData.ProjectName, parsedData.Author, parsedData.Version));

          ScreenManager.showHomeScreen();
        }

      } catch (error) {
        
      }
      
    });

    importJsonErrorButton.addEventListener("click", function(){

      importJsonTitle.innerHTML = "Error Logs";
      importJsonDoneButton.classList.replace("inline-flex", "hidden");
      importJsonErrorButton.classList.replace("inline-flex", "hidden");

      importJsonEditorOldValue = importJsonEditor.getValue();

      const content = importJsonEditorErrors.join("\n\n");
      importJsonEditor.setValue(content); 
    });


    document.getElementById("add-new-project-toggle").addEventListener("click", function(){
        ScreenManager.hideBottomNavBar();
    });

    document.getElementById("add-new-project").addEventListener("click", async function () {
        // Select the inputs
        const projectName = document.getElementById("projectNameInput").value.trim();
        const author = document.getElementById("authorNameInput").value.trim();
        const version = document.getElementById("versionNameInput").value.trim();
      
        // Check if any input is empty
        if (!projectName || !author || !version) {
          console.log("Inputs are empty");
        } else {
          console.log("Adding project");
      
          try {
            // Await the result of addProject
            const result = await addProject({
              id: projectName,
              projectName: projectName,
              author: author,
              version: version,
            }, true);
            
            console.log(result); // Log the success message

            
            projectsContainer.insertAdjacentHTML("beforeend", CreateElement.projectTemplate(projectName, author, version));
          } catch (error) {
            alert(error); // Error message
            console.error(error); // Log the error message
          }
        }
    });

    document.getElementById("projects-container").addEventListener("click", async function(event) {
        // Check if the clicked element or any of its parents has the 'project-preview-parent' class
        if (event.target.closest('.project-preview-parent')) {

          CacheOperations.clearCache();
          
          const projectDiv = event.target.closest('.project-preview-parent');
      
          CacheOperations.activeProject = projectDiv.getAttribute('project-id')

          document.getElementById("pm-project-name").innerText = CacheOperations.activeProject;

          ScreenManager.showProjectManagementScreen();

          try {
            const statusError = document.getElementById("translation-status-error");
            const statusImported = document.getElementById("translation-status-imported");

            const isTranslationsAvailable = await isTranslationDataAvailable(CacheOperations.activeProject);
            statusError.classList.toggle("hidden", isTranslationsAvailable);
            statusImported.classList.toggle("hidden", !isTranslationsAvailable);
          } catch (error) {
            console.error("Error checking translation data availability:", error);
          }

        }
      });

    function validateJsonStructure(data) {
      const errors = [];

      try {
        data = JSON.parse(data);
      } catch (error) {
        errors.push("Invalid JSON format");
      }

      if (errors.length === 0) {

        const requiredFields = ["ProjectName", "Author", "Version", "Modes", "DefaultMode", "Primitives", "Semantic"];
        requiredFields.forEach(field => {
          if (!data.hasOwnProperty(field)) {
            errors.push(`Missing required field: ${field}`);
          }
        });

        if (!Array.isArray(data.Modes) || data.Modes.length === 0) {
          errors.push("Modes should be a non-empty array");
        }
        if (!data.Modes.includes(data.DefaultMode)) {
          errors.push(`DefaultMode should be one of the Modes: ${data.Modes.join(", ")}`);
        }

        if (typeof data.Primitives !== "object" || Array.isArray(data.Primitives)) {
          errors.push("Primitives must be an object with key-value pairs.");
        } else {
          Object.entries(data.Primitives).forEach(([key, value]) => {
            if (!/^#[0-9A-F]{6}$/i.test(value)) {
              errors.push(`Invalid color format for key '${key}' in Primitives: ${value}`);
            }
          });
        }

        if (typeof data.Semantic !== "object" || Array.isArray(data.Semantic)) {
          errors.push("Semantic must be an object.");
        } else {
          const modeKeys = data.Modes;
          modeKeys.forEach(mode => {
            if (!data.Semantic.hasOwnProperty(mode)) {
              errors.push(`Semantic is missing the '${mode}' property.`);
            }
          });

          const modeKeySets = modeKeys.map(mode => (data.Semantic[mode] ? Object.keys(data.Semantic[mode]) : []));
          if (modeKeySets.length > 1) {
            const referenceKeys = modeKeySets[0];
            modeKeySets.forEach((keySet, index) => {
              const modeName = modeKeys[index];
              const extraKeys = keySet.filter(key => !referenceKeys.includes(key));
              const missingKeys = referenceKeys.filter(key => !keySet.includes(key));
              if (extraKeys.length > 0) {
                errors.push(`Extra keys found in Semantic.${modeName}: ${extraKeys.join(", ")}`);
              }
              if (missingKeys.length > 0) {
                errors.push(`Missing keys in Semantic.${modeName}: ${missingKeys.join(", ")}`);
              }
            });
          }

          modeKeys.forEach(mode => {
            const modeSemantic = data.Semantic[mode];
            if (typeof modeSemantic === "object" && !Array.isArray(modeSemantic)) {
              Object.values(modeSemantic).forEach(value => {
                if (!data.Primitives.hasOwnProperty(value)) {
                  errors.push(`Value '${value}' in Semantic.${mode} does not reference a valid key in Primitives.`);
                }
              });
            }
          });
        }
      }

      if (errors.length > 0) {
        importJsonEditorErrors = errors;
        importJsonErrorCount.innerHTML = errors.length;
        importJsonErrorButton.classList.replace("hidden", "inline-flex");
        importJsonDoneButton.classList.replace("inline-flex", "hidden");

        console.log(...Logger.multiLog(
          ["[STRUCTURE ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
          ["Invalid JSON structure", Logger.Types.DEFAULT, Logger.Formats.ITALIC],
          ["Errors:", Logger.Types.ERROR],
          [errors.length, Logger.Types.ERROR, Logger.Formats.BOLD]
        ));
      } else {
        importJsonErrorButton.classList.replace("inline-flex", "hidden");
        importJsonDoneButton.classList.replace("hidden", "inline-flex");

        return true;
      }
    }

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

                    // Log errors as text
                    let logText = "";
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
  
  
