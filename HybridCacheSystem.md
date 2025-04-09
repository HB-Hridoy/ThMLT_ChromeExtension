# **Hybrid Session Cache System**  
A caching utility that combines **in-memory storage** for fast access and `chrome.storage.session` for persistence during the browser session.  

- **Fast retrieval** from shared in-memory storage.  
- **Session persistence** using `chrome.storage.session`.  
- **Supports key removal and cache clearing.**  
- **Singleton pattern ensures a globally shared cache.**  
- **Works in popup, background, content, and side panel scripts.**  

---

## **Table of Contents**  
1. [HybridSessionCache.js (Utility Class)](#hybridsessioncachejs-utility-class)  
2. [Methods and Usage](#methods-and-usage)  
3. [Usage in Different Files](#usage-in-different-files)  
   - [popup.js](#usage-in-popupjs)  
   - [background.js](#usage-in-backgroundjs)  
   - [content.js](#usage-in-contentjs)  
   - [sidepanel.js](#usage-in-sidepaneljs)  
4. [Conclusion](#conclusion)  

---

## **HybridSessionCache.js (Utility Class)**  

```javascript
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
const hybridSessionCache = new HybridSessionCache();
export default hybridSessionCache;
```

---

## **Methods and Usage**  

| Method | Description | Usage Example |
|--------|-------------|---------------|
| `set(key, value)` | Stores data in memory and `chrome.storage.session`. | `hybridSessionCache.set("userData", { name: "John" });` |
| `get(key)` | Retrieves data from memory (if available) or `chrome.storage.session`. | `const user = await hybridSessionCache.get("userData");` |
| `remove(key)` | Deletes a specific key from both caches. | `hybridSessionCache.remove("userData");` |
| `clear()` | Clears all stored data from both caches. | `hybridSessionCache.clear();` |

---

## **Usage in Different Files**  

### **Usage in popup.js**  
```javascript
import hybridSessionCache from "./HybridSessionCache.js";

async function loadData() {
    const userData = await hybridSessionCache.get("userData");
    console.log(userData ? "Loaded from cache:" : "No data found.", userData);
}

// Set data
hybridSessionCache.set("userData", { name: "John Doe", age: 30 });

loadData();
```

---

### **Usage in background.js**  
```javascript
import hybridSessionCache from "./HybridSessionCache.js";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === "set") {
        hybridSessionCache.set(message.key, message.value);
    } else if (message.type === "get") {
        hybridSessionCache.get(message.key).then((data) => sendResponse({ value: data }));
        return true; // Required for async response
    } else if (message.type === "remove") {
        hybridSessionCache.remove(message.key);
    } else if (message.type === "clear") {
        hybridSessionCache.clear();
    }
});
```

---

### **Usage in content.js**  
```javascript
import hybridSessionCache from "./HybridSessionCache.js";

async function modifyPage() {
    const theme = await hybridSessionCache.get("theme");
    if (theme) {
        document.body.style.backgroundColor = theme;
    }
}

// Store data
hybridSessionCache.set("theme", "lightgray");

modifyPage();
```

---

### **Usage in sidepanel.js**  
```javascript
import hybridSessionCache from "./HybridSessionCache.js";

async function loadPanelSettings() {
    const settings = await hybridSessionCache.get("panelSettings");
    console.log("Loaded Panel Settings:", settings);
}

// Store settings
hybridSessionCache.set("panelSettings", { layout: "grid", fontSize: 14 });

loadPanelSettings();
```

---

## **Conclusion**  
- **Fast and efficient hybrid cache system.**  
- **Ideal for session-based data storage.**  
- **Singleton ensures shared in-memory cache across all files.**  
- **Provides key removal and full cache clearing support.**  
- **Works across popup.js, background.js, content.js, and sidepanel.js.**  

Would you like any improvements, such as **expiration time** or **cache size limits**?
