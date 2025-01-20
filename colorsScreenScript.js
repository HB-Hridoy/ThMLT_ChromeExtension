

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

  const addNewThemeButton = document.getElementById("add-new-theme-button");
  const newThemeInput = document.getElementById("add-new-theme-input");
  const newThemeInputErrors = document.getElementById("add-new-theme-errors");

  const primitiveTable = document.getElementById('primitive-table');
  const primitiveTableBody = document.querySelector("#primitives-table tbody");

  const semanticTable = document.getElementById('semantic-table');
  const semanticTableBody = document.querySelector("#semantic-table tbody");

  const selectPrimitiveModal = document.getElementById("select-primitive-modal");


  
  //Open home screen
  document.getElementById("color-screen-back-button").addEventListener("click", () => {
    document.getElementById("colors-screen").classList.replace("visible", "hidden");
    document.getElementById("home-screen").classList.replace("hidden", "visible");
  });

  
  // open primitives tab
  primitivesTabButton.addEventListener('click', () => {
      document.getElementById("primitives-screen").classList.replace("hidden", "visible");
      document.getElementById("semantic-screen").classList.replace("visible", "hidden");

      semanticTabButton.className = "inline-block p-2 hover:text-blue-600";
      primitivesTabButton.className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
    });
    // Open semantic screen
    semanticTabButton.addEventListener('click', () => {
        document.getElementById("primitives-screen").classList.replace("visible", "hidden");
        document.getElementById("semantic-screen").classList.replace("hidden", "visible");

        primitivesTabButton.className = "inline-block p-2 hover:text-blue-600";
        semanticTabButton.className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
    });


  //Primitives Screen
  let currentPrimitiveColorDiv = null; 
  let currentPrimitiveColorTextview = null;
  let pickrInstance = null; 

  

  primitiveTableBody.addEventListener("click", async function (event) {
    const target = event.target;
    const parentRow = target.closest("tr");
    const currentTemplateName = document.getElementById("template-name-colors-screen").innerText;
      
    currentPrimitiveColorTextview = parentRow.querySelector(".color-text");

    if (target.classList.contains("color-box")) {

      const rowId  = target.id.split('-').pop();
      const parentRow = document.getElementById(`primitive-row-${rowId}`);

      if(!parentRow.classList.contains("bg-red-300")){
        
        // If there's an open pickr, close it before opening the new one
        if (pickrInstance && pickrInstance.isOpen()) {
          pickrInstance.hide();
        }
        // Store the clicked colorDiv
        currentPrimitiveColorDiv = target;

        // If Pickr instance doesn't exist, create it
        if (!pickrInstance) {
          pickrInstance = Pickr.create({
            el: '#color-picker', 
            theme: 'nano',
            default: "#FFFFFF",
            swatches: ['#ff0000', '#00ff00', '#0000ff', '#000000', '#ffffff'],
            components: {
              preview: true,
              hue: true,
              interaction: {
                hex: true,
                rgba: true,
                input: true,
                save: false
              }
            }
          });


          pickrInstance.on('change', (color) => {
            const hex = color.toHEXA().toString(); // Get the hex value
            currentPrimitiveColorDiv.style.backgroundColor = hex;  // Set colorDiv background color
            currentPrimitiveColorTextview.innerText = hex;  // Update colorTextView with the color
          });
        }

        // Move the Pickr container to the new location
        parentRow.querySelector("#temp-primitive-color-picker").appendChild(document.getElementById("color-picker-container"));

        pickrInstance.show();

      }else{
        document.getElementById(`primitive-refresh-row-${rowId}`).classList.replace("visible", "hidden");
        ShowAlert("danger", "Diplicate primitive name", 2000);
      }

      

    } else if (target.classList.contains("color-text")) {

        currentPrimitiveColorTextview = target;
        navigator.clipboard.writeText(currentPrimitiveColorTextview.innerText).then(() => {
            alert('Color copied: ' + currentPrimitiveColorTextview.innerText);
        }).catch(err => {
            console.error('Error copying text: ', err);
        });

    } else if (target.closest('.delete-row')) {

      const deleteButton = target.closest('.delete-row'); // Ensure we have the button element
      const rowId = deleteButton.id.split('-').pop(); // Get the 'id' of the delete button and Get the last part of the 'id'


        // Check if the color picker exist in to be deleted row it should moved to the #header-color-picker-container
        const colorPickerContainer = document.getElementById("color-picker-container");

        if (colorPickerContainer) {
            const headerContainer = document.getElementById("header-color-picker-container");
            if (headerContainer) {
            headerContainer.appendChild(colorPickerContainer);
            }
        }
        const currentPrimitiveName = document.getElementById(`primitive-name-input-${rowId}`).value.trim();

        
        deletePrimitiveColor(currentTemplateName, currentPrimitiveName)
        .then((result) => {
           ShowAlert("dark", result, 3000);
        })
        .catch((error) => {
          ShowAlert("danger", error, 3000);
          console.error("Error:", error);
        });

        parentRow.remove();
    } else if (target.closest('.refresh-row')) {

      const refreshButton = target.closest('.refresh-row'); // Ensure we have the button element
      const rowId = refreshButton.id.split('-').pop(); // Get the 'id' of the refresh button

      const primitiveName = document.getElementById(`primitive-name-input-${rowId}`).value.trim();
      const primitiveValue = document.getElementById(`primitive-value-${rowId}`).textContent.trim();
      const templateId = document.getElementById("template-name-colors-screen").textContent.trim();

      

      if (!primitiveName || !primitiveValue || !templateId) {
        ShowAlert("danger","Missing required values", 2500);
        return;
      }

      if (primitiveValue === "#------"){
        ShowAlert("info","Choose color first", 2500);
        return;
      }

      if (!nameRegex.test(primitiveName)) {
        ShowAlert("warning","Only letters, numbers, hyphens (-), and underscores (_) are allowed.", 3500);
        console.log(primitiveValue);
        return;
      }


      
      try {
        console.log("Adding new primitive...");

        const oldPrimitiveName = oldPrimitiveInputValues.get(rowId);
        if(oldPrimitiveName !== primitiveName){
          deletePrimitiveColor(templateId, oldPrimitiveName);
        }
        
        const result = await addPrimitiveColor(templateId, primitiveName, primitiveValue);
        if (result == "Primitive color added"){
          ShowAlert("success", result, 2500);
          oldPrimitiveInputValues.set(rowId, primitiveName); 

        } else if (result == "Primitive color updated"){
          ShowAlert("info", result, 2500);
        }
        refreshButton.classList.replace("visible", "hidden");
    
      } catch (error) {
        ShowAlert("danger", 3000); // Display error to the user
        console.error(error); // Log the error for debugging
      }
    }
  });

  function updatePrimitiveInputValues(){
    primitiveTableBody.querySelectorAll('.name-input').forEach(input => {
      const inputRowId = input.id.split('-').pop();
      const inputValue = input.value.trim();
      primitiveInputValues.set(inputRowId, inputValue); 
    });
  }

  primitiveTableBody.addEventListener("input", (event) => {
    const target = event.target;
  
    // If the target is an input field of type 'text'
    if (target.classList.contains("name-input")) {
      const rowId = target.id.split('-').pop();
      const currentValue = target.value; // The current value of the input
      const allInputs = primitiveTableBody.querySelectorAll('.name-input'); // All text inputs in tbody

      const parentRow = document.getElementById(`primitive-row-${rowId}`);
      const refreshButton = document.getElementById(`primitive-refresh-row-${rowId}`);
      
      let isDuplicate = false;
  
      // Loop through all the other inputs and check if any input has the same value
      allInputs.forEach(input => {
        const inputRowId = input.id.split('-').pop();
        const inputValue = input.value.trim();
        primitiveInputValues.set(inputRowId, inputValue); 

        if (input !== target && inputValue === currentValue) {

          isDuplicate = true;
          document.getElementById(`primitive-row-${inputRowId}`).classList.replace("bg-white", "bg-red-300"); 
          refreshButton.classList.replace("visible", "hidden");
          ShowAlert("danger", "This primitive name already exists!", 2500);
        } else {
          document.getElementById(`primitive-row-${inputRowId}`).classList.replace("bg-red-300", "bg-white");
          refreshButton.classList.replace("hidden", "visible");
        }
        if (!nameRegex.test(inputValue)) {
          ShowAlert("warning","Only letters, numbers, hyphens (-), and underscores (_) are allowed.", 3500);
        }
       
      });
      // If duplicate is found, highlight the current input as well
      if (isDuplicate) {
        parentRow.classList.replace("bg-white", "bg-red-300");
        refreshButton.classList.replace("visible", "hidden");
      } else {
        parentRow.classList.replace("bg-red-300", "bg-white"); // Remove red border when no duplicate
        refreshButton.classList.replace("hidden", "visible");
      }

      // Create a Map to track how many times a value occurs and store keys in an array
      const valueToKeysMap = new Map();

      // Populate valueToKeysMap with values and their associated keys
      primitiveInputValues.forEach((value, key) => {
        // Skip if the value is empty, null, or undefined
        if (!value || value.trim() === "") return;  // This checks for empty, null, or undefined values
        if (!valueToKeysMap.has(value)) {
          valueToKeysMap.set(value, []);
        }
        valueToKeysMap.get(value).push(key);
      });

      // Find duplicates and store the keys of those duplicates in an array
      const duplicateInputRows = [];
      valueToKeysMap.forEach((keys) => {
        if (keys.length > 1) {
          duplicateInputRows.push(...keys);
        }
      });

      for (const duplicateInputRowId of duplicateInputRows) {
        document.getElementById(`primitive-row-${duplicateInputRowId}`).classList.replace("bg-white", "bg-red-300");
        document.getElementById(`primitive-refresh-row-${duplicateInputRowId}`).classList.replace("visible", "hidden");
      }


  
    }
  });
  
  // Monitor changes to <p class="color-text">
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (
        mutation.type === "characterData" || 
        mutation.target.nodeType === Node.ELEMENT_NODE
      ) {
        const target = mutation.target;

        if (target.tagName === "P" && target.classList.contains("color-text")) {
          const rowId  = target.id.split('-').pop();
          // const parentRow = document.getElementById(`primitive-row-${rowId}`);
          // if(!parentRow.classList.contains("bg-red-300")){
          //   document.getElementById(`primitive-refresh-row-${rowId}`).classList.replace("hidden", "visible");
          //   pickrInstance.setColorRepresentation("#f8b4b3");
          // }else{
          //   pickrInstance.setColorRepresentation("#ffffff");
          // }
          document.getElementById(`primitive-refresh-row-${rowId}`).classList.replace("hidden", "visible");
        }
      }
    });
  });

  observer.observe(primitiveTableBody, {
    subtree: true, // Observe all descendants
    childList: true, // Observe added/removed nodes
    characterData: true, // Observe text changes
  });

  // Adding event listener for hover functionality to show the delete button
  document.querySelector("#primitives-table tbody").addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    // Show delete button on hover
    if (parentRow) {
      parentRow.querySelector('.delete-row').style.display = 'inline-flex';  // Show delete button
    }
  }, true); // Use capture phase for this to run first

  document.querySelector("#primitives-table tbody").addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    // Hide delete button when hover ends
    if (parentRow) {
      parentRow.querySelector('.delete-row').style.display = 'none';  // Hide delete button
    }
  }, true); // Use capture phase for this to run first


  document.getElementById("addRowToPrimitives").addEventListener("click", function () {
    // Get the table body
    const tableBody = document.querySelector("#primitives-table tbody");

    // Create a new row
    const newRow = `
                  <tr id="primitive-row-${currentPrimitiveRowId}" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white w-2/4">
                      <div class="flex items-center w-full">
                        <img src="/assets/paintBoard.svg" alt="" class="w-5 h-5" />
                        <input 
                          id="primitive-name-input-${currentPrimitiveRowId}"
                          type="text" 
                          value="" 
                          class="name-input text-sm text-gray-500 ml-2 w-full border-0 border-white rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Give primitive a name" 
                        />
                      </div>
                    </td>
                    <td class="px-6 py-4 w-2/4">
                      <div class="color-box-parent w-full flex items-center">
                        <div id="primitive-color-box-${currentPrimitiveRowId}" class="color-box h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm bg-white"></div>
                        <p id="primitive-value-${currentPrimitiveRowId}" class="color-text mr-2">#------</p>
                        <div id="temp-primitive-color-picker" class="flex-1" ></div> <!-- Takes remaining space -->
                        <button id="primitive-delete-row-${currentPrimitiveRowId}" class="hidden delete-row text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                         <button id="primitive-refresh-row-${currentPrimitiveRowId}" class="hidden refresh-row text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  `;
    
    // Insert the new row into the table body
    tableBody.insertAdjacentHTML("beforeend", newRow);
    currentPrimitiveRowId++;
    //addPrimitiveColor({id: document.getElementById("template-name-colors-screen").innerText.trim(), primitiveName: , primitiveValue: })
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
      

      let isDuplicate = activeThemeModesInSemantic.includes(inputValue);
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

  // Show primitives modal
  function ShowPrimitivesModal(){
    selectPrimitiveModal.classList.replace("hidden","flex");
  }

  // Close primitives modal
  document.getElementById("close-primitive-modal").addEventListener("click", function(event){
    selectPrimitiveModal.classList.replace("flex","hidden");
   
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
    
    //console.log(target);

    // if (target.tagName === "TD" && target.getAttribute("theme-mode")) {

    // }

    if (target.closest(".semantic-value-cell")){
      //console.log(target.closest(".semantic-value-cell"));

      const parentTd = target.closest('td');
      const dataIndex = parentTd ? parentTd.getAttribute('data-index') : null;
      const semanticName = activeSemanticNames[dataIndex-1];
      const themeMode = parentTd ? parentTd.getAttribute('theme-mode') : null;

      // Log the extracted values
      console.log('data-index:', dataIndex);
      console.log('theme-mode:', themeMode);
      console.log('semantic-name: ', semanticName);
      
      linkPrimitiveToSemantic();
    
        
    }
    
    
  });

  // add semantic row modal button
  addRowToSemanticButton.addEventListener("click", async function () {

  const semanticNameFromInput = addNewSemanticRowInput.value.trim();
  // let normalValueCellsCount = 0; 
  // let normalValueCells =""; 

  let semanticValues = [];
    try {

      for (const themeMode of activeThemeModesInSemantic) {
        const result = await addSemanticColor(activeTemplateName, semanticNameFromInput, themeMode, "Click to link color");
        semanticValues.push("Click to link color");
        
      }
      
      
    } catch (error) {
      ShowAlert("danger", error, 2500);
    }
    
    if (semanticValues.length === activeThemeModesInSemantic.length) {

      addNewRowToSemanticTable(semanticNameFromInput, semanticValues, activeThemeModesInSemantic);
    } else {
      ShowAlert("danger", "Error adding semantic", 2500);
    }

    addNewSemanticRowInput.value = "";
    addRowToSemanticButton.classList.replace("visible","hidden");


  });

  async function handlePrimitiveRowRefresh(rowId) {

    const primitiveName = document.getElementById(`primitive-name-input-${rowId}`).value.trim();
    const primitiveValue = document.getElementById(`primitive-value-${rowId}`).textContent.trim();
    const templateId = idEldocument.getElementById("template-name-colors-screen").textContent.trim();

    if (!primitiveName || !primitiveValue || !templateId) {
      ShowAlert("error","Missing required values", 2500);
      return "Missing required values";
    }

    try {
      console.log("Adding new primitive...");
      
      const result = await addPrimitiveColor(templateId, primitiveName, primitiveValue);
      console.log(result); // Log success message
      if (result == "Primitive color added"){
        ShowAlert("success", result, 2500);
      } else if (result == "Primitive color updated"){
        ShowAlert("info", result, 2500);
      }
      
      return ("success");
  
    } catch (error) {
      ShowAlert("danger", 3000); // Display error to the user
      console.error(error); // Log the error for debugging
    }
  }
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
                                <div class="semantic-mode-value semantic-mode-cell semantic-mode-value hide-border bg-red-200">
                                    <div class="semantic-alias-pill-cell semantic-alias-pill-base">
                                        <div class="semantic-pill-cover "
                                            aria-disabled="false" 
                                            style="transform: translate(0px, 0px);">
                                            <div class="semantic-pill" >
                                                <div class="semantic-color-thumbnail-container">
                                                    <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                                                        style="background-color: rgb(22, 22, 27);">
                                                    </div>
                                                </div>
                                                <div class="semantic-pill-text">
                                                            ${semanticValue}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                          `;
    }
    themeModes.forEach(themeMode => {
      
    });

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

      const result = deleteSemanticColor(selectedSemanticName, activeTemplateName);

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

      const result = renameSemantic(selectedSemanticCell.textContent.trim(), editSemanticRowInput.value, activeTemplateName)

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

      for (const semanticName of activeSemanticNames){
       const result = await addSemanticColor(activeTemplateName, semanticName, newThemeMode, "Click to link color");
      }

      const newThHTML = `
                              <td theme-mode="${newThemeMode}" class="semantic-table-cell semantic-table-cell-has-padding">
                                  ${newThemeMode}
                              </td>
                            `;

      const newTdHTML = `
                          <td class="semantic-table-cell" data-index = "${currentSemanticRowId}">
                                <div class="semantic-mode-value semantic-mode-cell semantic-mode-value hide-border bg-red-200">
                                    <div class="semantic-alias-pill-cell semantic-alias-pill-base">
                                        <div class="semantic-pill-cover "
                                            aria-disabled="false" 
                                            style="transform: translate(0px, 0px);">
                                            <div class="semantic-pill" >
                                                <div class="semantic-color-thumbnail-container">
                                                    <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                                                        style="background-color: rgb(22, 22, 27);">
                                                    </div>
                                                </div>
                                                <div class="semantic-pill-text">
                                                            <span class="">Click to link color</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        `;

        const newTh = document.createElement('td');
        newTh.classList.add("semantic-table-cell");
        newTh.classList.add("semantic-table-cell-has-padding");
        newTh.innerHTML = newThHTML;
        theadRow.insertBefore(newTh, theadRow.lastElementChild);

        // Add the new <td> to each row in tbody
        bodyRows.forEach(row => {
          if(row.id !== "semantic-table-header-row"){

          const newTd = document.createElement('td');
          newTd.classList.add("semantic-table-cell");
          newTd.innerHTML = newTdHTML;
          row.insertBefore(newTd, row.lastElementChild);
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

        activeThemeModesInSemantic.push(newThemeMode);
        table.style.gridTemplateColumns = newGridTemplateColumns;
      
      
    } catch (error) {
      ShowAlert("danger", error, 2500);
    }
  }

