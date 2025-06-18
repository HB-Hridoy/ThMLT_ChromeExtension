import { getServiceWorkerDBManager } from "../db/DatabaseManagerForWorker.js";

let db = null;

export async function handleFontsDataFetch(message) {

  const projectId = message.projectId;
  if (!projectId){
    console.log("[FONT HANDLER] projectId is required");
    return { success: false, error: "projectId is required" };
  }
  
  try {

    if (!db){
      db = await getServiceWorkerDBManager();
    }
    await db.ensureReady();

    const fontsData =  await db.fonts
      .where("projectId")
      .equals(projectId)
      .toArray();

    const hasFontsData = fontsData.length > 0;

    if (hasFontsData) {
      console.info("[FONTS HANDLER] Fonts fetched successfully:", fontsData.length);
      return { success: true, data: fontsData };
    } else {
      console.info("[FONTS HANDLER] No fontsData found for projectId:", projectId);
      return { success: false, error: "No fontsData available" };
    }

  } catch (error) {
    console.log("[FONT HANDLER] Error getting fonts");
    return { success: false, error: "Error getting fonts" };
  }
}
