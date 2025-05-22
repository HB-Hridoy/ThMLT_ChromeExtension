import cacheManager from "../utils/cache/cacheManager.js";
import DatabaseModel from "./DatabaseModel.js";

class PrimitiveColorModel extends DatabaseModel {
  constructor() {
    super();
    this.table = this.db.primitiveColors;
    this.log("[INFO] PrimitiveColorModel initialized");
  }

  // Create a new primitive color
  async create({ projectId, primitiveName, primitiveValue, orderIndex } = {}) {
    if (!projectId || !primitiveName) {
      throw new Error("projectId and primitiveName are required");
    }

    const newEntry = {
      projectId,
      primitiveName,
      primitiveValue,
      orderIndex,
      lastModified: Date.now(),
    };

    try {
      const primitiveId = await this.table.add(newEntry);
      this.log(`[CREATE] PrimitiveColor added with ID ${primitiveId}`);

      newEntry.primitiveId = primitiveId;
      
      cacheManager.primitives.add(newEntry);
      return primitiveId;
    } catch (error) {
      this.log("[ERROR] Failed to add PrimitiveColor", true);
      throw error;
    }
  }

  // Read (get by ID)
  async get({ id } = {}) {
    if (!id) throw new Error("ID is required");
    id = Number(id);
    return await this.table.get(id);
  }

  // Read all by projectId
  async getAllByProject({projectId} = {}) {
    if (!projectId) throw new Error("projectId is required");

    const primitivesArray =  await this.table
                                          .where("projectId")
                                          .equals(projectId)
                                          .sortBy("orderIndex");
    cacheManager.primitives.addBulk(primitivesArray);

    return primitivesArray;

    
  }

  async update({ id, updatedFields } = {}) {
    if (!id || typeof updatedFields !== "object") {
      throw new Error("Both id and updatedFields are required.");
    }

    id = Number(id);

    try {
      const updatedCount = await this.table.update(id, {
        ...updatedFields,
        lastModified: Date.now()
      });

      if (updatedCount === 0) {
        this.log(`[WARN] No primitive color found with ID: ${id}`, true);
      } else {
        cacheManager.primitives.update(id, updatedFields);
        this.log(`[SUCCESS] Updated primitive color with ID: ${id}`);
      }

      return updatedCount;
    } catch (error) {
      this.log(`[ERROR] Failed to update primitive color with ID: ${id}`, true);
      throw error;
    }
  }

  async updateOrderIndexes({ projectId, updatedPrimitiveOrders }) {
    if (!projectId || !updatedPrimitiveOrders) {
      console.error("[DB] Both projectId and updatedPrimitiveOrders are required");
      return;
    }
  
    const primaryKey = this.table.schema.primKey.name;
  
    await this.db.transaction('rw', this.table, async () => {
      
      const projectRecords = await this.table
        .where('projectId')
        .equals(projectId)
        .toArray();
  
      const recordMap = new Map(projectRecords.map(record => [record[primaryKey], record]));
  
      const updatedRecords = updatedPrimitiveOrders.map(update => {
        const existing = recordMap.get(update[primaryKey]);
        if (!existing) return null;
  
        return {
          ...existing,
          orderIndex: update.orderIndex
        };
      }).filter(Boolean); // remove nulls
  
      await this.table.bulkPut(updatedRecords);
    });
  }
  

  // Delete (hard delete)
  async delete({ id }) {
    if (!id) throw new Error("ID is required for deletion");

    id = Number(id);

    try {
      await this.table.delete(id);
      this.log(`[DELETE] PrimitiveColor with ID ${id} deleted`);
      cacheManager.primitives.delete(id);
      return true;
    } catch (error) {
      this.log("[ERROR] Failed to delete PrimitiveColor", true);
      throw error;
    }
  }
}

export default PrimitiveColorModel;
