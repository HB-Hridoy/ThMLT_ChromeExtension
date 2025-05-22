let sharedDB = null;

class DatabaseModel {
  constructor() {
    // Ensure shared DB instance only
    if (!sharedDB) {
      sharedDB = new Dexie("ThMLT_DB");

      sharedDB.version(1).stores({
        projects: "++projectId, projectName, deleted, deletedAt, [deleted+deletedAt], lastModified",
        primitiveColors: "++primitiveId, projectId, primitiveName, orderIndex",
        semanticColors: "++semanticId, projectId, semanticName, orderIndex",
        fonts: "++fontId, projectId, fontName, orderIndex",
        translations: "++translationId, projectId, translationData",
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
