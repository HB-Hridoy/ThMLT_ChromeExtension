
import { primitiveModal } from "../core/modals/primitiveColorModal.js";
class PrimitiveTable {
  constructor() {
    this.currentRowId = 1;
    this.table = null;
    this.tableBody = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const table = document.getElementById("semantic-table");

      if (table) {
        this.table = table;
        this.tableBody = this.table.querySelector("tbody");

        // Stop observing once table is found and stored
        observerInstance.disconnect();
        console.log("Semantic table initialized.");
      }
    });

    // Start observing the document body for the table
    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  addRow({ semanticId = 0,  semanticName = "unkonown", semanticValue = "unkonown", animation = false} = {}){
    
    let semanticValueCells =""; 

    for (let i = 0; i < themeModes.length; i++) {
      const semanticValue = semanticValues[i] || '';
      semanticValueCells = semanticValueCells + CreateElement.semanticTableValueCell(currentSemanticRowId, semanticValue, themeModes[i]);
    }


    const newRow = `
                      <tr data-index="${currentSemanticRowId}" semantic-row-index = "${currentSemanticRowId}" order-index="${currentSemanticRowId}" draggable="true" class=" seamntic-name-cell semantic-table-row  semantic-table-item-row">
                            ${CreateElement.semanticTableNameCell(currentSemanticRowId, semanticName)}
                            ${semanticValueCells}
                            <td class="semantic-table-cell" style="position: sticky; right: 0px; z-index: 100;">
                              <div id="semantic-row-edit-button-container-${currentSemanticRowId}" class="h-full w-full">
                              </div>
                            </td>
                        </tr>
                    `;
      

    
  
  this.tableBody.insertAdjacentHTML("beforeend", newRow);
                    
  
      // Make the new row draggable
      const addedRow = this.tableBody.lastElementChild;
      makePrimitiveRowDraggable(addedRow);

      if (animation) {
        addedRow.classList.add("highlight-added-row");
        setTimeout(() => {
          addedRow.classList.remove("highlight-added-row");
        }, 500);
      }
      
  
      this.currentRowId++;

      document.querySelector(`#primitive-edit-button_${primitiveId}`).addEventListener("click", (e) => {
        e.stopPropagation();
        
        primitiveModal.show(primitiveModal.modes.EDIT, {
          primitiveId: primitiveId,
          primitiveName: primitiveName,
          primitiveValue: primitiveValue
        });
      });
    
  }

  #semanticValueCell({semanticId, dataIndex, themeMode, semanticValue}={}){
    const semanticColor = semanticValue === "Click to link color" ? "#ffffff" : CacheOperations.getPrimitiveValue(semanticValue)
    return `
            <td class="px-6 py-3 w-2/4" semanticId="${semanticId}" data-index = "${dataIndex}" theme-mode = ${themeMode}>
              <div class="w-full flex items-center relative">
                <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                     style="background-color: ${semanticColor}">
                </div>
                <p id="semantic-value" class="flex-1 text-xs mr-2">${semanticValue}</p>
              </div>
            </td>
          `;
  }

  #semanticNameCell({semanticId, dataIndex, semanticName}){
    return `
            <td semanticId="${semanticId}" data-index = "${dataIndex}" class="cursor-copy px-6 py-3 font-medium text-gray-900 whitespace-nowrap w-2/4">
              <div class="flex items-center w-full">
                <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                    <path fill="var(--color-icon)" fill-rule="evenodd"
                        d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
                        clip-rule="evenodd"></path>
                </svg>
                <p id="semantic-name" class="text-xs text-gray-500 ml-2 w-full">${semanticName}</p>
                
              </div>
            </td>
          `;
  }

  getRow({semanticId} = {}){
  }

  updateRow({semanticId, primitiveName = "Unknown", primitiveValue = "#ffffff" } = {}) {
  }
  
  deleteRow({semanticId} = {}) {
  }
  
  deleteAllRows(){
  }
  getAllRows(){
  }
}

function makeSemanticRowDraggable(row) {
    row.setAttribute('draggable', true);
  
    // Drag Start
    row.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', row.getAttribute('semantic-row-index'));
      row.classList.add('dragging');
      row.querySelector('td:first-child').style.backgroundColor = 'rgb(225, 239, 254)';
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

      const rows = Array.from(row.parentElement.querySelectorAll('tr'));
  
      // Update the order-index for all rows
      rows.forEach((row, index) => {
        row.setAttribute('order-index', index + 1); // Start from 1
      });
  
      row.classList.remove('dragging'); 
      row.querySelector('td:first-child').style.removeProperty('background-color');
    });
  
    // Drag End
    row.addEventListener('dragend', function () {
      
      row.classList.remove('dragging');
      row.querySelector('td:first-child').style.removeProperty('background-color');

      // Update Order Indexes in DB
      const rows = semanticTableBody.querySelectorAll('tr');

      try {
        const themeModes = CacheOperations.getAllThemeModes();
        rows.forEach(async (row, index) => {
          const semanticElement = row.querySelector(".semantic-name");
          if (semanticElement) {
            const semanticName = semanticElement.innerText.trim();
            const newOrderIndex = index + 1;

            await Promise.all(themeModes.map(themeMode => 
              updateSemantic(CacheOperations.activeProject, semanticName, "@default", themeMode, "@default", newOrderIndex, false)
            ));
          }
          
        });

        console.log(...Logger.multiLog(
          ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
          ["Updated semantic table order index"]
        ));
      } catch (error) {
        console.error(error);
      }

    });
  }
const primitiveTable = new PrimitiveTable();
export { primitiveTable };