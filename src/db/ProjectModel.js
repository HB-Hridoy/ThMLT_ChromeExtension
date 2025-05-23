import DatabaseModel from "./DatabaseModel.js";
import cacheManager from "../utils/cache/cacheManager.js";
import { semanticTable } from "../utils/semanticTable.js";

class ProjectModel extends DatabaseModel {
  constructor() {
    super(); // Call the constructor of DatabaseModel
    this.log("[INFO] ProjectModel initialized");
  }

  // Create a new project
  async create({ projectName, author, version } = {}) {
    if (!projectName) this.log("projectName is required", true);

    return new Promise(async (resolve, reject) => {
      try {
        const existingProject = await this.db.projects
          .where("projectName")
          .equals(projectName)
          .first();

        if (existingProject) {
          this.log("Project already exists", true);
          reject("Project already exists");
        }

        const projectData = {
          projectId: crypto.randomUUID(),
          projectName,
          author,
          version,
          defaultThemeMode: "Light",
          themeModes: ["Light", "Dark"],
          lastModified: Date.now(),
          deleted: 0,
          deletedAt: 0,
        };

        await this.db.projects.add(projectData);

        cacheManager.projects.add(projectData)
        this.log(`[SUCCESS] Project ${projectName} created`);

        resolve(projectData);
      } catch (error) {
        this.log(error, true);
        reject("Error creating project");
      }
    });
  }

  // Get a specific project by projectId
  async get({ projectId } = {}) {
    if (!projectId) this.log("projectId is required", true);

    await this.ready;
    this.log("[INFO] Getting project...");

    return new Promise(async (resolve, reject) => {
      try {
        const result = await this.db.projects.get(projectId);
        if (!result || result.deleted) resolve(null); // hide deleted entries
        resolve(result);
      } catch (error) {
        this.log("Error getting project", true);
        reject("Error getting project");
      }
    });
  }

  async getAll() {
    this.log("[INFO] Getting all projects...");

    try {
      const result = await this.db.projects
        .where("deleted")
        .equals(0)
        .toArray();

      // Sort in memory by lastModified (newest first)
      const sorted = result.sort((a, b) => b.lastModified - a.lastModified);

      this.log("[SUCCESS] Got all projects!");

      cacheManager.projects.addBulk(sorted);
      return sorted;
    } catch (error) {
      this.log("Error getting projects", true);
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
    if (!projectId) this.log("projectId is required", true);

    await this.ready;

    return new Promise(async (resolve, reject) => {
      try {
        const record = await this.db.projects.get(projectId);
        if (!record) reject("Project not found");

        const updatedRecord = {
          ...record,
          projectName:
            projectName !== this.SKIP ? projectName : record.projectName,
          author: author !== this.SKIP ? author : record.author,
          version: version !== this.SKIP ? version : record.version,
          lastModified: Date.now(),
        };

        await this.db.projects.put(updatedRecord);

        cacheManager.projects.update(projectId, updatedRecord);

        this.log(`[SUCCESS] Project ${projectId} updated`);
        resolve(updatedRecord);
      } catch (error) {
        this.log("Error updating project", true);
        reject("Error updating project");
      }
    });
  }

  async deleteProject({ projectId, hardDelete = false }) {
    try {
      // Get the original project
      const project = await this.db.projects.get(projectId);
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
          await this.db.projects.delete(projectId);
        });
  
        return {
          success: true,
          message: `Project "${project.projectName}" and all related data permanently deleted`
        };
  
      } else {
        // Soft delete: mark as deleted
        await this.db.projects.update(projectId, {
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
      const project = await this.db.projects.get(projectId);
      if (!project) {
        throw new Error(`Project with ID ${projectId} not found`);
      }
  
      if (!project.deleted) {

        console.log(`[DB] Project "${project.projectName}" is not deleted`);
        
        return false;
      }
  
      await this.db.projects.update(projectId, {
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

    await this.ready;

    const record = await this.db.projects.get(projectId);
    if (!record) throw new Error("Project not found");

    if (!record.themeModes.includes(themeMode)) {
      record.themeModes.push(themeMode);
      record.lastModified = Date.now();

      await this.db.projects.put(record);
      cacheManager.semantics.theme().add({ themeName: themeMode });

      this.log(`[SUCCESS] Theme mode "${themeMode}" added to project ${projectId}`);
    }

    return record;
  }

  // Delete a theme mode from a project
  async deleteThemeMode({ projectId, themeMode } = {}) {
    this.#validateProjectThemeInput(projectId, themeMode);

    await this.ready;

    const record = await this.db.projects.get(projectId);
    if (!record) throw new Error("Project not found");

    const index = record.themeModes.indexOf(themeMode);
    if (index === -1) throw new Error("Theme mode not found in project");

    record.themeModes.splice(index, 1);
    record.lastModified = Date.now();

    await this.db.projects.put(record);
    cacheManager.semantics.theme().delete({ themeName: themeMode });

    this.log(`[SUCCESS] Theme mode "${themeMode}" deleted from project ${projectId}`);
    return record;
  }

  // Rename a theme mode in a project
  async renameThemeMode({ projectId, oldThemeMode, newThemeMode } = {}) {
    this.#validateProjectThemeInput(projectId, oldThemeMode, "oldThemeMode");
    this.#validateProjectThemeInput(projectId, newThemeMode, "newThemeMode");

    await this.ready;

    const record = await this.db.projects.get(projectId);
    if (!record) throw new Error("Project not found");

    const index = record.themeModes.indexOf(oldThemeMode);
    if (index === -1) throw new Error("Old theme mode not found in project");

    record.themeModes[index] = newThemeMode;
    record.lastModified = Date.now();

    if (record.defaultThemeMode === oldThemeMode){
      record.defaultThemeMode = newThemeMode;
    }

    await this.db.projects.put(record);
    cacheManager.semantics.theme().rename({
      oldThemeName: oldThemeMode,
      newThemeName: newThemeMode
    });

    this.log(`[SUCCESS] Theme mode "${oldThemeMode}" renamed to "${newThemeMode}" in project ${projectId}`);
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

    const record = await this.db.projects.get(projectId);
    if (!record) throw new Error("Project not found");

    if (!record.themeModes.includes(themeMode)) {
      throw new Error(`Theme mode "${themeMode}" does not exist in the project`);
    }

    record.defaultThemeMode = themeMode;
    record.lastModified = Date.now();

    await this.db.projects.put(record);

    cacheManager.semantics.theme().defaultThemeMode = themeMode;

    this.log(`[SUCCESS] Default theme mode set to "${themeMode}" for project ${projectId}`);
    return record;
  }

  async duplicateProject({ projectId }) {
    try {
      // Get the original project
      const originalProject = await this.db.projects.get(projectId);
      if (!originalProject) {
        throw new Error(`[DB] Project with ID ${projectId} not found`);
      }
  
      // Create new project with _copy suffix and generate a new ID
      const newProjectId = crypto.randomUUID();

      let copyNameCounter = 1;
      let proposedName = `${originalProject.projectName}_copy_${copyNameCounter}`;
      const allProjects = cacheManager.projects.getAll();

      while (allProjects.some(project => project.projectName === proposedName)) {
        copyNameCounter++;
        proposedName = `${originalProject.projectName}_copy_${copyNameCounter}`;
      }

      const newProject = {
        ...originalProject,
        projectId: newProjectId,
        projectName: proposedName,
        deleted: 0,
        deletedAt: 0,
        lastModified: Date.now()
      };


      await this.db.projects.add(newProject);
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
        const originalIds = newPrimitiveColors.map(color => color.primitiveId);

        // Remove original IDs so Dexie generates new ones
        newPrimitiveColors.forEach(color => delete color.primitiveId);

        // Insert into DB and get new IDs
        const newIds = await this.db.primitiveColors.bulkAdd(newPrimitiveColors, { allKeys: true });

        //  Map originalId -> newId
        originalIds.forEach((originalId, index) => {
          primitiveIdMigrationMap[originalId] = newIds[index];
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
      const fonts = await this.db.fonts.where('projectId').equals(projectId).toArray();
      if (fonts.length > 0) {
        const newFonts = fonts.map(font => ({
          ...font,
          projectId: newProjectId
        }));
        // Remove original IDs so new ones are generated
        newFonts.forEach(font => delete font.fontId);
        await this.db.fonts.bulkAdd(newFonts);
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
      const project = await this.db.projects.where('projectId').equals(projectId).first();
  
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
      semanticColors.forEach(semanticColor => {
        Object.entries(semanticColor.themeValues).forEach(async ([themeMode, linkedPrimitive]) => {
          if (!semantic[themeMode]) {
            semantic[themeMode] = {};
          }

          let linkedPrimitiveValue = ""
          if (linkedPrimitive !== semanticTable.defaultValue){
            const linkedPrimitiveId = parseInt(linkedPrimitive, 10);
            linkedPrimitiveValue = primitiveNames[linkedPrimitiveId];

            console.log(`Linked primitive id - ${linkedPrimitiveId}`);
            console.log(`Linked primitive value - ${linkedPrimitiveValue}`);
            
            
          } else{
            linkedPrimitiveValue = linkedPrimitive;
          }
          semantic[themeMode][semanticColor.semanticName] = linkedPrimitiveValue;
        });
      });
  
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
      const project = await this.db.projects.where('projectId').equals(projectId).first();
      
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

}

export default ProjectModel;
