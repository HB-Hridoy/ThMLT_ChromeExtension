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
