
import { modalManager, MODALS } from "../../utils/modalManager.js";

class ConfirmationModal {
  #modal = null;

  async #init() {
    if (!this.#modal) {
      this.#modal = await modalManager.register(MODALS.CONFIRMATON);
    }
  }

  async confirm({ 
    message = "No Message", 
    confirmButtonText = "Yes, I'm sure", 
    cancelButtonText = "No, cancel" 
  } = {}) {
    await this.#init();

    return new Promise((resolve) => {
      document.getElementById("confirmation-modal-message").innerHTML = message;
      document.getElementById("confirmation-modal-confirm-button").innerText = confirmButtonText;
      document.getElementById("confirmation-modal-cancel-button").innerText = cancelButtonText;

      // Clean up previous listeners to avoid duplicates
      const confirmBtn = document.getElementById("confirmation-modal-confirm-button");
      const cancelBtn = document.getElementById("confirmation-modal-cancel-button");
      confirmBtn.onclick = () => {
        this.#modal.hide();
        resolve(true);
      };
      cancelBtn.onclick = () => {
        this.#modal.hide();
        resolve(false);
      };

      this.#modal.show();
    });
  }
}

export const confirmationModal = new ConfirmationModal();
