

  //Tabs switching function
  const primitivesTabButton = document.getElementById("primitives-tab");
  const semanticTabButton = document.getElementById("semantic-tab");

  const bottomNavBar = document.getElementById("bottom-nav-bar");

  let primitiveInputValues = new Map();

  

  primitivesTabButton.addEventListener('click', () => {
      document.getElementById("primitives-screen").classList.replace("hidden", "visible");
      document.getElementById("semantic-screen").classList.replace("visible", "hidden");

      semanticTabButton.className = "inline-block p-2 hover:text-blue-600";
      primitivesTabButton.className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
    });

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

  const primitiveTableBody = document.querySelector("#primitives-table tbody");

  // listen for clicks on color-box or color-text elements within the table body
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
        ShowAlert("warning","bOnly letters, numbers, hyphens (-), and underscores (_) are allowed.", 3500);
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

  let currentSemanticeColorDiv = null; 
  let currentSemanticColorTextview = null;
  const selectPrimitiveModal = document.getElementById("select-primitive-modal");


  // listen for clicks on color-box or color-text elements within the table body
  document.querySelector("#semantic-table tbody").addEventListener("click", function (event) {
    
    // Find the closest <tr> element from the clicked target
    const clickedRow = event.target.closest("tr");

    if (event.target.closest('.delete-row')) {
        clickedRow.remove();
    } else if (event.target.closest('.primitive-link')) {
      // Find the <td> with the class 'primitive-link' inside the row
      const primitiveLinkCell = clickedRow.querySelector(".primitive-link");
      linkPrimitiveToSemantic(primitiveLinkCell);
    } 
  });

  function linkPrimitiveToSemantic(primitiveLinkCell){
    bottomNavBar.classList.replace("visible","hidden");
    selectPrimitiveModal.classList.replace("hidden","flex");
  }

  document.getElementById("close-primitive-modal").addEventListener("click", function(event){
    selectPrimitiveModal.classList.replace("flex","hidden");
    bottomNavBar.classList.replace("hidden","visible");
  });
  

  // Adding event listener for hover functionality to show the delete button
  document.querySelector("#semantic-table tbody").addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    // Show delete button on hover
    if (parentRow) {
      parentRow.querySelector('.delete-row').style.display = 'inline-flex';  // Show delete button
    }
  }, true); // Use capture phase for this to run first

  document.querySelector("#semantic-table tbody").addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    // Hide delete button when hover ends
    if (parentRow) {
      parentRow.querySelector('.delete-row').style.display = 'none';  // Hide delete button
    }
  }, true); // Use capture phase for this to run first


  document.getElementById("addRowToSemantic").addEventListener("click", function () {
    // Get the table body
    const tableBody = document.querySelector("#semantic-table tbody");

    // Create a new row
    const newRow = `
                  <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white w-2/4">
                      <div class="flex items-center w-full">
                        <img src="/assets/paintBoard.svg" alt="" class="w-5 h-5" />
                        <input 
                          type="text" 
                          value="g50" 
                          class="text-sm text-gray-500 ml-2 w-full border-0 px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Give primitive a name" 
                        />
                      </div>
                    </td>
                    <td data-dropdown-toggle="dropdownInformation" class="px-6 py-4 w-2/4 primitive-link">
                      <div class="color-box-parent w-full flex items-center">
                        <div class="color-box h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm bg-white"></div>
                        <svg class="w-4 h-4 text-gray-500 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.213 9.787a3.391 3.391 0 0 0-4.795 0l-3.425 3.426a3.39 3.39 0 0 0 4.795 4.794l.321-.304m-.321-4.49a3.39 3.39 0 0 0 4.795 0l3.424-3.426a3.39 3.39 0 0 0-4.794-4.795l-1.028.961"/>
                        </svg>
                        <p class="color-text mr-2 flex-1">#FFFFFF</p>
                        <button type="button" class="hidden delete-row text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                        <button type="button" class=" text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  `;
    
    // Insert the new row into the table body
    tableBody.insertAdjacentHTML("beforeend", newRow);
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