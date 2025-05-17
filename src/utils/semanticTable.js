import { semanticModal } from "../core/modals/semanticColorModal.js";
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

  // Update order-index for all rows
  updateRowIndexes() {
    const rows = Array.from(this.tableBody.querySelectorAll('.item-row'));
    rows.forEach((row, index) => {
      row.setAttribute('order-index', index + 1);
    });
  }

  // Initialize event listeners
  initializeEventListeners() {
    // Add theme button listener
    const addThemeButton = this.thead.querySelector('.add-theme-button');
    if (addThemeButton) {
      addThemeButton.addEventListener('click', this.addThemeColumn.bind(this));
    }
  }

  // Add a new row to the table
  addRow({ semanticId, semanticName, themeValues , animation = false }) {
    // Create a new row element
    const newRow = document.createElement('tr');
    newRow.classList.add('item-row');
    newRow.id = semanticId;
    newRow.setAttribute('draggable', 'true');
    newRow.setAttribute('order-index', this.tableBody.children.length + 1);

    // Create name cell
    const nameCell = this.#createNameCell(semanticName);
    newRow.appendChild(nameCell);

    // Create theme value cells
    cacheManager.semantics.theme().getAll().forEach(theme => {
      const value = themeValues ? themeValues[theme] : this.defaultValue ;
      const valueCell = this.#createValueCell(theme, value);
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
  #createValueCell({ theme, value }) {
    const cell = document.createElement('td');
    cell.classList.add('semantic-value-cell');
    cell.setAttribute('theme-mode', theme);

    const colorHex = value || '#ffffff';
    cell.innerHTML = `
      <div class="semantic-value-container">
        <div class="semantic-color-thumbnail" style="background-color: ${colorHex}"></div>
        <div class="semantic-theme-value">${value ? colorHex : 'Click to link color'}</div>
      </div>
    `;

    return cell;
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
  updateValueCell({ semanticId, theme, value }) {
    const row = this.tableBody.querySelector(`tr[id="${semanticId}"]`);
    if (!row) return false;

    const themeCell = row.querySelector(`.semantic-value-cell[theme-mode="${theme}"]`);
    if (!themeCell) return false;

    const colorThumbnail = themeCell.querySelector('.semantic-color-thumbnail');
    const pillText = themeCell.querySelector('.semantic-theme-value');

    colorThumbnail.style.backgroundColor = value;
    pillText.textContent = value;

    return true;
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
          this.updateRowIndexes();
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

  addThemeColumn({ themeName } = {}) {
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
    }
    newHeader.innerHTML = ` <div class="w-full flex items-center relative">
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
  
    // 3. Add a new <td> to every existing row before the edit cell
    this.tableBody.querySelectorAll('.item-row').forEach(row => {
      const newCell = this.#createValueCell({ theme: themeName }); // Ensure this returns a proper <td>
      row.insertBefore(newCell, row.lastElementChild);
    });
  }
  
  deleteThemeColumn({ theme }) {
    if (!theme) return;
  
    // 1. Remove header <th>
    const header = this.thead.querySelector(`.semantic-theme-header[data-theme="${theme}"]`);
    if (header) header.remove();
  
    // 2. Remove the corresponding <col>
    const themeHeaders = [...this.thead.querySelectorAll('.semantic-theme-header')];
    const index = themeHeaders.findIndex(th => th.dataset.theme === theme);
    if (index !== -1) {
      const themeCols = this.colGroup.querySelectorAll('.semantic-col-theme');
      if (themeCols[index]) themeCols[index].remove();
    }
  
    // 3. Remove corresponding <td> from each row
    this.tableBody.querySelectorAll('.item-row').forEach(row => {
      const cell = row.querySelector(`.semantic-value-cell[theme-mode="${theme}"]`);
      if (cell) cell.remove();
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

  renameThemeColumn({ oldThemeName, newThemeName }) {
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
        cell.setAttribute("theme-mode", newThemeName);
      }
    });
  
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

    });
  }
const semanticTable = new SemanticTable();
export { semanticTable };