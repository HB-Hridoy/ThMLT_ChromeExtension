import { modalManager, MODALS } from '../../utils/modalManager.js';
import sidepanelCache from '../../utils/sidepanelCache.js';
import { replaceClass } from '../sidepanel.js';

let primitiveModalElement = null;



let primitiveModalMode = null;

let primitiveNameInput = null;
let primitiveNameInputError = null;

let colorValue = null;

let deleteButton = null;
let actionButton = null;

class PrimitiveModal {
  constructor() {
    this.primitiveModal = null;
    this.listenersAdded = false;
  }

  async show() {
    if (!this.primitiveModal){

      this.primitiveModal = await modalManager.register(MODALS.PRIMITIVE_MODAL);
    }
    this.primitiveModal.show();

    if (this.listenersAdded) return;

    // ========== GLOBAL VARIABLES BEGIN ========== //

    primitiveModalElement = document.getElementById("primitive-modal");

    primitiveModalMode = document.querySelector('h3[primitiveModalMode]');
    
    primitiveNameInput = document.getElementById("primitive-modal-name-input");
    primitiveNameInputError = document.getElementById("primitive-modal-name-input-error");

    colorValue = document.getElementById("primitive-modal-color-text");

    deleteButton = document.getElementById("primitive-modal-delete-button");
    actionButton = document.getElementById("primitive-modal-action-button");

    // ========== GLOABL VARIABLE END ========== //
  }

  hide(){
    this.primitiveModal.hide();
  }

  restoreDeafaults(){
    
  }

  setMode(mode){
    
  }
}
const primitiveModal = new PrimitiveModal();

export { primitiveModal };
