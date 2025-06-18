const ThMLT_DB_Schema = {
  version: 1,
  stores: {
    projects: "++projectId, projectName, deleted, deletedAt, [deleted+deletedAt], lastModified",
    primitiveColors: "++primitiveId, projectId, primitiveName, orderIndex",
    semanticColors: "++semanticId, projectId, semanticName, orderIndex",
    fonts: "++fontId, projectId, fontName, orderIndex",
    translations: "++translationId, projectId, translationData",
  }
};

export default ThMLT_DB_Schema;