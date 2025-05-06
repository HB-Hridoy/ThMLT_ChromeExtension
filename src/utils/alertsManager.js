
class AlertManager {
  constructor(){
    
  }

  showAlert(alertId, message = "", duration = 2500) {
    const alert = document.getElementById(alertId + "-alert");
    const alertText = document.getElementById(alertId + "-alert-text");
    if (alert && alertText) {
      alertText.innerHTML = message;
      alert.classList.replace('hidden', 'flex'); // Show the alert
      if (duration > 0) {
        setTimeout(() => alert.classList.replace('flex', 'hidden'), duration); // Hide after duration
      }
    }
  }

  success(message = "", duration = 2500) {
    this.showAlert("success", message, duration);
  }

  error(message = "", duration = 2500) {
    this.showAlert("danger", message, duration);
  }

  info(message = "", duration = 2500) {
    this.showAlert("info", message, duration);
  }

  warning(message = "", duration = 2500) {
    this.showAlert("warning", message, duration);
  }

  dark(message = "", duration = 2500) {
    this.showAlert("dark", message, duration);
  }
  
}

export const alertManager = new AlertManager();