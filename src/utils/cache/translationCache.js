
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

  hasTranslation() {
    return this.#hasTranslation;
  }
  
  setHasTranslation({ hasTranslation }) {
    this.#hasTranslation = hasTranslation;
  }

  clear(){
    this.#hasTranslation = false;
    this.#translationData = "";
  }
}