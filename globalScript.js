  let activeScreen = "home-screen";

  let activeTemplateName = "";

  let activeThemeModesInSemantic = [];
  let activeSemanticNames = [];
  let activeSemantics = new Map();

  let activePrimitiveNames = [];
  let activePrimitives = new Map();

  let currentPrimitiveRowId = 1;
  let currentSemanticRowId = 1;

  const nameRegex = /^[A-Za-z0-9-_]+$/;

  let oldPrimitiveInputValues = new Map();

  let semanticTableColumns = 2;

  const bottomNavBar = document.getElementById("bottom-nav-bar");
  
  document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('[data-nav-button-screen-target]');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.getAttribute("data-nav-button-screen-target");

            SwitchScreen(targetScreenId);
        });
    });

    
      
  });


  function SwitchScreen(screenName){
    const targetScreen = document.getElementById(screenName);
    
    document.getElementById(activeScreen).classList.replace("visible", "hidden");
    targetScreen.classList.replace("hidden", "visible");

    const activeIcon = document.getElementById(activeScreen + "-icon");
    const targetIcon = document.getElementById(screenName + "-icon");

    activeIcon.classList.replace("text-blue-600", "text-gray-500");
    targetIcon.classList.replace("text-gray-500", "text-blue-600");

    activeScreen = screenName;
  }

  function ShowAlert(alertId, meassage = "", duration = 5000) {
    const alert = document.getElementById(alertId+"-alert");
    const alertText = document.getElementById(alertId+"-alert-text");
    if (alert && alertText) {
      alertText.innerHTML = meassage;
      alert.classList.replace('hidden', 'flex'); // Show the alert
      if (duration > 0) {
        setTimeout(() => alert.classList.replace('flex', 'hidden'), duration); // Hide after duration
      }
    }
  }
  

  // Function to get the semantic name for a specific theme mode and semantic name
function GetSemanticValueForMode(themeMode, semanticName) {
  // Check if the theme mode exists in the map
  if (activeSemantics.has(themeMode)) {
    const semanticNames = activeSemantics.get(themeMode);

    // Check if the semantic name exists in the selected theme mode
    if (semanticNames.hasOwnProperty(semanticName)) {
      return semanticNames[semanticName];  // Return the linked primitive
    } else {
      console.error(`Error: Semantic name '${semanticName}' does not exist for theme mode '${themeMode}'.`);
    }
  } else {
    console.error(`Error: Theme mode '${themeMode}' does not exist.`);
  }
  return null;  // Return null if not found or error occurred
}

const cacheOperations = new CacheOperations();


class CacheOperations {
  constructor() {
      
  }

  GetAllThemeModes(){

  }

  DeleteThemeMode(themeMode){

  }

  IsThemeModeExist(themeMode){

  }

  GetAllSemanticNames(){
      return activeSemanticNames;
  }

  AddSemantic(semanticName, themeMode){

  }

  UpdateSemantic(semanticName, themeMode){

  }

  DeleteSemantic(semanticName, themeMode){

  }

  IsSemanticExist(){
    
  }

}