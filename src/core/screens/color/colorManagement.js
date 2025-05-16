
  import cacheManager from "../../../utils/cache/cacheManager.js";
  import DatabaseManager from "../../../db/DatabaseManager.js";
  import { screenManager, screens, COLOR_TABS } from "../../../utils/screenManager.js";
  import { primitiveModal } from "../../modals/primitiveColorModal.js";
  import { InitializePrimitivesScreen, populatePrimitiveData } from "../primitiveColor/primitiveColor.js";
  import { semanticModal } from "../../modals/semanticColorModal.js";
  import { semanticTable } from "../../../utils/semanticTable.js";
import { InitializeSemanticScreen, populateSemanticData } from "../semanticColor/semanticColor.js";

  let listenersAdded = false;

  const TABS = {
    PRIMITIVE: "primitives",
    SEMANTIC: "semantic"
  };

  export async function showColorManagementScreen() {
    await screenManager.switchScreen(screens.COLOR_MANAGEMENT);
    await InitializePrimitivesScreen();
    await InitializeSemanticScreen();

    const colorScreenProjectName = document.getElementById("color-screen-project-name");
    colorScreenProjectName.innerText = cacheManager.projects.activeProjectName();

    populatePrimitiveData();
    populateSemanticData();

    if (listenersAdded) return;

    await primitiveModal.show(primitiveModal.modes.ADD);
    primitiveModal.hide();

    const colorsAddButtonText = document.getElementById("colors-add-button-text");

    // ========== EVENT LISTENERS BEGIN ========== // 

    document.getElementById("primitives-tab").addEventListener('click', () => {
      colorsAddButtonText.innerText = "Add Primitive"
       showPrimitivesTab();
    }); 

    document.getElementById("semantic-tab").addEventListener('click', () => {
      colorsAddButtonText.innerText = "Add Semantic";   
      showSemanticTab();
    });

    // Add event listeners and other initialization code here
    document.getElementById("color-screen-back-button").addEventListener("click", () => {
      screenManager.switchScreen(screens.PROJECT_MANAGEMENT);
    });

    document.getElementById("colors-add-button").addEventListener("click", () => {
      if (colorsAddButtonText.innerText === "Add Primitive"){
        primitiveModal.show(primitiveModal.modes.ADD);
      } else if (colorsAddButtonText.innerText === "Add Semantic"){
        semanticModal.show(semanticModal.modes.ADD);
      }
      
    });

    // ========== EVENT LISTENERS BEGIN ========== // 

    listenersAdded = true;
  }

  function SwitchTabs(tabName) {
  
    Object.values(TABS).forEach(tab => {
      if (!tab) return;
      document.getElementById(`${tab}-screen`).classList.replace("visible", "hidden");
      document.getElementById(`${tab}-tab`).className = "inline-block p-2 hover:text-blue-600";
    });
  
    document.getElementById(`${tabName}-screen`).classList.replace("hidden", "visible");
    document.getElementById(`${tabName}-tab`).className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
  }

  export async function showPrimitivesTab(){

    SwitchTabs(TABS.PRIMITIVE);

  }

  export async function showSemanticTab(){

    SwitchTabs(TABS.SEMANTIC);

  }
  
  // //-----------------

  // const themeModalElement = document.getElementById("theme-modal");
  // const themeModal = new Modal(themeModalElement, {
  //   onHide: () => {
  //       document.querySelectorAll(".bg-gray-900\\/50, .bg-gray-900\\/80").forEach(backdrop => {
  //           backdrop.remove();
  //       });
  //   }
  // });

  // const themeModalMode = document.querySelector('h3[themeModalMode]');

  // const showAddThemeModal = document.getElementById("show-add-theme-modal");

  // const tm_nameInput = document.getElementById("theme-modal-theme-name-input");
  // const tm_nameInputError = document.getElementById("theme-modal-theme-name-input-error");

  // const tm_defaultCheckbox = document.getElementById("default-theme-checkbox");

  // const tm_deleteButton = document.getElementById("theme-modal-delete-button");
  // const tm_actionButton = document.getElementById("theme-modal-action-button");
  // //------------------

  // const addNewThemeButton = document.getElementById("add-new-theme-button");
  // const newThemeInput = document.getElementById("add-new-theme-input");
  // const newThemeInputErrors = document.getElementById("add-new-theme-errors");

  // const renameThemeModeButton = document.getElementById("rename-theme-mode-button");
  // const deleteThemeModeButton = document.getElementById("delete-theme-mode-button");
  // const editThemeModeInput = document.getElementById("edit-theme-mode-input");
  // const editThemeModeErrors = document.getElementById("edit-theme-mode-errors");

  // const semanticTable = document.getElementById('semantic-table');
  // const semanticTableBody = document.querySelector("#semantic-table tbody");

  // const selectPrimitiveModal = document.getElementById("select-primitive-modal");
  // const editThemeModeModal = document.getElementById("edit-theme-mode-modal");
  
  // document.getElementById("color-screen-back-button").addEventListener("click", () => {
  //   ScreenManager.showProjectManagementScreen();
  // });

  // // open primitives tab
  // primitivesTabButton.addEventListener('click', () => {
  //   SwitchTabs("primitives");
  //   SessionManager.setColorTab(SessionManager.PRIMITIVES_COLOR_TAB);
  // });
  // // Open semantic screen
  // semanticTabButton.addEventListener('click', () => {
  //     SwitchTabs("semantic");
  //     SessionManager.setColorTab(SessionManager.SEMANTIC_COLOR_TAB);
  // });

  // function SwitchTabs(tabName) {

  //   const availableTabs = ["primitives", "semantic"];
  //   availableTabs.forEach(tab => {
  //     document.getElementById(`${tab}-screen`).classList.replace("visible", "hidden");
  //     document.getElementById(`${tab}-tab`).className = "inline-block p-2 hover:text-blue-600";
  //   });
    
  //   document.getElementById(`${tabName}-screen`).classList.replace("hidden", "visible");
  //   document.getElementById(`${tabName}-tab`).className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
  // }





  // //Semantic Screen

  // // Show row edit button on semantic table row hover
  // document.querySelector("#semantic-table tbody").addEventListener("mouseover", function(event) {
  //   const target = event.target;
  //   const parentRow = target.closest("tr");

  //   if (parentRow) {
  //     const rowId = parentRow.getAttribute("data-index");
  //     if(rowId){
  //       const editButtonContainer = document.getElementById("semantic-row-edit-button-container-"+rowId);
  //       showEditSemanticModal.classList.replace("hidden", "flex");
  //       showEditSemanticModal.setAttribute("data-index", rowId);
  //       showEditSemanticModal.setAttribute("semantic-row-index", rowId);
  //       editButtonContainer.appendChild(showEditSemanticModal);
  //     }
      
  //   }
  // }, true); 

  // // hide row edit button on semantic table row hover
  // document.querySelector("#semantic-table tbody").addEventListener("mouseout", function(event) {
  //   const target = event.target;
  //   const parentRow = target.closest("tr");

  //   if (parentRow) {
  //     showEditSemanticModal.classList.replace("felx", "hidden");
  //   }
  // }, true); 

  // sm_nameInput.addEventListener("input", () => {
  //   checkErrorsInSemanticModal();
  // });
  
  // showAddSemanticModal.addEventListener("click", () =>{

  //   // Reset action button to default
  //   replaceClass(sm_actionButton, "bg-", "bg-gray-500");
  //   replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //   sm_actionButton.disabled = true;
  //   sm_actionButton.innerHTML = "Add Semantic";

  //   sm_deleteButton.classList.add("hidden");

  //   sm_nameInputError.classList.toggle("hidden", true);
  //   sm_nameInput.style.borderColor = "";

  //   semanticModalMode.setAttribute("semanticModalMode", "add");
  //   semanticModalMode.innerHTML = "Add New Semantic";

  //   sm_nameInput.value = "";

  // });

  // showEditSemanticModal.addEventListener("click", ()=> {

  //   // Reset action button to default
  //   replaceClass(sm_actionButton, "bg-", "bg-gray-500");
  //   replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //   sm_actionButton.disabled = true;
  //   sm_actionButton.innerHTML = "Update Semantic";

  //   sm_deleteButton.classList.remove("hidden");

  //   sm_nameInputError.classList.toggle("hidden", true);
  //   sm_nameInput.style.borderColor = "";

  //   semanticModalMode.setAttribute("semanticModalMode", "edit");
  //   semanticModalMode.innerHTML = "Edit Semantic";

  //   const rowId = showEditSemanticModal.getAttribute("semantic-row-index");
    
  //   const row = semanticTableBody.querySelector(`tr[semantic-row-index = "${rowId}"]`);

  //   const semanticName = row.querySelector(".semantic-name").textContent.trim();
  //   semanticModalElement.setAttribute("semanticName", semanticName);

  //   sm_nameInput.value = semanticName;

  // });

  // sm_actionButton.addEventListener("click", async () => {
  //   const modalMode = semanticModalMode.getAttribute("semanticModalMode");

  //   if (modalMode === "add") {
  //     try {
  //       const semanticName = sm_nameInput.value.trim();
  //       let semanticValues = [];

  //       for (const themeMode of CacheOperations.getAllThemeModes()) {
  //         await addSemantic(CacheOperations.activeProject, semanticName,"Click to link color", themeMode, currentSemanticRowId);
  //         semanticValues.push("Click to link color");
  //       }

  //       if (semanticValues.length === CacheOperations.getAllThemeModes().length) {
  //         addNewRowToSemanticTable(semanticName, semanticValues, CacheOperations.getAllThemeModes());
  //       }
  //     } catch (error) {
  //       AlertManager.error(error, 2500);
  //       console.error(error);
        
  //     }
  //   } else if (modalMode === "edit") {
  //     const rowId = showEditSemanticModal.getAttribute("semantic-row-index");
  //     const row = semanticTableBody.querySelector(`tr[semantic-row-index="${rowId}"]`);

  //     const selectedSemanticCell = row.querySelector(".semantic-name");

  //     const oldSemanticName = selectedSemanticCell.textContent.trim();
  //     const newSemanticName = sm_nameInput.value.trim()
      

  //     try {
  //       for (const themeMode of CacheOperations.getAllThemeModes()) {
  //         await updateSemantic(CacheOperations.activeProject, oldSemanticName, newSemanticName, themeMode, "@default", "@default", false);
  //       }
  //       selectedSemanticCell.textContent = newSemanticName;
  //       console.log(...Logger.multiLog(
  //         ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
  //         ["Renamed semantic"],
  //         [oldSemanticName, Logger.Types.ERROR, Logger.Formats.BOLD],
  //         ["=>"],
  //         [newSemanticName, Logger.Types.SUCCESS, Logger.Formats.BOLD]
  //       ));
        
  //       AlertManager.success("Semantic updated successfully", 2500);
  //     } catch (error) {
  //       console.error(error);
  //     }
  //   }

  //   semanticModal.hide();
    
  // });

  // sm_deleteButton.addEventListener("click", async () => {

  //   const rowId = showEditSemanticModal.getAttribute("semantic-row-index");
  //   const row = semanticTableBody.querySelector(`tr[semantic-row-index = "${rowId}"]`);

  //   const semanticName = semanticModalElement.getAttribute("semanticname");
  //   const message = `Are sure to delete semantic <p class="text-red-600 font-bold">${semanticName}</p> permanently?`

  //   openConfirmation(message, async () => {
  //     try {
  //       const result = await deleteSemantic(CacheOperations.activeProject, semanticName);

  //       semanticTableBody.removeChild(row);
  //       AlertManager.success(result, 2500); 
  //     } catch (error) {
  //       AlertManager.error(error, 2500);
  //     }
  //   });

  // });

  // function checkErrorsInSemanticModal() {
  //   // Reset action button to default
  //   replaceClass(sm_actionButton, "bg-", "bg-gray-500");
  //   replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //   sm_actionButton.disabled = true;

  //   const semanticName = semanticModalElement.getAttribute("semanticName");
  //   const inputValue = sm_nameInput.value.trim();
  //   let errorMessage = "";

  //   if (!inputValue) {
  //     errorMessage = "Semantic name is required";
  //   } else if (CacheOperations.getAllSemanticNames().includes(inputValue) && semanticName !== inputValue) {
  //     errorMessage = "Semantic name already exist!";
  //   } else if (!nameRegex.test(inputValue)) {
  //     errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
  //   }
    
  //   if (errorMessage) {
  //     sm_nameInputError.innerHTML = errorMessage;
  //     sm_nameInputError.classList.remove("hidden");

  //     sm_nameInput.style.borderColor = "red";

  //     replaceClass(sm_actionButton, "bg-", "bg-gray-500");
  //     replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //     sm_actionButton.disabled = true;

  //   } else {
  //     sm_nameInputError.classList.add("hidden");
  //     sm_nameInput.style.borderColor = "";

  //     replaceClass(sm_actionButton, "bg-", "bg-blue-700");
  //     replaceClass(sm_actionButton, "hover:bg-", "hover:bg-blue-800");
  //     sm_actionButton.disabled = false;
  //   }

  //   if (semanticName === inputValue) {
  //     replaceClass(sm_actionButton, "bg-", "bg-gray-500");
  //     replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //     sm_actionButton.disabled = true;
  //   }
    
  // }

  // showAddThemeModal.addEventListener("click", () => { 
  //   themeModalElement.setAttribute("themeName", "");
  //   tm_nameInput.value = "";
  //   tm_nameInputError.classList.toggle("hidden", true);
  //   tm_nameInput.style.borderColor = "";
  //   document.getElementById("default-theme-checkbox-container").classList.toggle("hidden", true);

  //   // Reset action button to default
  //   replaceClass(tm_actionButton, "bg-", "bg-gray-500");
  //   replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //   tm_actionButton.disabled = true;

  //   tm_deleteButton.classList.toggle("hidden", true);

  //   tm_actionButton.innerHTML = "Add Theme";
  //   themeModalMode.setAttribute("themeModalMode", "add");
  //   themeModalMode.innerHTML = "Add New Theme";

  //   // themeModal.show();
  // });

  // tm_nameInput.addEventListener("input", () => {
  //   checkErrorsInThemeModal();
  // });

  // tm_defaultCheckbox.addEventListener("change", () => {
  //   if (themeModalMode.getAttribute("themeModalMode") === "edit") {
  //     replaceClass(tm_actionButton, "bg-", tm_defaultCheckbox.checked ? "bg-blue-700" : "bg-gray-500");
  //     replaceClass(tm_actionButton, "hover:bg-", tm_defaultCheckbox.checked ? "hover:bg-blue-800" : "hover:bg-gray-600");
  //     tm_actionButton.disabled = !tm_defaultCheckbox.checked;
  //   }
  // });
  // function checkErrorsInThemeModal() {

  //   // Reset action button to default
  //   replaceClass(tm_actionButton, "bg-", "bg-gray-500");
  //   replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //   tm_actionButton.disabled = true;

  //   const themeName = themeModalElement.getAttribute("themeName").toLowerCase() || "";
    
  //   const inputValue = tm_nameInput.value.trim().toLowerCase();
  //   let errorMessage = "";

  //   if (!inputValue) {
  //     errorMessage = "Theme name is required";
  //   } else if (
  //     CacheOperations.getAllThemeModes()
  //     .map(mode => mode.toLowerCase())
  //     .includes(inputValue) &&
  //     themeName !== inputValue
  //   ) {
  //     errorMessage = "Theme already exist!";
  //   } else if (!nameRegex.test(inputValue)) {
  //     errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
  //   }
    
  //   if (errorMessage) {
  //     tm_nameInputError.innerHTML = errorMessage;
  //     tm_nameInputError.classList.remove("hidden");

  //     tm_nameInput.style.borderColor = "red";

  //     replaceClass(tm_actionButton, "bg-", "bg-gray-500");
  //     replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //     tm_actionButton.disabled = true;

  //   } else {
  //     tm_nameInputError.classList.add("hidden");
  //     tm_nameInput.style.borderColor = "";

  //     replaceClass(tm_actionButton, "bg-", "bg-blue-700");
  //     replaceClass(tm_actionButton, "hover:bg-", "hover:bg-blue-800");
  //     tm_actionButton.disabled = false;
  //   }

  //   if (themeName === inputValue) {
  //     replaceClass(tm_actionButton, "bg-", "bg-gray-500");
  //     replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //     tm_actionButton.disabled = true;
  //   }

  //   if (themeModalMode.getAttribute("themeModalMode") === "edit" && tm_defaultCheckbox.checked) {
  //     replaceClass(tm_actionButton, "bg-", "bg-blue-700");
  //     replaceClass(tm_actionButton, "hover:bg-", "hover:bg-blue-800");
  //     tm_actionButton.disabled = false;
  //   }
    
  // }

  // tm_actionButton.addEventListener("click", async () => {
  //   const modalMode = themeModalMode.getAttribute("themeModalMode");
  //   if (modalMode === "add") {
  //     addNewTheme(tm_nameInput.value.trim());
  //   } else if (modalMode === "edit") {
  //     const themeMode = themeModalElement.getAttribute("themeName");
  //     const newThemeMode = tm_nameInput.value.trim();

  //     try {
  //       if (themeMode !== newThemeMode) {
  //         await renameThemeMode(CacheOperations.activeProject, themeMode, newThemeMode);
  //         renameThemeInSemanticTable(themeMode, newThemeMode);
  //         CacheOperations.renameThemeMode(themeMode, newThemeMode);
  //       }
      
  //       if (tm_defaultCheckbox.checked) {
  //         await updateDefaultThemeMode(CacheOperations.activeProject, newThemeMode);
  //         CacheOperations.defaultThemeMode = newThemeMode;

  //         // Update default-theme-header attribute for semantic table header row
  //         const headerCells = document.querySelectorAll('#semantic-table-header-row td[theme-mode]');
  //         headerCells.forEach(cell => {
  //           const themeMode = cell.getAttribute('theme-mode');
  //           if (themeMode === CacheOperations.defaultThemeMode) {
  //             cell.setAttribute('default-theme-header', 'true');
  //             cell.style.backgroundColor = "#93c4fd";
              
  //           } else {
  //             cell.setAttribute('default-theme-header', 'false');
  //             cell.style.backgroundColor = "#fff";
  //           }
  //         });
  //       }
      
  //       themeModal.hide();
  //       AlertManager.success("Theme updated successfully", 1500);
  //     } catch (error) {
  //       console.log(...Logger.multiLog(
  //         ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
  //         [error, Logger.Types.ERROR]
  //       ));
  //     }
      
  //   }
  // });

  // tm_deleteButton.addEventListener("click", () => {

  //   const themeMode = themeModalElement.getAttribute("themeName");

  //   if (CacheOperations.defaultThemeMode === themeMode) {
  //     console.log(...Logger.multiLog(
  //       ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
  //       ["Cannot delete default theme mode", Logger.Types.ERROR]
  //     ));
  //     AlertManager.error("Cannot delete default theme mode", 2000);
  //     themeModal.hide();
  //     return;
  //   }
    
  //   const message = `Are sure to delete theme mode <p class="text-red-600 font-bold">${themeMode}</p> permanently?`

  //   openConfirmation(message, async () => {
  //     try {
  //       await deleteTheme(CacheOperations.activeProject, themeMode);
  //       deleteThemeFromSemanticTable(themeMode);
  //       CacheOperations.deleteThemeMode(themeMode);
        
  //     } catch (error) {
  //       console.log(...Logger.multiLog(
  //         ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
  //         [error, Logger.Types.ERROR]
  //       ));
  //     }
  //   });

  // });

  // document.getElementById("theme-modal-close-button").addEventListener("click", () =>{
  //   themeModal.hide();
  // });


 

  // document.getElementById("select-primitive-modal-primitives-container").addEventListener("click", async (e) =>{
    
  //   const target = e.target;
  //   if (target.closest("li[data-index][data-primitive-name][data-primitive-value]")){

  //     try {
  //       const liElement = target.closest("li[data-index][data-primitive-name][data-primitive-value]");
        
  //       const dataIndex = liElement.getAttribute("data-index");
  //       const primitiveName = liElement.getAttribute("data-primitive-name");
  //       const primitiveValue = liElement.getAttribute("data-primitive-value");

  //       const themeMode = selectPrimitiveModal.getAttribute("theme-mode");
  //       const semanticName = selectPrimitiveModal.getAttribute("semantic-name");

  //       await updateSemantic(CacheOperations.activeProject, semanticName, "@default", themeMode, primitiveName, "@default", true);

  //       const tableBody = document.querySelector("#semantic-table tbody");
  //       // Get the <td> element with the specific data-index and class
  //       const targetTd = tableBody.querySelector(`td.semantic-value-cell[data-index="${dataIndex}"][theme-mode="${themeMode}"]`);

  //       targetTd.querySelector(".semantic-color-thumbnail").style.backgroundColor = primitiveValue;
  //       targetTd.querySelector(".semantic-pill-text").textContent = primitiveName

  //       const div = targetTd.querySelector(".semantic-mode-value");

  //       if (div.classList.contains("bg-red-200")) {
  //         div.classList.replace("bg-red-200", "bg-white");
  //       }

  //       CloseSelectPrimitiveModal();
        
  //     } catch (error) {
  //       console.error(error);
        
  //     }
      
  //   }
    
    
  // });
  


  // semanticTableBody.addEventListener("click", async function (event) {
  //   const target = event.target;

  //   if (target.closest(".semantic-value-cell")){
  //     //console.log(target.closest(".semantic-value-cell"));

  //     const parentTd = target.closest('td');
  //     const dataIndex = parentTd ? parentTd.getAttribute('data-index') : null;
  //     const semanticName = parentTd ? parentTd.closest('tr').querySelector('.semantic-name').textContent.trim() : null;
  //     const themeMode = parentTd ? parentTd.getAttribute('theme-mode') : null;
  //     if (dataIndex && semanticName && themeMode) {
  //       ShowSelectPrimitiveModal(dataIndex, themeMode, semanticName);
  //     } else {
  //       AlertManager.error("Internal error", 1000);
  //     }
  //   } else if (target.tagName === "TD" && target.getAttribute("theme-mode")) {

  //     const isDefaultTheme = target.getAttribute("default-theme-header");

  //     const themeMode = target.getAttribute("theme-mode")
  //     themeModalElement.setAttribute("themeName", themeMode);
  //     tm_nameInput.value = themeMode;
  //     tm_nameInputError.classList.toggle("hidden", true);
  //     tm_nameInput.style.borderColor = "";
  //     document.getElementById("default-theme-checkbox-container").classList.toggle("hidden", false);

  //     if (isDefaultTheme === "true") {
  //       tm_defaultCheckbox.checked = true;
  //       tm_defaultCheckbox.disabled = true;
  //     } else {
  //       tm_defaultCheckbox.checked = false;
  //       tm_defaultCheckbox.disabled = false;
  //     }

  //     // Reset action button to default
  //     replaceClass(tm_actionButton, "bg-", "bg-gray-500");
  //     replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
  //     tm_actionButton.disabled = true;

  //     tm_deleteButton.classList.toggle("hidden", false);

  //     tm_actionButton.innerHTML = "Update Theme";
  //     themeModalMode.setAttribute("themeModalMode", "edit");
  //     themeModalMode.innerHTML = "Edit Theme";

  //     themeModal.show();
  //   }
    
    
  // });


  

  // async function renameSemanticRow() {
  //   const rowId = semanticRowDeleteButton.getAttribute("data-index");
  //   const tableBody = document.querySelector("#semantic-table tbody");
  //   const row = tableBody.querySelector(`tr[data-index="${rowId}"]`);

  //   const selectedSemanticCell = row.querySelector(".semantic-name");

    

  //   try {

  //     const result = renameSemantic(selectedSemanticCell.textContent.trim(), editSemanticRowInput.value, CacheOperations.activeProject)

  //     selectedSemanticCell.textContent = editSemanticRowInput.value;
  //   } catch (error) {
  //     console.error(error);
  //   }
    
  // }

  // async function addNewTheme(newThemeMode) {
    
  //   const table = document.getElementById('semantic-table');
  //   const theadRow = document.getElementById('semantic-table-header-row');
  //   const bodyRows = table.querySelectorAll('tbody tr');
  //   try {

  //     for (const semanticName of CacheOperations.getAllSemanticNames()){
  //       await addSemantic(CacheOperations.activeProject, semanticName, "Click to link color", newThemeMode, currentSemanticRowId);
  //     }

  //     const newTdHTML = `
  //                         <td class="semantic-table-cell semantic-value-cell" data-index = "${currentSemanticRowId}" theme-mode = ${newThemeMode}>
  //                               <div class="semantic-mode-value semantic-mode-cell hide-border bg-red-200">
  //                                   <div class="semantic-alias-pill-cell semantic-alias-pill-base">
  //                                       <div class="semantic-pill-cover "
  //                                           aria-disabled="false" 
  //                                           style="transform: translate(0px, 0px);">
  //                                           <div class="semantic-pill" >
  //                                               <div class="semantic-color-thumbnail-container">
  //                                                   <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
  //                                                       style="background-color: rgb(22,22,27)">
  //                                                   </div>
  //                                               </div>
  //                                               <div class="semantic-pill-text">
  //                                                           Click to link color
  //                                               </div>
  //                                           </div>
  //                                       </div>
  //                                   </div>
  //                               </div>
  //                           </td>
  //                       `;

  //       theadRow.insertBefore(CreateElement.semanticThemeModeCell(newThemeMode), theadRow.lastElementChild);

  //       let tempRowId = 1;

  //       // Add the new <td> to each row in tbody
  //       bodyRows.forEach(row => {
  //         if(row.id !== "semantic-table-header-row"){

  //         const newTd = document.createElement('td');

  //         newTd.classList.add("semantic-table-cell");
  //         newTd.classList.add("semantic-value-cell");

  //         newTd.setAttribute("data-index", tempRowId);
  //         newTd.setAttribute("theme-mode", newThemeMode);
          
  //         newTd.innerHTML = newTdHTML;
  //         row.insertBefore(newTd, row.lastElementChild);

  //         tempRowId++;
  //         }
  //       });

  //       semanticTableColumns += 1; // Increase the column count

  //       let newGridTemplateColumns = '';

  //       // Loop through the columns and create the column definitions
  //       for (let i = 0; i < semanticTableColumns; i++) {
  //         if (i === semanticTableColumns - 1) {
  //           newGridTemplateColumns += '40px';  // Last column is 40px
  //         } else if (i === semanticTableColumns - 2) {
  //           newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
  //         } else {
  //           newGridTemplateColumns += '200px ';  // Regular columns are 200px
  //         }

  //         // Add a space between columns if it's not the last column
  //         if (i !== semanticTableColumns - 1) {
  //           newGridTemplateColumns += ' ';
  //         }
  //       }

  //       CacheOperations.addNewThemeMode(newThemeMode)
  //       table.style.gridTemplateColumns = newGridTemplateColumns;

  //       themeModal.hide();
      
      
  //   } catch (error) {
  //     AlertManager.error(error, 2500);
  //     console.log(error);
  //   }
  // }

  // function renameThemeInSemanticTable(themeMode, newThemeMode) {
  //   const table = document.getElementById('semantic-table');
  //   const theadRow = document.getElementById('semantic-table-header-row');
  //   const bodyRows = table.querySelectorAll('tbody tr');

  //   // Rename the header cell
  //   const themeModeCell = theadRow.querySelector(`td[theme-mode="${themeMode}"]`);
  //   if (themeModeCell) {
  //     themeModeCell.setAttribute('theme-mode', newThemeMode);
  //     themeModeCell.textContent = newThemeMode;
  //   }

  //   // Rename the body cells
  //   bodyRows.forEach(row => {
  //     const tdToRename = row.querySelector(`td[theme-mode="${themeMode}"]`);
  //     if (tdToRename) {
  //       tdToRename.setAttribute('theme-mode', newThemeMode);
  //     }
  //   });
  // }

  // function deleteThemeFromSemanticTable(themeMode) {
  //   const table = document.getElementById('semantic-table');
  //   const theadRow = document.getElementById('semantic-table-header-row');
  //   const bodyRows = table.querySelectorAll('tbody tr');
    
  //   if (themeMode === "default") {
  //     throw new Error("Default theme cannot be deleted");
  //   }

  //   try {
  //     // for (const semanticName of CacheOperations.getAllSemanticNames()){
  //     //   deleteSemanticColor(semanticName, CacheOperations.activeProject, themeMode);
  //     // }

  //     const themeModeCell = theadRow.querySelector(`td[theme-mode="${themeMode}"]`);

  //     if (themeModeCell) {
  //       themeModeCell.remove();
  //     }

  //     let tempRowId = 1;

  //     // Remove the <td> from each row in tbody
  //     bodyRows.forEach(row => {
  //       if(row.id !== "semantic-table-header-row"){

  //         const tdToRemove = row.querySelector(`td[theme-mode="${themeMode}"]`);

  //         if (tdToRemove) {
  //           tdToRemove.remove();
  //         }

  //         tempRowId++;
  //       }
  //     });

  //     semanticTableColumns -= 1; // Decrease the column count

  //     let newGridTemplateColumns = '';

  //     // Loop through the columns and create the column definitions
  //     for (let i = 0; i < semanticTableColumns; i++) {
  //       if (i === semanticTableColumns - 1) {
  //         newGridTemplateColumns += '40px';  // Last column is 40px
  //       } else if (i === semanticTableColumns - 2) {
  //         newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
  //       } else {
  //         newGridTemplateColumns += '200px ';  // Regular columns are 200px
  //       }

  //       // Add a space between columns if it's not the last column
  //       if (i !== semanticTableColumns - 1) {
  //         newGridTemplateColumns += ' ';
  //       }
  //     }

  //     CacheOperations.deleteThemeMode(themeMode);
  //     table.style.gridTemplateColumns = newGridTemplateColumns;
  //   } catch (error) {
  //     AlertManager.error(error, 2500);
  //     console.log(error);
  //   }
  // }


  // function ShowSelectPrimitiveModal(dataIndex, themeMode, semanticName) {

  //   const primitivesContainer = document.getElementById('select-primitive-modal-primitives-container');
  //   primitivesContainer.innerHTML = "";

  //   for (const [primitiveName, primitiveValue] of CacheOperations.getAllPrimitives()) {

  //     const newPrimitiveItem = ` 
  //                         <li data-index = "${dataIndex}" data-primitive-name = "${primitiveName}" data-primitive-value = "${primitiveValue}">
  //                             <div class="flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
  //                               <div class="color-box h-5 w-5 mr-2 border rounded-md" style="background-color: ${primitiveValue};"></div>
  //                               <p class="color-text text-sm mr-2 flex-1">${primitiveName}</p>
  //                             </div>
  //                         </li>`;
      
  //     primitivesContainer.insertAdjacentHTML("beforeend", newPrimitiveItem);
  //   }
  //   selectPrimitiveModal.setAttribute("data-index", dataIndex);
  //   selectPrimitiveModal.setAttribute("theme-mode", themeMode);
  //   selectPrimitiveModal.setAttribute("semantic-name", semanticName);
  //   selectPrimitiveModal.classList.replace("hidden","flex");
  // }

  // function CloseSelectPrimitiveModal() {
  //   selectPrimitiveModal.classList.replace("flex","hidden");
  // }

  

  

  

