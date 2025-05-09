let sharedDB = null;

class DatabaseModel {
  constructor() {
    // Ensure shared DB instance only
    if (!sharedDB) {
      sharedDB = new Dexie("ThMLT_DB");

      sharedDB.version(1).stores({
        projects: "++projectId, projectName, deleted, deletedAt, [deleted+deletedAt], lastModified",
        primitiveColors: "++id, projectId, primitiveName, orderIndex",
        semanticColors: "++id, projectId, semanticName, linkedPrimitive, themeMode, orderIndex, deleted, deletedAt",
        fonts: "++id, projectId, fontTag, shortFontTag, fontName, orderIndex, deleted, deletedAt",
        translations: "++id, projectId, defaultLanguage, translationData, deleted, deletedAt",
      });

      sharedDB.open().catch((error) => {
        console.error("Failed to open Dexie database:", error);
      });
    }

    this.db = sharedDB; // Inject shared DB
    this.debug = true;
    this.SKIP = "@skip";
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
