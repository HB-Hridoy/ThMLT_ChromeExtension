import ProjectModel from "./ProjectModel.js";
import PrimitiveColorModel from "./PrimitiveColorModel.js";
import SemanticColorModel from "./SemanticColorModel.js";
import FontModel from "./FontModel.js";
import TranslationModel from "./TranslationModel.js";

class DatabaseManager {
  constructor() {
    this.projects = new ProjectModel();
    this.primitives = new PrimitiveColorModel();
    this.semantics = new SemanticColorModel();
    this.fonts = new FontModel();
    this.translations = new TranslationModel();
  }
}
