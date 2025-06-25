import ThMLT_DB_Schema from './schema.js';

class ThMLTDatabase extends window.Dexie {
  constructor() {
    super(ThMLT_DB_Schema.dbName);
    
    // Define schema
    this.version(ThMLT_DB_Schema.version).stores(ThMLT_DB_Schema.stores)
    .upgrade(tx => {
      
    });
    
    // Define table references
    this.projects = this.table('projects');
    this.primitiveColors = this.table('primitiveColors');
    this.semanticColors = this.table('semanticColors');
    this.fonts = this.table('fonts');
    this.translations = this.table('translations');
  }
}

// Singleton instance
let dbInstance = null;

export function getDatabase() {
  if (!dbInstance) {
    dbInstance = new ThMLTDatabase();
    
    // Open DB and handle success/error
    dbInstance.open()
      .then(() => {
        console.log('ThMLT Database initialized successfully');
      })
      .catch((error) => {
        console.error('Failed to open DB:', error);
      });

  }
  return dbInstance;
}


// Export singleton instance
export const db = getDatabase();

