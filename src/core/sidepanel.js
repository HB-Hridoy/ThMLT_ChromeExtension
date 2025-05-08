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
