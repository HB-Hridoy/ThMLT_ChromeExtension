export default class BaseCache {
  constructor() {
    this.debug = true;
    this.SKIP = "@skip";
  }

  log(message, isError = false) {
    if (this.debug) {
      isError ? console.error("[CACHE]", message) : console.log("[CACHE]", message);
    }
  }

  setDebugMode(enabled) {
    this.debug = enabled;
    this.log(`Debug mode set to: ${enabled}`);
  }
}
