// Inject injected.js into the page so it runs in the page context.

(function() {
    let script = document.createElement("script");
    script.src = chrome.runtime.getURL("BlockyWorkspaceInjector.js");
    script.onload = function() {
      console.log("BlockyWorkspaceInjector.js loaded.");
      this.remove();
    };
    (document.head || document.documentElement).appendChild(script);
  })();

 

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
        console.log('Trying to get Table with class "ode-PropertiesPanel"');
        
        // Find the specific row with the 'Text' label
        const targetRow = Array.from(propertiesPanelTable.querySelectorAll('tr')).find(row => {
          const propertyLabel = row.querySelector('div.ode-PropertyLabel');
          return propertyLabel && propertyLabel.textContent.trim() === 'Text';
        });

        if (targetRow) {
          console.log('Found the specific table row:', targetRow);

          // Select the target <td> element that contains the <div> with class 'ode-PropertyLabel' and text 'Text'
          const targetTd = targetRow.querySelector('td:has(div.ode-PropertyLabel)');

          // Check if the target <td> element exists
          if (targetTd) {
            // Create a new <button> element
            const button = document.createElement('button');
            button.textContent = 'Click Me';
            button.id = 'my-button';
            button.style.marginLeft = '10px'; // Optional: Add some margin for spacing

            // Insert the button into the DOM next to the target <td> element
            targetTd.insertAdjacentElement('afterend', button);
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


  document.getElementById("my-button").addEventListener("click", function() {
    console.log("Button clicked!");
    
  });
  