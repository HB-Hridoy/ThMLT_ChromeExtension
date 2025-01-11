

  //Tabs switching function
  const primitivesTabButton = document.getElementById("primitives-tab");
  const semanticTabButton = document.getElementById("semantic-tab");

  const bottomNavBar = document.getElementById("bottom-nav-bar");

  let currentPrimitiveId = 1;

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
  primitiveTableBody.addEventListener("click", function (event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    let refreshRowButton =  target.closest('.refresh-row');

      
    currentPrimitiveColorTextview = parentRow.querySelector(".color-text");

    if (target.classList.contains("color-box")) {

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

    } else if (target.classList.contains("color-text")) {

        currentPrimitiveColorTextview = target;
        navigator.clipboard.writeText(currentPrimitiveColorTextview.innerText).then(() => {
            alert('Color copied: ' + currentPrimitiveColorTextview.innerText);
        }).catch(err => {
            console.error('Error copying text: ', err);
        });

    } else if (target.closest('.delete-row')) {

        // Check if the color picker exist in to be deleted row it should moved to the #header-color-picker-container
        const colorPickerContainer = document.getElementById("color-picker-container");

        if (colorPickerContainer) {

            const headerContainer = document.getElementById("header-color-picker-container");
            
            if (headerContainer) {
            headerContainer.appendChild(colorPickerContainer);
            }
        }

        parentRow.remove();
    } else if (refreshRowButton) {
      const parentRow = target.closest("tr");
      handlePrimitiveRowRefresh(parentRow);
      refreshRowButton.classList.replace("visible", "hidden");
    }
  
  });

  primitiveTableBody.addEventListener("input", (event) => {
    const target = event.target;
  
    // If input changed and it's a text input
    if (target.tagName === "INPUT" && target.type === "text") {
      // Find the closest tr (row) containing the input element
      const parentRow = target.closest("tr");
  
      if (parentRow) {
        // Find the .refresh-row button inside this row
        const refreshRowButton = parentRow.querySelector(".refresh-row");
  
        // Debug log if refresh-row is not found
        if (refreshRowButton) {
          console.log("Found refresh-row button:", refreshRowButton);
          // Replace "hidden" with "visible" if the button exists
          refreshRowButton.classList.replace("hidden", "visible");
        } else {
          console.error("refresh-row button not found inside parentRow");
        }
      } else {
        console.error("parentRow not found");
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
          target.closest("td").querySelector(".refresh-row").classList.replace("hidden", "visible");
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

    const primitiveId = "primitive-"+currentPrimitiveId;

    // Create a new row
    const newRow = `
                  <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white w-2/4">
                      <div class="flex items-center w-full">
                        <img src="/assets/paintBoard.svg" alt="" class="w-5 h-5" />
                        <input 
                          type="text" 
                          value="" 
                          class="primitive-name-input text-sm text-gray-500 ml-2 w-full border-0 px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Give primitive a name" 
                        />
                      </div>
                    </td>
                    <td class="px-6 py-4 w-2/4">
                      <div class="color-box-parent w-full flex items-center">
                        <div class="color-box h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm bg-white"></div>
                        <p class="color-text mr-2">#------</p>
                        <div id="temp-primitive-color-picker" class="flex-1" ></div> <!-- Takes remaining space -->
                        <button type="button" class="hidden delete-row text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                        <button  type="button" class="hidden refresh-row text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
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

  async function handlePrimitiveRowRefresh(tableRow) {

    console.log("handling refresh btn");
    const primitiveNameInput = tableRow.querySelector(".primitive-name-input");
    const colorText = tableRow.querySelector(".color-text");
    const idElement = document.querySelector("#template-name-colors-screen");

    if (!primitiveNameInput || !colorText || !idElement){
      console.log("This is the problem");
      return;
    } 

    const primitiveName = primitiveNameInput.value.trim();
    const primitiveValue = colorText.textContent.trim();
    const id = idElement.textContent.trim();

    if (!primitiveName || !primitiveValue || !id) {
      alert("Missing required values");
      return;
    }

    try {
      console.log("Adding new primitive...");
      
      // Await the result of addNewPrimitive
      //const result = await addNewPrimitive(primitiveName, primitiveValue, id, primitiveNameInput);
      const result = await addPrimitiveColor(id, primitiveName, primitiveValue);
      console.log(result); // Log success message
      ShowAlert();
      //return (result);
  
    } catch (error) {
      alert(error); // Display error to the user
      console.error(error); // Log the error for debugging
    }
  }