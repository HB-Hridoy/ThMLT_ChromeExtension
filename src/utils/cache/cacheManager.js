import ProjectCache from './projectCache.js';
import PrimitiveCache from './primitiveCache.js';
import SemanticCache from './semanticCache.js';

class CacheManager {
  constructor() {
    this.projects = new ProjectCache();
    this.primitives = new PrimitiveCache();
    this.semantics = new SemanticCache();
  }

  clearAll() {
    this.projects.clear();
    this.primitives.clear();
    this.semantics.clear();
  }
}

export default new CacheManager();
