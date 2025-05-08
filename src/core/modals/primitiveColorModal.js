import { modalManager, MODALS } from '../../utils/modalManager.js';
import sidepanelCache from '../../utils/sidepanelCache.js';
import { replaceClass } from '../sidepanel.js';

let primitiveModalElement = null;



let primitiveModalMode = null;

let primitiveNameInput = null;
let primitiveNameInputError = null;

let colorValue = null;

let deleteButton = null;
let actionButton = null;

let pickrInstance = null;

class PrimitiveModal {
  constructor() {
    this.primitiveModal = null;
    this.listenersAdded = false;
  }

  async show() {
    if (!this.primitiveModal){

      this.primitiveModal = await modalManager.register(MODALS.PRIMITIVE_MODAL);
    }
    this.primitiveModal.show();

    if (this.listenersAdded) return;

    // ========== GLOBAL VARIABLES BEGIN ========== //

    primitiveModalElement = document.getElementById("primitive-modal");

    primitiveModalMode = document.querySelector('h3[primitiveModalMode]');
    
    primitiveNameInput = document.getElementById("primitive-modal-name-input");
    primitiveNameInputError = document.getElementById("primitive-modal-name-input-error");

    colorValue = document.getElementById("primitive-modal-color-text");

    deleteButton = document.getElementById("primitive-modal-delete-button");
    actionButton = document.getElementById("primitive-modal-action-button");

    // ========== GLOABL VARIABLE END ========== //

    // ========== EVENT LISTENERS BEGIN ========== //

    primitiveNameInput.addEventListener("input", () => {
      handlePrimitiveNameInputChange();
    });

  }

  hide(){
    this.primitiveModal.hide();
  }

  createPickr(){

     if (!pickrInstance) {

      pickrInstance = Pickr.create({
        el: '#primitive-modal-color-picker-container', 
        theme: 'classic',
        default: "#FFFFFF",
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
      const pickrRoot = document.querySelector('.pickr'); // Root element of Pickr
      pickrRoot.style.border = '1px solid #D1D5DB';
      pickrRoot.style.borderRadius = '5px';

      const button = document.querySelector(".pcr-button");
      
      pickrInstance.on('change', (color) => {
        const hex = color.toHEXA().toString(); 
        button.style.setProperty("--pcr-color", hex);
        
        colorValue.textContent = hex;
      });
    }

  }

  restoreDeafaults(){
    
  }

  setMode(mode){
    
  }
}
const primitiveModal = new PrimitiveModal();

export { primitiveModal };

function handlePrimitiveNameInputChange(){

  // Reset action button to default
  replaceClass(actionButton, "bg-", "bg-gray-500");
  replaceClass(actionButton, "hover:bg-", "hover:bg-gray-600");
  actionButton.disabled = true;

  const primitiveName = primitiveModalElement.getAttribute("primitiveName");
  const inputValue = primitiveNameInput.value.trim();
  let errorMessage = "";

  if (!inputValue) {
    errorMessage = "Primitive name is required";
  } else if (sidepanelCache.isPrimitiveExist(inputValue) && primitiveName !== inputValue) {
    errorMessage = "Primitive name already exist!";
  } else if (!nameRegex.test(inputValue)) {
    errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
  }
  
  if (errorMessage) {
    primitiveNameInputError.innerHTML = errorMessage;
    primitiveNameInputError.classList.remove("hidden");

    primitiveNameInput.style.borderColor = "red";

    replaceClass(actionButton, "bg-", "bg-gray-500");
    replaceClass(actionButton, "hover:bg-", "hover:bg-gray-600");
    actionButton.disabled = true;

  } else {
    primitiveNameInputError.classList.add("hidden");
    replaceClass(actionButton, "bg-", "bg-blue-700");
    replaceClass(actionButton, "hover:bg-", "hover:bg-blue-800");
    actionButton.disabled = false;
  }

  if (primitiveName === inputValue) {
    replaceClass(actionButton, "bg-", "bg-gray-500");
    replaceClass(actionButton, "hover:bg-", "hover:bg-gray-600");
    actionButton.disabled = true;
  }
}


