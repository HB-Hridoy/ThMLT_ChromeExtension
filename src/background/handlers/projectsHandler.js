import { getServiceWorkerDBManager } from "../db/DatabaseManagerForWorker.js";

let db = null;

export async function handleProjectsDataFetch(message) {

  console.log("[PROJECT HANDLER] Getting all projects...");
  
  try {

    if (!db){
      db = await getServiceWorkerDBManager();
    }
    await db.ensureReady();

    const result = await db.projects
      .where("deleted")
      .equals(0)
      .toArray();

    // Sort in memory by lastModified (newest first)
    const sortedProjectsData = result.sort((a, b) => b.lastModified - a.lastModified);

    const hasprojectsData = sortedProjectsData.length > 0;

    if (hasprojectsData) {
      console.info("[PROJECT HANDLER] Projects fetched successfully:", sortedProjectsData.length);
      return { success: true, data: sortedProjectsData };
    } else {
      console.info("[PROJECT HANDLER] No projects available");
      return { success: false, error: "No projects available" };
    }

  } catch (error) {
    console.log("[PROJECT HANDLER] Error getting projects", error);
    return { success: false, error: "Error getting projects"};
  }
}
