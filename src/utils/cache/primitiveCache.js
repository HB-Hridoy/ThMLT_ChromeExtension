
import BaseCache from './baseCache.js';


export default class PrimitiveCache extends BaseCache {
  constructor(){
    super();
    this.primitiveNames = [];
    this.primitives = [];
  }

  add(primitive) {
    const { primitiveName, primitiveValue } = primitive;
    
    if (!this.primitiveNames.includes(primitiveName)) {
      this.primitiveNames.push(primitiveName);
      this.primitives.push(primitive);
      this.log(`Added primitive: ${primitiveName} with value: ${primitiveValue}`);
    }
  }
  
  addBulk(primitivesArray) {
    if (!Array.isArray(primitivesArray)) {
      this.log("addBulkPrimitives failed: input is not an array.", true);
      return;
    }
  
    this.primitives = [...primitivesArray];
    this.primitiveNames = primitivesArray.map(p => p.primitiveName);
  
    this.log(`Replaced all primitives with new data (${this.primitives.length})`);
  }
  
  getValue(primitiveId) {
    const primitive = this.primitives.find(p => p.id === primitiveId);

    if (!primitive) {
      this.log(`Primitive with ID ${primitiveId} not found.`, true);
      return null;
    }

    return primitive.primitiveValue;
  }
  
  getValueByName(primitiveName) {
    const primitive = this.primitives.find(p => p.primitiveName === primitiveName);

    if (primitive) {
      this.log(`Primitive with name "${primitiveName}" not found.`, true);
      return null;
    }

    return primitive.primitiveValue;
  }
  
  getAl() {
    return [...this.primitives];
  }
  
  getAllNames() {
    return [...this.primitiveNames];
  }
  
  isExist(primitiveName) {
    return this.primitiveNames.includes(primitiveName);
  }
  
  rename(primitiveId, newPrimitiveName) {
    const index = this.primitives.findIndex(p => p.id === primitiveId);
    if (index !== -1) {
      const oldPrimitiveName = this.primitives[index].primitiveName;
      this.primitives[index].primitiveName = newPrimitiveName;
      this.primitives[index].lastModified = Date.now();
      
      // Update primitiveNames array as well
      const nameIndex = this.primitiveNames.indexOf(oldPrimitiveName);
      if (nameIndex !== -1) {
        this.primitiveNames[nameIndex] = newPrimitiveName;
      }
  
      this.log(`Renamed primitive: ${oldPrimitiveName} → ${newPrimitiveName}`);
    }
  }
  
  update(primitiveId, updatedFields) {
    
    const index = this.primitives.findIndex(p => p.id === primitiveId);
    if (index === -1) return this.log("Primitive not found for updating");
  
    // Update the fields dynamically based on the updatedFields object
    const { primitiveName, primitiveValue } = updatedFields;
  
    if (primitiveName && primitiveName !== this.SKIP) {
      this.primitives[index].primitiveName = primitiveName;
    }
  
    if (primitiveValue && primitiveValue !== this.SKIP) {
      this.primitives[index].primitiveValue = primitiveValue;
    }
  
    // Update the lastModified field
    this.primitives[index].lastModified = Date.now();
    
    // Log the update
    this.log(`Updated primitive: ${this.primitives[index].primitiveName}`);
  }
  
  
  delete(primitiveId) {
    const index = this.primitives.findIndex(p => p.id === primitiveId);
    if (index !== -1) {
      const primitiveName = this.primitives[index].primitiveName;
      this.primitives.splice(index, 1); // Remove the primitive by index
      this.primitiveNames = this.primitiveNames.filter(name => name !== primitiveName);
  
      this.log(`Deleted primitive: ${primitiveName}`);
    }
  }
  
  deleteByName(primitiveName) {
    const index = this.primitives.findIndex(p => p.primitiveName === primitiveName);
    if (index !== -1) {
      this.primitives.splice(index, 1); // Remove the primitive by index
      this.primitiveNames = this.primitiveNames.filter(name => name !== primitiveName);
  
      this.log(`Deleted primitive: ${primitiveName}`);
    }
  }

  clear(){
    this.primitiveNames = [];
    this.primitives = [];
    this.log("Cleared all primitives");
  }
}