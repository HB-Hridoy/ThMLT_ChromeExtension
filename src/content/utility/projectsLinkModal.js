
import { loadHtmlFragment } from "../../utils/components.js";

export class ProjectsLinkModal {
  constructor(shadowRoot){

    this._shadowRoot = shadowRoot;
    this._linkProjectModalElement = null;

    this._listenersAdded = false;
  }

  async init(){
    try {
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

        if (this._listenersAdded) return;

        this._shadowRoot.getElementById("hide-link-project-modal").addEventListener("click", ()=>{
          this.hide();
        });

      } else {
        console.error("Element #link-project-modal not found in source HTML");
      }
      tempDiv.remove();
    } catch (error) {
      console.error('Error fetching source HTML:', error);
    }
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


