    
    const templatesContainer = document.getElementById("templates-container");
    const homeScreen = document.getElementById("home-screen");
    const colorsScreen = document.getElementById("colors-screen");
    let importJsonEditor; 
    let importJsonEditorErrors = [];
    let importJsonEditorOldValue = "";
    const importJsonErrorButton = document.getElementById("import-json-error-button");
    const importJsonDoneButton = document.getElementById("import-json-screen-done-button");
    const importJsonErrorCount = document.getElementById("import-json-error-count");
    const importJsonTitle = document.getElementById("import-json-screen-title");
    

    document.addEventListener('DOMContentLoaded', () => {


      (async () => {
        const sessionScreen = await sessionManager.getScreen();
        const sessionColorTab = await sessionManager.getColorTab();
        const sessionTemplate = await sessionManager.getTemplate();
        if(!sessionScreen){
          console.log(...Logger.multiLog(
            ["[SESSION FOUND]", Logger.Types.DEBUG, Logger.Formats.BOLD],
            ["Restoring previous session."]
          ));
        }
      })();

      importJsonEditor = CodeMirror.fromTextArea(document.getElementById("import-json-code-editor"), {
        mode: "application/json", 
        lineNumbers: true,        
        theme: "dracula",
        lineWrapping: true,
        tabSize: 2,  
        indentUnit: 2, 
        indentWithTabs: true
      });

      // Get the total number of lines in the document
      var lineCount = importJsonEditor.lineCount();

      // Insert a new line at the end of the document
      importJsonEditor.replaceRange('\n   ', { line: lineCount - 1, ch: 0 });

      importJsonEditor.on("change", () => {
        if (importJsonTitle.innerHTML !== "Error Logs"){
          try {
              // Get the editor's value, remove extra spaces, and try to parse as JSON
              const editorValueInJson = importJsonEditor.getValue().trim();
          
              // Check if the editor value is empty
              if (!editorValueInJson) {
                  console.log("Editor content is empty.");
              } else {
                  // Parse the editor content as JSON
                  const parsedJson = JSON.parse(editorValueInJson);
                  
                  // Call the validation function with the parsed JSON
                  validateJsonStructure(parsedJson);
              }
          } catch (e) {
              //console.error("Error parsing JSON:", e);  // Log the error for more detail
              console.log("JSON Value is invalid");
          }
        }
        
      
        
      });
    });

    document.getElementById("open-import-json").addEventListener("click", function(){
      document.getElementById("import-json-screen").classList.replace("hidden", "visible");
      document.getElementById("home-screen").classList.replace("visible", "hidden");
      document.getElementById("bottom-nav-bar").classList.replace("visible","hidden");
    });

    document.getElementById("import-json-screen-back-button").addEventListener("click", function(){
      if (importJsonTitle.innerHTML === "Error Logs"){
        importJsonTitle.innerHTML = "Import from JSON";
        importJsonEditor.setValue(importJsonEditorOldValue);
        importJsonErrorButton.classList.replace("hidden", "inline-flex");
      } else {
        document.getElementById("import-json-screen").classList.replace("visible", "hidden");
        document.getElementById("home-screen").classList.replace("hidden", "visible");
        bottomNavBar.classList.replace("hidden","visible");
      }
      
    });

    importJsonDoneButton.addEventListener("click", function(){
      console.log(importJsonEditor.getValue());
      console.log(validateJsonStructure(JSON.parse(importJsonEditor.getValue())));
    });

    importJsonErrorButton.addEventListener("click", function(){

      importJsonTitle.innerHTML = "Error Logs";
      importJsonDoneButton.classList.replace("inline-flex", "hidden");
      importJsonErrorButton.classList.replace("inline-flex", "hidden");

      importJsonEditorOldValue = importJsonEditor.getValue();

      const content = importJsonEditorErrors.join("\n\n");
      importJsonEditor.setValue(content); 
    });


    document.getElementById("add-new-template-toggle").addEventListener("click", function(){
        bottomNavBar.classList.replace("visible","hidden");
    });

    document.getElementById("add-new-template").addEventListener("click", async function () {
        // Select the inputs
        const templateName = document.getElementById("templateNameInput").value.trim();
        const author = document.getElementById("authorNameInput").value.trim();
        const version = document.getElementById("versionNameInput").value.trim();
      
        // Check if any input is empty
        if (!templateName || !author || !version) {
          console.log("Inputs are empty");
        } else {
          console.log("Adding template");
      
          try {
            // Await the result of addTemplate
            const result = await addTemplate({
              id: templateName,
              templateName: templateName,
              author: author,
              version: version,
            }, true);
            
            console.log(result); // Log the success message

            const html = `
                        <div template-id="${templateName}" class="template-preview-parent visible max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 bg-gray-50 border border-gray-200 rounded-lg shadow hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                            <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">${templateName}</h5>
                            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Author: ${author}</p>
                            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Version: ${version}</p>
                        </div>
                        `;
            templatesContainer.insertAdjacentHTML("beforeend", html);
          } catch (error) {
            alert(error); // Error message
            console.error(error); // Log the error message
          }
        }
    });

    document.getElementById("templates-container").addEventListener("click", function(event) {
        // Check if the clicked element or any of its parents has the 'template-preview-parent' class
        if (event.target.closest('.template-preview-parent')) {

          cacheOperations.clearCache();
          
          const templateDiv = event.target.closest('.template-preview-parent');
      
          cacheOperations.updateTemplateName(templateDiv.getAttribute('template-id'));
      
          homeScreen.classList.replace("visible", "hidden");
          colorsScreen.classList.replace("hidden", "visible");

          document.getElementById("template-name-colors-screen").innerText = cacheOperations.getTemplateName();

          currentPrimitiveRowId = 1;
          currentSemanticRowId = 1;

          getAllPrimitiveColors(cacheOperations.getTemplateName());
          
          getAllSemanticColors(cacheOperations.getTemplateName());

          sessionManager.setScreen(sessionManager.COLORS_SCREEN);
          sessionManager.setColorTab(sessionManager.PRIMITIVES_COLOR_TAB);
          sessionManager.setTemplate(cacheOperations.getTemplateName());

          document.getElementById("bottom-nav-bar").classList.replace("visible", "hidden");
          

        }
      });

    function validateJsonStructure(data) {
      const errors = [];

      // Check for required fields
      const requiredFields = ["TemplateName", "Author", "Version", "Modes", "DefaultMode", "Primitives", "Semantic"];
      for (let field of requiredFields) {
          if (!data.hasOwnProperty(field)) {
              errors.push(`Missing required field: ${field}`);
              //return `Missing required field: ${field}`;
          }
      }
  
      // Validate the structure of Modes and DefaultMode
      if (!Array.isArray(data.Modes) || data.Modes.length === 0) {
          errors.push("Modes should be a non-empty array");
      }
      if (!data.Modes.includes(data.DefaultMode)) {
          errors.push(`DefaultMode should be one of the Modes: ${data.Modes.join(", ")}`);
      }
  
      // Validate the Primitives color structure
      if (typeof data.Primitives !== "object" || Array.isArray(data.Primitives)) {
        errors.push("Primitives must be an object with key-value pairs.");
      } else {
        for (let key in data.Primitives) {
            const value = data.Primitives[key];
            if (!/^#[0-9A-F]{6}$/i.test(value)) {
                errors.push(`Invalid color format for key '${key}' in Primitives: ${value}`);
            }
        }
      }

      // Validate Semantic structure
    if (typeof data.Semantic !== "object" || Array.isArray(data.Semantic)) {
      errors.push("Semantic must be an object.");
    } else {
        const modeKeys = data.Modes;

        // Ensure all modes exist in Semantic
        modeKeys.forEach((mode) => {
            if (!data.Semantic.hasOwnProperty(mode)) {
                errors.push(`Semantic is missing the '${mode}' property.`);
            }
        });

        // Ensure all modes have the same keys
        const modeKeySets = modeKeys
            .map((mode) => (data.Semantic[mode] ? Object.keys(data.Semantic[mode]) : []))
            .filter((keys) => keys.length > 0);

            if (modeKeySets.length > 1) {
              const referenceKeys = modeKeySets[0]; // Use the first mode's keys as reference
          
              modeKeySets.forEach((keySet, index) => {
                  const modeName = modeKeys[index];
                  const extraKeys = keySet.filter((key) => !referenceKeys.includes(key));
                  const missingKeys = referenceKeys.filter((key) => !keySet.includes(key));
          
                  if (extraKeys.length > 0) {
                      errors.push(
                          `Extra keys found in Semantic.${modeName}: ${extraKeys.join(", ")}`
                      );
                  }
          
                  if (missingKeys.length > 0) {
                      errors.push(
                          `Missing keys in Semantic.${modeName}: ${missingKeys.join(", ")}`
                      );
                  }
              });
          }
          

        // Validate that each Semantic value references a valid Primitive key
        modeKeys.forEach((mode) => {
            const modeSemantic = data.Semantic[mode];
            if (typeof modeSemantic === "object" && !Array.isArray(modeSemantic)) {
                for (let key in modeSemantic) {
                    if (!data.Primitives.hasOwnProperty(modeSemantic[key])) {
                        errors.push(
                            `Value '${modeSemantic[key]}' in Semantic.${mode}.${key} does not reference a valid key in Primitives.`
                        );
                    }
                }
            }
        });
    }

      if (errors.length > 0) {

          importJsonEditorErrors = errors;
          importJsonErrorCount.innerHTML = errors.length;
          importJsonErrorButton.classList.replace("hidden", "inline-flex");
          importJsonDoneButton.classList.replace("inline-flex", "hidden");
          console.log(errors.length);

      } else {
          importJsonErrorButton.classList.replace("inline-flex", "hidden");
          importJsonDoneButton.classList.replace("hidden", "inline-flex");
          console.log("Structure is valid");
      }
    }
  
    
    