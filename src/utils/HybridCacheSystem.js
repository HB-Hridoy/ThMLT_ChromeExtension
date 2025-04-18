// Define a constants object for your predefined keys
const CACHE_KEYS = {
    PROJECTS: 'projects',
    PROJECT_NAMES: 'projectNames',

    TRANSLATION_DATA : 'translationData',
    FONTS_DATA : 'fontsData',
    COLOR_DATA : 'colorData',

    AI2_SELECTED_PROJECT: 'ai2SelectedProject',

    IS_TRANSLATION_DATA_CHANGED: 'isTranslationDataChanged',
    IS_FONT_DATA_CHANGED: 'isFontDataChanged',
    IS_COLOR_DATA_CHANGED: 'isColorDataChanged'

};

class HybridSessionCache {
    constructor() {
        if (!HybridSessionCache.instance) {
            this.cache = {};
            this.debug = true;
            HybridSessionCache.instance = this;
            this._restoreCache(); // Automatically restore cache on initialization
        }
        return HybridSessionCache.instance;
    }

    log(message, ...args) {
        if (this.debug) {
            console.log(`[HybridSessionCache] ${message}`, ...args);
        }
    }

    // Automatically restores data from session storage into memory
    _restoreCache() {
        chrome.storage.session.get(null, (storedData) => {
            if (chrome.runtime.lastError) {
                console.error("Error restoring cache:", chrome.runtime.lastError);
                return;
            }
            this.cache = storedData || {}; 
            this.log("Cache restored:", this.cache);
        });

        // Listen for storage changes and sync memory cache
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "session") {
                for (let key in changes) {
                    if (changes[key].newValue !== undefined) {
                        this.cache[key] = changes[key].newValue;
                    } else {
                        delete this.cache[key]; // Remove from memory if deleted
                    }
                }
                this.log("Cache updated from session storage:", this.cache);
            }
        });
    }

    // Store data in memory and session storage
    set(key, value, callback = () => {}) {
        this.cache[key] = value;
        chrome.storage.session.set({ [key]: value }, () => {
            if (chrome.runtime.lastError) {
                console.error("Error setting cache:", chrome.runtime.lastError);
                return callback(false);
            }
            this.log(`Set key: ${key}, Value:`, value);
            callback(true);
        });
    }

    // Retrieve data, checking memory first, then session storage
    get(key, callback) {
        if (this.cache[key] !== undefined) {
            this.log(`Key ${key} found in memory:`, this.cache[key]);
            return callback(this.cache[key]);
        }

        // Fallback to session storage
        chrome.storage.session.get(key, (result) => {
            if (chrome.runtime.lastError) {
                console.error("Error getting cache:", chrome.runtime.lastError);
                return callback(null);
            }
            if (result[key] !== undefined) {
                this.cache[key] = result[key]; // Store in memory
                this.log(`Key ${key} restored from session storage:`, result[key]);
                return callback(result[key]);
            }
            this.log(`Key ${key} not found.`);
            callback(null); // Key not found
        });
    }

    // Remove a specific key from both caches
    remove(key, callback = () => {}) {
        delete this.cache[key];
        chrome.storage.session.remove(key, () => {
            if (chrome.runtime.lastError) {
                console.error("Error removing cache:", chrome.runtime.lastError);
                return callback(false);
            }
            this.log(`Removed key: ${key}`);
            callback(true);
        });
    }

    // Clear the entire cache
    clear(callback = () => {}) {
        this.cache = {};
        chrome.storage.session.clear(() => {
            if (chrome.runtime.lastError) {
                console.error("Error clearing cache:", chrome.runtime.lastError);
                return callback(false);
            }
            this.log("Cache cleared.");
            callback(true);
        });
    }

    // Enable or disable debug mode dynamically
    setDebugMode(enabled) {
        this.debug = enabled;
        this.log(`Debug mode set to: ${enabled}`);
    }
}

// Ensure only one instance is used across the extension
const cache = new HybridSessionCache();
export { CACHE_KEYS };
export default cache;

