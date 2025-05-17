import DatabaseManager from '../../db/DatabaseManager.js';
import { modalManager, MODALS } from '../../utils/modalManager.js';
import { semanticTable } from '../../utils/semanticTable.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { replaceClass } from '../sidepanel.js';
import { confirmationModal } from '../modals/confirmationModal.js'
import { showNoPrimitivesScreen, showPrimitivesTable } from '../screens/primitiveColor/primitiveColor.js';
import { showNoSemanticScreen, showSemanticTable } from '../screens/semanticColor/semanticColor.js';

let themeModalElement = null;

let titleElement = null;

let themeNameInput = null;
let themeNameInputError = null;

let defaultThemeCheckbox = null;
let defaultThemeCheckboxContainer = null;

let deleteButton = null;
let actionButton = null;

class ThemeModal{
  constructor(){
    this.modal = null;
    this.listenersAdded = false;
    this.modes = {
      ADD: "add",
      EDIT: "edit"
    }
    this.currentMode = this.modes.ADD;
    
  }

  async show(mode, editValues = { themeName: "Unkonown" }) {
    if (!this.modal){

      this.modal = await modalManager.register(MODALS.THEME);
    }
    this.setMode(mode, editValues);
    this.modal.show();

    if (this.listenersAdded) return;

    // ========== GLOBAL VARIABLES BEGIN ========== //

    themeModalElement = document.getElementById("theme-modal");

    titleElement = document.getElementById("theme-modal-title");
    
    themeNameInput = document.getElementById("theme-modal-theme-name-input");
    themeNameInputError = document.getElementById("theme-modal-theme-name-input-error");

    defaultThemeCheckbox = document.getElementById("theme-modal-default-theme-checkbox");
    defaultThemeCheckboxContainer = document.getElementById("theme-modal-default-theme-checkbox-container");

    deleteButton = document.getElementById("theme-modal-delete-button");
    actionButton = document.getElementById("theme-modal-action-button");

    // ========== GLOABL VARIABLE END ========== //

    // ========== EVENT LISTENERS BEGIN ========== //

    themeNameInput.addEventListener("input", () => {
      handleThemeNameInputChange();
    });

    actionButton.addEventListener("click", async () => {
      handleActionButtonClick();
    });

    deleteButton.addEventListener("click", async () => {
      handleDeleteButtonClick();
    });

    defaultThemeCheckbox.addEventListener("change", () => {
      if (defaultThemeCheckbox.checked) {
        this.enableActionButton(true);
      } else {
        const nameRegex = /^[a-zA-Z0-9_-]+$/;

        const themeName = themeModalElement.getAttribute("themeName");
        const inputValue = themeNameInput.value.trim();
        let hasError = false;

        if (!inputValue) {
          hasError = true;
        } 
        
        if (cacheManager.semantics.theme().exist({ themeName: inputValue }) && themeName === inputValue) {
          hasError = true;
        } 
        
        if (!nameRegex.test(inputValue)) {
          hasError = true
        }

        console.log(hasError);
        console.log(themeName);
        console.log(inputValue);
        
        
        

        if (hasError) {
          this.enableActionButton(false);
          
        }
      }
    });

    document.getElementById("hide-theme-modal").addEventListener("click", () => {
      this.modal.hide();
    });

    // ========== EVENT LISTENERS END ========== //

    this.listenersAdded = true;
    this.setMode(mode, editValues);
  
  }

  hide(){
    this.modal.hide();
  }

  restoreDeafaults(){
  
    this.enableActionButton(false);

    this.enableDeleteButton(false);

    themeNameInput.value = "";
    themeNameInputError.classList.toggle("hidden", true);
    themeNameInput.style.borderColor = "";

    defaultThemeCheckbox.checked = false;
    defaultThemeCheckboxContainer.classList.toggle("hidden", true);

    themeModalElement.removeAttribute("themeName"); 
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

  setMode(mode, editValues = {themeName: ""}){

    if (!this.listenersAdded) return console.log("[THEME MODAL] setMode: Listeners not added yet");
    
    this.restoreDeafaults();

    if (mode === this.modes.ADD) {

      this.currentMode = this.modes.ADD;

      titleElement.innerHTML = "Add New theme";
      actionButton.innerHTML = "Add new theme";

      defaultThemeCheckboxContainer.classList.toggle("hidden", true);

    } else if (mode === this.modes.EDIT){

      this.currentMode = this.modes.EDIT;

      this.enableDeleteButton(true)

      titleElement.innerHTML = "Edit Theme";
      actionButton.innerHTML = "Update";

      const themeName = editValues.themeName;

      themeModalElement.setAttribute("themeName", themeName);

      themeNameInput.value = themeName;

      defaultThemeCheckboxContainer.classList.toggle("hidden", false);
    }
    
  }
}

const themeModal = new ThemeModal();
export {themeModal};

function handleThemeNameInputChange() {
  
  themeModal.enableActionButton(false);
  
  const nameRegex = /^[a-zA-Z0-9_-]+$/;

  const themeName = themeModalElement.getAttribute("themeName");
  const inputValue = themeNameInput.value.trim();
  let errorMessage = "";

  if (!inputValue) {
    errorMessage = "Theme name is required";
  } else if (cacheManager.semantics.theme().exist({ themeName: inputValue }) && themeName !== inputValue) {
    errorMessage = "Theme already exist!";
  } else if (!nameRegex.test(inputValue)) {
    errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
  }
  
  if (errorMessage) {
    themeNameInputError.innerHTML = errorMessage;
    themeNameInputError.classList.remove("hidden");

    themeNameInput.style.borderColor = "red";

    themeModal.enableActionButton(false);

  } else {
    themeNameInputError.classList.add("hidden");
    themeNameInput.style.borderColor = "";

    themeModal.enableActionButton(true);
  }

  if (themeName === inputValue) themeModal.enableActionButton(false);
  
}

async function handleDeleteButtonClick() {

  const themeName = themeModalElement.getAttribute("themeName");

  themeModal.hide();

  const confirmed = await confirmationModal.confirm({
    message: `Are you sure you want to delete <p class="font-bold text-red-600"> ${themeName} </p> theme?`,
  })

  if (confirmed) {
    try {
      await DatabaseManager.semantics.deleteTheme({
        projectId: cacheManager.projects.activeProjectId,
        theme: themeName
      })
      
      semanticTable.deleteThemeColumn({ 
        theme: themeName,
        animation: true
      });
       
    } catch (error) {
      console.error(error);
    }
  }
}

async function handleActionButtonClick() {
  if (themeModal.currentMode === themeModal.modes.ADD) {
    const themeName = themeNameInput.value.trim();

    try {
      await DatabaseManager.semantics.addTheme({
        projectId: cacheManager.projects.activeProjectId,
        theme: themeName
      });

      semanticTable.addThemeColumn({ 
        themeName,
        animation: true
      })

      themeModal.hide();

      showSemanticTable();

    } catch (error) {
      console.error("Error creating primitive:", error);
      
    }
  
  } else if (themeModal.currentMode === themeModal.modes.EDIT) {

    const themeName = themeModalElement.getAttribute("themeName");

    const oldThemeName = themeModalElement.getAttribute("themeName");

    const newThemeName  = themeNameInput.value.trim();
    
    try {

      if (newThemeName !== oldThemeName) {
        await DatabaseManager.semantics.renameTheme({
          projectId: cacheManager.projects.activeProjectId,
          oldTheme: oldThemeName,
          newTheme: newThemeName
        });

        semanticTable.renameThemeColumn({
          oldThemeName,
          newThemeName,
          animation: true
        });
      }

      if (defaultThemeCheckbox.checked) {
        await DatabaseManager.projects.setDefaultThemeMode({
          projectId: cacheManager.projects.activeProjectId,
          themeMode: newThemeName !== oldThemeName ? newThemeName : oldThemeName
        });

        semanticTable.setDefaultThemeMode({ themeName: newThemeName !== oldThemeName ? newThemeName : oldThemeName});
      }
      themeModal.hide();

    } catch (error) {
      console.log(error); 
    }
  }
}