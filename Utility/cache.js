// Define a constants object for your predefined keys
const CACHE_KEYS = {
    PROJECTS: 'projects',

    TRANSLATION_DATA : 'translationData',
    FONTS_DATA : 'fontsData',
    PRIMARY_COLOR_DATA : 'primaryColorData',
    SEMANTIC_COLOR_DATA : 'semanticColorData',

    PREVIOUS_PROJECT_NAME: 'previousProjectName',
    CURRENT_PROJECT_NAME: 'currentProjectName',

};

class HybridSessionCache {
    constructor() {
        if (!HybridSessionCache.instance) {
            this.cache = {}; // Shared in-memory storage
            HybridSessionCache.instance = this;
        }
        return HybridSessionCache.instance;
    }

    // Store data in both memory and session storage
    async set(key, value) {
        this.cache[key] = value;
        await chrome.storage.session.set({ [key]: value });
    }

    // Retrieve data from memory first, fallback to session storage
    async get(key) {
        if (this.cache[key]) {
            return this.cache[key];
        }
        return this.getFromSessionStorage(key);
    }

    // Fetch from session storage and update memory cache
    async getFromSessionStorage(key) {
        const result = await chrome.storage.session.get(key);
        this.cache[key] = result[key] || null;
        return this.cache[key];
    }

    // Remove a specific key from both caches
    async remove(key) {
        delete this.cache[key];
        await chrome.storage.session.remove(key);
    }

    // Clear the entire cache
    async clear() {
        this.cache = {};
        await chrome.storage.session.clear();
    }
}

// Ensure only one instance is used across the extension
const SessionCache = new HybridSessionCache();
export { CACHE_KEYS };
export default SessionCache;

