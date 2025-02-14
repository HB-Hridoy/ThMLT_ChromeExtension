const tarnslationScopeSections = document.getElementById("tarnslationScopeSections");

    tarnslationScopeSections.addEventListener("click", (e)=>{
    const targetId = e.target.id;

    const targetScope = e.target;
    const activeScope = tarnslationScopeSections.querySelector('.translationScopeSelectionActive');

    if (targetScope !== activeScope) {
        const scopeElements = Array.from(tarnslationScopeSections.children);

        scopeElements.forEach(scopeElement => {
        if (scopeElement === targetScope) {
            scopeElement.className = ''; 
            scopeElement.classList.add('translationScopeSelectionActive'); 
        }else{
            scopeElement.className = ''; 
            scopeElement.classList.add('translationScopeSelectionInactive'); 
        }
        });
    }

});

// Just populates the table body
function populateTable() {
    let count = 20;
    const tableBody = document.querySelector('.translationTableBody');
    console.log(tableBody);
    
    let tableBodyRows = ``;
  
    for (let i = 1; i < count; i++) {
        tableBodyRows += `
        <tr rowId="${i}">
            <td>Some stuff</td>
            <td>Some more stuff</td>
        </tr>
        `; 
    }

    // Add two empty rows at the end
tableBodyRows += `
<tr><td>&nbsp;</td><td>&nbsp;</td></tr>
`;

    
    // Use innerHTML without parentheses
    tableBody.innerHTML = tableBodyRows;
}

// Call the function to populate the table
populateTable();

const tableBody = document.querySelector('.translationTableBody');
let selectedTranslationTableRow = null; // Track the selected row

tableBody.addEventListener('click', function(event) {
    const clickedRow = event.target.closest('tr'); // Get the closest row
    console.log(clickedRow);

    if (!clickedRow) return; // Ignore clicks outside of rows

    // If another row is already selected, revert its background
    if (selectedTranslationTableRow) {
        selectedTranslationTableRow.classList.remove('highlight');
    }

    // If the same row is clicked, deselect it
    if (selectedTranslationTableRow === clickedRow) {
        selectedTranslationTableRow = null; // Reset selection
        return;
    }

    // Highlight the clicked row
    clickedRow.classList.add('highlight');
    selectedTranslationTableRow = clickedRow; // Update the selected row
});


