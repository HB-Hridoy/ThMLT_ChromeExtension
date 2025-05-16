export default class SemanticCache {
  #semantics = new Map();
  #themeCache;

  constructor() {
    this.#themeCache = new ThemeCache(this.#semantics);
  }

  add({ id, name, ...rest } = {}) {
    if (!id || typeof name !== "string") {
      console.error("Error: Invalid id or name");
      return;
    }

    const sid = String(id);

    if (this.#semantics.has(sid)) {
      console.error(`Error: Semantic with id "${sid}" already exists.`);
      return;
    }

    const entry = { name };

    for (const theme in rest) {
      if (this.#themeCache.exist(theme)) {
        entry[theme] = rest[theme];
      }
    }

    this.#semantics.set(sid, entry);
  }

  update({ id, updates = {} } = {}) {
    const sid = String(id);
    if (!this.#semantics.has(sid)) return false;
    const current = this.#semantics.get(sid);
    this.#semantics.set(sid, { ...current, ...updates });
    return true;
  }

  delete({ id }) {
    return this.#semantics.delete(String(id));
  }

  get({ id }) {
    return this.#semantics.get(String(id)) || null;
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
  

  getThemeValue({ id, theme }) {
    if (!this.#themeCache.exist(theme)) return null;
    const item = this.#semantics.get(String(id));
    return item ? item[theme] ?? item.value ?? null : null;
  }

  setThemeValue({ id, theme, themeValue }) {
    if (!this.#semantics.has(String(id)) || !this.#themeCache.exist(theme)) return false;
    const item = this.#semantics.get(String(id));
    item[theme] = themeValue;
    return true;
  }

  removeThemeValue({ id, theme }) {
    if (!this.#semantics.has(String(id)) || !this.#themeCache.exist(theme)) return false;
    const item = this.#semantics.get(String(id));
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

  theme() {
    return this.#themeCache;
  }

  generateSampleData() {
    const themes = ["light", "dark", "highContrast"];
    themes.forEach(theme => this.theme().add(theme));
  
    for (let i = 1; i <= 20; i++) {
      const id = i;
      const name = `Sample ${i}`;
      const entry = {
        id,
        name,
        value: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`
      };
  
      for (const theme of themes) {
        entry[theme] = `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')}`;
      }
  
      this.add(entry);
    }
  }
  
}


class ThemeCache {
  #themes = new Set();
  #semanticsRef;

  constructor(semanticsMap) {
    this.#semanticsRef = semanticsMap;
  }

  add(themeName) {
    if (!themeName || typeof themeName !== "string") {
      console.error("Invalid theme name");
      return;
    }
    this.#themes.add(themeName);
  }

  delete(themeName) {
    if (!this.#themes.has(themeName)) return false;

    this.#themes.delete(themeName);

    // Also remove theme from all semantic entries
    for (const entry of this.#semanticsRef.values()) {
      if (themeName in entry) {
        delete entry[themeName];
      }
    }

    return true;
  }

  exist(themeName) {
    return this.#themes.has(themeName);
  }

  getAll() {
    return Array.from(this.#themes);
  }
  clear() {
    this.#themes.clear();
  }
}
