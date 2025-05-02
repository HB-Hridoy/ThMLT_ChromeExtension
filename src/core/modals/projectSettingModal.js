const projectSettingsTitle = document.getElementById("project-name-settings-screen");

const colorThemesDataDownloadButton = document.getElementById("project-data-download-button");
const colorThemesDataCopyButton = document.getElementById("project-data-copy-button");

const fontsDataDownloadButton = document.getElementById("fonts-data-download-button");
const fontsDataCopyButton = document.getElementById("fonts-data-copy-button");

const translationDataDownloadButton = document.getElementById("translation-data-download-button");
const translationDataCopyButton = document.getElementById("translation-data-copy-button");

const projectDuplicateButton = document.getElementById("duplicate-project-button");

const projectDeleteButton = document.getElementById("delete-project-button");
const projectDeleteInput = document.getElementById("delete-project-input");
  

  document.getElementById("open-project-settings").addEventListener("click", function(){
    const projectName = CacheOperations.activeProject;

    projectSettingsTitle.innerText = projectName;
    projectDeleteInput.value = "";

    ScreenManager.showProjecSettingsScreen();
  });

  document.getElementById("ps-back-button").addEventListener("click", function(){
    ScreenManager.showProjectManagementScreen();
  });

colorThemesDataDownloadButton.addEventListener("click", async ()=>{
  try {
    const colorThemesData = await getColorThemesData(CacheOperations.activeProject);

    // Trigger a download of the JSON file.
    const blob = new Blob([colorThemesData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use the project name as the filename.
    a.download = `${CacheOperations.activeProject}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (err) {
      AlertManager.error("Failed to download Color Themes data", 1700);
      console.error("Failed to download Color Themes data", err);
  }
});

colorThemesDataCopyButton.addEventListener("click", async ()=>{

  try {
      const colorThemesData = await getColorThemesData(CacheOperations.activeProject);
      await navigator.clipboard.writeText(colorThemesData);
      AlertManager.success("Project data copied to clipboard", 1700);
  } catch (err) {
      AlertManager.error("Failed to copy project data to clipboard", 1700);
      console.error("Clipboard copy failed", err);
  }
});

fontsDataDownloadButton.addEventListener("click", async ()=>{
  try {
    const fontsData = await getFontsData(CacheOperations.activeProject);

    // Trigger a download of the JSON file.
    const blob = new Blob([fontsData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use the project name as the filename.
    a.download = `${CacheOperations.activeProject}_fonts.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
  } catch (err) {
      AlertManager.error("Failed to download Fonts data", 1700);
      console.error("Failed to download Fonts data", err);
  }
});

fontsDataCopyButton.addEventListener("click", async ()=>{

  try {
      const fontsData = await getFontsData(CacheOperations.activeProject);
      await navigator.clipboard.writeText(fontsData);
      AlertManager.success("Fonts data copied to clipboard", 1700);
  } catch (err) {
      AlertManager.error("Failed to copy fonts data to clipboard", 1700);
      console.error("Failed to copy fonts data to clipboard", err);
  }
});

translationDataDownloadButton.addEventListener("click", async ()=>{
  try {
    const isDataAvailable = await isTranslationDataAvailable(CacheOperations.activeProject);
    if (isDataAvailable) {
      const translationData = await getTranslationData(CacheOperations.activeProject);

      // Trigger a download of the JSON file.
      const blob = new Blob([JSON.stringify(translationData, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      // Use the project name as the filename.
      a.download = `${CacheOperations.activeProject}_translations.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      AlertManager.error("No translation data available for this project", 1700);
    }
  } catch (err) {
      AlertManager.error("Failed to download translations data", 1700);
      console.error("Failed to download translations data", err);
  }
});

translationDataCopyButton.addEventListener("click", async ()=>{

  try {
    const isDataAvailable = await isTranslationDataAvailable(CacheOperations.activeProject);
    if (isDataAvailable) {
      const translationData = await getTranslationData(CacheOperations.activeProject);

      await navigator.clipboard.writeText(JSON.stringify(translationData, null, 2));
      AlertManager.success("Translations data copied to clipboard", 1700);
    } else {
      AlertManager.error("No translation data available for this project", 1700);
    }
  } catch (err) {
      AlertManager.error("Failed to copy translations data to clipboard", 1700);
      console.error("Failed to copy translations data to clipboard", err);
  }
});

projectDuplicateButton.addEventListener("click", async () => {
  const projectName = CacheOperations.activeProject;

  openConfirmation(`Are you sure you want to duplicate the project "${projectName}"?`, async () => {

    try {
      const newProjectName = await duplicateProject(projectName);
      projectsContainer.insertAdjacentHTML("beforeend", CreateElement.projectTemplate(newProjectName, "Author", "Version"));
      AlertManager.success("Project duplicated successfully.", 1200);
      console.log("Project duplicated successfully.");

      ScreenManager.showHomeScreen();
      
    } catch (error) {
      console.error("Error duplicating project:", error);
      AlertManager.error("Error duplicating project. Please check the logs.");
    }

  }, "Yes, Duplicate");
});

projectDeleteButton.addEventListener("click", async ()=>{

  const projectName = CacheOperations.activeProject;

  if (projectDeleteInput.value.trim() === projectName) {

    openConfirmation(`Are you sure you want to delete the project "${projectName}"?`, async () => {

      try {
        await deleteProject(projectName);

        const projectElement = document.querySelector(`div[project-id="${projectName}"]`);
        if (projectElement) {
          projectElement.remove();
        }
        const projectsContainer = document.getElementById("projects-container");
        if (projectsContainer.children.length === 0) { 
          ScreenManager.showNoProjectScreen();
        } else {
          ScreenManager.showProjectsScreen();
        }
        ScreenManager.showHomeScreen();
      } catch (error) {
        console.log(error);
      }

    }, "Yes, Delete");
    
  }
});

projectDeleteInput.addEventListener("input", (e)=>{
  const inputValue = e.target.value.trim();

  if (inputValue !== CacheOperations.activeProject) {
  projectDeleteButton.classList.replace("bg-red-700", "bg-gray-700");
  projectDeleteButton.classList.replace("hover:bg-red-800", "hover:bg-gray-800");
  }else{
  projectDeleteButton.classList.replace("bg-gray-700", "bg-red-700");
  projectDeleteButton.classList.replace("hover:bg-gray-800", "hover:bg-red-800");
  }
  
});
