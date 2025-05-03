import DatabaseModel from "./DatabaseModel.js";

class PrimitiveColorModel extends DatabaseModel {
  constructor() {
    super(); // Uses the parent constructor to initialize Dexie DB
    this.table = this.db.primitiveColors; // Directly accessing the "primitiveColors" store
  }

  // Create a new primitive color
  async create({ projectId, primitiveName, primitiveValue, orderIndex } = {}) {
  
    if (!projectId) this.log("projectId is required", true);
    
  
    const newPrimitiveColorData = {
      projectId,
      primitiveName,
      primitiveValue,
      orderIndex,
      lastModified: Date.now(),
      deleted: 0,
      deletedAt: 0
    };
  
    try {
      await this.table.add(newPrimitiveColorData);
      this.log("[SUCCESS] Primitive color added");
      return "success";
    } catch (error) {
      this.log("[ERROR] Primitive color adding failed", true);
      throw new Error("Primitive Color adding failed");
    }
  }
  

  // Read (get by ID)
  async get(id) {
    try {
      return await this.table.get(id);
    } catch (err) {
      this.log(`[ERROR] Failed to get primitive color: ${err}`, true);
      throw err;
    }
  }

  // Read all by projectId (non-deleted)
  async getAllByProject(projectId) {
    try {
      return await this.table
        .where("[projectId+deleted]")
        .equals([projectId, 0])
        .sortBy("orderIndex");
    } catch (err) {
      this.log(`[ERROR] Failed to get primitive colors by project: ${err}`, true);
      throw err;
    }
  }

  // Update
  async update(id, updatedFields) {
    try {
      const count = await this.table.update(id, {
        ...updatedFields,
        lastModified: Date.now()
      });
      if (count === 0) throw new Error("No record updated.");
      this.log(`[UPDATE] Updated primitive color with ID: ${id}`);
    } catch (err) {
      this.log(`[ERROR] Failed to update primitive color ${err}`, true);
      throw err;
    }
  }

  // Soft Delete
  async delete(id) {
    try {
      await this.table.update(id, {
        deleted: 1,
        deletedAt: Date.now()
      });
      this.log(`[DELETE] Soft-deleted primitive color ID: ${id}`);
      return "success";
    } catch (err) {
      this.log(`[ERROR] Failed to soft-delete primitive color ${err}`, true);
    }
  }

}

export default PrimitiveColorModel;
