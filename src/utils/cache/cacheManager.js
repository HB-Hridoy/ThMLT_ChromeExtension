import ProjectCache from './projectCache.js';
import PrimitiveCache from './primitiveCache.js';
import SemanticCache from './semanticCache.js';
import FontsCache from './fontsCache.js';

class CacheManager {
  constructor() {
    this.projects = new ProjectCache();
    this.primitives = new PrimitiveCache();
    this.semantics = new SemanticCache();
    this.fonts = new FontsCache();
  }

  clearAll() {
    this.projects.clear();
    this.primitives.clear();
    this.semantics.clear();
    this.fonts.clear();
  }
}

export default new CacheManager();
