const openDB = indexedDB.open("ThMLT DB", 1); // Name and version
let db;
let isDBOpenSuccess = false;

openDB.onupgradeneeded = function (event) {
  db = event.target.result;
  // Create 'templates' object store if it doesn't exist
  if (!db.objectStoreNames.contains("templates")) {
    let request = db.createObjectStore("templates", { keyPath: "id" });
    request.createIndex("templateName", "templateName", {unique: true});
  }

  if (!db.objectStoreNames.contains("primitiveColors")) {
    let request = db.createObjectStore("primitiveColors", { keyPath: "id" });
    request.createIndex("primitiveName", "primitiveName", {unique: true});
    request.createIndex("primitiveValue", "primitiveValue", {unique: false});
  }

  if (!db.objectStoreNames.contains("semanticColors")) {
    let request = db.createObjectStore("primitiveColors", { keyPath: "id" });
    request.createIndex("semanticName", "semanticName", {unique: true});
    request.createIndex("semanticValue", "semanticValue", {unique: false});
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

function addPrimitiveColor(colors) {
  return new Promise((resolve, reject) => {
    if (isDBOpenSuccess && db) {
      console.log("Adding primiotive color...");
      const transaction = db.transaction(["primitiveColors"], "readwrite");
      const store = transaction.objectStore("primitiveColors");

      let request = store.put(colors);
      
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







