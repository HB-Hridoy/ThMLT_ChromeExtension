

import { sendMessage } from "./messageClient.js";
import { contentScriptCache } from "./cache/contentScriptCache.js";

class DataFetcher {
  constructor() {
    this.sendMessage = sendMessage;
    this.cache = contentScriptCache;
  }

  async fetch({ action, cacheKey, requiresProject = true }) {
    try {
      const payload = { action };
      if (requiresProject) {
        payload.projectId = this.cache.getSelectedProjectId();
      }

      const response = await this.sendMessage(payload);

      if (!response.success) {
        console.log(`[ERROR] Fetch failed for ${cacheKey}:`, response.error || 'Unknown error');
        return;
      }

      this.cache[cacheKey].addBulk({ dataArray: response.data });
      console.debug(`[DEBUG] ${cacheKey} loaded`, JSON.stringify(this.cache[cacheKey].getAll(), null, 2));

    } catch (err) {
      console.log(`[EXCEPTION] Fetch failed for ${cacheKey}:`, err);
    }
  }

  fetchProjectsData() {
    return this.fetch({ action: "PROJECTS:FETCH_DATA", cacheKey: "projectCache", requiresProject: false });
  }

  fetchPrimitivesData() {
    return this.fetch({ action: "COLORS:FETCH_PRIMITIVE", cacheKey: "primitiveCache" });
  }

  fetchSemanticsData() {
    return this.fetch({ action: "COLORS:FETCH_SEMANTIC", cacheKey: "semanticCache" });
  }

  fetchFontsData() {
    return this.fetch({ action: "FONTS:FETCH_DATA", cacheKey: "fontCache" });
  }

  fetchTranslationsData() {
    return this.fetch({ action: "TRANSLATIONS:FETCH_DATA", cacheKey: "translationCache" });
  }

  async fetchAllData(){
    await this.fetchPrimitivesData();
    await this.fetchSemanticsData();
    await this.fetchFontsData();
    await this.fetchTranslationsData();
  }
}

const fetcher = new DataFetcher();
export { fetcher };