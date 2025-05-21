
import { fontModal } from "../core/modals/fontModal.js";
import { calculateNewOrderIndex } from "../core/sidepanel.js";
import DatabaseManager from "../db/DatabaseManager.js";

class FontTableManager {
  constructor() {
    this.currentRowId = 1;
    this.table = null;
    this.tableBody = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const table = document.getElementById("fonts-table");

      if (table) {
        this.table = table;
        this.tableBody = this.table.querySelector("tbody");

        // Stop observing once table is found and stored
        observerInstance.disconnect();
        console.log("[FONTS TABLE] Table initialized.");
      }
    });

    // Start observing the document body for the table
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  addRow({ fontId = 0,  fontName = "Unknown", fontValue = "#ffffff", orderIndex, animation = false} = {}){
    
    const nameTd = `<td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap w-2/4">
                        <div class="flex items-center w-full">
                          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="m10.5785 19 4.2979-10.92966c.0369-.09379.1674-.09379.2042 0L19.3785 19m-8.8 0H9.47851m1.09999 0h1.65m7.15 0h-1.65m1.65 0h1.1m-7.7-3.9846h4.4M3 16l1.56685-3.9846m0 0 2.73102-6.94506c.03688-.09379.16738-.09379.20426 0l2.50367 6.94506H4.56685Z" />
                          </svg>
                          <p id="font-name" class="text-xs text-gray-500 ml-2 w-full">${fontName}</p>
                          
                        </div>
                      </td>
                    `;

    const valueTd = `
    <td class="px-6 py-3 w-2/4">
      <div class="w-full flex items-center relative">
        <p id="font-value" class="flex-1 text-xs mr-2">${fontValue}</p>
  
        <button id="font-edit-button-${fontId}" 
          class="font-edit-button hidden text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-md text-sm p-1 items-center ml-2 transition-all duration-150">
          <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="#ffffff" stroke-linecap="round" stroke-width="2"
              d="M6 4v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2m6-16v2m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v10m6-16v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2"/>
          </svg>
          <span class="sr-only">Edit</span>
        </button>
      </div>
    </td>
                    `;
  
    const newRow = ` <tr id="${fontId}" order-index="${orderIndex}" draggable="true" class="font-row bg-white border-b cursor-grab active:cursor-grabbing hover:bg-gray-50">
                        ${nameTd}
                        ${valueTd}
                      </tr>
                    `;
    
    this.tableBody.insertAdjacentHTML("beforeend", newRow);
                      
    
    // Make the new row draggable
    const addedRow = this.tableBody.lastElementChild;
    makeFontRowDraggable(addedRow);

    if (animation) {
      addedRow.classList.add("highlight-added-row");
      setTimeout(() => {
        addedRow.classList.remove("highlight-added-row");
      }, 500);
    }
    

    this.currentRowId++;

    document.querySelector(`#font-edit-button-${fontId}`).addEventListener("click", (e) => {
      e.stopPropagation();

      fontModal.show({
        mode: fontModal.modes.EDIT,
        fontId,
        currentFontName: addedRow.querySelector("#font-name").textContent.trim(),
        currentFontValue: addedRow.querySelector("#font-value").textContent.trim()
      });

    });
    
  }

  getRow({ fontId }){
    const row = this.table.querySelector(`tr[id="${fontId}"]`);
    if (row) {
      const name = row.querySelector("#font-name").textContent.trim();
      const value = row.querySelector("#font-value").textContent.trim();
      return { fontId, name, value };
    }
    return null;
  }

  updateRow({ fontId, fontName, fontValue } = {}) {
    const row = this.table.querySelector(`tr[id="${fontId}"]`);
    if (row) {
      
      if (fontName !== undefined) row.querySelector("#font-name").textContent = fontName;
      
      if (fontValue !== undefined) row.querySelector("#font-value").textContent = fontValue;
  
      // Add highlight class
      row.classList.add("highlight-update-row");
  
      setTimeout(() => {
        row.classList.remove("highlight-update-row");
      }, 1500);
    }
  }
  
  deleteRow({ fontId }) {
    const row = this.table.querySelector(`tr[id="${fontId}"]`);
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
      const fontId = row.getAttribute("id");
      const name = row.querySelector("#font-name").textContent.trim();
      const value = row.querySelector("#font-value").textContent.trim();
      allRows.push({ fontId, name, value });
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
      const fontId = row.getAttribute("id");
      const orderIndex = parseInt(row.getAttribute("order-index"), 10);
  
      orderIndexes.push({ fontId: Number(fontId), orderIndex });
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
      const newOrderIndex = fontTableManager.getNewOrderIndex(row);
      
      await DatabaseManager.fonts.update({
        fontId: row.id,
        updatedFields: {
          orderIndex: newOrderIndex
        }
      });

      row.setAttribute('order-index', newOrderIndex);
    } catch (e) {

      // If gap not found, rebalance entire semantic table
      console.warn('[FONTS TABLE] Rebalancing required', e);
      fontTableManager.rebalanceOrderIndexes();
      
      DatabaseManager.fonts.updateOrderIndexes({
        updatedFontsOrders: fontTableManager.getOrderIndexes()
      })
      .then(()=>{
        console.log(console.log('[FONTS TABLE] Rebalancing successful'));
      });
    }

  });
}
const fontTableManager = new FontTableManager();
export { fontTableManager };