import { loadHtmlFragment } from "../../utils/components.js";
import { ColorsTableManager } from "./colorsTableManager.js";
import { contentScriptCache } from "../utils/cache/contentScriptCache.js";
import AppContext from "../services/appContext.js";
import { activeAI2TextArea } from "../content-script.js";
import { FontsTableManager } from "./fontTableManager.js";
import { TranslationsTableManager } from "./translationsTableManager.js";
import { debounce } from '../../utils/debounce.js'

class TextFormatterModal {

  constructor(){
    this._shadowRoot = null;
    this._textFormatterModalElement = null;
    this._tabManager = null;

    this._colorTableManager = null;
    this._fontsTableManager = null;
    this._translationsTableManager = null;

    this._formattedTextElement = null;
    this._applyFormattedTextButton = null;
    this._activeSearchInput = null;

    this._translationTable = null;
    this._translationsSearchInputParent = null;
    this._translationsSearchInput = null;
    this._noTranslationScreen = null;

    this._fontsTable = null;
    this._noFontsScreen = null;

    this._colorsTable = null;
    this._colorsSearchInputParent = null;
    this._colorsSearchInput = null;
    this._noColorsScreen = null;

    this._isModalOpen = false;

    this._listenersAdded = false;
    this._initialized = false;

  }

  async init() {
    if (this._initialized) return console.log(`[TEXT FORMATTER MODAL] Already intialized`);

    try {
      this._shadowRoot = AppContext.getShadowRoot();
      this._tabManager = new TabManager(this._shadowRoot);

      this._colorTableManager = new ColorsTableManager();
      this._fontsTableManager = new FontsTableManager();
      this._translationsTableManager = new TranslationsTableManager();

      await this._createTextFormatterModal(this._shadowRoot);

      this._addEventListeners();

    } catch (error) {
      console.error(error);
    }
    
  }

  async _createTextFormatterModal(){
     try {
      // Load the HTML fragment containing the template
      const htmlContent = await loadHtmlFragment('src/content/inject/textFormatterModal.html');
  
      // Parse HTML into a document fragment safely
      const templateWrapper = document.createElement('div');
      templateWrapper.innerHTML = htmlContent;
  
      const template = templateWrapper.querySelector('#textFormatterModalTemplate');
      if (!template || !(template instanceof HTMLTemplateElement)) {
        console.error("Template #textFormatterModalTemplate not found or invalid.");
        return;
      }
  
      // Clone the template content deeply
      const content = document.importNode(template.content, true);
  
      const textFormatterModalOverlay = content.querySelector('#text-formatter-modal-overlay');
      const modal = content.querySelector('#textFormatterModal');
  
      if (!textFormatterModalOverlay || !modal) {
        console.error("Template must contain both #text-formatter-modal-overlay and #textFormatterModal.");
        return;
      }
  
      textFormatterModalOverlay.addEventListener('click', () => this.hide());
  
      // Append to shadowRoot
      this._shadowRoot.appendChild(content);
  
      // store modal reference globally if needed
      this._textFormatterModalElement = modal;
  
      console.log("Text formatter modal initialized inside Shadow DOM using template.");
    } catch (error) {
      console.error("Error initializing text formatter modal:", error);
    }
  }

  _addEventListeners(){

    if (this._listenersAdded) return;

    console.log(`[TEXT FORMATTER MODAL] Adding event listeners`);

    // ========== GLOBAL VARIABLES BEGIN ========== //

    this._formattedTextElement = this._shadowRoot.getElementById("text-formatter-modal-formatted-text");
    this._applyFormattedTextButton = this._shadowRoot.getElementById("text-formatter-modal-apply-button");

    this._translationTable = this._shadowRoot.getElementById("text-formatter-modal-translations-table");
    this._translationsSearchInputParent = this._shadowRoot.querySelector(".text-formatter-modal-translation-search-input-parent");
    this._translationsSearchInput = this._shadowRoot.querySelector(".text-formatter-modal-translation-search-input");
    this._noTranslationScreen = this._shadowRoot.querySelector(".no-translations-screen");

    this._fontsTable = this._shadowRoot.getElementById("text-formatter-modal-fonts-table");
    this._noFontsScreen = this._shadowRoot.querySelector(".no-fonts-screen");

    this._colorsTable = this._shadowRoot.getElementById("text-formatter-modal-colors-table");
    this._colorsSearchInputParent = this._shadowRoot.querySelector(".text-formatter-modal-color-search-input-parent");
    this._colorsSearchInput = this._shadowRoot.querySelector(".text-formatter-modal-color-search-input");
    this._noColorsScreen = this._shadowRoot.querySelector(".no-colors-screen");



    // ========== GLOBAL VARIABLES END ========== //

    // ========== EVENT LISTENERS BEGIN ========== //

    this._shadowRoot.getElementById('hide-text-formatter-modal').addEventListener('click', ()=>{
      this.hide();
    });

    this._applyFormattedTextButton.addEventListener('click', () => {
      this.#applyFormattedTextToAI2TextArea();
      this.hide();
    });

    // Switch Tabs
    this._shadowRoot.getElementById("textFormatterNavTabs").addEventListener("click", (e) => {
        this._tabManager.switchToTab(e.target.id)
    });

    // Disable AI2 Keyboard shortcuts while modal is open or any infput focused
    [this._translationsSearchInput, this._colorsSearchInput].forEach(inputElement => {
      inputElement.addEventListener('focus', () => {
        this._activeSearchInput = inputElement;
      });
    });

    // Define the keys that should refocus on input
    const refocusKeys = ['/', 't', 'v', 'p', 'm'];

    // Add a keydown event listener to refocus on the input if the specified keys are pressed
    document.addEventListener('keydown', (event) => {
      if (this._isModalOpen) {
        // Check if the pressed key is in the refocusKeys array
        if (refocusKeys.includes(event.key.toLowerCase())) {
          // Use setTimeout to refocus on the input
          setTimeout(() => {
            this._activeSearchInput.focus(); // Keep the focus on the input field
          }, 0);
        }
      }
    });

    this._translationsSearchInput.addEventListener('input', debounce(() => {
      this._translationsTableManager.searchRender(this._translationsSearchInput.value);
    }, 300));
    

    this._colorsSearchInput.addEventListener('input', debounce((e) => {
      this._colorTableManager.searchRender(this._colorsSearchInput.value);
    }, 300));


    // ========== EVENT LISTENERS END ========== //
    console.log(`[TEXT FORMATTER MODAL] Event listeners added`);
  }

  show(){

    this._formattedTextElement.textContent = "Please select a translation, font, and color.";
    this._applyFormattedTextButton.classList.toggle("disabled", true);

    const primitivesData = contentScriptCache.primitiveCache.getAll();
    const semanticsData = contentScriptCache.semanticCache.getAll();
    const defaultThemeMode = contentScriptCache.projectCache.get({
      id: contentScriptCache.getSelectedProjectId()
    }).defaultThemeMode;

    console.log(defaultThemeMode);
    

    if (Array.isArray(semanticsData) && semanticsData.length > 0) {
      this._colorTableManager.render(semanticsData, primitivesData, defaultThemeMode);
      this.setColorsScreenVisibility(true);
    } else {
      this.setColorsScreenVisibility(false);
    }

    const fontsData = contentScriptCache.fontCache.getAll();

    if (Array.isArray(fontsData) && fontsData.length > 0) {
      this._fontsTableManager.render(fontsData);
      this.setFontsScreenVisibility(true);
    } else {
      this.setFontsScreenVisibility(false);
    }

    const allTranslations = contentScriptCache.translationCache.getAll();

    if (Array.isArray(allTranslations) && allTranslations.length > 0) {
      const translationsData = allTranslations[0];
      this.setTranslationScreenVisibility(true);
      this._translationsTableManager.render(translationsData.translationData);
    } else {
      this.setTranslationScreenVisibility(false);
    }


    this._tabManager.switchToTab("translation-tab");

    [this._translationsSearchInput, this._colorsSearchInput].forEach(inputElement => {
      inputElement.value = ""; // Clear the input value
    });

    
    this._shadowRoot.getElementById('text-formatter-modal-overlay').style.display = 'block';
    this._textFormatterModalElement.style.display = 'block';

    if (activeAI2TextArea) {
      const oldTextChunks = this.parseFormattedText(activeAI2TextArea.value.trim());
      console.log(`text area found. creating chunks`);
      

      if (oldTextChunks.translation && oldTextChunks.font && oldTextChunks.color){
        this._formattedTextElement.textContent = `${oldTextChunks.translation}, ${oldTextChunks.font}, ${oldTextChunks.color}`
      }

    }

    console.log("Text formatter modal opened");
    
  }

  hide(){
    
    this._shadowRoot.getElementById('text-formatter-modal-overlay').style.display = 'none';
    this._textFormatterModalElement.style.display = 'none';

    console.log("Text formatter modal closed");
    
  }

  getFormattedText() {
    return this._formattedTextElement.textContent;
  }
  
  setFormattedText({ translation, font, color }) {
    // Parse existing values from the current content
    if (this._formattedTextElement.textContent === "Please select a translation, font, and color.") this._formattedTextElement.textContent = "#,#,#";
    const [currentTranslation = '', currentFont = '', currentColor = ''] =
    this._formattedTextElement.textContent.split(',').map(s => s.trim());
  
    // Use new values if provided, otherwise retain old
    const newTranslation = translation !== undefined ? translation : currentTranslation;
    const newFont = font !== undefined ? font : currentFont;
    const newColor = color !== undefined ? color : currentColor;
  
    this._formattedTextElement.textContent = `${newTranslation}, ${newFont}, ${newColor}`;

    if (this._formattedTextElement.textContent.trim() === "#, #, #"){
      this._formattedTextElement.textContent = "Please select a translation, font, and color.";
      this._applyFormattedTextButton.classList.toggle("disabled", true);
    } else {
      this._applyFormattedTextButton.classList.toggle("disabled", false);
    }
  }
  
  #applyFormattedTextToAI2TextArea() {
    const textArea = activeAI2TextArea;
    if (textArea) {
      const remainingText = this.parseFormattedText(textArea.value.trim()).remainingText;
      textArea.value = `[${this._formattedTextElement.textContent}]${remainingText}`;
      // Trigger input and change events
      textArea.dispatchEvent(new Event("input", { bubbles: true }));
      textArea.dispatchEvent(new Event("change", { bubbles: true }));
    }
  }

  parseFormattedText(text) {
    const regex = /^\[([^\[\],]+),([^\[\],]+),([^\[\],]+)\](.*)?$/;
    const match = text.match(regex);

    if (!match) {
      return {
        remainingText: text
      };
    }

    return {
      translation: match[1],
      font: match[2],
      color: match[3],
      remainingText: (match[4] || '').trim()
    };
  }



  setTranslationScreenVisibility(show){
    if (show) {
      this._translationsSearchInputParent.style.display = 'flex';
      this._noTranslationScreen.style.display = 'none';
      this._translationTable.style.display = "block";
    } else {
      this._translationsSearchInputParent.style.display = 'none';
      this._noTranslationScreen.style.display = 'flex';
      this._translationTable.style.display = "none";
    }
  }

  setFontsScreenVisibility(show){
    if (show) {
      this._noFontsScreen.style.display = 'none';
      this._fontsTable.style.display = "block";
    } else {
      this._noFontsScreen.style.display = 'flex';
      this._fontsTable.style.display = "none";
    }
  }

  setColorsScreenVisibility(show){
    if (show) {
      this._colorsSearchInputParent.style.display = 'flex';
      this._noColorsScreen.style.display = 'none';
      this._colorsTable.style.display = "block";
    } else {
      this._colorsSearchInputParent.style.display = 'none';
      this._noColorsScreen.style.display = 'flex';
      this._colorsTable.style.display = "none";
    }
  }

}



class TabManager {

  constructor(){
    this._shadowRoot = AppContext.getShadowRoot();;
    this._defaultTab = "translation-tab";
    this._activeTab = null;
  }

  switchToTab(tabId) {
    const targetTab = this._shadowRoot.getElementById(tabId);

    if (targetTab === this._activeTab) return;

    if (!this._activeTab) {
      this._activeTab = this._shadowRoot.getElementById(this._defaultTab);
    }

    // Update the previously active tab
    this._activeTab.classList.replace('textFormatterNavTabSelected', 'textFormatterNavTab');
    this._activeTab.setAttribute('isTabSelected', 'false');

    // Set the new active tab
    this._activeTab = targetTab;
    this._activeTab.classList.replace('textFormatterNavTab', 'textFormatterNavTabSelected');
    this._activeTab.setAttribute('isTabSelected', 'true');

    // Update tab screens visibility
    Array.from(this._shadowRoot.getElementById("textFormatterNavTabs").children).forEach(tab => {
      const tabScreen = this._shadowRoot.getElementById(tab.id.replace('-tab', '-screen'));
      tabScreen.style.display = tab.id === tabId ? 'block' : 'none';
    });
  }
  
  activeTab() {
    return this._activeTab ? this._activeTab.id : this._defaultTab;
  }
    
}

const textFormatterModal  = new TextFormatterModal();
export { textFormatterModal };
