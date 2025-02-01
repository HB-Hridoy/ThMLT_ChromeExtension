

  //Tabs switching function
  const primitivesTabButton = document.getElementById("primitives-tab");
  const semanticTabButton = document.getElementById("semantic-tab");

  const semanticRowEditButton = document.getElementById("semantic-row-edit-button");
  const semanticRowDeleteButton = document.getElementById("semantic-row-delete-button");

  const addRowToSemanticButton = document.getElementById("add-row-to-semantic-button");
  const addNewSemanticRowInput = document.getElementById("add-new-semantic-row-input");
  const addNewSemanticRowErrors = document.getElementById("add-new-semantic-row-errors");

  const renameSemanticRowButton = document.getElementById("rename-semantic-row-button");
  const editSemanticRowInput = document.getElementById("edit-semantic-row-input");
  const editSemanticRowErrors = document.getElementById("edit-semantic-row-errors");

  const addRowToPrimitiveButton = document.getElementById("add-row-to-primitives");
  const addNewPrimitiveInput = document.getElementById("add-new-primitive-input");
  const addNewPrimitiveErrors = document.getElementById("add-new-primitive-errors");

  const primitiveRowEditButton = document.getElementById("primitive-row-edit-button");
  const primitiveUpdateButton =  document.getElementById("update-primitive-button");
  const primitiveDeleteButton = document.getElementById("delete-primitive-button");

  //const renameSemanticRowButton = document.getElementById("rename-semantic-row-button");
  const editPrimitiveRowInput = document.getElementById("edit-primitive-row-input");
  const editPrimitiveRowErrors = document.getElementById("edit-primitive-row-errors");


  const addNewThemeButton = document.getElementById("add-new-theme-button");
  const newThemeInput = document.getElementById("add-new-theme-input");
  const newThemeInputErrors = document.getElementById("add-new-theme-errors");

  const renameThemeModeButton = document.getElementById("rename-theme-mode-button");
  const deleteThemeModeButton = document.getElementById("delete-theme-mode-button");
  const editThemeModeInput = document.getElementById("edit-theme-mode-input");
  const editThemeModeErrors = document.getElementById("edit-theme-mode-errors");

  const primitiveTable = document.getElementById('primitive-table');
  const primitiveTableBody = document.querySelector("#primitives-table tbody");

  const semanticTable = document.getElementById('semantic-table');
  const semanticTableBody = document.querySelector("#semantic-table tbody");

  const selectPrimitiveModal = document.getElementById("select-primitive-modal");
  const editThemeModeModal = document.getElementById("edit-theme-mode-modal");


  
  //Open home screen
  document.getElementById("color-screen-back-button").addEventListener("click", () => {
    ScreenManager.showHomeScreen();
  });

  
  // open primitives tab
    primitivesTabButton.addEventListener('click', () => {
      SwitchTabs("primitives");
      SessionManager.setColorTab(SessionManager.PRIMITIVES_COLOR_TAB);
    });
    // Open semantic screen
    semanticTabButton.addEventListener('click', () => {
        SwitchTabs("semantic");
        SessionManager.setColorTab(SessionManager.SEMANTIC_COLOR_TAB);
    });

    function SwitchTabs(tabName) {

      const availableTabs = ["primitives", "semantic"];
      availableTabs.forEach(tab => {
        document.getElementById(`${tab}-screen`).classList.replace("visible", "hidden");
        document.getElementById(`${tab}-tab`).className = "inline-block p-2 hover:text-blue-600";
      });
      
      document.getElementById(`${tabName}-screen`).classList.replace("hidden", "visible");
      document.getElementById(`${tabName}-tab`).className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
    }


  //Primitives Screen
  let pickrInstance = null; 

  

  // Adding event listener for hover functionality to show the delete button
  document.querySelector("#primitives-table tbody").addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      const rowId = parentRow.getAttribute("primitive-row-index");
      if(rowId){
        const editButtonContainer = parentRow.querySelector("#color-box-parent");
        primitiveRowEditButton.classList.replace("hidden", "flex");
        primitiveRowEditButton.setAttribute("primitive-row-index", rowId);
        editButtonContainer.appendChild(primitiveRowEditButton);

      }
      
    }
  }, true); // Use capture phase for this to run first

  document.querySelector("#primitives-table tbody").addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      primitiveRowEditButton.classList.replace("felx", "hidden");
    }
  }, true); // Use capture phase for this to run first

  addNewPrimitiveInput.addEventListener("input", () =>{


    if (addNewPrimitiveInput.value.trim() !== "") {
      
      const inputValue = addNewPrimitiveInput.value.trim();


      let isDuplicate = false;
      let isRegEx = !nameRegex.test(inputValue);

      

      // Loop through the semantic names to check for duplicates
      for (const primitiveName of CacheOperations.getAllPrimitiveNames()) {
        if (primitiveName === inputValue) {
          isDuplicate = true;
          break; // Exit the loop early if a duplicate is found
        }
      }
      
      if(isDuplicate){
        addNewPrimitiveErrors.innerHTML = "Semantic name already exist!";
        addNewPrimitiveErrors.classList.replace("hidden", "visible");
        addRowToPrimitiveButton.classList.replace("visible","hidden");
      } else if (isRegEx){
        addNewPrimitiveErrors.innerHTML = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
        addNewPrimitiveErrors.classList.replace("hidden", "visible");
        addRowToPrimitiveButton.classList.replace("visible","hidden");
      } else {
        addNewPrimitiveErrors.classList.replace("visible", "hidden");
        addRowToPrimitiveButton.classList.replace("hidden","visible");
      }

    } else {
      addRowToPrimitiveButton.classList.replace("visible","hidden");
    }

  });

  addRowToPrimitiveButton.addEventListener("click", async () =>  {

    try {
      const primitiveName = addNewPrimitiveInput.value.trim();
      const primitiveVaule = document.getElementById("primitive-modal-color-text").textContent.trim();
      const result = await addPrimitiveColor(CacheOperations.getTemplateName(), primitiveName, primitiveVaule, currentPrimitiveRowId);
      AlertManager.success(result, 2500);
      addNewRowToPrimitiveTable(primitiveName,primitiveVaule);
    } catch (error) {
      AlertManager.error(error, 2500);
    }

    
    
  });

  primitiveRowEditButton.addEventListener("click", ()=> {

    const tableBody = document.querySelector("#primitives-table tbody");

    const rowId = primitiveRowEditButton.getAttribute("primitive-row-index");

    const row = tableBody.querySelector(`[primitive-row-index = "${rowId}"]`);

    const primitiveName = row.querySelector("#primitive-name").textContent.trim();
    const primitiveValue = row.querySelector("#color-text").textContent.trim();
    const orderIndex = row.getAttribute("order-index");

    primitiveRowEditButton.setAttribute("primitiveName", primitiveName);
    primitiveRowEditButton.setAttribute("primitiveValue", primitiveValue);
    primitiveRowEditButton.setAttribute("order-index", orderIndex);

    editPrimitiveRowErrors.classList.replace("visible", "hidden");
    editPrimitiveRowInput.value = primitiveName;
    pickrInstance.setColor(primitiveValue);
    document.getElementById("edit-primitive-modal-color-text").textContent = primitiveValue;

    document.querySelector(".pcr-last-color").style.setProperty("--pcr-color", primitiveValue);

    document.getElementById("edit-primitive-modal-color-picker-container").appendChild(document.getElementById("color-picker-container"));

  });

  primitiveDeleteButton.addEventListener("click", async () => {

    try {
      const oldPrimitiveName = primitiveRowEditButton.getAttribute("primitiveName");

      const result = await deletePrimitiveColor(CacheOperations.getTemplateName(), oldPrimitiveName);

      const tableBody = document.querySelector("#primitives-table tbody");

      const rowId = primitiveRowEditButton.getAttribute("primitive-row-index");
      const row = tableBody.querySelector(`[primitive-row-index = "${rowId}"]`);

      tableBody.removeChild(row);

      AlertManager.success(result, 2500);
      
    } catch (error) {
      AlertManager.error(error, 2500);
    }

    

  });

  primitiveUpdateButton.addEventListener("click", async () => {

    try {
      const oldPrimitiveName = primitiveRowEditButton.getAttribute("primitiveName");
      const oldPrimitiveValue = primitiveRowEditButton.getAttribute("primitiveValue");
      const orderIndex = primitiveRowEditButton.getAttribute("order-index");

      const newPrimitiveName = editPrimitiveRowInput.value.trim();
      const newPrimitiveValue = document.getElementById("edit-primitive-modal-color-text").textContent.trim();

      const tableBody = document.querySelector("#primitives-table tbody");
      
      const rowId = primitiveRowEditButton.getAttribute("primitive-row-index");
      const row = tableBody.querySelector(`[primitive-row-index = "${rowId}"]`);

      const primitiveNameElement = row.querySelector("#primitive-name");
      const primiitveValueElement = row.querySelector("#color-text");
      const primiitveColorBoxElement = row.querySelector("#color-box");

      if (oldPrimitiveName !== newPrimitiveName) {
        await deletePrimitiveColor(CacheOperations.getTemplateName(), oldPrimitiveName);
        await addPrimitiveColor(CacheOperations.getTemplateName(), newPrimitiveName, newPrimitiveValue, orderIndex);

        console.log(orderIndex);
        

        primitiveNameElement.textContent = newPrimitiveName;
        primiitveValueElement.textContent = newPrimitiveValue;
        primiitveColorBoxElement.style.backgroundColor = newPrimitiveValue;
        
      } else if (oldPrimitiveValue !== newPrimitiveValue) {
        await updatePrimitiveColor(CacheOperations.getTemplateName(), oldPrimitiveName, newPrimitiveValue);
        primitiveNameElement.textContent = oldPrimitiveName;
        primiitveValueElement.textContent = newPrimitiveValue;
        primiitveColorBoxElement.style.backgroundColor = newPrimitiveValue;
        
      }
    } catch (error) {
      
    }

    
  });

  //Semantic Screen
  
  // New mode button on table clicked. empty modal input text and hide addNewThemeButton
  document.getElementById("open-new-theme-modal").addEventListener("click", function(){

  newThemeInput.value = "";
  addNewThemeButton.classList.replace("visible","hidden");

  });

  // New theme name input from add new theme modal
  newThemeInput.addEventListener("input", (event) => {


    if (newThemeInput.value.trim() !== "") {
      
      const inputValue = newThemeInput.value.trim();

      // Select all elements with the theme-mode attribute
      const elements = document.querySelectorAll('[theme-mode]');
      
      // Map to get all attribute values
      const themeModeValues = Array.from(elements).map(el => el.getAttribute('theme-mode'));
      

      let isDuplicate = CacheOperations.isThemeModeExist(inputValue);
      let isRegEx = !/^[A-Za-z0-9-_]+$/.test(inputValue);

      // Process each value with a for loop
      // for (let i = 0; i < themeModeValues.length; i++) {
      //   const value = themeModeValues[i];
      //   if (value === inputValue) {
      //     isDuplicate = true;
      //     break;
      //   }
      // }

      if(isDuplicate){
        newThemeInputErrors.innerHTML = "Theme mode already exist!";
        newThemeInputErrors.classList.replace("hidden", "visible");
        addNewThemeButton.classList.replace("visible","hidden");
      } else if (isRegEx){
        newThemeInputErrors.innerHTML = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
        newThemeInputErrors.classList.replace("hidden", "visible");
        addNewThemeButton.classList.replace("visible","hidden");
      } else {
        newThemeInputErrors.classList.replace("visible", "hidden");
        addNewThemeButton.classList.replace("hidden","visible");
      }

    } else {
      addNewThemeButton.classList.replace("visible","hidden");
    }

  });

  // Adds new theme. (Modal Button)
  addNewThemeButton.addEventListener("click", async function(){
    addNewTheme();
    
  });

  renameThemeModeButton.addEventListener("click", async function(){
    const themeMode = editThemeModeModal.getAttribute("theme-mode");
    const newThemeMode = editThemeModeInput.value.trim();

    try {
      await renameThemeMode(CacheOperations.getTemplateName(), themeMode, newThemeMode);
      renameThemeInSemanticTable(themeMode, newThemeMode);
      CacheOperations.renameThemeMode(themeMode, newThemeMode);
      
    } catch (error) {
      console.log(...Logger.multiLog(
        ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
        [error, Logger.Types.ERROR]
      ));
    }
  });

  deleteThemeModeButton.addEventListener("click", async function(){
    const themeMode = editThemeModeModal.getAttribute("theme-mode");

    try {

      await deleteTheme(CacheOperations.getTemplateName(), themeMode);
      deleteThemeFromSemanticTable(themeMode);
      CacheOperations.deleteThemeMode(themeMode);
      
    } catch (error) {
      console.log(...Logger.multiLog(
        ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
        [error, Logger.Types.ERROR]
      ));
    }
  });

  editThemeModeInput.addEventListener("input", (event) => {
    if (editThemeModeInput.value.trim() !== "") {
      const inputValue = editThemeModeInput.value.trim();
      const isDuplicate = CacheOperations.isThemeModeExist(inputValue);
      const isRegEx = !/^[A-Za-z0-9-_]+$/.test(inputValue);

      if (isDuplicate) {
        editThemeModeErrors.textContent = "Theme mode already exists!";
      } else if (isRegEx) {
        editThemeModeErrors.textContent = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
      } else {
        editThemeModeErrors.classList.add("hidden");
        renameThemeModeButton.classList.remove("hidden");
        return;
      }
      editThemeModeErrors.classList.remove("hidden");
      renameThemeModeButton.classList.add("hidden");
    } else {
      renameThemeModeButton.classList.add("hidden");
    }
  });


  // Close primitives modal
  document.getElementById("close-primitive-modal").addEventListener("click", function(){
    CloseSelectPrimitiveModal();
   
  });

  document.getElementById("select-primitive-modal-primitives-container").addEventListener("click", async (e) =>{
    const target = e.target;

    

    if (target.closest("li[data-index][data-primitive-name][data-primitive-value]")){

      try {
        const liElement = target.closest("li[data-index][data-primitive-name][data-primitive-value]");

        const dataIndex = liElement.getAttribute("data-index");
        const primitiveName = liElement.getAttribute("data-primitive-name");
        const primitiveValue = liElement.getAttribute("data-primitive-value");

        const themeMode = selectPrimitiveModal.getAttribute("theme-mode");
        const semanticName = selectPrimitiveModal.getAttribute("semantic-name");

        const result =  await updateSemanticValue(CacheOperations.getTemplateName(), semanticName, themeMode, primitiveName);

        const tableBody = document.querySelector("#semantic-table tbody");
        // Get the <td> element with the specific data-index and class
        const targetTd = tableBody.querySelector(`td.semantic-value-cell[data-index="${dataIndex}"][theme-mode="${themeMode}"]`);

        targetTd.querySelector(".semantic-color-thumbnail").style.backgroundColor = primitiveValue;
        targetTd.querySelector(".semantic-pill-text").textContent = `/ ${primitiveName}`;

        const div = targetTd.querySelector(".semantic-mode-value");

        if (div.classList.contains("bg-red-200")) {
          div.classList.replace("bg-red-200", "bg-white");
        }

        CloseSelectPrimitiveModal();
        
      } catch (error) {
        
      }
      
    }
    
    
  });
  
  // Show row edit button on semantic table row hover
  document.querySelector("#semantic-table tbody").addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      const rowId = parentRow.getAttribute("data-index");
      if(rowId){
        const editButtonContainer = document.getElementById("semantic-row-edit-button-container-"+rowId);
        semanticRowEditButton.classList.replace("hidden", "flex");
        semanticRowEditButton.setAttribute("data-index", rowId);
        editButtonContainer.appendChild(semanticRowEditButton);

      }
      
    }
  }, true); 

  // hide row edit button on semantic table row hover
  document.querySelector("#semantic-table tbody").addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      semanticRowEditButton.classList.replace("felx", "hidden");
    }
  }, true); 

  semanticTableBody.addEventListener("click", async function (event) {
    const target = event.target;

    if (target.closest(".semantic-value-cell")){
      //console.log(target.closest(".semantic-value-cell"));

      const parentTd = target.closest('td');
      const dataIndex = parentTd ? parentTd.getAttribute('data-index') : null;
      const semanticName = CacheOperations.getAllSemanticNames()[dataIndex - 1];
      const themeMode = parentTd ? parentTd.getAttribute('theme-mode') : null;

      ShowSelectPrimitiveModal(dataIndex, themeMode, semanticName);
    } else if (target.tagName === "TD" && target.getAttribute("theme-mode") && target.getAttribute("default-theme-header") === "false") {

      const themeMode = target.getAttribute("theme-mode")
      editThemeModeModal.classList.replace("hidden", "flex");
      editThemeModeModal.setAttribute("theme-mode", themeMode);
      editThemeModeInput.value = themeMode;
      
    } else if (target.getAttribute("default-theme-header") === "true") {
      AlertManager.warning("Default theme cannot be edited", 2500);
      console.log(...Logger.multiLog(
        ["[WARNING]", Logger.Types.WARNING, Logger.Formats.BOLD],
        ["Default theme cannot be edited", Logger.Types.WARNING]
      ));
      
      
    }
    
    
  });

  // add semantic row modal button
  addRowToSemanticButton.addEventListener("click", async function () {

  const semanticNameFromInput = addNewSemanticRowInput.value.trim();
  let semanticValues = [];
    try {

      for (const themeMode of CacheOperations.getAllThemeModes()) {
        const result = await addSemanticColor(CacheOperations.getTemplateName(), semanticNameFromInput, themeMode, "Click to link color");
        semanticValues.push("Click to link color");
        
      }
      
      
    } catch (error) {
      AlertManager.error(error,2500);
    }
    
    if (semanticValues.length === CacheOperations.getAllThemeModes().length) {

      addNewRowToSemanticTable(semanticNameFromInput, semanticValues, CacheOperations.getAllThemeModes());
    } else {
      AlertManager.error("Error adding semantic", 2500);
    }

    addNewSemanticRowInput.value = "";
    addRowToSemanticButton.classList.replace("visible","hidden");


  });

  // Add semantic Row input from add semantic row modal
  addNewSemanticRowInput.addEventListener("input", (event) => {


    if (addNewSemanticRowInput.value.trim() !== "") {
      
      const inputValue = addNewSemanticRowInput.value.trim();

      const allSemanticNames = document.querySelectorAll(".semantic-name");

      let isDuplicate = false;
      let isRegEx = !/^[A-Za-z0-9-_]+$/.test(inputValue);

      // Loop through the semantic names to check for duplicates
      for (const item of allSemanticNames) {
        if (item.textContent.trim() === inputValue) {
          isDuplicate = true;
          break; // Exit the loop early if a duplicate is found
        }
      }
      
      if(isDuplicate){
        addNewSemanticRowErrors.innerHTML = "Semantic name already exist!";
        addNewSemanticRowErrors.classList.replace("hidden", "visible");
        addRowToSemanticButton.classList.replace("visible","hidden");
      } else if (isRegEx){
        addNewSemanticRowErrors.innerHTML = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
        addNewSemanticRowErrors.classList.replace("hidden", "visible");
        addRowToSemanticButton.classList.replace("visible","hidden");
      } else {
        addNewSemanticRowErrors.classList.replace("visible", "hidden");
        addRowToSemanticButton.classList.replace("hidden","visible");
      }

    } else {
      addRowToSemanticButton.classList.replace("visible","hidden");
    }

  });

  // Open edit semantic modal
  semanticRowEditButton.addEventListener("click", (e) =>{
    const rowId = semanticRowEditButton.getAttribute("data-index");

    semanticRowDeleteButton.setAttribute("data-index", rowId);

    const parentRow = document.querySelector(`tr[data-index="${rowId}"]`);
    editSemanticRowInput.value = parentRow?.querySelector(".semantic-name")?.textContent.trim() || null;

    renameSemanticRowButton.classList.replace("visible", "hidden");

  });

  // Delete button form edit semantic row modal
  semanticRowDeleteButton.addEventListener("click", (e) =>{
    deleteRowFromSemanticTable();
  });

  renameSemanticRowButton.addEventListener("click", (e) => {
    renameSemanticRow();
  });

  // Edit semantic Row input from edit semantic row modal
  editSemanticRowInput.addEventListener("input", (event) => {


    if (editSemanticRowInput.value.trim() !== "") {
      
      const inputValue = editSemanticRowInput.value.trim();

      const allSemanticNames = document.querySelectorAll(".semantic-name");

      let isDuplicate = false;
      let isRegEx = !/^[A-Za-z0-9-_]+$/.test(inputValue);

      // Loop through the semantic names to check for duplicates
      for (const item of allSemanticNames) {
        if (item.textContent.trim() === inputValue) {
          isDuplicate = true;
          break; // Exit the loop early if a duplicate is found
        }
      }
      
      if(isDuplicate){
        editSemanticRowErrors.innerHTML = "Semantic name already exist!";
        editSemanticRowErrors.classList.replace("hidden", "visible");
        renameSemanticRowButton.classList.replace("visible","hidden");
      } else if (isRegEx){
        editSemanticRowErrors.innerHTML = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
        editSemanticRowErrors.classList.replace("hidden", "visible");
        renameSemanticRowButton.classList.replace("visible","hidden");
      } else {
        editSemanticRowErrors.classList.replace("visible", "hidden");
        renameSemanticRowButton.classList.replace("hidden","visible");
      }

    } else {
      renameSemanticRowButton.classList.replace("visible","hidden");
    }

  });


  function addNewRowToSemanticTable(semanticName, semanticValues, themeModes){

    const tableBody = document.querySelector("#semantic-table tbody");
    
    let semanticValueCells =""; 

    for (let i = 0; i < themeModes.length; i++) {
      const semanticValue = semanticValues[i] || '';
      semanticValueCells = semanticValueCells +`
                            <td class="semantic-table-cell semantic-value-cell" data-index = "${currentSemanticRowId}" theme-mode = ${themeModes[i]}>
                                <div class="semantic-mode-value semantic-mode-cell hide-border ${semanticValue === "Click to link color" ? 'bg-red-200' : 'bg-white'} bg-red-200">
                                    <div class="semantic-alias-pill-cell semantic-alias-pill-base">
                                        <div class="semantic-pill-cover "
                                            aria-disabled="false" 
                                            style="transform: translate(0px, 0px);">
                                            <div class="semantic-pill" >
                                                <div class="semantic-color-thumbnail-container">
                                                    <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                                                        style="background-color: ${semanticValue === "Click to link color" ? "#ffffff" : CacheOperations.getPrimitiveValue(semanticValue)}">
                                                    </div>
                                                </div>
                                                <div class="semantic-pill-text">
                                                            ${semanticValue === "Click to link color" ? semanticValue : "/ " + semanticValue}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                          `;
    }
    

    const newRow = `
                      <tr data-index="${currentSemanticRowId}" class=" seamntic-name-cell semantic-table-row  semantic-table-item-row">
                            <td data-index = "${currentSemanticRowId}" class="cursor-copy semantic-table-cell semantic-table-cell-has-padding">
                                <div class="flex flex-row items-center w-full overflow-hidden gap-2 select-none">
                                    <div class="row-icon">
                                        <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
                                            <path fill="var(--color-icon)" fill-rule="evenodd"
                                                d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
                                                clip-rule="evenodd"></path>
                                        </svg>
                                    </div>
                                    <div class="semantic-name inline-flex min-w-0 ">
                                        ${semanticName}
                                    </div>
                                </div>
                            </td>
                            ${semanticValueCells}
                            <td class="semantic-table-cell" style="position: sticky; right: 0px; z-index: 100;">
                              <div id="semantic-row-edit-button-container-${currentSemanticRowId}" class="h-full w-full">
                              </div>
                            </td>
                        </tr>
                    `;
      
      // Insert the new row into the table body
      tableBody.insertAdjacentHTML("beforeend", newRow);
      currentSemanticRowId++;


  }

  async function deleteRowFromSemanticTable(){
    const rowId = semanticRowDeleteButton.getAttribute("data-index");
    const tableBody = document.querySelector("#semantic-table tbody");
    const row = tableBody.querySelector(`tr[data-index="${rowId}"]`);

    const selectedSemanticName = row.querySelector(".semantic-name").textContent.trim();

    

    try {

      const result = deleteSemanticColor(selectedSemanticName, CacheOperations.getTemplateName());

        // Check if the row exists
      if (row) {
          row.remove(); // Remove the row from the DOM
      }
    } catch (error) {
      console.error(error);
    }
    
    
  }

  async function renameSemanticRow() {
    const rowId = semanticRowDeleteButton.getAttribute("data-index");
    const tableBody = document.querySelector("#semantic-table tbody");
    const row = tableBody.querySelector(`tr[data-index="${rowId}"]`);

    const selectedSemanticCell = row.querySelector(".semantic-name");

    

    try {

      const result = renameSemantic(selectedSemanticCell.textContent.trim(), editSemanticRowInput.value, CacheOperations.getTemplateName())

      selectedSemanticCell.textContent = editSemanticRowInput.value;
    } catch (error) {
      console.error(error);
    }
    
  }

  async function addNewTheme() {
    
    const newThemeMode = newThemeInput.value;
    const table = document.getElementById('semantic-table');
    const theadRow = document.getElementById('semantic-table-header-row');
    const bodyRows = table.querySelectorAll('tbody tr');
    try {

      for (const semanticName of CacheOperations.getAllSemanticNames()){
        await addSemanticColor(CacheOperations.getTemplateName(), semanticName, newThemeMode, "Click to link color");
      }

      const newTdHTML = `
                          <td class="semantic-table-cell semantic-value-cell" data-index = "${currentSemanticRowId}" theme-mode = ${newThemeMode}>
                                <div class="semantic-mode-value semantic-mode-cell hide-border bg-red-200">
                                    <div class="semantic-alias-pill-cell semantic-alias-pill-base">
                                        <div class="semantic-pill-cover "
                                            aria-disabled="false" 
                                            style="transform: translate(0px, 0px);">
                                            <div class="semantic-pill" >
                                                <div class="semantic-color-thumbnail-container">
                                                    <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                                                        style="background-color: rgb(22,22,27)">
                                                    </div>
                                                </div>
                                                <div class="semantic-pill-text">
                                                            Click to link color
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        `;

        theadRow.insertBefore(createElement.semanticThemeModeCell(newThemeMode), theadRow.lastElementChild);

        let tempRowId = 1;

        // Add the new <td> to each row in tbody
        bodyRows.forEach(row => {
          if(row.id !== "semantic-table-header-row"){

          const newTd = document.createElement('td');

          newTd.classList.add("semantic-table-cell");
          newTd.classList.add("semantic-value-cell");

          newTd.setAttribute("data-index", tempRowId);
          newTd.setAttribute("theme-mode", newThemeMode);
          
          newTd.innerHTML = newTdHTML;
          row.insertBefore(newTd, row.lastElementChild);

          tempRowId++;
          }
        });

        semanticTableColumns += 1; // Increase the column count

        let newGridTemplateColumns = '';

        // Loop through the columns and create the column definitions
        for (let i = 0; i < semanticTableColumns; i++) {
          if (i === semanticTableColumns - 1) {
            newGridTemplateColumns += '40px';  // Last column is 40px
          } else if (i === semanticTableColumns - 2) {
            newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
          } else {
            newGridTemplateColumns += '200px ';  // Regular columns are 200px
          }

          // Add a space between columns if it's not the last column
          if (i !== semanticTableColumns - 1) {
            newGridTemplateColumns += ' ';
          }
        }

        CacheOperations.addNewThemeMode(newThemeMode)
        table.style.gridTemplateColumns = newGridTemplateColumns;
      
      
    } catch (error) {
      AlertManager.error(error, 2500);
      console.log(error);
      
    }
  }

  function renameThemeInSemanticTable(themeMode, newThemeMode) {
    const table = document.getElementById('semantic-table');
    const theadRow = document.getElementById('semantic-table-header-row');
    const bodyRows = table.querySelectorAll('tbody tr');

    // Rename the header cell
    const themeModeCell = theadRow.querySelector(`td[theme-mode="${themeMode}"]`);
    if (themeModeCell) {
      themeModeCell.setAttribute('theme-mode', newThemeMode);
      themeModeCell.textContent = newThemeMode;
    }

    // Rename the body cells
    bodyRows.forEach(row => {
      const tdToRename = row.querySelector(`td[theme-mode="${themeMode}"]`);
      if (tdToRename) {
        tdToRename.setAttribute('theme-mode', newThemeMode);
      }
    });
  }

  function deleteThemeFromSemanticTable(themeMode) {
    const table = document.getElementById('semantic-table');
    const theadRow = document.getElementById('semantic-table-header-row');
    const bodyRows = table.querySelectorAll('tbody tr');
    
    if (themeMode === "default") {
      throw new Error("Default theme cannot be deleted");
    }

    try {
      // for (const semanticName of CacheOperations.getAllSemanticNames()){
      //   deleteSemanticColor(semanticName, CacheOperations.getTemplateName(), themeMode);
      // }

      const themeModeCell = theadRow.querySelector(`td[theme-mode="${themeMode}"]`);

      if (themeModeCell) {
        themeModeCell.remove();
      }

      let tempRowId = 1;

      // Remove the <td> from each row in tbody
      bodyRows.forEach(row => {
        if(row.id !== "semantic-table-header-row"){

          const tdToRemove = row.querySelector(`td[theme-mode="${themeMode}"]`);

          if (tdToRemove) {
            tdToRemove.remove();
          }

          tempRowId++;
        }
      });

      semanticTableColumns -= 1; // Decrease the column count

      let newGridTemplateColumns = '';

      // Loop through the columns and create the column definitions
      for (let i = 0; i < semanticTableColumns; i++) {
        if (i === semanticTableColumns - 1) {
          newGridTemplateColumns += '40px';  // Last column is 40px
        } else if (i === semanticTableColumns - 2) {
          newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
        } else {
          newGridTemplateColumns += '200px ';  // Regular columns are 200px
        }

        // Add a space between columns if it's not the last column
        if (i !== semanticTableColumns - 1) {
          newGridTemplateColumns += ' ';
        }
      }

      CacheOperations.deleteThemeMode(themeMode);
      table.style.gridTemplateColumns = newGridTemplateColumns;
    } catch (error) {
      AlertManager.error(error, 2500);
      console.log(error);
    }
  }

  function addNewRowToPrimitiveTable(primitiveName, primitiveValue) {
    
    const tableBody = document.querySelector("#primitives-table tbody");

    const newRow = `
                  <tr primitive-row-index = "${currentPrimitiveRowId}" order-index="${currentPrimitiveRowId}" draggable="true" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap dark:text-white w-2/4">
                      <div class="flex items-center w-full">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <path fill="#000000" fill-rule="evenodd"
                              d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
                              clip-rule="evenodd"></path>
                        </svg>
                        <p id="primitive-name" class="text-xs text-gray-500 ml-2 w-full">${primitiveName}</p>
                        
                      </div>
                    </td>
                    <td class="px-6 py-3 w-2/4">
                      <div id="color-box-parent" class="w-full flex items-center">
                        <div id="color-box" class=" h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm" style="background-color: ${primitiveValue} ;"></div>
                        <p id="color-text" class="flex-1 text-xs mr-2">${primitiveValue}</p>
                      </div>
                    </td>
                  </tr>
    `;
    
    tableBody.insertAdjacentHTML("beforeend", newRow);

    // Make the new row draggable
    const addedRow = tableBody.lastElementChild;
    makePrimitiveRowDraggable(addedRow);

    currentPrimitiveRowId++;
    
  }

  function ShowSelectPrimitiveModal(dataIndex, themeMode, semanticName) {

    const primitivesContainer = document.getElementById('select-primitive-modal-primitives-container');
    primitivesContainer.innerHTML = "";

    for (const [primitiveName, primitiveValue] of CacheOperations.getAllPrimitives()) {

      const newPrimitiveItem = ` 
                          <li data-index = "${dataIndex}" data-primitive-name = "${primitiveName}" data-primitive-value = "${primitiveValue}">
                              <div class="flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                                <div class="color-box h-5 w-5 mr-2 border rounded-md" style="background-color: ${primitiveValue};"></div>
                                <p class="color-text text-sm mr-2 flex-1">${primitiveName}</p>
                              </div>
                          </li>`;
      
      primitivesContainer.insertAdjacentHTML("beforeend", newPrimitiveItem);
    }
    selectPrimitiveModal.setAttribute("data-index", dataIndex);
    selectPrimitiveModal.setAttribute("theme-mode", themeMode);
    selectPrimitiveModal.setAttribute("semantic-name", semanticName);
    selectPrimitiveModal.classList.replace("hidden","flex");
  }

  function CloseSelectPrimitiveModal() {
    selectPrimitiveModal.classList.replace("flex","hidden");
  }

  function makePrimitiveRowDraggable(row) {
    row.setAttribute('draggable', true);
  
    // Drag Start
    row.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', row.getAttribute('primitive-row-index'));
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
      const tableBody = document.querySelector("#primitives-table tbody");

      const rows = tableBody.querySelectorAll('tr');

      rows.forEach((row, index) => {
          const primitiveName = row.querySelector("#primitive-name").textContent.trim();
          const primitivevalue = row.querySelector("#color-text").textContent.trim();
          const newOrderIndex = index + 1;
          //console.log(`Row ${newOrderIndex}: [ PrimitiveName: ${primitiveName}], [ PrimitiveValue: ${primitivevalue}]`, row);
          updatePrimitiveColor(CacheOperations.getTemplateName(), primitiveName, primitivevalue, newOrderIndex);
      });


    });
  }

  

