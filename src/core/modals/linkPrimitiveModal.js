import DatabaseManager from '../../db/DatabaseManager.js';
import { modalManager, MODALS } from '../../utils/modalManager.js';
import { primitiveTable } from '../../utils/primitiveTable.js';
import cacheManager from '../../utils/cache/cacheManager.js';
import { replaceClass } from '../sidepanel.js';
import { confirmationModal } from '../modals/confirmationModal.js'
import { showNoPrimitivesScreen, showPrimitivesTable } from '../screens/primitiveColor/primitiveColor.js';
import { primitivesLinkManager } from '../../utils/primitivesLinkManager.js';
import { screenManager } from '../../utils/screenManager.js';

let linkPrimitiveModalElement = null;

class LinkPrimitiveModal {
  constructor() {
    this.modal = null;
    this.listenersAdded = false;
  }

  async show({ semanticId, theme }) {
    if (!this.modal){
      this.modal = await modalManager.register(MODALS.LINK_PRIMITIVE);
      linkPrimitiveModalElement = document.getElementById(MODALS.LINK_PRIMITIVE.id);
    }

    linkPrimitiveModalElement.setAttribute("semanticId", semanticId);
    linkPrimitiveModalElement.setAttribute("theme", theme);

    primitivesLinkManager.render(cacheManager.primitives.getAll());

    this.modal.show();

    if (this.listenersAdded) return;

    // ========== EVENT LISTENERS BEGIN ========== //

    document.getElementById("hide-link-primitive-modal").addEventListener("click", () => {
      this.modal.hide();
    });

    // ========== EVENT LISTENERS END ========== //

    this.listenersAdded = true;

  }

  hide(){
    linkPrimitiveModalElement.removeAttribute("semanticId");
    linkPrimitiveModalElement.removeAttribute("theme");
    this.modal.hide();
  }

  
}
const linkPrimitiveModal = new LinkPrimitiveModal();

export { linkPrimitiveModal };


