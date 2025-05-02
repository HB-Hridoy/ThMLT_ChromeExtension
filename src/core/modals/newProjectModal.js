
  import { doc } from "../sidepanel.js"

  const $addProjectModalElement = doc.getElementById("add-project-modal");

  const options = {
    placement: 'center',
    backdrop: 'dynamic',
    backdropClasses:
        'bg-gray-900/50 dark:bg-gray-900/80 fixed inset-0 z-40',
    closable: true,
    onHide: () => {
        console.log('add project modal is hidden');
    },
    onShow: () => {
        console.log('add project modal is shown');
    },
    onToggle: () => {
        console.log('add project modal has been toggled');
    },
  };

  const addProjectModal = new Modal($addProjectModalElement, options);


  document.getElementById("add-new-project-toggle").addEventListener("click", function(){
    ScreenManager.hideBottomNavBar();
});

document.getElementById("add-new-project").addEventListener("click", async function () {
    // Select the inputs
    const projectName = document.getElementById("projectNameInput").value.trim();
    const author = document.getElementById("authorNameInput").value.trim();
    const version = document.getElementById("versionNameInput").value.trim();
  
    // Check if any input is empty
    if (!projectName || !author || !version) {
      console.log("Inputs are empty");
    } else {
      console.log("Adding project");
  
      try {
        // Await the result of addProject
        const result = await addProject({
          id: projectName,
          projectName: projectName,
          author: author,
          version: version,
        }, true);
        
        console.log(result); // Log the success message

        
        projectsContainer.insertAdjacentHTML("beforeend", CreateElement.projectTemplate(projectName, author, version));
      } catch (error) {
        alert(error); // Error message
        console.error(error); // Log the error message
      }
    }
});

