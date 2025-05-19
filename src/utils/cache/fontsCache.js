
export default class FontsCache{
  constructor(){
    super();
    this.fontsMap = new Map();
    this.nameMap = new Map();
  }

  add({ fontData }) {
    const { fontName, fontValue, fontId } = fontData;
    
    if (!this.fontsMap.has(fontId)) {
      this.fontsMap.set(fontId, fontData);
      this.nameMap.set(fontName, fontData);
      console.log(`[CACHE] [SUCCESS] Added font: ${fontName} with value: ${fontValue}`);
    }
  }

  addBulk({ fontsDataArray }) {
    if (!Array.isArray(fontsDataArray)) {
      console.log("[CACHE] [ERROR] addBulk failed: fontsDataArray is not an array.");
      return;
    }

    // Clear the current Maps and add new ones
    this.fontsMap.clear();
    this.nameMap.clear();

    fontsDataArray.forEach(f => {
      this.fontsMap.set(Number(f.fontId), f);
      this.nameMap.set(f.fontName, f);
    });

    console.log(`[CACHE] [SUCCESS] Replaced all fonts with new data (${this.fontsMap.size})`);
  }

  getById({ fontId }) {
    fontId = Number(fontId);
    const fontData = this.fontsMap.get(fontId);
  
    if (!fontData) {
      console.error(`[CACHE] Font with ID ${fontId} not found.`);
      return null;
    }
  
    return fontData;
  }
  

  getValue({ fontId }) {
    fontId = Number(fontId);
    const fontData = this.fontsMap.get(fontId);

    if (!fontData) {
      console.error(`[CACHE] Font with ID ${fontId} not found.`);
      return null;
    }

    return fontData.fontValue;
  }

  getName({ fontId }) {

    fontId = Number(fontId);
    const fontData = this.fontsMap.get(fontId);

    if (!fontData) {
      console.error(`[CACHE] Font with ID ${fontId} not found.`);
      return null;
    }

    return fontData.fontName;
  }

  getValueByName({ fontName }) {
    const fontData = this.nameMap.get(fontName);

    if (!font) {
      console.error(`[CACHE] Font with name "${fontName}" not found.`);
      return null;
    }

    return fontData.fontValue;
  }

  getAll() {
    return Array.from(this.fontsMap.values());
  }

  getAllNames() {
    return Array.from(this.nameMap.keys());
  }

  isExist({ fontName }) {
    return this.nameMap.has(fontName);
  }

  update({ fontId, newFontName, newFontValue}) {
    fontId = Number(fontId);
    const fontData = this.fontsMap.get(fontId);
    if (!fontData) return console.error(`[CACHE] Font with ID ${fontId} not found for updating`);

    if (fontName) {

      const oldPrimitiveName = fontData.fontName;

      this.nameMap.delete(fontData.fontName);
      fontData.fontName = fontName;
      this.nameMap.set(fontName, fontData);

      console.log(`[CACHE] [SUCCESS] Renamed font: ${oldPrimitiveName} → ${newFontName}`);
    }

    if (newFontValue) {
      const oldFontValue = fontData.fontValue;

      fontData.fontValue = newFontValue;

      console.log(`[CACHE] [SUCCESS] Font value updated: ${oldFontValue} → ${newFontValue}`);
      
    }

  }

  delete({ fontId }) {
    fontId = Number(fontId);
    const fontData = this.fontsMap.get(fontId);
    if (fontData) {
      this.fontsMap.delete(fontId);
      this.nameMap.delete(fontData.fontName); 
  
      console.log(`[CACHE] [SUCCESS] Deleted font: ${fontData.fontName}`);
    }
  }

  deleteByName({ fontName }) {
    const fontData = this.nameMap.get(fontName);
    if (fontData) {
      this.fontsMap.delete(fontData.fontId);
      this.nameMap.delete(fontName); 
  
      console.log(`[CACHE] [SUCCESS] Deleted font: ${fontName}`);
    }
  }

  clear(){
    this.fontsMap.clear();
    this.nameMap.clear();
    console.log("[CACHE] [INFO] Cleared all fonts cache");
  }
}
