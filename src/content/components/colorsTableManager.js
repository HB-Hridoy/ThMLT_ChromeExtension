
import AppContext from "../services/appContext.js";
import { textFormatterModal } from "./textFormatterModal.js";

export class ColorsTableManager {
  constructor() {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._currentTheme = null;
    this._currentData = new Map(); // semanticId -> semantic data
    this._primitivesMap = new Map(); // primitiveId -> primitive data
    this._domElements = new Map(); // semanticId -> DOM element
    this._selectedRow = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-colors-table-body");
    
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
   * Update primitives data and create lookup map
   */
  updatePrimitives(primitives) {
    this._primitivesMap.clear();
    primitives.forEach(primitive => {
      this._primitivesMap.set(primitive.primitiveId, primitive);
    });
  }

  /**
   * Get the actual color value for a semantic in the current theme
   */
  getThemeValue(semantic, theme) {
    const themeRef = semantic.themeValues[theme];
    
    // If it's a primitive ID (number), look up the primitive
    const primitiveId = parseInt(themeRef);
    if (!isNaN(primitiveId) && this._primitivesMap.has(primitiveId)) {
      return this._primitivesMap.get(primitiveId).primitiveValue;
    }
    
    // Otherwise, return the value as-is (might be hex color or other reference)
    return themeRef || '#000000';
  }

  /**
   * Create a new table row element
   */
  createRowElement(semantic, theme) {
    const themeValue = this.getThemeValue(semantic, theme);
    
    const row = document.createElement('tr');
    row.setAttribute('rowId', semantic.semanticId);
    row.innerHTML = `
      <td class="semantic-name">${semantic.semanticName}</td>
      <td>
        <div class="semantic-value-cell">
          <div class="semantic-value-thumbnail" style="background-color: ${themeValue};"></div>
          <div><span class="color-value">${themeValue}</span></div>
        </div>
      </td>
    `;

    // ========== EVENT LISTENERS BEGIN ========== //

    row.addEventListener('click', ()=> {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        color: colorText
      })
    })

    // ========== EVENT LISTENERS END ========== //
    
    return row;
  }

  /**
   * Update an existing row element
   */
  updateRowElement(row, semantic, theme) {
    const themeValue = this.getThemeValue(semantic, theme);
    
    // Update semantic name
    const nameCell = row.querySelector('.semantic-name');
    if (nameCell && nameCell.textContent !== semantic.semanticName) {
      nameCell.textContent = semantic.semanticName;
    }
    
    // Update color thumbnail
    const thumbnail = row.querySelector('.semantic-value-thumbnail');
    if (thumbnail) {
      const newBgColor = `background-color: ${themeValue};`;
      if (thumbnail.style.cssText !== newBgColor) {
        thumbnail.style.backgroundColor = themeValue;
      }
    }
    
    // Update color value text
    const valueSpan = row.querySelector('.color-value');
    if (valueSpan && valueSpan.textContent !== themeValue) {
      valueSpan.textContent = themeValue;
    }
  }

  /**
   * Check if semantic data has changed compared to stored data
   */
  hasSemanticChanged(oldSemantic, newSemantic, theme) {
    if (!oldSemantic) return true;
    
    return (
      oldSemantic.semanticName !== newSemantic.semanticName ||
      oldSemantic.orderIndex !== newSemantic.orderIndex ||
      oldSemantic.themeValues[theme] !== newSemantic.themeValues[theme]
    );
  }

  /**
   * Insert row at correct position based on orderIndex
   */
  insertRowAtPosition(row, orderIndex) {
    const rows = Array.from(this._tableBody.children);
    let insertIndex = rows.length;
    
    // Find the correct position to maintain order
    for (let i = 0; i < rows.length; i++) {
      const existingRowId = parseInt(rows[i].getAttribute('rowId'));
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
    
    // Update all existing rows with new theme values
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
  render(semantics, primitives, defaultTheme = 'Light') {

    this._domElements.forEach(row => {
      if (row) {
        row.style.display = "";
      }
    });
    
    // Update primitives lookup
    this.updatePrimitives(primitives);
    
    // Update current theme
    this._currentTheme = defaultTheme;
    
    // Sort semantics by orderIndex
    const sortedSemantics = [...semantics].sort((a, b) => a.orderIndex - b.orderIndex);
    
    // If table is empty, do initial render
    if (this._tableBody.children.length === 0) {
      this.initialRender(sortedSemantics, defaultTheme);
      return;
    }
    
    // Otherwise, do differential update
    this.updateRender(sortedSemantics, defaultTheme);
  }

  searchRender(query) {
    const lowerSearchText = query.trim().toLowerCase();
  
    this._domElements.forEach((row, semanticId) => {
      const semantic = this._currentData.get(semanticId);
  
      if (!semantic || !row) return;
  
      const matches = lowerSearchText === "" || semantic.semanticName.toLowerCase().includes(lowerSearchText);
  
      row.style.display = matches ? "" : "none";
    });
  }
  

  /**
   * Initial render when table is empty
   */
  initialRender(sortedSemantics, theme) {
    // Clear existing data
    this._currentData.clear();
    this._domElements.clear();
    
    // Create and append all rows
    const fragment = document.createDocumentFragment();
    
    sortedSemantics.forEach(semantic => {
      const row = this.createRowElement(semantic, theme);
      fragment.appendChild(row);
      
      // Store references
      this._currentData.set(semantic.semanticId, { ...semantic });
      this._domElements.set(semantic.semanticId, row);
    });
    
    this._tableBody.appendChild(fragment);
  }

  /**
   * Update render with DOM diffing
   */
  updateRender(sortedSemantics, theme) {
    const newDataMap = new Map();
    const toAdd = [];
    const toUpdate = [];
    const toRemove = [];
    
    // Build new data map and identify changes
    sortedSemantics.forEach(semantic => {
      newDataMap.set(semantic.semanticId, semantic);
      
      const existing = this._currentData.get(semantic.semanticId);
      
      if (!existing) {
        // New semantic to add
        toAdd.push(semantic);
      } else if (this.hasSemanticChanged(existing, semantic, theme)) {
        // Existing semantic to update
        toUpdate.push(semantic);
      }
    });
    
    // Find semantics to remove
    this._currentData.forEach((existing, semanticId) => {
      if (!newDataMap.has(semanticId)) {
        toRemove.push(semanticId);
      }
    });
    
    // Remove obsolete rows
    toRemove.forEach(semanticId => {
      const row = this._domElements.get(semanticId);
      if (row && row.parentNode) {
        row.parentNode.removeChild(row);
      }
      this._domElements.delete(semanticId);
      this._currentData.delete(semanticId);
    });
    
    // Update existing rows
    toUpdate.forEach(semantic => {
      const row = this._domElements.get(semantic.semanticId);
      if (row) {
        this.updateRowElement(row, semantic, theme);
        this._currentData.set(semantic.semanticId, { ...semantic });
      }
    });
    
    // Add new rows
    toAdd.forEach(semantic => {
      const row = this.createRowElement(semantic, theme);
      this.insertRowAtPosition(row, semantic.orderIndex);
      
      this._domElements.set(semantic.semanticId, row);
      this._currentData.set(semantic.semanticId, { ...semantic });
    });
    
    // Reorder if necessary (only if we added new items)
    if (toAdd.length > 0) {
      this.reorderIfNeeded(sortedSemantics);
    }
  }

  /**
   * Reorder table rows if needed to maintain orderIndex sort
   */
  reorderIfNeeded(sortedSemantics) {
    const currentRows = Array.from(this._tableBody.children);
    const expectedOrder = sortedSemantics.map(s => s.semanticId);
    const currentOrder = currentRows.map(row => parseInt(row.getAttribute('rowId')));
    
    // Check if reordering is needed
    const needsReorder = !expectedOrder.every((id, index) => id === currentOrder[index]);
    
    if (needsReorder) {
      // Create fragment with correctly ordered rows
      const fragment = document.createDocumentFragment();
      
      expectedOrder.forEach(semanticId => {
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
    this._tableBody.innerHTML = '';
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
      const nameElement = this._selectedRow.querySelector('.semantic-name');
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
