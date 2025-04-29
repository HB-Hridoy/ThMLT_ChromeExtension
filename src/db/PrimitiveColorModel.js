
import DatabaseModel from "./DatabaseModel.js";

class PrimitiveColorModel extends DatabaseModel {
  constructor() {
    super("primitiveColors");
  }

  async create({projectId, primitiveName, primitiveValue, orderIndex} = {}){
    if (!projectId) this.log("projectId is required", true);

    await this.ready;

    return new Promise((resolve, reject) => {
            
      let transaction = this.db.transaction(["primitiveColors"], "readwrite");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

      let newColor = {
        projectId: projectId,
        primitiveName: primitiveName,
        primitiveValue: primitiveValue,
        orderIndex: orderIndex,
        deleted: false,
        deletedAt: null
      };

      let primitiveColorStoreRequest = primitiveColorsStore.add(newColor);

      primitiveColorStoreRequest.onsuccess = (e) => {
        CacheOperations.addPrimitive(primitiveName, primitiveValue);
        resolve("Primitive color added");

        this.log("[SUCCESS] Primitive color added");
        
      }

      primitiveColorStoreRequest.onerror = (e) => {
        reject("Primitive Color adding failed");

        this.log("[ERROR] Primitive color adding failed");
      }

      transaction.oncomplete = () =>{
        this.log("[SUCCESS] Transaction completed successfully");
      }

    });
  }

  async get({ projectId, primitiveName } = {}) {
    if (!projectId || !primitiveName) {
      this.log("[ERROR] projectId and primitiveName are required.", true);
      return Promise.reject("projectId and primitiveName are required.");
    }

    await this.ready;

    return new Promise((resolve, reject) => {
  
      const transaction = this.db.transaction(["primitiveColors"], "readonly");
      const store = transaction.objectStore("primitiveColors");
      const index = store.index("projectId_primitiveName");
      const request = index.get([projectId, primitiveName]);
  
      request.onsuccess = (event) => {
        const primitive = event.target.result;
  
        if (!primitive || primitive.deleted) {
          this.log(`[INFO] Primitive '${primitiveName}' not found or has been soft-deleted.`, true);
          return resolve(null); // Or reject depending on your design choice
        }
  
        resolve(primitive);
      };
  
      request.onerror = () => {
        this.log(`[ERROR] Failed to fetch primitive '${primitiveName}' for project '${projectId}'.`, true);
        reject("Failed to fetch primitive color.");
      };
    });
  }
  
  async getAll({projectId} = {}){
    if (!projectId) this.log("projectId is required", true);

    await this.ready;

    return new promise ((resolve, reject) =>{

      const transaction = this.db.transaction(["primitiveColors"], "readonly");
      const store = transaction.objectStore("primitiveColors");

      // Open the index on projectId
      const index = store.index("projectId");
        
      const request = index.getAll(projectId);

      request.onsuccess = () => {

        this.log("[SUCCESS] Got all primitive colors from project.");
        
        let result = request.result;
      
        // Sort the array by orderIndex
        const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);

        // Filter out deleted entries
        const filteredData = sortedData.filter(item => !item.deleted);
        resolve(filteredData);

      };

      request.onerror = (event) => {
        const error = "Error getting projects: " + event.target.error;
        this.log(error, true);
        reject(error);
      };
    })
  }

  async update({
    projectId, 
    primitiveName, 
    newPrimitiveName = this.SKIP, 
    newPrimitiveValue = this.SKIP, 
    newOrderIndex = this.SKIP
  } = {}) {
    if (!projectId) this.log("projectId is required", true);
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["primitiveColors"], "readwrite");
      const store = transaction.objectStore("primitiveColors");
      const index = store.index("projectId_primitiveName");
      const request = index.get([projectId, primitiveName]);
  
      request.onsuccess = (event) => {
        const primitiveToUpdate = event.target.result;
  
        if (!primitiveToUpdate) {
          this.log(`[ERROR] Primitive color '${primitiveName}' not found for project '${projectId}'.`, true);
          return reject(`Primitive color '${primitiveName}' not found for project '${projectId}'.`);
        }
  
        // Merge only fields that need update
        const sanitizedUpdates = this.sanitizeForUpdate({
          primitiveName: newPrimitiveName,
          primitiveValue: newPrimitiveValue,
          orderIndex: newOrderIndex
        });
  
        const updatedRecord = { ...primitiveToUpdate, ...sanitizedUpdates };
  
        const updateRequest = store.put(updatedRecord);
  
        updateRequest.onsuccess = () => {
          this.log(`[SUCCESS] Updated primitive color '${primitiveName}' successfully.`);
          resolve(`Updated primitive color '${primitiveName}' successfully.`);
        };
  
        updateRequest.onerror = () => {
          this.log(`[ERROR] Failed to update primitive color.`, true);
          reject("Failed to update primitive color.");
        };
      };
  
      request.onerror = () => {
        this.log(`[ERROR] Failed to fetch primitive color.`, true);
        reject("Failed to fetch primitive color.");
      };
    });
  }

  async delete({ projectId, primitiveName } = {}) {
    if (!projectId || !primitiveName) {
      this.log("[ERROR] Both projectId and primitiveName are required for deletion.", true);
      return Promise.reject("projectId and primitiveName are required.");
    }
  
    await this.ready;
    return new Promise((resolve, reject) => {
  
      const transaction = this.db.transaction(["primitiveColors"], "readwrite");
      const store = transaction.objectStore("primitiveColors");
      const index = store.index("projectId_primitiveName");
      const request = index.get([projectId, primitiveName]);
  
      request.onsuccess = (event) => {
        const primitive = event.target.result;
  
        if (!primitive) {
          this.log(`[ERROR] Primitive '${primitiveName}' not found for project '${projectId}'.`, true);
          return reject(`Primitive '${primitiveName}' not found for project '${projectId}'.`);
        }
  
        // Perform soft delete
        primitive.deleted = true;
        primitive.deletedAt = new Date().toISOString();
  
        const updateRequest = store.put(primitive);
  
        updateRequest.onsuccess = () => {
          this.log(`[INFO] Soft-deleted primitive '${primitiveName}' in project '${projectId}'.`);
          resolve(`Soft-deleted primitive '${primitiveName}' successfully.`);
        };
  
        updateRequest.onerror = () => {
          this.log(`[ERROR] Failed to soft-delete primitive '${primitiveName}'.`, true);
          reject("Failed to soft-delete primitive.");
        };
      };
  
      request.onerror = () => {
        this.log(`[ERROR] Failed to find primitive '${primitiveName}' for deletion.`, true);
        reject("Failed to fetch primitive.");
      };
    });
  }
  
}

export default PrimitiveColorModel;