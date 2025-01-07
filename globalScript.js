let activeScreen = "colors-screen";

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

// Adding colors tab switching
const primitivesTabButton = document.getElementById("primitives-tab");
const semanticTabButton = document.getElementById("semantic-tab");

primitivesTabButton.addEventListener('click', () => {
    document.getElementById("primitives-screen").classList.replace("hidden", "visible");
    document.getElementById("semantic-screen").classList.replace("visible", "hidden");

    semanticTabButton.className = "inline-block p-2 hover:text-blue-600";
    primitivesTabButton.className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
  });

semanticTabButton.addEventListener('click', () => {
    document.getElementById("primitives-screen").classList.replace("visible", "hidden");
    document.getElementById("semantic-screen").classList.replace("hidden", "visible");

    primitivesTabButton.className = "inline-block p-2 hover:text-blue-600";
    semanticTabButton.className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
});




