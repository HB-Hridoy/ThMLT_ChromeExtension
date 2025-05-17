

import cacheManager from "../../../utils/cache/cacheManager.js";
import DatabaseManager from "../../../db/DatabaseManager.js";
import { screenManager, COLOR_TABS } from "../../../utils/screenManager.js";
import { semanticTable } from "../../../utils/semanticTable.js";
import { themeModal } from "../../modals/themeModal.js";

let init = false;
let semanticTableScreen = null;
let noSemanticScreen = null;
let isSemanticDataInitialized = false;

export async function InitializeSemanticScreen() {

  await screenManager.loadTab(COLOR_TABS.SEMANTIC);

  if(!init){
    semanticTableScreen = document.getElementById("semantic-table-container");
    noSemanticScreen = document.getElementById("no-semantic-screen");

    document.querySelector(".add-theme-button").addEventListener('click', ()=>{
      themeModal.show(themeModal.modes.ADD);
    });
  }

  if (cacheManager.projects.activeProjectName !== document.getElementById("color-screen-project-name").innerText.trim()) {
    isSemanticDataInitialized = false;
  }

}

export async function populateSemanticData(){

  if (!isSemanticDataInitialized) {

    const semanticData = await DatabaseManager.semantics.getAll({
      projectId: cacheManager.projects.activeProjectId
    });

    semanticTable.deleteAllRows();
    semanticTable.deleteAllThemeColumns();

    const themes = cacheManager.semantics.theme().getAll();
      
    themes.forEach((theme) => {
      semanticTable.addThemeColumn({
        themeName: theme
      });
    });

    if (semanticData.length > 0) {

      semanticData.forEach((semantic) => {
        semanticTable.addRow({
          semanticId: semantic.semanticId,
          semanticName: semantic.semanticName,
          themeValues: semantic.themeValues,
          animation: true
        })
      });

      showSemanticTable();

    } else{
      showNoSemanticScreen();
    }
    
    isSemanticDataInitialized = true;
    
  }
  
}

export function showSemanticTable(){
  if(semanticTableScreen.classList.contains("hidden")) {
    semanticTableScreen.classList.remove("hidden");
    noSemanticScreen.classList.add("hidden");
  }
  
}

export function showNoSemanticScreen(){
  if (noSemanticScreen.classList.contains("hidden")){
    semanticTableScreen.classList.add("hidden");
    noSemanticScreen.classList.remove("hidden");
  }
  
}