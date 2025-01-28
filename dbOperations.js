const openDB = indexedDB.open("ThMLT DB", 1); // Name and version
let db;
let isDBOpenSuccess = false;




openDB.onupgradeneeded = function (event) {
  db = event.target.result;

  // Create 'templates' object store
  if (!db.objectStoreNames.contains("templates")) {
    let templatesStore = db.createObjectStore("templates", { keyPath: "templateName" });
    templatesStore.createIndex("templateName", "templateName", { unique: true });
    templatesStore.createIndex("author", "author", { unique: false });
    templatesStore.createIndex("version", "version", { unique: false });
  }

  // Create 'primitiveColors' object store
  if (!db.objectStoreNames.contains("primitiveColors")) {
    let primitiveColorsStore = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true  });
    primitiveColorsStore.createIndex("templateName", "templateName", { unique: false });
    primitiveColorsStore.createIndex("primitiveName", "primitiveName", { unique: false });
    primitiveColorsStore.createIndex("primitiveValue", "primitiveValue", { unique: false });
    primitiveColorsStore.createIndex("orderIndex", "orderIndex", { unique: false });
  }

  // Create 'semanticColors' object store
  if (!db.objectStoreNames.contains("semanticColors")) {
    let semanticColorsStore = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true  });
    semanticColorsStore.createIndex("templateName", "templateName", { unique: false });
    semanticColorsStore.createIndex("semanticName", "semanticName", { unique: false });
    semanticColorsStore.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
    semanticColorsStore.createIndex("themeMode", "themeMode", { unique: false });
    semanticColorsStore.createIndex("orderIndex", "orderIndex", { unique: false });
  }

};

openDB.onsuccess = (event) => {
  db = openDB.result;
  isDBOpenSuccess = true;
  console.log("Database opened successfully!");
  getAllTemplates();
  // addTemplate({id: "templateName", templateName: "templateName", author: "author", version: "version" });

};

openDB.onerror = function (event) {
  console.error("Database error:", event.target.errorCode);
};

function addTemplate(template, update) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      console.log("Adding template...");
      const transaction = db.transaction(["templates"], "readwrite");
      const store = transaction.objectStore("templates");

      let request;
      if (update){
        request = store.put(template);

      }else{
        request = store.add(template);

      }
      
      request.onsuccess = () => {
        console.log("Template added!");
        resolve("Template added!");
      };

      request.onerror = (event) => {
        const error = "Error adding template: " + event.target.error;
        console.error(error);
        reject(error);
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });
}

function getAllTemplates() {
  console.log("Getting templates...");
  const transaction = db.transaction(["templates"], "readonly");
  const store = transaction.objectStore("templates");
  const request = store.getAll();

  request.onsuccess = () => {
    console.log("Got All Templates!");
    // Get the container element
    const templatesContainer = document.getElementById("templates-container");
    let result = request.result;

    // Clear any existing content in the container
    templatesContainer.innerHTML = "";

    // Check if the result array is empty
    if (result.length === 0) {
      // Inject a <p> if no templates are found
      templatesContainer.innerHTML = `<p class="text-gray-500 text-sm">No templates found.</p>`;
    } else {
      // Iterate over the result array and inject HTML for each template
      result.forEach((template) => {
        cacheOperations.addTemplate(template.templateName);
        const html = `
          <div template-id="${template.templateName}" class="template-preview-parent visible max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 bg-gray-50 border border-gray-200 rounded-lg shadow hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">${template.templateName}</h5>
            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Author: ${template.author}</p>
            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Version: ${template.version}</p>
          </div>
        `;
        templatesContainer.insertAdjacentHTML("beforeend", html);
      });
    }

    // Retrive Previous session
    (async () => {
      const sessionScreen = await sessionManager.getScreen();
      const sessionColorTab = await sessionManager.getColorTab();
      const sessionTemplate = await sessionManager.getTemplate();
      // console.log("Screen:", sessionScreen);
      // console.log("Color Tab:", sessionColorTab);
      // console.log("Template:", sessionTemplate);

      if (sessionScreen === sessionManager.COLORS_SCREEN && cacheOperations.isTemplateExist(sessionTemplate)) {

        currentPrimitiveRowId = 1;
        currentSemanticRowId = 1;

        cacheOperations.updateTemplateName(sessionTemplate);

        getAllPrimitiveColors(sessionTemplate);
        getAllSemanticColors(sessionTemplate);

        homeScreen.classList.replace("visible", "hidden");
        colorsScreen.classList.replace("hidden", "visible");
        SwitchTabs(sessionColorTab);
      }
    })();
  };

  request.onerror = (event) => {
    const error = "Error getting templates: " + event.target.error;
    console.error(error);
    reject(error);
  };
}

function getAllPrimitiveColors(templateName) {

  console.log(`Getting primitive colors of '${templateName}' template...`);
  const transaction = db.transaction(["primitiveColors"], "readonly");
  const store = transaction.objectStore("primitiveColors");
  // Open the index on projectId
  const index = store.index("templateName");
    
  const request = index.getAll(templateName);

  request.onsuccess = () => {
    console.log("Got All Primitive Colors!");
    let result = request.result;

    const tableBody = document.querySelector("#primitives-table tbody");
    
    const rows = Array.from(tableBody.children);
  
    rows.forEach(row => {
      
        tableBody.removeChild(row);
      
    });

    // Sort the array by orderIndex
    const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);

    // Loop through the sorted array
    sortedData.forEach(primitive => {
      cacheOperations.addPrimitive(primitive.primitiveName, primitive.primitiveValue);
      addNewRowToPrimitiveTable(primitive.primitiveName, primitive.primitiveValue);
      
    });

    // If there's an open pickr, close it before opening the new one
    if (pickrInstance && pickrInstance.isOpen()) {
      pickrInstance.hide();
    }

    // If Pickr instance doesn't exist, create it
    if (!pickrInstance) {
      pickrInstance = Pickr.create({
        el: '#color-picker', 
        theme: 'nano',
        default: "#FFFFFF",
        swatches: ['#ff0000', '#00ff00', '#0000ff', '#000000', '#ffffff'],
        components: {
          preview: true,
          hue: true,
          interaction: {
            hex: true,
            rgba: true,
            input: true,
            save: false
          }
        }
      });
        const pickrRoot = document.querySelector('.pickr'); // Root element of Pickr
        pickrRoot.style.border = '1px solid #D1D5DB'; // Set border color
        pickrRoot.style.borderRadius = '5px'; // Set border color

      pickrInstance.on('change', (color) => {
        const hex = color.toHEXA().toString(); // Get the hex value
        pickrInstance.setColor(hex);
        
        document.getElementById("primitive-modal-color-text").innerText = hex;  // Update colorTextView with the color
      });
    }

  };

  request.onerror = (event) => {
    const error = "Error getting templates: " + event.target.error;
    console.error(error);
  };
}

function addPrimitiveColor(templateName, primitiveName, primitiveValue, orderIndex) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
          
      let transaction = db.transaction(["primitiveColors"], "readwrite");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

        let newColor = {
          templateName: templateName,
          primitiveName: primitiveName,
          primitiveValue: primitiveValue,
          orderIndex: orderIndex
        };
        let primitiveColorStoreRequest = primitiveColorsStore.add(newColor);
        primitiveColorStoreRequest.onsuccess = (e) => {
          cacheOperations.addPrimitive(primitiveName, primitiveValue);
          resolve("Primitive color added");
          console.log(`Primitive color '${primitiveName}' added`);
        }

        primitiveColorStoreRequest.onerror = (e) => {
          reject("Primitive Color adding failed");
          console.log(`Primitive Color '${primitiveName}' adding failed`);
        }
      
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

}

function updatePrimitiveColor(templateName, primitiveName, newPrimitiveValue, newOrderIndex) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
          
      let transaction = db.transaction(["primitiveColors"], "readwrite");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

      const query = primitiveColorsStore.openCursor(); // Open a cursor to iterate over all records
      let updateCount = 0; // Track the number of updates

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          if (
            record.templateName === templateName &&
            record.primitiveName === primitiveName
          ) {
            record.primitiveValue = newPrimitiveValue;
            newOrderIndex && (record.orderIndex = newOrderIndex);

            const updateRequest = cursor.update(record); // Save the updated record
            updateRequest.onerror = (event) => {
              console.error("[Error]: Update operation failed:", event.target.error);
              reject("Failed to update a record.");
            };

            updateRequest.onsuccess = () => {
              updateCount++;
            };
          }

          cursor.continue(); // Continue to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (updateCount > 0) {
            if (!newOrderIndex) {
              cacheOperations.updatePrimitive(primitiveName, newPrimitiveValue);
            
              console.log(`[Success]: Successfully updated ${updateCount} record(s) in the '${primitiveName}' field with the new primitive value: '${newPrimitiveValue}'.`);
              resolve(`Successfully updated ${updateCount} record(s) with the new primitive value '${newPrimitiveValue}' in '${primitiveName}'.`);
            }
            
          } else {
            console.warn("[Warning]: No matching records found.");
            reject("No matching records found.");
          }
        }
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

}

function deletePrimitiveColor(templateName, primitiveName) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      let transaction = db.transaction(["primitiveColors"], "readwrite");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

      // Retrieve all records for the given templateName
      let colorRequest = primitiveColorsStore.index("templateName").getAll(templateName);

      colorRequest.onsuccess = function(event) {
        let colors = event.target.result;

        // Find the record with the matching primitiveName
        let colorToDelete = colors.find(color => color.primitiveName === primitiveName);

        if (colorToDelete) {
          // Delete the primitive color
          primitiveColorsStore.delete(colorToDelete.id);

          // Unlink primitive color in semantic values
          cacheOperations.getAllSemantics().forEach((themeData, themeMode) => {
            Object.entries(themeData).forEach(([semanticName, semanticValue]) => {

              if (semanticValue === primitiveName) {
                updateSemanticValue(cacheOperations.getTemplateName(), semanticName, themeMode, "Click to link color");
              }
            });
          });
          
          cacheOperations.deletePrimitive(primitiveName);
          
          
          console.log(`Primitive color '${primitiveName}' deleted.`);
          resolve(`Primitive color '${primitiveName}' deleted.`);
        } else {
          console.log(`Primitive color '${primitiveName}' not found.`);
          reject(`Primitive color '${primitiveName}' not found.`);
        }
      };

      colorRequest.onerror = function(event) {
        console.error("Error retrieving records:", event.target.error);
        reject("Error retrieving records.");
      };

    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });
}



// return new Promise((resolve, reject) => {
//   if (isDBOpenSuccess && db) {
    
//   } else {
//     const error = "Database is not initialized";
//     console.error(error);
//     reject(error);
//   }
// });
function addSemanticColor(templateName, semanticName, themeMode, linkedPrimitive){

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      let transaction = db.transaction(["semanticColors"], "readwrite");
      let semanticColorsStore = transaction.objectStore("semanticColors");

      let newSemanticColor = {
        templateName: templateName,
        semanticName: semanticName,
        themeMode: themeMode,
        linkedPrimitive: linkedPrimitive
      };
      let semanticColorStoreRequest = semanticColorsStore.put(newSemanticColor);

      semanticColorStoreRequest.onsuccess = (e) => {

        cacheOperations.addSemantic(semanticName, themeMode, linkedPrimitive);
        

        resolve("Semantic color added");
        console.log(`Semantic color '${semanticName}' added to '${themeMode}' mode`);
      }

      semanticColorStoreRequest.onerror = (e) => {
        reject("Error adding semantic color");
        console.log(`Semantic color '${semanticName}' adding failed to '${themeMode}' mode`);
      }

    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

  
}


function getAllSemanticColors(templateName) {
  let transaction = db.transaction(["semanticColors"], "readonly");
  let semanticColorsStore = transaction.objectStore("semanticColors");

  let semanticRequest = semanticColorsStore.index("templateName").getAll(templateName);

  semanticRequest.onsuccess = () => {
    console.log("Got All semantic Colors!");
    let result = semanticRequest.result;

    result.forEach(item => {

      cacheOperations.addNewThemeMode(item.themeMode);

      cacheOperations.addSemantic(item.semanticName, item.themeMode, item.linkedPrimitive)

    });


    const table = document.getElementById('semantic-table');
    const tableBody = document.querySelector("#semantic-table tbody");
    semanticTableColumns = 2;
    table.style.gridTemplateColumns = "200px 40px";
    const theadRow = document.getElementById('semantic-table-header-row');

    const rows = Array.from(tableBody.children);
  
    rows.forEach(row => {
      if (row !== theadRow) {
        tableBody.removeChild(row);
      }
    });

    if (theadRow) {
      // Get all the <td> elements in the header row
      const allCells = Array.from(theadRow.children);
    
      // IDs of the <td> elements to keep
      const keepIds = ["semantic-name-column", "open-new-theme-modal"];
    
      // Iterate through all cells and remove the ones that don't match the criteria
      allCells.forEach(td => {
        if (!keepIds.includes(td.id)) {
          theadRow.removeChild(td);
        }
      });
    }

    cacheOperations.getAllSemantics().forEach((semanticNames, themeMode) => {

      const newTh = document.createElement('td');
      newTh.setAttribute("theme-mode", themeMode)
      newTh.classList.add("semantic-table-cell");
      newTh.classList.add("semantic-table-cell-has-padding");
      newTh.innerHTML = themeMode;
      theadRow.insertBefore(newTh, theadRow.lastElementChild);

      semanticTableColumns += 1; // Increase the column count

        let newGridTemplateColumns = '';

        // Loop through the columns and create the column definitions
        for (let i = 0; i < semanticTableColumns; i++) {
          if (i === semanticTableColumns - 1) {
            newGridTemplateColumns += '40px';  // Last column is 40px
          } else if (i === semanticTableColumns - 2) {
            newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
          } else {
            newGridTemplateColumns += '200px ';  // Regular columns are 200px
          }

          // Add a space between columns if it's not the last column
          if (i !== semanticTableColumns - 1) {
            newGridTemplateColumns += ' ';
          }
        }

        table.style.gridTemplateColumns = newGridTemplateColumns;
    });

    
    cacheOperations.getAllSemanticNames().forEach(semanticName => {

      let semanticValues = [];
      
      cacheOperations.getAllThemeModes().forEach(themeMode => {
        const semanticValue = cacheOperations.getSemanticValueForThemeMode(semanticName, themeMode);
        semanticValues.push(semanticValue);
      });
      
      if (semanticValues.length === cacheOperations.getAllThemeModes().length) {
        addNewRowToSemanticTable(semanticName, semanticValues, cacheOperations.getAllThemeModes());
      }
    });
  }

}

function deleteSemanticColor(semanticName, templateName) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {

      const transaction = db.transaction("semanticColors", "readwrite");
      const store = transaction.objectStore("semanticColors");

      const query = store.openCursor(); // Open cursor to iterate over all records
      let deletionCount = 0; // Track the number of deletions

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          if (
            record.semanticName === semanticName &&
            record.templateName === templateName
          ) {
            const deleteRequest = cursor.delete(); // Delete the matching record
            deleteRequest.onerror = (event) => {
              console.error("Delete operation failed:", event.target.error);
              reject("Failed to delete a record.");
            };
            deleteRequest.onsuccess = () => {
              
              cacheOperations.deleteSemantic(semanticName);
              deletionCount++;
            };
          }

          cursor.continue(); // Move to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (deletionCount > 0) {
            console.log(`${deletionCount} record(s) named '${semanticName}' deleted successfully.`);
            
            resolve(`${deletionCount} record(s) named '${semanticName}' deleted successfully.`);
          } else {
            console.warn(`No matching records found named '${semanticName}'.`);
            reject(`No matching records found named '${semanticName}'.`);
          }
        }
      };

      transaction.oncomplete = () => {
        //console.log("Transaction completed.");
      };

      transaction.onerror = (event) => {
        console.error("Transaction failed:", event.target.error);
        reject("Transaction failed.");
      };
    } else {
      reject("Database is not open or not available.");
    }
  });
}


function renameSemantic(oldSemanticName, newSemanticName, templateName) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {

      const transaction = db.transaction("semanticColors", "readwrite");
      const store = transaction.objectStore("semanticColors");

      const query = store.openCursor(); // Open a cursor to iterate over all records
      let updateCount = 0; // Track the number of updates

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          if (
            record.semanticName === oldSemanticName &&
            record.templateName === templateName
          ) {
            record.semanticName = newSemanticName; // Update the semanticName

            const updateRequest = cursor.update(record); // Save the updated record
            updateRequest.onerror = (event) => {
              console.error("Update operation failed:", event.target.error);
              reject("Failed to update a record.");
            };

            updateRequest.onsuccess = () => {
              updateCount++;
            };
          }

          cursor.continue(); // Move to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (updateCount > 0) {
            console.log(`${updateCount} record(s) successfully renamed '${oldSemanticName}' to '${newSemanticName}'`);
            resolve(`${updateCount} record(s) successfully renamed '${oldSemanticName}' to '${newSemanticName}'`);
          } else {
            console.warn(`No matching records found for ${oldSemanticName}.`);
            reject(`No matching records found for ${oldSemanticName}.`);
          }
        }
      };

      transaction.oncomplete = () => {
        //console.log("Transaction completed.");
      };

      transaction.onerror = (event) => {
        console.error("Transaction failed:", event.target.error);
        reject("Transaction failed.");
      };
    } else {
      reject("Database is not open or not available.");
    }
  });
}

function updateSemanticValue(templateName, semanticName, themeMode, newSemanticValue) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      if (!db.objectStoreNames.contains("semanticColors")) {
        reject("Object store 'semanticColors' does not exist.");
        return;
      }

      const transaction = db.transaction("semanticColors", "readwrite");
      const store = transaction.objectStore("semanticColors");

      const query = store.openCursor(); // Open a cursor to iterate over all records
      let updateCount = 0; // Track the number of updates

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          // Check for records matching templateName, semanticName, and themeMode
          if (
            record.templateName === templateName &&
            record.semanticName === semanticName &&
            record.themeMode === themeMode
          ) {
            record.linkedPrimitive = newSemanticValue; // Update the linkedPrimitive

            const updateRequest = cursor.update(record); // Save the updated record
            updateRequest.onerror = (event) => {
              console.error("Update operation failed:", event.target.error);
              reject("Failed to update a record.");
            };

            updateRequest.onsuccess = () => {
              updateCount++;
            };
          }

          cursor.continue(); // Continue to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (updateCount > 0) {
            cacheOperations.updateSemantic(semanticName, themeMode, newSemanticValue);
            console.log(`Successfully updated ${updateCount} record(s) with the new semantic value '${newSemanticValue}' in '${semanticName}' for '${themeMode}' mode.`);
            resolve(`Successfully updated ${updateCount} record(s) with the new semantic value '${newSemanticValue}' in '${semanticName}' for '${themeMode}' mode.`);
          } else {
            console.warn("No matching records found.");
            reject("No matching records found.");
          }
        }
      };

      transaction.oncomplete = () => {
        //console.log("Transaction completed.");
      };

      transaction.onerror = (event) => {
        console.error("Transaction failed:", event.target.error);
        reject("Transaction failed.");
      };
    } else {
      reject("Database is not open or not available.");
    }
  });
}


function deleteTheme(templateName, themeMode) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {

      const transaction = db.transaction("semanticColors", "readwrite");
      const store = transaction.objectStore("semanticColors");

      const query = store.openCursor(); // Open a cursor to iterate over all records
      let deletionCount = 0; // Track the number of deletions

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          if (record.templateName === templateName && record.themeMode === themeMode) {
            const deleteRequest = cursor.delete(); // Delete the matching record
            deleteRequest.onerror = (event) => {
              console.error("Delete operation failed:", event.target.error);
              reject("Failed to delete a record.");
            };

            deleteRequest.onsuccess = () => {
              deletionCount++;
            };
          }

          cursor.continue(); // Move to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (deletionCount > 0) {
            console.log(`${deletionCount} record(s) from '${themeMode}' theme deleted successfully.`);
            resolve(`${deletionCount} record(s) from '${themeMode}' theme deleted successfully.`);
          } else {
            console.warn("No matching records found.");
            reject("No matching records found.");
          }
        }
      };

      transaction.oncomplete = () => {
        //console.log("Transaction completed.");
      };

      transaction.onerror = (event) => {
        console.error("Transaction failed:", event.target.error);
        reject("Transaction failed.");
      };
    } else {
      reject("Database is not open or not available.");
    }
  });
}

function updateTheme(templateName, oldThemeMode, newThemeMode) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {

      const transaction = db.transaction("semanticColors", "readwrite");
      const store = transaction.objectStore("semanticColors");

      const query = store.openCursor(); // Open a cursor to iterate over all records
      let updateCount = 0; // Track the number of updates

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          if (record.templateName === templateName && record.themeMode === oldThemeMode) {
            record.themeMode = newThemeMode; // Update the themeMode

            const updateRequest = cursor.update(record); // Save the updated record
            updateRequest.onerror = (event) => {
              console.error("Update operation failed:", event.target.error);
              reject("Failed to update a record.");
            };

            updateRequest.onsuccess = () => {
              updateCount++;
            };
          }

          cursor.continue(); // Move to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (updateCount > 0) {
            console.log(`${updateCount} record(s) theme mode changed successfully from '${oldThemeMode}' to '${newThemeMode}'.`);
            resolve(`${updateCount} record(s) theme mode changed successfully from '${oldThemeMode}' to '${newThemeMode}'.`);
          } else {
            console.warn("No matching records found.");
            reject("No matching records found.");
          }
        }
      };

      transaction.oncomplete = () => {
        //console.log("Transaction completed.");
      };

      transaction.onerror = (event) => {
        console.error("Transaction failed:", event.target.error);
        reject("Transaction failed.");
      };
    } else {
      reject("Database is not open or not available.");
    }
  });
}


















