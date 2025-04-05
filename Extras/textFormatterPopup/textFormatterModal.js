const tarnslationScopeSections = document.getElementById("tarnslationScopeSections");

tarnslationScopeSections.addEventListener("click", (e)=>{
    switchTranslationScope(e.target);

});

// Just populates the table body
function populateTable() {
    let count = 20;
    const translationTableBody = document.querySelector('.translationTableBody');
    const fontTableBody = document.querySelector('.fontTableBody');
    const colorTableBody = document.querySelector('.colorTableBody');
    
    
    let tableBodyRows = ``;
  
    for (let i = 1; i < count; i++) {
        tableBodyRows += `
        <tr rowId="${i}">
            <td>Some stuff</td>
            <td>Some more stuff</td>
        </tr>
        `; 
    }

    let colorTableBodyRows = ``;
    for (let i = 1; i < count; i++) {
        colorTableBodyRows += `
        <tr>
            <td rowId="${i}">
                Semantic Name
            </td>
            <td>
                <div class="semanticValueCell">
                    <div class="colorThumbnail"></div>
                    <div>
                        <span class="">color/brand/900</span>
                    </div>
                
                </div>
            </td>    
        </tr>
        `; 
    }

    
    
    // Use innerHTML without parentheses
    translationTableBody.innerHTML = tableBodyRows;
    //fontTableBody.innerHTML = tableBodyRows;
    colorTableBody.innerHTML = colorTableBodyRows;
}

// Call the function to populate the table
populateTable();

const tableBody = document.querySelector('.translationTableBody');
let selectedTranslationTableRow = null; // Track the selected row

tableBody.addEventListener('click', function(event) {
    selectTranslationTableRow(event.target.closest('tr'));
    
});

// Switch Tabs
const textFormatterNavTabs = document.getElementById("textFormatterNavTabs");

textFormatterNavTabs.addEventListener("click", (e) => {
   switchTabs(e.target)
});

function switchTabs(target) {
    const targetId = target.id;
    const targetTab = target;
    const selectedTab = textFormatterNavTabs.querySelector('.textFormatterNavTab[isTabSelected="true"]');

    if (targetTab !== selectedTab) {
        const navIds = ["translation-tab", "font-tab", "color-tab"];

        navIds.forEach(id => {
            const tabScreen = document.getElementById(id.replace('-tab', 'Screen'));
            if (id === targetId) {
                tabScreen.style.display = 'block';
                targetTab.setAttribute('isTabSelected', 'true');
                targetTab.classList.replace("textFormatterNavTab", "textFormatterNavTabSelected");
            } else {
                tabScreen.style.display = 'none';
                const tempTab = document.getElementById(id);
                tempTab.setAttribute('isTabSelected', 'false');
                tempTab.className = ''; 
                tempTab.classList.add('textFormatterNavTab'); 
            }
        });
    }
}

function switchTranslationScope(target) {
    const targetScope = target;
    const activeScope = tarnslationScopeSections.querySelector('.translationScopeSelectionActive');
  
    if (targetScope !== activeScope) {
        const scopeElements = Array.from(tarnslationScopeSections.children);
  
        scopeElements.forEach(scopeElement => {
            scopeElement.className = ''; 
            if (scopeElement === targetScope) {
                scopeElement.classList.add('translationScopeSelectionActive'); 
            } else {
                scopeElement.classList.add('translationScopeSelectionInactive'); 
            }
        });
    }
}

function selectTranslationTableRow(clickedRow){
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
}

