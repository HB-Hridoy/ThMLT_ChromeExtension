import cache, { CACHE_KEYS } from './Utility/HybridCacheSystem.js';
import ThMLT_DB from './Utility/ThMLT_DB.js';

const thmltDatabase = new ThMLT_DB("ThMLT DB", 1);

setTimeout(() => {
  thmltDatabase.getAllProjects((error, projects) => {
    if (error) return console.error("Error:", error.message);

    const projectNames = projects.map(project => project.projectName);
    cache.set(CACHE_KEYS.PROJECTS, projects);
    cache.set(CACHE_KEYS.PROJECT_NAMES, projectNames);
  });
}, 2000);

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

let defaultThemeMode = "";

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




