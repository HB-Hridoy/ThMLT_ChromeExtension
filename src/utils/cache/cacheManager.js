import ProjectCache from './projectCache.js';
import PrimitiveCache from './PrimitiveCache.js';

class CacheManager {
  constructor() {
    this.projects = new ProjectCache();
    this.primitives = new PrimitiveCache();
  }

  clearAll() {
    this.projects.clear();
    this.primitives.clear();
    this.fonts.clear();
  }
}

export default new CacheManager();
