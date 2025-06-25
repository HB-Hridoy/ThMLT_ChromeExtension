import ProjectCache from './projectCache.js';
import PrimitiveCache from './primitiveCache.js';
import SemanticCache from './semanticCache.js';
import FontsCache from './fontsCache.js';
import TranslationsCache from './translationCache.js';
import BaseCache from '../../content/utils/cache/baseCache.js';

class CacheManager {
  constructor() {
    this.projects = new ProjectCache();
    this.primitives = new PrimitiveCache();
    this.semantics = new SemanticCache();
    this.fonts = new FontsCache();
    this.typography = new BaseCache("typography", "typographyId");
    this.translations = new TranslationsCache();
  }

  clearAll() {
    this.projects.clear();
    this.primitives.clear();
    this.semantics.clear();
    this.fonts.clear();
    this.translations.clear();
    this.typography.clear();
  }
}

export default new CacheManager();
