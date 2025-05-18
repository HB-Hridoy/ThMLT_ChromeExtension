import BaseCache from './baseCache.js';

export default class PrimitiveCache extends BaseCache {
  constructor(){
    super();
    this.primitiveMap = new Map(); // Stores primitives by ID
    this.nameMap = new Map(); // Stores primitives by name
  }

  add(primitive) {
    const { primitiveName, primitiveValue, primitiveId } = primitive;

    primitiveId = Number(primitiveId);
    
    if (!this.primitiveMap.has(primitiveId)) {
      this.primitiveMap.set(primitiveId, primitive);
      this.nameMap.set(primitiveName, primitive);
      this.log(`Added primitive: ${primitiveName} with value: ${primitiveValue}`);
    }
  }

  addBulk(primitivesArray) {
    if (!Array.isArray(primitivesArray)) {
      this.log("addBulkPrimitives failed: input is not an array.", true);
      return;
    }

    // Clear the current Maps and add new ones
    this.primitiveMap.clear();
    this.nameMap.clear();

    primitivesArray.forEach(p => {
      this.primitiveMap.set(Number(p.primitiveId), p);
      this.nameMap.set(p.primitiveName, p);
    });

    this.log(`Replaced all primitives with new data (${this.primitiveMap.size})`);
  }

  getById(primitiveId) {
    primitiveId = Number(primitiveId);
    const primitive = this.primitiveMap.get(primitiveId);
  
    if (!primitive) {
      this.log(`Primitive with ID ${primitiveId} not found.`, true);
      return null;
    }
  
    return primitive;
  }
  

  getValue(primitiveId) {
    primitiveId = Number(primitiveId);
    const primitive = this.primitiveMap.get(primitiveId);

    if (!primitive) {
      this.log(`Primitive with ID ${primitiveId} not found.`, true);
      return null;
    }

    return primitive.primitiveValue;
  }

  getName(primitiveId) {

    primitiveId = Number(primitiveId);
    const primitive = this.primitiveMap.get(primitiveId);

    if (!primitive) {
      this.log(`Primitive with ID ${primitiveId} not found.`, true);
      return null;
    }

    return primitive.primitiveName;
  }

  getValueByName(primitiveName) {
    const primitive = this.nameMap.get(primitiveName);

    if (!primitive) {
      this.log(`Primitive with name "${primitiveName}" not found.`, true);
      return null;
    }

    return primitive.primitiveValue;
  }

  getAll() {
    return Array.from(this.primitiveMap.values()); // Return an array of all primitives
  }

  getAllNames() {
    return Array.from(this.nameMap.keys()); // Return an array of all primitive names
  }

  isExist(primitiveName) {
    return this.nameMap.has(primitiveName);
  }

  rename(primitiveId, newPrimitiveName) {
    primitiveId = Number(primitiveId);
    const primitive = this.primitiveMap.get(primitiveId);
    if (primitive) {
      const oldPrimitiveName = primitive.primitiveName;
      primitive.primitiveName = newPrimitiveName;
      primitive.lastModified = Date.now();
      
      // Update the nameMap with the new primitive name
      this.nameMap.delete(oldPrimitiveName);
      this.nameMap.set(newPrimitiveName, primitive);

      this.log(`Renamed primitive: ${oldPrimitiveName} → ${newPrimitiveName}`);
    }
  }

  update(primitiveId, updatedFields) {
    primitiveId = Number(primitiveId);
    const primitive = this.primitiveMap.get(primitiveId);
    if (!primitive) return this.log("Primitive not found for updating");

    // Update the fields dynamically based on the updatedFields object
    const { primitiveName, primitiveValue } = updatedFields;

    if (primitiveName && primitiveName !== this.SKIP) {
      this.nameMap.delete(primitive.primitiveName); // Remove old name from nameMap
      primitive.primitiveName = primitiveName;
      this.nameMap.set(primitiveName, primitive); // Add new name to nameMap
    }

    if (primitiveValue && primitiveValue !== this.SKIP) {
      primitive.primitiveValue = primitiveValue;
    }

    // Update the lastModified field
    primitive.lastModified = Date.now();
    
    // Log the update
    this.log(`Updated primitive: ${primitive.primitiveName}`);
  }

  delete(primitiveId) {
    primitiveId = Number(primitiveId);
    const primitive = this.primitiveMap.get(primitiveId);
    if (primitive) {
      this.primitiveMap.delete(primitiveId); // Remove by ID
      this.nameMap.delete(primitive.primitiveName); // Remove by name
  
      this.log(`Deleted primitive: ${primitive.primitiveName}`);
    }
  }

  deleteByName(primitiveName) {
    const primitive = this.nameMap.get(primitiveName);
    if (primitive) {
      this.primitiveMap.delete(primitive.primitiveId); // Remove by ID
      this.nameMap.delete(primitiveName); // Remove by name
  
      this.log(`Deleted primitive: ${primitiveName}`);
    }
  }

  clear(){
    this.primitiveMap.clear();
    this.nameMap.clear();
    this.log("Cleared all primitives");
  }
}
