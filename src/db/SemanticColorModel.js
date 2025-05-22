
import DatabaseModel from "./DatabaseModel.js";
import { semanticTable } from "../utils/semanticTable.js";
import  cacheManager from "../utils/cache/cacheManager.js";
import DatabaseManager from "./DatabaseManager.js";

class SemanticColorModel extends DatabaseModel {
  constructor() {
    super();
    console.log("[INFO] SemanticColorModel initialized");
    this.SKIP = Symbol('SKIP');
    this.table = this.db.semanticColors;
  }

  /**
   * Create a new semantic color
   * @param {Object} params - The parameters
   * @param {string} params.projectId - Project ID
   * @param {string} params.semanticName - Semantic color name
   * @param {Object} [params.themeValues={}] - Theme values
   * @param {number} [params.orderIndex] - Order index
   * @returns {Promise<number>} - The ID of the created semantic color
   */
  async create({ projectId, semanticName, orderIndex } = {}) {
    console.log("[INFO] Creating semantic color", { projectId, semanticName });
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    if (!semanticName) {
      throw new Error("Semantic name is required");
    }
    
    // Get all themes from cache manager
    const themes = cacheManager.semantics.theme().getAll();
    
    // Initialize themeValues with default values for all themes
    const completeThemeValues = {};
    
    // Add default values for themes not provided
    for (const theme of themes) {
      completeThemeValues[theme] = semanticTable.defaultValue;
    }
    
    // Create the semantic color in the database
    const semanticId = await this.table.add({
      projectId,
      semanticName,
      themeValues: completeThemeValues,
      orderIndex,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    cacheManager.semantics.add({
      semanticId,
      semanticName,
      ...completeThemeValues
    });
    
    return semanticId;
  }
  
  /**
   * Get a semantic color by ID
   * @param {Object} params - The parameters
   * @param {number} params.semanticId - Semantic color ID
   * @returns {Promise<Object|null>} - The semantic color or null if not found
   */
  async get({ semanticId } = {}) {
    console.log("[INFO] Getting semantic color", semanticId);
    
    if (!semanticId) {
      throw new Error("Semantic ID is required");
    }
    semanticId = Number(semanticId);

    const semanticColor = await this.table.get(semanticId);
      
    return semanticColor || null;
  }
  
  /**
   * Get all semantic colors for a project
   * @param {Object} params - The parameters
   * @param {string} params.projectId - Project ID
   * @returns {Promise<Array>} - Array of semantic colors
   */
  async getAll({ projectId, doCache = false } = {}) {
    console.log("[INFO] Getting all semantic colors", { projectId });
    
    if (!projectId) {
      throw new Error("Project ID is required");
    }
    
    const semanticColors = await this.table
      .where({ projectId })
      .sortBy('orderIndex');

    if (doCache) {
      semanticColors.forEach(semantic => {
        cacheManager.semantics.add(semantic);
      });
    }
    
    return semanticColors;
  }
  
  /**
   * Update a semantic color
   * @param {Object} params - The parameters
   * @param {number} params.semanticId - Semantic color ID
   * @param {string} [params.newSemanticName=Symbol('SKIP')] - New semantic name
   * @param {number} [params.newOrderIndex=Symbol('SKIP')] - New order index
   * @returns {Promise<boolean>} - True if updated successfully
   */
  async update({
    semanticId,
    newSemanticName = this.SKIP,
    newOrderIndex = this.SKIP
  } = {}) {
    console.log("[INFO] Updating semantic color", semanticId);
    
    if (!semanticId) {
      throw new Error("Semantic ID is required");
    }
    semanticId = Number(semanticId);
    
    // Get the current semantic color
    const semanticColor = await this.get({ semanticId });
    
    if (!semanticColor) {
      throw new Error("Semantic color not found");
    }
    
    // Prepare the update object
    const updateObj = {
      updatedAt: new Date()
    };
    
    // Update semantic name if provided
    if (newSemanticName !== this.SKIP) {
      updateObj.semanticName = newSemanticName;
    }
    
    // Update order index if provided
    if (newOrderIndex !== this.SKIP) {
      updateObj.orderIndex = newOrderIndex;
    }
    
    // Update in the database
    await this.table.update(semanticId, updateObj);

    cacheManager.semantics.update(updateObj);
    
    return true;
  }
  
  /**
   * Update a theme value for a semantic color
   * @param {Object} params - The parameters
   * @param {number} params.semanticId - Semantic color ID
   * @param {string} params.theme - Theme ID
   * @param {string} params.value - New value
   * @returns {Promise<boolean>} - True if updated successfully
   */
  async updateThemeValue({ semanticId, theme, value } = {}) {
    console.log("[INFO] Updating theme value", { semanticId, theme });
    
    if (!semanticId) {
      throw new Error("Semantic ID is required");
    }
    semanticId = Number(semanticId);
    
    if (!theme) {
      throw new Error("Theme ID is required");
    }
    
    // Get the current semantic color
    const semanticColor = await this.get({ semanticId });
    
    if (!semanticColor) {
      throw new Error("Semantic color not found");
    }
    
    // Update the theme value
    const newThemeValues = { ...semanticColor.themeValues };
    newThemeValues[theme] = value;
    
    // Update in the database
    await this.table.update(semanticId, {
      themeValues: newThemeValues,
      updatedAt: new Date()
    });

    cacheManager.semantics.setThemeValue({
      semanticId,
      theme,
      value
    })
    
    return true;
  }

  /**
   * Update order index of table
   * @param {Object} params - The parameters
   * @param {Array} params.updatedSemanticOrders - Updated primitive order as [{semanticId, orderIndex}]
   */
  async updateOrderIndexes({ projectId, updatedSemanticOrders }) {

    if (!projectId || !updatedSemanticOrders) {
      console.error("[DB] Both projectId and updatedSemanticOrders are required");
      return;
    }
  
    const primaryKey = this.table.schema.primKey.name;
  
    await this.db.transaction('rw', this.table, async () => {
      
      const projectRecords = await this.table
        .where('projectId')
        .equals(projectId)
        .toArray();
  
      const recordMap = new Map(projectRecords.map(record => [record[primaryKey], record]));
  
      const updatedRecords = updatedSemanticOrders.map(update => {
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
   * Delete a semantic color
   * @param {Object} params - The parameters
   * @param {number} params.semanticId - Semantic color ID
   * @returns {Promise<boolean>} - True if deleted successfully
   */
  async delete({ semanticId } = {}) {
    console.log("[INFO] Deleting semantic color", { semanticId });
    
    if (!semanticId) {
      throw new Error("Semantic ID is required");
    }
    semanticId = Number(semanticId);
    
    // Delete from the database
    await this.table.delete(semanticId);

    cacheManager.semantics.delete({ semanticId });
    
    return true;
  }
  
  /**
 * Add a theme to all semantic colors in a project
 * @param {Object} params - The parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.theme - Theme ID to add
 * @returns {Promise<boolean>} - True if added successfully
 */
async addTheme({ projectId, theme } = {}) {
  console.log("[INFO] Adding theme to all semantics", { projectId, theme });

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  if (!theme) {
    throw new Error("Theme ID is required");
  }

  const semanticColors = await this.getAll({ projectId });

  // Concurrently update all entries where theme is missing
  const updates = semanticColors
    .filter(sc => !sc.themeValues.hasOwnProperty(theme))
    .map(sc => {
      const updatedThemeValues = { ...sc.themeValues, [theme]: semanticTable.defaultValue };
      return this.table.update(sc.semanticId, {
        themeValues: updatedThemeValues,
        updatedAt: new Date()
      });
    });

  await Promise.all(updates);

  await DatabaseManager.projects.addThemeMode({
    projectId,
    themeMode: theme
  });

  return true;
}

/**
 * Delete a theme from all semantic colors in a project
 * @param {Object} params - The parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.theme - Theme ID to delete
 * @returns {Promise<boolean>} - True if deleted successfully
 */
async deleteTheme({ projectId, theme } = {}) {
  console.log("[INFO] Deleting theme from all semantics", { projectId, theme });

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  if (!theme) {
    throw new Error("Theme ID is required");
  }

  const semanticColors = await this.getAll({ projectId });

  const updates = semanticColors
    .filter(sc => sc.themeValues.hasOwnProperty(theme))
    .map(sc => {
      const updatedThemeValues = { ...sc.themeValues };
      delete updatedThemeValues[theme];
      return this.table.update(sc.semanticId, {
        themeValues: updatedThemeValues,
        updatedAt: new Date()
      });
    });

  await Promise.all(updates);

  await DatabaseManager.projects.deleteThemeMode({
    projectId,
    themeMode: theme
  });

  return true;
}

/**
 * Rename a theme mode for all semantic colors in a project
 * @param {Object} params - The parameters
 * @param {string} params.projectId - Project ID
 * @param {string} params.oldTheme - Old theme name
 * @param {string} params.newTheme - New theme name
 * @returns {Promise<boolean>} - True if renamed successfully
 */
async renameTheme({ projectId, oldTheme, newTheme } = {}) {
  console.log("[INFO] Renaming theme in all semantics", { projectId, oldTheme, newTheme });

  if (!projectId) {
    throw new Error("Project ID is required");
  }

  if (!oldTheme || !newTheme) {
    throw new Error("Both oldTheme and newTheme are required");
  }

  const semanticColors = await this.getAll({ projectId });

  // Concurrently update all entries where the old theme exists
  const updates = semanticColors
    .filter(sc => sc.themeValues.hasOwnProperty(oldTheme))
    .map(sc => {
      const updatedThemeValues = { ...sc.themeValues };
      updatedThemeValues[newTheme] = updatedThemeValues[oldTheme];
      delete updatedThemeValues[oldTheme];
      return this.table.update(sc.semanticId, {
        themeValues: updatedThemeValues,
        updatedAt: new Date()
      });
    });

  await Promise.all(updates);

  await DatabaseManager.projects.renameThemeMode({
    projectId,
    oldThemeMode: oldTheme,
    newThemeMode: newTheme
  });

  return true;
}


}

export default SemanticColorModel;