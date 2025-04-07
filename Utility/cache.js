class SessionCache {
    constructor() {
        this.memoryCache = new Map(); // In-memory cache
        this.storage = chrome.storage.local; // Persistent storage

        // Load initial cache from chrome.storage.local
        this._loadInitialCache();

        // Listen for storage changes and update memoryCache
        chrome.storage.onChanged.addListener((changes, areaName) => {
            if (areaName === "local") {
                this._updateMemoryCache(changes);
            }
        });
    }

    // ✅ Load all stored data from chrome.storage.local into memoryCache
    _loadInitialCache() {
        this.storage.get(null, (result) => {
            Object.entries(result).forEach(([key, value]) => {
                this.memoryCache.set(key, value);
            });
        });
    }

    // ✅ Update memoryCache when chrome.storage.local changes
    _updateMemoryCache(changes) {
        Object.entries(changes).forEach(([key, { newValue }]) => {
            if (newValue !== undefined) {
                this.memoryCache.set(key, newValue); // Update or add key
            } else {
                this.memoryCache.delete(key); // Remove key if deleted from storage
            }
        });
    }

    // ✅ Store data in memory and chrome.storage.local
    set(key, value) {
        this.memoryCache.set(key, value); // Fast access
        this.storage.set({ [key]: value }); // Persist in storage
    }

    // ✅ Retrieve data from memory, then fallback to chrome.storage.local
    get(key) {
        if (this.memoryCache.has(key)) {
            return this.memoryCache.get(key);
        }

        return new Promise((resolve) => {
            this.storage.get([key], (result) => {
                if (result[key]) {
                    this.memoryCache.set(key, result[key]); // Cache it for faster access
                    resolve(result[key]);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // ✅ Remove data from both memory and storage
    remove(key) {
        this.memoryCache.delete(key);
        this.storage.remove([key]);
    }

    // ✅ Clear everything
    clear() {
        this.memoryCache.clear();
        this.storage.clear();
    }
}

// Export the class for usage in other parts of the extension
export default SessionCache;
