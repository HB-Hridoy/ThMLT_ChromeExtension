import { BaseModel } from './BaseModel.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { semanticTable } from '../../utils/semanticTable.js';
import { showHomeScreen } from '../../core/screens/home/home.js';
import { isPrimitiveDataInitialized, setPrimitiveDataInitialized } from '../../core/screens/primitiveColor/primitiveColor.js';
import { isSemanticDataInitialized, setSemanticDataInitialized } from '../../core/screens/semanticColor/semanticColor.js';
import { setIsTypographyScreeenDataInitialized } from '../../core/screens/typography/typographyManagement.js';

export class ProjectModel extends BaseModel {
  constructor() {
    super('projects');
  }

  async create({ projectName, author, version } = {}) {
    if (!projectName) {
      throw new Error("projectName is required");
    }

    const existingProject = await this.table
      .where("projectName")
      .equals(projectName)
      .first();

    if (existingProject) {
      throw new Error("Project already exists");
    }

    const newProjectId = crypto.randomUUID();

    const projectData = {
      projectId: newProjectId,
      projectName,
      author,
      version,
      defaultThemeMode: "Light",
      themeModes: ["Light", "Dark"],
      lastModified: Date.now(),
      deleted: 0,
      deletedAt: 0,
    };

    await this.table.add(projectData);
    cacheManager.projects.add(projectData);
    
    console.log(`[SUCCESS] Project ${projectName} created`);
    return projectData;
  }

  // Get a specific project by projectId
  async get({ projectId } = {}) {
    if (!projectId) console.error("projectId is required");

    
    console.log("[INFO] Getting project...");

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.table.get(projectId);
        if (!result || result.deleted) resolve(null); // hide deleted entries
        resolve(result);
      } catch (error) {
        console.error("Error getting project");
        reject("Error getting project");
      }
    });
  }

  async getAll() {
    console.log("[INFO] Getting all projects...");

    

    try {
      const result = await this.table
        .where("deleted")
        .equals(0)
        .toArray();

      // Sort in memory by lastModified (newest first)
      const sorted = result.sort((a, b) => b.lastModified - a.lastModified);

      console.log("[SUCCESS] Got all projects!");

      cacheManager.projects.addBulk(sorted);
      return sorted;
    } catch (error) {
      console.error("Error getting projects");
      throw error;
    }
  }

  // Update a project
  async update({
    projectId,
    projectName = this.SKIP,
    author = this.SKIP,
    version = this.SKIP,
  } = {}) {
    if (!projectId) console.error("projectId is required");

    

    return new Promise(async (resolve, reject) => {
      try {
        const record = await this.table.get(projectId);
        if (!record) reject("Project not found");

        const updatedRecord = {
          ...record,
          projectName:
            projectName !== this.SKIP ? projectName : record.projectName,
          author: author !== this.SKIP ? author : record.author,
          version: version !== this.SKIP ? version : record.version,
          lastModified: Date.now(),
        };

        await this.table.put(updatedRecord);

        cacheManager.projects.update(projectId, updatedRecord);

        console.log(`[SUCCESS] Project ${projectId} updated`);
        resolve(updatedRecord);
      } catch (error) {
        console.error("Error updating project");
        reject("Error updating project");
      }
    });
  }

  async deleteProject({ projectId, hardDelete = false }) {
    
    try {
      // Get the original project
      const project = await this.table.get(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
  
      if (hardDelete) {
        // Hard delete: permanently remove project and all related data
        await this.db.transaction('rw', [db.projects, db.primitiveColors, db.semanticColors, db.fonts, db.translations], async () => {
          // Delete all related data
          await this.db.primitiveColors.where('projectId').equals(projectId).delete();
          await this.db.semanticColors.where('projectId').equals(projectId).delete();
          await this.db.fonts.where('projectId').equals(projectId).delete();
          await this.db.translations.where('projectId').equals(projectId).delete();
          
          // Delete the project itself
          await this.table.delete(projectId);
        });
  
        return {
          success: true,
          message: `Project "${project.projectName}" and all related data permanently deleted`
        };
  
      } else {
        // Soft delete: mark as deleted
        await this.table.update(projectId, {
          projectName: `${project.projectName} (deleted)`,
          deleted: true,
          deletedAt: new Date(),
          lastModified: new Date()
        });
  
        console.log(`[DB] Project "${project.projectName}" marked as deleted`);
        
        return true;
      }
  
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  }
  
  // Optional: Function to restore a soft-deleted project
  async restoreProject({ projectId }) {
    
    try {
      const project = await this.table.get(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
  
      if (!project.deleted) {

        console.log(`[DB] Project "${project.projectName}" is not deleted`);
        
        return false;
      }
  
      await this.table.update(projectId, {
        deleted: false,
        deletedAt: null,
        lastModified: new Date()
      });
  
      console.log(`[DB] Project "${project.projectName}" restored successfully`);
      
      return true;
  
    } catch (error) {
      console.error('[DB] Error restoring project:', error);
    }
  }

  // Add a theme mode to a project
  async addThemeMode({ projectId, themeMode } = {}) {
    this.#validateProjectThemeInput(projectId, themeMode);

    

    const record = await this.table.get(projectId);
    if (!record) throw new Error("Project not found");

    if (!record.themeModes.includes(themeMode)) {
      record.themeModes.push(themeMode);
      record.lastModified = Date.now();

      await this.table.put(record);
      cacheManager.semantics.theme().add({ themeName: themeMode });

      console.log(`[SUCCESS] Theme mode "${themeMode}" added to project ${projectId}`);
    }

    return record;
  }

  // Delete a theme mode from a project
  async deleteThemeMode({ projectId, themeMode } = {}) {
    this.#validateProjectThemeInput(projectId, themeMode);

    

    const record = await this.table.get(projectId);
    if (!record) throw new Error("Project not found");

    const index = record.themeModes.indexOf(themeMode);
    if (index === -1) throw new Error("Theme mode not found in project");

    record.themeModes.splice(index, 1);
    record.lastModified = Date.now();

    await this.table.put(record);
    cacheManager.semantics.theme().delete({ themeName: themeMode });

    console.log(`[SUCCESS] Theme mode "${themeMode}" deleted from project ${projectId}`);
    return record;
  }

  // Rename a theme mode in a project
  async renameThemeMode({ projectId, oldThemeMode, newThemeMode } = {}) {
    this.#validateProjectThemeInput(projectId, oldThemeMode, "oldThemeMode");
    this.#validateProjectThemeInput(projectId, newThemeMode, "newThemeMode");

    

    const record = await this.table.get(projectId);
    if (!record) throw new Error("Project not found");

    const index = record.themeModes.indexOf(oldThemeMode);
    if (index === -1) throw new Error("Old theme mode not found in project");

    record.themeModes[index] = newThemeMode;
    record.lastModified = Date.now();

    if (record.defaultThemeMode === oldThemeMode){
      record.defaultThemeMode = newThemeMode;
    }

    await this.table.put(record);
    cacheManager.semantics.theme().rename({
      oldThemeName: oldThemeMode,
      newThemeName: newThemeMode
    });

    console.log(`[SUCCESS] Theme mode "${oldThemeMode}" renamed to "${newThemeMode}" in project ${projectId}`);
    return record;
  }

  #validateProjectThemeInput(projectId, themeMode, paramName = "themeMode") {
    if (!projectId) throw new Error("projectId is required");
    if (!themeMode || typeof themeMode !== "string") {
      throw new Error(`${paramName} is required and must be a string`);
    }
  }

  // Change the default theme mode in a project
  async setDefaultThemeMode({ projectId, themeMode } = {}) {
    this.#validateProjectThemeInput(projectId, themeMode);

    

    const record = await this.table.get(projectId);
    if (!record) throw new Error("Project not found");

    if (!record.themeModes.includes(themeMode)) {
      throw new Error(`Theme mode "${themeMode}" does not exist in the project`);
    }

    record.defaultThemeMode = themeMode;
    record.lastModified = Date.now();

    await this.table.put(record);

    cacheManager.semantics.theme().defaultThemeMode = themeMode;

    console.log(`[SUCCESS] Default theme mode set to "${themeMode}" for project ${projectId}`);
    return record;
  }

  async duplicateProject({ projectId, newProjectName }) {
    
    try {
      // Get the original project
      const originalProject = await this.table.get(projectId);
      if (!originalProject) {
        throw new Error(`[DB] Project with ID ${projectId} not found`);
      }

      const newProjectId = crypto.randomUUID();
      let proposedName = newProjectName?.trim() || null;
      const allProjects = cacheManager.projects.getAll();

      // If no name provided, auto-generate one with incrementing suffix
      if (!proposedName) {
        let copyNameCounter = 1;
        proposedName = `${originalProject.projectName}_copy_${copyNameCounter}`;
        while (allProjects.some(project => project.projectName === proposedName)) {
          copyNameCounter++;
          proposedName = `${originalProject.projectName}_copy_${copyNameCounter}`;
        }
      } else {
        // Ensure user-provided name is unique
        if (allProjects.some(project => project.projectName === proposedName)) {
          throw new Error(`[DB] Project name "${proposedName}" already exists`);
        }
      }
      

      const newProject = {
        ...originalProject,
        projectId: newProjectId,
        projectName: proposedName,
        deleted: 0,
        deletedAt: 0,
        lastModified: Date.now()
      };


      await this.table.add(newProject);
      const projectData = newProject;

      cacheManager.projects.add(projectData);
  
      // Duplicate primitive colors
      const primitiveIdMigrationMap = {}
      const primitiveColors = await this.db.primitiveColors.where('projectId').equals(projectId).toArray();
      if (primitiveColors.length > 0) {
        const newPrimitiveColors = primitiveColors.map(color => ({
          ...color,
          projectId: newProjectId
        }));

        // Extract original IDs before deleting them
        const originalPrimitiveIds = newPrimitiveColors.map(color => color.primitiveId);

        // Remove original IDs so Dexie generates new ones
        newPrimitiveColors.forEach(color => delete color.primitiveId);

        // Insert into DB and get new IDs
        const newPrimitiveIds = await this.db.primitiveColors.bulkAdd(newPrimitiveColors, { allKeys: true });

        //  Map originalId -> newId
        originalPrimitiveIds.forEach((originalId, index) => {
          primitiveIdMigrationMap[originalId] = newPrimitiveIds[index];
        });
      }
  
      // Fetch original semantic colors
      const semanticColors = await this.db.semanticColors.where('projectId').equals(projectId).toArray();

      if (semanticColors.length > 0) {
        const newSemanticColors = semanticColors.map(color => {
          // Transform themeValues using primitiveIdMigrationMap
          const updatedThemeValues = {};
          for (const [themeMode, originalPrimitiveId] of Object.entries(color.themeValues)) {
            const newPrimitiveId = primitiveIdMigrationMap[originalPrimitiveId];
            updatedThemeValues[themeMode] = newPrimitiveId ?? originalPrimitiveId; // Fallback if not found
          }

          return {
            ...color,
            projectId: newProjectId,
            themeValues: updatedThemeValues
          };
        });

        // Step 3: Remove original semantic IDs so new ones are generated
        newSemanticColors.forEach(color => delete color.semanticId);

        // Step 4: Insert duplicated semantic colors
        await this.db.semanticColors.bulkAdd(newSemanticColors);
      }

  
      // Duplicate fonts
      const fontIdMigrationMap = {}
      const fonts = await this.db.fonts.where('projectId').equals(projectId).toArray();
      if (fonts.length > 0) {
        const newFonts = fonts.map(font => ({
          ...font,
          projectId: newProjectId
        }));

        // Extract original IDs before deleting them
        const originalFontIds = newFonts.map(fontData => fontData.fontId);

        // Remove original IDs so new ones are generated
        newFonts.forEach(font => delete font.fontId);

        // Insert into DB and get new IDs
        const newFontIds = await this.db.fonts.bulkAdd(newFonts, { allKeys: true });

        //  Map originalId -> newId
        originalFontIds.forEach((originalId, index) => {
          fontIdMigrationMap[originalId] = newFontIds[index];
        });
      }

      // Duplicate Typography
      const typographies = await this.db.typography.where('projectId').equals(projectId).toArray();
      if (typographies.length > 0) {
        const newTypographies = typographies.map(typography => ({
          ...typography,
          projectId: newProjectId
        }));

        // Remove original IDs and update linkedFont to point to new fontId
        newTypographies.forEach(typography => {
          delete typography.typographyId;

          const oldLinkedFontId = typography.linkedFont;
          const newLinkedFontId = fontIdMigrationMap[oldLinkedFontId];

          // Only replace if a mapping exists
          if (newLinkedFontId !== undefined) {
            typography.linkedFont = newLinkedFontId;
          } else {
            // Optionally log or handle unmapped font
            console.warn(`No migration mapping found for linkedFont ID: ${oldLinkedFontId}`);
          }
        });

        // Insert into DB and get new IDs
        const newTypographyIds = await this.db.typography.bulkAdd(newTypographies);
      }


  
      // Duplicate translations
      const translations = await this.db.translations.where('projectId').equals(projectId).toArray();
      if (translations.length > 0) {
        const newTranslations = translations.map(translation => ({
          ...translation,
          projectId: newProjectId
        }));
        // Remove original IDs so new ones are generated
        newTranslations.forEach(translation => delete translation.translationId);
        await this.db.translations.bulkAdd(newTranslations);
      }

      console.log(`[DB] Project "${originalProject.projectName}" duplicated successfully as "${newProject.projectName}"`);
      
      return projectData;
  
    } catch (error) {
      console.error('[DB] Error duplicating project:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async exportColorData({ projectId }) {
    
    try {
      // Query the project
      const project = await this.table.where('projectId').equals(projectId).first();
  
      // Return null if project not found
      if (!project) {
        return null;
      }
  
      // Query primitive colors for this project
      const primitiveColors = await this.db.primitiveColors
        .where('projectId')
        .equals(projectId)
        .toArray();
  
      // Sort primitive colors by orderIndex
      primitiveColors.sort((a, b) => a.orderIndex - b.orderIndex);

      console.log(JSON.stringify(primitiveColors, null,2));
      
  
      // Query semantic colors for this project
      const semanticColors = await this.db.semanticColors
        .where('projectId')
        .equals(projectId)
        .toArray();
  
      // Sort semantic colors by orderIndex
      semanticColors.sort((a, b) => a.orderIndex - b.orderIndex);
  
      // Build Primitives object
      const primitives = {};
      const primitiveNames = {};
      primitiveColors.forEach(primitive => {
        primitives[primitive.primitiveName] = primitive.primitiveValue;
        primitiveNames[primitive.primitiveId] = primitive.primitiveName;
      });
  
      // Build Semantic object
      const semantic = {};
  
      // Initialize semantic object with empty objects for each theme mode
      project.themeModes.forEach(mode => {
        semantic[mode] = {};
      });
  
      // Populate semantic colors for each theme mode
      for (const semanticColor of semanticColors) {
        for (const [themeMode, linkedPrimitive] of Object.entries(semanticColor.themeValues)) {
          if (!semantic[themeMode]) {
            semantic[themeMode] = {};
          }

          let linkedPrimitiveValue = "";
          if (linkedPrimitive !== semanticTable.defaultValue) {
            const linkedPrimitiveId = parseInt(linkedPrimitive, 10);
            linkedPrimitiveValue = primitiveNames[linkedPrimitiveId];

            console.log(`Linked primitive id - ${linkedPrimitiveId}`);
            console.log(`Linked primitive value - ${linkedPrimitiveValue}`);
          } else {
            linkedPrimitiveValue = linkedPrimitive;
          }

          semantic[themeMode][semanticColor.semanticName] = linkedPrimitiveValue;
        }
      }

  
      // Assemble the final JSON object
      const exportData = {
        "ProjectName": project.projectName,
        "Author": project.author,
        "Version": project.version,
        "Modes": project.themeModes,
        "DefaultMode": project.defaultThemeMode,
        "Primitives": primitives,
        "Semantic": semantic
      };
  
      return JSON.stringify(exportData, null, 2);
  
    } catch (error) {
      console.error('Error exporting color data:', error);
      throw error;
    }
  }

  async exportFontData({ projectId }) {
    
    try {
      // Query the project
      const project = await this.table.where('projectId').equals(projectId).first();
      
      // Return null if project not found
      if (!project) {
        return null;
      }
      
      // Query fonts for this project, ordered by orderIndex
      const fontsData = await this.db.fonts
        .where('projectId')
        .equals(projectId)
        .toArray();

      // Sort primitive colors by orderIndex
      fontsData.sort((a, b) => a.orderIndex - b.orderIndex);
      
      
      // Build Fonts object
      const fonts = {};
      fontsData.forEach(({ fontName, fontValue }) => {
        fonts[fontName] = fontValue;
      });
      
      // Assemble the final JSON object
      const exportData = {
        "ProjectName": project.projectName,
        "Author": project.author,
        "Version": project.version,
        "Fonts": fonts
      };
      
      return JSON.stringify(exportData, null, 2);
      
    } catch (error) {
      console.error('Error exporting font data:', error);
      throw error;
    }
  }

  async importColorData({ jsonData, projectId }) {
    if (typeof jsonData !== 'string') {
      throw new TypeError(`Expected jsonData to be a string, but received ${typeof jsonData}`);
    }

    try {
      const parsed = JSON.parse(jsonData);

      // Validate the exact structure that your export function creates
      const requiredFields = ['Modes', 'DefaultMode', 'Primitives', 'Semantic'];
      const missingFields = requiredFields.filter(field => !(field in parsed));
      
      if (missingFields.length > 0) {
        throw new Error(`Invalid color data format. Missing required fields: ${missingFields.join(', ')}`);
      }

      // Validate Modes is an array
      if (!Array.isArray(parsed.Modes)) {
        throw new Error("Invalid color data format: 'Modes' must be an array.");
      }

      // Validate Modes array is not empty
      if (parsed.Modes.length === 0) {
        throw new Error("Invalid color data format: 'Modes' array cannot be empty.");
      }

      // Validate DefaultMode exists and is in Modes array
      if (!parsed.DefaultMode || !parsed.Modes.includes(parsed.DefaultMode)) {
        throw new Error("Invalid color data format: 'DefaultMode' must be one of the values in 'Modes' array.");
      }

      // Validate Primitives is an object
      if (!parsed.Primitives || typeof parsed.Primitives !== 'object' || Array.isArray(parsed.Primitives)) {
        throw new Error("Invalid color data format: 'Primitives' must be an object.");
      }

      // Validate Semantic structure
      if (!parsed.Semantic || typeof parsed.Semantic !== 'object' || Array.isArray(parsed.Semantic)) {
        throw new Error("Invalid color data format: 'Semantic' must be an object.");
      }

      // Validate that Semantic has objects for each mode in Modes
      for (const mode of parsed.Modes) {
        if (!parsed.Semantic[mode] || typeof parsed.Semantic[mode] !== 'object' || Array.isArray(parsed.Semantic[mode])) {
          throw new Error(`Invalid color data format: 'Semantic.${mode}' must be an object.`);
        }
      }

      // Validate that all semantic colors reference valid primitives or default values
      const primitiveNames = Object.keys(parsed.Primitives);
      for (const mode of parsed.Modes) {
        for (const [semanticName, primitiveRef] of Object.entries(parsed.Semantic[mode])) {
          if (primitiveRef !== semanticTable.defaultValue && !primitiveNames.includes(primitiveRef)) {
            throw new Error(`Invalid color data: Semantic color '${semanticName}' in mode '${mode}' references unknown primitive '${primitiveRef}'.`);
          }
        }
      }

      const { Modes, DefaultMode, Primitives, Semantic } = parsed;

      // Check if project exists
      const existingProject = await this.table.where('projectId').equals(projectId).first();
      if (!existingProject) {
        throw new Error(`Project with ID "${projectId}" does not exist.`);
      }

      // Insert or update project metadata
      await this.table.put({
        ...existingProject,
        themeModes: Modes,
        defaultThemeMode: DefaultMode
      });

      cacheManager.projects.update(projectId, {
        themeModes: Modes,
        defaultThemeMode: DefaultMode
      });

      cacheManager.primitives.clear();
      cacheManager.semantics.clear();

      cacheManager.semantics.theme().clear();
      Modes.forEach(mode => {
        cacheManager.semantics.theme().add({ themeName: mode });
      });
      cacheManager.semantics.theme().defaultThemeMode = DefaultMode;

      // Clear existing primitives & semantic colors for this project
      await this.db.primitiveColors.where('projectId').equals(projectId).delete();
      await this.db.semanticColors.where('projectId').equals(projectId).delete();

      // Insert primitives
      const primitiveNameToIdMap = {};
      const primitiveEntries = Object.entries(Primitives);
      
      for (let i = 0; i < primitiveEntries.length; i++) {
        const [primitiveName, primitiveValue] = primitiveEntries[i];
        const orderIndex = i + 1000; 
        
        let primitive = {
          projectId,
          primitiveName,
          primitiveValue,
          orderIndex: orderIndex
        };
        
        const primitiveId = await this.db.primitiveColors.add(primitive);
        primitiveNameToIdMap[primitiveName] = primitiveId;

        primitive.primitiveId = primitiveId; // Add the generated ID to the object

        // cacheManager.primitives.add(primitive);
      }

      // Get all unique semantic color names across all modes
      let allSemanticNames = new Set();
      for (const mode of Modes) {
        Object.keys(Semantic[mode]).forEach(name => allSemanticNames.add(name));
      }

      // Insert semantic colors
      let semanticIndex = 0;
      for (const semanticName of allSemanticNames) {
        let themeValues = {};

        for (const mode of Modes) {
          const primitiveRef = Semantic[mode][semanticName];
          
          if (primitiveRef === undefined) {
            // If semantic color doesn't exist in this mode, use default value
            themeValues[mode] = semanticTable.defaultValue;
          } else if (primitiveRef === semanticTable.defaultValue) {
            themeValues[mode] = semanticTable.defaultValue;
          } else {
            const primitiveId = primitiveNameToIdMap[primitiveRef];
            if (primitiveId === undefined) {
              throw new Error(`Unknown primitive name "${primitiveRef}" for semantic color "${semanticName}" in mode "${mode}".`);
            }
            themeValues[mode] = primitiveId;
          }
        }

        let semanticColor = {
          projectId,
          semanticName,
          themeValues,
          orderIndex: semanticIndex + 1000,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const newSemanticId = await this.db.semanticColors.add(semanticColor);

        semanticColor.semanticId = newSemanticId; // Add the generated ID to the object

        // cacheManager.semantics.add(semanticColor);

      }

      setPrimitiveDataInitialized(false);
      setSemanticDataInitialized(false);

      return { success: true, message: "Color data imported successfully." };

      
    } catch (error) {
      console.error("Error importing color data:", error);
      throw error;
    }
  }

}
