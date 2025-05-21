import { showHomeScreen, addProjectCard } from "./screens/home/home.js";
import DatabaseManager from "../db/DatabaseManager.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await showHomeScreen();

    const projects = await DatabaseManager.projects.getAll();

    for (const project of projects) {
      addProjectCard(project);
    }
  } catch (error) {
    console.error(error);
  }
});

export function replaceClass(element, prefix, newClass) {
  element.className = element.className
      .split(" ") // Split into array
      .filter(cls => !cls.startsWith(prefix)) // Remove old class with prefix
      .join(" "); // Convert back to string
  
  element.classList.add(newClass); // Add new class
}

export function throttle(fn, limit) {
  let lastCall = 0;
  let pendingCall = null;

  return function (...args) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // If a call is attempted during throttle delay, store the latest args
      clearTimeout(pendingCall);
      pendingCall = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, limit - (now - lastCall));
    }
  };
}

