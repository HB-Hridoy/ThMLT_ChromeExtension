import { semanticTable } from "../semanticTable.js";

export default class SemanticCache {
  #semantics = new Map();
  #themeCache;

  constructor() {
    this.#themeCache = new ThemeCache(this.#semantics);
  }

  add({ semanticId, semanticName, ...rest } = {}) {
    if (!semanticId || typeof semanticName !== "string") {
      console.error("Error: Invalid semanticId or semanticName");
      return;
    }

    const sid = String(semanticId);

    if (this.#semantics.has(sid)) {
      console.error(`Error: Semantic with id "${sid}" already exists.`);
      return;
    }

    const entry = { semanticName };

    for (const theme in rest) {
      if (this.#themeCache.exist({
        themeName: theme
      })) {
        entry[theme] = rest[theme];
      }
    }

    this.#semantics.set(sid, entry);
  }

  update({ semanticId, updates = {} } = {}) {
    const sid = String(semanticId);
    if (!this.#semantics.has(sid)) return false;
    const current = this.#semantics.get(sid);
    this.#semantics.set(sid, { ...current, ...updates });
    return true;
  }

  delete({ semanticId }) {
    return this.#semantics.delete(String(semanticId));
  }

  get({ semanticId }) {
    return this.#semantics.get(String(semanticId)) || null;
  }

  getName({ semanticId }) {
    const entry = this.#semantics.get(String(semanticId));
    return entry ? entry.semanticName || null : null;
  }

  getNames() {
    const names = [];
    for (const entry of this.#semantics.values()) {
      if (typeof entry.name === "string") {
        names.push(entry.name);
      }
    }
    return names;
  }
  

  getThemeValue({ semanticId, theme }) {
    if (!this.#themeCache.exist({
      themeName: theme
    })) return null;
    const item = this.#semantics.get(String(semanticId));
    return item ? item[theme] ?? item.value ?? null : null;
  }

  setThemeValue({ semanticId, theme, value }) {
    if (!this.#semantics.has(String(semanticId)) || !this.#themeCache.exist({ themeName: theme })) return false;
    const item = this.#semantics.get(String(semanticId));
    item[theme] = value;
    return true;
  }

  removeThemeValue({ semanticId, theme }) {
    if (!this.#semantics.has(String(semanticId)) || !this.#themeCache.exist({ themeName: theme })) return false;
    const item = this.#semantics.get(String(semanticId));
    if (theme in item) {
      delete item[theme];
      return true;
    }
    return false;
  }

  getAll() {
    const result = {};
    for (const [id, data] of this.#semantics.entries()) {
      result[id] = { ...data };
    }
    return result;
  }

  clear() {
    this.#semantics.clear();
    this.theme().clear();
  }

  exists({ id }) {
    return this.#semantics.has(String(id));
  }

  isEmpty(){
    return this.#semantics.size === 0;
  }

  nameExists({ semanticName }) {
    for (const entry of this.#semantics.values()) {
        if (entry.semanticName === semanticName) {
            return true;
        }
    }
    return false;
}

  theme() {
    return this.#themeCache;
  }
  
}


class ThemeCache {
  #themes = new Map();
  #semanticsRef;

  constructor(semanticsMap) {
    this.#semanticsRef = semanticsMap;
    this.defaultThemeMode = "";
  }

  add({ themeName }) {
    if (!themeName || typeof themeName !== "string") {
      console.error("Invalid theme name");
      return;
    }

    const key = themeName.toLowerCase();
    if (this.#themes.has(key)) {
      console.warn(`Theme "${themeName}" already exists (case-insensitive).`);
      return;
    }

    this.#themes.set(key, themeName);

    for (const entry of this.#semanticsRef.values()) {
      if (!(themeName in entry)) {
        entry[themeName] = semanticTable.defaultValue;
      }
    }
  }

  delete({ themeName }) {
    const key = themeName.toLowerCase();
    const actualName = this.#themes.get(key);
    if (!actualName) return false;

    this.#themes.delete(key);

    for (const entry of this.#semanticsRef.values()) {
      delete entry[actualName];
    }

    return true;
  }

  exist({ themeName }) {
    return this.#themes.has(themeName.toLowerCase());
  }

  getAll() {
    return Array.from(this.#themes.values());
  }

  rename({ oldThemeName, newThemeName }) {
    const oldKey = oldThemeName.toLowerCase();
    const newKey = newThemeName.toLowerCase();
  
    const actualOldName = this.#themes.get(oldKey);
    if (!actualOldName) {
      console.error(`Theme "${oldThemeName}" does not exist.`);
      return false;
    }
  
    if (!newThemeName || typeof newThemeName !== "string") {
      console.error("Invalid new theme name.");
      return false;
    }
  
    if (this.#themes.has(newKey)) {
      console.error(`Theme "${newThemeName}" already exists.`);
      return false;
    }
  
    // Build a new Map with renamed key at the same position
    const updatedThemes = new Map();
    for (const [key, value] of this.#themes.entries()) {
      if (key === oldKey) {
        updatedThemes.set(newKey, newThemeName); // rename
      } else {
        updatedThemes.set(key, value); // preserve others
      }
    }
  
    this.#themes = updatedThemes;
  
    // Update semantic entries
    for (const entry of this.#semanticsRef.values()) {
      if (actualOldName in entry) {
        entry[newThemeName] = entry[actualOldName];
        delete entry[actualOldName];
      }
    }
  
    return true;
  }
  

  clear() {
    this.#themes.clear();
  }
}

