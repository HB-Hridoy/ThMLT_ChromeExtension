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
let translationTableBody = null;
let defaultLanguageElement = null;
let selectedTranslationTableRow = null;

let fontTable = null;
let fontTableBody = null;
let selectedFontTableRow = null;

let colorTable = null;
let colorTableBody = null;
let selectedColorTableRow = null;

let formattedText = null;
let lastComponentNameText = "";

const CACHE_KEYS = {
  TRANSLATION_DATA : 'translationData',
  FONTS_DATA : 'fontsData',
  COLOR_DATA: 'colorData',
  DEFAULT_THEME_MODE: 'defaultThemeMode',

  AI2_SELECTED_PROJECT: 'ai2SelectedProject',
  PREVIOUS_AI2_SELECTED_PROJECT: 'previousAi2SelectedProject',
  HAS_PROJECT_CHANGED: 'hasProjectChanged',

  IS_TRANSLATION_DATA_CHANGED: 'isTranslationDataChanged',
  IS_FONT_DATA_CHANGED: 'isFontDataChanged',
  IS_COLOR_DATA_CHANGED: 'isColorDataChanged'
  
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

  // Get data from chrome.storage.session using a callback
  getFromSessionStorage(key, callback) {
    messageClient.sendMessage({ 
      action: "getSessionStorage", 
      key: key
    }, (error, response) => {
      if (error) {
        console.error(`Error getting key "${key}" from session storage:`, error.message);
        return;
      }
      this.cache[key] = response.value; // Update in-memory cache
      console.log(`Fetched from session storage: ${key} = ${response.value}`);
      callback(response.value);
    });
  }

  // Store data in memory and session storage
  setSessionStorage(key, value, callback = () => {}) {
    messageClient.sendMessage({ 
      action: "setSessionStorage", 
      key: key, 
      value: value 
    }, (error, response) => {
      if (error) {
        console.error(`Error setting key "${key}" in session storage:`, error.message);
        return;
      }
      this.cache[key] = value; // Update in-memory cache
      console.log(`Session storage updated: ${key} = ${value}`);
      callback(response);
    });
  }
}

const SessionCache = new ContentScriptCache();


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

  static show(projectName){
    this._integrateData(projectName);
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

  static refreshFormattedText() {
  
    const translation = selectedTranslationTableRow?.cells[0]?.textContent?.trim() || '#';
    const font = selectedFontTableRow?.cells[0]?.textContent?.trim() || '#';
    const color = selectedColorTableRow?.cells[0]?.textContent?.trim() || '#';
  
    formattedText.textContent = `[${translation}, ${font}, ${color}]`;
  }

  static _integrateData(projectName){
    // Check is data available in cache or not
    if (SessionCache.get(CACHE_KEYS.HAS_PROJECT_CHANGED)){
      console.log(`Fetching data for: ${projectName}`);
      // Check Project Avaiability
      messageClient.sendMessage({ action: "Projects" }, (error, response) => {
        if (error) return console.error("Error:", error.message);

        const projectNames = response.projectNames;
        if (projectNames.includes(projectName)) {

          // Fetch Data from ThMLT DB
          messageClient.sendMessage({ 
            action: "fetchData",
            projectName: projectName,
            translationData: true,
            fontData: true,
            colorData: true
           }, (error, response) => {
            if (error) return console.error("Error:", error.message);

            this.TranslationTable.refreshData(response.translationData, false);
            this._integrateFontData(response.fontData);
            this.ColorTable.refreshData(response.colorData, response.defaultThemeMode);

          });
        } else {
          console.log(`Project '${projectName}' not found in the list of available projects.`);
          this.TranslationTable.clear();
          this.FontTable.clear();
          this.ColorTable.clear();
          defaultLanguageElement.innerText = "Translation (Default Language)";
          
        }
      });
    } else {
      console.log("Cache datat found. Checking for Data Changes");
      
      const changedFlags = {
        action: "fetchData",
        projectName: projectName,
        translationData: false,
        fontData: false,
        colorData: false
      };
      
      const cacheKeys = [
        {
          key: CACHE_KEYS.IS_TRANSLATION_DATA_CHANGED,
          flagKey: 'translationData'
        },
        {
          key: CACHE_KEYS.IS_FONT_DATA_CHANGED,
          flagKey: 'fontData'
        },
        {
          key: CACHE_KEYS.IS_COLOR_DATA_CHANGED,
          flagKey: 'colorData'
        }
      ];
      
      const promises = cacheKeys.map(({ key, flagKey }) => {
        return new Promise((resolve) => {
          SessionCache.getFromSessionStorage(key, (isDataChanged) => {
            if (isDataChanged) {
              changedFlags[flagKey] = true;
            }
            resolve();
          });
        });
      });
      
      Promise.all(promises).then(() => {
        // Fetch Data from ThMLT DB
        messageClient.sendMessage(changedFlags, (error, response) => {
          if (error) return console.error("Error:", error.message);
          if(!response.translationData){
            this.TranslationTable.refreshData(response.translationData, false);
          }else{
            this.TranslationTable.refreshData(CACHE_KEYS.TRANSLATION_DATA, false);
          }

          if(!response.fontData){
            this._integrateFontData(response.fontData);
          }else{
            this._integrateFontData(CACHE_KEYS.FONTS_DATA);
          }

          if(!response.colorData){
            this.ColorTable.refreshData(response.colorData, response.defaultThemeMode);
          } else{
            this.ColorTable.refreshData(CACHE_KEYS.COLOR_DATA, CACHE_KEYS.DEFAULT_THEME_MODE);
          }
        });
      });
    } 
  }

  static _integrateFontData(fontData){
    TextFormatterModal.FontTable.clear();

    fontData.forEach((font) => {
      TextFormatterModal.FontTable.addRow(font.fontTag, font.fontName);
    });
  }

  // A debounce function to limit how often the search input handler runs
  static debounce(func, delay) {
    let timer;
    return function (...args) {
        clearTimeout(timer);
        timer = setTimeout(() => func.apply(this, args), delay);
    };
  }

  static TranslationTable = class {
    static addRow(key, value){
      const newRow = `
                      <tr rowId="${key}">
                          <td>${key}</td>
                          <td>${value}</td>
                      </tr>
                      `;
      translationTableBody.insertAdjacentHTML("beforeend", newRow);
    }
    static selectRow(clickedRow){
      if (!clickedRow) return; // Ignore clicks outside of rows

      // If another row is already selected, revert its background
      if (selectedTranslationTableRow) {
          selectedTranslationTableRow.classList.remove('highlight');
      }

      // If the same row is clicked, deselect it
      if (selectedTranslationTableRow === clickedRow) {
          selectedTranslationTableRow = null; // Reset selection
          TextFormatterModal.refreshFormattedText();
          return;
      }

      // Highlight the clicked row
      clickedRow.classList.add('highlight');
      selectedTranslationTableRow = clickedRow; // Update the selected row
      TextFormatterModal.refreshFormattedText();
    }

    static clear(){
      translationTableBody.innerHTML = "";
    }

    static flattenTranslations(data) {
      const defaultLang = data.DefaultLanguage;
      const translations = {};
    
      for (const key in data.Translations) {
        if (data.Translations.hasOwnProperty(key)) {
          translations[key] = data.Translations[key][defaultLang];
        }
      }
    
      return translations;
    }

    static initializeSearch(){
      const searchInput = shadowRoot.querySelector(".searchTranslationInput");
      // Apply debounce to the search function
      const debouncedSearch = TextFormatterModal.debounce(function() {
        const query = searchInput.value.toLowerCase();
        TextFormatterModal.TranslationTable.search(query);
      }, 300);  // 300ms debounce delay

      searchInput.addEventListener('input', debouncedSearch);
    }

    static search(query) {
      const searchResults = Object.entries(SessionCache.get(CACHE_KEYS.TRANSLATION_DATA))
          .filter(([key, value]) => key.toLowerCase().includes(query) || value.toLowerCase().includes(query))
          .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
          }, {});
  
      this.refreshData(searchResults, true);
    }

    static refreshData(translationData, search = false){
      const translations = search 
        ? translationData 
        : this.flattenTranslations(translationData);

      if (!search) {
        SessionCache.set(CACHE_KEYS.TRANSLATION_DATA, translations);
        defaultLanguageElement.innerText = `Translation (${translationData.DefaultLanguage})`;
      }

      this.clear();

      for (const [key, value] of Object.entries(translations)) {
        this.addRow(key, value);
      }
    }
  }

  static FontTable = class {
    static addRow(fontTag, fontName){
      const newRow = `
                      <tr rowId="${fontTag}">
                          <td>${fontTag}</td>
                          <td>${fontName}</td>
                      </tr>
                      `;
      fontTableBody.insertAdjacentHTML("beforeend", newRow);
    }
    static selectRow(clickedRow){
      if (!clickedRow) return; // Ignore clicks outside of rows

      // If another row is already selected, revert its background
      if (selectedFontTableRow) {
        selectedFontTableRow.classList.remove('highlight');
      }

      // If the same row is clicked, deselect it
      if (selectedFontTableRow === clickedRow) {
        selectedFontTableRow = null; // Reset selection
        TextFormatterModal.refreshFormattedText();
          return;
      }

      // Highlight the clicked row
      clickedRow.classList.add('highlight');
      selectedFontTableRow = clickedRow; // Update the selected row
      TextFormatterModal.refreshFormattedText();
    }

    static clear(){
      fontTableBody.innerHTML = "";
    }
  }

  static ColorTable = class {
    static addRow(semanticName, primitiveValue){

      const newRow = `
                                  <tr rowId="${semanticName}">
                                    <td>${semanticName}</td>
                                    <td>
                                      <div class="semanticValueCell">
                                        <div class="colorThumbnail" style="background-color: ${primitiveValue};"></div>
                                        <div><span>${primitiveValue}</span></div>
                                      </div>
                                    </td>
                                  </tr>
                                `;
    

    colorTableBody.insertAdjacentHTML("beforeend", newRow);
  }
    static selectRow(clickedRow){
      if (!clickedRow) return; // Ignore clicks outside of rows
      // If another row is already selected, revert its background
      if (selectedColorTableRow) {
        selectedColorTableRow.classList.remove('highlight');
      }
      // If the same row is clicked, deselect it
      if (selectedColorTableRow === clickedRow) {
        selectedColorTableRow = null; // Reset selection
        TextFormatterModal.refreshFormattedText();
          return;
      }
      // Highlight the clicked row
      clickedRow.classList.add('highlight');
      selectedColorTableRow = clickedRow; // Update the selected row
      TextFormatterModal.refreshFormattedText();
    }

    static clear(){
      colorTableBody.innerHTML = "";
    }

    static refreshData(colorData, defaultThemeMode, search = false){
    
      if (!search) {
        SessionCache.set(CACHE_KEYS.COLOR_DATA, colorData);
        SessionCache.set(CACHE_KEYS.DEFAULT_THEME_MODE, defaultThemeMode);
      }

      this.clear();

      if (defaultThemeMode) {
        // Update the theme mode text dynamically
        shadowRoot.querySelector('.themeModeText').textContent = `${defaultThemeMode} Theme` ;
      }
      
      for (const semanticName in colorData) {
        const primitiveValue = colorData[semanticName];
        this.addRow(semanticName, primitiveValue);
      }
    }

    static initializeSearch(){
      const searchInput = shadowRoot.querySelector(".searchColorInput");
      // Apply debounce to the search function
      const debouncedSearch = TextFormatterModal.debounce(function() {
        const query = searchInput.value.toLowerCase();
        TextFormatterModal.ColorTable.search(query);
      }, 300);  // 300ms debounce delay

      searchInput.addEventListener('input', debouncedSearch);
    }

    static search(query) {
      const searchResults = Object.entries(SessionCache.get(CACHE_KEYS.COLOR_DATA))
          .filter(([key, value]) => key.toLowerCase().includes(query) || value.toLowerCase().includes(query))
          .reduce((acc, [key, value]) => {
              acc[key] = value;
              return acc;
          }, {});
  
      this.refreshData(searchResults, false, true);
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

  SessionCache.setSessionStorage(CACHE_KEYS.AI2_SELECTED_PROJECT, "exTest");
  SessionCache.set(CACHE_KEYS.HAS_PROJECT_CHANGED, true);

  translationTable = shadowRoot.getElementById("translationTable");
  translationTableBody = translationTable.querySelector("tbody");
  defaultLanguageElement = shadowRoot.getElementById("defaultlanguage");
  TextFormatterModal.TranslationTable.initializeSearch();

  fontTable = shadowRoot.getElementById("fontTable");
  fontTableBody = fontTable.querySelector("tbody");

  colorTable = shadowRoot.getElementById("colorTable");
  colorTableBody = colorTable.querySelector("tbody");
  TextFormatterModal.ColorTable.initializeSearch();

  formattedText = shadowRoot.getElementById("formattedText");
  applyFormattedTextButton = shadowRoot.getElementById("applyFormattedText");

  // Close text formatter button 
  shadowRoot.getElementById('closeFormatterPopup').addEventListener('click', ()=>{
    TextFormatterModal.hide();
  });

  // Switch Tabs
  shadowRoot.getElementById("textFormatterNavTabs").addEventListener("click", (e) => {
      TextFormatterModal.TabManager.switchToTab(e.target.id);
  });


  translationTableBody.addEventListener('click', function(event) {
    TextFormatterModal.TranslationTable.selectRow(event.target.closest('tr'));
  });

  fontTableBody.addEventListener('click', function(event) {
    TextFormatterModal.FontTable.selectRow(event.target.closest('tr'));
  });

  colorTable.querySelector("tbody").addEventListener('click', function(event) {
    TextFormatterModal.ColorTable.selectRow(event.target.closest('tr'));
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
      
        // Observer to detect project name changes
        const projectNameObserver = new MutationObserver(() => {

          const updatedProjectName = projectNameElement.innerText.trim();
          const currentProject = SessionCache.get(CACHE_KEYS.AI2_SELECTED_PROJECT) || "";

          if (updatedProjectName && updatedProjectName !== currentProject) {

            SessionCache.set(CACHE_KEYS.PREVIOUS_AI2_SELECTED_PROJECT, SessionCache.get(CACHE_KEYS.AI2_SELECTED_PROJECT));
            SessionCache.setSessionStorage(CACHE_KEYS.AI2_SELECTED_PROJECT, updatedProjectName);
            SessionCache.set(CACHE_KEYS.HAS_PROJECT_CHANGED, true);

            SessionCache.remove(CACHE_KEYS.COLOR_DATA);
            SessionCache.remove(CACHE_KEYS.FONTS_DATA);
            SessionCache.remove(CACHE_KEYS.TRANSLATION_DATA);
            console.log(`Project changed to  '${updatedProjectName}'`);
          } else {
            console.log(`Project name is unchanged: '${updatedProjectName}'`);
            
            SessionCache.set(CACHE_KEYS.HAS_PROJECT_CHANGED, false);
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

    TextFormatterModal.show(SessionCache.get(CACHE_KEYS.AI2_SELECTED_PROJECT));
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