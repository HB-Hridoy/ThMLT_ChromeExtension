

import cacheManager from "../../../utils/cache/cacheManager.js";
import DatabaseManager from "../../../db/DatabaseManager.js";
import { primitiveTable } from "../../../utils/primitiveTable.js";
import { primitiveModal } from "../../modals/primitiveColorModal.js";
import { screenManager, screens, COLOR_TABS } from "../../../utils/screenManager.js";

let init = false;
let primitiveTableScreen = null;
let noPrimitiveScreen = null;
let isPrimitiveDataInitialized = false;

export async function InitializePrimitivesScreen() {

  await screenManager.loadTab(COLOR_TABS.PRIMITIVES);

  if(!init){
    primitiveTableScreen = document.getElementById("primitives-table");
    noPrimitiveScreen = document.getElementById("no-primitives-screen");
  }

  if (cacheManager.projects.activeProjectName() !== document.getElementById("color-screen-project-name").innerText.trim()) {
    isPrimitiveDataInitialized = false;
  }

}

export async function populatePrimitiveData(){

  if (!isPrimitiveDataInitialized) return console.log("[INFO] Semantic data already intialized");

  const primitiveData = await DatabaseManager.primitives.getAllByProject({
    projectId: cacheManager.projects.activeProjectId
  });

  primitiveTable.deleteAllRows();
  primitiveData.forEach((primitive) => {
    
    const { primitiveId, primitiveName, primitiveValue } = primitive;
    primitiveTable.addRow({ 
      primitiveId: primitiveId, 
      primitiveName: primitiveName, 
      primitiveValue: primitiveValue
    });

  });

  if (primitiveData.length === 0) {
    showNoPrimitivesScreen();
  } else {
    showPrimitivesTable();
  }

  isPrimitiveDataInitialized = true;
  
}

export function showPrimitivesTable(){
  if(primitiveTableScreen.classList.contains("hidden")) {
    primitiveTableScreen.classList.remove("hidden");
    noPrimitiveScreen.classList.add("hidden");
  }
  
}

export function showNoPrimitivesScreen(){
  if (noPrimitiveScreen.classList.contains("hidden")){
    primitiveTableScreen.classList.add("hidden");
    noPrimitiveScreen.classList.remove("hidden");
  }
  
}