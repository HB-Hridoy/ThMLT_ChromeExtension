import DatabaseModel from '../../../dist/DatabaseModelForWorker.js'

const dbModel = new DatabaseModel();

export async function handleTranslationsDataFetch(message) {
  const { projectId } = message;

  if (!projectId) {
    console.warn("[TRANSLATIONS HANDLER] projectId is required");
    return { success: false, error: "projectId is required" };
  }

  try {
    const translations = await dbModel.db.translations
      .where("projectId")
      .equals(projectId)
      .toArray();

    const hasTranslation = translations.length > 0;

    if (hasTranslation) {
      console.info("[TRANSLATIONS HANDLER] Translations fetched successfully:", translations.length);
      return { success: true, data: translations };
    } else {
      console.info("[TRANSLATIONS HANDLER] No translations found for projectId:", projectId);
      return { success: false, error: "No translations available" };
    }

  } catch (error) {
    console.error("[TRANSLATIONS HANDLER] Error fetching translations:", error);
    return { success: false, error: "Error fetching translations" };
  }
}

