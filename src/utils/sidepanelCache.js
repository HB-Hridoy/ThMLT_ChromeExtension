
class SidepanelCache {
  constructor(){

    this.themeModes = [];
    this._defaultThemeMode = "";

    this.semanticNames = new Set();
    this.semantics = new Map();

    this.primitiveNames = [];
    this.primitives = new Map();

    this.fontTags = [];
    this.fonts = new Map();

    this._activeProjectId = "";
    this.projects = [];
  }
  

  get activeProjectId() {
    return this._activeProjectId;
  }
  set activeProjectId(projectId) {
    this._activeProjectId = projectId;
  }

  addProject(projectId) {
    if (!this.projects.includes(projectId)) {
      this.projects.push(projectId);
    }
  }

  deleteProject(projectId) {
    const index = this.projects.indexOf(projectId);
    if (index !== -1) {
      this.projects.splice(index, 1);
    }
  }

  isProjectExist(projectId) {
    return this.projects.includes(projectId);
  }

  getAllProjects() {
    return [...this.projects];
  }

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

    if (
      newLinkedPrimitive !== "@default" &&
      this.semantics.has(themeMode)
    ) {
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

  addPrimitive(primitiveName, primitiveValue) {
    if (!this.primitives.has(primitiveName)) {
      this.primitives.set(primitiveName, primitiveValue);
      this.primitiveNames.push(primitiveName);
    }
  }

  getPrimitiveValue(primitiveName) {
    return this.primitives.has(primitiveName)
      ? this.primitives.get(primitiveName)
      : null;
  }

  getAllPrimitives() {
    return Array.from(this.primitives.entries());
  }

  getAllPrimitiveNames() {
    return [...this.primitiveNames];
  }

  renamePrimitive(oldPrimitiveName, newPrimitiveName) {
    if (this.primitives.has(oldPrimitiveName)) {
      const value = this.primitives.get(oldPrimitiveName);
      this.deletePrimitive(oldPrimitiveName);
      this.addPrimitive(newPrimitiveName, value);
    }
  }

  updatePrimitive(primitiveName, newPrimitiveName, newPrimitiveValue) {
    if (!this.primitives.has(primitiveName)) {
      return;
    }

    if (newPrimitiveName !== "@default" || newPrimitiveValue !== "@default") {
      const updatedName =
        newPrimitiveName !== "@default" ? newPrimitiveName : primitiveName;
      const updatedValue =
        newPrimitiveValue !== "@default"
          ? newPrimitiveValue
          : this.primitives.get(primitiveName);

      this.deletePrimitive(primitiveName);
      this.addPrimitive(updatedName, updatedValue);
    }
  }

  deletePrimitive(primitiveName) {
    if (this.primitives.has(primitiveName)) {
      this.primitives.delete(primitiveName);
      this.primitiveNames = this.primitiveNames.filter(
        (name) => name !== primitiveName
      );
    }
  }

  isPrimitiveExist(primitiveName) {
    return this.primitives.has(primitiveName);
  }

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
      console.log(`Font with tag ${fontTag} not found.`);
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
      console.log(`Font with tag ${fontTag} not found in cache.`);
    }
  }

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
