
import { loadHtmlFragment } from "../../utils/components.js";
import AppContext from "../services/appContext.js";

class ProjectLinkModal {
  constructor(){

    this._shadowRoot = null;
    this._linkProjectModalElement = null;

    this._listenersAdded = false;
    this._initialized = false;
  }

  async init(){
    if (this._initialized) return console.log(`[PROJECT LINK MODAL] Already intialized`);
    
    try {
      this._shadowRoot = AppContext.getShadowRoot();
      // Get the HTML content as text
      const htmlContent = await loadHtmlFragment('src/content/inject/linkProjectModal.html');

      // Create a temporary div element to parse the HTML content
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = htmlContent;

      // Find the specific element by its ID and get its inner text
      const linkProjectModalSourceElement = tempDiv.querySelector('#link-project-modal');

      if (linkProjectModalSourceElement) {

        this._linkProjectModalElement = document.createElement('div');
        this._linkProjectModalElement.id = 'link-project-modal';
        this._linkProjectModalElement.innerHTML = linkProjectModalSourceElement.innerHTML;

        this._shadowRoot.appendChild(this._linkProjectModalElement);

        console.log("Link project modal created inside Shadow DOM");

      } else {
        console.error("Element #link-project-modal not found in source HTML");
      }
      tempDiv.remove();

      this._addEventListeners();

      console.log(`[PROJECT LINK MODAL] Intialized successfully`);
    } catch (error) {
      console.error('Error fetching source HTML:', error);
    }
  }

  _addEventListeners(){
    if (this._listenersAdded) return;

    console.log(`[PROJECT LINK MODAL] Adding event listeners`);
    
    this._shadowRoot.getElementById("hide-link-project-modal").addEventListener("click", ()=>{
      this.hide();
    });

    console.log(`[PROJECT LINK MODAL] Event listeners added`);

    this._listenersAdded = true

  }

  show(){
    this._linkProjectModalElement.style.display = 'flex';

    console.log("Link project modal opened");
  }

  hide(){
    this._linkProjectModalElement.style.display = 'none';

    console.log("Link project modal hidden");
  }
}

const projectLinkModal = new ProjectLinkModal();
export { projectLinkModal };


