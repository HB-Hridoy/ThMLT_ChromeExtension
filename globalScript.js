  let activeScreen = "colors-screen";


  document.addEventListener('DOMContentLoaded', () => {
      const buttons = document.querySelectorAll('[data-nav-button-screen-target]');

      buttons.forEach(button => {
          button.addEventListener('click', () => {
              const targetScreenId = button.getAttribute("data-nav-button-screen-target");

              SwitchScreen(targetScreenId);
          });
      });
      
  });


  function SwitchScreen(screenName){
    const targetScreen = document.getElementById(screenName);
    
    document.getElementById(activeScreen).classList.replace("visible", "hidden");
    targetScreen.classList.replace("hidden", "visible");

    const activeIcon = document.getElementById(activeScreen + "-icon");
    const targetIcon = document.getElementById(screenName + "-icon");

    activeIcon.classList.replace("text-blue-600", "text-gray-500");
    targetIcon.classList.replace("text-gray-500", "text-blue-600");

    activeScreen = screenName;
  }

  function ShowAlert(alertId, meassage = "", duration = 5000) {
    const alert = document.getElementById(alertId+"-alert");
    const alertText = document.getElementById(alertId+"-alert-text");
    if (alert && alertText) {
      alertText.innerHTML = meassage;
      alert.classList.replace('hidden', 'flex'); // Show the alert
      if (duration > 0) {
        setTimeout(() => alert.classList.replace('flex', 'hidden'), duration); // Hide after duration
      }
    }
  }
  