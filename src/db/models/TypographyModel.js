
import { BaseModel } from './BaseModel.js';
import cacheManager from '../../utils/cache/cacheManager.js';

export class TypographyModel extends BaseModel {
  constructor(databaseManager) {
    super('typography');
    this.dbm = databaseManager;
  }

  async create({ projectId, typographyName, linkedFont, fontSize, lineHeight, letterSpacing, orderIndex } = {}) {
    console.log("[INFO] Creating typography", { projectId, typographyName });
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    if (!typographyName) {
      throw new Error("Typography name is required");
    }

    const newTypography = {
                            projectId,
                            typographyName,
                            linkedFont,
                            fontSize,
                            lineHeight,
                            letterSpacing,
                            orderIndex,
                            createdAt: new Date(),
                            updatedAt: new Date()
                          };
    
    // Create the typography in the database
    const typographyId = await this.table.add(newTypography);

    newTypography.typographyId = typographyId;

    cacheManager.typography.add({
      data: newTypography
    });
    
    return typographyId;
  }
  
  async get({ typographyId } = {}) {
    console.log("[INFO] Getting typography", typographyId);
    
    if (!typographyId) {
      throw new Error("Typography ID is required");
    }
    
    typographyId = Number(typographyId);

    const typography = await this.table.get(typographyId);
      
    return typography || null;
  }
  
  async getAll({ projectId, doCache = false } = {}) {
    console.log("[INFO] Getting all typographys", { projectId });
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    const typographies = await this.table
      .where({ projectId })
      .sortBy('orderIndex');

    if (doCache) {
      cacheManager.typography.addBulk({
        dataArray: typographies
      });
    }
    
    return typographies;
  }
  
  async update({ typographyId, typographyName, linkedFont, fontSize, lineHeight, letterSpacing, orderIndex } = {}) {
  console.log("[INFO] Updating typography", typographyId);

  if (!typographyId) {
    throw new Error("Typography ID is required");
  }

  typographyId = Number(typographyId);

  const typography = await this.get({ typographyId });
  if (!typography) {
    throw new Error("Typography not found");
  }

  const updateObj = {
    updatedAt: new Date()
  };

  if (typographyName !== undefined) updateObj.typographyName = typographyName;
  if (linkedFont !== undefined) updateObj.linkedFont = linkedFont;
  if (fontSize !== undefined) updateObj.fontSize = fontSize;
  if (lineHeight !== undefined) updateObj.lineHeight = lineHeight;
  if (letterSpacing !== undefined) updateObj.letterSpacing = letterSpacing;
  if (orderIndex !== undefined) updateObj.orderIndex = orderIndex;

  await this.table.update(typographyId, updateObj);
  cacheManager.typography.update({ id: typographyId, updates: updateObj });

  return true;
}

  /**
   * Update order index of table
   * @param {Object} params - The parameters
   * @param {Array} params.updatedTypographyOrders - Updated primitive order as [{typographyId, orderIndex}]
   */
  async updateOrderIndexes({ projectId, updatedTypographyOrders }) {

    if (!projectId || !updatedTypographyOrders) {
      console.error("[DB] Both projectId and updatedTypographyOrders are required");
      return;
    }

    const primaryKey = this.table.schema.primKey.name;
  
    await this.db.transaction('rw', this.table, async () => {
      
      const projectRecords = await this.table
        .where('projectId')
        .equals(projectId)
        .toArray();
  
      const recordMap = new Map(projectRecords.map(record => [record[primaryKey], record]));
  
      const updatedRecords = updatedTypographyOrders.map(update => {
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
  
  /**
   * Delete a typography
   * @param {Object} params - The parameters
   * @param {number} params.typographyId - Typography color ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async delete({ typographyId } = {}) {
    console.log("[INFO] Deleting typography", { typographyId });
    
    if (!typographyId) {
      throw new Error("Typography ID is required");
    }

    
    typographyId = Number(typographyId);
    
    // Delete from the database
    await this.table.delete(typographyId);

    cacheManager.typography.delete({ id: typographyId });
    
    return true;
  }
}
