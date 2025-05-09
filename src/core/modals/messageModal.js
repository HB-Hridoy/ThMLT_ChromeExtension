import { modalManager, MODALS } from "../../utils/modalManager.js";

let messageModal = null;

export async function showMessageModal({
  title = "Notice",
  message = "No message provided.",
  buttonText = "OK"
} = {}) {
  if (!messageModal) {
    messageModal = await modalManager.register(MODALS.MESSAGE);

    // Prevent event listener duplication
    const button = document.getElementById("message-modal-button");
    button.onclick = null;
  }

  return new Promise((resolve) => {
    document.getElementById("message-modal-title").innerText = title;
    document.getElementById("message-modal-text").innerText = message;
    const button = document.getElementById("message-modal-button");
    button.innerText = buttonText;

    button.onclick = () => {
      messageModal.hide();
      resolve();
    };

    messageModal.show();
  });
}
