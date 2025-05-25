import DatabaseModel from '../../../dist/DatabaseModelForWorker.js'

const dbModel = new DatabaseModel();

export async function handleProjectsDataFetch(message) {

  console.log("[PROJECT HANDLER] Getting all projects...");
  
  try {
    const result = await dbModel.db.projects
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
      console.info("[PROJECT HANDLER] No projects data found for projectId:", projectId);
      return { success: false, error: "No projects data available" };
    }

  } catch (error) {
    console.log("[PROJECT HANDLER] Error getting projects");
    return { success: false, error: "Error getting projects"};
  }
}
