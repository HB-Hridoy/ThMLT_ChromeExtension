class DatabaseModel {
  constructor() {
    this.db = null;
    this.debug = true;
    this.SKIP = "@skip";

    this.DB_NAME = "ThMLT DB";
    this.DB_VERSION = 1;

    // Initialize DB and store the Promise
    this.ready = new Promise((resolve, reject) => {
      this.log("Initializing database...");
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (event) => {
        this.db = event.target.result;
        this._createStores();
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        this.log("Database opened successfully!");
        resolve();
      };

      request.onerror = (event) => {
        const error = "Database error: " + event.target.errorCode;
        this.log(error, true);
        reject(error);
      };
    });
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

  _createStores() {
    const db = this.db;
    if (!db) return;

    if (!db.objectStoreNames.contains("projects")) {
      const store = db.createObjectStore("projects", { keyPath: "projectId" });
      store.createIndex("projectName", "projectName", { unique: true });
      store.createIndex("author", "author", { unique: false });
      store.createIndex("version", "version", { unique: false });
      store.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
      store.createIndex("deleted", "deleted", { unique: false });
      store.createIndex("deletedAt", "deletedAt", { unique: false });

    }

    if (!db.objectStoreNames.contains("primitiveColors")) {
      const store = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true });
      store.createIndex("projectId", "projectId", { unique: false });
      store.createIndex("primitiveName", "primitiveName", { unique: false });
      store.createIndex("projectId_primitiveName", ["projectId", "primitiveName"], { unique: true });
      store.createIndex("primitiveValue", "primitiveValue", { unique: false });
      store.createIndex("orderIndex", "orderIndex", { unique: false });
      store.createIndex("deleted", "deleted", { unique: false });
      store.createIndex("deletedAt", "deletedAt", { unique: false });
    }

    if (!db.objectStoreNames.contains("semanticColors")) {
      const store = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true });
      store.createIndex("projectId", "projectId", { unique: false });
      store.createIndex("semanticName", "semanticName", { unique: false });
      store.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
      store.createIndex("themeMode", "themeMode", { unique: false });
      store.createIndex("orderIndex", "orderIndex", { unique: false });
      store.createIndex("deleted", "deleted", { unique: false });
      store.createIndex("deletedAt", "deletedAt", { unique: false });
    }

    if (!db.objectStoreNames.contains("fonts")) {
      const store = db.createObjectStore("fonts", { keyPath: "id", autoIncrement: true });
      store.createIndex("projectId", "projectId", { unique: false });
      store.createIndex("fontTag", "fontTag", { unique: false });
      store.createIndex("shortFontTag", "shortFontTag", { unique: false });
      store.createIndex("fontName", "fontName", { unique: false });
      store.createIndex("orderIndex", "orderIndex", { unique: false });
      store.createIndex("deleted", "deleted", { unique: false });
      store.createIndex("deletedAt", "deletedAt", { unique: false });
    }

    if (!db.objectStoreNames.contains("translations")) {
      const store = db.createObjectStore("translations", { keyPath: "id", autoIncrement: true });
      store.createIndex("projectId", "projectId", { unique: false });
      store.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
      store.createIndex("translationData", "translationData", { unique: false });
      store.createIndex("deleted", "deleted", { unique: false });
      store.createIndex("deletedAt", "deletedAt", { unique: false });
    }
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