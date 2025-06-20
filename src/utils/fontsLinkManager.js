
import cacheManager from "./cache/cacheManager.js";
import { MODALS } from "./modalManager.js";
import { getDatabaseManager } from "../db/DatabaseManager.js";
import { linkedFontInput } from "../core/modals/typographyModal.js";
import { fontLinkModal } from "../core/modals/fontLinkModal.js";

class FontsLinkManager {
  constructor() {
    this.db = null;
    this.container = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const container = document.getElementById("font-link-modal-fonts-container");

      if (container) {
        this.container = container;
        observerInstance.disconnect();
        console.log("Link Font initialized.");
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async init() {
    if (!this.db) this.db = await getDatabaseManager();
  }

  render(fonts) {
    if (!this.container) return;
    const sortedFonts = [...fonts].sort((a, b) => a.orderIndex - b.orderIndex);
    const isEmpty = this.container.children.length === 0;

    if (isEmpty) {
      this._initialRender(sortedFonts);
    } else {
      this._updateRender(sortedFonts);
    }
  }

  _initialRender(sortedFonts) {
    const fragment = document.createDocumentFragment();
    sortedFonts.forEach(font => {
      const listItem = this._createFontElement(font);
      fragment.appendChild(listItem);
    });
    this.container.appendChild(fragment);
  }

  _updateRender(newFonts) {
    const existingElementsMap = new Map();
    Array.from(this.container.children).forEach(element => {
      const fontId = element.getAttribute('fontId');
      if (fontId) {
        existingElementsMap.set(parseInt(fontId), element);
      }
    });

    const newFontsMap = new Map();
    newFonts.forEach(font => {
      newFontsMap.set(font.fontId, font);
    });

    existingElementsMap.forEach((element, fontId) => {
      if (!newFontsMap.has(fontId)) {
        this.container.removeChild(element);
      }
    });

    const fragment = document.createDocumentFragment();
    newFonts.forEach(font => {
      const fontId = font.fontId;
      const existingElement = existingElementsMap.get(fontId);

      if (existingElement) {
        this._updateFontElement(existingElement, font);
        const currentOrderIndex = parseInt(existingElement.getAttribute('order-index'));
        if (currentOrderIndex !== font.orderIndex) {
          existingElement.setAttribute('order-index', font.orderIndex);
        }
      } else {
        const newElement = this._createFontElement(font);
        fragment.appendChild(newElement);
      }
    });

    if (fragment.children && fragment.children.length > 0) {
      this.container.appendChild(fragment);
    }

    this._reorderElements();
  }

  _createFontElement(font) {
    const listItem = document.createElement('li');
    listItem.setAttribute('fontId', font.fontId);
    listItem.setAttribute('order-index', font.orderIndex);

    const content = `
      <div class="flex flex-col p-2 text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow">
        <p class="text-sm font-bold truncate">${font.fontName}</p>
        <code class="text-[10px] text-gray-500 mt-1">${font.fontValue}</code>
      </div>
    `;

    listItem.innerHTML = content;

    listItem.addEventListener('click', async () => {
      
      linkedFontInput.setAttribute("linkedFontId", font.fontId);
      linkedFontInput.setAttribute("linkedFontName", font.fontName);
      linkedFontInput.setAttribute("linkedFontValue", font.fontValue);

      linkedFontInput.value = font.fontName;
      linkedFontInput.dispatchEvent(new Event("input", { bubbles: true }));

      fontLinkModal.hide();
    });

    return listItem;
  }

  _updateFontElement(element, font) {
    const nameElement = element.querySelector('p');
    const valueElement = element.querySelector('code');

    if (nameElement.textContent !== font.fontName) {
      nameElement.textContent = font.fontName;
    }

    if (valueElement.textContent !== font.fontValue) {
      valueElement.textContent = font.fontValue;
    }
  }

  _reorderElements() {
    const elements = Array.from(this.container.children);
    elements.sort((a, b) => {
      const aIndex = parseInt(a.getAttribute('order-index'));
      const bIndex = parseInt(b.getAttribute('order-index'));
      return aIndex - bIndex;
    });
    elements.forEach(element => {
      this.container.appendChild(element);
    });
  }
}

const fontsLinkManager = new FontsLinkManager();
export { fontsLinkManager };
