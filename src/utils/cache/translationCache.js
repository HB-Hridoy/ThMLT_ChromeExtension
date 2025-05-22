
export default class TranslationsCache{
  #hasTranslation;
  #translationData;
  constructor(){
    this.#hasTranslation = false;
    this.#translationData = ""
  }

  add({ translationData }){
    this.#translationData = translationData;
    this.#hasTranslation = true;
  }

  hasTranslation({ hasTranslation }){
    if (hasTranslation !== undefined) {
      this.#hasTranslation  = hasTranslation;
      return hasTranslation;
    }
    return this.#hasTranslation;
  }

  clear(){
    this.#hasTranslation = false;
    this.#translationData = "";
  }
}