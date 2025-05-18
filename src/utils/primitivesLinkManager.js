import { linkPrimitiveModal } from "../core/modals/linkPrimitiveModal.js";
import DatabaseManager from "../db/DatabaseManager.js";
import cacheManager from "./cache/cacheManager.js";
import { MODALS } from "./modalManager.js";
import { semanticTable } from "./semanticTable.js";

/**
 * PrimitivesLinkManager Class
 * 
 * Handles rendering and updating primitives in a modal.
 * - Initial render: Renders entire list sorted by orderIndex if container is empty
 * - Update render: Efficiently updates only necessary DOM elements by:
 *   - Adding new primitives
 *   - Removing obsolete primitives
 *   - Updating modified primitives
 *   - Preserving unchanged DOM elements
 */
class PrimitivesLinkManager {
  constructor() {

    this.container = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const container = document.getElementById("select-primitive-modal-primitives-container");

      if (container) {
        this.container = container;

        // Stop observing once container is found and stored
        observerInstance.disconnect();
        console.log("Link Primitive initialized.");
      }
    });

    // Start observing the document body for the container
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Renders or updates primitives in the container
   * @param {Array} primitives - Array of primitive objects
   */
  render(primitives) {
    if (!this.container) return;
    
    // Sort primitives by orderIndex
    const sortedPrimitives = [...primitives].sort((a, b) => a.orderIndex - b.orderIndex);
    
    // Check if this is an initial render or an update
    const isEmpty = this.container.children.length === 0;
    
    if (isEmpty) {
      // Initial render - container is empty
      this._initialRender(sortedPrimitives);
    } else {
      // Update render - container already has items
      this._updateRender(sortedPrimitives);
    }
  }

  /**
   * Performs initial render when container is empty
   * @param {Array} sortedPrimitives - Array of primitives sorted by orderIndex
   * @private
   */
  _initialRender(sortedPrimitives) {
    // Create document fragment for better performance
    const fragment = document.createDocumentFragment();
    
    sortedPrimitives.forEach(primitive => {
      const listItem = this._createPrimitiveElement(primitive);
      fragment.appendChild(listItem);
    });
    
    // Append all elements at once
    this.container.appendChild(fragment);
  }

  /**
   * Updates existing primitives list by diffing with new data
   * @param {Array} newPrimitives - Array of new primitives sorted by orderIndex
   * @private
   */
  _updateRender(newPrimitives) {
    // Create a map of existing elements in the DOM for fast lookup
    const existingElementsMap = new Map();
    Array.from(this.container.children).forEach(element => {
      const primitiveId = element.getAttribute('primitiveId');
      if (primitiveId) {
        existingElementsMap.set(parseInt(primitiveId), element);
      }
    });
    
    // Create a map of new primitives for fast lookup
    const newPrimitivesMap = new Map();
    newPrimitives.forEach(primitive => {
      newPrimitivesMap.set(primitive.primitiveId, primitive);
    });
    
    // 1. Remove obsolete elements (those not in the new data)
    existingElementsMap.forEach((element, primitiveId) => {
      if (!newPrimitivesMap.has(primitiveId)) {
        this.container.removeChild(element);
      }
    });
    
    // 2. Process each new primitive - either update existing or add new
    const fragment = document.createDocumentFragment();
    let previousElement = null;
    
    newPrimitives.forEach(primitive => {
      const primitiveId = primitive.primitiveId;
      const existingElement = existingElementsMap.get(primitiveId);
      
      if (existingElement) {
        // Element exists - check if it needs updates
        this._updatePrimitiveElement(existingElement, primitive);
        
        // Move to correct position if needed
        const currentOrderIndex = parseInt(existingElement.getAttribute('order-index'));
        if (currentOrderIndex !== primitive.orderIndex) {
          // We'll reposition this element later based on order
          existingElement.setAttribute('order-index', primitive.orderIndex);
        }
      } else {
        // New element - create and add to fragment
        const newElement = this._createPrimitiveElement(primitive);
        fragment.appendChild(newElement);
      }
    });
    
    // Append any new elements to the container
    if (fragment.children && fragment.children.length > 0) {
      this.container.appendChild(fragment);
    }
    
    // 3. Reorder elements based on orderIndex
    this._reorderElements();
  }

  /**
   * Creates a new primitive list item element
   * @param {Object} primitive - Primitive data object
   * @returns {HTMLElement} - The created list item element
   * @private
   */
  _createPrimitiveElement(primitive) {
    const listItem = document.createElement('li');
    listItem.setAttribute('primitiveId', primitive.primitiveId);
    listItem.setAttribute('order-index', primitive.orderIndex);
    
    const content = `
      <div class="flex items-center p-2 text-base text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow">
        <div class="h-4 w-4 mr-2 border rounded-md" style="background-color: ${primitive.primitiveValue}"></div>
        <p class="text-xs font-medium mr-2 flex-1">${primitive.primitiveName}</p>
      </div>
    `;
    
    listItem.innerHTML = content;

    listItem.addEventListener('click', async ()=> {

      const linkPrimitiveModalElement = document.getElementById(MODALS.LINK_PRIMITIVE.id);

      const semanticId = linkPrimitiveModalElement.getAttribute("semanticId");
      const theme = linkPrimitiveModalElement.getAttribute("theme");
      const primitiveId = listItem.getAttribute("primitiveId");
      const primitiveData = cacheManager.primitives.getById(primitiveId);

      await DatabaseManager.semantics.updateThemeValue({
        semanticId,
        theme,
        value: primitiveId
      });

      semanticTable.updateValueCell({
        semanticId,
        theme,
        primitiveData
      });

      linkPrimitiveModal.hide();

    });
    return listItem;
  }

  /**
   * Updates an existing primitive element if needed
   * @param {HTMLElement} element - Existing DOM element
   * @param {Object} primitive - New primitive data
   * @private
   */
  _updatePrimitiveElement(element, primitive) {
    // Check if name or value needs updating
    const colorBox = element.querySelector('.h-4.w-4');
    const nameElement = element.querySelector('p');
    
    // Update color if changed
    const currentColor = colorBox.style.backgroundColor;
    const hexToRgb = this._hexToRgb(primitive.primitiveValue);
    if (hexToRgb && !this._isSameColor(currentColor, hexToRgb)) {
      colorBox.style.backgroundColor = primitive.primitiveValue;
    }
    
    // Update name if changed
    if (nameElement.textContent !== primitive.primitiveName) {
      nameElement.textContent = primitive.primitiveName;
    }
  }

  /**
   * Reorders elements based on their order-index attribute
   * @private
   */
  _reorderElements() {
    const elements = Array.from(this.container.children);
    
    // Sort elements by order-index
    elements.sort((a, b) => {
      const aIndex = parseInt(a.getAttribute('order-index'));
      const bIndex = parseInt(b.getAttribute('order-index'));
      return aIndex - bIndex;
    });
    
    // Reposition elements if needed
    elements.forEach(element => {
      this.container.appendChild(element);
    });
  }

  /**
   * Helper function to convert hex color to RGB
   * @param {string} hex - Hex color code
   * @returns {Object|null} - RGB object or null if invalid
   * @private
   */
  _hexToRgb(hex) {
    // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
    const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
    hex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);

    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * Compares two colors (RGB string and RGB object)
   * @param {string} color1 - First color (RGB string)
   * @param {Object} color2 - Second color (RGB object)
   * @returns {boolean} - Whether colors are the same
   * @private
   */
  _isSameColor(color1, color2) {
    if (!color1 || !color2) return false;
    
    // Extract RGB values from color string (from style.backgroundColor)
    const rgbRegex = /rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/;
    const match = rgbRegex.exec(color1);
    
    if (!match) return false;
    
    const r1 = parseInt(match[1], 10);
    const g1 = parseInt(match[2], 10);
    const b1 = parseInt(match[3], 10);
    
    // Compare with the RGB object
    return r1 === color2.r && g1 === color2.g && b1 === color2.b;
  }
}

const primitivesLinkManager = new PrimitivesLinkManager();
export { primitivesLinkManager };
