
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

  get(){

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

  update(){

  }

  delete(){

  }
}