class ThMLT_DB {
    constructor() {
      this.db = null;
      this.debug = true;
  
      // Initialize DB and store the Promise
      this.ready = new Promise((resolve, reject) => {
        this.log("Initializing database...");
        const request = indexedDB.open("ThMLT DB", 1);
  
        request.onupgradeneeded = (event) => {
          this.db = event.target.result;
          this.createStores();
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
  
    createStores() {
      const db = this.db;
      if (!db) return;
  
      if (!db.objectStoreNames.contains("projects")) {
        const store = db.createObjectStore("projects", { keyPath: "projectName" });
        store.createIndex("projectName", "projectName", { unique: true });
        store.createIndex("author", "author", { unique: false });
        store.createIndex("version", "version", { unique: false });
        store.createIndex("defaultThemeMode", "defaultThemeMode", { unique: false });
      }
  
      if (!db.objectStoreNames.contains("primitiveColors")) {
        const store = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("primitiveName", "primitiveName", { unique: false });
        store.createIndex("primitiveValue", "primitiveValue", { unique: false });
        store.createIndex("orderIndex", "orderIndex", { unique: false });
      }
  
      if (!db.objectStoreNames.contains("semanticColors")) {
        const store = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("semanticName", "semanticName", { unique: false });
        store.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
        store.createIndex("themeMode", "themeMode", { unique: false });
        store.createIndex("orderIndex", "orderIndex", { unique: false });
      }
  
      if (!db.objectStoreNames.contains("fonts")) {
        const store = db.createObjectStore("fonts", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("fontTag", "fontTag", { unique: false });
        store.createIndex("shortFontTag", "shortFontTag", { unique: false });
        store.createIndex("fontName", "fontName", { unique: false });
        store.createIndex("orderIndex", "orderIndex", { unique: false });
      }
  
      if (!db.objectStoreNames.contains("translations")) {
        const store = db.createObjectStore("translations", { keyPath: "id", autoIncrement: true });
        store.createIndex("projectName", "projectName", { unique: false });
        store.createIndex("defaultLanguage", "defaultLanguage", { unique: false });
        store.createIndex("translationData", "translationData", { unique: false });
      }
    }
  
    async isProjectAvailable(projectName, callback) {
      try {
        await this.ready;
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
      } catch (error) {
        this.log(error, true);
        callback(error, false);
      }
    }
  
    async getAllProjects(callback) {
      try {
        await this.ready;
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
      } catch (error) {
        this.log(error, true);
        callback(error, null);
      }
    }
  
    async getTranslationData(projectName, callback) {
      try {
        await this.ready;
        const transaction = this.db.transaction(["translations"], "readonly");
        const store = transaction.objectStore("translations");
        const index = store.index("projectName");
        const getRequest = index.get(projectName);
  
        getRequest.onsuccess = () => {
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
  
        getRequest.onerror = () => {
          const error = "Error retrieving translation";
          this.log(error, true);
          callback(error, null);
        };
      } catch (error) {
        this.log(error, true);
        callback(error, null);
      }
    }
  
    async isTranslationDataAvailable(projectName, callback) {
      try {
        await this.ready;
        const transaction = this.db.transaction(["translations"], "readonly");
        const store = transaction.objectStore("translations");
        const index = store.index("projectName");
        const getRequest = index.get(projectName);
  
        getRequest.onsuccess = () => {
          const exists = !!getRequest.result;
          callback(null, exists);
        };
  
        getRequest.onerror = () => {
          const error = "Error checking translation data";
          this.log(error, true);
          callback(error, false);
        };
      } catch (error) {
        this.log(error, true);
        callback(error, false);
      }
    }
  
    async getAllFonts(projectName, callback) {
      try {
        await this.ready;
        const transaction = this.db.transaction(["fonts"], "readonly");
        const store = transaction.objectStore("fonts");
        const index = store.index("projectName");
        const request = index.getAll(IDBKeyRange.only(projectName));
  
        request.onsuccess = () => {
          const result = request.result;
          const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);
          callback(null, sortedData);
        };
  
        request.onerror = () => {
          const error = "Error retrieving fonts";
          this.log(error, true);
          callback(error, false);
        };
      } catch (error) {
        this.log(error, true);
        callback(error, false);
      }
    }
  
    async getColorDataForAI2(projectName, callback) {
      try {
        await this.ready;
        const transaction = this.db.transaction(["projects", "semanticColors", "primitiveColors"], "readonly");
        const projectsStore = transaction.objectStore("projects");
        const semanticStore = transaction.objectStore("semanticColors");
        const primitiveStore = transaction.objectStore("primitiveColors");
  
        const projectRequest = projectsStore.get(projectName);
  
        projectRequest.onsuccess = (event) => {
          const project = event.target.result;
          if (!project) {
            callback("Project not found.", false);
            return;
          }
  
          const defaultThemeMode = project.defaultThemeMode;
  
          const semanticIndex = semanticStore.index("projectName");
          const semanticRequest = semanticIndex.getAll(projectName);
  
          semanticRequest.onsuccess = (event) => {
            const semanticColors = event.target.result.filter(sc => sc.themeMode === defaultThemeMode);
  
            const primitiveIndex = primitiveStore.index("projectName");
            const primitiveRequest = primitiveIndex.getAll(projectName);
  
            primitiveRequest.onsuccess = (event) => {
              const primitives = event.target.result;
              const primitiveMap = new Map(primitives.map(p => [p.primitiveName, p.primitiveValue]));
  
              const result = {};
              semanticColors.forEach(sc => {
                result[sc.semanticName] = primitiveMap.get(sc.linkedPrimitive) || sc.linkedPrimitive;
              });
              callback(null, result, defaultThemeMode);
            };
  
            primitiveRequest.onerror = () => callback("Failed to fetch primitive colors.", false);
          };
  
          semanticRequest.onerror = () => callback("Failed to fetch semantic colors.", false);
        };
  
        projectRequest.onerror = () => callback("Failed to fetch project details.", false);
      } catch (error) {
        this.log(error, true);
        callback(error, false);
      }
    }
  }
  
  export default ThMLT_DB;
  