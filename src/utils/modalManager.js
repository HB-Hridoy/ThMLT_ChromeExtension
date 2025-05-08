

import { loadHtmlFragment } from "./components.js";

export const MODALS = {
  PRIMITIVE_MODAL: {
    id: "primitive-modal",
    path: "src/core/modals/primitiveColorModal.html"
  }
};

class ModalManager {
  constructor(){
    this.debug = true;
    this._loadedModals = [];

    this.instances = new Map();
  }

  log(message, isError = false) {
    if (this.debug) {
      isError ? console.error(message) : console.log(message);
    }
  }

  setDebugMode(enabled) {
    this.debug = enabled;
    this.log(`Debug mode set to: ${enabled}`);
  }

  async load(modalConfig) {
    if (this._loadedModals.includes(modalConfig.id)) {
      this.log(`Modal already loaded: ${modalConfig.id}`);
      return;
    }
    const modalId = modalConfig.id;
    const modalPath = modalConfig.path;
    this.log(`Loading modal: ${modalId} from ${modalPath}`);
    const html = await loadHtmlFragment(modalPath);

    // Directly insert modalConfig into the body
    document.body.insertAdjacentHTML("beforeend", html);

    // Wait until DOM element actually exists
    await this._waitForElement(`#${modalId}`);

    this._loadedModals.push(modalId);
    this.log(`Modal loaded: ${modalId}`);
  }

  _waitForElement(selector, timeout = 1000) {
    return new Promise((resolve, reject) => {
      const start = performance.now();

      function check() {
        const el = document.querySelector(selector);
        if (el) return resolve(el);
        if (performance.now() - start > timeout)
          return reject(`Element ${selector} not found in time`);
        requestAnimationFrame(check);
      }

      check();
    });
  }

  async register(modalConfig) {
    const modalId = modalConfig.id;

    await this.load(modalConfig);
    
    const el = document.getElementById(modalId);
    if (!el) throw new Error(`Modal element with id "${modalId}" not found`);

    const modal = new window.Modal(el);
    this.instances.set(modalId, modal);
    return modal;
  }

  get(modalId) {
    return this.instances.get(modalId);
  }

  show(modalId) {
    const modal = this.get(modalId);
    if (modal) modal.show();
  }

  hide(modalId) {
    const modal = this.get(modalId);
    if (modal) modal.hide();
  }

}

export const modalManager = new ModalManager();
