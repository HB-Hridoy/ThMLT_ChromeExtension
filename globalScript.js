let activeScreen = "home-screen";

document.addEventListener('DOMContentLoaded', () => {
    const buttons = document.querySelectorAll('.nav-btn');

    buttons.forEach(button => {
        button.addEventListener('click', () => {
            const targetScreenId = button.getAttribute("data-tooltip-target");

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

