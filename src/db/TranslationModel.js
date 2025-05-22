import cacheManager from "../utils/cache/cacheManager.js";
import DatabaseModel from "./DatabaseModel.js";

class TranslationModel extends DatabaseModel {
  constructor() {
    super();
    console.log("[DB] [INFO] TranslationModel initialized");
    this.table = this.db.translations;
  }

  // 1. Add new translation entry
  async add({ projectId, translationData }) {
    await this.table.add({ projectId, translationData });
    cacheManager.translations.add({ translationData });
  }

  // 2. Get all translations for a project
  async get({ projectId }) {
    const translationData = await this.table
                                      .where("projectId")
                                      .equals(projectId)
    cacheManager.translations.add({ translationData });

    return translationData;

  }

  // 3. Check if any translation exists for the given projectId
  async hasTranslationForProject({ projectId }) {
    const count = await this.table
      .where("projectId")
      .equals(projectId)
      .count();
    const hasTranslation =  count > 0;
    cacheManager.translations.hasTranslation({ hasTranslation });

    return hasTranslation;
  }

  // 4. Update translations for a project (updates all matching records)
  async update({ projectId, translationData }) {
    const updates = await this.table
      .where("projectId")
      .equals(projectId)
      .modify({ translationData });

    console.log(updates);
    
    return updates; // number of rows modified
  }

  // 5. Delete all translations for a project
  async delete({ projectId }) {
    return await this.table
      .where("projectId")
      .equals(projectId)
      .delete();
  }
}

export default TranslationModel;
