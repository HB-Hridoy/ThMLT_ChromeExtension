import AppContext from "../services/appContext";
import { textFormatterModal } from "./textFormatterModal.js";


export class TranslationsTableManager {
  constructor(tableBodyElement) {
    this._shadowRoot = AppContext.getShadowRoot();
    this._tableBody = null;
    this._selectedRow = null;
    this.currentTranslations = new Map(); // translationId -> translation data
    this.currentRows = new Map(); // translationId -> DOM row element
    this.currentDefaultLanguage = null; // Track current language for change detection

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const tableBody = this._shadowRoot.querySelector(".text-formatter-modal-translations-table-body");
    
      if (tableBody) {
        this._tableBody = tableBody;
    
        observerInstance.disconnect(); // Stop observing
        console.log("Translations Table body found and stored.");
      }
    });
    
    // Correct root to observe
    observer.observe(this._shadowRoot, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Main method to render translations with efficient DOM diffing
   * @param {Array} translations - Array of translation objects
   * @param {string} defaultLanguage - Default language for translation values
   */
  render(translations, defaultLanguage = 'en') {
    const transformedTranslations = transformTranslations(translations, "tempProjectId");
    const originalDefaultLanguage = translations.DefaultLanguage;

    console.log(originalDefaultLanguage);
    

    translations = transformedTranslations;
    defaultLanguage = originalDefaultLanguage;
    if (!translations || !Array.isArray(translations)) {
      console.warn('Invalid translations data provided');
      return;
    }

    // Sort translations by orderIndex for consistent ordering
    const sortedTranslations = [...translations].sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Convert to Map for O(1) lookups
    const newTranslationsMap = new Map(
      sortedTranslations.map(t => [t.translationId, t])
    );

    // Check if language changed - if so, force update all rows
    const languageChanged = this.currentDefaultLanguage !== null && 
                           this.currentDefaultLanguage !== defaultLanguage;

    // Initial render - table body is empty
    if (this._tableBody.children.length === 0) {
      this._initialRender(sortedTranslations, defaultLanguage);
      this._updateInternalState(newTranslationsMap, defaultLanguage);
      return;
    }

    // Update render - perform DOM diffing
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
    
    sortedTranslations.forEach(translation => {
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
    
    // Find translations to add, remove, and potentially update
    const toAdd = [...newIds].filter(id => !existingIds.has(id));
    const toRemove = [...existingIds].filter(id => !newIds.has(id));
    const toCheck = [...newIds].filter(id => existingIds.has(id));

    // Remove obsolete translations
    this._removeTranslations(toRemove);

    // Update existing translations that have changed
    this._updateExistingTranslations(toCheck, newTranslationsMap, defaultLanguage, languageChanged);

    // Add new translations
    this._addNewTranslations(toAdd, newTranslationsMap, defaultLanguage);

    // Ensure proper ordering
    this._ensureCorrectOrdering(sortedTranslations);
  }

  /**
   * Remove translations that are no longer present
   * @param {Array} translationIds - IDs of translations to remove
   */
  _removeTranslations(translationIds) {
    translationIds.forEach(id => {
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
    translationIds.forEach(id => {
      const currentTranslation = this.currentTranslations.get(id);
      const newTranslation = newTranslationsMap.get(id);
      const row = this.currentRows.get(id);

      if (!row || !currentTranslation || !newTranslation) return;

      // Check if update is needed (force update if language changed)
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
    
    translationIds.forEach(id => {
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
    const currentOrder = Array.from(this._tableBody.children).map(row => 
      parseInt(row.getAttribute('rowId'))
    );
    const expectedOrder = sortedTranslations.map(t => t.translationId);

    // Check if reordering is needed
    if (currentOrder.length !== expectedOrder.length || 
        !currentOrder.every((id, index) => id === expectedOrder[index])) {
      hasOrderChanged = true;
    }

    if (hasOrderChanged) {
      const fragment = document.createDocumentFragment();
      expectedOrder.forEach(id => {
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
    const row = document.createElement('tr');
    row.setAttribute('rowId', translation.translationId);
    row.setAttribute('translationLanguage', defaultLanguage);

    const translationValue = this._getTranslationValue(translation, defaultLanguage);
   
    row.innerHTML = `
      <td class="translation-name">${this._escapeHtml(translation.translationName)}</td>
      <td class="translationValue">${this._escapeHtml(translationValue)}</td>
    `;

    // ========== EVENT LISTENERS BEGIN ========== //

    row.addEventListener('click', ()=> {
      const colorText = this.setSelectedRow(row);
      textFormatterModal.setFormattedText({
        translation: colorText
      })
    })

    // ========== EVENT LISTENERS END ========== //

    return row;
  }

  /**
   * Update an existing row element
   * @param {HTMLElement} row - Row element to update
   * @param {Object} translation - New translation data
   * @param {string} defaultLanguage - Default language
   */
  _updateRowElement(row, translation, defaultLanguage) {
    row.setAttribute('translationLanguage', defaultLanguage);
    
    const nameCell = row.querySelector('.translation-name');
    const valueCell = row.querySelector('.translationValue');
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
    // Handle typo in property name (tranalstionName vs translationName)
    const name = translation.translationName || translation.tranalstionName || '';
    const values = translation.translationValues || {};
    return values[defaultLanguage] || name || '';
  }

  /**
   * Check if a translation has changed
   * @param {Object} current - Current translation
   * @param {Object} updated - Updated translation
   * @param {string} defaultLanguage - Default language
   * @returns {boolean} - True if changed
   */
  _hasTranslationChanged(current, updated, defaultLanguage) {
    // Handle typo in property name
    const currentName = current.translationName || current.tranalstionName || '';
    const updatedName = updated.translationName || updated.tranalstionName || '';
    
    return (
      currentName !== updatedName ||
      current.orderIndex !== updated.orderIndex ||
      this._getTranslationValue(current, defaultLanguage) !== this._getTranslationValue(updated, defaultLanguage)
    );
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
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Clear the table
   */
  clear() {
    this._tableBody.innerHTML = '';
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
      const nameElement = this._selectedRow.querySelector('.translation-name');
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

/**
 * Transforms translation JSON into optimized array format with metadata
 * @param {Object} data - The complete translation JSON object
 * @param {string} projectId - UUID or identifier for the project
 * @returns {Array} Array of translation objects with metadata
 */
function transformTranslations(data, projectId) {
  const translations = data.Translations;
  const keys = Object.keys(translations);
  const result = new Array(keys.length);
  
  let orderIndex = 1000;
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
      
      orderIndex += 1000;
      translationId++;
  }
  
  return result;
}