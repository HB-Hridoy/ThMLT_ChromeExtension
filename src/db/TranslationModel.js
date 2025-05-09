
import DatabaseModel  from "./DatabaseModel.js";

class TranslationModel extends DatabaseModel{
  constructor(){
    super();
    this.log("[INFO] TranslationModel initialized");
  }

  async create({projectId, translationJson}={}){
    if (!projectId) this.log("projectId is required", true);

    this.ready;

    return new Promise((resolve, reject) => {
      
      let transaction = this.db.transaction(["translations"], "readwrite");
      let store = transaction.objectStore("translations");
      let index = store.index("projectId");
      let getRequest = index.get(projectId);
      
      getRequest.onsuccess = function() {
        let existingData = getRequest.result;
        if (existingData) {
          // Update existing record
          existingData.defaultLanguage = translationJson.DefaultLanguage;
          existingData.translationData = translationJson;
          let updateRequest = store.put(existingData);
          
          updateRequest.onsuccess = function() {
            
              this.log(`[SUCCESS] Updated translation for project: ${projectId}`, true);
              resolve("Translation updated successfully");
          };
          
          updateRequest.onerror = function() {
            this.log("Error updating translation", updateRequest.error, true);
            reject("Error updating translation");
          };
        } else {
          // Add new record
          let data = {
            projectId: projectId,
            defaultLanguage: translationJson.DefaultLanguage,
            translationData: translationJson,
            deleted: false,
            deletedAt: null 
          };
          
          let addRequest = store.add(data);
          
          addRequest.onsuccess = function() {
            this.log(`[SUCCESS] Added translation for project: ${projectId}`, true);
            resolve("Translation added successfully");
          };
          
          addRequest.onerror = function() {
            console.error("Error adding translation", addRequest.error);
            reject("Error adding translation");
          };
        }
      }
    }); 

  }

  async getAll({projectId}={}){
    if (!projectId) this.log("projectId is required", true);

    this.ready;

    return new Promise((resolve, reject) => {
      
      let transaction = db.transaction(["translations"], "readonly");
      let store = transaction.objectStore("translations");
      let index = store.index("projectId");
      let getRequest = index.get(projectId);
      
      getRequest.onsuccess = function() {
        if (getRequest.result) {
          const translationData = getRequest.result.translationData;
          resolve(translationData);
        } else {
          this.log("No translation found for project", true);
          reject("No translation found for project");
        }
      };
      
      getRequest.onerror = function() {
        this.log("Error retrieving translation", getRequest.error, true);
        reject("Error retrieving translation");
      };
    }); 

  }

}

export default TranslationModel;