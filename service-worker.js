chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// const openDB = indexedDB.open("ThMLT DB", 1);
// let db;

// openDB.onupgradeneeded = function (event) {
//   db = event.target.result;

//   // Create 'projects' object store
//   if (!db.objectStoreNames.contains("projects")) {
//     let projectsStore = db.createObjectStore("projects", { keyPath: "projectName" });
//     projectsStore.createIndex("projectName", "projectName", { unique: true });
//     projectsStore.createIndex("author", "author", { unique: false });
//     projectsStore.createIndex("version", "version", { unique: false });
//     projectsStore.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
//     projectsStore.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
//   }
//   // Create 'defaultThemeMode' object store
//   if (!db.objectStoreNames.contains("defaultThemeMode")) {
//     let defaultThemeModeStore = db.createObjectStore("defaultThemeMode", { keyPath: "projectName" });
//     defaultThemeModeStore.createIndex("projectName", "projectName", { unique: true });
//     defaultThemeModeStore.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
//   }

//   // Create 'defaultLanguage' object store
//   if (!db.objectStoreNames.contains("defaultLanguage")) {
//     let defaultLanguageStore = db.createObjectStore("defaultLanguage", { keyPath: "projectName" });
//     defaultLanguageStore.createIndex("projectName", "projectName", { unique: true });
//     defaultLanguageStore.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
//   }


//   // Create 'primitiveColors' object store
//   if (!db.objectStoreNames.contains("primitiveColors")) {
//     let primitiveColorsStore = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true  });
//     primitiveColorsStore.createIndex("projectName", "projectName", { unique: false });
//     primitiveColorsStore.createIndex("primitiveName", "primitiveName", { unique: false });
//     primitiveColorsStore.createIndex("primitiveValue", "primitiveValue", { unique: false });
//     primitiveColorsStore.createIndex("orderIndex", "orderIndex", { unique: false });
//   }

//   // Create 'semanticColors' object store
//   if (!db.objectStoreNames.contains("semanticColors")) {
//     let semanticColorsStore = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true  });
//     semanticColorsStore.createIndex("projectName", "projectName", { unique: false });
//     semanticColorsStore.createIndex("semanticName", "semanticName", { unique: false });
//     semanticColorsStore.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
//     semanticColorsStore.createIndex("themeMode", "themeMode", { unique: false });
//     semanticColorsStore.createIndex("orderIndex", "orderIndex", { unique: false });
//   }

// };

// openDB.onsuccess = (event) => {
//   db = openDB.result;
// };

// openDB.onerror = function (event) {
//   console.error("Database error:", event.target.errorCode);
// };

chrome.runtime.onConnect.addListener((port) => {
  if (port.name === 'persistentConnection') {
    console.log('Persistent connection established');
    
    port.onMessage.addListener((msg) => {

      if (msg.action === "Project Availability") {
        console.log(`Checking ${msg.projectName} available on chrome.storage.local`);
        
        chrome.storage.local.get(["ThMLT-Projects"], (result) => {
          const projectNames = result["ThMLT-Projects"];
          if ( projectNames && projectNames.includes(msg.projectName)) {
            getSemanticColors(msg.projectName, (err, semanticColors) => {
              if (err) {
                port.postMessage({ 
                  action: "Project Availability",
                  status: "success",
                  projectName: msg.projectName,
                  projectData: `Error fetching semantic colors:, ${err}`
                });
              } else {
                port.postMessage({ 
                  action: "Project Availability",
                  status: "success",
                  projectName: msg.projectName,
                  projectData: semanticColors
                });
              }
            });
            
            
          } else {
            port.postMessage({ 
              action: "Project Availability",
              status: "failed",
              projectName: msg.projectName
            });
          }
        });
      
      }

    });
    
    port.onDisconnect.addListener(() => {
      console.log('Port disconnected');
    });
  }
});


function getSemanticColors(projectName, callback) {
  // Open a read-only transaction for both 'defaultThemeMode', 'semanticColors', and 'primitiveColors' object stores
  const transaction = db.transaction(["defaultThemeMode", "semanticColors", "primitiveColors"], "readonly");
  const defaultThemeStore = transaction.objectStore("defaultThemeMode");
  const semanticStore = transaction.objectStore("semanticColors");
  const primitiveStore = transaction.objectStore("primitiveColors");

  // Retrieve the default theme mode for the project
  const defaultThemeModeRequest = defaultThemeStore.get(projectName);

  let defaultThemeMode = null;
  let semanticResults = null;
  let primitiveResults = null;

  // When the default theme mode is retrieved
  defaultThemeModeRequest.onsuccess = function(event) {
    defaultThemeMode = event.target.result ? event.target.result.defaultThemeMode : null;

    // If a theme mode is found, proceed to fetch the semantic and primitive colors
    if (defaultThemeMode) {
      // Retrieve all semantic colors for the given projectName and themeMode
      const semanticIndex = semanticStore.index("projectName");
      const semanticRequest = semanticIndex.getAll(projectName);

      // Retrieve all primitive colors for the given projectName
      const primitiveIndex = primitiveStore.index("projectName");
      const primitiveRequest = primitiveIndex.getAll(projectName);

      semanticRequest.onsuccess = function(event) {
        semanticResults = event.target.result.filter(item => item.themeMode === defaultThemeMode);
        if (primitiveResults !== null) {
          processResults();
        }
      };

      primitiveRequest.onsuccess = function(event) {
        primitiveResults = event.target.result;
        if (semanticResults !== null) {
          processResults();
        }
      };
    } else {
      callback(new Error("Theme mode not found for project"));
    }
  };

  // Handle any errors from the transaction
  transaction.onerror = function(event) {
    callback(event.target.error);
  };

  // Process the results once both semantic and primitive data are retrieved
  function processResults() {
    // Build a lookup map from primitiveName to primitiveValue
    const primitiveMap = {};
    for (const primitive of primitiveResults) {
      primitiveMap[primitive.primitiveName] = primitive.primitiveValue;
    }

    // Create the final object mapping semanticName to the resolved color value.
    const semanticColors = {};
    for (const semantic of semanticResults) {
      // Replace the linkedPrimitive with the actual primitiveValue
      const resolvedColor = primitiveMap[semantic.linkedPrimitive] || semantic.linkedPrimitive;
      semanticColors[semantic.semanticName] = resolvedColor;
    }

    // Return the final result via the callback
    callback(null, semanticColors);
  }
}



