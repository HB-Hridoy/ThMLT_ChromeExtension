import { getServiceWorkerDBManager } from "../db/DatabaseManagerForWorker.js";

let db = null;

export async function handlePrimitivesDataFetch(message) {

  const projectId = message.projectId;
  if (!projectId){
    console.log("[PRIMITIVE COLORS HANDLER] projectId is required");
    return { success: false, error: "projectId is required" };
  }
  
  try {

    if (!db){
      db = await getServiceWorkerDBManager();
    }
    await db.ensureReady();

    const primitiveColorsData =  await db.primitiveColors
                              .where("projectId")
                              .equals(projectId)
                              .sortBy("orderIndex");

    const hasPrimitivesData = primitiveColorsData.length > 0;

    if (hasPrimitivesData) {
      console.info("[PRIMITIVE COLORS HANDLER] Primitives fetched successfully:", primitiveColorsData.length);
      return { success: true, data: primitiveColorsData };
    } else {
      console.info("[PRIMITIVE COLORS HANDLER] No primitive color data found for projectId:", projectId);
      return { success: false, error: "No primitive color data available" };
    }

  } catch (error) {
    console.log("[PRIMITIVE COLORS HANDLER] Error getting primitives");
    return { success: false, error: "Error getting primitives" };
  }
}
