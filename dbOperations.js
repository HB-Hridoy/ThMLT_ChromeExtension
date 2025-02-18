const openDB = indexedDB.open("ThMLT DB", 1);

console.log(...Logger.multiLog(
  ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
  ["Getting database ready"]
));

let db;
let isDBOpenSuccess = false;

let isTranslationDataChanged = false;
let isFontDataChanged = false;
let isColorDataChanged = false;




openDB.onupgradeneeded = function (event) {
  db = event.target.result;

  // Create 'projects' object store
  if (!db.objectStoreNames.contains("projects")) {
    let projectsStore = db.createObjectStore("projects", { keyPath: "projectName" });
    projectsStore.createIndex("projectName", "projectName", { unique: true });
    projectsStore.createIndex("author", "author", { unique: false });
    projectsStore.createIndex("version", "version", { unique: false });
    projectsStore.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
  }

  // Create 'primitiveColors' object store
  if (!db.objectStoreNames.contains("primitiveColors")) {
    let primitiveColorsStore = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true  });
    primitiveColorsStore.createIndex("projectName", "projectName", { unique: false });
    primitiveColorsStore.createIndex("primitiveName", "primitiveName", { unique: false });
    primitiveColorsStore.createIndex("primitiveValue", "primitiveValue", { unique: false });
    primitiveColorsStore.createIndex("orderIndex", "orderIndex", { unique: false });
  }

  // Create 'semanticColors' object store
  if (!db.objectStoreNames.contains("semanticColors")) {
    let semanticColorsStore = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true  });
    semanticColorsStore.createIndex("projectName", "projectName", { unique: false });
    semanticColorsStore.createIndex("semanticName", "semanticName", { unique: false });
    semanticColorsStore.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
    semanticColorsStore.createIndex("themeMode", "themeMode", { unique: false });
    semanticColorsStore.createIndex("orderIndex", "orderIndex", { unique: false });
  }

  // Create 'fonts' object store
  if (!db.objectStoreNames.contains("fonts")) {
    let fontsStore = db.createObjectStore("fonts", { keyPath: "id", autoIncrement: true  });
    fontsStore.createIndex("projectName", "projectName", { unique: false });
    fontsStore.createIndex("fontTag", "fontTag", { unique: false });
    fontsStore.createIndex("shortFontTag", "shortFontTag", { unique: false });
    fontsStore.createIndex("fontName", "fontName", { unique: false });
    fontsStore.createIndex("orderIndex", "orderIndex", { unique: false });
  }

};

openDB.onsuccess = (event) => {
  db = openDB.result;
  isDBOpenSuccess = true;

  console.log(...Logger.multiLog(
    ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
    ["Database is ready"]
  ));

  getAllProjects();
  // addProject({id: "projectName", projectName: "projectName", author: "author", version: "version" });

};

openDB.onerror = function (event) {
  console.error("Database error:", event.target.errorCode);
};

function translationDataChanged() {
  if (!isTranslationDataChanged) {
    
  }
}

function addProject(project, update) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      console.log("Adding project...");
      const transaction = db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");

      let request;
      if (update){
        request = store.put(project);

      }else{
        request = store.add(project);

      }
      
      request.onsuccess = () => {
        console.log("Project added!");
        resolve("Project added!");
      };

      request.onerror = (event) => {
        const error = "Error adding project: " + event.target.error;
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

// function functionName(params) {
//   return new Promise((resolve, reject) => {
//     if (!isDBOpenSuccess || !db) {
//       const error = "Database is not initialized";
      // console.error(error);
      // return reject(error);
//     }
//     ...and code goes here
//   });
// }

function getAllProjects() {
  console.log(...Logger.multiLog(
    ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
    ["Fetching all projects"]
  ));
  
  const transaction = db.transaction(["projects"], "readonly");
  const store = transaction.objectStore("projects");
  const request = store.getAll();

  request.onsuccess = () => {
    console.log(...Logger.multiLog(
      ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
      ["Got All Projects!"]
    ));
    const projectsContainer = document.getElementById("projects-container");
    let result = request.result;

    // Clear any existing content in the container
    projectsContainer.innerHTML = "";

    // Check if the result array is empty
    if (result.length === 0) {
      ScreenManager.showNoProjectScreen();
    } else {
      // Iterate over the result array and inject HTML for each project
      result.forEach((project) => {
        CacheOperations.addProject(project.projectName);
       
        projectsContainer.insertAdjacentHTML("beforeend", CreateElement.projectTemplate(project.projectName, project.author, project.version));
      });
      
      chrome.storage.local.set({ "ThMLT-Projects": CacheOperations.getAllProjects() }, () => {
        console.log(...Logger.multiLog(
          ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
          ["All project names stored to"],
          ["chrome.storage.local", Logger.Types.INFO]
        ));
        

      });
    }

    // Retrive Previous session
    restoreSession();
    
  };

  request.onerror = (event) => {
    const error = "Error getting projects: " + event.target.error;
    console.error(error);
    reject(error);
  };
}

function getAllPrimitiveColors(projectName) {

  console.log(...Logger.multiLog(
    ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
    ["Fetching primitive colors from"],
    [projectName, Logger.Types.WARNING, Logger.Formats.BOLD],
    ["project."]
  ));
  
  const transaction = db.transaction(["primitiveColors"], "readonly");
  const store = transaction.objectStore("primitiveColors");
  // Open the index on projectId
  const index = store.index("projectName");
    
  const request = index.getAll(projectName);

  request.onsuccess = () => {

    console.log(...Logger.multiLog(
      ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
      ["Got all primitive colors from"],
      [projectName, Logger.Types.INFO, Logger.Formats.BOLD],
      ["project."]

    ));
    
    // Logger.multiLog(
    //   ["[SUCCESS] ", Logger.Types.SUCCESS],
    //   ["Got all primitive colors"]
    // );
    let result = request.result;

    const tableBody = document.querySelector("#primitives-table tbody");
    
    const rows = Array.from(tableBody.children);
  
    rows.forEach(row => {
      
        tableBody.removeChild(row);
      
    });

    // Sort the array by orderIndex
    const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);

    const logPrimitives = [];

    // Loop through the sorted array
    sortedData.forEach(primitive => {
      CacheOperations.addPrimitive(primitive.primitiveName, primitive.primitiveValue);
      addNewRowToPrimitiveTable(primitive.primitiveName, primitive.primitiveValue);
      logPrimitives.push(`${primitive.primitiveName} : ${primitive.primitiveValue}`);
    });

    //console.table(logPrimitives);

    // If there's an open pickr, close it before opening the new one
    if (pickrInstance && pickrInstance.isOpen()) {
      pickrInstance.hide();
    }

    // If Pickr instance doesn't exist, create it
    if (!pickrInstance) {
      pickrInstance = Pickr.create({
        el: '#color-picker', 
        theme: 'classic',
        default: "#FFFFFF",
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

      const primitiveModalColorText = document.getElementById("primitive-modal-color-text");
      const editPrimitiveModalColorText = document.getElementById("edit-primitive-modal-color-text");
      const button = document.querySelector(".pcr-button");

      
      pickrInstance.on('change', (color) => {
        const hex = color.toHEXA().toString(); 
        button.style.setProperty("--pcr-color", hex);
        
        primitiveModalColorText.textContent = hex;
        editPrimitiveModalColorText.textContent = hex;
      });
    }

  };

  request.onerror = (event) => {
    const error = "Error getting projects: " + event.target.error;
    console.error(error);
  };
}

function addPrimitiveColor(projectName, primitiveName, primitiveValue, orderIndex) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
          
      let transaction = db.transaction(["primitiveColors"], "readwrite");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

        let newColor = {
          projectName: projectName,
          primitiveName: primitiveName,
          primitiveValue: primitiveValue,
          orderIndex: orderIndex
        };
        let primitiveColorStoreRequest = primitiveColorsStore.add(newColor);
        primitiveColorStoreRequest.onsuccess = (e) => {
          CacheOperations.addPrimitive(primitiveName, primitiveValue);
          resolve("Primitive color added");

          console.log(...Logger.multiLog(
            ["[SUCCESS]", Logger.Types.SUCCESS],
            ["Primitive color"],
            [primitiveName, Logger.Types.INFO, Logger.Formats.BOLD],
            ["added"]
          ));
          
        }

        primitiveColorStoreRequest.onerror = (e) => {
          reject("Primitive Color adding failed");

          console.log(...Logger.multiLog(
            ["[ERROR]", Logger.Types.ERROR],
            ["Primitive color"],
            [primitiveName, Logger.Types.INFO, Logger.Formats.BOLD],
            ["adding failed"]
          ));
        }

        transaction.oncomplete = () =>{

        }
      
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

}

function updatePrimitiveColor(projectName, primitiveName, newPrimitiveValue, newOrderIndex) {

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
            record.projectName === projectName &&
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
              CacheOperations.updatePrimitive(primitiveName, newPrimitiveValue);
            
              console.log(...Logger.multiLog(
                ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
                ["Updated"],
                [updateCount, Logger.Types.INFO, Logger.Formats.BOLD],
                ["record(s) in the"],
                [primitiveName, Logger.Types.INFO, Logger.Formats.BOLD],
                ["field with the new primitive value:"],
                [newPrimitiveValue, Logger.Types.INFO, Logger.Formats.BOLD]
              ));
              resolve(`Successfully updated ${updateCount} record(s) with the new primitive value '${newPrimitiveValue}' in '${primitiveName}'.`);
            }
            
          } else {
            console.log(...Logger.multiLog(
              ["[WARNING]", Logger.Types.WARNING, Logger.Formats.BOLD],
              ["No matching records found."]
            ));
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

function deletePrimitiveColor(projectName, primitiveName) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      let transaction = db.transaction(["primitiveColors"], "readwrite");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

      // Retrieve all records for the given projectName
      let colorRequest = primitiveColorsStore.index("projectName").getAll(projectName);

      colorRequest.onsuccess = function(event) {
        let colors = event.target.result;

        // Find the record with the matching primitiveName
        let colorToDelete = colors.find(color => color.primitiveName === primitiveName);

        if (colorToDelete) {
          // Delete the primitive color
          primitiveColorsStore.delete(colorToDelete.id);

          // Unlink primitive color in semantic values
          CacheOperations.getAllSemantics().forEach((themeData, themeMode) => {
            Object.entries(themeData).forEach(([semanticName, semanticValue]) => {

              if (semanticValue === primitiveName) {
                updateSemanticValue(CacheOperations.getProjectName(), semanticName, themeMode, "Click to link color");
              }
            });
          });
          
          CacheOperations.deletePrimitive(primitiveName);
          
          console.log(...Logger.multiLog(
            ["[DELETED]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
            ["Primitive color"],
            [primitiveName, Logger.Types.CRITICAL, Logger.Formats.BOLD],
            ["deleted."]
          ));
          resolve(`Primitive color '${primitiveName}' deleted.`);
        } else {

          console.log(...Logger.multiLog(
            ["[NOT FOUND]", Logger.Types.WARNING, Logger.Formats.BOLD],
            ["Primitive color"],
            [primitiveName, Logger.Types.WARNING, Logger.Formats.BOLD],
            ["not found."]
          ));
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
function addSemanticColor(projectName, semanticName, themeMode, linkedPrimitive){

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      let transaction = db.transaction(["semanticColors"], "readwrite");
      let semanticColorsStore = transaction.objectStore("semanticColors");

      let newSemanticColor = {
        projectName: projectName,
        semanticName: semanticName,
        themeMode: themeMode,
        linkedPrimitive: linkedPrimitive
      };
      let semanticColorStoreRequest = semanticColorsStore.put(newSemanticColor);

      semanticColorStoreRequest.onsuccess = (e) => {

        CacheOperations.addSemantic(semanticName, themeMode, linkedPrimitive);
        
        resolve("Semantic color added");

        console.log(...Logger.multiLog(
          ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
          ["Semantic color"],
          [semanticName, Logger.Types.INFO, Logger.Formats.BOLD],
          ["added to"],
          [themeMode, Logger.Types.INFO, Logger.Formats.BOLD],
          ["mode."]
        ));
        
      }

      semanticColorStoreRequest.onerror = (e) => {
        reject("Error adding semantic color");
        
        console.log(...Logger.multiLog(
          ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
          ["Semantic color"],
          [semanticName, Logger.Types.ERROR, Logger.Formats.BOLD],
          ["adding failed to"],
          [themeMode, Logger.Types.ERROR, Logger.Formats.BOLD],
          ["mode."]
        ));
      }

    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

  
}


/**
 * Fetches all semantic colors associated with a given project name from the database,
 * updates the cache with the retrieved semantic colors, and dynamically updates the 
 * semantic colors table in the DOM.
 *
 * @param {string} projectName - The name of the project to fetch semantic colors for.
 */
function getAllSemanticColors(projectName) {
  console.log(...Logger.multiLog(
    ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
    ["Fetching semantic colors from"],
    [projectName, Logger.Types.WARNING, Logger.Formats.BOLD],
    ["project."]
  ));
  let transaction = db.transaction(["semanticColors"], "readonly");
  let semanticColorsStore = transaction.objectStore("semanticColors");

  let semanticRequest = semanticColorsStore.index("projectName").getAll(projectName);

  semanticRequest.onsuccess = () => {
    
    console.log(...Logger.multiLog(
      ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
      ["Got all semantic colors from"],
      [projectName, Logger.Types.INFO, Logger.Formats.BOLD],
      ["project."]
    ));
    let result = semanticRequest.result;

    result.forEach(item => {

      CacheOperations.addNewThemeMode(item.themeMode);

      CacheOperations.addSemantic(item.semanticName, item.themeMode, item.linkedPrimitive)

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
    const allThemeModes = CacheOperations.getAllThemeModes();

    if (allThemeModes.length === 0) {
      console.log(...Logger.multiLog(
        ["[WARNING]", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["No theme modes found.", Logger.Types.WARNING, Logger.Formats.ITALIC]
      ));

      console.log(...Logger.multiLog(
        ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["Adding"],
        ["Light", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["theme mode as default theme."]
      ));
      
      theadRow.insertBefore(CreateElement.semanticThemeModeCell("Light", true), theadRow.lastElementChild);
      semanticTableColumns++;

      table.style.gridTemplateColumns = "200px minmax(200px, 1fr) 40px";

      
    } else {
      allThemeModes.forEach((themeMode, index) => {
        if (index === 0) {
          theadRow.insertBefore(CreateElement.semanticThemeModeCell(themeMode, true), theadRow.lastElementChild);
        } else {
          theadRow.insertBefore(CreateElement.semanticThemeModeCell(themeMode), theadRow.lastElementChild);
        }

        semanticTableColumns++; // Increase the column count

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
    }

    const allSemanticNames = CacheOperations.getAllSemanticNames();

    if (allSemanticNames.length === 0 && allThemeModes.length === 0) {

      console.log(...Logger.multiLog(
        ["[WARNING]", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["No semantic found.", Logger.Types.WARNING, Logger.Formats.ITALIC]
      ));

      console.log(...Logger.multiLog(
        ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["Adding"],
        ["surface-primary", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["semantic."]
      ));


      addSemanticColor(projectName, "surface-primary", "Light", "Click to link color");

      addNewRowToSemanticTable("surface-primary", ["Click to link color"], ["Light"]);

      updateDefaultThemeMode(projectName, "Light");
      

      CacheOperations.addNewThemeMode("Light");
      CacheOperations.addSemantic("surface-primary", "Light", "Click to link color");
      
    } else{
      allSemanticNames.forEach(semanticName => {
        let semanticValues = [];
        
        allThemeModes.forEach(themeMode => {
          const semanticValue = CacheOperations.getSemanticValueForThemeMode(semanticName, themeMode);
          semanticValues.push(semanticValue);
        });
        
        if (semanticValues.length === allThemeModes.length) {
          addNewRowToSemanticTable(semanticName, semanticValues, allThemeModes);
        }
      });
    }
  }

}

function deleteSemanticColor(semanticName, projectName) {
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
            record.projectName === projectName
          ) {
            const deleteRequest = cursor.delete(); // Delete the matching record
            deleteRequest.onerror = (event) => {
              console.error("Delete operation failed:", event.target.error);
              reject("Failed to delete a record.");
            };
            deleteRequest.onsuccess = () => {
              
              CacheOperations.deleteSemantic(semanticName);
              deletionCount++;
            };
          }

          cursor.continue(); // Move to the next record, regardless of a match
        } else {
          // Cursor exhausted: all records have been processed
          if (deletionCount > 0) {
            

            console.log(...Logger.multiLog(
              ["[DELETED]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["Sematic color"],
              [semanticName, Logger.Types.ERROR, Logger.Formats.BOLD],
              ["deleted successfully."]
            ));
            
            resolve(`${deletionCount} record(s) named '${semanticName}' deleted successfully.`);
          } else {
            console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["No matching records found named"]
              [semanticName, Logger.Types.CRITICAL, Logger.Formats.BOLD],
              ["."]
            ));
            reject(`No matching records found named '${semanticName}'.`);
          }
        }
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


function renameSemantic(oldSemanticName, newSemanticName, projectName) {
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
            record.projectName === projectName
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
            console.log(...Logger.multiLog(
              ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
              ["Successfully renamed"],
              [updateCount, Logger.Types.INFO, Logger.Formats.BOLD],
              ["record(s)"],
              [oldSemanticName, Logger.Types.ERROR, Logger.Formats.BOLD],
              [" =>"],
              [newSemanticName, Logger.Types.SUCCESS, Logger.Formats.BOLD]
            ));
            resolve(`${updateCount} record(s) successfully renamed '${oldSemanticName}' to '${newSemanticName}'`);
          } else {
            console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["No matching records found for"]
              [oldSemanticName, Logger.Types.ERROR, Logger.Formats.BOLD]
            ));
            reject(`No matching records found for ${oldSemanticName}.`);
          }
        }
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

function updateSemanticValue(projectName, semanticName, themeMode, newSemanticValue) {
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

          // Check for records matching projectName, semanticName, and themeMode
          if (
            record.projectName === projectName &&
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
            CacheOperations.updateSemantic(semanticName, themeMode, newSemanticValue);
            
            console.log(...Logger.multiLog(
              ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
              ["Semantic color"],
              [semanticName, Logger.Types.INFO, Logger.Formats.BOLD],
              ["in"],
              [themeMode, Logger.Types.ERROR, Logger.Formats.BOLD],
              ["mode has been successfully linked to the new primitive value:"],
              [newSemanticValue, Logger.Types.WARNING, Logger.Formats.BOLD]
            ));
            resolve(`Successfully updated ${updateCount} record(s) with the new semantic value '${newSemanticValue}' in '${semanticName}' for '${themeMode}' mode.`);
          } else {
            console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["No matching records found."]
            ));
            reject("No matching records found.");
          }
        }
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

function updateDefaultThemeMode(projectName, newDefaultThemeMode) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      const transaction = db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");

      // Get the existing project data
      const getRequest = store.get(projectName);

      getRequest.onsuccess = function(event) {
        const project = event.target.result;
        
        if (project) {
          // Update only the defaultThemeMode
          project.defaultThemeMode = newDefaultThemeMode;

          // Put the updated object back into the store
          const updateRequest = store.put(project);

          updateRequest.onsuccess = function() {
            console.log(...Logger.multiLog(
              ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
              ["Default theme mode updated to"],
              [newDefaultThemeMode, Logger.Types.SUCCESS, Logger.Formats.BOLD]
            ));
            resolve("Default theme mode updated successfully.");
          };

          updateRequest.onerror = function(event) {
            console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["Default theme mode update FAILED", Logger.Types.ERROR]
            ));
            reject(event.target.error);
          };
        } else {
          reject("Project not found.");
        }
      };

      getRequest.onerror = function(event) {
        reject(event.target.error);
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });
}




function deleteTheme(projectName, themeMode) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {

      const transaction = db.transaction("semanticColors", "readwrite");
      const store = transaction.objectStore("semanticColors");

      const query = store.openCursor(); 
      let deletionCount = 0;

      query.onerror = (event) => {
        console.error("Cursor query failed:", event.target.error);
        reject("Failed to query records.");
      };

      query.onsuccess = (event) => {
        const cursor = event.target.result;

        if (cursor) {
          const record = cursor.value;

          if (record.projectName === projectName && record.themeMode === themeMode) {
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
            console.log(...Logger.multiLog(
              ["[DELETED]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
              ["Theme Mode"],
              [themeMode, Logger.Types.ERROR, Logger.Formats.BOLD],
              ["deleted."]
            ));
            resolve(`${deletionCount} record(s) from '${themeMode}' theme deleted successfully.`);
          } else {
            console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["No matching records found."]
            ));
            reject("No matching records found.");
          }
        }
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

function renameThemeMode(projectName, oldThemeMode, newThemeMode) {
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

          if (record.projectName === projectName && record.themeMode === oldThemeMode) {
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
            
            console.log(...Logger.multiLog(
              ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
              ["Theme mode renamed from"],
              [oldThemeMode, Logger.Types.ERROR, Logger.Formats.BOLD],
              ["=>"],
              [newThemeMode, Logger.Types.INFO, Logger.Formats.BOLD]
            ));
            resolve(`${updateCount} record(s) theme mode changed successfully from '${oldThemeMode}' to '${newThemeMode}'.`);
          } else {
            console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["No matching records found."]
            ));
            reject("No matching records found.");
          }
        }
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

/**
 * Exports a project’s data as a formatted JSON file.
 * @param {string} projectName - The project key used in the 'projects' store.
 */
function exportProjectAsJson(projectName, shouldDownload = false) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {

      // Open a read-only transaction covering all three object stores.
      const transaction = db.transaction(["projects", "primitiveColors", "semanticColors"], "readonly");
      const projectsStore = transaction.objectStore("projects");
      const primitivesStore = transaction.objectStore("primitiveColors");
      const semanticStore = transaction.objectStore("semanticColors");

      // 1. Get the project data.
      const projectRequest = projectsStore.get(projectName);
      projectRequest.onerror = (e) =>
        console.error("Error fetching project:", e.target.error);
      projectRequest.onsuccess = (e) => {
        const project = e.target.result;
        if (!project) {
          console.error("Project not found:", projectName);
          return;
        }

        // 2. Get all primitive colors for the project.
        const primitivesIndex = primitivesStore.index("projectName");
        const primitivesRequest = primitivesIndex.getAll(projectName);
        primitivesRequest.onerror = (e) =>
          console.error("Error fetching primitives:", e.target.error);
        primitivesRequest.onsuccess = (e) => {
          const primitivesRecords = e.target.result;
          // Build an object mapping each primitive's name to its value.
          const primitivesObj = {};
          primitivesRecords.forEach((record) => {
            primitivesObj[record.primitiveName] = record.primitiveValue;
          });

          // 3. Get all semantic colors for the project.
          const semanticIndex = semanticStore.index("projectName");
          const semanticRequest = semanticIndex.getAll(projectName);
          semanticRequest.onerror = (e) =>
            console.error("Error fetching semantic colors:", e.target.error);
          semanticRequest.onsuccess = (e) => {
            const semanticRecords = e.target.result;
            const semanticObj = {};
            const modesSet = new Set();

            // Organize semantic records by their theme mode.
            semanticRecords.forEach((record) => {
              const mode = record.themeMode;
              modesSet.add(mode);
              if (!semanticObj[mode]) {
                semanticObj[mode] = {};
              }
              // Map the semantic name to the linked primitive.
              semanticObj[mode][record.semanticName] = record.linkedPrimitive;
            });

            // Create an array of modes. You might sort these or choose a default order.
            const modesArr = Array.from(modesSet);
            // For the default mode, you could prefer "Light" if it exists or simply pick the first one.
            const defaultMode = modesArr.includes("Light") ? "Light" : modesArr[0] || "";

            // 4. Build the export object matching your desired JSON structure.
            const exportData = {
              ProjectName: project.projectName,
              Version: project.version,
              Author: project.author,
              Modes: modesArr,
              DefaultMode: defaultMode,
              Primitives: primitivesObj,
              Semantic: semanticObj,
            };

            // 5. Convert the export object to a JSON string.
            const jsonString = JSON.stringify(exportData, null, 2);
            //console.log("Exported JSON:", jsonString);

            if (shouldDownload) {
              // 6. Trigger a download of the JSON file.
              const blob = new Blob([jsonString], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              // Use the project name as the filename.
              a.download = `${project.projectName}.json`;
              document.body.appendChild(a);
              a.click();
              document.body.removeChild(a);
              URL.revokeObjectURL(url);
              
            } else {
              resolve(jsonString);
            }
          }; // semanticRequest.onsuccess
        }; // primitivesRequest.onsuccess
      }; // projectRequest.onsuccess
      
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

    
}

/**
 * Deletes a project and all its associated primitive and semantic color records.
 * @param {string} projectName - The name of the project to delete.
 */
function deleteProject(projectName) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      // Start a read-write transaction covering the three object stores.
      const transaction = db.transaction(
        ["projects", "primitiveColors", "semanticColors"],
        "readwrite"
      );

      transaction.onerror = (event) => {
        console.error("Transaction error:", event.target.error);
      };

      transaction.oncomplete = () => {
        console.log(...Logger.multiLog(
          ["[DELETED]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
          ["Project"],
          [projectName, Logger.Types.ERROR, Logger.Formats.BOLD],
          ["and all its related records have been deleted."]
        ));
        
        resolve (`Project '${projectName}' and all its related records have been deleted.`);
      };

      // 1. Delete the project record from the "projects" store.
      const projectsStore = transaction.objectStore("projects");
      const deleteProjectRequest = projectsStore.delete(projectName);
      deleteProjectRequest.onerror = (event) => {
        console.error("Error deleting project:", event.target.error);
      };

      // 2. Delete all primitive color records linked to this project.
      const primitivesStore = transaction.objectStore("primitiveColors");
      const primitiveIndex = primitivesStore.index("projectName");
      // Open a cursor for all records with matching projectName.
      const primitiveCursorRequest = primitiveIndex.openCursor(IDBKeyRange.only(projectName));

      primitiveCursorRequest.onerror = (event) => {
        console.error("Error iterating primitives:", event.target.error);
      };

      primitiveCursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          // Delete the current record.
          cursor.delete();
          // Continue to the next record.
          cursor.continue();
        }
      };

      // 3. Delete all semantic color records linked to this project.
      const semanticStore = transaction.objectStore("semanticColors");
      const semanticIndex = semanticStore.index("projectName");
      const semanticCursorRequest = semanticIndex.openCursor(IDBKeyRange.only(projectName));

      semanticCursorRequest.onerror = (event) => {
        console.error("Error iterating semantic colors:", event.target.error);
      };

      semanticCursorRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

    
}

/**
 * Imports a project from a JSON file and saves it in IndexedDB.
 * @param {File} file - The JSON file to import.
 */
function importProjectFromJson(jsonData) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      try {
      
        const transaction = db.transaction(
          ["projects", "primitiveColors", "semanticColors"],
          "readwrite"
        );

        transaction.onerror = (event) => {
          console.error("Transaction error:", event.target.error);
        };

        transaction.oncomplete = () => {
          console.log(...Logger.log("Import successful.", Logger.Types.SUCCESS, Logger.Formats.HIGHLIGHT));

          resolve(`Project '${jsonData.ProjectName}' imported successfully.`);
        };

        // Get object stores
        const projectsStore = transaction.objectStore("projects");
        const primitivesStore = transaction.objectStore("primitiveColors");
        const semanticStore = transaction.objectStore("semanticColors");

        console.log(...Logger.multiLog(
          ["[IMPORT PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
          ["Importing project"],
          [jsonData.ProjectName, Logger.Types.WARNING, Logger.Formats.BOLD]
        ));
        
        // Insert project details
        const projectData = {
          projectName: jsonData.ProjectName,
          version: jsonData.Version,
          author: jsonData.Author,
        };

        projectsStore.put(projectData);

        console.log(...Logger.multiLog(
          ["[PROCESS COMPLETE]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
          ["Project"],
          [jsonData.ProjectName, Logger.Types.SUCCESS, Logger.Formats.BOLD],
          ["has been successfully imported."]
        ));
        

        // Insert primitives
        console.log(...Logger.multiLog(
          ["[IMPORT PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
          ["Importing primitives"]
        ));
        
        for (const [primitiveName, primitiveValue] of Object.entries(jsonData.Primitives)) {
          primitivesStore.add({
            projectName: jsonData.ProjectName,
            primitiveName,
            primitiveValue,
          });
        }
        console.log(...Logger.multiLog(
          ["[PROCESS COMPLETE]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
          ["Primitives have been successfully imported."]
        ));
        

        // Insert semantic colors
        console.log(...Logger.multiLog(
          ["[IMPORT PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
          ["Importing semantic colors"]
        ));
        for (const [themeMode, semanticMappings] of Object.entries(jsonData.Semantic)) {
          for (const [semanticName, linkedPrimitive] of Object.entries(semanticMappings)) {
            semanticStore.add({
              projectName: jsonData.ProjectName,
              semanticName,
              linkedPrimitive,
              themeMode,
            });
          }
        }
        console.log(...Logger.multiLog(
          ["[PROCESS COMPLETE]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
          ["Semantic colors have been successfully imported."]
        ));

        updateDefaultThemeMode(jsonData.ProjectName, jsonData.DefaultMode);

      } catch (error) {
        console.error(error);
        reject(error);
      }
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });
  

    
}

function addFont(projectName, fontTag, shortFontTag, fontName, orderIndex) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["fonts"], "readwrite");
    let store = transaction.objectStore("fonts");
    let request = store.add({ projectName, fontTag, shortFontTag, fontName, orderIndex });
    
    request.onsuccess = () =>{
      resolve("Font added successfully");
    } 
    request.onerror = () => {
      reject("Error adding font");
    }
  });
}

function deleteFont(projectName, fontTag) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["fonts"], "readwrite");
    let store = transaction.objectStore("fonts");
    let index = store.index("projectName");
    let request = index.openCursor(IDBKeyRange.only(projectName));
    
    request.onsuccess = function (event) {
      let cursor = event.target.result;
      if (cursor) {
        if (cursor.value.fontTag === fontTag) {
          store.delete(cursor.primaryKey);
          resolve("Font deleted successfully");
        }
        cursor.continue();
      } else {
        reject("Font not found");
      }
    };
  });
}

function updateShortFontTag(projectName, fontTag, newShortFontTag) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["fonts"], "readwrite");
    let store = transaction.objectStore("fonts");
    let index = store.index("projectName");
    let request = index.openCursor(IDBKeyRange.only(projectName));
    
    request.onsuccess = function (event) {
      let cursor = event.target.result;
      if (cursor) {
        if (cursor.value.fontTag === fontTag) {
          let updateData = cursor.value;
          updateData.shortFontTag = newShortFontTag;
          store.put(updateData);
          resolve("Short font tag updated successfully");
        }
        cursor.continue();
      } else {
        reject("Font not found");
      }
    };
  });
}

function updateOrderIndex(projectName, fontTag, newOrderIndex) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["fonts"], "readwrite");
    let store = transaction.objectStore("fonts");
    let index = store.index("projectName");
    let request = index.openCursor(IDBKeyRange.only(projectName));
    
    request.onsuccess = function (event) {
      let cursor = event.target.result;
      if (cursor) {
        if (cursor.value.fontTag === fontTag) {
          let updateData = cursor.value;
          updateData.orderIndex = newOrderIndex;
          store.put(updateData);
          resolve("Order index updated successfully");
        }
        cursor.continue();
      } else {
        reject("Font not found");
      }
    };
  });
}

function exportFonts(author, version) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["fonts"], "readonly");
    let store = transaction.objectStore("fonts");
    let request = store.getAll();
    
    request.onsuccess = function () {
      let fonts = request.result;
      let fontExport = {};
      
      fonts.forEach((font) => {
        if (!fontExport[font.projectName]) {
          fontExport[font.projectName] = {
            ProjectName: font.projectName,
            Author: author,
            Version: version,
            Fonts: {}
          };
        }
        let fontKey = `${font.fontTag}{${font.shortFontTag}}`;
        fontExport[font.projectName].Fonts[fontKey] = font.fontName;
      });
      
      resolve(fontExport);
    };
    request.onerror = () => reject("Error exporting font store");
  });
}