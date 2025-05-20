import DatabaseModel from "./DatabaseModel.js";
import cacheManager from "../utils/cache/cacheManager.js";

class FontModel extends DatabaseModel{
  constructor() {
    super();
    console.log("[DB] [INFO] FontModel initialized");
  }

  async create({ projectId, fontName, fontValue, orderIndex = 0 } = {}) {
    if (!projectId) {
      console.error("[DB] projectId is required");
      throw new Error("projectId is required");
    }

    const newFontData = {
                          projectId,
                          fontName,
                          fontValue,
                          orderIndex
                        };

    try {
      const fontId = await this.db.fonts.add(newFontData);

      newFontData.fontId = fontId;

      cacheManager.fonts.add({ fontData: newFontData});
      
      console.log(`[DB] [SUCCESS] Added font: ${fontName}`);
      return fontId;
    } catch (error) {
      console.error(`[DB] Failed to add font: ${error.message}`);
    }
  }

  async get({ projectId, fontId } = {}) {
    if (!projectId || !fontId) {
      console.error("[DB] projectId and fontId are required.");
    }

    try {
      const font = await this.db.fonts
        .where(["projectId", "fontId"])
        .equals([projectId, fontId])
        .first();
      
      if (!font) {
        console.error(`[DB] Font not found. Font id - ${fontId}`);
      }
      
      return font;
    } catch (error) {
      console.error("[DB] Error retrieving font:", error);
    }
  }

  async getAll({ projectId }) {
    if (!projectId) {
      console.error("[DB] projectId is required.");
    }

    try {
      const fontsData = await this.db.fonts
        .where("projectId")
        .equals(projectId)
        .toArray();
      
      cacheManager.fonts.addBulk({ fontsDataArray: fontsData });

      return fontsData;
    } catch (error) {
      console.error("[DB] Error retrieving fonts:", error);
    }
  }

  async update({ fontId, updatedFields }) {
    if (!fontId || typeof updatedFields !== "object") {
      console.error("[DB] Both fontId and updatedFields are required.");
      return;
    }
  
    const numericFontId = Number(fontId);
  
    if (isNaN(numericFontId)) {
      console.error(`[DB] Invalid fontId: ${fontId}`);
      return;
    }
  
    try {
      const updatedCount = await this.db.fonts.update(numericFontId, {
        ...updatedFields
      });
  
      if (updatedCount === 0) {
        console.warn(`[DB] No font found with ID: ${numericFontId}`);
      } else {
        cacheManager.fonts.update({ fontId: numericFontId, updatedFields });
        console.log(`[DB] [SUCCESS] Updated font with ID: ${numericFontId}`);
      }
  
      return updatedCount;
    } catch (error) {
      console.error(`[DB] Failed to update font with ID: ${numericFontId}`, error);
    }
  }
  

  
  async delete({ fontId }) {
    if (!fontId) {
      console.error("[DB] fontId is required.");
      return;
    }
  
    const numericFontId = Number(fontId);
    if (isNaN(numericFontId)) {
      console.error("[DB] Invalid fontId:", fontId);
      return;
    }
  
    try {
      await this.db.fonts.delete(numericFontId);

      console.log(`[DB] [SUCCESS] Deleted font: ${cacheManager.fonts.getName({ fontId: numericFontId })}`);
      cacheManager.fonts.delete({ fontId: numericFontId });
  
      return "Font delete attempted";
    } catch (error) {
      console.error("[DB] Failed to delete font:", error);
    }
  }
  
}

export default FontModel;
