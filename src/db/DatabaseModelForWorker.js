import Dexie from 'dexie';
import ThMLT_DB_Schema from './ThMLT_DB_Schema';


class DatabaseModelForWorker {
  static _sharedDB = null;

  static get sharedDB() {
    if (!this._sharedDB) {
      const db = new Dexie("ThMLT_DB");
      db.version(ThMLT_DB_Schema.version).stores(ThMLT_DB_Schema.stores);
      db.open().catch(err => console.error("Failed to open DB:", err));
      this._sharedDB = db;
    }
    return this._sharedDB;
  }
  
  constructor() {
    this.db = DatabaseModelForWorker.sharedDB;
  }
}

export default DatabaseModelForWorker;
