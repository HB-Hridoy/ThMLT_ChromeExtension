
import BaseCache from "./baseCache.js";

export class ContentScriptCacheManager {
  constructor() {
    this.cache = {}; // In-memory cache

    this.projectCache = new BaseCache("project", "projectId");
    this.primitiveCache = new BaseCache("primitive", "primitiveId");
    this.semanticCache = new BaseCache("semantic", "semanticId");
    this.fontCache = new BaseCache("font", "fontId");
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


export const CACHE_KEYS = {
  TRANSLATION_DATA : 'translationData',
  FONTS_DATA : 'fontsData',
  COLOR_DATA: 'colorData',
  DEFAULT_THEME_MODE: 'defaultThemeMode',

  AI2_SELECTED_PROJECT: 'ai2_selected_project',
  PREVIOUS_AI2_SELECTED_PROJECT: 'previousAi2SelectedProject',
  HAS_PROJECT_CHANGED: 'hasProjectChanged',

  IS_TRANSLATION_DATA_CHANGED: 'isTranslationDataChanged',
  IS_FONT_DATA_CHANGED: 'isFontDataChanged',
  IS_COLOR_DATA_CHANGED: 'isColorDataChanged'
  
};