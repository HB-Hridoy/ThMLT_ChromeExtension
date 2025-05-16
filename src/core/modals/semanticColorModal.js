  import DatabaseManager from '../../db/DatabaseManager.js';
  import { modalManager, MODALS } from '../../utils/modalManager.js';
  import { semanticTable } from '../../utils/semanticTable.js';
  import cacheManager from '../../utils/cache/cacheManager.js';
  import { replaceClass } from '../sidepanel.js';
  import { confirmationModal } from '../modals/confirmationModal.js'
  import { showNoPrimitivesScreen, showPrimitivesTable } from '../screens/primitiveColor/primitiveColor.js';
import { showNoSemanticScreen, showSemanticTable } from '../screens/semanticColor/semanticColor.js';
 
  let semanticModalElement = null;

  let titleElement = null;

  let semanticNameInput = null;
  let semanticNameInputError = null;

  let deleteButton = null;
  let actionButton = null;

  class SemanticModal{
    constructor(){
      this.modal = null;
      this.listenersAdded = false;
      this.modes = {
        ADD: "add",
        EDIT: "edit"
      }
      this.currentMode = this.modes.ADD;
      
    }

    async show(mode, editValues = { semanticId: 0, semanticName: "Unkonown" }) {
      if (!this.modal){
  
        this.modal = await modalManager.register(MODALS.SEMANTIC);
      }
      this.setMode(mode, editValues);
      this.modal.show();
  
      if (this.listenersAdded) return;
  
      // ========== GLOBAL VARIABLES BEGIN ========== //
  
      semanticModalElement = document.getElementById("semantic-modal");
  
      titleElement = document.getElementById("semantic-modal-title");
      
      semanticNameInput = document.getElementById("semantic-modal-name-input");
      semanticNameInputError = document.getElementById("semantic-modal-name-input-error");
  
      deleteButton = document.getElementById("semantic-modal-delete-button");
      actionButton = document.getElementById("semantic-modal-action-button");
  
      // ========== GLOABL VARIABLE END ========== //
  
      // ========== EVENT LISTENERS BEGIN ========== //
  
      semanticNameInput.addEventListener("input", () => {
        handleSemanticNameInputChange();
      });
  
      actionButton.addEventListener("click", async () => {
        handleActionButtonClick();
      });
  
      deleteButton.addEventListener("click", async () => {
        handleDeleteButtonClick();
      });
  
      document.getElementById("hide-semantic-modal").addEventListener("click", () => {
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
  
      semanticNameInput.value = "";
      semanticNameInputError.classList.toggle("hidden", true);
      semanticNameInput.style.borderColor = "";

      semanticModalElement.removeAttribute("semanticName");  
      semanticModalElement.removeAttribute("semanticId"); 
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
  
    setMode(mode, editValues = {semanticId: 0, semanticName: ""}){
  
      if (!this.listenersAdded) return console.log("[SEMANTIC MODAL] setMode: Listeners not added yet");
      
      this.restoreDeafaults();
  
      if (mode === this.modes.ADD) {
  
        this.currentMode = this.modes.ADD;
  
        titleElement.innerHTML = "Add New semantic";
        actionButton.innerHTML = "Add new semantic";
  
  
      } else if (mode === this.modes.EDIT){
  
        this.currentMode = this.modes.EDIT;
  
        this.enableDeleteButton(true)
  
        titleElement.innerHTML = "Edit Semantic";
        actionButton.innerHTML = "Update";
  
        const semanticName = editValues.semanticName;
        const semanticId = editValues.semanticId;
  
        semanticModalElement.setAttribute("semanticName", semanticName);
        semanticModalElement.setAttribute("semanticId", semanticId);
  
        semanticNameInput.value = semanticName;
      }
      
    }
  }

  const semanticModal = new SemanticModal();
  export {semanticModal};

  function handleSemanticNameInputChange() {
    
    semanticModal.enableActionButton(false);
    
    const nameRegex = /^[a-zA-Z0-9_-]+$/;

    const semanticName = semanticModalElement.getAttribute("semanticName");
    const inputValue = semanticNameInput.value.trim();
    let errorMessage = "";

    if (!inputValue) {
      errorMessage = "Semantic name is required";
    } else if (cacheManager.semantics.nameExists({ semanticName: inputValue }) && semanticName !== inputValue) {
      errorMessage = "Semantic name already exist!";
    } else if (!nameRegex.test(inputValue)) {
      errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
    }
    
    if (errorMessage) {
      semanticNameInputError.innerHTML = errorMessage;
      semanticNameInputError.classList.remove("hidden");

      semanticNameInput.style.borderColor = "red";

      semanticModal.enableActionButton(false);

    } else {
      semanticNameInputError.classList.add("hidden");
      semanticNameInput.style.borderColor = "";

      semanticModal.enableActionButton(true);

      
    }

    if (semanticName === inputValue) semanticModal.enableActionButton(false);
    
  }

  async function handleDeleteButtonClick() {
  
    const semanticId = semanticModalElement.getAttribute("semanticId");
  
    semanticModal.hide();
  
    const confirmed = await confirmationModal.confirm({
      message: `Are you sure you want to delete <p class="font-bold text-red-600"> ${cacheManager.semantics.getName({ semanticId })} </p> semantic color?`,
    })
  
    if (confirmed) {
      try {
        await DatabaseManager.semantics.delete({
          semanticId: semanticId
        });
        semanticTable.deleteRow({ 
          semanticId,
          animation: true
        });
  
        if(cacheManager.semantics.isEmpty()){
          showNoSemanticScreen();
        }
         
      } catch (error) {
        console.error(error);
      }
    }
  }
  
  async function handleActionButtonClick() {
    if (semanticModal.currentMode === semanticModal.modes.ADD) {
      const semanticName = semanticNameInput.value.trim();
  
      try {
        const newSemantic = {
          projectId: cacheManager.projects.activeProjectId,
          semanticName: semanticName,
          orderIndex: semanticTable.currentRowId
        };
        const semanticId = await DatabaseManager.semantics.create(newSemantic);

        semanticTable.addRow({
          semanticId,
          semanticName: newSemantic.semanticName,
          animation: true
        })
  
        semanticModal.hide();

        showSemanticTable();
  
      } catch (error) {
        console.error("Error creating primitive:", error);
        
      }
    
    } else if (semanticModal.currentMode === semanticModal.modes.EDIT) {
  
      const semanticId = semanticModalElement.getAttribute("semanticId");
  
      const oldSemanticName = semanticModalElement.getAttribute("semanticName");
  
      const newSemanticName  = semanticNameInput.value.trim();
      
      try {
  
        if (newSemanticName !== oldSemanticName) {
          await DatabaseManager.semantics.update({
            semanticId,
            newSemanticName
          });

          semanticTable.updateNameCell({
            semanticId,
            newSemanticName,
            animation: true
          })
        }
        semanticModal.hide();
  
      } catch (error) {
        console.log(error); 
      }
    }
  }