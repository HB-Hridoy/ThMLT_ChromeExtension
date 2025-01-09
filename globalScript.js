  let activeScreen = "colors-screen";

  document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('[data-nav-button-screen-target]');

      buttons.forEach(button => {
          button.addEventListener('click', () => {
              const targetScreenId = button.getAttribute("data-nav-button-screen-target");

              SwitchScreen(targetScreenId);
          });
      });
  });


  function SwitchScreen(screenName){
    const targetScreen = document.getElementById(screenName);
    
    document.getElementById(activeScreen).classList.replace("visible", "hidden");
    targetScreen.classList.replace("hidden", "visible");

    const activeIcon = document.getElementById(activeScreen + "-icon");
    const targetIcon = document.getElementById(screenName + "-icon");

    activeIcon.classList.replace("text-blue-600", "text-gray-500");
    targetIcon.classList.replace("text-gray-500", "text-blue-600");

    activeScreen = screenName;
  }

  //Adding colors tab switching
  const primitivesTabButton = document.getElementById("primitives-tab");
  const semanticTabButton = document.getElementById("semantic-tab");

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

  let currentColorDiv = null; // Track the current colorDiv being edited
  let currentColorTextview = null;   // Track the current colorTextView being edited
  let pickrInstance = null; // Pickr instance

  // document.querySelectorAll('.color-box-parent').forEach(colorDivParent => {
  //   const colorTextView = colorDivParent.querySelector('.color-text');
  //   const colorDiv = colorDivParent.querySelector('.color-box');
    
  //   colorDiv.addEventListener('click', () => {
  //     // If there's an open pickr, close it before opening the new one
  //     if (pickrInstance && pickrInstance.isOpen()) {
  //       pickrInstance.hide();
  //     }

  //     currentColorDiv = colorDiv;  // Store the clicked colorDiv
  //     currentColorTextview = colorTextView;      // Store the associated p
      

  //     // If Pickr instance doesn't exist, create it
  //     if (!pickrInstance) {
  //       pickrInstance = Pickr.create({
  //         el: '#color-picker',  // Single Pickr container
  //         theme: 'nano',
  //         default: "#E5E7EB",
  //         swatches: ['#ff0000', '#00ff00', '#0000ff', '#000000', '#ffffff'],
  //         components: {
  //           preview: true,
  //           hue: true,
  //           interaction: {
  //             hex: true,
  //             rgba: true,
  //             input: true,
  //             save: false
  //           }
  //         }
  //       });


  //       pickrInstance.on('change', (color) => {
  //         const hex = color.toHEXA().toString(); // Get the hex value
  //         currentColorDiv.style.backgroundColor = hex;  // Set colorDiv background color
  //         currentColorTextview.innerText = hex;  // Update colorTextView with the color
  //       });
  //     }

  //     pickrInstance.show();  // Show the color picker for the selected colorDiv
  //   });
  // });

  

  // // Copy color code on colorTextView click
  // document.querySelectorAll('.color-text').forEach(colorTextView => {
  //   colorTextView.addEventListener('click', (event) => {
  //     navigator.clipboard.writeText(event.target.innerText).then(() => {
  //       alert('Color copied: ' + event.target.innerText);
  //     }).catch(err => {
  //       console.error('Error copying text: ', err);
  //     });
  //   });
  // });

  // Event delegation: listen for clicks on color-box or color-text elements within the table body
  document.querySelector("#primitives-table tbody").addEventListener("click", function (event) {
    const target = event.target;

    // Get the parent row that contains the color-box and color-text
    const parentRow = target.closest("tr");
      
    // Find the color-text in the same row
    currentColorTextview = parentRow.querySelector(".color-text");

    // Check if clicked element is color-box or color-text
    if (target.classList.contains("color-box")) {

      // If there's an open pickr, close it before opening the new one
      if (pickrInstance && pickrInstance.isOpen()) {
        pickrInstance.hide();
      }

      currentColorDiv = target;  // Store the clicked colorDiv

      // If Pickr instance doesn't exist, create it
      if (!pickrInstance) {
        pickrInstance = Pickr.create({
          el: '#color-picker',  // Single Pickr container
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
          currentColorDiv.style.backgroundColor = hex;  // Set colorDiv background color
          currentColorTextview.innerText = hex;  // Update colorTextView with the color
        });
      }

      // Move the Pickr container to the new location
      parentRow.querySelector("#temp-primitive-color-picker").appendChild(document.getElementById("color-picker-container"));
      pickrInstance.show();
    } else if (target.classList.contains("color-text")) {
      currentColorTextview = target;
      navigator.clipboard.writeText(currentColorTextview.innerText).then(() => {
        alert('Color copied: ' + currentColorTextview.innerText);
      }).catch(err => {
        console.error('Error copying text: ', err);
      });
    } else if (target.closest('.delete-row')) {
      // If the delete button is clicked, remove the respective row
      parentRow.remove();
    }
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
                    <td class="px-6 py-4 w-2/4">
                      <div class="color-box-parent w-full flex items-center">
                        <div class="color-box h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm bg-white"></div>
                        <p class="color-text mr-2">#FFFFFF</p>
                        <div id="temp-primitive-color-picker" class="flex-1" ></div> <!-- Takes remaining space -->
                        <button type="button" class="hidden delete-row text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
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


