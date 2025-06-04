
import cacheManager from "../../../utils/cache/cacheManager.js";
import { components } from "../../../utils/components.js";
import { screenManager, screens } from "../../../utils/screenManager.js";
import { showProjectManagementScreen } from "../projectManagement/projectManagement.js";
import { projectModal } from "../../modals/newProjectModal.js";

const comp = new components();

let listenersAdded = false;

let projectsContainer;

export async function showHomeScreen() {
  await screenManager.switchScreen(screens.HOME);

  screenManager.bottomNavigationBar(true);

  if (listenersAdded) return;

  // ===== GLOBAL VARIABLE BEGIN ===== //

  projectsContainer = document.getElementById("projects-container");

  // ===== GLOBAL VARIABLE BEGIN ===== //

  // ===== EVENT LISTENERS BEGIN ===== //

  projectsContainer.addEventListener("click", async function (event) {
    const projectCard = event.target.closest(".project-card");

    if (projectCard) {
      const selectedProjectId = projectCard.getAttribute("project-id");

      if (selectedProjectId !== cacheManager.projects.activeProjectId) {
        cacheManager.clearAll();
        
        cacheManager.projects.activeProjectId = projectCard.getAttribute("project-id");

        cacheManager.projects.get(cacheManager.projects.activeProjectId).themeModes.forEach((theme) =>{
          cacheManager.semantics.theme().add({ themeName: theme });
        });

        console.log(`[INFO] Active project ID set to: ${cacheManager.projects.activeProjectId}`);
        
      } else {
        console.log(`[INFO] Active project ID already set to: ${cacheManager.projects.activeProjectId}`);
      }
      await showProjectManagementScreen();

    }
  });

  document.getElementById("show-project-modal").addEventListener('click', () =>{
    projectModal.show()
  });

  // ===== EVENT LISTENERS END ===== //
  listenersAdded = true;
}

export function addProjectCard({
  projectId,
  projectName,
  author,
  version,
  lastModified,
} = {}) {
  const timestamp = new Date(lastModified).toLocaleString();
  const projectCard = comp.projectCard({
    projectId,
    projectName,
    author,
    version,
    lastModified: timestamp,
  });
  projectsContainer.insertAdjacentHTML("beforeend", projectCard);
}

export function updateProjectCard({
  projectId,
  projectName,
  author,
  version,
  lastModified,
} = {}) {
  const projectCard = projectsContainer.querySelector(`.project-card[project-id="${projectId}"]`);
  if (!projectCard) {
    console.error(`[HOME] Project card with ID "${projectId}" not found.`);
    return;
  }

  // Update only if the value is not undefined
  if (projectName !== undefined) {
    projectCard.querySelector(".project-name").textContent = projectName;
  }
  if (author !== undefined) {
    projectCard.querySelector(".project-author").textContent = author;
  }
  if (version !== undefined) {
    projectCard.querySelector(".project-version").textContent = version;
  }
  if (lastModified !== undefined) {
    const timestamp = new Date(lastModified).toLocaleString();
    projectCard.querySelector(".project-last-modified").textContent = timestamp;
  }

  console.log(`[HOME] Project card with ID "${projectId}" updated successfully.`);
}

export function deleteProjectCard({ projectId }) {
  const projectCard = projectsContainer.querySelector(`.project-card[project-id="${projectId}"]`);
  if (!projectCard) {
    console.error(`[HOME] Project card with ID "${projectId}" not found.`);
    return;
  }

  // Remove the project card from the DOM
  projectCard.remove();

  console.log(`[HOME] Project card with ID "${projectId}" deleted successfully.`);
}

