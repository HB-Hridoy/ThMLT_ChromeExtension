

let confirmationCallback = null;
let confirmationModal = null;

function openConfirmation(message, callback, confirmButtonText = '@default', cancelButtonText = '@default') {
    document.getElementById("confirmation-modal-message").innerHTML = message;

    document.getElementById("confirmation-modal-confirm-button").innerText = confirmButtonText !== "@default" ? confirmButtonText : "Yes, I'm sure";

    document.getElementById("confirmation-modal-cancel-button").innerText = cancelButtonText !== "@default" ? cancelButtonText : "No, cancel";

    confirmationModal.show();

    // Store the callback function
    confirmationCallback = callback;
  }