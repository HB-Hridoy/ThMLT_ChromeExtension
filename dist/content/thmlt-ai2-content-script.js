async function createShadowRoot() {
  const shadowHost = document.createElement("div");
  shadowHost.id = "ThMLTShadowDOM";
  document.body.appendChild(shadowHost);
  const root = shadowHost.attachShadow({ mode: "open" });
  try {
    const response = await fetch(chrome.runtime.getURL("src/content/inject/thmlt-content-script.css"));
    let cssText = (await response.text()).replace(/:root/g, ":host");
    const styleElement = document.createElement("style");
    styleElement.textContent = cssText;
    root.appendChild(styleElement);
  } catch (error) {
    console.error("Failed to fetch CSS:", error);
  }
  return root;
}
const AppContext = {
  shadowRoot: null,
  init({ shadowRoot }) {
    this.shadowRoot = shadowRoot;
  },
  getShadowRoot() {
    return this.shadowRoot;
  }
};
async function loadHtmlFragment(path) {
  const extensionUrl = chrome.runtime.getURL(path);
  const res = await fetch(extensionUrl);
  if (!res.ok) {
    throw new Error(`Failed to load HTML fragment from ${extensionUrl}`);
  }
  return await res.text();
}
class ColorsTableManager {
  constructor() {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._currentTheme = null;
    this._currentData = /* @__PURE__ */ new Map();
    this._primitivesMap = /* @__PURE__ */ new Map();
    this._domElements = /* @__PURE__ */ new Map();
    this._selectedRow = null;
    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-colors-table-body");
      if (tableBody) {
        this._tableBody = tableBody;
        observerInstance.disconnect();
        console.log("Color Table body found and stored.");
      }
    });
    observer.observe(this._shadowRoot, {
      childList: true,
      subtree: true
    });
  }
  /**
   * Update primitives data and create lookup map
   */
  updatePrimitives(primitives) {
    this._primitivesMap.clear();
    primitives.forEach((primitive) => {
      this._primitivesMap.set(primitive.primitiveId, primitive);
    });
  }
  /**
   * Get the actual color value for a semantic in the current theme
   */
  getThemeValue(semantic, theme) {
    const themeRef = semantic.themeValues[theme];
    const primitiveId = parseInt(themeRef);
    if (!isNaN(primitiveId) && this._primitivesMap.has(primitiveId)) {
      return this._primitivesMap.get(primitiveId).primitiveValue;
    }
    return themeRef || "#000000";
  }
  /**
   * Create a new table row element
   */
  createRowElement(semantic, theme) {
    const themeValue = this.getThemeValue(semantic, theme);
    const row = document.createElement("tr");
    row.setAttribute("rowId", semantic.semanticId);
    row.innerHTML = `
      <td class="semantic-name">${semantic.semanticName}</td>
      <td>
        <div class="semantic-value-cell">
          <div class="semantic-value-thumbnail" style="background-color: ${themeValue};"></div>
          <div><span class="color-value">${themeValue}</span></div>
        </div>
      </td>
    `;
    row.addEventListener("click", () => {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        color: colorText
      });
    });
    return row;
  }
  /**
   * Update an existing row element
   */
  updateRowElement(row, semantic, theme) {
    const themeValue = this.getThemeValue(semantic, theme);
    const nameCell = row.querySelector(".semantic-name");
    if (nameCell && nameCell.textContent !== semantic.semanticName) {
      nameCell.textContent = semantic.semanticName;
    }
    const thumbnail = row.querySelector(".semantic-value-thumbnail");
    if (thumbnail) {
      const newBgColor = `background-color: ${themeValue};`;
      if (thumbnail.style.cssText !== newBgColor) {
        thumbnail.style.backgroundColor = themeValue;
      }
    }
    const valueSpan = row.querySelector(".color-value");
    if (valueSpan && valueSpan.textContent !== themeValue) {
      valueSpan.textContent = themeValue;
    }
  }
  /**
   * Check if semantic data has changed compared to stored data
   */
  hasSemanticChanged(oldSemantic, newSemantic, theme) {
    if (!oldSemantic) return true;
    return oldSemantic.semanticName !== newSemantic.semanticName || oldSemantic.orderIndex !== newSemantic.orderIndex || oldSemantic.themeValues[theme] !== newSemantic.themeValues[theme];
  }
  /**
   * Insert row at correct position based on orderIndex
   */
  insertRowAtPosition(row, orderIndex) {
    const rows = Array.from(this._tableBody.children);
    let insertIndex = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const existingRowId = parseInt(rows[i].getAttribute("rowId"));
      const existingData = this._currentData.get(existingRowId);
      if (existingData && existingData.orderIndex > orderIndex) {
        insertIndex = i;
        break;
      }
    }
    if (insertIndex >= rows.length) {
      this._tableBody.appendChild(row);
    } else {
      this._tableBody.insertBefore(row, rows[insertIndex]);
    }
  }
  /**
   * Update theme and refresh all displayed values
   */
  setTheme(newTheme) {
    if (this._currentTheme === newTheme) return;
    this._currentTheme = newTheme;
    this._domElements.forEach((row, semanticId) => {
      const semantic = this._currentData.get(semanticId);
      if (semantic) {
        this.updateRowElement(row, semantic, newTheme);
      }
    });
  }
  /**
   * Main render method - handles both initial render and updates
   */
  render(semantics, primitives, defaultTheme = "Light") {
    this.updatePrimitives(primitives);
    this._currentTheme = defaultTheme;
    const sortedSemantics = [...semantics].sort((a, b) => a.orderIndex - b.orderIndex);
    if (this._tableBody.children.length === 0) {
      this.initialRender(sortedSemantics, defaultTheme);
      return;
    }
    this.updateRender(sortedSemantics, defaultTheme);
  }
  /**
   * Initial render when table is empty
   */
  initialRender(sortedSemantics, theme) {
    this._currentData.clear();
    this._domElements.clear();
    const fragment = document.createDocumentFragment();
    sortedSemantics.forEach((semantic) => {
      const row = this.createRowElement(semantic, theme);
      fragment.appendChild(row);
      this._currentData.set(semantic.semanticId, { ...semantic });
      this._domElements.set(semantic.semanticId, row);
    });
    this._tableBody.appendChild(fragment);
  }
  /**
   * Update render with DOM diffing
   */
  updateRender(sortedSemantics, theme) {
    const newDataMap = /* @__PURE__ */ new Map();
    const toAdd = [];
    const toUpdate = [];
    const toRemove = [];
    sortedSemantics.forEach((semantic) => {
      newDataMap.set(semantic.semanticId, semantic);
      const existing = this._currentData.get(semantic.semanticId);
      if (!existing) {
        toAdd.push(semantic);
      } else if (this.hasSemanticChanged(existing, semantic, theme)) {
        toUpdate.push(semantic);
      }
    });
    this._currentData.forEach((existing, semanticId) => {
      if (!newDataMap.has(semanticId)) {
        toRemove.push(semanticId);
      }
    });
    toRemove.forEach((semanticId) => {
      const row = this._domElements.get(semanticId);
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
      this._domElements.delete(semanticId);
      this._currentData.delete(semanticId);
    });
    toUpdate.forEach((semantic) => {
      const row = this._domElements.get(semantic.semanticId);
      if (row) {
        this.updateRowElement(row, semantic, theme);
        this._currentData.set(semantic.semanticId, { ...semantic });
      }
    });
    toAdd.forEach((semantic) => {
      const row = this.createRowElement(semantic, theme);
      this.insertRowAtPosition(row, semantic.orderIndex);
      this._domElements.set(semantic.semanticId, row);
      this._currentData.set(semantic.semanticId, { ...semantic });
    });
    if (toAdd.length > 0) {
      this.reorderIfNeeded(sortedSemantics);
    }
  }
  /**
   * Reorder table rows if needed to maintain orderIndex sort
   */
  reorderIfNeeded(sortedSemantics) {
    const currentRows = Array.from(this._tableBody.children);
    const expectedOrder = sortedSemantics.map((s) => s.semanticId);
    const currentOrder = currentRows.map((row) => parseInt(row.getAttribute("rowId")));
    const needsReorder = !expectedOrder.every((id, index) => id === currentOrder[index]);
    if (needsReorder) {
      const fragment = document.createDocumentFragment();
      expectedOrder.forEach((semanticId) => {
        const row = this._domElements.get(semanticId);
        if (row) {
          fragment.appendChild(row);
        }
      });
      this._tableBody.appendChild(fragment);
    }
  }
  /**
   * Clear all table data
   */
  clear() {
    this._tableBody.innerHTML = "";
    this._currentData.clear();
    this._domElements.clear();
  }
  /**
   * Get current theme
   */
  getCurrentTheme() {
    return this._currentTheme;
  }
  /**
   * Get current semantic data
   */
  getCurrentData() {
    return Array.from(this._currentData.values());
  }
  getSelectedRow() {
    if (this._selectedRow) {
      const nameElement = this._selectedRow.querySelector(".semantic-name");
      return nameElement ? nameElement.textContent : "#";
    }
    return "#";
  }
  setSelectedRow(row) {
    if (this._selectedRow === row) {
      if (this._selectedRow) {
        this._selectedRow.classList.remove("highlight");
      }
      this._selectedRow = null;
    } else {
      if (this._selectedRow) {
        this._selectedRow.classList.remove("highlight");
      }
      this._selectedRow = row;
      if (this._selectedRow) {
        this._selectedRow.classList.add("highlight");
      }
    }
    return this.getSelectedRow();
  }
}
class BaseCache {
  #items;
  #type;
  #idField;
  constructor(type, idField) {
    this.#items = [];
    this.#type = type;
    this.#idField = idField;
  }
  add({ data }) {
    const exists = this.#items.some((item) => item[this.#idField] === data[this.#idField]);
    if (exists) {
      console.log(`[CACHE] Add failed: ${this.#type} with ID ${data[this.#idField]} already exists.`);
      return;
    }
    this.#items.push(data);
    console.log(`[CACHE] Added ${this.#type}:`, data);
  }
  addBulk({ dataArray }) {
    if (!Array.isArray(dataArray)) {
      console.log(`[CACHE] addBulk failed: ${this.#type} array is not an array.`);
      return;
    }
    this.#items = [...dataArray];
    console.log(`[CACHE] Replaced all ${this.#type}s with new data`);
  }
  get({ id }) {
    return this.#items.find((item) => item[this.#idField] === id) || null;
  }
  getAll() {
    return [...this.#items];
  }
  update({ id, updates }) {
    const index = this.#items.findIndex((item) => item[this.#idField] === id);
    if (index === -1) {
      console.log(`[CACHE] [ERROR] Update failed: ${this.#type} with ID ${id} not found.`);
      return null;
    }
    this.#items[index] = { ...this.#items[index], ...updates };
    console.log(`[CACHE] Updated ${this.#type} ${id}:`, this.#items[index]);
    return this.#items[index];
  }
  delete({ id }) {
    const index = this.#items.findIndex((item) => item[this.#idField] === id);
    if (index === -1) {
      console.log(`[CACHE] [ERROR] Delete failed: ${this.#type} with ID ${id} not found.`);
      return null;
    }
    const deleted = this.#items.splice(index, 1)[0];
    console.log(`[CACHE] Deleted ${this.#type} ${id}:`, deleted);
    return deleted;
  }
  isExist({ id }) {
    return this.#items.some((item) => item[this.#idField] === id);
  }
  existName({ name, nameField }) {
    return this.#items.some((item) => item[nameField] === name);
  }
  clear() {
    this.#items.length = 0;
    console.log(`[CACHE] Cleared all ${this.#type}s`);
  }
}
class ContentScriptCacheManager {
  constructor() {
    this.cache = {};
    this.projectCache = new BaseCache("project", "projectId");
    this.primitiveCache = new BaseCache("primitive", "primitiveId");
    this.semanticCache = new BaseCache("semantic", "semanticId");
    this.fontCache = new BaseCache("font", "fontId");
    this.translationCache = new BaseCache("translation", "translationId");
    this.#selectedProjectId = "";
  }
  #selectedProjectId;
  getSelectedProjectId() {
    return this.#selectedProjectId;
  }
  setSelectedProjectId(projectId) {
    this.#selectedProjectId = projectId;
  }
}
const contentScriptCache = new ContentScriptCacheManager();
class FontsTableManager {
  constructor() {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._currentFonts = /* @__PURE__ */ new Map();
    this._domElements = /* @__PURE__ */ new Map();
    this._selectedRow = null;
    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-fonts-table-body");
      if (tableBody) {
        this._tableBody = tableBody;
        observerInstance.disconnect();
        console.log("Color Table body found and stored.");
      }
    });
    observer.observe(this._shadowRoot, {
      childList: true,
      subtree: true
    });
  }
  /**
   * Main method to update the table with new font data
   * @param {Array} newFonts - Array of font objects
   */
  render(newFonts) {
    const sortedFonts = this._sortFontsByOrderIndex(newFonts);
    if (this.isTableEmpty()) {
      this._initialRender(sortedFonts);
    } else {
      this._updateRender(sortedFonts);
    }
  }
  /**
   * Check if table body is empty
   * @returns {boolean}
   */
  isTableEmpty() {
    return this._tableBody.children.length === 0;
  }
  /**
   * Sort fonts by orderIndex
   * @param {Array} fonts - Array of font objects
   * @returns {Array} Sorted array
   */
  _sortFontsByOrderIndex(fonts) {
    return [...fonts].sort((a, b) => a.orderIndex - b.orderIndex);
  }
  /**
   * Initial render when table is empty
   * @param {Array} sortedFonts - Sorted font data
   */
  _initialRender(sortedFonts) {
    const fragment = document.createDocumentFragment();
    sortedFonts.forEach((font) => {
      const row = this._createFontRow(font);
      fragment.appendChild(row);
      this._currentFonts.set(font.fontId, { ...font });
      this._domElements.set(font.fontId, row);
    });
    this._tableBody.appendChild(fragment);
  }
  /**
   * Update render when table has existing content
   * @param {Array} sortedFonts - Sorted font data
   */
  _updateRender(sortedFonts) {
    const newFontsMap = new Map(sortedFonts.map((font) => [font.fontId, font]));
    const currentFontIds = new Set(this._currentFonts.keys());
    const newFontIds = new Set(newFontsMap.keys());
    const toAdd = [...newFontIds].filter((id) => !currentFontIds.has(id));
    const toRemove = [...currentFontIds].filter((id) => !newFontIds.has(id));
    const toUpdate = [...newFontIds].filter(
      (id) => currentFontIds.has(id) && this._hasFontChanged(this._currentFonts.get(id), newFontsMap.get(id))
    );
    this._removeFonts(toRemove);
    this._updateFonts(toUpdate, newFontsMap);
    this._addFonts(toAdd, newFontsMap);
    this._reorderTable(sortedFonts);
    this._currentFonts = newFontsMap;
  }
  /**
   * Check if font data has changed
   * @param {Object} oldFont - Previous font data
   * @param {Object} newFont - New font data
   * @returns {boolean}
   */
  _hasFontChanged(oldFont, newFont) {
    return oldFont.fontName !== newFont.fontName || oldFont.fontValue !== newFont.fontValue || oldFont.orderIndex !== newFont.orderIndex;
  }
  /**
   * Create a new font row element
   * @param {Object} font - Font data
   * @returns {HTMLElement}
   */
  _createFontRow(font) {
    const row = document.createElement("tr");
    row.setAttribute("rowId", font.fontId);
    const nameCell = document.createElement("td");
    nameCell.classList.add("font-name");
    nameCell.textContent = font.fontName;
    const valueCell = document.createElement("td");
    valueCell.classList.add("font-value");
    valueCell.textContent = font.fontValue;
    row.appendChild(nameCell);
    row.appendChild(valueCell);
    row.addEventListener("click", () => {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        font: colorText
      });
    });
    return row;
  }
  /**
   * Remove fonts from table
   * @param {Array} fontIdsToRemove - Array of fontIds to remove
   */
  _removeFonts(fontIdsToRemove) {
    fontIdsToRemove.forEach((fontId) => {
      const row = this._domElements.get(fontId);
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
      this._domElements.delete(fontId);
      this._currentFonts.delete(fontId);
    });
  }
  /**
   * Update existing font rows
   * @param {Array} fontIdsToUpdate - Array of fontIds to update
   * @param {Map} newFontsMap - Map of new font data
   */
  _updateFonts(fontIdsToUpdate, newFontsMap) {
    fontIdsToUpdate.forEach((fontId) => {
      const row = this._domElements.get(fontId);
      const newFont = newFontsMap.get(fontId);
      if (row && newFont) {
        const [nameCell, valueCell] = row.children;
        nameCell.textContent = newFont.fontName;
        valueCell.textContent = newFont.fontValue;
      }
    });
  }
  /**
   * Add new font rows
   * @param {Array} fontIdsToAdd - Array of fontIds to add
   * @param {Map} newFontsMap - Map of new font data
   */
  _addFonts(fontIdsToAdd, newFontsMap) {
    fontIdsToAdd.forEach((fontId) => {
      const font = newFontsMap.get(fontId);
      const row = this._createFontRow(font);
      this._domElements.set(fontId, row);
      this._tableBody.appendChild(row);
    });
  }
  /**
   * Reorder table rows according to orderIndex
   * @param {Array} sortedFonts - Fonts sorted by orderIndex
   */
  _reorderTable(sortedFonts) {
    const fragment = document.createDocumentFragment();
    sortedFonts.forEach((font) => {
      const row = this._domElements.get(font.fontId);
      if (row) {
        fragment.appendChild(row);
      }
    });
    this._tableBody.innerHTML = "";
    this._tableBody.appendChild(fragment);
  }
  /**
   * Get current font data
   * @returns {Array} Current fonts as array
   */
  getCurrentFonts() {
    return Array.from(this._currentFonts.values());
  }
  /**
   * Clear the table
   */
  clear() {
    this._tableBody.innerHTML = "";
    this._currentFonts.clear();
    this._domElements.clear();
  }
  getSelectedRow() {
    if (this._selectedRow) {
      const nameElement = this._selectedRow.querySelector(".font-name");
      return nameElement ? nameElement.textContent : "#";
    }
    return "#";
  }
  setSelectedRow(row) {
    if (this._selectedRow === row) {
      if (this._selectedRow) {
        this._selectedRow.classList.remove("highlight");
      }
      this._selectedRow = null;
    } else {
      if (this._selectedRow) {
        this._selectedRow.classList.remove("highlight");
      }
      this._selectedRow = row;
      if (this._selectedRow) {
        this._selectedRow.classList.add("highlight");
      }
    }
    return this.getSelectedRow();
  }
}
class TranslationsTableManager {
  constructor(tableBodyElement) {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._selectedRow = null;
    this.currentTranslations = /* @__PURE__ */ new Map();
    this.currentRows = /* @__PURE__ */ new Map();
    this.currentDefaultLanguage = null;
    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-translations-table-body");
      if (tableBody) {
        this._tableBody = tableBody;
        observerInstance.disconnect();
        console.log("Translations Table body found and stored.");
      }
    });
    observer.observe(this._shadowRoot, {
      childList: true,
      subtree: true
    });
  }
  /**
   * Main method to render translations with efficient DOM diffing
   * @param {Array} translations - Array of translation objects
   * @param {string} defaultLanguage - Default language for translation values
   */
  render(translations, defaultLanguage = "en") {
    const transformedTranslations = transformTranslations(translations, "tempProjectId");
    const originalDefaultLanguage = translations.DefaultLanguage;
    console.log(originalDefaultLanguage);
    translations = transformedTranslations;
    defaultLanguage = originalDefaultLanguage;
    if (!translations || !Array.isArray(translations)) {
      console.warn("Invalid translations data provided");
      return;
    }
    const sortedTranslations = [...translations].sort((a, b) => a.orderIndex - b.orderIndex);
    const newTranslationsMap = new Map(
      sortedTranslations.map((t) => [t.translationId, t])
    );
    const languageChanged = this.currentDefaultLanguage !== null && this.currentDefaultLanguage !== defaultLanguage;
    if (this._tableBody.children.length === 0) {
      this._initialRender(sortedTranslations, defaultLanguage);
      this._updateInternalState(newTranslationsMap, defaultLanguage);
      return;
    }
    this._updateRender(newTranslationsMap, sortedTranslations, defaultLanguage, languageChanged);
    this._updateInternalState(newTranslationsMap, defaultLanguage);
  }
  /**
   * Initial render when table body is empty
   * @param {Array} sortedTranslations - Sorted translation objects
   * @param {string} defaultLanguage - Default language
   */
  _initialRender(sortedTranslations, defaultLanguage) {
    const fragment = document.createDocumentFragment();
    sortedTranslations.forEach((translation) => {
      const row = this._createRowElement(translation, defaultLanguage);
      fragment.appendChild(row);
      this.currentRows.set(translation.translationId, row);
    });
    this._tableBody.appendChild(fragment);
  }
  /**
   * Update render with DOM diffing
   * @param {Map} newTranslationsMap - New translations as Map
   * @param {Array} sortedTranslations - Sorted translation objects for ordering
   * @param {string} defaultLanguage - Default language
   * @param {boolean} languageChanged - Whether the default language changed
   */
  _updateRender(newTranslationsMap, sortedTranslations, defaultLanguage, languageChanged) {
    const existingIds = new Set(this.currentTranslations.keys());
    const newIds = new Set(newTranslationsMap.keys());
    const toAdd = [...newIds].filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !newIds.has(id));
    const toCheck = [...newIds].filter((id) => existingIds.has(id));
    this._removeTranslations(toRemove);
    this._updateExistingTranslations(toCheck, newTranslationsMap, defaultLanguage, languageChanged);
    this._addNewTranslations(toAdd, newTranslationsMap, defaultLanguage);
    this._ensureCorrectOrdering(sortedTranslations);
  }
  /**
   * Remove translations that are no longer present
   * @param {Array} translationIds - IDs of translations to remove
   */
  _removeTranslations(translationIds) {
    translationIds.forEach((id) => {
      const row = this.currentRows.get(id);
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
      this.currentRows.delete(id);
    });
  }
  /**
   * Update existing translations if they have changed
   * @param {Array} translationIds - IDs to check for updates
   * @param {Map} newTranslationsMap - New translation data
   * @param {string} defaultLanguage - Default language
   * @param {boolean} languageChanged - Whether the default language changed
   */
  _updateExistingTranslations(translationIds, newTranslationsMap, defaultLanguage, languageChanged) {
    translationIds.forEach((id) => {
      const currentTranslation = this.currentTranslations.get(id);
      const newTranslation = newTranslationsMap.get(id);
      const row = this.currentRows.get(id);
      if (!row || !currentTranslation || !newTranslation) return;
      if (languageChanged || this._hasTranslationChanged(currentTranslation, newTranslation, defaultLanguage)) {
        this._updateRowElement(row, newTranslation, defaultLanguage);
      }
    });
  }
  /**
   * Add new translations
   * @param {Array} translationIds - IDs of new translations
   * @param {Map} newTranslationsMap - New translation data
   * @param {string} defaultLanguage - Default language
   */
  _addNewTranslations(translationIds, newTranslationsMap, defaultLanguage) {
    const fragment = document.createDocumentFragment();
    translationIds.forEach((id) => {
      const translation = newTranslationsMap.get(id);
      if (translation) {
        const row = this._createRowElement(translation, defaultLanguage);
        fragment.appendChild(row);
        this.currentRows.set(id, row);
      }
    });
    if (fragment.children.length > 0) {
      this._tableBody.appendChild(fragment);
    }
  }
  /**
   * Ensure rows are in correct order based on orderIndex
   * @param {Array} sortedTranslations - Correctly sorted translations
   */
  _ensureCorrectOrdering(sortedTranslations) {
    let hasOrderChanged = false;
    const currentOrder = Array.from(this._tableBody.children).map(
      (row) => parseInt(row.getAttribute("rowId"))
    );
    const expectedOrder = sortedTranslations.map((t) => t.translationId);
    if (currentOrder.length !== expectedOrder.length || !currentOrder.every((id, index) => id === expectedOrder[index])) {
      hasOrderChanged = true;
    }
    if (hasOrderChanged) {
      const fragment = document.createDocumentFragment();
      expectedOrder.forEach((id) => {
        const row = this.currentRows.get(id);
        if (row) {
          fragment.appendChild(row);
        }
      });
      this._tableBody.appendChild(fragment);
    }
  }
  /**
   * Create a new row element for a translation
   * @param {Object} translation - Translation object
   * @param {string} defaultLanguage - Default language
   * @returns {HTMLElement} - Row element
   */
  _createRowElement(translation, defaultLanguage) {
    const row = document.createElement("tr");
    row.setAttribute("rowId", translation.translationId);
    row.setAttribute("translationLanguage", defaultLanguage);
    const translationValue = this._getTranslationValue(translation, defaultLanguage);
    row.innerHTML = `
      <td class="translation-name">${this._escapeHtml(translation.translationName)}</td>
      <td class="translationValue">${this._escapeHtml(translationValue)}</td>
    `;
    row.addEventListener("click", () => {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        translation: colorText
      });
    });
    return row;
  }
  /**
   * Update an existing row element
   * @param {HTMLElement} row - Row element to update
   * @param {Object} translation - New translation data
   * @param {string} defaultLanguage - Default language
   */
  _updateRowElement(row, translation, defaultLanguage) {
    row.setAttribute("translationLanguage", defaultLanguage);
    const nameCell = row.querySelector(".translation-name");
    const valueCell = row.querySelector(".translationValue");
    const translationValue = this._getTranslationValue(translation, defaultLanguage);
    if (nameCell) {
      nameCell.textContent = translation.translationName;
    }
    if (valueCell) {
      valueCell.textContent = translationValue;
    }
  }
  /**
   * Get translation value for the default language
   * @param {Object} translation - Translation object
   * @param {string} defaultLanguage - Default language
   * @returns {string} - Translation value
   */
  _getTranslationValue(translation, defaultLanguage) {
    const name = translation.translationName || translation.tranalstionName || "";
    const values = translation.translationValues || {};
    return values[defaultLanguage] || name || "";
  }
  /**
   * Check if a translation has changed
   * @param {Object} current - Current translation
   * @param {Object} updated - Updated translation
   * @param {string} defaultLanguage - Default language
   * @returns {boolean} - True if changed
   */
  _hasTranslationChanged(current, updated, defaultLanguage) {
    const currentName = current.translationName || current.tranalstionName || "";
    const updatedName = updated.translationName || updated.tranalstionName || "";
    return currentName !== updatedName || current.orderIndex !== updated.orderIndex || this._getTranslationValue(current, defaultLanguage) !== this._getTranslationValue(updated, defaultLanguage);
  }
  /**
   * Update internal state after render
   * @param {Map} newTranslationsMap - New translations map
   * @param {string} defaultLanguage - Current default language
   */
  _updateInternalState(newTranslationsMap, defaultLanguage) {
    this.currentTranslations = new Map(newTranslationsMap);
    this.currentDefaultLanguage = defaultLanguage;
  }
  /**
   * Escape HTML to prevent XSS
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  _escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * Clear the table
   */
  clear() {
    this._tableBody.innerHTML = "";
    this.currentTranslations.clear();
    this.currentRows.clear();
    this.currentDefaultLanguage = null;
  }
  /**
   * Get current translations count
   * @returns {number} - Number of current translations
   */
  getTranslationsCount() {
    return this.currentTranslations.size;
  }
  getSelectedRow() {
    if (this._selectedRow) {
      const nameElement = this._selectedRow.querySelector(".translation-name");
      return nameElement ? nameElement.textContent : "#";
    }
    return "#";
  }
  setSelectedRow(row) {
    if (this._selectedRow === row) {
      if (this._selectedRow) {
        this._selectedRow.classList.remove("highlight");
      }
      this._selectedRow = null;
    } else {
      if (this._selectedRow) {
        this._selectedRow.classList.remove("highlight");
      }
      this._selectedRow = row;
      if (this._selectedRow) {
        this._selectedRow.classList.add("highlight");
      }
    }
    return this.getSelectedRow();
  }
}
function transformTranslations(data, projectId) {
  const translations = data.Translations;
  const keys = Object.keys(translations);
  const result = new Array(keys.length);
  let orderIndex = 1e3;
  let translationId = 1;
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    result[i] = {
      projectId,
      translationName: key,
      translationValues: translations[key],
      orderIndex,
      translationId
    };
    orderIndex += 1e3;
    translationId++;
  }
  return result;
}
class TextFormatterModal {
  constructor() {
    this._shadowRoot = null;
    this._textFormatterModalElement = null;
    this._tabManager = null;
    this._colorTableManager = null;
    this._fontsTableManager = null;
    this._translationsTableManager = null;
    this._formattedTextElement = null;
    this._applyFormattedTextButton = null;
    this._activeSearchInput = null;
    this._translationTable = null;
    this._translationsSearchInputParent = null;
    this._noTranslationScreen = null;
    this._fontsTable = null;
    this._noFontsScreen = null;
    this._colorsTable = null;
    this._colorsSearchInputParent = null;
    this._noColorsScreen = null;
    this._isModalOpen = false;
    this._listenersAdded = false;
    this._initialized = false;
  }
  async init() {
    if (this._initialized) return console.log(`[TEXT FORMATTER MODAL] Already intialized`);
    try {
      this._shadowRoot = AppContext.getShadowRoot();
      this._tabManager = new TabManager(this._shadowRoot);
      this._colorTableManager = new ColorsTableManager();
      this._fontsTableManager = new FontsTableManager();
      this._translationsTableManager = new TranslationsTableManager();
      await this._createTextFormatterModal(this._shadowRoot);
      this._addEventListeners();
    } catch (error) {
      console.error(error);
    }
  }
  async _createTextFormatterModal() {
    try {
      const htmlContent = await loadHtmlFragment("src/content/inject/textFormatterModal.html");
      const templateWrapper = document.createElement("div");
      templateWrapper.innerHTML = htmlContent;
      const template = templateWrapper.querySelector("#textFormatterModalTemplate");
      if (!template || !(template instanceof HTMLTemplateElement)) {
        console.error("Template #textFormatterModalTemplate not found or invalid.");
        return;
      }
      const content = document.importNode(template.content, true);
      const textFormatterModalOverlay = content.querySelector("#text-formatter-modal-overlay");
      const modal = content.querySelector("#textFormatterModal");
      if (!textFormatterModalOverlay || !modal) {
        console.error("Template must contain both #text-formatter-modal-overlay and #textFormatterModal.");
        return;
      }
      textFormatterModalOverlay.addEventListener("click", () => this.hide());
      this._shadowRoot.appendChild(content);
      this._textFormatterModalElement = modal;
      console.log("Text formatter modal initialized inside Shadow DOM using template.");
    } catch (error) {
      console.error("Error initializing text formatter modal:", error);
    }
  }
  _addEventListeners() {
    if (this._listenersAdded) return;
    console.log(`[TEXT FORMATTER MODAL] Adding event listeners`);
    this._formattedTextElement = this._shadowRoot.getElementById("text-formatter-modal-formatted-text");
    this._applyFormattedTextButton = this._shadowRoot.getElementById("text-formatter-modal-apply-button");
    this._translationTable = this._shadowRoot.getElementById("text-formatter-modal-translations-table");
    this._translationsSearchInputParent = this._shadowRoot.querySelector(".text-formatter-modal-translation-search-input-parent");
    this._noTranslationScreen = this._shadowRoot.querySelector(".no-translations-screen");
    this._fontsTable = this._shadowRoot.getElementById("text-formatter-modal-fonts-table");
    this._noFontsScreen = this._shadowRoot.querySelector(".no-fonts-screen");
    this._colorsTable = this._shadowRoot.getElementById("text-formatter-modal-colors-table");
    this._colorsSearchInputParent = this._shadowRoot.querySelector(".text-formatter-modal-color-search-input-parent");
    this._noColorsScreen = this._shadowRoot.querySelector(".no-colors-screen");
    this._shadowRoot.getElementById("hide-text-formatter-modal").addEventListener("click", () => {
      this.hide();
    });
    this._applyFormattedTextButton.addEventListener("click", () => {
      this.#applyFormattedTextToAI2TextArea();
      this.hide();
    });
    this._shadowRoot.getElementById("textFormatterNavTabs").addEventListener("click", (e) => {
      this._tabManager.switchToTab(e.target.id);
    });
    [".text-formatter-modal-translation-search-input", ".text-formatter-modal-color-search-input"].forEach((selector) => {
      const inputElement = this._shadowRoot.querySelector(selector);
      inputElement.addEventListener("focus", () => {
        this._activeSearchInput = inputElement;
      });
    });
    const refocusKeys = ["/", "t", "v", "p", "m"];
    document.addEventListener("keydown", (event) => {
      if (this._isModalOpen) {
        if (refocusKeys.includes(event.key.toLowerCase())) {
          setTimeout(() => {
            this._activeSearchInput.focus();
          }, 0);
        }
      }
    });
    console.log(`[TEXT FORMATTER MODAL] Event listeners added`);
  }
  show() {
    this._formattedTextElement.textContent = "Please select a translation, font, and color.";
    this._applyFormattedTextButton.classList.toggle("disabled", true);
    const primitivesData = contentScriptCache.primitiveCache.getAll();
    const semanticsData = contentScriptCache.semanticCache.getAll();
    if (primitivesData.length > 0 && semanticsData.length > 0) {
      this._colorTableManager.render(semanticsData, primitivesData, "Light");
      this.setFontsScreenVisibility(true);
    } else {
      this.setColorsScreenVisibility(false);
    }
    const fontsData = contentScriptCache.fontCache.getAll();
    if (fontsData.length > 0) {
      this._fontsTableManager.render(fontsData);
      this.setFontsScreenVisibility(true);
    } else {
      this.setFontsScreenVisibility(false);
    }
    const translationsData = contentScriptCache.translationCache.get({ id: 1 });
    if (translationsData !== null) {
      this.setTranslationScreenVisibility(true);
      this._translationsTableManager.render(translationsData.translationData);
    } else {
      this.setTranslationScreenVisibility(false);
    }
    this._tabManager.switchToTab("translation-tab");
    [".text-formatter-modal-translation-search-input", ".text-formatter-modal-color-search-input"].forEach((selector) => {
      const inputElement = this._shadowRoot.querySelector(selector);
      inputElement.value = "";
    });
    this._shadowRoot.getElementById("text-formatter-modal-overlay").style.display = "block";
    this._textFormatterModalElement.style.display = "block";
    console.log("Text formatter modal opened");
  }
  hide() {
    this._shadowRoot.getElementById("text-formatter-modal-overlay").style.display = "none";
    this._textFormatterModalElement.style.display = "none";
    console.log("Text formatter modal closed");
  }
  getFormattedText() {
    return this._formattedTextElement.textContent;
  }
  setFormattedText({ translation, font, color }) {
    if (this._formattedTextElement.textContent === "Please select a translation, font, and color.") this._formattedTextElement.textContent = "#,#,#";
    const [currentTranslation = "", currentFont = "", currentColor = ""] = this._formattedTextElement.textContent.split(",").map((s) => s.trim());
    const newTranslation = translation !== void 0 ? translation : currentTranslation;
    const newFont = font !== void 0 ? font : currentFont;
    const newColor = color !== void 0 ? color : currentColor;
    this._formattedTextElement.textContent = `${newTranslation}, ${newFont}, ${newColor}`;
    if (this._formattedTextElement.textContent.trim() === "#, #, #") {
      this._formattedTextElement.textContent = "Please select a translation, font, and color.";
      this._applyFormattedTextButton.classList.toggle("disabled", true);
    } else {
      this._applyFormattedTextButton.classList.toggle("disabled", false);
    }
  }
  #applyFormattedTextToAI2TextArea() {
    const textArea = activeAI2TextArea;
    if (textArea) {
      textArea.value = this._formattedTextElement.textContent;
      textArea.dispatchEvent(new Event("input", { bubbles: true }));
      textArea.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }
  setTranslationScreenVisibility(show) {
    if (show) {
      this._translationsSearchInputParent.style.display = "flex";
      this._noTranslationScreen.style.display = "none";
      this._translationTable.style.display = "block";
    } else {
      this._translationsSearchInputParent.style.display = "none";
      this._noTranslationScreen.style.display = "flex";
      this._translationTable.style.display = "none";
    }
  }
  setFontsScreenVisibility(show) {
    if (show) {
      this._noFontsScreen.style.display = "none";
      this._fontsTable.style.display = "block";
    } else {
      this._noFontsScreen.style.display = "flex";
      this._fontsTable.style.display = "none";
    }
  }
  setColorsScreenVisibility(show) {
    if (show) {
      this._colorsSearchInputParent.style.display = "flex";
      this._noColorsScreen.style.display = "none";
      this._colorsTable.style.display = "block";
    } else {
      this._colorsSearchInputParent.style.display = "none";
      this._noColorsScreen.style.display = "flex";
      this._colorsTable.style.display = "none";
    }
  }
}
class TabManager {
  constructor() {
    this._shadowRoot = AppContext.getShadowRoot();
    this._defaultTab = "translation-tab";
    this._activeTab = null;
  }
  switchToTab(tabId) {
    const targetTab = this._shadowRoot.getElementById(tabId);
    if (targetTab === this._activeTab) return;
    if (!this._activeTab) {
      this._activeTab = this._shadowRoot.getElementById(this._defaultTab);
    }
    this._activeTab.classList.replace("textFormatterNavTabSelected", "textFormatterNavTab");
    this._activeTab.setAttribute("isTabSelected", "false");
    this._activeTab = targetTab;
    this._activeTab.classList.replace("textFormatterNavTab", "textFormatterNavTabSelected");
    this._activeTab.setAttribute("isTabSelected", "true");
    Array.from(this._shadowRoot.getElementById("textFormatterNavTabs").children).forEach((tab) => {
      const tabScreen = this._shadowRoot.getElementById(tab.id.replace("-tab", "-screen"));
      tabScreen.style.display = tab.id === tabId ? "block" : "none";
    });
  }
  activeTab() {
    return this._activeTab ? this._activeTab.id : this._defaultTab;
  }
}
const textFormatterModal = new TextFormatterModal();
class ProjectLinkModal {
  constructor() {
    this._shadowRoot = null;
    this._linkProjectModalElement = null;
    this._listenersAdded = false;
    this._initialized = false;
  }
  async init() {
    if (this._initialized) return console.log(`[PROJECT LINK MODAL] Already intialized`);
    try {
      this._shadowRoot = AppContext.getShadowRoot();
      const htmlContent = await loadHtmlFragment("src/content/inject/linkProjectModal.html");
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const linkProjectModalSourceElement = tempDiv.querySelector("#link-project-modal");
      if (linkProjectModalSourceElement) {
        this._linkProjectModalElement = document.createElement("div");
        this._linkProjectModalElement.id = "link-project-modal";
        this._linkProjectModalElement.innerHTML = linkProjectModalSourceElement.innerHTML;
        this._shadowRoot.appendChild(this._linkProjectModalElement);
        console.log("Link project modal created inside Shadow DOM");
      } else {
        console.error("Element #link-project-modal not found in source HTML");
      }
      tempDiv.remove();
      this._addEventListeners();
      console.log(`[PROJECT LINK MODAL] Intialized successfully`);
    } catch (error) {
      console.error("Error fetching source HTML:", error);
    }
  }
  _addEventListeners() {
    if (this._listenersAdded) return;
    console.log(`[PROJECT LINK MODAL] Adding event listeners`);
    this._shadowRoot.getElementById("hide-link-project-modal").addEventListener("click", () => {
      this.hide();
    });
    console.log(`[PROJECT LINK MODAL] Event listeners added`);
    this._listenersAdded = true;
  }
  show() {
    this._linkProjectModalElement.style.display = "flex";
    console.log("Link project modal opened");
  }
  hide() {
    this._linkProjectModalElement.style.display = "none";
    console.log("Link project modal hidden");
  }
}
const projectLinkModal = new ProjectLinkModal();
class DataFetcher {
  constructor() {
    this.sendMessage = sendMessage;
    this.cache = contentScriptCache;
  }
  async fetch({ action, cacheKey, requiresProject = true }) {
    try {
      const payload = { action };
      if (requiresProject) {
        payload.projectId = this.cache.getSelectedProjectId();
      }
      const response = await this.sendMessage(payload);
      if (!response.success) {
        console.log(`[ERROR] Fetch failed for ${cacheKey}:`, response.error || "Unknown error");
        return;
      }
      this.cache[cacheKey].addBulk({ dataArray: response.data });
      console.debug(`[DEBUG] ${cacheKey} loaded`, JSON.stringify(this.cache[cacheKey].getAll(), null, 2));
    } catch (err) {
      console.log(`[EXCEPTION] Fetch failed for ${cacheKey}:`, err);
    }
  }
  fetchProjectsData() {
    return this.fetch({ action: "PROJECTS:FETCH_DATA", cacheKey: "projectCache", requiresProject: false });
  }
  fetchPrimitivesData() {
    return this.fetch({ action: "COLORS:FETCH_PRIMITIVE", cacheKey: "primitiveCache" });
  }
  fetchSemanticsData() {
    return this.fetch({ action: "COLORS:FETCH_SEMANTIC", cacheKey: "semanticCache" });
  }
  fetchFontsData() {
    return this.fetch({ action: "FONTS:FETCH_DATA", cacheKey: "fontCache" });
  }
  fetchTranslationsData() {
    return this.fetch({ action: "TRANSLATIONS:FETCH_DATA", cacheKey: "translationCache" });
  }
  async fetchAllData() {
    await this.fetchPrimitivesData();
    await this.fetchSemanticsData();
    await this.fetchFontsData();
    await this.fetchTranslationsData();
  }
}
const fetcher = new DataFetcher();
class ElementWatcher {
  constructor(config = {}) {
    this.config = {
      elements: [],
      throttleDelay: 100,
      observeOptions: { childList: true, subtree: true, characterData: true },
      rootElement: document.body,
      autoStart: true,
      debug: false,
      ...config
    };
    this.watchers = /* @__PURE__ */ new Map();
    this.textObservers = /* @__PURE__ */ new Map();
    this.throttleTimers = /* @__PURE__ */ new Map();
    this.lastTexts = /* @__PURE__ */ new Map();
    this.processedElements = /* @__PURE__ */ new Set();
    this.mainObserver = null;
    this.isRunning = false;
    if (this.config.autoStart) {
      this.start();
    }
  }
  /**
   * Start watching for elements
   */
  start() {
    if (this.isRunning) return;
    this.log("Starting ElementWatcher");
    this.mainObserver = new MutationObserver((mutations) => {
      requestAnimationFrame(() => this.handleMutations(mutations));
    });
    this.mainObserver.observe(this.config.rootElement, this.config.observeOptions);
    this.isRunning = true;
    this.checkAllElements();
  }
  /**
   * Stop watching and cleanup all observers
   */
  stop() {
    if (!this.isRunning) return;
    this.log("Stopping ElementWatcher...");
    if (this.mainObserver) {
      this.mainObserver.disconnect();
      this.mainObserver = null;
    }
    this.textObservers.forEach((observer) => observer.disconnect());
    this.textObservers.clear();
    this.throttleTimers.forEach((timer) => clearTimeout(timer));
    this.throttleTimers.clear();
    this.isRunning = false;
  }
  /**
   * Add a new element to watch
   */
  addElement(elementConfig) {
    const id = this.generateElementId(elementConfig);
    this.config.elements.push({ id, ...elementConfig });
    if (this.isRunning) {
      this.checkElement(elementConfig, id);
    }
    return id;
  }
  /**
   * Remove an element from watching
   */
  removeElement(elementId) {
    this.config.elements = this.config.elements.filter((el) => el.id !== elementId);
    this.processedElements.delete(elementId);
    if (this.textObservers.has(elementId)) {
      this.textObservers.get(elementId).disconnect();
      this.textObservers.delete(elementId);
    }
    if (this.throttleTimers.has(elementId)) {
      clearTimeout(this.throttleTimers.get(elementId));
      this.throttleTimers.delete(elementId);
    }
  }
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.stop();
    }
    this.config = { ...this.config, ...newConfig };
    if (wasRunning) {
      this.start();
    }
  }
  /**
   * Change the root element being observed
   */
  setRootElement(newRootElement) {
    if (typeof newRootElement === "string") {
      newRootElement = document.querySelector(newRootElement);
      if (!newRootElement) {
        throw new Error(`Root element not found: ${newRootElement}`);
      }
    }
    if (!(newRootElement instanceof Element)) {
      throw new Error("Root element must be a DOM Element or valid selector string");
    }
    const wasRunning = this.isRunning;
    if (wasRunning) {
      this.stop();
    }
    this.config.rootElement = newRootElement;
    this.log(`Root element changed to: ${newRootElement.tagName}${newRootElement.className ? "." + newRootElement.className : ""}`);
    this.processedElements.clear();
    this.lastTexts.clear();
    if (wasRunning) {
      this.start();
    }
  }
  /**
   * Get current root element
   */
  getRootElement() {
    return this.config.rootElement;
  }
  /**
   * Handle mutations from main observer
   */
  handleMutations(mutations) {
    const unprocessedElements = this.config.elements.filter(
      (el) => !this.processedElements.has(el.id || this.generateElementId(el))
    );
    if (unprocessedElements.length === 0) {
      this.log("All elements processed, stopping main observer");
      this.mainObserver.disconnect();
      return;
    }
    this.checkAllElements();
  }
  /**
   * Check all configured elements
   */
  checkAllElements() {
    this.config.elements.forEach((elementConfig) => {
      const id = elementConfig.id || this.generateElementId(elementConfig);
      if (!this.processedElements.has(id)) {
        this.checkElement(elementConfig, id);
      }
    });
  }
  /**
   * Check for a specific element
   */
  checkElement(elementConfig, id) {
    const element = document.querySelector(elementConfig.selector);
    if (element) {
      this.log(`Element found: ${elementConfig.selector}`);
      this.processedElements.add(id);
      if (elementConfig.onFound) {
        try {
          elementConfig.onFound(element, elementConfig);
        } catch (error) {
          console.error("Error in onFound callback:", error);
        }
      }
      if (elementConfig.watchText && elementConfig.onTextChange) {
        this.setupTextWatcher(element, elementConfig, id);
      }
    }
  }
  /**
   * Setup text change observer for an element
   */
  setupTextWatcher(element, elementConfig, id) {
    if (this.textObservers.has(id)) {
      this.textObservers.get(id).disconnect();
    }
    const textObserver = new MutationObserver(() => {
      this.handleTextChangeThrottled(element, elementConfig, id);
    });
    textObserver.observe(element, this.config.observeOptions);
    this.textObservers.set(id, textObserver);
    this.handleTextChange(element, elementConfig, id);
  }
  /**
   * Handle text changes with throttling
   */
  handleTextChangeThrottled(element, elementConfig, id) {
    if (this.throttleTimers.has(id)) return;
    const timer = setTimeout(() => {
      this.handleTextChange(element, elementConfig, id);
      this.throttleTimers.delete(id);
    }, this.config.throttleDelay);
    this.throttleTimers.set(id, timer);
  }
  /**
   * Handle text changes
   */
  handleTextChange(element, elementConfig, id) {
    const currentText = element.innerText.trim();
    const lastText = this.lastTexts.get(id) || "";
    if (currentText === lastText) return;
    this.log(`Text changed for ${elementConfig.selector}: "${lastText}" → "${currentText}"`);
    this.lastTexts.set(id, currentText);
    if (elementConfig.onTextChange) {
      try {
        elementConfig.onTextChange(currentText, lastText, element, elementConfig);
      } catch (error) {
        console.error("Error in onTextChange callback:", error);
      }
    }
  }
  /**
   * Generate unique ID for element config
   */
  generateElementId(elementConfig) {
    return `${elementConfig.selector}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  /**
   * Log debug messages
   */
  log(message) {
    if (this.config.debug) {
      console.log(`[ElementWatcher] ${message}`);
    }
  }
  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalElements: this.config.elements.length,
      processedElements: this.processedElements.size,
      activeTextObservers: this.textObservers.size,
      config: { ...this.config }
    };
  }
}
const elementWatcher = new ElementWatcher({
  debug: true,
  throttleDelay: 100
});
class ProjectsLinkManager {
  constructor() {
    this._shadowRoot = null;
    this.container = null;
    this.fetcher = fetcher;
    this.domCache = /* @__PURE__ */ new Map();
    this._initialized = false;
  }
  async init() {
    try {
      this._shadowRoot = AppContext.getShadowRoot();
      const container = this._shadowRoot.getElementById("select-project-modal-projects-container");
      this.container = container;
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * Main method to render/update the projects list
   * @param {Array} projects - Array of project objects
   */
  render(projects) {
    if (!Array.isArray(projects)) {
      console.warn("Projects data should be an array");
      return;
    }
    const activeProjects = projects.filter((project) => !project.deleted).sort((a, b) => b.lastModified - a.lastModified);
    if (this._isInitialRender()) {
      this._initialRender(activeProjects);
    } else {
      this._updateRender(activeProjects);
    }
    this._initialized = true;
  }
  /**
   * Check if this is the first render (empty container or no cached elements)
   * @returns {boolean}
   */
  _isInitialRender() {
    return !this._initialized || this.container.children.length === 0;
  }
  /**
   * Initial render - populate empty container
   * @param {Array} projects - Sorted projects array
   */
  _initialRender(projects) {
    this.container.innerHTML = "";
    this.domCache.clear();
    const fragment = document.createDocumentFragment();
    projects.forEach((project) => {
      const listItem = this._createProjectElement(project);
      fragment.appendChild(listItem);
      this.domCache.set(project.projectId, listItem);
    });
    this.container.appendChild(fragment);
  }
  /**
   * Update render - efficiently update existing list
   * @param {Array} projects - New projects data
   */
  _updateRender(projects) {
    const newProjectsMap = new Map(projects.map((p) => [p.projectId, p]));
    const existingIds = new Set(this.domCache.keys());
    const newIds = new Set(newProjectsMap.keys());
    const toAdd = [...newIds].filter((id) => !existingIds.has(id));
    const toRemove = [...existingIds].filter((id) => !newIds.has(id));
    const toCheck = [...newIds].filter((id) => existingIds.has(id));
    toRemove.forEach((projectId) => {
      const element = this.domCache.get(projectId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.domCache.delete(projectId);
    });
    toCheck.forEach((projectId) => {
      const project = newProjectsMap.get(projectId);
      const element = this.domCache.get(projectId);
      if (element && this._hasProjectChanged(element, project)) {
        this._updateProjectElement(element, project);
      }
    });
    if (toAdd.length > 0) {
      const fragment = document.createDocumentFragment();
      toAdd.forEach((projectId) => {
        const project = newProjectsMap.get(projectId);
        const listItem = this._createProjectElement(project);
        fragment.appendChild(listItem);
        this.domCache.set(projectId, listItem);
      });
      this.container.appendChild(fragment);
    }
    if (toAdd.length > 0 && projects.length > 1) {
      this._sortProjects(projects);
    }
  }
  /**
   * Create a new project DOM element
   * @param {Object} project - Project data
   * @returns {HTMLElement} - Created list item element
   */
  _createProjectElement(project) {
    const li = document.createElement("li");
    li.setAttribute("projectid", project.projectId);
    li.setAttribute("last-modified", project.lastModified.toString());
    const div = document.createElement("div");
    div.setAttribute("project-id", project.projectId);
    div.className = "project-card";
    const contentDiv = document.createElement("div");
    const nameH5 = document.createElement("h5");
    nameH5.className = "project-name";
    nameH5.textContent = this.escapeHtml(project.projectName);
    const authorP = document.createElement("p");
    authorP.className = "project-author";
    authorP.textContent = `Author: ${this.escapeHtml(project.author)}`;
    const versionP = document.createElement("p");
    versionP.className = "project-version";
    versionP.textContent = `Version: ${this.escapeHtml(project.version)}`;
    const lastModifiedP = document.createElement("p");
    lastModifiedP.className = "project-last-modified";
    lastModifiedP.textContent = `Last Modified: ${this.escapeHtml(this._formatLastModified(project.lastModified))}`;
    contentDiv.appendChild(nameH5);
    contentDiv.appendChild(authorP);
    contentDiv.appendChild(versionP);
    contentDiv.appendChild(lastModifiedP);
    div.appendChild(contentDiv);
    li.appendChild(div);
    li.addEventListener("click", async () => {
      const projectId = li.querySelector(".project-card").getAttribute("project-id");
      const response = await sendMessage({
        action: "SESSION_STORAGE:SET",
        key: "AI2_SELECTED_PROJECT_ID",
        value: projectId
      });
      if (response.success) {
        contentScriptCache.setSelectedProjectId(projectId);
        await this.fetcher.fetchAllData();
        projectLinkModal.hide();
        textFormatterModal.show();
      }
    });
    return li;
  }
  /**
   * Update an existing project DOM element
   * @param {HTMLElement} element - DOM element to update
   * @param {Object} project - New project data
   */
  _updateProjectElement(element, project) {
    element.setAttribute("last-modified", project.lastModified.toString());
    const projectCard = element.querySelector(".project-card");
    if (projectCard) {
      projectCard.setAttribute("project-id", project.projectId);
    }
    const nameElement = element.querySelector(".project-name");
    if (nameElement) {
      nameElement.textContent = this.escapeHtml(project.projectName);
    }
    const authorElement = element.querySelector(".project-author");
    if (authorElement) {
      authorElement.textContent = `Author: ${this.escapeHtml(project.author)}`;
    }
    const versionElement = element.querySelector(".project-version");
    if (versionElement) {
      versionElement.textContent = `Version: ${this.escapeHtml(project.version)}`;
    }
    const lastModifiedElement = element.querySelector(".project-last-modified");
    if (lastModifiedElement) {
      lastModifiedElement.textContent = `Last Modified: ${this.escapeHtml(this._formatLastModified(project.lastModified))}`;
    }
  }
  /**
   * Check if a project has changed compared to its DOM representation
   * @param {HTMLElement} element - DOM element
   * @param {Object} project - Project data
   * @returns {boolean} - True if project has changed
   */
  _hasProjectChanged(element, project) {
    const currentLastModified = element.getAttribute("last-modified");
    const currentName = element.querySelector(".project-name")?.textContent;
    const currentAuthor = element.querySelector(".project-author")?.textContent;
    const currentVersion = element.querySelector(".project-version")?.textContent;
    const currentLastModifiedText = element.querySelector(".project-last-modified")?.textContent;
    return currentLastModified !== project.lastModified.toString() || currentName !== this.escapeHtml(project.projectName) || currentAuthor !== `Author: ${this.escapeHtml(project.author)}` || currentVersion !== `Version: ${this.escapeHtml(project.version)}` || currentLastModifiedText !== `Last Modified: ${this.escapeHtml(this._formatLastModified(project.lastModified))}`;
  }
  /**
   * Sort projects in the DOM based on lastModified timestamp
   * @param {Array} projects - Sorted projects array (reference for order)
   */
  _sortProjects(projects) {
    const orderedElements = projects.map((project) => this.domCache.get(project.projectId)).filter((element) => element);
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }
    const fragment = document.createDocumentFragment();
    orderedElements.forEach((element) => {
      fragment.appendChild(element);
    });
    this.container.appendChild(fragment);
  }
  /**
   * Get current projects data from DOM
   * @returns {Array} - Array of project data objects
   */
  getCurrentProjects() {
    return Array.from(this.container.children).map((li) => ({
      projectId: li.getAttribute("projectid"),
      projectName: li.querySelector(".project-name")?.textContent || "",
      author: li.querySelector(".project-author")?.textContent?.replace("Author: ", "") || "",
      version: li.querySelector(".project-version")?.textContent?.replace("Version: ", "") || "",
      lastModified: parseInt(li.getAttribute("last-modified")) || 0
    }));
  }
  /**
   * Clear all projects from the list
   */
  clear() {
    this.container.innerHTML = "";
    this.domCache.clear();
    this._initialized = false;
  }
  /**
   * Get the number of projects currently displayed
   * @returns {number}
   */
  getProjectCount() {
    return this.domCache.size;
  }
  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    if (typeof text !== "string") {
      return String(text);
    }
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
  /**
   * Format timestamp to readable date string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} - Formatted date string
   */
  _formatLastModified(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return "Invalid Date";
    }
  }
}
const projectsLinkManager = new ProjectsLinkManager();
function handleDbChange({ table, type, data }) {
  const idFields = {
    translations: "translationId",
    primitiveColors: "primitiveId",
    semanticColors: "semanticId",
    fonts: "fontId",
    projects: "projectId"
  };
  const cacheMap = {
    translations: contentScriptCache.translationCache,
    primitiveColors: contentScriptCache.primitiveCache,
    semanticColors: contentScriptCache.semanticCache,
    fonts: contentScriptCache.fontCache,
    projects: contentScriptCache.projectCache
  };
  const idField = idFields[table];
  const cache = cacheMap[table];
  const id = data?.[idField];
  if (!cache || !id) return;
  switch (type) {
    case 1:
      cache.add({ data });
      break;
    case 2:
      cache.update({ id, updates: data });
      break;
    case 3:
      cache.delete({ id });
      break;
  }
}
let activeAI2TextArea = null;
(async () => {
  const shadowRoot = await createShadowRoot();
  AppContext.init({ shadowRoot });
  await textFormatterModal.init();
  await projectLinkModal.init();
  await projectsLinkManager.init();
  await fetcher.fetchProjectsData();
})();
function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "dbChange") {
    const { table, type, data } = message;
    handleDbChange({ table, type, data });
  }
});
elementWatcher.addElement({
  selector: ".ode-PropertiesComponentName",
  watchText: true,
  onFound: (el) => console.log("Found component name"),
  onTextChange: (newText, oldText, el) => {
    if (newText.endsWith("(Label)")) {
      createEditTextWithThmltModalButton();
    }
  }
});
const toolbarWatcherId = elementWatcher.addElement({
  selector: ".ya-Toolbar",
  onFound: (element) => {
    createTestButton(element);
    elementWatcher.removeElement(toolbarWatcherId);
  }
});
function createTestButton(toolBarElement) {
  const thmltTestButton = document.createElement("div");
  thmltTestButton.setAttribute("thmltTestButtonDiv", "true");
  thmltTestButton.id = "thmltTestButtonDiv";
  thmltTestButton.innerHTML = `
          <div id="thmltTestButton" style="
                                                      position: relative;
                                                      display: flex;
                                                      align-items: center;
                                                      justify-content: center;
                                                      gap: 5px;
                                                      padding: 4px 10px;
                                                      transition: background 0.2s, opacity 0.1s;
                                                      color: #444;
                                                      font-family: 'Poppins', Helvetica, Arial, sans-serif;
                                                      font-weight: 500;
                                                      font-size: 1.06em;
                                                      white-space: nowrap;
                                                      background-color: #a5cf47;
                                                      border: 1px solid #444;
                                                      border-radius: 4px;
                                                      background-image: unset;
                                                      text-shadow: unset;
                                                      box-shadow: 1px 1px;
                                                      cursor: pointer;
          ">
          <div style="font-size: 0.75rem">ThMLT Test</div>
          </div>
        `;
  toolBarElement.querySelector(".left").appendChild(thmltTestButton);
  console.log("Test Button creation successfull");
  thmltTestButton.addEventListener("click", async (e) => {
    handleTextFormatterButtonClick();
  });
}
function createEditTextWithThmltModalButton() {
  const propertiesPanelTable = document.querySelector("table.ode-PropertiesPanel");
  if (propertiesPanelTable) {
    const targetRow = Array.from(propertiesPanelTable.querySelectorAll("tr")).find((row) => {
      const propertyLabel = row.querySelector("div.ode-PropertyLabel");
      return propertyLabel && propertyLabel.textContent.trim() === "Text";
    });
    const textArea = targetRow.nextElementSibling.querySelector(".ode-PropertyEditor");
    activeAI2TextArea = textArea;
    if (targetRow) {
      const targetTd = targetRow.querySelector("td:has(div.ode-PropertyLabel)").querySelector('td[align="left"][style*="vertical-align: top;"] img.ode-PropertyHelpWidget').parentElement;
      if (targetTd) {
        const newTd = document.createElement("td");
        newTd.setAttribute("editTextWithThMLT", "true");
        newTd.setAttribute("align", "left");
        newTd.style.verticalAlign = "top";
        newTd.id = "my-newTd";
        newTd.innerHTML = `
          <div class="EditTextWithThMLTButton" style="
                                                      position: relative;
                                                      display: flex;
                                                      align-items: center;
                                                      justify-content: center;
                                                      gap: 5px;
                                                      padding: 4px 10px;
                                                      transition: background 0.2s, opacity 0.1s;
                                                      color: #444;
                                                      font-family: 'Poppins', Helvetica, Arial, sans-serif;
                                                      font-weight: 500;
                                                      font-size: 1.06em;
                                                      white-space: nowrap;
                                                      background-color: #a5cf47;
                                                      border: 1px solid #444;
                                                      border-radius: 4px;
                                                      background-image: unset;
                                                      text-shadow: unset;
                                                      box-shadow: 1px 1px;
                                                      cursor: pointer;
          ">
          <div style="font-size: 0.75rem">ThMLT</div>
          </div>
        `;
        targetTd.insertAdjacentElement("afterend", newTd);
        newTd.addEventListener("click", async (e) => {
          const clickedElement = e.target.closest('td[editTextWithThMLT="true"]');
          if (clickedElement) {
            handleTextFormatterButtonClick();
          }
        });
      } else {
        console.log("Target <td> element not found.");
      }
    } else {
      console.log("Specific table row not found.");
    }
  } else {
    console.log('Table with class "ode-PropertiesPanel" not found.');
  }
}
function handleTextFormatterButtonClick() {
  const selectedProjectId = contentScriptCache.getSelectedProjectId();
  if (selectedProjectId === "") {
    projectsLinkManager.render(contentScriptCache.projectCache.getAll());
    projectLinkModal.show();
  } else {
    textFormatterModal.show();
  }
}
