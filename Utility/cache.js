class SessionCache {
  constructor() {
      this.storage = sessionStorage; // Use sessionStorage for caching
  }

  // ✅ Store data in session cache
  set(key, value) {
      this.storage.setItem(key, JSON.stringify(value));
      console.log(`Stored in session cache: ${key}`);
  }

  // ✅ Retrieve data from session cache
  get(key) {
      const cachedData = this.storage.getItem(key);
      if (cachedData) {
          console.log(`Served from session cache: ${key}`);
          return JSON.parse(cachedData);
      }
      console.log(`Cache miss: ${key}`);
      return null; // Return null if key is not found
  }

  // ✅ Remove a specific key from cache
  remove(key) {
      this.storage.removeItem(key);
      console.log(`Removed from session cache: ${key}`);
  }

  // ✅ Clear the entire session cache
  clear() {
      this.storage.clear();
      console.log("Session cache cleared!");
  }

  // ✅ Get all keys stored in cache (for debugging)
  keys() {
      return Object.keys(this.storage);
  }
}

// Export the class so other files can use it
export default SessionCache;
