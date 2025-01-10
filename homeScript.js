    const templatesContainer = document.getElementById("templates-container");
    const homeScreen = document.getElementById("home-screen");
    const colorsScreen = document.getElementById("colors-screen");

  
    //Add new template

    document.getElementById("add-new-template-toggle").addEventListener("click", function(){
        bottomNavBar.classList.replace("visible","hidden");
    });

    document.getElementById("add-new-template").addEventListener("click", async function () {
        // Select the inputs
        const templateName = document.getElementById("templateNameInput").value.trim();
        const author = document.getElementById("authorNameInput").value.trim();
        const version = document.getElementById("versionNameInput").value.trim();
      
        // Check if any input is empty
        if (!templateName || !author || !version) {
          console.log("Inputs are empty");
        } else {
          console.log("Adding template");
      
          try {
            // Await the result of addTemplate
            const result = await addTemplate({
              id: templateName,
              templateName: templateName,
              author: author,
              version: version,
            }, true);
            
            console.log(result); // Log the success message

            const html = `
                        <div template-id="${templateName}" class="template-preview-parent visible max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 bg-gray-50 border border-gray-200 rounded-lg shadow hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
                            <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">${templateName}</h5>
                            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Author: ${author}</p>
                            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Version: ${version}</p>
                        </div>
                        `;
            templatesContainer.insertAdjacentHTML("beforeend", html);
          } catch (error) {
            alert(error); // Error message
            console.error(error); // Log the error message
          }
        }
    });

    document.getElementById("templates-container").addEventListener("click", function(event) {
        // Check if the clicked element or any of its parents has the 'template-preview-parent' class
        if (event.target.closest('.template-preview-parent')) {
          // Do your actions here
          const templateDiv = event.target.closest('.template-preview-parent');
      
          // Example: You can get the template id or other data from the div
          const templateId = templateDiv.getAttribute('template-id');
      
          homeScreen.classList.replace("visible", "hidden");
          colorsScreen.classList.replace("hidden", "visible");

            document.getElementById("template-name-colors-screen").innerText = templateId;

          getAllPrimitiveColors();

        }
      });
      
      