import ProjectCache from './projectCache.js';
import PrimitiveCache from './primitiveCache.js';
import SemanticCache from './semanticCache.js';
import FontsCache from './fontsCache.js';
import TranslationsCache from './translationCache.js';

class CacheManager {
  constructor() {
    this.projects = new ProjectCache();
    this.primitives = new PrimitiveCache();
    this.semantics = new SemanticCache();
    this.fonts = new FontsCache();
    this.translations = new TranslationsCache();
  }

  clearAll() {
    this.projects.clear();
    this.primitives.clear();
    this.semantics.clear();
    this.fonts.clear();
    this.translations.clear();
  }
}

export default new CacheManager();
