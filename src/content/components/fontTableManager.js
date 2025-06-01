import AppContext from "../services/appContext";
import { textFormatterModal } from "./textFormatterModal";

export class FontsTableManager {
  constructor() {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._currentFonts = new Map(); // fontId -> font data
    this._domElements = new Map(); // fontId -> DOM element
    this._selectedRow = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-fonts-table-body");
    
      if (tableBody) {
        this._tableBody = tableBody;
    
        observerInstance.disconnect(); // Stop observing
        console.log("Color Table body found and stored.");
      }
    });
    
    // Correct root to observe
    observer.observe(this._shadowRoot, {
      childList: true,
      subtree: true,
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
    
    sortedFonts.forEach(font => {
      const row = this._createFontRow(font);
      fragment.appendChild(row);
      
      // Store references
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
    const newFontsMap = new Map(sortedFonts.map(font => [font.fontId, font]));
    const currentFontIds = new Set(this._currentFonts.keys());
    const newFontIds = new Set(newFontsMap.keys());

    // Find changes
    const toAdd = [...newFontIds].filter(id => !currentFontIds.has(id));
    const toRemove = [...currentFontIds].filter(id => !newFontIds.has(id));
    const toUpdate = [...newFontIds].filter(id => 
      currentFontIds.has(id) && this._hasFontChanged(this._currentFonts.get(id), newFontsMap.get(id))
    );

    // Remove obsolete fonts
    this._removeFonts(toRemove);

    // Update modified fonts
    this._updateFonts(toUpdate, newFontsMap);

    // Add new fonts
    this._addFonts(toAdd, newFontsMap);

    // Ensure correct order
    this._reorderTable(sortedFonts);

    // Update current state
    this._currentFonts = newFontsMap;
  }

  /**
   * Check if font data has changed
   * @param {Object} oldFont - Previous font data
   * @param {Object} newFont - New font data
   * @returns {boolean}
   */
  _hasFontChanged(oldFont, newFont) {
    return oldFont.fontName !== newFont.fontName ||
           oldFont.fontValue !== newFont.fontValue ||
           oldFont.orderIndex !== newFont.orderIndex;
  }

  /**
   * Create a new font row element
   * @param {Object} font - Font data
   * @returns {HTMLElement}
   */
  _createFontRow(font) {
    const row = document.createElement('tr');
    row.setAttribute('rowId', font.fontId);
    
    const nameCell = document.createElement('td');
    nameCell.classList.add("font-name");
    nameCell.textContent = font.fontName;
    
    const valueCell = document.createElement('td');
    valueCell.classList.add("font-value");
    valueCell.textContent = font.fontValue;
    
    row.appendChild(nameCell);
    row.appendChild(valueCell);

    // ========== EVENT LISTENERS BEGIN ========== //

    row.addEventListener('click', ()=> {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        font: colorText
      })
    })

    // ========== EVENT LISTENERS END ========== //
    
    return row;
  }

  /**
   * Remove fonts from table
   * @param {Array} fontIdsToRemove - Array of fontIds to remove
   */
  _removeFonts(fontIdsToRemove) {
    fontIdsToRemove.forEach(fontId => {
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
    fontIdsToUpdate.forEach(fontId => {
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
    fontIdsToAdd.forEach(fontId => {
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
    
    sortedFonts.forEach(font => {
      const row = this._domElements.get(font.fontId);
      if (row) {
        fragment.appendChild(row);
      }
    });
    
    // Clear table and append in correct order
    this._tableBody.innerHTML = '';
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
    this._tableBody.innerHTML = '';
    this._currentFonts.clear();
    this._domElements.clear();
  }

  getSelectedRow() {
    if (this._selectedRow) {
      const nameElement = this._selectedRow.querySelector('.font-name');
      return nameElement ? nameElement.textContent : '#';
    }
    return '#';
  }
  
  setSelectedRow(row) {
    if (this._selectedRow === row) {
      if (this._selectedRow) {
        this._selectedRow.classList.remove('highlight');
      }
      this._selectedRow = null;
    } else {
      if (this._selectedRow) {
        this._selectedRow.classList.remove('highlight');
      }
  
      this._selectedRow = row;
  
      if (this._selectedRow) {
        this._selectedRow.classList.add('highlight');
      }
    }

    return this.getSelectedRow();
  }
}