
import BaseCache from "./baseCache.js";

export class ContentScriptCacheManager {
  constructor() {
    this.cache = {}; // In-memory cache

    this.projectCache = new BaseCache("project", "projectId");
    this.primitiveCache = new BaseCache("primitive", "primitiveId");
    this.semanticCache = new BaseCache("semantic", "semanticId");
    this.fontCache = new BaseCache("font", "fontId");
    this.typographyCache = new BaseCache("typography", "typographyId");
    this.translationCache = new BaseCache("translation", "translationId");

    this.#selectedProjectId = "";
  }

  #selectedProjectId;

  getSelectedProjectId() {
    return this.#selectedProjectId;
  }

  setSelectedProjectId(projectId) {
    this.#selectedProjectId = projectId;
  }
}

// Create a singleton instance
const contentScriptCache = new ContentScriptCacheManager();

export { contentScriptCache };
