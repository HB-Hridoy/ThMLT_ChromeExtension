import DatabaseModel from "./DatabaseModel.js";
import cacheManager from "../utils/cache/cacheManager.js";

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

}

export default ProjectModel;
