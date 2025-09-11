
import { modalManager, MODALS } from '../../utils/modalManager.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { debounce, replaceClass } from '../sidepanel.js';
import { getDatabaseManager } from '../../db/DatabaseManager.js';
import { confirmationModal } from './confirmationModal.js';
import { typographyTableManager } from '../../utils/typographyTableManager.js';
import { showTypographyScreen, showNoTypographyScreen } from '../screens/typography/typographyManagement.js';
import { fontLinkModal } from './fontLinkModal.js';

let typographyModalElement = null;

let titleElement = null;

let typographyNameInput = null;
let typographyNameInputError = null;

export let linkedFontInput = null;
let linkedFontInputError = null;

let fontSizeInput = null;
let fontSizeInputDiscalimer  = null;
let fontSizeInputError = null;

let lineHeightInput = null;
let lineHeightInputDiscalimer  = null;
let lineHeightInputError = null;

let letterSpacingInput = null;
let letterSpacingInputDiscalimer  = null;
let letterSpacingInputError = null;

let deleteButton = null;
let actionButton = null;

class FontModal {
  constructor() {
    this.db = null;
    this.modal = null;
    this.listenersAdded = false;
    this.modes = {
      ADD: "add",
      EDIT: "edit"
    }
    this.currentMode = this.modes.ADD;
  }

  async show({ mode, typographyId, currentTypographyName, currentLinkedFont, currentFontSize, currentLineHeight, currentLetterSpacing }) {

    if (!this.db) {
      this.db = await getDatabaseManager();
    }

    if (!this.modal){
      this.modal = await modalManager.register(MODALS.TYPOGRAPHY);
      this.addEventListeners();
    }
    
    this.setMode({ mode, typographyId, currentTypographyName, currentLinkedFont, currentFontSize, currentLineHeight, currentLetterSpacing });
    this.modal.show();

  }

  hide(){
    this.modal.hide();
  }

  restoreDefaults() {
  this.enableActionButton(false);
  this.enableDeleteButton(false);

  const fields = [
    { input: typographyNameInput, error: typographyNameInputError },
    { input: linkedFontInput, error: linkedFontInputError },
    { input: fontSizeInput, error: fontSizeInputError, disclaimer: fontSizeInputDiscalimer, defaultValue: "12" },
    { input: lineHeightInput, error: lineHeightInputError, disclaimer: lineHeightInputDiscalimer, defaultValue: "0" },
    { input: letterSpacingInput, error: letterSpacingInputError, disclaimer: letterSpacingInputDiscalimer, defaultValue: "0" }
  ];

  fields.forEach(({ input, error, disclaimer, defaultValue }) => {
    if (input) input.value = defaultValue !== undefined ? defaultValue : "";
    if (error) error.classList.add("hidden");
    if (input) input.style.borderColor = "";
    if (disclaimer) disclaimer.classList.add("hidden");
  });
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

  setMode({ 
  mode, 
  typographyId, 
  currentTypographyName, 
  currentLinkedFont, 
  currentFontSize, 
  currentLineHeight, 
  currentLetterSpacing 
}) {
  if (!this.listenersAdded) {
    console.log("[Typography MODAL] setMode: Listeners not added yet");
    return;
  }

  this.restoreDefaults();

  if (mode === this.modes.ADD) {
    this.currentMode = this.modes.ADD;

    titleElement.innerHTML = "Create New Typography";
    actionButton.innerHTML = "Create";

  } else if (mode === this.modes.EDIT) {
    this.currentMode = this.modes.EDIT;

    this.enableDeleteButton(true);

    titleElement.innerHTML = "Edit Typography";
    actionButton.innerHTML = "Update";

    // Set modal attributes for metadata or debugging
    typographyModalElement.setAttribute("typographyId", typographyId);
    typographyModalElement.setAttribute("typographyName", currentTypographyName);
    typographyModalElement.setAttribute("linkedFont", currentLinkedFont);
    typographyModalElement.setAttribute("fontSize", currentFontSize);
    typographyModalElement.setAttribute("lineHeight", currentLineHeight);
    typographyModalElement.setAttribute("letterSpacing", currentLetterSpacing);

    linkedFontInput.setAttribute("linkedFontId", currentLinkedFont);

    // Populate input fields
    if (typographyNameInput) typographyNameInput.value = currentTypographyName || "";
    if (linkedFontInput) linkedFontInput.value = cacheManager.fonts.getName({ fontId: currentLinkedFont }) || "";
    if (fontSizeInput) fontSizeInput.value = currentFontSize || "12";
    if (lineHeightInput) lineHeightInput.value = currentLineHeight || "0";
    if (letterSpacingInput) letterSpacingInput.value = currentLetterSpacing || "0";
  }
}


  addEventListeners(){
    if (this.listenersAdded) return;

    // ========== GLOBAL VARIABLES BEGIN ========== //

    typographyModalElement = document.getElementById("typography-modal");

    titleElement = document.getElementById("typography-modal-title");
    
    typographyNameInput = document.getElementById("typography-modal-name-input");
    typographyNameInputError = document.getElementById("typography-modal-name-input-error");

    linkedFontInput = document.getElementById("typography-modal-linked-font-input");
    lineHeightInputError = document.getElementById("typography-modal-linked-font-input-error");

    fontSizeInput = document.getElementById("typography-modal-font-size-input");
    fontSizeInputDiscalimer = document.getElementById("typography-modal-font-size-input-discalimer");
    fontSizeInputError = document.getElementById("typography-modal-font-size-input-error");

    lineHeightInput = document.getElementById("typography-modal-line-height-input");
    lineHeightInputDiscalimer = document.getElementById("typography-modal-line-height-input-discalimer");
    lineHeightInputError = document.getElementById("typography-modal-line-height-input-error");

    letterSpacingInput = document.getElementById("typography-modal-letter-spacing-input");
    letterSpacingInputDiscalimer = document.getElementById("typography-modal-letter-spacing-input-discalimer");
    letterSpacingInputError = document.getElementById("typography-modal-letter-spacing-input-error");

    deleteButton = document.getElementById("typography-modal-delete-button");
    actionButton = document.getElementById("typography-modal-action-button");

    // ========== GLOABL VARIABLE END ========== //

    // ========== EVENT LISTENERS BEGIN ========== //

    typographyNameInput.addEventListener("input", () => {
      handleTypographyNameInputChange(typographyNameInput, typographyNameInputError);
    });

    linkedFontInput.addEventListener("input", () => {
      
      if (typographyModalElement.getAttribute("linkedFont") === lineHeightInput.getAttribute("linkedFontId")){
        this.enableActionButton(false);
      }
      checkModalInputErrors();
    });

    document.getElementById("typography-modal-linked-font-button").addEventListener('click', ()=>{
      fontLinkModal.show();
    });

    fontSizeInput.addEventListener("input", () => {
      handleNumberInputChange(fontSizeInput, fontSizeInputError, fontSizeInputDiscalimer);
    });

    lineHeightInput.addEventListener("input", () => {
      handleNumberInputChange(lineHeightInput, lineHeightInputError, lineHeightInputDiscalimer);
    });

    letterSpacingInput.addEventListener("input", () => {
      handleNumberInputChange(letterSpacingInput, letterSpacingInputError, letterSpacingInputDiscalimer);
    });

    actionButton.addEventListener("click", async () => {
      handleActionButtonClick();
    });

    deleteButton.addEventListener("click", async () => {
      handleDeleteButtonClick();
    });

    document.getElementById("hide-typography-modal").addEventListener("click", () => {
      this.modal.hide();
    });

    // ========== EVENT LISTENERS END ========== //

    this.listenersAdded = true;
  }
}
const typographyModal = new FontModal();

export { typographyModal };

function checkModalInputErrors() {
  const errorElements = [
    typographyNameInputError,
    linkedFontInputError,
    fontSizeInputError,
    lineHeightInputError,
    letterSpacingInputError
  ];

  const hasVisibleError = errorElements.some(el => el && el.style.visibility === 'visible');

  typographyModal.enableActionButton(!hasVisibleError);

  if (typographyNameInput.value.trim() === ""){
    typographyModal.enableActionButton(false);
    typographyNameInputError.textContent = "Typography name is required.";
    typographyNameInputError.classList.remove("hidden");
  } 
}


const handleNumberInputChange = debounce((input, errorElement, disclaimerElement) => {
  const value = input.value.trim();

  if (value === "") {
    // Show disclaimer, hide error
    if (disclaimerElement) disclaimerElement.classList.remove("hidden");
    if (errorElement) {
      errorElement.classList.add("hidden");
      errorElement.textContent = "";
    }
    input.style.borderColor = "";
  } else if (isNaN(value)) {
    // Show error, hide disclaimer
    if (disclaimerElement) disclaimerElement.classList.add("hidden");
    if (errorElement) {
      errorElement.textContent = "Please enter a valid number.";
      errorElement.classList.remove("hidden");
    }
    input.style.borderColor = "red";
  } else {
    // Valid number: hide both
    if (disclaimerElement) disclaimerElement.classList.add("hidden");
    if (errorElement) {
      errorElement.classList.add("hidden");
      errorElement.textContent = "";
    }
    input.style.borderColor = "";
  }

  checkModalInputErrors();
}, 300, { leading: true, trailing: true });


const handleTypographyNameInputChange = debounce((input, errorElement) => {

  const allowedCharsRegex = /^[a-zA-Z0-9._-]+$/;

  const currentTypographyName = typographyModalElement.getAttribute("typographyName");
  const inputValue = input.value.trim();
  let errorMessage = "";

  if (!inputValue) {
    errorMessage = "Typography name is required.";
  } else if (!allowedCharsRegex.test(inputValue)) {
    errorMessage = "Only letters, numbers, hyphens (-) and underscores (_) are allowed.";
  } else if (cacheManager.typography.isExist({ name: inputValue})){
    errorMessage = "Typography already exist"
  }

  if (errorMessage) {
    errorElement.textContent = errorMessage;
    errorElement.classList.remove("hidden");

    input.style.borderColor = "red";

  } else {
    errorElement.classList.add("hidden");
    input.style.borderColor = "";
  }

  checkModalInputErrors();

  if (currentTypographyName === inputValue) {
    typographyModal.enableActionButton(false);
  }
}, 300, { leading: true, trailing: true });


async function handleDeleteButtonClick() {

  const typographyId = typographyModalElement.getAttribute("typographyId");
  const typographyName = typographyModalElement.getAttribute("typographyName");

  typographyModal.hide();

  const confirmed = await confirmationModal.confirm({
    message: `Are you sure you want to delete ${typographyName} typography?`,
  })

  if (confirmed) {
    try {

      await typographyModal.db.typography.delete({ typographyId });

      if (cacheManager.typography.getAll().length === 0) {
        showNoTypographyScreen();
      }

      typographyTableManager.deleteRow({ typographyId })
      
    } catch (error) {
      console.error(error);
    }
  }
}

async function handleActionButtonClick() {
  const mode = typographyModal.currentMode;

  if (!mode) {
    console.warn("No mode set for typography modal.");
    return;
  }

  const projectId = cacheManager.projects.activeProjectId;

  const newTypographyName = typographyNameInput.value.trim();
  const newLinkedFont = linkedFontInput.getAttribute("linkedFontId") || "";
  const newFontSize = fontSizeInput.value.trim();
  const newLineHeight = lineHeightInput.value.trim();
  const newLetterSpacing = letterSpacingInput.value.trim();

  try {
    if (mode === typographyModal.modes.ADD) {
      const newTypography = {
        projectId,
        typographyName: newTypographyName,
        linkedFont: newLinkedFont,
        fontSize: newFontSize,
        lineHeight: newLineHeight,
        letterSpacing: newLetterSpacing,
        orderIndex: typographyTableManager.getNextOrderIndex()
      };

      const newTypographyId = await typographyModal.db.typography.create(newTypography);

      typographyTableManager.addRow({
        ...newTypography,
        typographyId: newTypographyId,
        animation: true
      });

      typographyModal.hide();
      showTypographyScreen();

    } else if (mode === typographyModal.modes.EDIT) {
      const typographyId = typographyModalElement.getAttribute("typographyId");

      const oldTypographyName = typographyModalElement.getAttribute("typographyName");
      const oldLinkedFont = typographyModalElement.getAttribute("linkedFont") || "";
      const oldFontSize = typographyModalElement.getAttribute("fontSize");
      const oldLineHeight = typographyModalElement.getAttribute("lineHeight");
      const oldLetterSpacing = typographyModalElement.getAttribute("letterSpacing");

      const changes = {};

      if (newTypographyName !== oldTypographyName) changes.typographyName = newTypographyName;
      if (newLinkedFont !== oldLinkedFont) changes.linkedFont = newLinkedFont;
      if (newFontSize !== oldFontSize) changes.fontSize = newFontSize;
      if (newLineHeight !== oldLineHeight) changes.lineHeight = newLineHeight;
      if (newLetterSpacing !== oldLetterSpacing) changes.letterSpacing = newLetterSpacing;

      if (Object.keys(changes).length === 0) {
        console.log("No changes detected.");
        typographyModal.hide();
        return;
      }

      await typographyModal.db.typography.update({
        typographyId,
        ...changes
      });

      typographyTableManager.updateRow({
        typographyId,
        ...changes
      });

      typographyModal.hide();
    }

  } catch (error) {
    console.error(`[Typography Modal] ${mode === 'ADD' ? 'Create' : 'Update'} failed:`, error);
  }
}



