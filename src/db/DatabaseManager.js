import { ProjectModel } from './models/ProjectModel.js';
import { FontModel } from './models/FontModel.js';
import { TypographyModel } from './models/TypographyModel.js';
import { PrimitiveColorModel } from './models/PrimitiveColorModel.js';
import { SemanticColorModel } from './models/SemanticColorModel.js';
import { TranslationModel } from './models/TranslationModel.js';
import { getDatabase } from './instance.js';
import cacheManager from '../utils/cache/cacheManager.js';

export class DatabaseManager {
  constructor() {
    this.db = getDatabase();
    this.initialized = false;
    
    // Initialize models - these will be available as properties
    this.projects = null;
    this.fonts = null;
    this.typographies = null;
    this.primitives = null;
    this.semantics = null;
    this.translations = null;
  }

  async initialize() {
    if (this.initialized) return this;

    try {
      // Initialize all model instances
      this.projects = new ProjectModel();
      this.fonts = new FontModel();
      this.typographies = new TypographyModel();
      this.primitives = new PrimitiveColorModel();
      this.semantics = new SemanticColorModel(this);
      this.translations = new TranslationModel();

      // Wait for database to be ready
      await this.db.open();

      // Listen to Dexie DB changes globally here
      this.db.on("changes", async (changes) => {
        const ai2SelectedProjectId = await getAI2SelectedProjectId();
        const activeProjectId = cacheManager.projects.activeProjectId;

        if (ai2SelectedProjectId === activeProjectId) {
          this.handleChanges(changes);
        }
      });
      
      this.initialized = true;
      console.log('DatabaseManager initialized successfully');
      return this;
    } catch (error) {
      console.error('Error initializing DatabaseManager:', error);
      throw error;
    }
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

// =============================================================================
//  SINGLETON DATABASE MANAGER
// =============================================================================

// Create singleton instance
let managerInstance = null;

export async function getDatabaseManager() {
  if (!managerInstance) {
    managerInstance = new DatabaseManager();
    await managerInstance.initialize();
  }
  return managerInstance;
}

// =============================================================================
//  PRIVATE METHODS
// =============================================================================

function getPrimaryKeyName(table) {
  switch (table) {
    case "projects": return "projectId";
    case "primitiveColors": return "primitiveId";
    case "semanticColors": return "semanticId";
    case "fonts": return "fontId";
    case "typography": return "typographyId";
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
