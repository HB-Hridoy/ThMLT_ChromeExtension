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
  
  // Listen for messages from the popup.
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if(request.type === "UPDATE_COLOR_THEMES") {
      console.log("Received UPDATE_COLOR_THEMES message:", request);
      // Send the message into the page via window.postMessage.
      window.postMessage({
        type: "UPDATE_COLOR_THEMES",
        blockType: request.blockType,
        componentName: request.componentName,
        methodName: request.methodName,
        argPosition: request.argPosition,
        newArgValue: request.newArgValue
      }, "*");
  
      // Listen for the response from BlockyWorkspaceInjector.js
      function responseListener(event) {
        if (event.source !== window) return;
        if (event.data && event.data.type === "UPDATE_COLOR_THEMES_RESPONSE") {
          console.log("Received response from BlockyWorkspaceInjector.js script:", event.data);
          sendResponse({ result: event.data.message });
          window.removeEventListener("message", responseListener);
        }
      }
      window.addEventListener("message", responseListener);
      return true; // Keep the sendResponse callback alive for asynchronous response.
    }else if (request.type === "UPDATE_COLOR_THEMES2") {
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
          console.log('Found the specific table row');

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
                    textArea.value = "success i have done it";
                    // Trigger input and change events
                    textArea.dispatchEvent(new Event("input", { bubbles: true }));
                    textArea.dispatchEvent(new Event("change", { bubbles: true }));
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
        
  });

//   const observer = new MutationObserver(() => {
//     const tree = document.querySelector('.gwt-Tree');
//     if (tree) {
//         console.log("Tree found! Attaching event listener...");
//         let lastClickedTreeItem = null;

//         document.addEventListener('mousedown', (e) => {
//             const treeItem = e.target.closest('.gwt-TreeItem');
//             if (treeItem && treeItem !== lastClickedTreeItem) {
//                 lastClickedTreeItem = treeItem;
//                 const img = treeItem.querySelector('.gwt-Image');

//                 if (img && img.src.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAABhUlEQVRYw+3XIYsCQRTA8T+yYDB4eDZthgMxHFj9AncGq9V0oFyxWy2C1WpZODBarXJhYaPVpAYtBjmDOFfeLoqunjuz3MH5tjjvDfMr85wZuMdfigw2c5TmN8cmc375lfbi3rc6R9jGllco7FNgZhSYnQJeSTcC1/kPQJotCsWWdDRA05/TjAaY+HMmUQClo21YMg/0j4C+aSDJBoXCwUGh2JA0C9Sl2qAhv+pmAVc2aIqUbFbXJFCU2gCAgYyK5oCe1MoAlGXUMwUkWKNQLLAAsFigUKxJmAFqUun4mY5kamaAsVQKfqYgmbEJIC955yjrSDavD3T9DjgMrxu6ukCcpd8Bh+F1w5K4HlC9evpW9YDRVWCkA+TYXwX25MID7R9dUdphAUsuknuezv4pPPuXRSscUJHMZ+Dh4sqMSjhgKJm3QOBdZgzDAFl2KBRfPAQCj9INO7K3Ay0Zf1y8ZnlnQ+tWIMZUxi8XgVeZNSV2v5tqA5E/QCJ/QkX+CIz8GXuP34pvqvUZW0tNCwIAAAAASUVORK5CYII=')) {
//                     console.log('✅ Clicked on the label tree item: from mousedown');
//                     createEditTextWithThMLT();
//                 }
//             }
//         });

//         document.addEventListener('click', (e) => {
//             const treeItem = e.target.closest('.gwt-TreeItem');
//             if (treeItem && treeItem !== lastClickedTreeItem) {
//                 lastClickedTreeItem = treeItem;
//                 const img = treeItem.querySelector('.gwt-Image');

//                 if (img && img.src.includes('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAQAAAD9CzEMAAABhUlEQVRYw+3XIYsCQRTA8T+yYDB4eDZthgMxHFj9AncGq9V0oFyxWy2C1WpZODBarXJhYaPVpAYtBjmDOFfeLoqunjuz3MH5tjjvDfMr85wZuMdfigw2c5TmN8cmc375lfbi3rc6R9jGllco7FNgZhSYnQJeSTcC1/kPQJotCsWWdDRA05/TjAaY+HMmUQClo21YMg/0j4C+aSDJBoXCwUGh2JA0C9Sl2qAhv+pmAVc2aIqUbFbXJFCU2gCAgYyK5oCe1MoAlGXUMwUkWKNQLLAAsFigUKxJmAFqUun4mY5kamaAsVQKfqYgmbEJIC955yjrSDavD3T9DjgMrxu6ukCcpd8Bh+F1w5K4HlC9evpW9YDRVWCkA+TYXwX25MID7R9dUdphAUsuknuezv4pPPuXRSscUJHMZ+Dh4sqMSjhgKJm3QOBdZgzDAFl2KBRfPAQCj9INO7K3Ay0Zf1y8ZnlnQ+tWIMZUxi8XgVeZNSV2v5tqA5E/QCJ/QkX+CIz8GXuP34pvqvUZW0tNCwIAAAAASUVORK5CYII=')) {
//                     console.log('✅ Clicked on the label tree item: from click');
//                     createEditTextWithThMLT();
//                 }
//             }
            
//             // Reset flag after a short delay (prevents multiple rapid clicks from triggering both)
//             setTimeout(() => {
//                 lastClickedTreeItem = null;
//             }, 100);
//         });

        
      
//         observer.disconnect(); // Stop observing once found
//     }
// });

// // Start observing changes in the body until the .gwt-Tree appears
// observer.observe(document.body, { childList: true, subtree: true });

// // ode-PropertiesComponentName
// // Start observing changes in the body until the .ode-PropertiesComponentName appears
// componentNameObserver.observe(document.body, { childList: true, subtree: true });

let lastComponentNameText = "";

/**
 * MutationObserver to watch for the presence of the element with class 'ode-PropertiesComponentName'.
 * Once the element is found, it sets up another MutationObserver to watch for text (Properties Component Name) changes within the element.
 * Creates Edit Text with ThMLT button when the Properties Component Name ends with "(Label)".
 */
const observer = new MutationObserver(() => {
    const propertiesComponentNameElement = document.querySelector('.ode-PropertiesComponentName');

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
});

// Watch the entire document for new elements (since AI2 loads dynamically)
observer.observe(document.body, { childList: true, subtree: true });





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
      console.log('Found the specific table row');

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
                openTextFormatterPopup();
                textArea.value = "success i have done it";
                // Trigger input and change events
                textArea.dispatchEvent(new Event("input", { bubbles: true }));
                textArea.dispatchEvent(new Event("change", { bubbles: true }));
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

  let textFormatterPopup;

  async function createTextFormatterPopup() {
    if (!textFormatterPopup) {
        try {
            const response = await fetch(chrome.runtime.getURL('Extras/textFormatterPopup/textFormatterPopup.html'));
            const htmlContent = await response.text();

            // Create a host element for the Shadow DOM
            const shadowHost = document.createElement('div');
            shadowHost.id = 'textFormatterShadowHost';
            document.body.appendChild(shadowHost);

            // Attach Shadow DOM
            const shadowRoot = shadowHost.attachShadow({ mode: 'open' });

            // Create a temporary DOM element to parse the HTML
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;

            // Find the element with id 'textFormatterPopup'
            const textFormatterDiv = tempDiv.querySelector('#textFormatterPopup');

            if (textFormatterDiv) {
                textFormatterPopup = document.createElement('div');
                textFormatterPopup.id = 'textFormatterPopup';
                textFormatterPopup.classList.add('bg-white', 'border', 'border-gray-200', 'rounded-lg', 'shadow-sm');
                textFormatterPopup.innerHTML = textFormatterDiv.innerHTML;

                shadowRoot.appendChild(textFormatterPopup);

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
                  console.log("Text formatter popup styles created inside Shadow DOM");
              
                } catch (error) {
                    console.error('Failed to fetch Text formatter popup styles CSS:', error);
                }
              

                console.log("Text formatter popup created inside Shadow DOM");

                // Close button event listener
                shadowRoot.getElementById('closeFormatterPopup').addEventListener('click', closeTextFormatterPopup);

                // Switch Tabs
                const textFormatterNavTabs = shadowRoot.getElementById("textFormatterNavTabs");

                textFormatterNavTabs.addEventListener("click", (e) => {
                    const targetId = e.target.id;
                    const targetTab = e.target;
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
                });

                // Translation Scopes
                const tarnslationScopeSections = shadowRoot.getElementById("tarnslationScopeSections");

                tarnslationScopeSections.addEventListener("click", (e) => {
                    const targetScope = e.target;
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
                });
            } else {
                console.log('No div with id "textFormatterPopup" found in the HTML');
            }
        } catch (err) {
            console.error('Error loading the HTML file:', err);
        }
    }
  }


  
  

  // Function to make the popup draggable
// function makePopupDraggable(popup) {
//   const header = popup.querySelector('#popupHeader');
//   let offsetX = 0, offsetY = 0, isDragging = false;

//   header.addEventListener('mousedown', (e) => {
//       isDragging = true;
//       offsetX = e.clientX - popup.getBoundingClientRect().left;
//       offsetY = e.clientY - popup.getBoundingClientRect().top;
//       header.style.cursor = 'grabbing';
//   });

//   document.addEventListener('mousemove', (e) => {
//       if (isDragging) {
//           popup.style.left = `${e.clientX - offsetX}px`;
//           popup.style.top = `${e.clientY - offsetY}px`;
//           popup.style.transform = 'none'; // Disable centering effect during drag
//       }
//   });

//   document.addEventListener('mouseup', () => {
//       isDragging = false;
//       header.style.cursor = 'grab';
//   });
// }




function openTextFormatterPopup() {
  const shadowHost = document.getElementById('textFormatterShadowHost');

  if (shadowHost && shadowHost.shadowRoot) {
      const textFormatterPopup = shadowHost.shadowRoot.getElementById('textFormatterPopup');
      if (textFormatterPopup) {
          textFormatterPopup.style.display = 'block';
          return;
      }
  }

  // If not found, create the popup
  createTextFormatterPopup().then(() => {
      const shadowHost = document.getElementById('textFormatterShadowHost');
      if (shadowHost && shadowHost.shadowRoot) {
          const textFormatterPopup = shadowHost.shadowRoot.getElementById('textFormatterPopup');
          if (textFormatterPopup) {
              textFormatterPopup.style.display = 'block';
          }
      }
  }).catch(err => {
      console.error('Failed to create text formatter popup:', err);
  });
}

function closeTextFormatterPopup() {
  const shadowHost = document.getElementById('textFormatterShadowHost');
  if (shadowHost && shadowHost.shadowRoot) {
      const textFormatterPopup = shadowHost.shadowRoot.getElementById('textFormatterPopup');
      if (textFormatterPopup) {
          textFormatterPopup.style.display = 'none';
      }
  }
}


  