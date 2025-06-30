import AppContext from "../services/appContext";
import { textFormatterModal } from "./textFormatterModal";

export class TypographyTableManager {
  constructor() {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._currentTypographies = new Map(); // typographyId -> typography data
    this._domElements = new Map(); // typographyId -> DOM element
    this._selectedRow = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-typography-table-body");
    
      if (tableBody) {
        this._tableBody = tableBody;
    
        observerInstance.disconnect(); // Stop observing
        console.log("typography body found and stored.");
      }
    });
    
    // Correct root to observe
    observer.observe(this._shadowRoot, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Main method to update the table with new typography data
   * @param {Array} newTypography - Array of typography objects
   */
  render(newTypographies) {
    const sortedTypographies = this._sortTypographyByOrderIndex(newTypographies);
    
    if (this.isTableEmpty()) {
      this._initialRender(sortedTypographies);
    } else {
      this._updateRender(sortedTypographies);
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
   * Sort typography by orderIndex
   * @param {Array} typography - Array of typography objects
   * @returns {Array} Sorted array
   */
  _sortTypographyByOrderIndex(typography) {
    return [...typography].sort((a, b) => a.orderIndex - b.orderIndex);
  }

  /**
   * Initial render when table is empty
   * @param {Array} sortedTypographies - Sorted typography data
   */
  _initialRender(sortedTypographies) {
    const fragment = document.createDocumentFragment();
    
    sortedTypographies.forEach(typography => {
      const row = this._createTypographyRow(typography);
      fragment.appendChild(row);
      
      // Store references
      this._currentTypographies.set(typography.typographyId, { ...typography });
      this._domElements.set(typography.typographyId, row);
    });
    
    this._tableBody.appendChild(fragment);
  }

  /**
   * Update render when table has existing content
   * @param {Array} sortedTypographies - Sorted typography data
   */
  _updateRender(sortedTypographies) {
    const newTypographiesMap = new Map(sortedTypographies.map(typography => [typography.typographyId, typography]));
    const currentTypographyIds = new Set(this._currentTypographies.keys());
    const newTypographyIds = new Set(newTypographiesMap.keys());

    // Find changes
    const toAdd = [...newTypographyIds].filter(id => !currentTypographyIds.has(id));
    const toRemove = [...currentTypographyIds].filter(id => !newTypographyIds.has(id));
    const toUpdate = [...newTypographyIds].filter(id => 
      currentTypographyIds.has(id) && this._hasTypographyChanged(this._currentTypographies.get(id), newTypographiesMap.get(id))
    );

    // Remove obsolete typography
    this._removeTypographies(toRemove);

    // Update modified typography
    this._updateTypographies(toUpdate, newTypographiesMap);

    // Add new typography
    this._addTypographies(toAdd, newTypographiesMap);

    // Ensure correct order
    this._reorderTable(sortedTypographies);

    // Update current state
    this._currentTypographies = newTypographiesMap;
  }

  /**
   * Check if typography data has changed
   * @param {Object} oldTypography - Previous typography data
   * @param {Object} newTypography - New typography data
   * @returns {boolean}
   */
  _hasTypographyChanged(oldTypography, newTypography) {
    return oldTypography.typographyName !== newTypography.typographyName ||
           oldTypography.linkedFont !== newTypography.linkedFont ||
           oldTypography.orderIndex !== newTypography.orderIndex;
  }

  /**
   * Create a new typography row element
   * @param {Object} typography - Typography data
   * @returns {HTMLElement}
   */
  _createTypographyRow(typography) {
    const row = document.createElement('tr');
    row.setAttribute('rowId', typography.typographyId);
    
    const nameCell = document.createElement('td');
    nameCell.classList.add("typography-name");
    nameCell.textContent = typography.typographyName;
    
    const valueCell = document.createElement('td');
    valueCell.classList.add("typography-value");
    valueCell.textContent = "";
    
    row.appendChild(nameCell);
    row.appendChild(valueCell);

    // ========== EVENT LISTENERS BEGIN ========== //

    row.addEventListener('click', ()=> {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        typography: colorText
      })
    })

    // ========== EVENT LISTENERS END ========== //
    
    return row;
  }

  /**
   * Remove typography from table
   * @param {Array} typographyIdsToRemove - Array of fontIds to remove
   */
  _removeTypographies(typographyIdsToRemove) {
    typographyIdsToRemove.forEach(typographyId => {
      const row = this._domElements.get(typographyId);
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
      this._domElements.delete(typographyId);
      this._currentTypographies.delete(typographyId);
    });
  }

  /**
   * Update existing typography rows
   * @param {Array} typographyIdsToUpdate - Array of fontIds to update
   * @param {Map} newTypographiesMap - Map of new typography data
   */
  _updateTypographies(typographyIdsToUpdate, newTypographiesMap) {
    typographyIdsToUpdate.forEach(typographyId => {
      const row = this._domElements.get(typographyId);
      const newTypography = newTypographiesMap.get(typographyId);
      
      if (row && newTypography) {
        const [nameCell, valueCell] = row.children;
        nameCell.textContent = newTypography.typographyName;
        valueCell.textContent = "";
      }
    });
  }

  /**
   * Add new typography rows
   * @param {Array} typographyIdsToAdd - Array of fontIds to add
   * @param {Map} newTypographiesMap - Map of new typography data
   */
  _addTypographies(typographyIdsToAdd, newTypographiesMap) {
    typographyIdsToAdd.forEach(typographyId => {
      const typography = newTypographiesMap.get(typographyId);
      const row = this._createTypographyRow(typography);
      
      this._domElements.set(typographyId, row);
      this._tableBody.appendChild(row);
    });
  }

  /**
   * Reorder table rows according to orderIndex
   * @param {Array} sortedTypographies - Fonts sorted by orderIndex
   */
  _reorderTable(sortedTypographies) {
    const fragment = document.createDocumentFragment();
    
    sortedTypographies.forEach(typography => {
      const row = this._domElements.get(typography.typographyId);
      if (row) {
        fragment.appendChild(row);
      }
    });
    
    // Clear table and append in correct order
    this._tableBody.innerHTML = '';
    this._tableBody.appendChild(fragment);
  }

  /**
   * Get current typography data
   * @returns {Array} Current typography as array
   */
  getCurrentTypographies() {
    return Array.from(this._currentTypographies.values());
  }

  /**
   * Clear the table
   */
  clear() {
    this._tableBody.innerHTML = '';
    this._currentTypographies.clear();
    this._domElements.clear();
  }

  getSelectedRow() {
    if (this._selectedRow) {
      const nameElement = this._selectedRow.querySelector('.typography-name');
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