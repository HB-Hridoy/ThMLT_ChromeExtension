import DatabaseManager from '../../db/DatabaseManager.js';
import { modalManager, MODALS } from '../../utils/modalManager.js';
import { primitiveTable } from '../../utils/primitiveTable.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { replaceClass } from '../sidepanel.js';
import { confirmationModal } from '../modals/confirmationModal.js'
import { showNoPrimitivesScreen, showPrimitivesTable } from '../screens/primitiveColor/primitiveColor.js';
import { semanticTable } from '../../utils/semanticTable.js';
import { fontTableManager } from '../../utils/fontsTableManager.js';
import { showFontsScreen, showNoFontsScreen } from '../screens/font/fontsManagement.js';

let fontModalElement = null;

let titleElement = null;

let fontNameInput = null;
let fontNameInputError = null;

let fontValueInput = null;
let fontValueInputError = null;

let deleteButton = null;
let actionButton = null;

class FontModal {
  constructor() {
    this.modal = null;
    this.listenersAdded = false;
    this.modes = {
      ADD: "add",
      EDIT: "edit"
    }
    this.currentMode = this.modes.ADD;
  }

  async show({ mode, fontId, currentFontName, currentFontValue }) {
    if (!this.modal){

      this.modal = await modalManager.register(MODALS.FONT);
    }
    this.setMode({ mode, currentFontName, currentFontValue });
    this.modal.show();

    if (this.listenersAdded) return;

    // ========== GLOBAL VARIABLES BEGIN ========== //

    fontModalElement = document.getElementById("font-modal");

    titleElement = document.getElementById("font-modal-title");
    
    fontNameInput = document.getElementById("font-modal-name-input");
    fontNameInputError = document.getElementById("font-modal-name-input-error");

    fontValueInput = document.getElementById("font-modal-value-input");
    fontValueInputError = document.getElementById("font-modal-value-input-error");

    deleteButton = document.getElementById("font-modal-delete-button");
    actionButton = document.getElementById("font-modal-action-button");

    // ========== GLOABL VARIABLE END ========== //

    // ========== EVENT LISTENERS BEGIN ========== //

    fontNameInput.addEventListener("input", () => {
      handleFontNameInputChange();
    });

    fontValueInput.addEventListener('input', () => {
      handleFontValueInputChange();
    });

    actionButton.addEventListener("click", async () => {
      handleActionButtonClick();
    });

    deleteButton.addEventListener("click", async () => {
      handleDeleteButtonClick();
    });

    document.getElementById("hide-font-modal").addEventListener("click", () => {
      this.modal.hide();
    });

    // ========== EVENT LISTENERS END ========== //

    this.listenersAdded = true;
    this.setMode({ mode, fontId, currentFontName, currentFontValue });

  }

  hide(){
    this.modal.hide();
  }

  restoreDeafaults(){

    this.enableActionButton(false);

    this.enableDeleteButton(false);

    fontNameInput.value = "";
    fontNameInputError.classList.toggle("hidden", true);
    fontNameInput.style.borderColor = "";

    fontValueInput.value = "";
    fontValueInputError.classList.toggle("hidden", true);
    fontValueInput.style.borderColor = "";
    
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

  setMode({mode, fontId, currentFontName, currentFontValue}){

    if (!this.listenersAdded) return console.log("[FONT MODAL] setMode: Listeners not added yet");
    
    this.restoreDeafaults();

    if (mode === this.modes.ADD) {

      this.currentMode = this.modes.ADD;

      titleElement.innerHTML = "Add New Font";
      actionButton.innerHTML = "Add new font";


    } else if (mode === this.modes.EDIT){

      this.currentMode = this.modes.EDIT;

      this.enableDeleteButton(true)

      titleElement.innerHTML = "Edit Font";
      actionButton.innerHTML = "Update";

      fontModalElement.setAttribute("fontName", currentFontName);
      fontModalElement.setAttribute("fontValue", currentFontValue);
      fontModalElement.setAttribute("fontId", fontId);

      fontNameInput.value = currentFontName;
      fontValueInput.value = currentFontValue;

    }
    
  }
}
const fontModal = new FontModal();

export { fontModal };

function handleFontNameInputChange(){

  fontModal.enableActionButton(false);

  const nameRegex = /^[a-zA-Z0-9_-]+$/;


  const fontName = fontModalElement.getAttribute("fontName");
  const inputValue = fontNameInput.value.trim();
  let errorMessage = "";

  if (!inputValue) {
    errorMessage = "Font name is required";
  } else if (cacheManager.fonts.isExist({ fontName: inputValue }) && fontName !== inputValue) {
    errorMessage = "Font already exist!";
  } else if (!nameRegex.test(inputValue)) {
    errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
  }
  
  if (errorMessage) {
    fontNameInputError.innerHTML = errorMessage;
    fontNameInputError.classList.remove("hidden");

    fontNameInput.style.borderColor = "red";

  } else {
    fontNameInputError.classList.add("hidden");
    fontNameInput.style.borderColor = "";
  }

  const hasNameError = !fontNameInputError.classList.contains("hidden");
  const hasValueError = !fontValueInputError.classList.contains("hidden");
  const valueFilled = inputValue === "" || fontValueInput.value.trim() === "";

  if (hasNameError || hasValueError || valueFilled) {
    fontModal.enableActionButton(false);
  } else {
    fontModal.enableActionButton(true);
  }

  if (fontName === inputValue) {
    replaceClass(actionButton, "bg-", "bg-gray-500");
    replaceClass(actionButton, "hover:bg-", "hover:bg-gray-600");
    actionButton.disabled = true;
  }
}

function handleFontValueInputChange(){

  fontModal.enableActionButton(false);

  const allowedCharsRegex = /^[a-zA-Z0-9._-]+$/;
  const fontFileRegex = /\.(ttf|otf)$/;

  const inputValue = fontValueInput.value.trim();
  let errorMessage = "";

  if (!inputValue) {
    errorMessage = "Font file name is required.";
  } else if (!allowedCharsRegex.test(inputValue)) {
    errorMessage = "Only letters, numbers, hyphens (-), underscores (_), and full stops (.) are allowed.";
  } else if (!fontFileRegex.test(inputValue)) {
    errorMessage = "Font file must end with .ttf or .otf.";
  }

  if (errorMessage) {
    fontValueInputError.innerHTML = errorMessage;
    fontValueInputError.classList.remove("hidden");

    fontValueInput.style.borderColor = "red";

  } else {
    fontValueInputError.classList.add("hidden");
    fontValueInput.style.borderColor = "";
  }

  const hasNameError = !fontNameInputError.classList.contains("hidden");
  const hasValueError = !fontValueInputError.classList.contains("hidden");
  const valueFilled = inputValue === "" || fontNameInput.value.trim() === "";

  if (hasNameError || hasValueError || valueFilled) {
    fontModal.enableActionButton(false);
  } else {
    fontModal.enableActionButton(true);
  }
}

async function handleDeleteButtonClick() {

  const fontId = fontModalElement.getAttribute("fontId");

  fontModal.hide();

  const confirmed = await confirmationModal.confirm({
    message: `Are you sure you want to delete ${cacheManager.fonts.getById({ fontId })} font?`,
  })

  if (confirmed) {
    try {
      await DatabaseManager.fonts.delete({ fontId });

      if(cacheManager.fonts.isEmpty()){
        showNoFontsScreen();
      }

      fontTableManager.deleteRow({ fontId });
      
    } catch (error) {
      console.error(error);
    }
  }
}

async function handleActionButtonClick() {
  if (fontModal.currentMode === fontModal.modes.ADD) {
    const fontName = fontNameInput.value.trim();
    const fontValue = fontValueInput.value.trim();

    try {
      const newFontData = {
        projectId: cacheManager.projects.activeProjectId,
        fontName,
        fontValue,
        orderIndex: fontTableManager.currentRowId
      };
      const fontId = await DatabaseManager.fonts.create(newFontData);

      fontTableManager.addRow({
        fontId,
        fontName: newFontData.fontName,
        fontValue: newFontData.fontValue,
        animation: true
      });

      fontModal.hide();

      showFontsScreen();
    } catch (error) {
      console.error("Error creating font:", error);
    }
  
  } else if (fontModal.currentMode === fontModal.modes.EDIT) {

    const fontId = fontModalElement.getAttribute("fontId");

    const oldFontName = fontModalElement.getAttribute("fontName");
    const oldFontValue = fontModalElement.getAttribute("fontValue");

    const newFontName  = fontNameInput.value.trim();
    const newFontValue = fontValueInput.value.trim();
    
    try {

      const updatedFields = {};

      if (newFontName !== oldFontName) {
        updatedFields.fontName = newFontName;
      }

      if (newFontValue !== oldFontValue) {
        updatedFields.fontValue = newFontValue;
      }
      
      await DatabaseManager.fonts.update({
        fontId: fontId,
        updatedFields: updatedFields
      });

      fontTableManager.updateRow({
        fontId,
        fontName: updatedFields.fontName,
        fontValue: updatedFields.fontValue
      });

      fontModal.hide();

    } catch (error) {
      console.log(error);
      
    }
  }
}


