const openDB = indexedDB.open("ThMLT DB", 1); // Name and version
let db;
let isDBOpenSuccess = false;

let currentPrimitiveRowId = 1;
let currentSemanticRowId = 1;

const nameRegex = /^[A-Za-z0-9-_]+$/;

let oldPrimitiveInputValues = new Map();


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

function getAllPrimitiveColors(templateName) {

  console.log(`Getting primitive colors of '${templateName}' template...`);
  const transaction = db.transaction(["primitiveColors"], "readonly");
  const store = transaction.objectStore("primitiveColors");
  // Open the index on projectId
  const index = store.index("templateName");
    
  const request = index.getAll(templateName);

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
                  <tr id="primitive-row-${currentPrimitiveRowId}" class="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white w-2/4">
                      <div class="flex items-center w-full">
                        <img src="/assets/paintBoard.svg" alt="" class="w-5 h-5" />
                        <input 
                          id="primitive-name-input-${currentPrimitiveRowId}"
                          type="text" 
                          value="${primitive.primitiveName}" 
                          class="name-input text-sm text-gray-500 ml-2 w-full border-0 border-white rounded-md px-2 py-1 dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Give primitive a name" 
                        />
                      </div>
                    </td>
                    <td class="px-6 py-4 w-2/4">
                      <div class="color-box-parent w-full flex items-center">
                        <div id="primitive-color-box-${currentPrimitiveRowId}" style="background-color: ${primitive.primitiveValue};" class="color-box h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm "></div>
                        <p id="primitive-value-${currentPrimitiveRowId}" class="color-text mr-2">${primitive.primitiveValue}</p>
                        <div id="temp-primitive-color-picker" class="flex-1" ></div> <!-- Takes remaining space -->
                        <button id="primitive-delete-row-${currentPrimitiveRowId}" type="button" class="hidden delete-row text-white bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 7h14m-9 3v8m4-8v8M10 3h4a1 1 0 0 1 1 1v3H9V4a1 1 0 0 1 1-1ZM6 7h12v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7Z"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                         <button id="primitive-refresh-row-${currentPrimitiveRowId}" type="button" class="hidden refresh-row text-white bg-green-700 hover:bg-green-800 focus:ring-4 focus:outline-none focus:ring-green-300 font-medium rounded-lg text-sm p-1.5 text-center  items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800">
                          <svg class="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.651 7.65a7.131 7.131 0 0 0-12.68 3.15M18.001 4v4h-4m-7.652 8.35a7.13 7.13 0 0 0 12.68-3.15M6 20v-4h4"/>
                          </svg>
                          <span class="sr-only">Icon description</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                  `;
    
      // Insert the new row into the table body
      tableBody.insertAdjacentHTML("beforeend", newRow);
      
      currentPrimitiveRowId++;
    });
    tableBody.querySelectorAll('.name-input').forEach(input => {
      const inputRowId = input.id.split('-').pop();
      const inputValue = input.value.trim();
      oldPrimitiveInputValues.set(inputRowId, inputValue); 
    });

  };

  request.onerror = (event) => {
    const error = "Error getting templates: " + event.target.error;
    console.error(error);
  };
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
                console.log(`Primitive color '${primitiveName}' updated`);
              }
  
              primitiveColorStoreRequest.onerror = (e) => {
                reject("Primitive Color update failed");
                console.log(`Primitive Color '${primitiveName}' update failed`);
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
                console.log(`Primitive color '${primitiveName}' added`);
              }
  
              primitiveColorStoreRequest.onerror = (e) => {
                reject("Primitive Color adding failed");
                console.log(`Primitive Color '${primitiveName}' adding failed`);
              }
            }
          };
        } else {
          console.log(`Template '${templateName}' not found.`);
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

function deletePrimitiveColor(templateName, primitiveName) {
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
          // Template exists, check if primitiveName exists in primitiveColors
          let colorRequest = primitiveColorsStore.index("templateName").getAll(templateName);

          colorRequest.onsuccess = function(event) {
            let colors = event.target.result;
            let colorToDelete = colors.find(color => color.primitiveName === primitiveName);

            if (colorToDelete) {
              // Delete the primitive color
              primitiveColorsStore.delete(colorToDelete.id);
              console.log(`Primitive color '${primitiveName}' deleted.`);
              resolve(`Primitive color '${primitiveName}' deleted.`);
            } else {
              console.log(`Primitive color '${primitiveName}' not found.`);
              reject(`Primitive color '${primitiveName}' not found.`);
            }
          };
        } else {
          const tempError = `Template '${templateName}' not found.`;
          console.log(tempError);
          reject(tempError);
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

function addSemanticColor(db, templateName, semanticName, primitiveName, primitiveValue) {
  let transaction = db.transaction(["templates", "primitiveColors", "semanticColors"], "readwrite");
  let templatesStore = transaction.objectStore("templates");
  let primitiveColorsStore = transaction.objectStore("primitiveColors");
  let semanticColorsStore = transaction.objectStore("semanticColors");

  // Check if templateName exists in templates store
  let templateRequest = templatesStore.index("templateName").get(templateName);

  templateRequest.onsuccess = function(event) {
    let template = event.target.result;
    if (template) {
      // Template exists, check if semanticName exists
      let semanticRequest = semanticColorsStore.index("templateName").getAll(templateName);
      semanticRequest.onsuccess = function(event) {
        let semantics = event.target.result;
        let existingSemantic = semantics.find(semantic => semantic.semanticName === semanticName);

        if (existingSemantic) {
          // Update the value of the existing semanticColor
          existingSemantic.primitiveName = primitiveName;
          existingSemantic.primitiveValue = primitiveValue;
          semanticColorsStore.put(existingSemantic);
        } else {
          // Check if primitiveColor exists for the given primitiveName
          let colorRequest = primitiveColorsStore.index("templateName").getAll(templateName);
          colorRequest.onsuccess = function(event) {
            let colors = event.target.result;
            let existingColor = colors.find(color => color.primitiveName === primitiveName);

            if (existingColor) {
              // Store the new semanticColor
              let newSemanticColor = {
                templateName: templateName,
                semanticName: semanticName,
                primitiveName: primitiveName,
                primitiveValue: primitiveValue
              };
              semanticColorsStore.add(newSemanticColor);
            } else {
              console.log("Primitive color not found.");
            }
          };
        }
      };
    } else {
      console.log("Template not found.");
    }
  };
}


function getAllSemanticColors(db, templateName, callback) {
  let transaction = db.transaction(["templates", "semanticColors"], "readonly");
  let templatesStore = transaction.objectStore("templates");
  let semanticColorsStore = transaction.objectStore("semanticColors");

  // Check if templateName exists in templates store
  let templateRequest = templatesStore.index("templateName").get(templateName);

  templateRequest.onsuccess = function(event) {
    let template = event.target.result;
    if (template) {
      // Template exists, retrieve all semantic colors for the template
      let semanticRequest = semanticColorsStore.index("templateName").getAll(templateName);
      semanticRequest.onsuccess = function(event) {
        callback(event.target.result);
      };
    } else {
      console.log("Template not found.");
    }
  };
}

function deleteSemanticColor(db, templateName, semanticName) {
  let transaction = db.transaction(["templates", "semanticColors"], "readwrite");
  let templatesStore = transaction.objectStore("templates");
  let semanticColorsStore = transaction.objectStore("semanticColors");

  // Check if templateName exists in templates store
  let templateRequest = templatesStore.index("templateName").get(templateName);

  templateRequest.onsuccess = function(event) {
    let template = event.target.result;
    if (template) {
      // Template exists, check if semanticName exists in semanticColors
      let semanticRequest = semanticColorsStore.index("templateName").getAll(templateName);

      semanticRequest.onsuccess = function(event) {
        let semantics = event.target.result;
        let semanticToDelete = semantics.find(semantic => semantic.semanticName === semanticName);

        if (semanticToDelete) {
          // Delete the semantic color
          semanticColorsStore.delete(semanticToDelete.id);
          console.log(`Semantic color '${semanticName}' deleted.`);
        } else {
          console.log(`Semantic color '${semanticName}' not found.`);
        }
      };
    } else {
      console.log(`Template '${templateName}' not found.`);
    }
  };
}











