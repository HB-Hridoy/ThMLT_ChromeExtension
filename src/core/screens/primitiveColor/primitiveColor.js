
import cacheManager from "../../../utils/cache/cacheManager.js";
import { primitiveTable } from "../../../utils/primitiveTable.js";
import { screenManager, COLOR_TABS } from "../../../utils/screenManager.js";
import { getDatabaseManager } from "../../../db/DatabaseManager.js";

let init = false;
let primitiveTableScreen = null;
let noPrimitiveScreen = null;
let isPrimitiveDataInitialized = false;

let db = null;

export async function InitializePrimitivesScreen() {

  await primitiveTable.init();

  if (!db) {
    db = await getDatabaseManager();
    console.log(db);
    
  }

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

  if (isPrimitiveDataInitialized) return console.log("[INFO] Semantic data already intialized");

  const primitiveData = await db.primitives.getAllByProject({
    projectId: cacheManager.projects.activeProjectId
  });

  primitiveTable.deleteAllRows();
  primitiveData.forEach((primitive) => {
    
    const { primitiveId, primitiveName, primitiveValue, orderIndex } = primitive;
    primitiveTable.addRow({ 
      primitiveId: primitiveId, 
      primitiveName: primitiveName, 
      primitiveValue: primitiveValue,
      orderIndex
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