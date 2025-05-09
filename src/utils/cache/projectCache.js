
import BaseCache from "./baseCache.js";


export default class ProjectCache extends BaseCache {

  constructor(){
    super();
    this._activeProjectId = "";
    this._activeProject = {};
    this._activeProjectName = "";
    this.projects = [];
  }

  add(project) {
    const exists = this.projects.some((p) => p.projectId === project.projectId);
    if (exists) {
      this.log(
        `Add failed: Project with ID ${project.projectId} already exists.`,
        true
      );
      return null;
    }
    this.projects.push(project);
    this.log(`Added project:`, project);
    return project;
  }

  addBulk(projectArray) {
    if (!Array.isArray(projectArray)) {
      this.log(
        "replaceAllProjects failed: input is not an array.",
        true
      );
      return;
    }

    this.projects = [...projectArray];
    this.log(
      `Replaced all projects with new data`
    );
  }

  get(projectId) {
    const project =
      this.projects.find((p) => p.projectId === projectId) || null;
    this.log(`Got project ${projectId}`);
    return project;
  }

  getAll() {
    this.log("Got all projects");
    return [...this.projects];
  }

  update(projectId, updates) {
    const index = this.projects.findIndex((p) => p.projectId === projectId);
    if (index === -1) {
      this.log(
        `Update failed: Project with ID ${projectId} not found.`,
        true
      );
      return null;
    }
    this.projects[index] = {
      ...this.projects[index],
      ...updates,
      lastModified: Date.now(),
    };
    this.log(`Updated project ${projectId}:`, this.projects[index]);
    return this.projects[index];
  }

  delete(projectId) {
    const index = this.projects.findIndex((p) => p.projectId === projectId);
    if (index === -1) {
      this.log(
        `Delete failed: Project with ID ${projectId} not found.`,
        true
      );
      return null;
    }
    const deleted = this.projects.splice(index, 1)[0];
    this.log(`Deleted project ${projectId}:`, deleted);
    return deleted;
  }

  isExist(projectId) {
    const result = this.projects.some((p) => p.projectId === projectId);
    this.log(`Exists check for ${projectId}: ${result}`);
    return result;
  }

  get activeProjectId() {
    return this._activeProjectId;
  }

  set activeProjectId(projectId) {
    if (!this.isExist(projectId)) {
      this.log(`Project with ID ${projectId} not found.`, true);
      return null;
    }
    this._activeProjectId = projectId;
    this._activeProjectName = this.get(projectId).projectName;
  }

  activeProjectName(){
    return this._activeProjectName;
  }

  clear(){
    this._activeProjectId = "";
    this._activeProject = {};
    this._activeProjectName = "";
    this.log("Cleared all projects");
  }

}