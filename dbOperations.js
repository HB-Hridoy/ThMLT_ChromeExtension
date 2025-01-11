const openDB = indexedDB.open("ThMLT DB", 1); // Name and version
let db;
let isDBOpenSuccess = false;

openDB.onupgradeneeded = function (event) {
  db = event.target.result;

  // Create 'templates' object store
  if (!db.objectStoreNames.contains("templates")) {
    let templatesStore = db.createObjectStore("templates", { keyPath: "templateName" });
    templatesStore.createIndex("templateName", "templateName", { unique: true });
    templatesStore.createIndex("author", "author", { unique: false });
    templatesStore.createIndex("version", "version", { unique: false });
  }

  // Create 'primitiveColors' object store
  if (!db.objectStoreNames.contains("primitiveColors")) {
    let primitiveColorsStore = db.createObjectStore("primitiveColors", { keyPath: "id", autoIncrement: true  });
    primitiveColorsStore.createIndex("templateName", "templateName", { unique: false });
    primitiveColorsStore.createIndex("primitiveName", "primitiveName", { unique: true });
    primitiveColorsStore.createIndex("primitiveValue", "primitiveValue", { unique: false });
  }

  // Create 'semanticColors' object store
  if (!db.objectStoreNames.contains("semanticColors")) {
    let semanticColorsStore = db.createObjectStore("semanticColors", { keyPath: "id", autoIncrement: true  });
    semanticColorsStore.createIndex("templateName", "templateName", { unique: false });
    semanticColorsStore.createIndex("semanticName", "semanticName", { unique: true });
    semanticColorsStore.createIndex("linkedPrimitive", "linkedPrimitive", { unique: false });
  }

};

openDB.onsuccess = (event) => {
  db = openDB.result;
  isDBOpenSuccess = true;
  console.log("Database opened successfully!");
  getAllTemplates();
  // addTemplate({id: "templateName", templateName: "templateName", author: "author", version: "version" });

};

openDB.onerror = function (event) {
  console.error("Database error:", event.target.errorCode);
};

function addTemplate(template, update) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      console.log("Adding template...");
      const transaction = db.transaction(["templates"], "readwrite");
      const store = transaction.objectStore("templates");

      let request;
      if (update){
        request = store.put(template);

      }else{
        request = store.add(template);

      }
      
      request.onsuccess = () => {
        console.log("Template added!");
        resolve("Template added!");
      };

      request.onerror = (event) => {
        const error = "Error adding template: " + event.target.error;
        console.error(error);
        reject(error);
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });
}

function getAllTemplates() {
  console.log("Getting templates...");
  const transaction = db.transaction(["templates"], "readonly");
  const store = transaction.objectStore("templates");
  const request = store.getAll();

  request.onsuccess = () => {
    console.log("Got All Templates!");
    // Get the container element
    const templatesContainer = document.getElementById("templates-container");
    let result = request.result;

    // Clear any existing content in the container
    templatesContainer.innerHTML = "";

    // Check if the result array is empty
    if (result.length === 0) {
      // Inject a <p> if no templates are found
      templatesContainer.innerHTML = `<p class="text-gray-500 text-sm">No templates found.</p>`;
    } else {
      // Iterate over the result array and inject HTML for each template
      result.forEach((template) => {
        const html = `
          <div template-id="${template.templateName}" class="template-preview-parent visible max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 bg-gray-50 border border-gray-200 rounded-lg shadow hover:bg-gray-200 dark:bg-gray-800 dark:border-gray-700 dark:hover:bg-gray-700">
            <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900 dark:text-white">${template.templateName}</h5>
            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Author: ${template.author}</p>
            <p class="text-xs font-normal text-gray-700 dark:text-gray-400">Version: ${template.version}</p>
          </div>
        `;
        templatesContainer.insertAdjacentHTML("beforeend", html);
      });
    }
  };

  request.onerror = (event) => {
    const error = "Error getting templates: " + event.target.error;
    console.error(error);
    reject(error);
  };
}

function getAllPrimitiveColors() {
  console.log("Getting primitive colors...");
  const transaction = db.transaction(["primitiveColors"], "readonly");
  const store = transaction.objectStore("primitiveColors");
  const request = store.getAll();

  request.onsuccess = () => {
    console.log("Got All Primitive Colors!");
    let result = request.result;

    const tableBody = document.querySelector("#primitives-table tbody");
    tableBody.innerHTML = "";
    // Iterate over the result array and inject HTML for each template
    result.forEach((primitive) => {
      // Get the table body
    

    // Create a new row
    const newRow = `
                  <tr class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white w-2/4">
                      <div class="flex items-center w-full">
                        <img src="/assets/paintBoard.svg" alt="" class="w-5 h-5" />
                        <input 
                          type="text" 
                          value="${primitive.primitiveName}" 
                          class="text-sm text-gray-500 ml-2 w-full border-0 px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Give primitive a name" 
                        />
                      </div>
                    </td>
                    <td class="px-6 py-4 w-2/4">
                      <div class="color-box-parent w-full flex items-center">
                        <div class="color-box h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm bg-${primitive.primitiveValue}"></div>
                        <p class="color-text mr-2">${primitive.primitiveValue}</p>
                        <div id="temp-primitive-color-picker" class="flex-1" ></div> <!-- Takes remaining space -->
                        <button type="button" class="hidden delete-row text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                      </div>
                                         
                      
                    </td>
                  </tr>
                  `;
    
      // Insert the new row into the table body
      tableBody.insertAdjacentHTML("beforeend", newRow);
    });
  };

  request.onerror = (event) => {
    const error = "Error getting templates: " + event.target.error;
    console.error(error);
  };
}

function addNewPrimitive(primitiveName, primitiveValue, id, inputElement) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      // Open a transaction to the IndexedDB object store
      const transaction = db.transaction(["primitiveColors"], "readwrite");
      const store = transaction.objectStore("primitiveColors");

      // Check if the primitiveName exists
      const request = store.index("primitiveName").get(primitiveName);

      request.onsuccess = () => {
        const result = request.result;

        if (result) {
          // Primitive already exists
          if (inputElement) {
            inputElement.classList.add("border-red-500"); // Highlight input with red border
          }
          reject("Primitive already exists");
        } else {
          // Add new primitive to the store
          const newPrimitive = {
            id: id,
            primitiveName: primitiveName,
            primitiveValue: primitiveValue,
          };

          const addRequest = store.add(newPrimitive);

          addRequest.onsuccess = () => {
            resolve("Primitive added successfully");
          };

          addRequest.onerror = (errorEvent) => {
            reject(`Error adding primitive: ${errorEvent.target.error}`);
          };
        }
      };

      request.onerror = (errorEvent) => {
        reject(`Error checking primitive name: ${errorEvent.target.error}`);
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });
}

function addPrimitiveColor(templateName, primitiveName, primitiveValue) {

  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
          
      let transaction = db.transaction(["templates", "primitiveColors"], "readwrite");
      let templatesStore = transaction.objectStore("templates");
      let primitiveColorsStore = transaction.objectStore("primitiveColors");

      // Check if templateName exists in templates store
      let templateRequest = templatesStore.index("templateName").get(templateName);

      templateRequest.onsuccess = function(event) {
        let template = event.target.result;
        if (template) {
          // Template exists, check if primitiveName exists
          let colorRequest = primitiveColorsStore.index("templateName").getAll(templateName);
          colorRequest.onsuccess = function(event) {
            let colors = event.target.result;
            let existingColor = colors.find(color => color.primitiveName === primitiveName);

            let primitiveColorStoreRequest;
            if (existingColor) {
              // Update the value of existing primitiveColor
              existingColor.primitiveValue = primitiveValue;
              primitiveColorStoreRequest = primitiveColorsStore.put(existingColor);
              primitiveColorStoreRequest.onsuccess = (e) => {
                resolve("Primitive color updated");
                console.log("Primitive color updated");
              }
  
              primitiveColorStoreRequest.onerror = (e) => {
                reject("Primitive Color update failed");
                console.log("Primitive Color update failed");
              }
            } else {
              // Store the new primitiveColor
              let newColor = {
                templateName: templateName,
                primitiveName: primitiveName,
                primitiveValue: primitiveValue
              };
              primitiveColorStoreRequest = primitiveColorsStore.add(newColor);
              primitiveColorStoreRequest.onsuccess = (e) => {
                resolve("Primitive color added");
                console.log("Primitive color added");
              }
  
              primitiveColorStoreRequest.onerror = (e) => {
                reject("Primitive Color adding failed");
                console.log("Primitive Color adding failed");
              }
            }
          };
        } else {
          console.log("Template not found.");
          reject("Template not found.");
        }
      };
    } else {
      const error = "Database is not initialized";
      console.error(error);
      reject(error);
    }
  });

}

// return new Promise((resolve, reject) => {
//   if (isDBOpenSuccess && db) {
    
//   } else {
//     const error = "Database is not initialized";
//     console.error(error);
//     reject(error);
//   }
// });









