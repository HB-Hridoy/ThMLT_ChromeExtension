let selectedTranslationTableRow = null;
let selectedFontTableRow = null;
let selectedColorTableRow = null;
let shadowRoot = null;

let textFormatterModal = null;
let isTextFormatterModalOpen = false;
let activeSearchInput = null;

let activeProjectName = "";
let projectName = "";
let translationData = "";
let fontData = "";
let colorData = "";

let translationTable = null;
let fontTable = null;
let colorTable = null;

let lastComponentNameText = "";

const CACHE_KEYS = {
  PROJECTS: 'projects',

  TRANSLATION_DATA : 'translationData',
  FONTS_DATA : 'fontsData',
  PRIMARY_COLOR_DATA : 'primaryColorData',
  SEMANTIC_COLOR_DATA : 'semanticColorData',

  PREVIOUS_PROJECT_NAME: 'previousProjectName',
  CURRENT_PROJECT_NAME: 'currentProjectName',
  
};

class ContentScriptCache {
  constructor() {
      this.cache = {}; // In-memory storage
  }

  // Set data in both in-memory and session storage
  set(key, value) {
      this.cache[key] = value;
  }

  // Get data from memory first, fallback to session storage
  get(key) {
      // Check in-memory cache first
      if (this.cache[key]) {
          return this.cache[key];
      }
  }

  // Remove a specific key from both in-memory and session storage
  remove(key) {
      delete this.cache[key];
  }

  // Clear all stored data from both in-memory and session storage
  clear() {
      this.cache = {};
  }
}

const cache = new ContentScriptCache();


class MessageClient {
  constructor(timeout = 5000) {
    this.timeout = timeout;
  }

  /**
   * Sends a message to the service worker (or background script) using a callback or a Promise.
   * @param {Object} message - The message object to send.
   * @param {Function} [callback] - Optional callback function (error, response).
   * @returns {Promise<Object>|void} - Resolves with the response message if no callback is provided.
   */
  sendMessage(message, callback) {
    if (typeof callback === "function") {
      this._sendWithCallback(message, callback);
    } else {
      return this._sendWithPromise(message);
    }
  }

  /**
   * Internal method to send a message using a Promise.
   * @param {Object} message - The message object.
   * @returns {Promise<Object>} - Resolves with the response or rejects on error.
   */
  _sendWithPromise(message) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        reject(new Error("⏳ Timeout: No response from service worker."));
      }, this.timeout);

      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeoutId);

        if (chrome.runtime.lastError) {
          reject(new Error(`❌ Runtime Error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(response);
        }
      });
    });
  }

  /**
   * Internal method to send a message using a callback.
   * @param {Object} message - The message object.
   * @param {Function} callback - Callback function (error, response).
   */
  _sendWithCallback(message, callback) {
    const timeoutId = setTimeout(() => {
      callback(new Error("⏳ Timeout: No response from service worker."), null);
    }, this.timeout);

    chrome.runtime.sendMessage(message, (response) => {
      clearTimeout(timeoutId);

      if (chrome.runtime.lastError) {
        callback(new Error(`❌ Runtime Error: ${chrome.runtime.lastError.message}`), null);
      } else {
        callback(null, response);
      }
    });
  }
}

const messageClient = new MessageClient();

createShadowDOM();

class TextFormatterModal {

  static async initialize(){
    try {
        // Fetch the HTML content
        const response = await fetch(chrome.runtime.getURL('Extras/textFormatterModal/textFormatterModal.html'));

        // Check if the fetch was successful
        if (!response.ok) {
            throw new Error(`Failed to fetch source HTML: ${response.statusText}`);
        }

        // Get the HTML content as text
        const htmlContent = await response.text();

        // Create a temporary div element to parse the HTML content
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;

        // Find the specific element by its ID and get its inner text
        const textFormatterPopupSourceElement = tempDiv.querySelector('#textFormatterModal');

        if (textFormatterPopupSourceElement) {
          // Create the overlay div
          const overlay = document.createElement('div');
          overlay.id = 'overlay';

          shadowRoot.appendChild(overlay);

          textFormatterModal = document.createElement('div');
          textFormatterModal.id = 'textFormatterModal';
          textFormatterModal.innerHTML = textFormatterPopupSourceElement.innerHTML;

          shadowRoot.appendChild(textFormatterModal);

          overlay.addEventListener('click', () => {
            TextFormatterModal.hide();
          }
          );


          console.log("Text formatter modal created inside Shadow DOM");
        } else {
            console.error("Element #textFormatterModal not found in source HTML");
        }
        tempDiv.remove();
    } catch (error) {
        console.error('Error fetching source HTML:', error);
    }
  }

  static show(){
    isTextFormatterModalOpen = true;
    shadowRoot.getElementById('overlay').style.display = 'block';
    textFormatterModal.style.display = 'block';

    console.log("Text formatter modal opened");
    
  }

  static hide(){
    isTextFormatterModalOpen = false;
    shadowRoot.getElementById('overlay').style.display = 'none';
    textFormatterModal.style.display = 'none';

    console.log("Text formatter modal closed");
    
  }

  static TranslationTable = class {
    static selectTableRow(clickedRow){
      if (!clickedRow) return; // Ignore clicks outside of rows

      // If another row is already selected, revert its background
      if (selectedTranslationTableRow) {
          selectedTranslationTableRow.classList.remove('highlight');
      }

      // If the same row is clicked, deselect it
      if (selectedTranslationTableRow === clickedRow) {
          selectedTranslationTableRow = null; // Reset selection
          return;
      }

      // Highlight the clicked row
      clickedRow.classList.add('highlight');
      selectedTranslationTableRow = clickedRow; // Update the selected row
    }

    static selectScope(scope){
      const targetScope = scope;
      const scopeSections = shadowRoot.getElementById("tarnslationScopeSections");
      const activeScope = scopeSections.querySelector('.translationScopeSelectionActive');

      if (targetScope !== activeScope) {
          const scopeElements = Array.from(scopeSections.children);

          scopeElements.forEach(scopeElement => {
              scopeElement.className = ''; 
              if (scopeElement === targetScope) {
                  scopeElement.classList.add('translationScopeSelectionActive'); 
              } else {
                  scopeElement.classList.add('translationScopeSelectionInactive'); 
              }
          });
      }
    }
  }

  static TabManager = class {

    static #defaultTab = "translation-tab";
    static #activeTab = null;
    static #previousTab = null;
    static #nextTab = null;

    static switchToTab(tabId) {
      const targetTab = shadowRoot.getElementById(tabId);

      if (targetTab === this.#activeTab) return;

      if (!this.#activeTab) {
        this.#activeTab = shadowRoot.getElementById(this.#defaultTab);
      }

      // Update the previously active tab
      this.#activeTab.classList.replace('textFormatterNavTabSelected', 'textFormatterNavTab');
      this.#activeTab.setAttribute('isTabSelected', 'false');

      // Set the new active tab
      this.#activeTab = targetTab;
      this.#activeTab.classList.replace('textFormatterNavTab', 'textFormatterNavTabSelected');
      this.#activeTab.setAttribute('isTabSelected', 'true');

      // Update tab screens visibility
      Array.from(shadowRoot.getElementById("textFormatterNavTabs").children).forEach(tab => {
        const tabScreen = shadowRoot.getElementById(tab.id.replace('-tab', '-screen'));
        tabScreen.style.display = tab.id === tabId ? 'block' : 'none';
      });
    }
    
    static activeTab() {
      return this.#activeTab ? this.#activeTab.id : this.#defaultTab;
    }
    
  }
}

(async function() {
  await TextFormatterModal.initialize();
  TextFormatterModal.hide();

  translationTable = shadowRoot.getElementById("translationTable");
  fontTable = shadowRoot.getElementById("fontTable");
  colorTable = shadowRoot.getElementById("colorTable");
  refreshTranslationTable();

  // Close text formatter button 
  shadowRoot.getElementById('closeFormatterPopup').addEventListener('click', ()=>{
    TextFormatterModal.hide();
  });

  // Switch Tabs
  shadowRoot.getElementById("textFormatterNavTabs").addEventListener("click", (e) => {
      TextFormatterModal.TabManager.switchToTab(e.target.id);
  });


  translationTable.querySelector("tbody").addEventListener('click', function(event) {
    TextFormatterModal.TranslationTable.selectTableRow(event.target.closest('tr'));
  });

  fontTable.querySelector("tbody").addEventListener('click', function(event) {
    selectTableRow(event.target.closest('tr'), 'fontTable');
  });

  colorTable.querySelector("tbody").addEventListener('click', function(event) {
    selectTableRow(event.target.closest('tr'), 'colorTable');
  });

  // Translation Scopes
  shadowRoot.getElementById("tarnslationScopeSections").addEventListener("click", (e) => {
      TextFormatterModal.TranslationTable.selectScope(e.target);
  });

  // Disable AI2 Keyboard shortcuts while modal is open or any infput focused
  ['.searchTranslationInput', '.searchColorInput'].forEach(selector => {
    const inputElement = shadowRoot.querySelector(selector);
    inputElement.addEventListener('focus', () => {
    activeSearchInput = inputElement;
    });
  });

  // Define the keys that should refocus on input
  const refocusKeys = ['/', 't', 'v', 'p', 'm'];

  // Add a keydown event listener to refocus on the input if the specified keys are pressed
  document.addEventListener('keydown', (event) => {
    if (isTextFormatterModalOpen) {
      // Check if the pressed key is in the refocusKeys array
      if (refocusKeys.includes(event.key.toLowerCase())) {
        // Use setTimeout to refocus on the input
        setTimeout(() => {
          activeSearchInput.focus(); // Keep the focus on the input field
        }, 0);
      }
    }
      
  });

})();

  /**
   * Creates a new script element named BlockyWorkspaceInjector.js
   */
  // (function() {
    
  //   let script = document.createElement("script");
  //   script.src = chrome.runtime.getURL("BlockyWorkspaceInjector.js");
  //   script.onload = function() {
  //     console.log("BlockyWorkspaceInjector.js loaded.");
  //     this.remove();
  //   };
  //   (document.head || document.documentElement).appendChild(script);
  // })();

  async function createShadowDOM(){
    // Create a host element for the Shadow DOM
    console.log("Creating ThMLT Shadow DOM");
    
    const shadowHost = document.createElement('div');
    shadowHost.id = 'ThMLTShadowDOM';
    document.body.appendChild(shadowHost);
  
    // Attach Shadow DOM
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });

    console.log("ThMLT Shadow DOM Creation Successfull");
  
    // Load and inject styles inside Shadow DOM
    try {
      const response = await fetch(chrome.runtime.getURL('Extras/textFormatterModal/textFormatterModal.css'));
      let cssText = await response.text();
  
      // Replace ":root" with ":host"
      cssText = cssText.replace(/:root/g, ':host');
  
      // Create a <style> element and inject the CSS
      const styleElement = document.createElement('style');
      styleElement.textContent = cssText;
  
      // Append to the Shadow DOM
      shadowRoot.appendChild(styleElement);
      console.log("CSS styles added inside ThMLT Shadow DOM");
  
    } catch (error) {
        console.error('Failed to fetch CSS:', error);
    }
  }


/**
 * MutationObserver to watch for the presence of the element with class 'ode-PropertiesComponentName'.
 * Once the element is found, it sets up another MutationObserver to watch for text (Properties Component Name) changes within the element.
 * Creates Edit Text with ThMLT button when the Properties Component Name ends with "(Label)".
 */
const observer = new MutationObserver(() => {
    const propertiesComponentNameElement = document.querySelector('.ode-PropertiesComponentName');
    const projectEditorElement = document.querySelector(".ode-ProjectEditor");
    const toolbarElement = document.querySelector(".ya-Toolbar");
    
    

    if (propertiesComponentNameElement) {
        console.log("Properties Component Name found! Watching for text changes...");

        // observer to watch for Properties Component Name changes
        const textObserver = new MutationObserver(() => {
            const newPropertiesComponentNameText = propertiesComponentNameElement.innerText.trim(); // Get the latest text

            if (newPropertiesComponentNameText !== lastComponentNameText) { // Only log if it's different
                lastComponentNameText = newPropertiesComponentNameText;
                if (newPropertiesComponentNameText.endsWith("(Label)")) {
                  createEditTextWithThmltModalButton();
                  console.log('Creating ThMLT button for the label');
                }
                
            }
        });

        textObserver.observe(propertiesComponentNameElement, { childList: true, subtree: true, characterData: true });

        // Stop looking for the element once found
        observer.disconnect();
    } 
    
    if (projectEditorElement) {
      const projectNameElement = projectEditorElement.querySelector(".ya-ProjectName");
    
      if (projectNameElement) {
        console.log("Project name element found! Watching for changes...");
    
        const initialProjectName = projectNameElement.innerText.trim();
        if (initialProjectName !== cache.get(CACHE_KEYS.CURRENT_PROJECT_NAME)) {
          cache.remove(CACHE_KEYS.PRIMARY_COLOR_DATA);
          cache.remove(CACHE_KEYS.SEMANTIC_COLOR_DATA);
          cache.remove(CACHE_KEYS.FONTS_DATA);
          cache.remove(CACHE_KEYS.TRANSLATION_DATA);
        }
        cache.set(CACHE_KEYS.CURRENT_PROJECT_NAME, initialProjectName);
    
        // Observer to detect project name changes
        const projectNameObserver = new MutationObserver(() => {
          const updatedProjectName = projectNameElement.innerText.trim();
    
          if (updatedProjectName !== initialProjectName) {
            cache.set(CACHE_KEYS.CURRENT_PROJECT_NAME, updatedProjectName);
            cache.remove(CACHE_KEYS.PRIMARY_COLOR_DATA);
            cache.remove(CACHE_KEYS.SEMANTIC_COLOR_DATA);
            cache.remove(CACHE_KEYS.FONTS_DATA);
            cache.remove(CACHE_KEYS.TRANSLATION_DATA);
            console.log(`[Current Project] ${updatedProjectName}`);
          }
        });
    
        projectNameObserver.observe(projectNameElement, { childList: true, subtree: true, characterData: true });
      }
    }
    

    if (toolbarElement){
      console.log("Toolbar element found creating test button");
      createTestButton(toolbarElement);
    }
});

// Watch the entire document for new elements (since AI2 loads dynamically)
observer.observe(document.body, { childList: true, subtree: true });


function createTestButton(toolBarElement) {
  
  const newDiv = document.createElement('div');
  newDiv.setAttribute("thmltTestButtonDiv", "true")
  newDiv.id = 'thmltTestButtonDiv';
  newDiv.innerHTML = `
          <div id="thmltTestButton" style="
                                                      position: relative;
                                                      display: flex;
                                                      align-items: center;
                                                      justify-content: center;
                                                      gap: 5px;
                                                      padding: 4px 10px;
                                                      transition: background 0.2s, opacity 0.1s;
                                                      color: #444;
                                                      font-family: 'Poppins', Helvetica, Arial, sans-serif;
                                                      font-weight: 500;
                                                      font-size: 1.06em;
                                                      white-space: nowrap;
                                                      background-color: #a5cf47;
                                                      border: 1px solid #444;
                                                      border-radius: 4px;
                                                      background-image: unset;
                                                      text-shadow: unset;
                                                      box-shadow: 1px 1px;
                                                      cursor: pointer;
          ">
          <div style="font-size: 0.75rem">ThMLT Test</div>
          </div>
        `;

        // Insert the newTd into the DOM next to the target <td> element
        toolBarElement.querySelector(".left").appendChild(newDiv);

        newDiv.addEventListener('click', async (e) => {
          const clickedElement = e.target.closest('td[thmltTestButtonDiv="true"]');

          try {
            const response = await MessageClient.sendMessage({ 
              action: "Project Availability", 
              projectName: "exTest" 
            });

            if (response.status === "success") {
              console.log(`${response.projectName} is available`);
                TextFormatterModal.show();
        
                setTimeout(() => {
                  //refreshColorTable(response.projectData, response.themeMode);
                }, 500);
            } else {
              console.log(`${response.projectName} is not available`);
              alert(`${response.projectName} is not available`);
            }
          } catch (error) {
            console.error(error);
            
          }
          
        });
  
}


function createEditTextWithThmltModalButton() {
  // Select the table with the class 'ode-PropertiesPanel'
  const propertiesPanelTable = document.querySelector('table.ode-PropertiesPanel');

  // Check if the table exists
  if (propertiesPanelTable) {
    
    // Find the specific row with the 'Text' label
    const targetRow = Array.from(propertiesPanelTable.querySelectorAll('tr')).find(row => {
      const propertyLabel = row.querySelector('div.ode-PropertyLabel');
      return propertyLabel && propertyLabel.textContent.trim() === 'Text';
    });

    const textArea = targetRow.nextElementSibling.querySelector('.ode-PropertyEditor');
    

    if (targetRow) {

      // Select the target <td> element that contains the <div> with class 'ode-PropertyLabel' and text 'Text'
      const targetTd = targetRow.querySelector('td:has(div.ode-PropertyLabel)').querySelector('td[align="left"][style*="vertical-align: top;"] img.ode-PropertyHelpWidget').parentElement;

      // Check if the target <td> element exists
      if (targetTd) {
        // Create a new <newTd> element with inline HTML
        const newTd = document.createElement('td');
        newTd.setAttribute('editTextWithThMLT', 'true');
        newTd.setAttribute('align', 'left');
        newTd.style.verticalAlign = 'top';
        newTd.id = 'my-newTd';
        newTd.innerHTML = `
          <div class="EditTextWithThMLTButton" style="
                                                      position: relative;
                                                      display: flex;
                                                      align-items: center;
                                                      justify-content: center;
                                                      gap: 5px;
                                                      padding: 4px 10px;
                                                      transition: background 0.2s, opacity 0.1s;
                                                      color: #444;
                                                      font-family: 'Poppins', Helvetica, Arial, sans-serif;
                                                      font-weight: 500;
                                                      font-size: 1.06em;
                                                      white-space: nowrap;
                                                      background-color: #a5cf47;
                                                      border: 1px solid #444;
                                                      border-radius: 4px;
                                                      background-image: unset;
                                                      text-shadow: unset;
                                                      box-shadow: 1px 1px;
                                                      cursor: pointer;
          ">
          <div style="font-size: 0.75rem">ThMLT</div>
          </div>
        `;

        // Insert the newTd into the DOM next to the target <td> element
        targetTd.insertAdjacentElement('afterend', newTd);

        newTd.addEventListener('click', (e) => {
          const clickedElement = e.target.closest('td[editTextWithThMLT="true"]');

          
          if (clickedElement) {
              if (textArea) {

                if (!projectName && projectName === activeProjectName) {
                  //call isNeededUpdate
                } else {
                 // fetch data
                }

                
                // textArea.value = "success i have done it";
                // // Trigger input and change events
                // textArea.dispatchEvent(new Event("input", { bubbles: true }));
                // textArea.dispatchEvent(new Event("change", { bubbles: true }));
              }
          }
        });
      } else {
        console.log('Target <td> element not found.');
      }
    } else {
        console.log('Specific table row not found.');
    }
  } else {
        console.log('Table with class "ode-PropertiesPanel" not found.');
  }
}

function refreshTranslationTable(tableBody){
  let count = 20;
  const translationTableBody = shadowRoot.querySelector('.translationTableBody');
  const fontTableBody = shadowRoot.querySelector('.fontTableBody');
  const colorTableBody = shadowRoot.querySelector('.colorTableBody');
  
  
  let tableBodyRows = ``;

  for (let i = 1; i < count; i++) {
      tableBodyRows += `
      <tr rowId="${i}">
          <td>Some stuff</td>
          <td>Some more stuff</td>
      </tr>
      `; 
  }
  
  // Use innerHTML without parentheses
  translationTableBody.innerHTML = tableBodyRows;
  fontTableBody.innerHTML = tableBodyRows;
  colorTableBody.innerHTML = tableBodyRows;
}


// function refreshColorTable(colorData, themeMode) {
//   const colorTableBody = shadowRoot.querySelector('.colorTableBody');
//   const themeHeader = shadowRoot.querySelector('.themeModeText'); // Target the theme column header

//   // 🟢 Update the theme mode text dynamically
//   themeHeader.textContent = `${themeMode} Theme` ;

//   let colorTableBodyRows = ``;

//   for (let key in colorData) {
//     //console.log(`${key}: ${colorData[key]}`);

//     colorTableBodyRows += `
//       <tr rowId="${key}">
//         <td>${key}</td>
//         <td>
//           <div class="semanticValueCell">
//             <div class="colorThumbnail" style="background-color: ${colorData[key]};"></div>
//             <div><span>${key}</span></div>
//           </div>
//         </td>
//       </tr>
//     `;
//   }

//   colorTableBody.innerHTML = colorTableBodyRows;
// }









  