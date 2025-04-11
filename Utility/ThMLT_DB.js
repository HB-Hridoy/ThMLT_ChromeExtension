class ThMLT_DB {
  constructor() {
      this.db = null;
      this.isDBOpenSuccess = false;
      this.debug = true;

      // Open the IndexedDB
      const request = indexedDB.open("ThMLT DB", 1);

      request.onupgradeneeded = (event) => {
          this.db = event.target.result;
          this.createStores();
      };

      request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isDBOpenSuccess = true;
          this.log("Database opened successfully!");
      };

      request.onerror = (event) => {
          this.log("Database error: " + event.target.errorCode, true);
      };
  }

  // Conditional logging based on debug flag
  log(message, isError = false) {
      if (this.debug) {
          isError ? console.error(message) : console.log(message);
      }
  }
  // Enable or disable debug mode dynamically
  setDebugMode(enabled) {
    this.debug = enabled;
    this.log(`Debug mode set to: ${enabled}`);
  }

  // Create Object Stores
  createStores() {
    const db = this.db;
    if (!db) return;

    // Create 'projects' store
    if (!db.objectStoreNames.contains("projects")) {
        const store = db.createObjectStore("projects", { keyPath: "projectName" });
        store.createIndex("projectName", "projectName", { unique: true });
        store.createIndex("author", "author", { unique: false });
        store.createIndex("version", "version", { unique: false });
        store.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
    }

    // Create 'primitiveColors' store
    if (!db.objectStoreNames.contains("primitiveColors")) {
        const store = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("primitiveName", "primitiveName", { unique: false });
        store.createIndex("primitiveValue", "primitiveValue", { unique: false });
        store.createIndex("orderIndex", "orderIndex", { unique: false });
    }

    // Create 'semanticColors' store
    if (!db.objectStoreNames.contains("semanticColors")) {
        const store = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("semanticName", "semanticName", { unique: false });
        store.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
        store.createIndex("themeMode", "themeMode", { unique: false });
        store.createIndex("orderIndex", "orderIndex", { unique: false });
    }

    // Create 'fonts' store
    if (!db.objectStoreNames.contains("fonts")) {
        const store = db.createObjectStore("fonts", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("fontTag", "fontTag", { unique: false });
        store.createIndex("shortFontTag", "shortFontTag", { unique: false });
        store.createIndex("fontName", "fontName", { unique: false });
        store.createIndex("orderIndex", "orderIndex", { unique: false });
    }

    // Create 'translations' store
    if (!db.objectStoreNames.contains("translations")) {
        const store = db.createObjectStore("translations", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
        store.createIndex("translationData", "translationData", { unique: false });
    }
  }


  // Check if a project exists in the 'projects' store (using callback)
  isProjectAvailable(projectName, callback) {
      if (!this.isDBOpenSuccess || !this.db) {
          const error = "Database is not initialized";
          this.log(error, true);
          return callback(error, false);
      }

      const transaction = this.db.transaction("projects", "readonly");
      const store = transaction.objectStore("projects");
      const request = store.get(projectName);

      request.onsuccess = () => {
          const exists = request.result !== undefined;
          callback(null, exists);
      };

      request.onerror = () => {
          const error = "Error checking project availability.";
          this.log(error, true);
          callback(error, false);
      };
  }

  // Get all projects (using callback)
  getAllProjects(callback) {
      if (!this.isDBOpenSuccess || !this.db) {
          const error = "Database is not initialized";
          this.log(error, true);
          return callback(error, null);
      }

      const transaction = this.db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const request = store.getAll();

      request.onsuccess = () => {
          const result = request.result.length > 0 ? request.result : [];
          callback(null, result);
      };

      request.onerror = (event) => {
          const error = "Error getting projects: " + event.target.error;
          this.log(error, true);
          callback(error, null);
      };
  }

  // Get translation data for a project (using callback)
  getTranslationData(projectName, callback) {
      if (!this.isDBOpenSuccess || !this.db) {
          const error = "Database is not initialized";
          this.log(error, true);
          return callback(error, null);
      }

      const transaction = this.db.transaction(["translations"], "readonly");
      const store = transaction.objectStore("translations");
      const index = store.index("projectName");
      const getRequest = index.get(projectName);

      getRequest.onsuccess = function() {
          if (getRequest.result) {
              const translationData = getRequest.result.translationData;
              callback(null, translationData);
              console.log(JSON.stringify(translationData, null, 2));
          } else {
              const error = "No translation found for project " + projectName;
              this.log(error, true);
              callback(error, null);
          }
      };

      getRequest.onerror = function() {
          const error = "Error retrieving translation";
          this.log(error, true);
          callback(error, null);
      };
  }

  // Check if translation data exists for a project (using callback)
  isTranslationDataAvailable(projectName, callback) {
      if (!this.isDBOpenSuccess || !this.db) {
          const error = "Database is not initialized";
          this.log(error, true);
          return callback(error, false);
      }

      const transaction = this.db.transaction(["translations"], "readonly");
      const store = transaction.objectStore("translations");
      const index = store.index("projectName");
      const getRequest = index.get(projectName);

      getRequest.onsuccess = function() {
          const exists = !!getRequest.result;
          callback(null, exists);
      };

      getRequest.onerror = function() {
          const error = "Error checking translation data";
          this.log(error, true);
          callback(error, false);
      };
  }
}

export default ThMLT_DB;
