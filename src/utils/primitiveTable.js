
class PrimitiveTable {
  constructor(primitiveTableId){

    this.currentRowId = 1;
    this.table = document.getElementById(primitiveTableId);
    this.tableBody = this.table.querySelector("tbody");

    console.log(this.table);
    
  }

  addRow({ primitiveId = 0,  primitiveName = "Unknown", primitiveValue = "#ffffff"} = {}){
    
    const nameTd = `<td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap w-2/4">
                        <div class="flex items-center w-full">
                          <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
                            <path fill="#000000" fill-rule="evenodd"
                                d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
                                clip-rule="evenodd"></path>
                          </svg>
                          <p id="primitive-name" class="text-xs text-gray-500 ml-2 w-full">${primitiveName}</p>
                          
                        </div>
                      </td>`;

    const valueTd = `<td class="px-6 py-3 w-2/4">
                        <div id="color-box-parent" class="w-full flex items-center">
                          <div id="color-box" class=" h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm" style="background-color: ${primitiveValue} ;"></div>
                          <p id="color-text" class="flex-1 text-xs mr-2">${primitiveValue}</p>
                        </div>
                      </td>`;
  
      const newRow = `
                    <tr id="${primitiveId}" order-index="${this.currentRowId}" draggable="true" class="bg-white border-b cursor-grab active:cursor-grabbing">
                      ${nameTd}
                      ${valueTd}
                    </tr>
      `;
      
      this.table.insertAdjacentHTML("beforeend", newRow);
  
      // Make the new row draggable
      const addedRow = this.table.lastElementChild;
      makePrimitiveRowDraggable(addedRow);
  
      this.currentRowId++;
    
  }

  getRow(primitiveId){
    const row = this.table.querySelector(`tr[id="${primitiveId}"]`);
    if (row) {
      const name = row.querySelector("#primitive-name").textContent.trim();
      const value = row.querySelector("#color-text").textContent.trim();
      return { primitiveId, name, value };
    }
    return null;
  }

  updateRow(primitiveId, data = {}){
    const { primitiveName = "Unknown", primitiveValue = "#ffffff"} = data;
    const row = this.table.querySelector(`tr[id="${primitiveId}"]`);
    if (row) {
      row.querySelector("#primitive-name").textContent = primitiveName;
      row.querySelector("#color-text").textContent = primitiveValue;
      row.querySelector("#color-box").style.backgroundColor = primitiveValue;
    }
  }
  deleteRow(primitiveId){
    const row = this.table.querySelector(`tr[id="${primitiveId}"]`);
    if (row) {
      row.remove();
    }
  }
  deleteAllRows(){
    const rows = this.table.querySelectorAll("tr");
    rows.forEach((row) => {
      row.remove();
    });
  }
  getAllRows(){
    const rows = this.table.querySelectorAll("tr");
    const allRows = [];
    rows.forEach((row) => {
      const primitiveId = row.getAttribute("id");
      const name = row.querySelector("#primitive-name").textContent.trim();
      const value = row.querySelector("#color-text").textContent.trim();
      allRows.push({ primitiveId, name, value });
    });
    return allRows;
  }
}

function makePrimitiveRowDraggable(row) {
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

    const rows = Array.from(row.parentElement.querySelectorAll('tr'));

    // Update the order-index for all rows
    rows.forEach((row, index) => {
      row.setAttribute('order-index', index + 1); // Start from 1
    });

    row.classList.remove('dragging'); 

  });

  // Drag End
  row.addEventListener('dragend', function () {
    
    row.classList.remove('dragging');

    // Update Order Indexes in DB

    // const rows = this.tableBody.querySelectorAll('tr');

    // try {
    //   rows.forEach(async (row, index) => {
    //     const primitiveName = row.querySelector("#primitive-name").textContent.trim();
    //     const newOrderIndex = index + 1;
        
    //     await updatePrimitive(CacheOperations.activeProject, primitiveName, "@default", "@default", newOrderIndex, false);
    //   });

    //   console.log(...Logger.multiLog(
    //     ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
    //     ["Updated primitive table order index"]
    //   ));
    // } catch (error) {
    //   console.error(error); 
    // }
  });
}

export { PrimitiveTable };