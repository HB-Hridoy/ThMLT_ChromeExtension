import { getServiceWorkerDBManager } from "../db/DatabaseManagerForWorker.js";

let db = null;

export async function handleTypographyDataFetch(message) {

  const projectId = message.projectId;
  if (!projectId){
    console.log("[TYPOGRAPHY HANDLER] projectId is required");
    return { success: false, error: "projectId is required" };
  }
  
  try {

    if (!db){
      db = await getServiceWorkerDBManager();
    }
    await db.ensureReady();

    const typographyData =  await db.typography
      .where("projectId")
      .equals(projectId)
      .toArray();

    const hasTypographyData = typographyData.length > 0;

    if (hasTypographyData) {
      console.info("[TYPOGRAPHY HANDLER] Typography fetched successfully:", typographyData.length);
      return { success: true, data: typographyData };
    } else {
      console.info("[TYPOGRAPHY HANDLER] No typographyData found for projectId:", projectId);
      return { success: false, error: "No typographyData available" };
    }

  } catch (error) {
    console.log("[TYPOGRAPHY HANDLER] Error getting typography");
    return { success: false, error: "Error getting typography" + error };
  }
}
