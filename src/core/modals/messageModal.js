
let messageModal = null;

function showMessage(title, message, buttonText = "OK") {
  document.getElementById("message-modal-title").innerText = title;
  document.getElementById("message-modal-text").innerText = message;
  document.getElementById("message-modal-button").innerText = buttonText
  messageModal.show();
}