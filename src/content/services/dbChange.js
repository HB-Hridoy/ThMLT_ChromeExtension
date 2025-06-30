

import { contentScriptCache } from "../utils/cache/contentScriptCache.js";

export function handleDbChange({ table, type, data }) {
  const idFields = {
    translations: "translationId",
    primitiveColors: "primitiveId",
    semanticColors: "semanticId",
    fonts: "fontId",
    projects: "projectId",
    typography: "typographyId"
  };

  const cacheMap = {
    translations: contentScriptCache.translationCache,
    primitiveColors: contentScriptCache.primitiveCache,
    semanticColors: contentScriptCache.semanticCache,
    fonts: contentScriptCache.fontCache,
    projects: contentScriptCache.projectCache,
    typography: contentScriptCache.typographyCache
  };

  const idField = idFields[table];
  const cache = cacheMap[table];
  const id = data?.[idField];

  if (!cache || !id) return;

  switch (type) {
    case 1: // CREATE
      cache.add({ data });
      break;

    case 2: // UPDATE
      cache.update({ id, updates: data });
      break;

    case 3: // DELETE
      cache.delete({ id });
      break;

  }
}