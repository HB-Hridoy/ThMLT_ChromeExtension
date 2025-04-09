import SessionCache, { CACHE_KEYS } from './Utility/cache.js';
import ThMLT_DB from './Utility/ThMLT_DB.js';

const thmltDatabase = new ThMLT_DB("ThMLT DB", 1);

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

// setTimeout(async () => {
//   await thmltDatabase.getAllProjects();
//   console.log("all project stored in SessionCache");
  
// }, 5000);

let defaultThemeMode = "";

// const openDB = indexedDB.open("ThMLT DB", 1);
// let db;
// let isDBOpenSuccess = false;

// openDB.onupgradeneeded = function (event) {
//   db = event.target.result;

//   // Create 'projects' object store
//   if (!db.objectStoreNames.contains("projects")) {
//     let projectsStore = db.createObjectStore("projects", { keyPath: "projectName" });
//     projectsStore.createIndex("projectName", "projectName", { unique: true });
//     projectsStore.createIndex("author", "author", { unique: false });
//     projectsStore.createIndex("version", "version", { unique: false });
//     projectsStore.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
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

//   // Create 'fonts' object store
//   if (!db.objectStoreNames.contains("fonts")) {
//     let fontsStore = db.createObjectStore("fonts", { keyPath: "id", autoIncrement: true  });
//     fontsStore.createIndex("projectName", "projectName", { unique: false });
//     fontsStore.createIndex("fontTag", "fontTag", { unique: false });
//     fontsStore.createIndex("shortFontTag", "shortFontTag", { unique: false });
//     fontsStore.createIndex("fontName", "fontName", { unique: false });
//     fontsStore.createIndex("orderIndex", "orderIndex", { unique: false });
//   }

//   // Create 'translations' object store
//   if (!db.objectStoreNames.contains("translations")) {
//     let translationStore = db.createObjectStore("translations", { keyPath: "id", autoIncrement: true  });
//     translationStore.createIndex("projectName", "projectName", { unique: false });
//     translationStore.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
//     translationStore.createIndex("translationData", "translationData", { unique: false });
//   }

// };

// openDB.onsuccess = (event) => {
//   isDBOpenSuccess = true;
//   db = openDB.result;
// };

// openDB.onerror = function (event) {
//   console.error("Database error:", event.target.errorCode);
// };

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "Project Availability") {
    console.log(`Checking if ${message.projectName} is available`);
    isProjectAvailable(message.projectName)
      .then(isAvailable => {
        sendResponse({ 
          action: "Project Availability",
          status: isAvailable ? "success" : "failed",
          projectName: message.projectName,
          projectData: "",
          themeMode: ""
        });
      })
      .catch(error => {
        console.error(`Error checking project availability: ${error}`);
        sendResponse({ 
          action: "Project Availability",
          status: "failed",
          projectName: message.projectName,
          projectData: "",
          themeMode: ""
        });
      });
    return true; // Keep the message channel open for async response
  }
});



function getSemanticColors(projectName) {
  return new Promise((resolve, reject) => {
    if (!isDBOpenSuccess || !db) {
      return reject("Database is not initialized");
    }

    const transaction = db.transaction(["projects", "semanticColors", "primitiveColors"], "readonly");
    const projectsStore = transaction.objectStore("projects");
    const semanticStore = transaction.objectStore("semanticColors");
    const primitiveStore = transaction.objectStore("primitiveColors");

    // Step 1: Get the defaultThemeMode from the projects store
    const projectRequest = projectsStore.get(projectName);

    projectRequest.onsuccess = function(event) {
      const project = event.target.result;
      if (!project) {
        return reject("Project not found.");
      }

      const themeMode = project.defaultThemeMode;
      defaultThemeMode = themeMode;

      // Step 2: Get all semantic colors for the project and themeMode
      const semanticIndex = semanticStore.index("projectName");
      const semanticRequest = semanticIndex.getAll(projectName);

      semanticRequest.onsuccess = function(event) {
        let semanticColors = event.target.result.filter(sc => sc.themeMode === themeMode);

        // Step 3: Get all primitive colors for the project
        const primitiveIndex = primitiveStore.index("projectName");
        const primitiveRequest = primitiveIndex.getAll(projectName);

        primitiveRequest.onsuccess = function(event) {
          const primitives = event.target.result;
          const primitiveMap = new Map(primitives.map(p => [p.primitiveName, p.primitiveValue]));

          // Step 4: Replace linkedPrimitive with primitiveValue
          const result = {};
          semanticColors.forEach(sc => {
            result[sc.semanticName] = primitiveMap.get(sc.linkedPrimitive) || sc.linkedPrimitive;
          });

          resolve(result);
        };

        primitiveRequest.onerror = () => reject("Failed to fetch primitive colors.");
      };

      semanticRequest.onerror = () => reject("Failed to fetch semantic colors.");
    };

    projectRequest.onerror = () => reject("Failed to fetch project details.");
  });
}




