import DatabaseModel from "./DatabaseModel.js";
import ProjectModel from "./ProjectModel.js";
import PrimitiveColorModel from "./PrimitiveColorModel.js";
import SemanticColorModel from "./SemanticColorModel.js";
import FontModel from "./FontModel.js";
import TranslationModel from "./TranslationModel.js";
import cacheManager from "../utils/cache/cacheManager.js";



class DatabaseManager {
  constructor() {
    this.projects = new ProjectModel();
    this.primitives = new PrimitiveColorModel();
    this.semantics = new SemanticColorModel();
    this.fonts = new FontModel();
    this.translations = new TranslationModel();

    // Listen to Dexie DB changes globally here
    DatabaseModel.sharedDB.on("changes", async (changes) => {
      const ai2SelectedProjectId = await getAI2SelectedProjectId();
      const activeProjectId = cacheManager.projects.activeProjectId;

      console.log(ai2SelectedProjectId);
      console.log(activeProjectId);
      
      

      // Call handleChanges only once if condition is met
      if ( ai2SelectedProjectId === activeProjectId ) {
        this.handleChanges(changes);
      }
    });
  }

  handleChanges(changes) {
    for (const change of changes) {
      const { table, type, key, obj, mods, oldObj } = change;
  
      let data = null;
  
      switch (type) {
        case 1: // CREATE
          data = { ...obj, [getPrimaryKeyName(table)]: key };
          break;
        case 2: // UPDATE
          const updatedData = applyModifications(oldObj, mods);
          data = { ...updatedData, [getPrimaryKeyName(table)]: key };
          break;
        case 3: // DELETE
          data = { ...oldObj, [getPrimaryKeyName(table)]: key };
          break;
      }
  
      const message = {
        action: "dbChange",
        table,
        type, // 1=CREATE, 2=UPDATE, 3=DELETE
        data,
      };

      console.log(message);
      
  
      // Send to only App Inventor tab(s)
      chrome.tabs.query({ url: "*://ai2.appinventor.mit.edu/*" }, (tabs) => {
        for (const tab of tabs) {
          if (tab.id) {
            chrome.tabs.sendMessage(tab.id, message);
          }
        }
      });
    }
  }
}

function getPrimaryKeyName(table) {
  switch (table) {
    case "projects": return "projectId";
    case "primitiveColors": return "primitiveId";
    case "semanticColors": return "semanticId";
    case "fonts": return "fontId";
    case "translations": return "translationId";
    default: return "id"; // Fallback
  }
}

async function getAI2SelectedProjectId(){
  return new Promise((resolve, reject) => {
    chrome.storage.session.get("AI2_SELECTED_PROJECT_ID", (result) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(result.AI2_SELECTED_PROJECT_ID || null);
      }
    });
  });
}

function applyModifications(target, mods) {
  const result = structuredClone(target); // Or deep clone with lodash/your method

  for (const [key, value] of Object.entries(mods)) {
    const path = key.split(".");
    let obj = result;

    for (let i = 0; i < path.length - 1; i++) {
      if (!(path[i] in obj)) obj[path[i]] = {};
      obj = obj[path[i]];
    }

    obj[path[path.length - 1]] = value;
  }

  return result;
}


export default new DatabaseManager();
