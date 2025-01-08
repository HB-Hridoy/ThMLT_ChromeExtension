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
  let colorPickerDiv = null;

  document.querySelectorAll('.color-box-parent').forEach(colorDivParent => {
    const colorTextView = colorDivParent.querySelector('.color-text');
    const colorDiv = colorDivParent.querySelector('.color-box');
    
    colorDiv.addEventListener('click', () => {
      // If there's an open pickr, close it before opening the new one
      if (pickrInstance && pickrInstance.isOpen()) {
        pickrInstance.hide();
      }

      currentColorDiv = colorDiv;  // Store the clicked colorDiv
      currentColorTextview = colorTextView;      // Store the associated p
      

      // If Pickr instance doesn't exist, create it
      if (!pickrInstance) {
        pickrInstance = Pickr.create({
          el: '#color-picker',  // Single Pickr container
          theme: 'nano',
          default: "#E5E7EB",
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

      pickrInstance.show();  // Show the color picker for the selected colorDiv
    });
  });

  // Copy color code on colorTextView click
  document.querySelectorAll('.color-text').forEach(colorTextView => {
    colorTextView.addEventListener('click', (event) => {
      navigator.clipboard.writeText(event.target.innerText).then(() => {
        alert('Color copied: ' + event.target.innerText);
      }).catch(err => {
        console.error('Error copying text: ', err);
      });
    });
  });


