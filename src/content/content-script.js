import { createShadowRoot } from './shadowRoot.js';
import AppContext from './services/appContext.js';
import { textFormatterModal } from './components/textFormatterModal.js';
import { projectLinkModal } from './components/projectLinkModal.js';
import { fetcher } from './utils/dataFetcher.js';
import { elementWatcher } from './services/elementWatcher.js';
import { projectsLinkManager } from './components/projectLinkManager.js';
import { contentScriptCache } from './utils/cache/contentScriptCache.js';
import { handleDbChange } from './services/dbChange.js';

export let activeAI2TextArea = null;

(async () => {
  const shadowRoot = await createShadowRoot();
  AppContext.init({ shadowRoot });

  await textFormatterModal.init();
  await projectLinkModal.init();
  await projectsLinkManager.init();

  await fetcher.fetchProjectsData();
})();

export function sendMessage(message) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, (response) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(response);
      }
    });
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "dbChange") {
    const { table, type, data } = message;
    handleDbChange({ table, type, data });
  }
  
});

  elementWatcher.addElement({
    selector: '.ode-PropertiesComponentName',
    watchText: true,
    onFound: (el) => console.log('Found component name'),
    onTextChange: (newText, oldText, el) => {
      if (newText.endsWith('(Label)')) {
        createEditTextWithThmltModalButton();
      }
    }
  });

  // const toolbarWatcherId = elementWatcher.addElement({
  //   selector: '.ya-Toolbar',
  //   onFound: (element) => {
  //     createTestButton(element);

  //     // Remove watcher after found and processed
  //     elementWatcher.removeElement(toolbarWatcherId);
  //   }
  // });

function createTestButton(toolBarElement) {
  
  const thmltTestButton = document.createElement('div');
  thmltTestButton.setAttribute("thmltTestButtonDiv", "true")
  thmltTestButton.id = 'thmltTestButtonDiv';
  thmltTestButton.innerHTML = `
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
  toolBarElement.querySelector(".left").appendChild(thmltTestButton);

  console.log("Test Button creation successfull");

  thmltTestButton.addEventListener('click', async (e) => {
    handleTextFormatterButtonClick();
    
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
    activeAI2TextArea = textArea;
    

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

        newTd.addEventListener('click', async (e) => {
          const clickedElement = e.target.closest('td[editTextWithThMLT="true"]');

          
          if (clickedElement) {
            
            handleTextFormatterButtonClick();

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

function handleTextFormatterButtonClick(){
  const selectedProjectId = contentScriptCache.getSelectedProjectId();

  if (selectedProjectId === ""){
    projectsLinkManager.render(contentScriptCache.projectCache.getAll());
    projectLinkModal.show();
  } else {
    textFormatterModal.show();
  }

}
