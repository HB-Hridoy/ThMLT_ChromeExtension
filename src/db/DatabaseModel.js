
class DatabaseModel {

  // Private static property to hold the shared Dexie instance
  static _sharedDB = null;

  // Static getter to return (or initialize) the shared Dexie instance
  static get sharedDB() {
    if (!this._sharedDB) {
      this._sharedDB = new Dexie("ThMLT_DB");
      this._sharedDB.version(1).stores({
        projects: "++projectId, projectName, deleted, deletedAt, [deleted+deletedAt], lastModified",
        primitiveColors: "++primitiveId, projectId, primitiveName, orderIndex",
        semanticColors: "++semanticId, projectId, semanticName, orderIndex",
        fonts: "++fontId, projectId, fontName, orderIndex",
        translations: "++translationId, projectId, translationData",
      });

      this._sharedDB.open().catch((error) =>
        console.error("Failed to open Dexie DB:", error)
      );
    }
    return this._sharedDB;
  }

  constructor() {
    // Every model instance shares the same DB instance
    this.db = DatabaseModel.sharedDB;
    this.debug = false;
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
