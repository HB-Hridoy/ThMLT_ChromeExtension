
  import DatabaseManager from '../../db/DatabaseManager.js';
  import { modalManager, MODALS } from '../../utils/modalManager.js';
  import { semanticTable } from '../../utils/semanticTable.js';
  import cacheManager from '../../utils/cache/cacheManager.js';
  import { replaceClass } from '../sidepanel.js';
  import { confirmationModal } from '../modals/confirmationModal.js'
  import { showNoPrimitivesScreen, showPrimitivesTable } from '../screens/primitiveColor/primitiveColor.js';
  import { showMessageModal } from './messageModal.js';
  import { addProjectCard } from '../screens/home/home.js';
  import { screenManager } from '../../utils/screenManager.js';
  let projectModalElement = null;

  let projectNameInput = null;
  let projectNameInputError = null;

  let actionButton = null;

  class ProjectModal{
    constructor(){
      this.modal = null;
      this.listenersAdded = false;
    }

    async show() {
      if (!this.modal){
  
        this.modal = await modalManager.register(MODALS.PROJECT);
      }
      this.modal.show();
      screenManager.bottomNavigationBar(false);
  
      if (this.listenersAdded) return;
  
      // ========== GLOBAL VARIABLES BEGIN ========== //
  
      projectModalElement = document.getElementById("project-modal");
      
      projectNameInput = document.getElementById("project-modal-name-input");
      projectNameInputError = document.getElementById("project-modal-name-input-error");
  
      actionButton = document.getElementById("project-modal-action-button");
  
      // ========== GLOABL VARIABLES END ========== //
  
      // ========== EVENT LISTENERS BEGIN ========== //
  
      projectNameInput.addEventListener("input", () => {
        handleProjectNameInputChange();
      });
  
      actionButton.addEventListener("click", async () => {
        handleActionButtonClick();
      });
  
      document.getElementById("hide-project-modal").addEventListener("click", () => {
        this.hide();
      });
  
      // ========== EVENT LISTENERS END ========== //
  
      this.listenersAdded = true;
    
    }
  
    hide(){
      this.restoreDeafaults();
      this.modal.hide();
      screenManager.bottomNavigationBar(true);
    }

    restoreDeafaults(){
    
      this.enableActionButton(false);
  
      projectNameInput.value = "";
      projectNameInputError.classList.toggle("hidden", true);
      projectNameInput.style.borderColor = "";
        
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
  }

  const projectModal = new ProjectModal();
  export { projectModal }

  function handleProjectNameInputChange() {
      
    projectModal.enableActionButton(false);
    
    const nameRegex = /^[a-zA-Z0-9_-]+$/;

    const inputValue = projectNameInput.value.trim();
    let errorMessage = "";

    if (!inputValue) {
      errorMessage = "Project name is required";
    } else if (cacheManager.projects.existProjectName(inputValue)) {
      errorMessage = "Project already exist!";
    } else if (!nameRegex.test(inputValue)) {
      errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
    }
    
    if (errorMessage) {
      projectNameInputError.innerHTML = errorMessage;
      projectNameInputError.classList.remove("hidden");

      projectNameInput.style.borderColor = "red";

      projectModal.enableActionButton(false);

    } else {
      projectNameInputError.classList.add("hidden");
      projectNameInput.style.borderColor = "";

      projectModal.enableActionButton(true);
    }
  }

  async function handleActionButtonClick(){

    const projectName = projectNameInput.value.trim();
    const author = document.getElementById("project-modal-author-input").value.trim();
    const version = document.getElementById("project-modal-version-input").value.trim();

    // Check if any input is empty
    if (!projectName || !author || !version) {

      projectModal.hide();
      showMessageModal({
        title: "Empty Inputs",
        message: "Please fill all the inputs"
      })
      return;
    } 

    try {
      const projectData = DatabaseManager.projects.create({
        projectName,
        author,
        version
      })

      addProjectCard({
        projectId: projectData.projectId,
        projectName: projectData.projectName,
        author: projectData.author,
        version: projectData.version,
        lastModified: projectData.lastModified
      });
    } catch (error) {
      alert(error); // Error message
      console.error(error); // Log the error message
    }
    

  }


