import Dexie from 'dexie';
// import ThMLT_DB_Schema from './schema.js';

class ThMLTDatabase extends Dexie {
  constructor() {
    super('ThMLTDatabase');

    this.projects = null;
    this.primitiveColors = null;
    this.semanticColors = null;
    this.fonts = null;
    this.translations = null;
  }
}

class DatabaseManager {
  constructor() {
    this.db = null;
    this.initialized = false;
    this.initPromise = null;
  }

  async initialize() {
    // Return existing initialization promise if already in progress
    if (this.initPromise) {
      return this.initPromise;
    }

    // Return immediately if already initialized
    if (this.initialized) {
      return this;
    }

    // Create and cache the initialization promise
    this.initPromise = this._performInitialization();
    return this.initPromise;
  }

  async _performInitialization() {
    try {
      // Create database instance
      this.db = new ThMLTDatabase();
      
      // Open database (Dexie handles the connection automatically)
      await this.db.open();

      // Assign table references on the db instance
      this.db.projects = this.db.table('projects');
      this.db.primitiveColors = this.db.table('primitiveColors');
      this.db.semanticColors = this.db.table('semanticColors');
      this.db.fonts = this.db.table('fonts');
      this.db.translations = this.db.table('translations');
            
      this.initialized = true;
      console.log('DatabaseManager initialized successfully');
      return this;
    } catch (error) {
      console.error('Error initializing DatabaseManager:', error);
      // Reset state on failure to allow retry
      this.initPromise = null;
      this.initialized = false;
      this.db = null;
      throw error;
    }
  }

  // Convenience getters for tables (lazy access)
  get projects() {
    return this.db?.projects;
  }

  get primitiveColors() {
    return this.db?.primitiveColors;
  }

  get semanticColors() {
    return this.db?.semanticColors;
  }

  get fonts() {
    return this.db?.fonts;
  }

  get translations() {
    return this.db?.translations;
  }

  // Method to ensure database is ready before operations
  async ensureReady() {
    if (!this.initialized) {
      await this.initialize();
    }
    return this;
  }

  // Optional: Method to close database
  close() {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initialized = false;
      this.initPromise = null;
    }
  }
}

// =============================================================================
//  SINGLETON DATABASE MANAGER
// =============================================================================

let managerInstance = null;

export async function getServiceWorkerDBManager() {
  if (!managerInstance) {
    managerInstance = new DatabaseManager();
  }
  
  // Always ensure it's initialized before returning
  await managerInstance.initialize();
  return managerInstance;
}

// Export a synchronous getter for when you know the DB is already initialized
export function getDBManagerSync() {
  if (!managerInstance || !managerInstance.initialized) {
    throw new Error('Database manager not initialized. Call getServiceWorkerDBManager() first.');
  }
  return managerInstance;
}