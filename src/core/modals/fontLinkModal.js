
import { modalManager, MODALS } from '../../utils/modalManager.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { fontsLinkManager } from '../../utils/fontsLinkManager.js';

let fontLinkModalElement = null;

class FontLinkModal {
  constructor() {
    this.modal = null;
    this.listenersAdded = false;
  }

  async show() {
    if (!this.modal){
      this.modal = await modalManager.register(MODALS.FONT_LINK);
      fontLinkModalElement = document.getElementById(MODALS.FONT_LINK.id);
    }

    fontsLinkManager.init();

    fontsLinkManager.render(cacheManager.fonts.getAll());

    this.modal.show();

    if (this.listenersAdded) return;

    // ========== EVENT LISTENERS BEGIN ========== //

    document.getElementById("hide-font-link-modal").addEventListener("click", () => {
      this.modal.hide();
    });

    // ========== EVENT LISTENERS END ========== //

    this.listenersAdded = true;

  }

  hide(){
    this.modal.hide();
  }

  
}
const fontLinkModal = new FontLinkModal();

export { fontLinkModal };


