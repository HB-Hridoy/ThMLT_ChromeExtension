

class SidepanelCache {
  constructor() {
    this.themeModes = [];
    this._defaultThemeMode = "";

    this.semanticNames = new Set();
    this.semantics = new Map();

    this.primitiveNames = [];
    this.primitives = [];

    this.fontTags = [];
    this.fonts = new Map();

    this._activeProjectId = "";
    this._activeProject = {};
    this._activeProjectName = "";
    this.projects = [];

    this.SKIP = "@skip";
    this.debug = true;
  }

  log(message, isError = false) {
    if (this.debug) {
      isError ? console.error(message) : console.log(message);
    }
  }

  setDebugMode(enabled) {
    this.debug = enabled;
    this.log(`[CACHE] Debug mode set to: ${enabled}`);
  }

 

  

  // ========== THEME MODE BEGIN ========== //

  addNewThemeMode(themeMode) {
    if (!this.themeModes.includes(themeMode)) {
      this.themeModes.push(themeMode);
    }
  }

  getAllThemeModes() {
    return this.themeModes;
  }

  renameThemeMode(oldThemeMode, newThemeMode) {
    this.deleteThemeMode(oldThemeMode);
    this.addNewThemeMode(newThemeMode);
  }

  deleteThemeMode(themeMode) {
    this.themeModes = this.themeModes.filter((item) => item !== themeMode);
  }

  isThemeModeExist(themeMode) {
    return this.themeModes.includes(themeMode);
  }

  get defaultThemeMode() {
    return this._defaultThemeMode;
  }

  set defaultThemeMode(themeMode) {
    this._defaultThemeMode = themeMode;
  }

  // ========== THEME MODE ENDS ========== //

  // ========== SEMANTIC BEGIN ========== //

  addSemantic(semanticName, themeMode, semanticValue) {
    if (!this.semantics.has(themeMode)) {
      this.semantics.set(themeMode, {});
    }
    this.semantics.get(themeMode)[semanticName] = semanticValue;
    this.semanticNames.add(semanticName);
  }

  getAllSemanticNames() {
    return Array.from(this.semanticNames);
  }

  getAllSemantics() {
    return this.semantics;
  }

  getSemanticValueForThemeMode(semanticName, themeMode) {
    if (this.semantics.has(themeMode)) {
      const themeData = this.semantics.get(themeMode);
      return themeData[semanticName] || null;
    }
    return null;
  }

  updateSemantic(
    semanticName,
    newSemanticName = "@default",
    themeMode,
    newLinkedPrimitive = "@default"
  ) {
    if (!this.semanticNames.has(semanticName)) {
      return;
    }

    if (newLinkedPrimitive !== "@default" && this.semantics.has(themeMode)) {
      const themeData = this.semantics.get(themeMode);
      if (themeData.hasOwnProperty(semanticName)) {
        themeData[semanticName] = newLinkedPrimitive;
      }
    }

    if (newSemanticName !== "@default") {
      for (const [themeMode, themeData] of this.semantics.entries()) {
        if (themeData.hasOwnProperty(semanticName)) {
          const value = themeData[semanticName];
          delete themeData[semanticName];
          themeData[newSemanticName] = value;
        }
      }
      this.semanticNames.delete(semanticName);
      this.semanticNames.add(newSemanticName);
    }
  }

  deleteSemantic(semanticName) {
    if (this.semanticNames.has(semanticName)) {
      for (const [themeMode, themeData] of this.semantics.entries()) {
        if (themeData.hasOwnProperty(semanticName)) {
          delete themeData[semanticName];
        }
      }
      this.semanticNames.delete(semanticName);
      return true;
    }
    return false;
  }

  deleteSemanticForThemeMode(semanticName, themeMode) {
    if (this.semantics.has(themeMode)) {
      const themeData = this.semantics.get(themeMode);
      if (themeData.hasOwnProperty(semanticName)) {
        delete themeData[semanticName];
        let isUsedElsewhere = false;
        for (const data of this.semantics.values()) {
          if (data.hasOwnProperty(semanticName)) {
            isUsedElsewhere = true;
            break;
          }
        }
        if (!isUsedElsewhere) {
          this.semanticNames.delete(semanticName);
        }
        return true;
      }
    }
    return false;
  }

  isSemanticExist(semanticName) {
    return this.semanticNames.has(semanticName);
  }

  isSemanticExistInThemeMode(semanticName, themeMode) {
    if (this.semantics.has(themeMode)) {
      const themeData = this.semantics.get(themeMode);
      return themeData.hasOwnProperty(semanticName);
    }
    return false;
  }

  // ========== SEMANTIC ENDS ========== //

  // ========== FONT BEGIN ========== //

  // 🔹 Add a font with its tag and short tag
  addFont(fontTag, shortFontTag, fontName) {
    if (!this.fonts.has(fontTag)) {
      this.fonts.set(fontTag, fontName);
      this.fontTags.push(fontTag);
    }
  }

  updateFont(
    fontTag,
    newFontTag = "@default",
    newShortFontTag = "@default",
    newFontName = "@default"
  ) {
    if (!this.fonts.has(fontTag)) {
      this.log(`Font with tag ${fontTag} not found.`);
      return;
    }

    let index = this.fontTags.indexOf(fontTag);
    let updatedFontTag = newFontTag !== "@default" ? newFontTag : fontTag;
    let updatedFontName =
      newFontName !== "@default" ? newFontName : this.fonts.get(fontTag);

    // Update data
    this.fonts.delete(fontTag);
    this.fonts.set(updatedFontTag, updatedFontName);
    this.fontTags[index] = updatedFontTag;
  }

  isFontTagExist(fontTag) {
    return this.fontTags.includes(fontTag);
  }

  // 🔹 Get all stored fonts as an array of objects
  getAllFonts() {
    return this.fontTags.map((tag) => ({
      fontTag: tag,
      shortFontTag: this.getshortFontTag(tag),
      fontName: this.getFontName(tag),
    }));
  }

  // 🔹 Get font name from font tag
  getFontName(fontTag) {
    return this.fonts.get(fontTag) || null;
  }

  // 🔹 Get all font tags
  getFontTags() {
    return [...this.fontTags];
  }

  // 🔹 Get all font names
  getFontNames() {
    return Array.from(this.fonts.values());
  }

  // 🔹 Delete a font by font tag
  deleteFont(fontTag) {
    const index = this.fontTags.indexOf(fontTag);
    if (index !== -1) {
      this.fontTags.splice(index, 1);
      this.fonts.delete(fontTag);
    } else {
      this.log(`Font with tag ${fontTag} not found in cache.`);
    }
  }

  // ========== FONT ENDS ========== //

  clearCache() {
    this._activeProject = "";
    this.themeModes = [];
    this.semanticNames.clear();
    this.semantics.clear();
    this.primitiveNames = [];
    this.primitives.clear();
    this.projects = [];
  }
}



export default new SidepanelCache();
