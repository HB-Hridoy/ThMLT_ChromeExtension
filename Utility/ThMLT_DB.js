import SessionCache, { CACHE_KEYS } from '/Utility/cache.js';

class ThMLT_DB {
  constructor(dbName, dbVersion) {
      this.db = null;
      this.isDBOpenSuccess = false;

      // Open the IndexedDB
      const request = indexedDB.open(dbName, dbVersion);

      request.onupgradeneeded = (event) => {
          this.db = event.target.result;
          this.createStores();
      };

      request.onsuccess = (event) => {
          this.db = event.target.result;
          this.isDBOpenSuccess = true;
          console.log("Database opened successfully!");
      };

      request.onerror = (event) => {
          console.error("Database error:", event.target.errorCode);
      };

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

  // Check if a project exists in the 'projects' store
  isProjectAvailable(projectName) {
    return new Promise((resolve, reject) => {
        if (!this.isDBOpenSuccess || !this.db) {
            const error = "Database is not initialized";
            console.error(error);
            return reject(error);
          }

        const transaction = this.db.transaction("projects", "readonly");
        const store = transaction.objectStore("projects");
        const request = store.get(projectName);

        request.onsuccess = () => {
            resolve(request.result !== undefined);
        };

        request.onerror = () => {
            reject("Error checking project availability.");
        };
    });
  }

  getAllProjects() {
    return new Promise((resolve, reject) => {
      if (!this.isDBOpenSuccess || !this.db) {
        const error = "Database is not initialized";
        console.error(error);
        return reject(error);
      }
      const transaction = this.db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const request = store.getAll();
    
      request.onsuccess = () => {
        let result = request.result;
        if (result.length > 0) {
          const projectNames = result.map(project => project.projectName);
          SessionCache.set(CACHE_KEYS.PROJECTS, projectNames);
          console.log("All projects:", projectNames);
          resolve(projectNames);
        }
      };
    
      request.onerror = (event) => {
        const error = "Error getting projects: " + event.target.error;
        console.error(error);
        reject(error);
      };
    });
  }
}

// Export the class so other files can use it
export default ThMLT_DB;