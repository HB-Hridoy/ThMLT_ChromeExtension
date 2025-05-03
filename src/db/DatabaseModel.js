// import { Dexie } from '../../vendor/dexie.min.js';

let instance = null;

class DatabaseModel {
  constructor() {
    if (instance) return instance; // Ensure singleton

    this.db = new Dexie("ThMLT_DB");

    // Define the schema using Dexie's versioning system
    this.db.version(1).stores({
      // Projects Store
      projects: "++projectId, projectName, deleted, deletedAt, [deleted+deletedAt], lastModified",

      // Primitive Colors Store
      primitiveColors: "++id, projectId, primitiveName, orderIndex, deleted, deletedAt, [projectId+deleted]",

      // Semantic Colors Store
      semanticColors: "++id, projectId, semanticName, linkedPrimitive, themeMode, orderIndex, deleted, deletedAt",

      // Fonts Store
      fonts: "++id, projectId, fontTag, shortFontTag, fontName, orderIndex, deleted, deletedAt",

      // Translations Store
      translations: "++id, projectId, defaultLanguage, translationData, deleted, deletedAt"
    });

    this.db.open().catch((error) => {
      console.error("Failed to open Dexie database:", error);
    });
    
    this.debug = true; // Debug mode flag
    this.SKIP = "@skip"; // Placeholder for skipped values

    instance = this; // Save the singleton instance
    return instance;
  }

  log(message, isError = false) {
    if (this.debug) {
      isError ? console.error(message) : console.log(message);
    }
  }

  setDebugMode(enabled) {
    this.debug = enabled;
    this.log(`Debug mode set to: ${enabled}`);
  }

  sanitizeForUpdate(data) {
    const result = {};
    for (const [key, value] of Object.entries(data)) {
      if (value !== this.SKIP) {
        result[key] = value;
      }
    }
    return result;
  }
}

export default DatabaseModel;
