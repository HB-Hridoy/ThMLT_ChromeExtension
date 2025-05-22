import { linkPrimitiveModal } from "../core/modals/linkPrimitiveModal.js";
import { semanticModal } from "../core/modals/semanticColorModal.js";
import { themeModal } from "../core/modals/themeModal.js";
import { calculateNewOrderIndex } from "../core/sidepanel.js";
import DatabaseManager from "../db/DatabaseManager.js";
import cacheManager from "./cache/cacheManager.js";


class SemanticTable {
  constructor() {
    this.defaultValue = "Link Primitive";
    this.currentRowId = 1;
    this.table = null;
    this.thead = null;
    this.tableBody = null;

    this.colGroup = null;
    this.nameCol = null;
    this.editCol = null;

    const observer = new MutationObserver((mutationsList, observerInstance) => {
      const table = document.getElementById("semantic-table");

      if (table) {
        this.table = table;
        this.thead = this.table.querySelector('thead');
        this.tableBody = this.table.querySelector("tbody");

        this.colGroup = this.table.querySelector("colgroup");
        this.nameCol = this.colGroup.querySelector(".semantic-col-name");
        this.editCol = this.colGroup.querySelector(".semantic-col-edit");

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
  
  // Add a new row to the table
  addRow({ semanticId, semanticName, orderIndex, themeValues , animation = false }) {
    // Create a new row element
    const newRow = document.createElement('tr');
    newRow.classList.add('item-row');
    newRow.id = semanticId;
    newRow.setAttribute('draggable', 'true');
    newRow.setAttribute('order-index', orderIndex);

    // Create name cell
    const nameCell = this.#createNameCell(semanticName);
    newRow.appendChild(nameCell);

    // Create theme value cells
    cacheManager.semantics.theme().getAll().forEach(theme => {
      const primitiveData = themeValues && themeValues[theme] !== this.defaultValue
        ? cacheManager.primitives.getById(themeValues[theme])
        : { primitiveName: this.defaultValue, primitiveValue: "#ffffff" };

      const valueCell = this.#createValueCell({ theme, primitiveData, semanticId });
      newRow.appendChild(valueCell);

    });

    // Create edit cell
    const editCell = this.#createEditCell({ semanticId: semanticId });
    newRow.appendChild(editCell);

    // Append row to tbody
    this.tableBody.appendChild(newRow);
    makeRowDraggable({
      row: newRow
    });

    if (animation) {
      newRow.classList.add("highlight-added-row");
      setTimeout(() => {
        newRow.classList.remove("highlight-added-row");
      }, 500);
    }

    // ===== EVENT LISTENERS BEGIN ===== //

    document.getElementById(`semantic-edit-button-${semanticId}`).addEventListener('click', (e) => {
      e.stopPropagation();
        
      semanticModal.show(semanticModal.modes.EDIT, {
        semanticId: semanticId,
        semanticName: semanticName
      });
    });

    // ===== EVENT LISTENERS END ===== //

    return newRow;
  }

  // Create name cell with icon and semantic name
  #createNameCell(name) {
    const cell = document.createElement('td');
    cell.classList.add('semantic-name-cell', 'sticky-left');
    
    cell.innerHTML = `
      <div class="semantic-name-container">
        <div class="semantic-row-icon">
          <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
            <path fill="currentColor" fill-rule="evenodd"
              d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
              clip-rule="evenodd"></path>
          </svg>
        </div>
        <div class="semantic-name">${name}</div>
      </div>
    `;

    return cell;
  }

  // Create value cell for a specific theme
  #createValueCell({ 
    theme, 
    primitiveData = {
                      primitiveName: this.defaultValue, 
                      primitiveValue: "#ffffff"
                    } ,
    semanticId
  }) {
    const cell = document.createElement('td');
    cell.classList.add('semantic-value-cell');
    cell.setAttribute('theme-mode', theme);

    if (primitiveData.primitiveName !==this.defaultValue){
      cell.setAttribute('linked-primitive', primitiveData.primitiveId)
    }

    cell.innerHTML = `
      <div class="semantic-value-container">
        <div class="semantic-color-thumbnail" style="background-color: ${primitiveData.primitiveValue}"></div>
        <div class="semantic-theme-value">${primitiveData.primitiveName}</div>
      </div>
    `;

    cell.addEventListener('click', () => {
      linkPrimitiveModal.show({
        semanticId,
        theme: cell.getAttribute("theme-mode")
      });
    });

    return cell;
  }

  #createDefaultThemeIcon(){
    return `<svg id="default-theme-icon" class="w-4 h-4 text-blue-600 me-2" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M13.849 4.22c-.684-1.626-3.014-1.626-3.698 0L8.397 8.387l-4.552.361c-1.775.14-2.495 2.331-1.142 3.477l3.468 2.937-1.06 4.392c-.413 1.713 1.472 3.067 2.992 2.149L12 19.35l3.897 2.354c1.52.918 3.405-.436 2.992-2.15l-1.06-4.39 3.468-2.938c1.353-1.146.633-3.336-1.142-3.477l-4.552-.36-1.754-4.17Z"/>
                              </svg>`
  }

  // Create edit cell
  #createEditCell({ semanticId }) {
    const cell = document.createElement('td');
    cell.classList.add('semantic-edit-cell', 'sticky-right');
    
    cell.innerHTML = `
      <div class="edit-button">
        <button id="semantic-edit-button-${semanticId}" 
          class="semantic-edit-button hidden w-[35px] h-[35px] text-white bg-blue-700 hover:bg-blue-800 font-medium rounded-md text-sm p-1 items-center justify-center transition-all duration-150"
>
          <svg class="w-4 h-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <path stroke="#ffffff" stroke-linecap="round" stroke-width="2"
              d="M6 4v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2m6-16v2m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v10m6-16v10m0 0a2 2 0 1 0 0 4m0-4a2 2 0 1 1 0 4m0 0v2"/>
          </svg>
          <span class="sr-only">Edit</span>
        </button>
      </div>
    `;

    return cell;
  }

  // Get a specific row by id
  getRow(id) {
    const row = this.tableBody.querySelector(`tr[id="${id}"]`);
    if (!row) return null;

    const rowData = {
      name: row.querySelector('.semantic-name').textContent,
      themeModes: {}
    };

    this.themes.forEach(theme => {
      const valueCell = row.querySelector(`.semantic-value-cell[theme-mode="${theme}"]`);
      const colorValue = valueCell.querySelector('.semantic-color-thumbnail').style.backgroundColor;
      rowData.themeModes[theme] = colorValue;
    });

    return rowData;
  }

  updateNameCell({ semanticId, newSemanticName = "Unknown", animation = false }) {
    const row = this.tableBody.querySelector(`tr[id="${semanticId}"]`);
    if (!row) return false;

    const nameCell = row.querySelector(`.semantic-name`);
    if (!nameCell) return false;

    if (animation) {

      row.classList.add("highlight-update-row");
  
      setTimeout(() => {
        row.classList.remove("highlight-update-row");
      }, 1500);
      
    }

    nameCell.textContent = newSemanticName;

    return true;
  }

  // Update a specific cell in a row
  updateValueCell({ semanticId, theme, primitiveData }) {
    const row = this.tableBody.querySelector(`tr[id="${semanticId}"]`);
    if (!row) return false;

    const themeCell = row.querySelector(`.semantic-value-cell[theme-mode="${theme}"]`);
    if (!themeCell) return false;

    themeCell.setAttribute("linked-primitive", primitiveData.primitiveId);

    const colorThumbnail = themeCell.querySelector('.semantic-color-thumbnail');
    const pillText = themeCell.querySelector('.semantic-theme-value');

    colorThumbnail.style.backgroundColor = primitiveData.primitiveValue;
    pillText.textContent = primitiveData.primitiveName;

    return true;
  }

  updateLinkedPrimitives({ primitiveId, updatedFields }){
    const linkedPrimitives = this.tableBody.querySelectorAll('[linked-primitive]');
    linkedPrimitives.forEach(cell => {
      const cellPrimitiveId = cell.getAttribute('linked-primitive');
      if (cellPrimitiveId === primitiveId) {
      const colorThumbnail = cell.querySelector('.semantic-color-thumbnail');
      const pillText = cell.querySelector('.semantic-theme-value');

      if (updatedFields.primitiveValue) {
        colorThumbnail.style.backgroundColor = updatedFields.primitiveValue;
      }

      if (updatedFields.primitiveName) {
        pillText.textContent = updatedFields.primitiveName;
      }
      }
    });
  }

  // Delete a specific row
  deleteRow({ semanticId,  animation = false }) {
    const row = this.tableBody.querySelector(`tr[id="${semanticId}"]`);
    if (!row) return false;

    if (animation) {
      row.classList.add("highlight-deleted-row");

      setTimeout(() => {
        if (document.body.contains(row)) {
          row.remove();
        }
      }, 1000);
    }
  }

  // Delete all rows
  deleteAllRows() {
    this.tableBody.innerHTML = '';
  }

  // Get all rows
  getAllRows() {
    const rows = {};
    this.tableBody.querySelectorAll('tr.item-row').forEach(row => {
      const id = row.id;
      const rowData = this.getRow(id);
      rows[id] = rowData;
    });
    return rows;
  }

  getOrderIndexes() {
    const rows = this.tableBody.querySelectorAll("tr");
    const orderIndexes = [];
  
    rows.forEach((row) => {
      const semanticId = row.getAttribute("id");
      const orderIndex = parseInt(row.getAttribute("order-index"), 10);
  
      orderIndexes.push({ semanticId: Number(semanticId), orderIndex });
    });
  
    return orderIndexes;
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
    // Collect and sort rows based on their order-index
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

    console.log('prevOrderIndex', prevOrderIndex);
  console.log('nextOrderIndex', nextOrderIndex);
  console.log('newOrderIndex', newOrderIndex);
  
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

  addThemeColumn({ themeName, animation = false } = {}) {
    if (!themeName) return;
  
    // Prevent duplicate theme columns
    const existingHeader = this.thead.querySelector(`.semantic-theme-header[data-theme="${themeName}"]`);
    if (existingHeader) return;

    const defaultTheme = cacheManager.projects.get(cacheManager.projects.activeProjectId).defaultThemeMode;
  
    // 1. Add <col> to colGroup before the edit column
    const newCol = document.createElement('col');
    newCol.className = 'semantic-col-theme';
    this.colGroup.insertBefore(newCol, this.editCol);
  
    // 2. Add <th> to header row before the edit column
    const newHeader = document.createElement('th');
    newHeader.classList.add('semantic-theme-header');
    newHeader.setAttribute('theme', themeName);
    if (defaultTheme === themeName) {
      newHeader.setAttribute('default-theme', true);
      newHeader.classList.add('rainbow-background');
    }
    newHeader.innerHTML = ` <div class="w-full flex items-center relative">

                            ${defaultTheme === themeName ? this.#createDefaultThemeIcon() : ''}

                              <p id="theme-${themeName}" class="flex-1 text-xs mr-1">${themeName}</p>
                              <button id="theme-edit-button-${themeName}" 
                                class="theme-edit-button items-center ml-1">
                                
                                <svg class="w-4 h-4 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m14.304 4.844 2.852 2.852M7 7H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h11a1 1 0 0 0 1-1v-4.5m2.409-9.91a2.017 2.017 0 0 1 0 2.853l-6.844 6.844L8 14l.713-3.565 6.844-6.844a2.015 2.015 0 0 1 2.852 0Z"/>
                                </svg>

                                <span class="sr-only">Edit</span>
                              </button>

                            </div>
                          `;

  
    const addThemeCell = this.thead.querySelector('.semantic-add-theme-cell');
    addThemeCell.parentNode.insertBefore(newHeader, addThemeCell);

    const container = document.querySelector('.semantic-table-container');
    container.scrollLeft = container.scrollWidth;


    if (animation) {
      newHeader.classList.add("highlight-added-column");
      setTimeout(() => {
        newHeader.classList.remove("highlight-added-column");
      }, 1000);
    }

    document.getElementById(`theme-edit-button-${themeName}`).addEventListener('click', () => {
      themeModal.show(themeModal.modes.EDIT, {
        themeName: themeName
      })
    });
  
    // 3. Add a new <td> to every existing row before the edit cell
    this.tableBody.querySelectorAll('.item-row').forEach(row => {
      const newCell = this.#createValueCell({ 
        theme: themeName,
        semanticId: row.id
      
      }); // Ensure this returns a proper <td>
      row.insertBefore(newCell, row.lastElementChild);

      if (animation) {
        newCell.classList.add("highlight-added-column");
        setTimeout(() => {
          newCell.classList.remove("highlight-added-column");
        }, 1000);
      }
    });

  }
  
  deleteThemeColumn({ theme, animation = false }) {
    if (!theme) return;
  
    // 1. Remove header <th>
    const header = this.thead.querySelector(`.semantic-theme-header[theme="${theme}"]`);
    if (!header) throw new Error(`Theme column with theme "${theme}" not found.`);
  
    // 2. Remove the corresponding <col>
    this.colGroup.querySelector(".semantic-col-theme").remove();
  
    // 3. Remove corresponding <td> from each row
    this.tableBody.querySelectorAll('.item-row').forEach(row => {
      const cell = row.querySelector(`.semantic-value-cell[theme-mode="${theme}"]`);
      if (cell){
        if (animation) {
          header.classList.add("highlight-deleted-column");
          cell.classList.add("highlight-deleted-column");
  
          setTimeout(() => {
            header.classList.remove("highlight-deleted-column");
            cell.classList.remove("highlight-deleted-column");

            header.remove();
            cell.remove();
          }, 500);
        }
        
      }
    });
  }

  deleteAllThemeColumns() {
    // 1. Remove all <th> headers with .semantic-theme-header
    this.thead.querySelectorAll('.semantic-theme-header').forEach(th => th.remove());
  
    // 2. Remove all <col> elements with .semantic-col-theme
    this.colGroup.querySelectorAll('.semantic-col-theme').forEach(col => col.remove());
  
    // 3. Remove all theme <td> cells
    this.tableBody.querySelectorAll('.item-row').forEach(row => {
      row.querySelectorAll('.semantic-value-cell').forEach(cell => cell.remove());
    });
  }

  renameThemeColumn({ oldThemeName, newThemeName, animation = false }) {
    if (!oldThemeName || !newThemeName) {
      console.error("Both oldThemeName and newThemeName are required.");
      return false;
    }
  
    // 1. Update the header <th>
    const header = this.thead.querySelector(`.semantic-theme-header[theme="${oldThemeName}"]`);
    if (header) {
      header.setAttribute("theme", newThemeName);
      const themeText = header.querySelector(`#theme-${oldThemeName}`);
      if (themeText) {
        themeText.id = `theme-${newThemeName}`;
        themeText.textContent = newThemeName;
      }
  
      const editButton = header.querySelector(`#theme-edit-button-${oldThemeName}`);
      if (editButton) {
        editButton.id = `theme-edit-button-${newThemeName}`;
      }
    }
  
    // 2. Update the corresponding <td> cells in each row
    this.tableBody.querySelectorAll(".item-row").forEach(row => {
      const cell = row.querySelector(`.semantic-value-cell[theme-mode="${oldThemeName}"]`);
      if (cell) {

        if (animation) {
          header.classList.add("highlight-update-column");
          cell.classList.add("highlight-update-column");
  
          setTimeout(() => {
            header.classList.add("highlight-update-column");
            cell.classList.remove("highlight-update-column");
          }, 100);
        }
        cell.setAttribute("theme-mode", newThemeName);
      }
    });
  
    return true;
  }

  setDefaultThemeMode({ themeName }) {
    if (!themeName) {
      console.error("Theme name is required to set as default.");
      return false;
    }
  
    // 1. Remove the "default-theme" attribute from the current default theme
    const currentDefaultHeader = this.thead.querySelector('.semantic-theme-header[default-theme="true"]');
    if (currentDefaultHeader) {
      currentDefaultHeader.removeAttribute('default-theme');
      currentDefaultHeader.classList.remove('rainbow-background');
    }
  
    // 2. Set the "default-theme" attribute on the new default theme
    const newDefaultHeader = this.thead.querySelector(`.semantic-theme-header[theme="${themeName}"]`);
    if (!newDefaultHeader) {
      console.error(`Theme "${themeName}" not found.`);
      return false;
    }
  
    newDefaultHeader.setAttribute('default-theme', true);
    newDefaultHeader.classList.add('rainbow-background');

    // Move the default theme icon to the new default theme header
    const defaultThemeIcon = this.#createDefaultThemeIcon();
    const currentDefaultIcon = currentDefaultHeader?.querySelector('#default-theme-icon');
    if (currentDefaultIcon) {
      currentDefaultIcon.remove();
    }

    const newDefaultIconContainer = newDefaultHeader.querySelector('.w-full.flex.items-center.relative');
    if (newDefaultIconContainer) {
      newDefaultIconContainer.insertAdjacentHTML('afterbegin', defaultThemeIcon);
    }
  
    console.log(`[SEMANTIC TABLE] Default theme mode set to "${themeName}".`);
    return true;
  }
  
}

function makeRowDraggable({ row }) {
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

      row.classList.remove('dragging'); 
      row.querySelector('td:first-child').style.removeProperty('background-color');
    });
  
    // Drag End
    row.addEventListener('dragend', async function () {
      
      row.classList.remove('dragging');
      row.querySelector('td:first-child').style.removeProperty('background-color');

      // Calculate new orderIndex for dragged row
      try {
        const newOrderIndex = semanticTable.getNewOrderIndex(row);
        
        await DatabaseManager.semantics.update({
          semanticId: row.id,
          newOrderIndex
        });

        row.setAttribute('order-index', newOrderIndex);
      } catch (e) {

        // If gap not found, rebalance entire semantic table
        console.warn('[SEMANTIC TABLE] Rebalancing required', e);
        semanticTable.rebalanceOrderIndexes();
        
        DatabaseManager.semantics.updateOrderIndexes({
          projectId: cacheManager.projects.activeProjectId,
          updatedSemanticOrders: semanticTable.getOrderIndexes()
        })
        .then(()=>{
          console.log('[SEMANTIC TABLE] Rebalancing successful');
        });
      }

    });
  }
const semanticTable = new SemanticTable();
export { semanticTable };