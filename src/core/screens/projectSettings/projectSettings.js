

import cacheManager from "../../../utils/cache/cacheManager.js";
import DatabaseManager from "../../../db/DatabaseManager.js";
import { screenManager, screens} from "../../../utils/screenManager.js";
import { confirmationModal } from "../../modals/confirmationModal.js";
import { addProjectCard, deleteProjectCard, showHomeScreen, updateProjectCard } from "../home/home.js";
import { replaceClass } from "../../sidepanel.js";

let listenersAdded = false;

let projectSettingsTitle;

let colorThemesDataDownloadButton;
let colorThemesDataCopyButton;

let fontsDataDownloadButton;
let fontsDataCopyButton;

let translationDataDownloadButton;
let translationDataCopyButton;

let projectDuplicateButton;

let projectRenameButton;
let projectRenameInput;
let projectRenameInputError;

let projectDeleteButton;
let projectDeleteInput;

export async function showProjectSettingsScreen() {
  try {
    await screenManager.switchScreen(screens.PROJECT_SETTINGS);

    projectSettingsTitle = document.getElementById("project-name-settings-screen");
    projectSettingsTitle.textContent = cacheManager.projects.activeProjectName();

    restoreDefaults();
  } catch (error) {
  }
  

  if (listenersAdded) return;

  // ========== GLOBAL VARIABLE BEGIN ===========//

  colorThemesDataDownloadButton = document.getElementById("project-data-download-button");
  colorThemesDataCopyButton = document.getElementById("project-data-copy-button");

  fontsDataDownloadButton = document.getElementById("fonts-data-download-button");
  fontsDataCopyButton = document.getElementById("fonts-data-copy-button");

  translationDataDownloadButton = document.getElementById("translation-data-download-button");
  translationDataCopyButton = document.getElementById("translation-data-copy-button");

  projectDuplicateButton = document.getElementById("duplicate-project-button");

  projectRenameButton = document.getElementById("rename-project-button");
  projectRenameInput = document.getElementById("rename-project-input");
  projectRenameInputError = document.getElementById("rename-project-input-error");

  projectDeleteButton = document.getElementById("delete-project-button");
  projectDeleteInput = document.getElementById("delete-project-input");

  // ========== GLOBAL VARIABLE END ===========//

  // ========== EVENT LISTENERS BEGIN ===========//

  document.getElementById("project-settings-back-button").addEventListener("click", async function(){
    await screenManager.switchScreen(screens.HOME);
    screenManager.bottomNavigationBar(true);
  });

  colorThemesDataDownloadButton.addEventListener("click", async ()=>{
    handleColorDataDownloadButton();
  });
  
  colorThemesDataCopyButton.addEventListener("click", async ()=>{
    handleColorDataCopyButton();
  });
  
  fontsDataDownloadButton.addEventListener("click", async ()=>{
    handleFontDataDownloadButton();
  });
  
  fontsDataCopyButton.addEventListener("click", async ()=>{
    handleFontDataCopyButton();
  });
  
  translationDataDownloadButton.addEventListener("click", async ()=>{
    handleTranslationDataDownloadButton();
  });
  
  translationDataCopyButton.addEventListener("click", async ()=>{
    handleTranslationDataCopyButton();
  });

  projectDuplicateButton.addEventListener("click", async () => {
    handleProjectDuplicateButton();
  });

  projectRenameInput.addEventListener("input", (e)=> {
    handleProjectRenameInputChange(e);
  });
  
  projectRenameButton.addEventListener("click", async ()=>{
    handleRenameProjectButton();
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
  projectRenameInput.value = cacheManager.projects.activeProjectName();
  projectRenameInput.style.borderColor = "";
  projectRenameInputError.classList.add("hidden");

  replaceClass(projectRenameButton, "bg-", "bg-gray-500");
  replaceClass(projectRenameButton, "hover:bg-", "hover:bg-gray-600");

  projectRenameButton.disabled = true;  

  projectDeleteInput.value = "";
  projectDeleteInput.style.borderColor = "";

  replaceClass(projectDeleteButton, "bg-", "bg-gray-500");
  replaceClass(projectDeleteButton, "hover:bg-", "hover:bg-gray-600");

  projectDeleteButton.disabled = true;

}

async function handleColorDataDownloadButton(){
  try {
    const colorData = await DatabaseManager.projects.exportColorData({
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
    const colorData = await DatabaseManager.projects.exportColorData({
      projectId: cacheManager.projects.activeProjectId
    });
    await navigator.clipboard.writeText(colorData);
} catch (err) {
    console.error("[SETTINGS] Clipboard copy failed", err);
}
}

async function handleFontDataDownloadButton(){
  try {
    const fontsData = await DatabaseManager.projects.exportFontData({
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
    const fontsData = await DatabaseManager.projects.exportFontData({
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
      const translationData = await DatabaseManager.translations.get({
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
      const translationData = await DatabaseManager.translations.get({
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
      const newProjectData = await DatabaseManager.projects.duplicateProject({
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

async function handleProjectRenameInputChange(e) {
  const inputValue = e.target.value.trim();

  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  let errorMessage = "";

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

    replaceClass(projectRenameButton, "bg-", "bg-gray-500");
    replaceClass(projectRenameButton, "hover:bg-", "hover:bg-gray-600");
    projectRenameButton.disabled = true;
  }
}

async function handleRenameProjectButton() {

  try {
    await DatabaseManager.projects.update({
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
      await DatabaseManager.projects.deleteProject({
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

  if (inputValue !== cacheManager.projects.activeProjectName()) {
    replaceClass(projectDeleteButton, "bg-", "bg-gray-500");
    replaceClass(projectDeleteButton, "hover:bg-","hover:bg-gray-600");
    projectDeleteButton.disabled = true;
  }else{
    replaceClass(projectDeleteButton, "bg-", "bg-red-700");
    replaceClass(projectDeleteButton, "hover:bg-", "hover:bg-red-800");
    projectDeleteButton.disabled = false;
  }
}

