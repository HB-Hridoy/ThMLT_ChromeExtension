
import { typographyModal } from "../core/modals/typographyModal.js";
import { calculateNewOrderIndex } from "../core/sidepanel.js";
import cacheManager from "./cache/cacheManager.js";
import { getDatabaseManager } from "../db/DatabaseManager.js";

class TypographyTableManager {
  constructor() {
    this.db = null;
    this.currentRowId = 1;
    this.table = null;
    this.tableBody = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const table = document.getElementById("typography-table");

      if (table) {
        this.table = table;
        this.tableBody = this.table.querySelector("tbody");

        // Stop observing once table is found and stored
        observerInstance.disconnect();
        console.log("[TYPOGRAPHY TABLE] Table initialized.");
      }
    });

    // Start observing the document body for the table
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  async init(){
    if (!this.db) this.db = await getDatabaseManager();
  }

addRow({ 
  typographyId, 
  typographyName, 
  linkedFont, 
  fontSize, 
  lineHeight, 
  letterSpacing, 
  orderIndex, 
  animation = false 
} = {}) {

  const resolvedFont = linkedFont === "0"
        ? "default"
        : cacheManager.fonts.getName({ fontId: linkedFont }) || "unknown";

  const nameTd = `
    <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap w-2/4">
      <div class="flex items-center w-full">
        <svg class="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24">
          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
            d="m10.5785 19 4.2979-10.92966c.0369-.09379.1674-.09379.2042 0L19.3785 19m-8.8 0H9.47851m1.09999 0h1.65m7.15 0h-1.65m1.65 0h1.1m-7.7-3.9846h4.4M3 16l1.56685-3.9846m0 0 2.73102-6.94506c.03688-.09379.16738-.09379.20426 0l2.50367 6.94506H4.56685Z" />
        </svg>
        <p id="typography-name" class="text-xs text-gray-600 ml-2 w-full truncate">${typographyName}</p>
      </div>
    </td>
  `;

  const pill = (label, value, id) => `
    <div class="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md w-fit mb-1">
      <span class="text-gray-500">${label}:</span> <span class="font-bold" id="${id}">${value}</span>
    </div>
  `;


  const typographyPropertiesTd = `
    <td class="px-6 py-3 w-2/4 align-top">
      <div class="flex justify-between items-start">
        <div class="flex flex-col">
          <div class="text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-md w-fit mb-1">
            <span class="text-gray-500">Font :</span> <span class="font-bold" linked-font = "${linkedFont}" id="pill-font-${typographyId}">${resolvedFont}</span>
          </div>
          ${pill("Size", fontSize, `pill-size-${typographyId}`)}
          ${pill("Line Height", lineHeight, `pill-line-height-${typographyId}`)}
          ${pill("Letter Spacing", letterSpacing, `pill-letter-spacing-${typographyId}`)}
        </div>
        <button id="typography-edit-button-${typographyId}" 
          class="typography-edit-button hidden text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-md text-sm p-1 ml-2 transition-all duration-150">
          <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="currentColor" stroke-linecap="round" stroke-width="2"
              d="M6 4v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2m6-16v2m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v10m6-16v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2"/>
          </svg>
          <span class="sr-only">Edit</span>
        </button>
      </div>
    </td>
  `;


  const newRow = `
    <tr id="${typographyId}" order-index="${orderIndex}" draggable="true" class="typography-row bg-white border-b cursor-grab active:cursor-grabbing hover:bg-gray-50">
      ${nameTd}
      ${typographyPropertiesTd}
    </tr>
  `;

  this.tableBody.insertAdjacentHTML("beforeend", newRow);

  const addedRow = this.tableBody.lastElementChild;
  makeFontRowDraggable(addedRow);

  if (animation) {
    addedRow.classList.add("highlight-added-row");
    setTimeout(() => {
      addedRow.classList.remove("highlight-added-row");
    }, 500);
  }

  this.currentRowId++;

  document.querySelector(`#typography-edit-button-${typographyId}`)?.addEventListener("click", (e) => {
    e.stopPropagation();

    const typography = cacheManager.typography.get({ id: typographyId });

    console.log(JSON.stringify(typography, null, 2));
    

    typographyModal.show({
      mode: typographyModal.modes.EDIT,
      typographyId,
      currentTypographyName: typography.typographyName,
      currentLinkedFont: typography.linkedFont,
      currentFontSize: typography.fontSize,
      currentLineHeight: typography.lineHeight,
      currentLetterSpacing: typography.letterSpacing
    });
  });
}


  getRow({ typographyId }){
    const row = this.table.querySelector(`tr[id="${typographyId}"]`);
    if (row) {
      const name = row.querySelector("#typography-name").textContent.trim();
      const value = row.querySelector("#linked-font").textContent.trim();
      return { typographyId, name, value };
    }
    return null;
  }

  updateRow({ typographyId, typographyName, linkedFont, fontSize, lineHeight, letterSpacing } = {}) {
    const row = this.table.querySelector(`tr[id="${typographyId}"]`);
    if (!row) return;

    if (typographyName !== undefined) {
      const nameElement = row.querySelector("#typography-name");
      if (nameElement) nameElement.textContent = typographyName;
    }

    if (linkedFont !== undefined) {

      const resolvedFont = linkedFont === "0"
        ? "default"
        : cacheManager.fonts.getName({ fontId: linkedFont }) || "unknown";

      const el = document.getElementById(`pill-font-${typographyId}`);
      if (el) el.textContent = resolvedFont;
    }



    if (fontSize !== undefined) {
      const el = document.getElementById(`pill-size-${typographyId}`);
      if (el) el.textContent = fontSize;
    }

    if (lineHeight !== undefined) {
      const el = document.getElementById(`pill-line-height-${typographyId}`);
      if (el) el.textContent = lineHeight;
    }

    if (letterSpacing !== undefined) {
      const el = document.getElementById(`pill-letter-spacing-${typographyId}`);
      if (el) el.textContent = letterSpacing;
    }

    row.classList.add("highlight-update-row");
    setTimeout(() => {
      row.classList.remove("highlight-update-row");
    }, 1500);
  }

  updateLinkedFonts({ linkedFontId }){
    const linkedFonts = this.tableBody.querySelectorAll('[linked-font]');
    linkedFonts.forEach(cell => {
      const spanLinkedFontId = cell.getAttribute('linked-font');
      if (spanLinkedFontId === linkedFontId) {

        const resolvedFont = linkedFontId === "0"
        ? "default"
        : cacheManager.fonts.getName({ fontId: linkedFontId }) || "unknown";

        cell.textContent = resolvedFont;
      
      }
    });
  }


  
  deleteRow({ typographyId }) {
    const row = this.table.querySelector(`tr[id="${typographyId}"]`);
    if (row) {
      row.classList.add("highlight-deleted-row");
  
      // Remove the row after the fade-out transition ends
      row.addEventListener("transitionend", () => {
        row.remove();
      }, { once: true }); // Ensures the handler only runs once
    }
  }
  
  deleteAllRows(){
    const rows = this.tableBody.querySelectorAll("tr");
    rows.forEach((row) => {
      row.remove();
    });
  }

  getAllRows(){
    const rows = this.table.querySelectorAll("tr");
    const allRows = [];
    rows.forEach((row) => {
      const typographyId = row.getAttribute("id");
      const name = row.querySelector("#typography-name").textContent.trim();
      const value = row.querySelector("#linked-font").textContent.trim();
      allRows.push({ typographyId, name, value });
    });
    return allRows;
  }

  getNextOrderIndex() {
    const rows = this.tableBody.querySelectorAll('tr[order-index]');
    if (rows.length === 0) return 1000;
  
    const lastOrderIndex = Array.from(rows)
      .map(row => parseInt(row.getAttribute('order-index'), 10))
      .reduce((max, val) => val > max ? val : max, 0);
  
    return lastOrderIndex + 1000;
  }

  getNewOrderIndex(row) {
    
    const rows = Array.from(this.tableBody.querySelectorAll('tr'));
  
    // Find index of the target row in the sorted list
    const index = rows.indexOf(row);
  
    // Find previous and next order indexes
    const prevOrderIndex = index > 0 
      ? parseInt(rows[index - 1].getAttribute('order-index'), 10) 
      : null;
  
    const nextOrderIndex = index < rows.length - 1 
      ? parseInt(rows[index + 1].getAttribute('order-index'), 10) 
      : null;
  
    // Calculate and return new order index
    const newOrderIndex = calculateNewOrderIndex(prevOrderIndex, nextOrderIndex);
  
    return newOrderIndex;
  }
  

  rebalanceOrderIndexes() {
    let order = 1000;
    const gap = 1000;

    const rows = this.tableBody.querySelectorAll('tr');
  
    rows.forEach(row => {
      row.setAttribute('order-index', order);
      order += gap;
    });
  }

  getOrderIndexes() {
    const rows = this.tableBody.querySelectorAll("tr");
    const orderIndexes = [];
  
    rows.forEach((row) => {
      const typographyId = row.getAttribute("id");
      const orderIndex = parseInt(row.getAttribute("order-index"), 10);
  
      orderIndexes.push({ typographyId: Number(typographyId), orderIndex });
    });
  
    return orderIndexes;
  }
}

function makeFontRowDraggable(row) {
  row.setAttribute('draggable', true);

  // Drag Start
  row.addEventListener('dragstart', function (e) {
    e.dataTransfer.setData('text/plain', row.getAttribute('id'));
    row.classList.add('dragging');
  });

  // Drag Over
  row.addEventListener('dragover', function (e) {
    e.preventDefault(); // Allow dropping

    const draggingRow = document.querySelector('.dragging'); // Get the row being dragged
    const currentRow = e.target.closest('tr'); // Get the row being hovered over

    if (draggingRow && currentRow && draggingRow !== currentRow) {
      const rows = Array.from(row.parentElement.querySelectorAll('tr'));
      const currentIndex = rows.indexOf(currentRow);
      const draggingIndex = rows.indexOf(draggingRow);

      if (draggingIndex < currentIndex) {
        // Insert the dragging row after the current row
        row.parentElement.insertBefore(draggingRow, currentRow.nextSibling);
      } else {
        // Insert the dragging row before the current row
        row.parentElement.insertBefore(draggingRow, currentRow);
      }

    }

  });

  // Drop
  row.addEventListener('drop', function (e) {
    e.preventDefault();

    row.classList.remove('dragging'); 

  });

  // Drag End
  row.addEventListener('dragend', async function () {
    
    row.classList.remove('dragging');

    try {
      const newOrderIndex = typographyTableManager.getNewOrderIndex(row);
      
      await typographyTableManager.db.typography.update({
        typographyId: row.id,
        orderIndex: newOrderIndex
      });

      row.setAttribute('order-index', newOrderIndex);
    } catch (e) {

      // If gap not found, rebalance entire semantic table
      console.warn('[TYPOGRAPHY TABLE] Rebalancing required', e);
      typographyTableManager.rebalanceOrderIndexes();
      
      typographyTableManager.db.typography.updateOrderIndexes({
        projectId: cacheManager.projects.activeProjectId,
        updatedTypographyOrders: typographyTableManager.getOrderIndexes()
      })
      .then(()=>{
        console.log('[TYPOGRAPHY TABLE] Rebalancing successful');
      });
    }

  });
}
const typographyTableManager = new TypographyTableManager();
export { typographyTableManager };