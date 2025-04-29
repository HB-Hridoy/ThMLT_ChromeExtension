
import DatabaseModel from "./DatabaseModel.js";

class ProjectModel extends DatabaseModel{
  constructor() {
    super("projects");
  }

  async create({ projectName, author, version } = {}) {
    if (!projectId) this.log("projectId is required", true);
  
    try {
      await this.ready;  // Ensure the DB is ready
  
      const transaction = this.db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");
  
      // Check if the project already exists by projectName index
      const checkRequest = store.index("projectName").get(projectName);
  
      return new Promise((resolve, reject) => {
        checkRequest.onsuccess = () => {
          if (checkRequest.result) {
            return reject(this.log("Project already exists", true));
          }
  
          const projectData = { 
            projectId: crypto.randomUUID(),
            projectName, 
            author, 
            version,
            deleted: false,
            deletedAt: null
          };
  
          // Add the new project
          const addRequest = store.add(projectData);
  
          addRequest.onsuccess = () => resolve({status:"success", data: projectData});
          addRequest.onerror = (event) => reject(this.log(`Error adding project: ${event.target.error}`, true));
        };
  
        checkRequest.onerror = () => reject(this.log("[ERROR] Error checking for existing project"), true);
  
        // Handle transaction completion
        transaction.oncomplete = () => {
          this.log("[SUCCESS] Transaction completed successfully");
        };
  
        // Handle transaction errors
        transaction.onerror = (event) => {
          reject(this.log(`Transaction error: ${event.target.error}`, true));
        };
      });
    } catch (error) {
      this.log(error, true);
    }
  }
  
  async get({ projectId } = {}) {
    if (!projectId) this.log("projectId is required", true);
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(["projects"], "readonly").objectStore("projects");
  
      const request = store.get(projectId);
  
      request.onsuccess = () => {
        const result = request.result;
        if (!result || result.deleted) return resolve(null); // hide deleted entries
        resolve(result);
      };
  
      request.onerror = () => reject(this.log("Error getting project", true));
    });
  }
  
  async getAll() {
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["projects"], "readonly");
      const store = transaction.objectStore("projects");
      const request = store.getAll();
  
      request.onsuccess = () => {
        this.log("[SUCCESS] Got all projects!");
  
        // Filter out soft-deleted records
        const result = request.result.filter(project => !project.deleted);
  
        resolve(result);
      };
  
      request.onerror = (event) => {
        const error = "Error getting projects: " + event.target.error;
        this.log(error, true);
        reject(new Error(error));
      };
    });
  }  

  async update({
    projectId,
    projectName = this.SKIP,
    author = this.SKIP,
    version = this.SKIP
  } = {}) {
    if (!projectId) this.log("projectId is required", true);
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");
  
      const getRequest = store.get(projectId);
  
      getRequest.onsuccess = () => {
        const record = getRequest.result;
  
        if (!record) {
          return reject(this.log("Project not found", true));
        }
  
        // Merge in only the fields that should be updated
        const sanitizedUpdates = this.sanitizeForUpdate({ projectName, author, version });
        const updatedRecord = { ...record, ...sanitizedUpdates };

        const updateRequest = store.put(updatedRecord);

        updateRequest.onsuccess = () => {
          this.log(`[SUCCESS] Project ${projectId} updated`);
          resolve("Project updated successfully");
        };
  
        updateRequest.onerror = (event) => {
          const error = `Error updating project: ${event.target.error}`;
          this.log(error, true);
          reject();
        };
      };
  
      getRequest.onerror = () => {
        reject(this.log("Error retrieving project for update", true));
      };
    });
  }
  
  async delete({ projectId } = {}) {
    if (!projectId) this.log("projectId is required", true);
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["projects"], "readwrite");
      const store = transaction.objectStore("projects");
  
      const getRequest = store.get(projectId);
  
      getRequest.onsuccess = () => {
        const record = getRequest.result;
  
        if (!record) return reject(new Error("Project not found"));
  
        record.deleted = true;
        record.deletedAt = new Date().toISOString(); // timestamp of deletion
  
        const updateRequest = store.put(record);
  
        updateRequest.onsuccess = () => resolve("Project soft-deleted");
        updateRequest.onerror = (event) =>
          reject(new Error(`Failed to soft delete project: ${event.target.error}`));
      };
  
      getRequest.onerror = () => reject(new Error("Error retrieving project for deletion"));
    });
  }
  
}

export default ProjectModel;