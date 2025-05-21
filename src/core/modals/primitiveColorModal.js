import DatabaseManager from '../../db/DatabaseManager.js';
import { modalManager, MODALS } from '../../utils/modalManager.js';
import { primitiveTable } from '../../utils/primitiveTable.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { replaceClass } from '../sidepanel.js';
import { confirmationModal } from '../modals/confirmationModal.js'
import { showNoPrimitivesScreen, showPrimitivesTable } from '../screens/primitiveColor/primitiveColor.js';
import { semanticTable } from '../../utils/semanticTable.js';

let primitiveModalElement = null;

let titleElement = null;

let primitiveNameInput = null;
let primitiveNameInputError = null;

let colorValue = null;

let deleteButton = null;
let actionButton = null;

let pickrInstance = null;

class PrimitiveModal {
  constructor() {
    this.modal = null;
    this.listenersAdded = false;
    this.modes = {
      ADD: "add",
      EDIT: "edit"
    }
    this.currentMode = this.modes.ADD;
  }

  async show(mode, editValues) {
    if (!this.modal){

      this.modal = await modalManager.register(MODALS.PRIMITIVE_MODAL);
    }
    this.setMode(mode, editValues);
    this.modal.show();

    if (this.listenersAdded) return;

    this.createPickr();

    // ========== GLOBAL VARIABLES BEGIN ========== //

    primitiveModalElement = document.getElementById("primitive-modal");

    titleElement = document.getElementById("primitive-modal-title");
    
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

    actionButton.addEventListener("click", async () => {
      handleActionButtonClick();
    });

    deleteButton.addEventListener("click", async () => {
      handleDeleteButtonClick();
    });

    document.getElementById("hide-primitive-modal").addEventListener("click", () => {
      this.modal.hide();
    });

    const colorTextObserver = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          if (colorValue.innerText.trim() !== primitiveModalElement.getAttribute("primitiveValue") && primitiveModalElement.classList.contains("flex")) {
            this.enableActionButton(true);
          }
          
        }
      });
    });
  
    colorTextObserver.observe(colorValue, { childList: true });

    // ========== EVENT LISTENERS END ========== //

    this.listenersAdded = true;
    this.setMode(mode, editValues);

  }

  hide(){
    this.modal.hide();
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

    this.enableActionButton(false);

    this.enableDeleteButton(false);

    // If there's an open pickr, close it before opening the new one
    if (pickrInstance && pickrInstance.isOpen()) {
      pickrInstance.hide();
    }

    primitiveNameInput.value = "";
    primitiveNameInputError.classList.toggle("hidden", true);
    primitiveNameInput.style.borderColor = "";
    
  }

  enableActionButton(enabled){
    if (enabled) {
      replaceClass(actionButton, "bg-", "bg-blue-700");
      replaceClass(actionButton, "hover:bg-", "hover:bg-blue-800");
      actionButton.disabled = false;
    } else {
      replaceClass(actionButton, "bg-", "bg-gray-500");
      replaceClass(actionButton, "hover:bg-", "hover:bg-gray-600");
      actionButton.disabled = true;
    }
  }

  enableDeleteButton(enabled){
    if (enabled) {
      deleteButton.classList.remove("hidden");
    } else {
      deleteButton.classList.add("hidden");
    }
  }

  setMode(mode, editValues = {primitiveId: 0, primitiveName: "", primitiveValue: ""}){

    if (!this.listenersAdded) return console.log("[PRIMITIVE MODAL] setMode: Listeners not added yet");
    
    this.restoreDeafaults();

    if (mode === this.modes.ADD) {

      this.currentMode = this.modes.ADD;

      titleElement.innerHTML = "Add New Primitive";
      actionButton.innerHTML = "Add new primitive";


    } else if (mode === this.modes.EDIT){

      this.currentMode = this.modes.EDIT;

      this.enableDeleteButton(true)

      titleElement.innerHTML = "Edit Primitive";
      actionButton.innerHTML = "Update";

      const primitiveName = editValues.primitiveName;
      const primitiveValue = editValues.primitiveValue;
      const primitiveId = editValues.primitiveId;

      primitiveModalElement.setAttribute("primitiveName", primitiveName);
      primitiveModalElement.setAttribute("primitiveValue", primitiveValue);
      primitiveModalElement.setAttribute("primitiveId", primitiveId);

      primitiveNameInput.value = primitiveName;
      pickrInstance.setColor(primitiveValue);
      colorValue.textContent = primitiveValue;

      document.querySelector(".pcr-last-color").style.setProperty("--pcr-color", primitiveValue);
    }
    
  }
}
const primitiveModal = new PrimitiveModal();

export { primitiveModal };

function handlePrimitiveNameInputChange(){

  primitiveModal.enableActionButton(false);

  const nameRegex = /^[a-zA-Z0-9_-]+$/;


  const primitiveName = primitiveModalElement.getAttribute("primitiveName");
  const inputValue = primitiveNameInput.value.trim();
  let errorMessage = "";

  if (!inputValue) {
    errorMessage = "Primitive name is required";
  } else if (cacheManager.primitives.isExist(inputValue) && primitiveName !== inputValue) {
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

async function handleDeleteButtonClick() {

  const primitiveId = primitiveModalElement.getAttribute("primitiveId");

  primitiveModal.hide();

  const confirmed = await confirmationModal.confirm({
    message: `Are you sure you want to delete ${cacheManager.primitives.getName(primitiveId)} primitive color?`,
  })

  if (confirmed) {
    try {
      await DatabaseManager.primitives.delete({
        id: primitiveId
      });
      primitiveTable.deleteRow(primitiveId);

      if(cacheManager.primitives.getAllNames().length === 0){
        showNoPrimitivesScreen();
      }
      
    } catch (error) {
      console.error(error);
      
    }
  }

  
}

async function handleActionButtonClick() {
  if (primitiveModal.currentMode === primitiveModal.modes.ADD) {
    const primitiveName = primitiveNameInput.value.trim();
    const primitiveValue = colorValue.textContent.trim();

    try {
      const newPrimitive = {
        projectId: cacheManager.projects.activeProjectId,
        primitiveName: primitiveName,
        primitiveValue: primitiveValue,
        orderIndex: primitiveTable.getNextOrderIndex()
      };
      const primitiveId = await DatabaseManager.primitives.create(newPrimitive);

      primitiveTable.addRow({
        primitiveId: primitiveId,
        primitiveName: newPrimitive.primitiveName, 
        primitiveValue: newPrimitive.primitiveValue,
        orderIndex: newPrimitive.orderIndex,
        animation: true
      });
      primitiveModal.hide();

      showPrimitivesTable();
    } catch (error) {
      console.error("Error creating primitive:", error);
      
    }
  
  } else if (primitiveModal.currentMode === primitiveModal.modes.EDIT) {

    const primitiveId = primitiveModalElement.getAttribute("primitiveId");

    console.log(typeof primitiveId, primitiveId); // should log: number 1


    const oldPrimitiveName = primitiveModalElement.getAttribute("primitiveName");
    const oldPrimitiveValue = primitiveModalElement.getAttribute("primitiveValue");

    const newPrimitiveName  = primitiveNameInput.value.trim();
    const newPrimitiveValue = colorValue.textContent.trim();
    
    try {

      const updatedFields = {};

      if (newPrimitiveName !== oldPrimitiveName) {
        updatedFields.primitiveName = newPrimitiveName;
      }

      if (newPrimitiveValue !== oldPrimitiveValue) {
        updatedFields.primitiveValue = newPrimitiveValue;
      }
      
      
      await DatabaseManager.primitives.update({
        id: primitiveId,
        updatedFields: updatedFields
      });

      primitiveTable.updateRow(primitiveId, {
        primitiveName: updatedFields.primitiveName ? newPrimitiveName : oldPrimitiveName,
        primitiveValue: updatedFields.primitiveValue ? newPrimitiveValue : oldPrimitiveValue
      });

      semanticTable.updateLinkedPrimitives({
        primitiveId,
        updatedFields
      });

      primitiveModal.hide();
      

    } catch (error) {
      console.log(error);
      
    }
    
    
  }
}


