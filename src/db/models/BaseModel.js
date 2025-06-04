import { getDatabase } from '../instance.js';

export class BaseModel {
  constructor(tableName) {
    this.db = getDatabase();
    this.table = this.db.table(tableName);
    this.tableName = tableName;
  }

  // Generic CRUD operations
  async create(data) {
    try {
      const id = await this.table.add({
        ...data,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      });
      return await this.findById(id);
    } catch (error) {
      console.error(`Error creating ${this.tableName}:`, error);
      throw error;
    }
  }

  async findById(id) {
    try {
      return await this.table.get(id);
    } catch (error) {
      console.error(`Error finding ${this.tableName} by ID:`, error);
      throw error;
    }
  }

  async findAll() {
    try {
      return await this.table.toArray();
    } catch (error) {
      console.error(`Error finding all ${this.tableName}:`, error);
      throw error;
    }
  }

  async update(id, updates) {
    try {
      await this.table.update(id, {
        ...updates,
        lastModified: new Date().toISOString()
      });
      return await this.findById(id);
    } catch (error) {
      console.error(`Error updating ${this.tableName}:`, error);
      throw error;
    }
  }

  async delete(id) {
    try {
      return await this.table.delete(id);
    } catch (error) {
      console.error(`Error deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Soft delete for models that support it
  async softDelete(id) {
    try {
      return await this.update(id, {
        deleted: true,
        deletedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error(`Error soft deleting ${this.tableName}:`, error);
      throw error;
    }
  }

  // Find non-deleted items
  async findActive() {
    try {
      return await this.table
        .where('deleted')
        .notEqual(true)
        .toArray();
    } catch (error) {
      console.error(`Error finding active ${this.tableName}:`, error);
      throw error;
    }
  }

  // Bulk operations
  async bulkCreate(items) {
    try {
      const timestampedItems = items.map(item => ({
        ...item,
        createdAt: new Date().toISOString(),
        lastModified: new Date().toISOString()
      }));
      return await this.table.bulkAdd(timestampedItems);
    } catch (error) {
      console.error(`Error bulk creating ${this.tableName}:`, error);
      throw error;
    }
  }

  async bulkUpdate(updates) {
    try {
      const timestampedUpdates = updates.map(update => ({
        ...update,
        lastModified: new Date().toISOString()
      }));
      return await this.table.bulkPut(timestampedUpdates);
    } catch (error) {
      console.error(`Error bulk updating ${this.tableName}:`, error);
      throw error;
    }
  }

  // Transaction wrapper
  async transaction(callback) {
    try {
      return await this.db.transaction('rw', this.table, callback);
    } catch (error) {
      console.error(`Transaction error in ${this.tableName}:`, error);
      throw error;
    }
  }
}