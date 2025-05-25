import DatabaseModel from '../../../dist/DatabaseModelForWorker.js'

const dbModel = new DatabaseModel();

export async function handleSemanticsDataFetch(message) {

  const projectId = message.projectId;
  if (!projectId){
    console.log("[SEMANTIC COLORS HANDLER] projectId is required");
    return { success: false, error: "projectId is required" };
  }
  
  try {
    const semanticsColorsData =  await dbModel.db.semanticColors
      .where("projectId")
      .equals(projectId)
      .sortBy("orderIndex");


    const hasSemanticsData = semanticsColorsData.length > 0;

    if (hasSemanticsData) {
      console.info("[SEMANTIC COLORS HANDLER] Semantics fetched successfully:", semanticsColorsData.length);
      return { success: true, data: semanticsColorsData };
    } else {
      console.info("[SEMANTIC COLORS HANDLER] No semantic color data found for projectId:", projectId);
      return { success: false, error: "No semantic color data available" };
    }

  } catch (error) {
    console.log("[SEMANTIC COLORS HANDLER] Error getting semantics");
    return { success: false, error: "Error getting semantics" };
  }
}
