
import DatabaseModel from "./DatabaseModel.js";

class SemanticColorModel extends DatabaseModel{
  constructor(){
    super();
    this.log("[INFO] SemanticColorModel initialized");
  }

  async create({projectId, semanticName, linkedPrimitive, themeMode, orderIndex}={}){

    if (!projectId) this.log("projectId is required", true);

    await this.ready;

    return new Promise((resolve, reject) => {
      
      const transaction = this.db.transaction(["semanticColors"], "readwrite");
      const store = transaction.objectStore("semanticColors");

      // Add new semantic color
      const addRequest = store.add({
          projectId,
          semanticName,
          linkedPrimitive,
          themeMode,
          orderIndex: orderIndex ?? 0,
          deleted: false,
          deletedAt: null  // Default to 0 if not provided
      });

      addRequest.onsuccess = function () {
          this.log(`[SUCCESS] Added semantic color: ${semanticName}`, true);
          resolve(`Added semantic color: ${semanticName}`);
      };

      addRequest.onerror = function (event) {
          reject(`Failed to add semantic color: ${event.target.error}`);
      };
    });
  }

  async get({
    projectId, 
    semanticName
  } = {}) {
  
    if (!projectId || !semanticName) {
      this.log("[ERROR] projectId and semanticName are required.", true);
      return Promise.reject("projectId and semanticName are required.");
    }
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["semanticColors"], "readonly");
      const store = transaction.objectStore("semanticColors");
      const index = store.index("projectId_primitiveName");  // Ensure you're using the correct index
      const request = index.get([projectId, semanticName]);
  
      request.onsuccess = (event) => {
        const semanticRecord = event.target.result;
  
        if (!semanticRecord || semanticRecord.deleted) {
          this.log(`[ERROR] Semantic color '${semanticName}' for project '${projectId}' is either not found or has been deleted.`, true);
          return reject(`Semantic color '${semanticName}' for project '${projectId}' is either not found or has been deleted.`);
        }
  
        resolve(semanticRecord); // Successfully retrieved the record
      };
  
      request.onerror = () => {
        this.log(`[ERROR] Failed to fetch semantic color '${semanticName}' for project '${projectId}'.`, true);
        reject(`Failed to fetch semantic color '${semanticName}' for project '${projectId}'.`);
      };
    });
  }
  
  async getAll({ projectId } = {}) {
    if (!projectId) {
      this.log("[ERROR] projectId is required.", true);
      return Promise.reject("projectId is required.");
    }
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["semanticColors"], "readonly");
      const store = transaction.objectStore("semanticColors");
      const index = store.index("projectId");  // Use the correct index for projectId
      const request = index.getAll(projectId);
  
      request.onsuccess = () => {
        this.log("[SUCCESS] Got all semantic colors for the project.");
  
        let result = request.result;
  
        // Sort the array by orderIndex
        const sortedData = result.sort((a, b) => a.orderIndex - b.orderIndex);
  
        // Filter out deleted entries
        const filteredData = sortedData.filter(item => !item.deleted);
  
        // Resolve the filtered and sorted data
        resolve(filteredData);
      };
  
      request.onerror = () => {
        this.log("[ERROR] Failed to get all semantic colors.", true);
        reject("Failed to get all semantic colors.");
      };
    });
  }
  
  async update({
    projectId, 
    semanticName, 
    newSemanticName = this.SKIP, 
    themeMode, 
    newLinkedPrimitive = this.SKIP, 
    newOrderIndex = this.SKIP
  } = {}) {
  
    if (!projectId || !semanticName) {
      this.log("[ERROR] projectId and semanticName are required.", true);
      return Promise.reject("projectId and semanticName are required.");
    }
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["semanticColors"], "readwrite");
      const store = transaction.objectStore("semanticColors");
      const index = store.index("projectId_primitiveName");  // Ensure you have the appropriate index
      const request = index.get([projectId, semanticName]);
  
      request.onsuccess = (event) => {
        const semanticToUpdate = event.target.result;
  
        if (!semanticToUpdate || semanticToUpdate.deleted) {
          this.log(`[ERROR] Semantic color '${semanticName}' not found or has been soft-deleted.`, true);
          return reject(`Semantic color '${semanticName}' not found or has been soft-deleted.`);
        }
  
        // Merge in only the fields that should be updated
        const sanitizedUpdates = this.sanitizeForUpdate({
          projectId, 
          semanticName, 
          newSemanticName, 
          themeMode, 
          newLinkedPrimitive, 
          newOrderIndex
        });
        
        const updatedRecord = { ...semanticToUpdate, ...sanitizedUpdates };
  
        const updateRequest = store.put(updatedRecord);
  
        updateRequest.onsuccess = () => {
          this.log(`[SUCCESS] Updated semantic color: ${semanticName}`, true);
          resolve(`Updated semantic color: ${semanticName}`);
        };
  
        updateRequest.onerror = () => {
          this.log(`[ERROR] Failed to update semantic color.`, true);
          reject("Failed to update semantic color.");
        };
      };
  
      request.onerror = () => {
        this.log(`[ERROR] Failed to fetch semantic color '${semanticName}' for project '${projectId}'.`, true);
        reject(`Failed to fetch semantic color '${semanticName}' for project '${projectId}'.`);
      };
    });
  }
  
  async delete({
    projectId, 
    semanticName
  } = {}) {
  
    if (!projectId || !semanticName) {
      this.log("[ERROR] projectId and semanticName are required.", true);
      return Promise.reject("projectId and semanticName are required.");
    }
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["semanticColors"], "readwrite");
      const store = transaction.objectStore("semanticColors");
      const index = store.index("projectId_primitiveName"); // Ensure you're using the correct index
      const request = index.get([projectId, semanticName]);
  
      request.onsuccess = (event) => {
        const semanticToDelete = event.target.result;
  
        if (!semanticToDelete || semanticToDelete.deleted) {
          this.log(`[ERROR] Semantic color '${semanticName}' not found or already deleted.`, true);
          return reject(`Semantic color '${semanticName}' not found or already deleted.`);
        }
  
        // Mark the record as deleted (soft delete)
        const updatedRecord = { 
          ...semanticToDelete, 
          deleted: true,
          deletedAt: new Date().toISOString()  // Timestamp for when it was deleted
        };
  
        const updateRequest = store.put(updatedRecord);
  
        updateRequest.onsuccess = () => {
          this.log(`[SUCCESS] Soft deleted semantic color: ${semanticName}`, true);
          resolve(`Soft deleted semantic color: ${semanticName}`);
        };
  
        updateRequest.onerror = () => {
          this.log(`[ERROR] Failed to delete semantic color.`, true);
          reject("Failed to delete semantic color.");
        };
      };
  
      request.onerror = () => {
        this.log(`[ERROR] Failed to fetch semantic color '${semanticName}' for project '${projectId}'.`, true);
        reject(`Failed to fetch semantic color '${semanticName}' for project '${projectId}'.`);
      };
    });
  }
  
}

export default SemanticColorModel;