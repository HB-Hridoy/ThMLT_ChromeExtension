

import cacheManager from "../../../utils/cache/cacheManager.js";
import { screenManager, screens} from "../../../utils/screenManager.js";
import { confirmationModal } from "../../modals/confirmationModal.js";
import { addProjectCard, deleteProjectCard, showHomeScreen, updateProjectCard } from "../home/home.js";
import { replaceClass, setButtonState } from "../../sidepanel.js";
import sessionManager from "../../../utils/sessionManager.js";
import { getDatabaseManager } from "../../../db/DatabaseManager.js";
import { getTranslationFile, importTranslations, showProjectManagementScreen } from "../projectManagement/projectManagement.js";
import { showMessageModal } from "../../modals/messageModal.js";

let listenersAdded = false;

let projectSettingsTitle;

let homePage = null;
let detailsPage = null;
let duplicationPage = null;
let deletionPage = null;

let downloadColorsButton;
let copyColorsButton;

let downloadTypographyButton;
let copyTypographyButton;

let downloadsTranslationsButton;
let copyTranslationsButton;

let projectDetailsNameInput;
let projectDetailsNameInputError;
let projectDetailsAuthorInput;
let projectDetailsAuthorInputError;
let projectDetailsVersionInput;
let projectDetailsVersionInputError;

let projectDetailsUpdateButton;

let projectDuplicateInput;
let projectDuplicateInputError;

let projectDuplicateButton;

let projectDeleteButton;
let projectDeleteInput;

let db = null;

export async function showProjectSettingsScreen() {
  if (!db) {
    db = await getDatabaseManager();
  }
  try {
    await screenManager.switchScreen(screens.PROJECT_SETTINGS);

    await sessionManager.set(sessionManager.DATA.SCREEN, screens.PROJECT_SETTINGS.id);

    projectSettingsTitle = document.getElementById("project-name-settings-screen");
    projectSettingsTitle.textContent = cacheManager.projects.activeProjectName();

    restoreDefaults();
  } catch (error) {
  }
  

  if (listenersAdded) return;

  // ========== GLOBAL VARIABLE BEGIN ===========//

    // ** Project Settings Home ** //

  homePage = document.getElementById("project-settings-home-page");
  detailsPage = document.getElementById("project-settings-details-page");
  duplicationPage = document.getElementById("project-settings-duplication-page");
  deletionPage = document.getElementById("project-settings-deletion-page");

  downloadColorsButton = document.getElementById("download-colors");
  copyColorsButton = document.getElementById("copy-colors");

  downloadTypographyButton = document.getElementById("download-typography");
  copyTypographyButton = document.getElementById("copy-typography");

  downloadsTranslationsButton = document.getElementById("download-translations");
  copyTranslationsButton = document.getElementById("copy-translations");

  projectDuplicateButton = document.getElementById("duplicate-project-button");

    // ** Project Details ** //

  projectDeleteButton = document.getElementById("delete-project-button");
  projectDeleteInput = document.getElementById("delete-project-input");
  projectDetailsNameInput = document.getElementById("project-details-name-input");
  projectDetailsNameInputError = document.getElementById("project-details-name-input-error");

  projectDetailsAuthorInput = document.getElementById("project-details-author-input");
  projectDetailsAuthorInputError = document.getElementById("project-details-author-input-error");

  projectDetailsVersionInput = document.getElementById("project-details-version-input");
  projectDetailsVersionInputError = document.getElementById("project-details-version-input-error");

  projectDetailsUpdateButton = document.getElementById("project-details-action-button");

    // ** Project Duplication ** //

  projectDuplicateInput = document.getElementById("project-duplicate-name-input");
  projectDuplicateInputError = document.getElementById("project-duplicate-name-input-error");
  projectDuplicateButton = document.getElementById("project-duplicate-action-button");


  // ========== GLOBAL VARIABLE END ===========//

  // ========== EVENT LISTENERS BEGIN ===========//

  document.getElementById("project-settings-back-button").addEventListener("click", async function(){
    showProjectManagementScreen();
  });

  document.getElementById("general-project-duplication").addEventListener("click", function(){
    openPage(duplicationPage);
  });

  });
  



  downloadColorsButton.addEventListener("click", async ()=>{
    handleColorsDataDownload();
  });
  
  copyColorsButton.addEventListener("click", async ()=>{
    handleColorsDataCopy();
  });
  
  downloadTypographyButton.addEventListener("click", async ()=>{
    handleTypopgraphyDataDownload();
  });
  
  copyTypographyButton.addEventListener("click", async ()=>{
    handleTypopgraphyDataCopy();
  });
  
  downloadsTranslationsButton.addEventListener("click", async ()=>{
    handleTranslationsDataDownload();
  });
  
  copyTranslationsButton.addEventListener("click", async ()=>{
    handleTranslationsDataCopy();
  });
  
  
      // ** Project Details Event Listeners ** //

  projectDetailsNameInput.addEventListener("input", (e) => {
    handleProjectDetailsNameInputChange(e);
  });

  projectDetailsAuthorInput.addEventListener("input", (e) => {
    handleProjectDetailsAuthorInputChange(e);
  });

  projectDetailsVersionInput.addEventListener("input", (e) => {
    handleProjectDetailsVersionInputChange(e);
  });

  projectDetailsUpdateButton.addEventListener("click", async () => {
    handleProjectDetailsUpdateButton();
  });


  // ** Project Duplicate Event Listeners ** //
  
  projectDuplicateInput.addEventListener("input", (e) => {
    handleProjectDuplicateInput(e);

  });

  projectDuplicateButton.addEventListener("click", async () => {
    handleProjectDuplication(projectDuplicateInput.value.trim());
  });

  projectDeleteButton.addEventListener("click", async ()=>{
    handleProjectDeleteButton();
  });
  
  projectDeleteInput.addEventListener("input", (e)=>{
    handleProjectDeleteInputChange(e);
    
  });

  // ========== EVENT LISTENERS END ===========//

  listenersAdded = true;
}

function restoreDefaults() {



  projectDeleteInput.value = "";
  projectDeleteInput.style.borderColor = "";

  replaceClass(projectDeleteButton, "bg-", "bg-gray-500");
  replaceClass(projectDeleteButton, "hover:bg-", "hover:bg-gray-600");

  projectDeleteButton.disabled = true;

}

async function handleColorDataDownloadButton(){
  try {
    const colorData = await db.projects.exportColorData({
      projectId: cacheManager.projects.activeProjectId
    });

    // Trigger a download of the JSON file.
    const blob = new Blob([colorData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use the project name as the filename.
    a.download = `${cacheManager.projects.activeProjectName()}_colors.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[SETTINGS] Color data for ${cacheManager.projects.activeProjectName()} downloaded successfully`);
  
  } catch (err) {
    console.error("[SETTINGS] Failed to download Color Themes data", err);
  }
}

async function handleColorDataCopyButton(){
  try {
    const colorData = await db.projects.exportColorData({
      projectId: cacheManager.projects.activeProjectId
    });
    await navigator.clipboard.writeText(colorData);
} catch (err) {
    console.error("[SETTINGS] Clipboard copy failed", err);
}
}

async function handleFontDataDownloadButton(){
  try {
    const fontsData = await db.projects.exportFontData({
      projectId: cacheManager.projects.activeProjectId
    });

    // Trigger a download of the JSON file.
    const blob = new Blob([fontsData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use the project name as the filename.
    a.download = `${cacheManager.projects.activeProjectName()}_fonts.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    console.log(`[SETTINGS] Fonts data for ${cacheManager.projects.activeProjectName()} downloaded successfully`);
    
  } catch (err) {
      console.error("[SETTINGS] Failed to download Fonts data", err);
  }
}

async function handleFontDataCopyButton(){
  try {
    const fontsData = await db.projects.exportFontData({
      projectId: cacheManager.projects.activeProjectId
    });

    await navigator.clipboard.writeText(fontsData);
} catch (err) {
    console.error("[SETTINGS] Failed to copy fonts data to clipboard", err);
}
}

async function handleTranslationDataDownloadButton(){
  try {
    if (cacheManager.translations.hasTranslation()) {
      const translationData = await db.translations.get({
        projectId: cacheManager.projects.activeProjectId
      });

      delete translationData.translationId;

      // Trigger a download of the JSON file.
      const blob = new Blob([JSON.stringify(translationData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Use the project name as the filename.
      a.download = `${cacheManager.projects.activeProjectName()}_translations.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      console.log("[SETTINGS] [WARN] No translation data available for this project");
    }
  } catch (err) {
      console.error("[SETTINGS] Failed to download translations data", err);
  }
}

async function handleTranslationDataCopyButton(){
  try {
    
    if (cacheManager.translations.hasTranslation()) {
      const translationData = await db.translations.get({
        projectId: cacheManager.projects.activeProjectId
      });

      delete translationData.translationId;

      await navigator.clipboard.writeText(JSON.stringify(translationData, null, 2));
    } else {
      console.log("[SETTINGS] [WARN] No translation data available for this project");
    }
  } catch (err) {
      console.error("[SETTINGS] Failed to copy translations data to clipboard", err);
  }
}

async function handleProjectDuplicateButton() {
  const projectName = cacheManager.projects.activeProjectName();

  const confirmed = await confirmationModal.confirm({
    message: `Are you sure you want to duplicate the project "${projectName}"?`,
    confirmButtonText: "Yes, Duplicate"
  });

  if (confirmed) {
    try {
      const newProjectData = await db.projects.duplicateProject({
        projectId: cacheManager.projects.activeProjectId
      });

      console.log(newProjectData);
      
      
      addProjectCard({
        projectId: newProjectData.projectId,
        projectName: newProjectData.projectName,
        author: newProjectData.author,
        version: newProjectData.version,
        lastModified: newProjectData.lastModified
      });

      await showHomeScreen();
      sessionManager.clear();
      
    } catch (error) {
      console.error("[Settings] Error duplicating project:", error);
    }
  }

}

  const inputValue = e.target.value.trim();

  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  let errorMessage = "";
function openPage(pageElement) {
  const pages = [homePage, detailsPage, duplicationPage, deletionPage];

  // Hide all pages
  pages.forEach(page => {
    if (page) page.classList.add("hidden");
  });

  // Show the requested page
  if (pageElement) pageElement.classList.remove("hidden");
}

function handleProjectDetailsNameInputChange(e) {
  const inputValue = e.target.value.trim();

  if (inputValue.length < 3) {
    errorMessage = "Project name must be at least 3 characters long.";
  } else if (/^\d+$/.test(inputValue)) {
    errorMessage = "Project name cannot consist of only numbers.";
  } else if (cacheManager.projects.existProjectName(inputValue)) {
    errorMessage = "Project name already exists!";
  } else if (!nameRegex.test(inputValue)) {
    errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
  }

  if (errorMessage) {
    projectRenameInputError.innerHTML = errorMessage;
    projectRenameInputError.classList.remove("hidden");
    projectRenameInput.style.borderColor = "red";

    replaceClass(projectRenameButton, "bg-", "bg-gray-500");
    replaceClass(projectRenameButton, "hover:bg-", "hover:bg-gray-600");
    projectRenameButton.disabled = true;
  } else {
    projectRenameInputError.classList.add("hidden");
    projectRenameInput.style.borderColor = "";

    replaceClass(projectRenameButton, "bg-", "bg-blue-700");
    replaceClass(projectRenameButton, "hover:bg-", "hover:bg-blue-800");
    projectRenameButton.disabled = false;
  }

  if (!inputValue || inputValue === cacheManager.projects.activeProjectName()) {
    projectRenameInputError.classList.add("hidden");
    projectRenameInput.style.borderColor = "";
function handleProjectDuplicateInput() {
  const inputValue = projectDuplicateInput.value.trim();
  let errorMessage = "";

  if (inputValue.length < 3) {
    errorMessage = "Project name must be at least 3 characters long.";
  } else if (/^\d+$/.test(inputValue)) {
    errorMessage = "Project name cannot consist of only numbers.";
  } else if (cacheManager.projects.existProjectName(inputValue)) {
    errorMessage = "Project name already exists!";
  }

  if (errorMessage) {
    projectDuplicateInputError.textContent = errorMessage;
    projectDuplicateInputError.classList.remove("hidden");
    projectDuplicateInput.style.borderColor = "red";
    setButtonState(projectDuplicateButton, false);
  } else {
    projectDuplicateInputError.classList.add("hidden");
    projectDuplicateInput.style.borderColor = "";
    setButtonState(projectDuplicateButton, true);
  }
}

async function handleRenameProjectButton() {

  try {
    await db.projects.update({
      projectId: cacheManager.projects.activeProjectId,
      projectName: projectRenameInput.value.trim()
    });

    await showHomeScreen();
    sessionManager.clear();

    updateProjectCard({
      projectId: cacheManager.projects.activeProjectId,
      projectName: projectRenameInput.value.trim()
    });
  } catch (error) {
    console.error(error);
  }
  
}

async function handleProjectDeleteButton(){

  const projectName = cacheManager.projects.activeProjectName();

  const confirmed = await confirmationModal.confirm({
    message: `Are you sure you want to delete the project "${projectName}"?`,
    confirmButtonText: "Yes, Delete"
  });

  if (confirmed) {
    try {
      await db.projects.deleteProject({
        projectId: cacheManager.projects.activeProjectId
      })

      await showHomeScreen();
      sessionManager.clear();

      deleteProjectCard({
        projectId: cacheManager.projects.activeProjectId
      })
      
    } catch (error) {
      console.error("[Settings] Error deleting project:", error);
    }
  }
}

function handleProjectDeleteInputChange(e) {
  const inputValue = e.target.value.trim();
async function handleTypographyImport() {
  const confirmed = await confirmationModal.confirm({
    message: "Importing typography will overwrite the existing typography. Are you sure you want to continue?",
    confirmButtonText: "Yes, Import"
  });

  if (inputValue !== cacheManager.projects.activeProjectName()) {
    replaceClass(projectDeleteButton, "bg-", "bg-gray-500");
    replaceClass(projectDeleteButton, "hover:bg-","hover:bg-gray-600");
    projectDeleteButton.disabled = true;
  }else{
    replaceClass(projectDeleteButton, "bg-", "bg-red-700");
    replaceClass(projectDeleteButton, "hover:bg-", "hover:bg-red-800");
    projectDeleteButton.disabled = false;
  }
  if (!confirmed) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = ".json,application/json";
  input.onchange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const typographyData = await file.text();
      const result = await db.projects.importTypographyData({
        projectId: cacheManager.projects.activeProjectId,
        jsonData: typographyData
      });
      if (result.success) {
        showMessageModal({
          title: "Typography Import Successful",
          message: result.message
        });
        console.log("[SETTINGS] Typography imported successfully");
      } else {
        showMessageModal({
          title: "Typography Import Failed !!",
          message: result.errors.join("\n")
        });
        console.error("[SETTINGS] Typography import failed", result.errors);
      }
      
    } catch (err) {
      console.error("[SETTINGS] Failed to import typography", err);
    }
  };
  input.click();
}

async function handleTranslationsImport(){

      if (translationStatusImported.classList.contains("hidden")) {
        importTranslations();
      } else {
        
        const confirmed = await confirmationModal.confirm({
          message: "Importing translations will overwrite the existing translations. Are you sure you want to continue?",
          confirmButtonText: "Yes, Update"
        });

        if (confirmed) {
          importTranslations(true);
        }
      }

    }


