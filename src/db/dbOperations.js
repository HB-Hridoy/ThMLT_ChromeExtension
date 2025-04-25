

console.log(...Logger.multiLog(
  ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
  ["Getting database ready"]
));
const openDB = indexedDB.open("ThMLT DB", 1);

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

  // Create 'translations' object store
  if (!db.objectStoreNames.contains("translations")) {
    let translationStore = db.createObjectStore("translations", { keyPath: "id", autoIncrement: true  });
    translationStore.createIndex("projectName", "projectName", { unique: false });
    translationStore.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
    translationStore.createIndex("translationData", "translationData", { unique: false });
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
  
};

openDB.onerror = function (event) {
  console.error("Database error:", event.target.errorCode);
};

function translationDataChanged() {
  if (!isTranslationDataChanged) {
    
  }
}

/**
 * Adds a new project or updates an existing one in the IndexedDB.
 *
 * This function either inserts a new project entry or updates an existing one 
 * based on the `update` flag.
 *
 * @param {Object} project - The project object to be added or updated.
 * @param {boolean} update - If `true`, the function updates an existing project; otherwise, it adds a new one.
 * @returns {Promise<string>} - A promise that resolves when the project is successfully added or updated, 
 *                              or rejects with an error message if the operation fails.
 */

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

/**
 * Retrieves all projects from the IndexedDB and updates the UI accordingly.
 *
 * This function fetches all stored projects, clears the existing project container, 
 * and dynamically injects the project data into the UI. If no projects are found, 
 * it displays a "no projects" screen.
 *
 * Additionally, it updates the local Chrome storage with the retrieved project names 
 * and attempts to restore the previous session.
 *
 * @returns {void}
 */

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
      let projectNames = [];
      result.forEach((project) => {
        projectsContainer.insertAdjacentHTML("beforeend", CreateElement.projectTemplate(project.projectName, project.author, project.version));
        CacheOperations.addProject(project.projectName);
        projectNames.push(project.projectName);
        
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

async function duplicateProject(projectName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(
      ["projects", "primitiveColors", "semanticColors", "fonts", "translations"],
      "readwrite"
    );

    transaction.onerror = () => reject(transaction.error);

    const projectsStore = transaction.objectStore("projects");

    // Step 0: Generate unique name
    const generateUniqueName = (baseName, count = 0) => {
      return new Promise((res, rej) => {
        let candidate =
          count === 0 ? `${baseName}_Copy` : `${baseName}_Copy_${count}`;
        const checkRequest = projectsStore.get(candidate);
        checkRequest.onsuccess = () => {
          if (!checkRequest.result) {
            res(candidate);
          } else {
            res(generateUniqueName(baseName, count + 1)); // Recursive check
          }
        };
        checkRequest.onerror = () => rej(checkRequest.error);
      });
    };

    // Step 1: Get original project
    const getRequest = projectsStore.get(projectName);
    getRequest.onsuccess = async () => {
      const originalProject = getRequest.result;

      if (!originalProject) {
        reject(new Error("Original project not found"));
        return;
      }

      try {
        const newProjectName = await generateUniqueName(projectName);

        // Step 2: Duplicate the main project
        const newProject = {
          ...originalProject,
          projectName: newProjectName
        };
        projectsStore.add(newProject);

        // Helper to copy store data
        const copyStoreData = (storeName) => {
          return new Promise((res, rej) => {
            const store = transaction.objectStore(storeName);
            const index = store.index("projectName");
            const request = index.getAll(projectName);

            request.onsuccess = () => {
              const records = request.result;
              for (const record of records) {
                const { id, ...rest } = record; // remove auto-incremented id
                store.add({ ...rest, projectName: newProjectName });
              }
              res();
            };

            request.onerror = () => rej(request.error);
          });
        };

        // Step 3: Copy related entries
        await Promise.all([
          copyStoreData("primitiveColors"),
          copyStoreData("semanticColors"),
          copyStoreData("fonts"),
          copyStoreData("translations"),
        ]);

        transaction.oncomplete = () => {
          resolve(newProjectName);
        } 
      } catch (err) {
        reject(err);
      }
    };

    getRequest.onerror = () => reject(getRequest.error);
  });
}



/**
 * Retrieves all primitive colors for a given project from the IndexedDB.
 *
 * This function fetches all primitive colors associated with the specified project, 
 * sorts them by `orderIndex`, and updates the UI by injecting the retrieved data 
 * into the primitives table. It also caches the primitive colors.
 *
 * @param {string} projectName - The name of the project whose primitive colors are to be retrieved.
 * @returns {void}
 */

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
      CacheOperations.addPrimitive(primitive.primitiveName, primitive.primitiveValue);
      addNewRowToPrimitiveTable(primitive.primitiveName, primitive.primitiveValue);
    });

  };

  request.onerror = (event) => {
    const error = "Error getting projects: " + event.target.error;
    console.error(error);
  };
}

/**
 * Adds a new primitive color to the IndexedDB for a specified project.
 *
 * This function creates a new entry in the `primitiveColors` object store, including 
 * the project name, primitive name, primitive value, and order index. If the addition 
 * is successful, it resolves with a success message and caches the primitive color. 
 * If it fails, it rejects with an error message.
 *
 * @param {string} projectName - The name of the project associated with the primitive color.
 * @param {string} primitiveName - The name of the primitive color to be added.
 * @param {string} primitiveValue - The value of the primitive color (e.g., hex code).
 * @param {number} orderIndex - The order index for the primitive color.
 * @returns {Promise<string>} - A promise that resolves when the primitive color is successfully added, 
 *                              or rejects with an error message if the operation fails.
 */

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

          cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
            if (selectedProject === projectName) {
              cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
            }
          });
          
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

/**
 * Updates an existing primitive color in the IndexedDB for a specified project.
 *
 * This function retrieves all primitive colors associated with the given project, 
 * finds the specific primitive color to update, and modifies its name, value, 
 * and order index based on the provided parameters. It only updates the fields 
 * if the new values are not set to "@default". The function resolves with a success 
 * message if the update is successful or rejects with an error message if the 
 * primitive color is not found or if the update fails.
 *
 * @param {string} projectName - The name of the project associated with the primitive color.
 * @param {string} primitiveName - The name of the primitive color to be updated.
 * @param {string} [newPrimitiveName="@default"] - The new name for the primitive color.
 * @param {string} [newPrimitiveValue="@default"] - The new value for the primitive color.
 * @param {number} [newOrderIndex="@default"] - The new order index for the primitive color.
 * @param {boolean} [log=true] - Whether to log the update process.
 * @returns {Promise<string>} - A promise that resolves when the primitive color is successfully updated, 
 *                              or rejects with an error message if the update fails or the primitive color is not found.
 */

function updatePrimitive(projectName, primitiveName, newPrimitiveName = "@default", newPrimitiveValue = "@default", newOrderIndex = "@default", log = true) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }

    const transaction = db.transaction(["primitiveColors"], "readwrite");
    const store = transaction.objectStore("primitiveColors");
    const index = store.index("projectName");
    const request = index.getAll(projectName);

    request.onsuccess = function(event) {
      const primitives = event.target.result;
      const primitiveToUpdate = primitives.find(p => p.primitiveName === primitiveName);

      if (!primitiveToUpdate) {
        if (log) {
          console.log(...Logger.multiLog(
            ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
            ["Primitive color"],
            [primitiveName, Logger.Types.ERROR, Logger.Formats.BOLD],
            ["not found for project"],
            [projectName, Logger.Types.ERROR, Logger.Formats.BOLD]
          ));
        }
        
        return reject(`Primitive color '${primitiveName}' not found for project '${projectName}'.`);
      }

      // Only update fields that are not "@default"
      if (newPrimitiveName !== "@default") primitiveToUpdate.primitiveName = newPrimitiveName;
      if (newPrimitiveValue !== "@default") primitiveToUpdate.primitiveValue = newPrimitiveValue;
      if (newOrderIndex !== "@default") primitiveToUpdate.orderIndex = newOrderIndex;

      const updateRequest = store.put(primitiveToUpdate);

      updateRequest.onsuccess = function() {
        if (log) {
          console.log(...Logger.multiLog(
            ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
            ["Updated primitive color"],
            [primitiveName, Logger.Types.INFO, Logger.Formats.BOLD],
            ["successfully."]
          ));
        }
        cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
          if (selectedProject === projectName) {
            cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
          }
        });
        CacheOperations.updatePrimitive(primitiveName, newPrimitiveName, newPrimitiveValue);

        // Unlink primitive color in semantic values
        CacheOperations.getAllSemantics().forEach((themeData, themeMode) => {
          Object.entries(themeData).forEach(([semanticName, semanticValue]) => {

            if (semanticValue === primitiveName) {
              updateSemantic(CacheOperations.activeProject, semanticName, "@default", themeMode, newPrimitiveName, "@default", true);
            }
          });
        });
      
        resolve(`Updated primitive color '${primitiveName}' successfully.`);
      };

      updateRequest.onerror = function() {
        reject("Failed to update primitive color.");
        if (log) {
          console.log(...Logger.multiLog(
            ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
            ["Failed to update primitive color"],
            [primitiveName, Logger.Types.ERROR, Logger.Formats.BOLD]
          ));
        }
        
      };
    };

    request.onerror = function() {
      reject("Failed to fetch primitive colors.");
      console.log(...Logger.multiLog(
        ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
        ["Failed to fetch primitive colors."]
      ));
    };
  });
}

/**
 * Deletes a primitive color from the IndexedDB for a specified project.
 *
 * This function retrieves all primitive colors associated with the given project, 
 * finds the specific primitive color to delete based on the provided name, and removes 
 * it from the database. It also updates any linked semantic values that reference the 
 * deleted primitive color. The function resolves with a success message if the deletion 
 * is successful or rejects with an error message if the primitive color is not found 
 * or if an error occurs during the retrieval process.
 *
 * @param {string} projectName - The name of the project associated with the primitive color.
 * @param {string} primitiveName - The name of the primitive color to be deleted.
 * @returns {Promise<string>} - A promise that resolves when the primitive color is successfully deleted, 
 *                              or rejects with an error message if the deletion fails or the primitive color is not found.
 */

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
                updateSemantic(CacheOperations.activeProject, semanticName, "@default", themeMode, "Click to link color", "@default", true);
              }
            });
          });
          
          CacheOperations.deletePrimitive(primitiveName);
          
          console.log(...Logger.multiLog(
            ["[DELETED]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
            ["Primitive color"],
            [primitiveName, Logger.Types.ERROR, Logger.Formats.BOLD],
            ["deleted."]
          ));
          cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
            if (selectedProject === projectName) {
              cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
            }
          });
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


/**
 * Adds a new semantic color entry to the IndexedDB.
 *
 * This function ensures the IndexedDB database is properly initialized 
 * before attempting to add a new entry. It logs success or failure messages accordingly.
 *
 * @param {string} projectName - The name of the project associated with the semantic color.
 * @param {string} semanticName - The name of the semantic color to be added.
 * @param {string} linkedPrimitive - Primitive name that is linked to semantic.
 * @param {string} themeMode - The name of the theme that semantic color to be added.
 * @param {int} orderIndex - The order of that specific semantic color.
 * 
 * @returns {Promise<void>} - A promise that resolves when the color is successfully added.
 */
function addSemantic(projectName, semanticName, linkedPrimitive, themeMode, orderIndex) {
  return new Promise((resolve, reject) => {
      if (!isDBOpenSuccess || !db) {
        const error = "Database is not initialized";
        console.error(error);
        return reject(error);
      }

      const transaction = db.transaction(["semanticColors"], "readwrite");
      const store = transaction.objectStore("semanticColors");

      // Add new semantic color
      const addRequest = store.add({
          projectName,
          semanticName,
          linkedPrimitive,
          themeMode,
          orderIndex: orderIndex ?? 0  // Default to 0 if not provided
      });

      addRequest.onsuccess = function () {
            console.log(...Logger.multiLog(
            ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
            ["Added semantic color:"],
            [semanticName, Logger.Types.INFO, Logger.Formats.BOLD]
            ));
            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
              }
            });
          resolve(`Added semantic color: ${semanticName}`);
      };

      addRequest.onerror = function (event) {
          reject(`Failed to add semantic color: ${event.target.error}`);
      };
  });
}

/**
 * Updates an existing semantic color entry in the IndexedDB.
 *
 * This function retrieves a specific semantic color for a given project and theme mode, 
 * updates its values if provided, and saves the changes back to the database.
 *
 * @param {string} projectName - The name of the project associated with the semantic color.
 * @param {string} semanticName - The current name of the semantic color to be updated.
 * @param {string} [newSemanticName="@default"] - The new name for the semantic color (if not "@default").
 * @param {string} themeMode - The theme mode associated with the semantic color.
 * @param {string} [newLinkedPrimitive="@default"] - The new linked primitive name (if not "@default").
 * @param {number} [newOrderIndex="@default"] - The new order index (if not "@default").
 * @param {boolean} [log=true] - Whether to log the update process.
 * @returns {Promise<string>} - A promise that resolves with a success message if the update is successful, or rejects with an error message.
 */

function updateSemantic(projectName, semanticName, newSemanticName = "@default", themeMode, newLinkedPrimitive = "@default", newOrderIndex = "@default", log = true) {
  return new Promise((resolve, reject) => {
      if (!isDBOpenSuccess || !db) {
        const error = "Database is not initialized";
        console.error(error);
        return reject(error);
      }

      const transaction = db.transaction(["semanticColors"], "readwrite");
      const store = transaction.objectStore("semanticColors");
      const index = store.index("projectName");

      // Get all semantic colors for the project
      const request = index.getAll(projectName);

      request.onsuccess = function () {
          const records = request.result;

          // Find the specific semantic color entry
          const entry = records.find(color => 
              color.semanticName === semanticName && color.themeMode === themeMode
          );

          if (!entry) {
            if (log) {
              console.log(...Logger.multiLog(
                ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
                ["Semantic color"],
                [semanticName, Logger.Types.ERROR, Logger.Formats.BOLD],
                ["for theme"],
                [themeMode, Logger.Types.ERROR, Logger.Formats.BOLD],
                ["not found."]
              ));
            }
            reject(`Semantic color '${semanticName}' for theme '${themeMode}' not found.`);
            return;
          }

          // Update values only if not "@default"
          if (newSemanticName !== "@default") {
              entry.semanticName = newSemanticName;
          }
          if (newLinkedPrimitive !== "@default") {
              entry.linkedPrimitive = newLinkedPrimitive;
          }
          if (newOrderIndex !== "@default") {
              entry.orderIndex = newOrderIndex;
          }

          const updateRequest = store.put(entry);

          updateRequest.onsuccess = function () {
            if (log) {
              console.log(...Logger.multiLog(
                ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
                ["Updated semantic color:"],
                [semanticName, Logger.Types.INFO, Logger.Formats.BOLD]
              ));
            }

            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
              }
            });
            CacheOperations.updateSemantic(semanticName, newSemanticName, themeMode, newLinkedPrimitive);
            resolve(`Updated semantic color: ${entry.semanticName}`);

          };

          updateRequest.onerror = function (event) {
            if (log) {
              console.log(...Logger.multiLog(
              ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
              ["Failed to update semantic color"],
              [semanticName, Logger.Types.ERROR, Logger.Formats.BOLD]
              ));
            }
            reject(`Failed to update semantic color: ${event.target.error}`);
          };
      };

      request.onerror = function (event) {
        if (log) {
          console.log(...Logger.multiLog(
            ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
            ["Error retrieving semantic colors."]
          ));
        }
          reject(`Error retrieving semantic colors: ${event.target.error}`);
      };
  });
}

/**
 * Fetches all semantic colors associated with a given project name from the database,
 * updates the cache with the retrieved semantic colors, and dynamically updates the 
 * semantic colors table in the DOM.
 *
 * @param {string} projectName - The name of the project to fetch semantic colors for.
 */
async function getAllSemanticColors(projectName) {

  const semanticTable = document.getElementById('semantic-table');
  const semanticTableBody = document.querySelector("#semantic-table tbody");

  console.log(...Logger.multiLog(
    ["[PROCESS]", Logger.Types.WARNING, Logger.Formats.BOLD],
    ["Fetching semantic colors from"],
    [projectName, Logger.Types.WARNING, Logger.Formats.BOLD],
    ["project."]
  ));

  let defaultTheme = null;

  // Before getting semantic colors fetch default theme mode
  try {
    defaultTheme = await getDefaultThemeMode(projectName);
    CacheOperations.defaultThemeMode = defaultTheme;
  } catch (error) {
    console.error("Error getting default theme mode:", error);
    
  }

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

    // Sort the array by orderIndex
    const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);

    // Loop through the sorted array
    sortedData.forEach(semantic => {
      CacheOperations.addNewThemeMode(semantic.themeMode);

      CacheOperations.addSemantic(semantic.semanticName, semantic.themeMode, semantic.linkedPrimitive);
    });

    
    // This script modifies the structure of a semantic table by:
    // 1. Defining it to have two columns with specific widths.
    // 2. Removing all rows from the table body except the header row.
    // 3. Keeping only specific header columns while removing others.

    // Set the number of columns in the semantic table
    semanticTableColumns = 2;

    // Define the column widths (first column: 200px, second column: 40px)
    semanticTable.style.gridTemplateColumns = "200px 40px";

    // Get the header row of the table
    const theadRow = document.getElementById('semantic-table-header-row');

    // Convert the table body's child elements (rows) into an array
    const rows = Array.from(semanticTableBody.children);

    // Remove all rows from the table body except the header row
    rows.forEach(row => {
      if (row !== theadRow) {
        semanticTableBody.removeChild(row);
      }
    });

    // If the header row exists, proceed with filtering its columns
    if (theadRow) {
      // Get all <td> elements inside the header row
      const allCells = Array.from(theadRow.children);

      // List of column IDs that should be kept
      const keepIds = ["semantic-name-column", "show-add-theme-modal"];

      // Iterate through all header cells and remove those not in the keepIds list
      allCells.forEach(td => {
        if (!keepIds.includes(td.id)) {
          theadRow.removeChild(td);
        }
      });
    }

    // This script dynamically manages theme modes in a semantic table.
    // 1. It retrieves all available theme modes from the SessionCache.
    // 2. If no theme modes exist, it logs a warning and adds "Light" as the default theme.
    // 3. If theme modes are found, it iterates through them and inserts them into the table.
    // 4. The script adjusts the table's column structure dynamically based on the number of theme modes.
    // 5. The last column is always set to 40px, the second-last column is flexible (minmax 200px, 1fr), and all other columns have a fixed width of 200px.


    // Retrieve all available theme modes from cache
    const allThemeModes = CacheOperations.getAllThemeModes();

    // Check if there are no theme modes available
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

      // Insert a new table cell for the "Light" theme mode as the default theme
      theadRow.insertBefore(CreateElement.semanticThemeModeCell("Light", true), theadRow.lastElementChild);

      // Increment the column count to reflect the newly added theme mode
      semanticTableColumns++;

      // Update the grid column structure of the table:
      // - First column: 200px
      // - Theme mode column: minmax(200px, 1fr) (adjustable width)
      // - Last column: 40px
      semanticTable.style.gridTemplateColumns = "200px minmax(200px, 1fr) 40px";

    } else {
      // If theme modes exist, iterate through them
      allThemeModes.forEach((themeMode, index) => {
        if (themeMode === defaultTheme) {
          theadRow.insertBefore(CreateElement.semanticThemeModeCell(themeMode, true), theadRow.lastElementChild);
        } else {
          theadRow.insertBefore(CreateElement.semanticThemeModeCell(themeMode), theadRow.lastElementChild);
        }

        semanticTableColumns++;

        let newGridTemplateColumns = '';

        // Loop through all columns to define their widths
        for (let i = 0; i < semanticTableColumns; i++) {
          if (i === semanticTableColumns - 1) {
            newGridTemplateColumns += '40px';  // Set the last column width to 40px
          } else if (i === semanticTableColumns - 2) {
            newGridTemplateColumns += 'minmax(200px, 1fr)';  // The second last column is flexible
          } else {
            newGridTemplateColumns += '200px ';  // Other columns have a fixed width of 200px
          }

          // Add spacing between columns if it's not the last column
          if (i !== semanticTableColumns - 1) {
            newGridTemplateColumns += ' ';
          }
        }

        // Apply the dynamically generated grid template to the table
        semanticTable.style.gridTemplateColumns = newGridTemplateColumns;
      });
    }

    // This script initializes and manages semantic names in a table based on available theme modes.
    // 1. It retrieves all semantic names from the SessionCache.
    // 2. If no semantic names and theme modes exist, it logs a warning and:
    //    - Adds "surface-primary" as a default semantic name linked to the "Light" theme mode.
    //    - Updates the default theme mode and caches the new semantic entry.
    // 3. If semantic names exist, it iterates through them:
    //    - Retrieves semantic values for each theme mode from the SessionCache.
    //    - If all expected semantic values are found, it adds them as a new row to the semantic table.

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


      addSemantic(projectName, "surface-primary", "Click to link color", "Light", currentSemanticRowId);

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

/**
 * Deletes a semantic color entry from the IndexedDB.
 *
 * This function iterates over all records in the `semanticColors` object store 
 * and deletes entries that match the given project name and semantic name.
 *
 * @param {string} projectName - The name of the project associated with the semantic color.
 * @param {string} semanticName - The name of the semantic color to be deleted.
 * @returns {Promise<string>} - A promise that resolves when the semantic color is successfully deleted, 
 *                              or rejects if an error occurs or no matching records are found.
 */
function deleteSemantic( projectName, semanticName) {
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

            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
              }
            });
            
            resolve(`Semantic color '${semanticName}' deleted successfully.`);
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

/**
 * Updates the default theme mode for a given project in the IndexedDB.
 *
 * This function retrieves the project data, updates the `defaultThemeMode` property, 
 * and saves the changes back to the database.
 *
 * @param {string} projectName - The name of the project whose default theme mode needs to be updated.
 * @param {string} newDefaultThemeMode - The new default theme mode to be set.
 * @returns {Promise<string>} - A promise that resolves when the update is successful, 
 *                              or rejects with an error message if the update fails.
 */

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
            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
              }
            });
            CacheOperations.defaultThemeMode = newDefaultThemeMode;
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

function getDefaultThemeMode(projectName) {
  return new Promise((resolve, reject) => {
      if (!isDBOpenSuccess || !db) {
          reject("Database is not initialized.");
          return;
      }

      const transaction = db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const request = store.get(projectName);

      request.onsuccess = function () {
          if (request.result) {
              resolve(request.result.defaultThemeMode || null);
              console.log(...Logger.multiLog(
                ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
                ["Default theme mode for project"],
                [projectName, Logger.Types.INFO, Logger.Formats.BOLD],
                ["is"],
                [request.result.defaultThemeMode || "not set", Logger.Types.INFO, Logger.Formats.BOLD]
              ));
          } else {
              reject(`Project '${projectName}' not found.`);
              console.log(...Logger.multiLog(
                ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
                ["Project"],
                [projectName, Logger.Types.ERROR, Logger.Formats.BOLD],
                ["not found."]
              ));
          }
      };

      request.onerror = function (event) {
          reject(`Failed to retrieve defaultThemeMode: ${event.target.error}`);
      };
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
            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
              }
            });
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
            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_COLOR_DATA_CHANGED, true);
              }
            });
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
function getColorThemesData(projectName) {

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
            resolve(jsonString);
            
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

/**
 * Retrieves all fonts associated with a specified project from the IndexedDB.
 *
 * This function fetches all font records that belong to the given project name. 
 * It resolves with a success message and updates the UI with the fetched fonts. 
 * If an error occurs during the database operation, it rejects with an error message.
 *
 * @param {string} projectName - The name of the project for which to fetch fonts.
 * @returns {Promise<string>} - A promise that resolves with a message indicating success 
 *                              or rejects with an error message if the operation fails.
 */

function getAllFonts(projectName) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["fonts"], "readonly");
    let store = transaction.objectStore("fonts");
    let index = store.index("projectName");
    let request = index.getAll(IDBKeyRange.only(projectName));
    
    request.onsuccess = () => {
      resolve(`Fonts fetched from ${projectName}`);

      let result = request.result;

      console.log(...Logger.multiLog(
        ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
        ["Fetched fonts from"],
        [projectName, Logger.Types.SUCCESS, Logger.Formats.BOLD],
        ["project."]
      ));


      const fontsTableBody = document.querySelector("#fonts-table tbody");
      
      const rows = Array.from(fontsTableBody.children);
    
      rows.forEach(row => {
        
        fontsTableBody.removeChild(row);
        
      });

      // Sort the array by orderIndex
      const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);

      // Loop through the sorted array
      sortedData.forEach(fontData => {
        CacheOperations.addFont(fontData.fontTag, fontData.shortFontTag, fontData.fontName);
        addNewRowToFontsTable(fontData.fontTag, fontData.shortFontTag, fontData.fontName);
      });
    };

    request.onerror = () =>  {
      reject("Error retrieving fonts");
      console.log(...Logger.multiLog(
        ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
        ["Error retrieving fonts"]
      ));
    };

  });
}

/**
 * Adds a new font entry to the IndexedDB for a specified project.
 *
 * This function creates a new font record in the "fonts" object store. 
 * It resolves with a success message if the font is added successfully or 
 * rejects with an error message if the operation fails.
 *
 * @param {string} projectName - The name of the project associated with the font.
 * @param {string} fontTag - The font tag for the font.
 * @param {string} shortFontTag - The shortened version of the font tag.
 * @param {string} fontName - The full name of the font.
 * @param {number} orderIndex - The order index for the font in the list.
 * @returns {Promise<string>} - A promise that resolves with a success message or 
 *                              rejects with an error message if the operation fails.
 */

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
      CacheOperations.addFont(fontTag, shortFontTag, fontName);
      cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
        if (selectedProject === projectName) {
          cache.set(CACHE_KEYS.IS_FONT_DATA_CHANGED, true);
        }
      });
      resolve("Font added successfully");
      console.log(...Logger.multiLog(
        ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
        ["Font added successfully"]
      ));
    } 
    request.onerror = () => {
      reject("Error adding font");
      console.log(...Logger.multiLog(
        ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
        ["Error adding font", Logger.Types.ERROR]
      ));
    }
  });
}

/**
 * Updates an existing font entry in the IndexedDB for a specified project.
 *
 * @param {string} projectName - The name of the project associated with the font.
 * @param {string} fontTag - The current font tag to identify which font to update.
 * @param {string} [newFontTag='@default'] - The new font tag to set. If '@default', retains the current value.
 * @param {string} [newShortFontTag='@default'] - The new short font tag to set. If '@default', retains the current value.
 * @param {string} [newFontName='@default'] - The new font name to set. If '@default', retains the current value.
 * @param {number} [newOrderIndex='@default'] - The new order index to set. If '@default', retains the current value.
 * @returns {Promise<string>} A promise that resolves to a success message if the update is successful, or rejects with an error message if the font is not found or if there is a database error.
 */

function updateFont(projectName, fontTag, newFontTag = "@default", newShortFontTag = "@default", newFontName = "@default", newOrderIndex = "@default") {
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

    transaction.oncomplete = () => {
      console.log(...Logger.multiLog(
        ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
        ["Font updated successfully"]
      ));
    };
    
    request.onsuccess = function (event) {
      let cursor = event.target.result;
      if (cursor) {
        if (cursor.value.fontTag === fontTag) {
          let updateData = { ...cursor.value }; // Create a copy of the current value

          // Update properties only if new value is not '@default'
          if (newFontTag !== '@default') updateData.fontTag = newFontTag;
          if (newShortFontTag !== '@default') updateData.shortFontTag = newShortFontTag;
          if (newFontName !== '@default') updateData.fontName = newFontName;
          if (newOrderIndex !== '@default') updateData.orderIndex = newOrderIndex;

          store.put(updateData);
          cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
            if (selectedProject === projectName) {
              cache.set(CACHE_KEYS.IS_FONT_DATA_CHANGED, true);
            }
          });
          resolve("Font updated successfully");

          CacheOperations.updateFont(fontTag, newFontTag, newShortFontTag, newFontName);

        }
        cursor.continue();
      } else {
        reject("Font not found");
      }
    };
  });
}

/**
 * Deletes a font entry from the IndexedDB for a specified project.
 *
 * @param {string} projectName - The name of the project associated with the font.
 * @param {string} fontTag - The font tag of the font to be deleted.
 * @returns {Promise<string>} A promise that resolves to a success message if the deletion is successful, or rejects with an error message if the font is not found or if there is a database error.
 */

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
          CacheOperations.deleteFont(fontTag);

          console.log(...Logger.multiLog(
            ["[DELETED]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
            ["Font"],
            [fontTag, Logger.Types.ERROR, Logger.Formats.BOLD],
            ["deleted successfully."]
          ));
          cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
            if (selectedProject === projectName) {
              cache.set(CACHE_KEYS.IS_FONT_DATA_CHANGED, true);
            }
          });
        }
        cursor.continue();
      } else {
        reject("Font not found");
        console.log(...Logger.multiLog(
          ["[Error]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
          ["Font"],
          [fontTag, Logger.Types.ERROR, Logger.Formats.BOLD],
          ["not found."]
        ));
      }
    };
  });
}

function getFontsData(projectName) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }

    const transaction = db.transaction(["projects", "fonts"], "readonly");
    const projectsStore = transaction.objectStore("projects");
    const fontsStore = transaction.objectStore("fonts");

    const projectRequest = projectsStore.get(projectName);
    const fontsIndex = fontsStore.index("projectName");
    const fontsRequest = fontsIndex.getAll(projectName);

    projectRequest.onsuccess = () => {
      const project = projectRequest.result;

      if (!project) {
        return reject(`Project "${projectName}" not found`);
      }

      fontsRequest.onsuccess = () => {
        const fonts = fontsRequest.result;
        const fontsObj = {};

        fonts.forEach((font) => {
          fontsObj[font.fontTag] = {
            shortFontTag: font.shortFontTag,
            fontName: font.fontName
          };
        });

        const result = {
          ProjectName: project.projectName,
          Author: project.author,
          Version: project.version,
          Fonts: fontsObj
        };

        const jsonString = JSON.stringify(result, null, 2);
        resolve(jsonString);
      };

      fontsRequest.onerror = () => {
        reject("Error fetching fonts data");
      };
    };

    projectRequest.onerror = () => {
      reject("Error fetching project data");
    };
  });
}


function addTranslations(projectName, translationJson) {

  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }

    let transaction = db.transaction(["translations"], "readwrite");
    let store = transaction.objectStore("translations");
    let index = store.index("projectName");
    let getRequest = index.get(projectName);
    
    getRequest.onsuccess = function() {
      let existingData = getRequest.result;
      if (existingData) {
          // Update existing record
          existingData.defaultLanguage = translationJson.DefaultLanguage;
          existingData.translationData = translationJson;
          let updateRequest = store.put(existingData);
          
          updateRequest.onsuccess = function() {
            cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
              if (selectedProject === projectName) {
                cache.set(CACHE_KEYS.IS_TRANSLATION_DATA_CHANGED, true);
              }
            });
              console.log("Translation updated successfully");
              resolve("Translation updated successfully");
          };
          
          updateRequest.onerror = function() {
              console.error("Error updating translation", updateRequest.error);
              reject("Error updating translation");
          };
      } else {
          // Add new record
          let data = {
              projectName: projectName,
              defaultLanguage: translationJson.DefaultLanguage,
              translationData: translationJson
          };
          
          let addRequest = store.add(data);
          
          addRequest.onsuccess = function() {
              console.log("Translation added successfully");
              cache.get(CACHE_KEYS.AI2_SELECTED_PROJECT, (selectedProject) => {
                if (selectedProject === projectName) {
                  cache.set(CACHE_KEYS.IS_TRANSLATION_DATA_CHANGED, true);
                }
              });
              resolve("Translation added successfully");
          };
          
          addRequest.onerror = function() {
              console.error("Error adding translation", addRequest.error);
              reject("Error adding translation");
          };
      }
    }
  });    
}

function getTranslationData(projectName) {

  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["translations"], "readonly");
    let store = transaction.objectStore("translations");
    let index = store.index("projectName");
    let getRequest = index.get(projectName);
    
    getRequest.onsuccess = function() {
        if (getRequest.result) {
          const translationData = getRequest.result.translationData;
            resolve(translationData);
            console.log(JSON.stringify(translationData, null, 2));
        } else {
            console.log("No translation found for project", projectName);
            reject("No translation found for project");
        }
    };
    
    getRequest.onerror = function() {
        console.error("Error retrieving translation", getRequest.error);
        reject("Error retrieving translation");
    };
  });  
}

function isTranslationDataAvailable(projectName) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      const error = "Database is not initialized";
      console.error(error);
      return reject(error);
    }
    let transaction = db.transaction(["translations"], "readonly");
    let store = transaction.objectStore("translations");
    let index = store.index("projectName");
    let getRequest = index.get(projectName);
    
    getRequest.onsuccess = function() {
        resolve(!!getRequest.result);
    };
    
    getRequest.onerror = function() {
        console.error("Error checking translation data", getRequest.error);
        reject(false);
    };
  });
}


