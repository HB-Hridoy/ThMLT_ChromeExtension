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

  // Soft delete a project
  async delete({ projectId } = {}) {
    if (!projectId) this.log("projectId is required", true);

    await this.ready;
    this.log(`[INFO] Soft-deleting project ${projectId}...`);

    return new Promise(async (resolve, reject) => {
      try {
        const record = await this.db.projects.get(projectId);
        if (!record) reject("Project not found");

        record.deleted = true;
        record.deletedAt = new Date().toISOString(); // timestamp of deletion
        record.lastModified = Date.now();

        await this.db.projects.put(record);

        cacheManager.projects.delete(projectId);

        this.log(`[INFO] Project ${projectId} soft-deleted`);
        resolve(`Project ${projectId} soft-deleted`);
      } catch (error) {
        this.log("Error soft-deleting project", true);
        reject("Error soft-deleting project");
      }
    });
  }
}

export default ProjectModel;
