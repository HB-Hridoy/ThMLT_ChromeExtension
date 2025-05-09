import DatabaseModel from "./DatabaseModel.js";

class FontModel extends DatabaseModel {
  constructor() {
    super();
    this.log("[INFO] FontModel initialized");
  }

  async create({ projectId, fontTag, fontName, orderIndex } = {}) {
    if (!projectId) this.log("projectId is required", true);

    await this.ready;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["fonts"], "readwrite");
      const store = transaction.objectStore("fonts");

      const addRequest = store.add({
        projectId,
        fontTag,
        fontName,
        orderIndex: orderIndex ?? 0,
        deleted: false,
        deletedAt: null,
      });

      addRequest.onsuccess = () => {
        this.log(`[SUCCESS] Added font: ${fontName}`);
        resolve(`Added font: ${fontName}`);
      };

      addRequest.onerror = (event) => {
        this.log(`[ERROR] Failed to add font: ${event.target.error}`, true);
        reject(`Failed to add font: ${event.target.error}`);
      };
    });
  }

  async get({ projectId, fontName } = {}) {
    if (!projectId || !fontName) {
      this.log("[ERROR] projectId and fontName are required.", true);
      return Promise.reject("projectId and fontName are required.");
    }

    await this.ready;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["fonts"], "readonly");
      const store = transaction.objectStore("fonts");
      const index = store.index("projectId_fontName");
      const request = index.get([projectId, fontName]);

      request.onsuccess = () => {
        const font = request.result;
        if (font && !font.deleted) {
          resolve(font);
        } else {
          this.log("[ERROR] Font not found or deleted", true);
          reject("Font not found or deleted");
        }
      };

      request.onerror = (event) => {
        this.log("[ERROR] Error retrieving font", true);
        reject(event.target.error);
      };
    });
  }

  async getAll({ projectId } = {}) {
    if (!projectId) {
      this.log("[ERROR] projectId is required.", true);
      return Promise.reject("projectId is required.");
    }

    await this.ready;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["fonts"], "readonly");
      const store = transaction.objectStore("fonts");
      const index = store.index("projectId");
      const request = index.getAll(projectId);

      request.onsuccess = () => {
        const fonts = request.result.filter(f => !f.deleted);
        resolve(fonts);
      };

      request.onerror = (event) => {
        this.log("[ERROR] Error retrieving fonts", true);
        reject(event.target.error);
      };
    });
  }

  async update({ 
    projectId, 
    fontTag, 
    newFontTag = this.SKIP,
    newFontName = this.SKIP,
    newOrderIndex = this.SKIP
  } = {}) {
    if (!projectId || !fontTag) {
      this.log("[ERROR] projectId and fontTag are required.", true);
      return Promise.reject("projectId and fontTag are required.");
    }
  
    await this.ready;
  
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["fonts"], "readwrite");
      const store = transaction.objectStore("fonts");
      const index = store.index("projectId_fontTag");
      const getRequest = index.get([projectId, fontTag]);
  
      getRequest.onsuccess = () => {
        const existingFont = getRequest.result;
  
        if (!existingFont || existingFont.deleted) {
          this.log("[ERROR] Font not found or already deleted", true);
          return reject("Font not found or already deleted");
        }
  
        // Use sanitizeForUpdate to filter valid fields
        const sanitizedUpdates = this.sanitizeForUpdate({
          fontTag: newFontTag,
          fontName: newFontName,
          orderIndex: newOrderIndex,
        });
  
        const updatedFont = { ...existingFont, ...sanitizedUpdates };
  
        const putRequest = store.put(updatedFont);
  
        putRequest.onsuccess = () => {
          this.log(`[SUCCESS] Font updated: ${fontTag}`);
          resolve("Font updated successfully");
        };
  
        putRequest.onerror = (event) => {
          this.log("[ERROR] Error updating font", true);
          reject(event.target.error);
        };
      };
  
      getRequest.onerror = (event) => {
        this.log("[ERROR] Failed to retrieve font for update", true);
        reject(event.target.error);
      };
    });
  }
  
  async delete({ projectId, fontName } = {}) {
    if (!projectId || !fontName) {
      this.log("[ERROR] projectId and fontName are required.", true);
      return Promise.reject("projectId and fontName are required.");
    }

    await this.ready;

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(["fonts"], "readwrite");
      const store = transaction.objectStore("fonts");
      const index = store.index("projectId_fontName");
      const getRequest = index.get([projectId, fontName]);

      getRequest.onsuccess = () => {
        const fontRecord = getRequest.result;

        if (!fontRecord || fontRecord.deleted) {
          this.log("[ERROR] Font not found or already deleted", true);
          return reject("Font not found or already deleted");
        }

        // Soft delete
        fontRecord.deleted = true;
        fontRecord.deletedAt = Date.now();

        const putRequest = store.put(fontRecord);

        putRequest.onsuccess = () => resolve("Font deleted (soft) successfully");

        putRequest.onerror = (event) => {
          this.log("[ERROR] Failed to mark font as deleted", true);
          reject(event.target.error);
        };
      };

      getRequest.onerror = (event) => {
        this.log("[ERROR] Failed to retrieve font for deletion", true);
        reject(event.target.error);
      };
    });
  }
}

export default FontModel;
