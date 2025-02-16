let selectedTranslationTableRow = null;
let shadowRoot = null;
let textFormatterPopup = null; 
let tarnslationScopeSections = null;
let textFormatterNavTabs = null;
let isPopupOpen = false;
let activeSearchInput = null;

let activeProjectName = "";
let projectName = "";
let translationData = "";
let fontData = "";
let colorData = "";

// Establish a persistent connection (you can name it for clarity)
const port = chrome.runtime.connect({ name: 'persistentConnection' });

// Listen for messages on this port
port.onMessage.addListener((msg) => {
  if (msg.action === "Project Availability") {
    
    if (msg.status === "success") {
      console.log(`${msg.projectName} is available`);

        openTextFormatterPopup();

        setTimeout(() => {
          refreshColorTable(msg.projectData);
        }, 3000);
      openTextFormatterPopup();
    } else {
      console.log(`${msg.projectName} is not available`);
      alert(`${msg.projectName} is not available`);
    }
  
  }
});

class MessageClient {
  /**
   * Sends a message to the service worker (or background script).
   * @param {Object} message - The message object to send.
   * @param {number} [timeout=5000] - Timeout in milliseconds (default: 5000ms).
   * @returns {Promise<Object>} - Resolves with the response message or rejects on error.
   */
  static sendMessage(message, timeout = 5000) {
    return new Promise((resolve, reject) => {
      let timeoutId;

      // Set up a timeout to reject if no response is received
      timeoutId = setTimeout(() => {
        reject(new Error("⏳ Timeout: No response from service worker."));
      }, timeout);

      // Send message and wait for response
      chrome.runtime.sendMessage(message, (response) => {
        clearTimeout(timeoutId); // Clear timeout if we get a response

        if (chrome.runtime.lastError) {
          reject(new Error(`❌ Runtime Error: ${chrome.runtime.lastError.message}`));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// // ✅ **Usage Example:**
// MessageClient.sendMessage({ action: "getData", payload: "hello" })
//   .then(response => {
//     console.log("📩 Response received:", response);
//   })
//   .catch(err => {
//     console.error("🚨 Error:", err.message);
//   });








  /**
   * Creates a new script element named BlockyWorkspaceInjector.js
   */
  (function() {
    
    let script = document.createElement("script");
    script.src = chrome.runtime.getURL("BlockyWorkspaceInjector.js");
    script.onload = function() {
      console.log("BlockyWorkspaceInjector.js loaded.");
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);


    
  })();

  async function createShadowDOM(){
    // Create a host element for the Shadow DOM
    console.log("Creating ThMLT Shadow DOM");
    
    const shadowHost = document.createElement('div');
    shadowHost.id = 'ThMLTShadowDOM';
    document.body.appendChild(shadowHost);
  
    // Attach Shadow DOM
    shadowRoot = shadowHost.attachShadow({ mode: 'open' });
  
    // Load and inject styles inside Shadow DOM
    try {
      const response = await fetch(chrome.runtime.getURL('Extras/textFormatterPopup/textFormatterPopup.css'));
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

    console.log("ThMLT Shadow DOM Creation Successfull");
    
  }
  createShadowDOM();

  class getRefHTML {
    static textFormatterPopup = ``;

    static async getSourceHTML() {
        try {
            // Fetch the HTML content
            
            const response = await fetch(chrome.runtime.getURL('Extras/textFormatterPopup/textFormatterPopup.html'));

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
            const textFormatterPopupElement = tempDiv.querySelector('#textFormatterPopup');

            if (textFormatterPopupElement) {
                // Store the inner text of the element
                getRefHTML.textFormatterPopup = textFormatterPopupElement.innerHTML;

                
                console.log("Successfully stored innerText of #textFormatterPopup");
            } else {
                console.error("Element #textFormatterPopup not found in source HTML");
            }

            tempDiv.remove();


        } catch (error) {
            console.error('Error fetching source HTML:', error);
        }
    }
}

// Call the static method to fetch and process the HTML
getRefHTML.getSourceHTML();


function injectCSS() {

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.type = 'text/css';
  link.href = chrome.runtime.getURL('Extras/textFormatterPopup/textFormatterPopup.css');

  console.log("Attempting to load CSS file from:", link.href);  // Log the generated URL

  link.onload = function() {
    console.log('CSS file loaded successfully!');
  };

  link.onerror = function() {
    console.log('Failed to load CSS file. Check the URL or path.');
  };

  document.head.appendChild(link);
  
}
//injectCSS();

// port.postMessage({ 
//   action: "Project Availability", 
//   projectName: "exTest" 
// });
  
  // Listen for messages.
  // chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  //   if(request.type === "UPDATE_COLOR_THEMES") {
  //     console.log("Received UPDATE_COLOR_THEMES message:", request);
  //     // Send the message into the page via window.postMessage.
  //     window.postMessage({
  //       type: "UPDATE_COLOR_THEMES",
  //       blockType: request.blockType,
  //       componentName: request.componentName,
  //       methodName: request.methodName,
  //       argPosition: request.argPosition,
  //       newArgValue: request.newArgValue
  //     }, "*");
  
  //     // Listen for the response from BlockyWorkspaceInjector.js
  //     function responseListener(event) {
  //       if (event.source !== window) return;
  //       if (event.data && event.data.type === "UPDATE_COLOR_THEMES_RESPONSE") {
  //         console.log("Received response from BlockyWorkspaceInjector.js script:", event.data);
  //         sendResponse({ result: event.data.message });
  //         window.removeEventListener("message", responseListener);
  //       }
  //     }
  //     window.addEventListener("message", responseListener);
  //     return true; // Keep the sendResponse callback alive for asynchronous response.
  //   }else if (request.type === "UPDATE_COLOR_THEMES2") {
  //     // Select the table with the class 'ode-PropertiesPanel'
  //     const propertiesPanelTable = document.querySelector('table.ode-PropertiesPanel');

  //     // Check if the table exists
  //     if (propertiesPanelTable) {
        
  //       // Find the specific row with the 'Text' label
  //       const targetRow = Array.from(propertiesPanelTable.querySelectorAll('tr')).find(row => {
  //         const propertyLabel = row.querySelector('div.ode-PropertyLabel');
  //         return propertyLabel && propertyLabel.textContent.trim() === 'Text';
  //       });

  //       const textArea = targetRow.nextElementSibling.querySelector('.ode-PropertyEditor');
        

  //       if (targetRow) {
  //         console.log('Found the specific table row');

  //         // Select the target <td> element that contains the <div> with class 'ode-PropertyLabel' and text 'Text'
  //         const targetTd = targetRow.querySelector('td:has(div.ode-PropertyLabel)').querySelector('td[align="left"][style*="vertical-align: top;"] img.ode-PropertyHelpWidget').parentElement;

  //         // Check if the target <td> element exists
  //         if (targetTd) {
  //           // Create a new <newTd> element with inline HTML
  //           const newTd = document.createElement('td');
  //           newTd.setAttribute('editTextWithThMLT', 'true');
  //           newTd.setAttribute('align', 'left');
  //           newTd.style.verticalAlign = 'top';
  //           newTd.id = 'my-newTd';
  //           newTd.innerHTML = `
  //             <div class="EditTextWithThMLTButton" style="
  //                                                         position: relative;
  //                                                         display: flex;
  //                                                         align-items: center;
  //                                                         justify-content: center;
  //                                                         gap: 5px;
  //                                                         padding: 4px 10px;
  //                                                         transition: background 0.2s, opacity 0.1s;
  //                                                         color: #444;
  //                                                         font-family: 'Poppins', Helvetica, Arial, sans-serif;
  //                                                         font-weight: 500;
  //                                                         font-size: 1.06em;
  //                                                         white-space: nowrap;
  //                                                         background-color: #a5cf47;
  //                                                         border: 1px solid #444;
  //                                                         border-radius: 4px;
  //                                                         background-image: unset;
  //                                                         text-shadow: unset;
  //                                                         box-shadow: 1px 1px;
  //                                                         cursor: pointer;
  //             ">
  //             <div style="font-size: 0.75rem">ThMLT</div>
  //             </div>
  //           `;

  //           // Insert the newTd into the DOM next to the target <td> element
  //           targetTd.insertAdjacentElement('afterend', newTd);

  //           newTd.addEventListener('click', (e) => {
  //             const clickedElement = e.target.closest('td[editTextWithThMLT="true"]');
  //             if (clickedElement) {
  //                 if (textArea) {
  //                   textArea.value = "success i have done it";
  //                   // Trigger input and change events
  //                   textArea.dispatchEvent(new Event("input", { bubbles: true }));
  //                   textArea.dispatchEvent(new Event("change", { bubbles: true }));
  //                 }
  //             }
  //           });
  //         } else {
  //           console.log('Target <td> element not found.');
  //         }
  //       } else {
  //           console.log('Specific table row not found.');
  //       }
  //     } else {
  //           console.log('Table with class "ode-PropertiesPanel" not found.');
  //     }
  //   }
        
  // });

let lastComponentNameText = "";

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
                  createEditTextWithThMLT();
                  console.log('Creating ThMLT button for the label');
                }
                
            }
        });

        textObserver.observe(propertiesComponentNameElement, { childList: true, subtree: true, characterData: true });

        // Stop looking for the element once found
        observer.disconnect();
    } 
    
    if (projectEditorElement) {
      const activeProjectNameElement = projectEditorElement.querySelector(".ya-ProjectName");
      if (activeProjectNameElement) {
        console.log("Active project name element found! Watching for text changes");

        activeProjectName = activeProjectNameElement.innerText.trim(); 

        // observer to watch for Project Name changes
        const textObserver = new MutationObserver(() => {
          const newProjectName = activeProjectNameElement.innerText.trim(); 

          if (newProjectName !== activeProjectName) { 
            activeProjectName = newProjectName;
            console.log(`[Active Project] ${activeProjectName}`);
          }
        });

        textObserver.observe(propertiesComponentNameElement, { childList: true, subtree: true, characterData: true });
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

          const response = await MessageClient.sendMessage({ 
            action: "Project Availability", 
            projectName: "exTest" 
          });

          if (response.status === "success") {
            console.log(`${response.projectName} is available`);
      
              openTextFormatterPopup();
      
              setTimeout(() => {
                refreshColorTable(response.projectData, response.themeMode);
              }, 500);
            openTextFormatterPopup();
          } else {
            console.log(`${response.projectName} is not available`);
            alert(`${response.projectName} is not available`);
          }
        });
  
}


function createEditTextWithThMLT() {
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
                  port.postMessage({ 
                    action: "Project Availability", 
                    projectName: activeProjectName 
                  });
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
  

function createTextFormatterPopup() {
  if (!textFormatterPopup) {
    // Create the overlay div
    const overlay = document.createElement('div');
    overlay.id = 'overlay';

    shadowRoot.appendChild(overlay);

    textFormatterPopup = document.createElement('div');
    textFormatterPopup.id = 'textFormatterPopup';
    textFormatterPopup.innerHTML = getRefHTML.textFormatterPopup;

    shadowRoot.appendChild(textFormatterPopup);

    console.log("Text formatter popup created inside Shadow DOM");

    // Close button event listener
    shadowRoot.getElementById('closeFormatterPopup').addEventListener('click', closeTextFormatterPopup);

    // Just populates the table body
    const tableBody = shadowRoot.querySelector('.translationTableBody');
    refreshTranslationTable(tableBody);
    

    tableBody.addEventListener('click', function(event) {
      selectTranslationTableRow(event.target.closest('tr'));
        
    });

    // Switch Tabs
    textFormatterNavTabs = shadowRoot.getElementById("textFormatterNavTabs");

    textFormatterNavTabs.addEventListener("click", (e) => {
        switchTabs(e.target);
    });

    // Translation Scopes
    tarnslationScopeSections = shadowRoot.getElementById("tarnslationScopeSections");

    tarnslationScopeSections.addEventListener("click", (e) => {
        switchTranslationScope(e.target);
    });

    const searchTranslationInput = shadowRoot.querySelector('.searchTranslationInput');

    searchTranslationInput.addEventListener('focus', () => {
      activeSearchInput = searchTranslationInput;
    });

    const searchColorInput = shadowRoot.querySelector('.searchColorInput');

    searchColorInput.addEventListener('focus', () => {
      activeSearchInput = searchColorInput;
    });

    // Define the keys that should refocus on input
    const refocusKeys = ['/', 't', 'v', 'p', 'm'];

    // Add a keydown event listener to refocus on the input if the specified keys are pressed
    document.addEventListener('keydown', (event) => {
      if (isPopupOpen) {
        // Check if the pressed key is in the refocusKeys array
        if (refocusKeys.includes(event.key.toLowerCase())) {
          // Use setTimeout to refocus on the input
          setTimeout(() => {
            activeSearchInput.focus(); // Keep the focus on the input field
          }, 0);
        }
      }
        
    });
  }
}

function openTextFormatterPopup() {
  createTextFormatterPopup();
  isPopupOpen = true;
  //document.addEventListener('keydown', disableKeyboard, true);  // Start blocking keyboard shortcuts
  shadowRoot.getElementById('overlay').style.display = 'block';
  textFormatterPopup.style.display = 'block';
}

function closeTextFormatterPopup() {
  if (textFormatterPopup) {
    isPopupOpen = false;
    //document.removeEventListener('keydown', disableKeyboard, true);  // Re-enable keyboard shortcuts
    shadowRoot.getElementById('overlay').style.display = 'none';
    textFormatterPopup.style.display = 'none';
  }
}

function switchTabs(target) {
  const targetId = target.id;
  const targetTab = target;
  const selectedTab = textFormatterNavTabs.querySelector('.textFormatterNavTab[isTabSelected="true"]');

  if (targetTab !== selectedTab) {
      const navIds = ["translation-tab", "font-tab", "color-tab"];

      navIds.forEach(id => {
          const tabScreen = shadowRoot.getElementById(id.replace('-tab', 'Screen'));
          if (id === targetId) {
              tabScreen.style.display = 'block';
              targetTab.setAttribute('isTabSelected', 'true');
              targetTab.classList.replace("textFormatterNavTab", "textFormatterNavTabSelected");
          } else {
              tabScreen.style.display = 'none';
              const tempTab = shadowRoot.getElementById(id);
              tempTab.setAttribute('isTabSelected', 'false');
              tempTab.className = ''; 
              tempTab.classList.add('textFormatterNavTab'); 
          }
      });
  }
}

function switchTranslationScope(target) {
  const targetScope = target;
  const activeScope = tarnslationScopeSections.querySelector('.translationScopeSelectionActive');

  if (targetScope !== activeScope) {
      const scopeElements = Array.from(tarnslationScopeSections.children);

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
  //fontTableBody.innerHTML = tableBodyRows;
  //colorTableBody.innerHTML = tableBodyRows;
}

function selectTranslationTableRow(clickedRow){
  console.log(clickedRow);
  

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

function refreshColorTable(colorData, themeMode) {
  const colorTableBody = shadowRoot.querySelector('.colorTableBody');
  const themeHeader = shadowRoot.querySelector('.themeModeText'); // Target the theme column header

  // 🟢 Update the theme mode text dynamically
  themeHeader.textContent = `${themeMode} Theme` ;

  let colorTableBodyRows = ``;

  for (let key in colorData) {
    //console.log(`${key}: ${colorData[key]}`);

    colorTableBodyRows += `
      <tr rowId="${key}">
        <td>${key}</td>
        <td>
          <div class="semanticValueCell">
            <div class="colorThumbnail" style="background-color: ${colorData[key]};"></div>
            <div><span>${key}</span></div>
          </div>
        </td>
      </tr>
    `;
  }

  colorTableBody.innerHTML = colorTableBodyRows;
}









  