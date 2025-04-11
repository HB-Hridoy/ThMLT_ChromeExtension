# HybridSessionCache - A Persistent & Shared Cache for Chrome Extensions

## 📌 Overview
`HybridSessionCache` is a **singleton class** that allows your Chrome extension to efficiently store, retrieve, and synchronize data between different scripts (e.g., `service-worker.js` and `popup.js`). It ensures that **data persists** even when scripts restart and eliminates conflicts by restoring the cache from `chrome.storage.session` automatically.

This class is useful for **offline-based extensions** where session-based storage is preferred over local storage.

---

## 🚀 Features
✅ **Singleton Pattern** - Ensures only one instance is used across scripts  
✅ **Automatic Cache Restoration** - Restores session storage data when scripts restart  
✅ **Shared In-Memory Cache** - Keeps popup and service worker in sync  
✅ **Session Storage Fallback** - Retrieves data from `chrome.storage.session` when missing in memory  
✅ **Event-Driven Sync** - Automatically updates memory when `chrome.storage.session` changes  
✅ **Debug Mode** - Logs cache operations for easier debugging  
✅ **Optional Callbacks** - Use `set`, `get`, `remove`, and `clear` with or without callbacks  

---

## 📦 Installation
Simply import `HybridSessionCache.js` in your extension files:
```javascript
import SessionCache from "./HybridSessionCache.js";
```

---

## 🛠️ Usage Guide
### **Enable Debug Mode (Optional)**
To see logs for debugging, enable debug mode:
```javascript
SessionCache.setDebugMode(true);
```
Disable it in production:
```javascript
SessionCache.setDebugMode(false);
```

---

### **🔹 Setting Data**
#### ✅ Without Callback
```javascript
SessionCache.set("username", "JohnDoe");
```

#### ✅ With Callback
```javascript
SessionCache.set("username", "JohnDoe", (success) => {
    if (success) console.log("Username saved successfully!");
});
```

---

### **🔹 Retrieving Data**
#### ✅ Without Callback (Won't Work)
Since `get` is asynchronous, you **must** use a callback:
```javascript
SessionCache.get("username", (value) => {
    if (value) console.log("Username:", value);
    else console.log("Username not found.");
});
```

---

### **🔹 Removing Data**
```javascript
SessionCache.remove("username", (success) => {
    if (success) console.log("Username removed!");
});
```

---

### **🔹 Clearing Entire Cache**
```javascript
SessionCache.clear((success) => {
    if (success) console.log("Cache cleared!");
});
```

---

## ⚡ How It Works Internally
### **1️⃣ Cache Restoration on Startup**
- When `HybridSessionCache` initializes, it restores session storage into memory.
- It listens for changes in `chrome.storage.session` to stay in sync.

### **2️⃣ In-Memory & Session Storage Sync**
- **First, it checks in-memory cache.** If found, it returns the value instantly.
- If not found in memory, **it fetches from session storage and updates memory**.

### **3️⃣ Handling Chrome Extension Lifecycle**
| Scenario            | Will Cache Persist? |
|--------------------|-----------------|
| Service Worker Suspended | ✅ Yes (Session Storage) |
| Popup Closed       | ✅ Yes (Session Storage) |
| Extension Restarted | ✅ Yes (Session Storage) |
| Browser Restarted  | ❌ No (Session Storage is Cleared) |

---

## 🔥 Advanced Debugging
Enable logs for detailed tracking of cache behavior:
```javascript
SessionCache.setDebugMode(true);
```

Expected console logs:
```
[HybridSessionCache] Cache restored: {"username": "JohnDoe"}
[HybridSessionCache] Set key: username, Value: JohnDoe
```

---

## 📌 Best Practices
✅ Always use **callbacks** when calling `get()`.  
✅ Enable **debug mode** in development but disable it in production.  
✅ Use **`remove()`** or **`clear()`** to free up session storage when needed.  

---

## 🏆 Conclusion
`HybridSessionCache` makes session-based caching **seamless and conflict-free**. It ensures that both your service worker and popup share the same data **without data loss or duplication**.

Now you have a powerful, easy-to-use caching solution for your Chrome extension. 🚀

