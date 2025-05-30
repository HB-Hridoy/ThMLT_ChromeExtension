
import { sendMessage } from "../content-script.js";
import { contentScriptCache } from "../utils/cache/contentScriptCache.js";
import { fetcher } from "../utils/dataFetcher.js";
import { projectLinkModal } from "./projectLinkModal.js";
import { textFormatterModal } from "./textFormatterModal.js";
import AppContext from "../services/appContext.js";

class ProjectsLinkManager {
  constructor() {
    this._shadowRoot = null;
    this.container = null;

    this.fetcher = fetcher;
    
    // Cache for current projects in DOM - maps projectId to DOM element
    this.domCache = new Map();
    this._initialized = false;

    
    
  }

  async init() {
    try {
      this._shadowRoot = AppContext.getShadowRoot();

      const container = this._shadowRoot.getElementById("select-project-modal-projects-container");
      this.container = container;

    } catch (error) {
      console.error(error);
    }
    
  }

  /**
   * Main method to render/update the projects list
   * @param {Array} projects - Array of project objects
   */
  render(projects) {
    if (!Array.isArray(projects)) {
      console.warn('Projects data should be an array');
      return;
    }

    // Filter out deleted projects and sort by lastModified (newest first)
    const activeProjects = projects
      .filter(project => !project.deleted)
      .sort((a, b) => b.lastModified - a.lastModified);

    // Check if this is initial render or update
    if (this._isInitialRender()) {
      this._initialRender(activeProjects);
    } else {
      this._updateRender(activeProjects);
    }

    this._initialized = true;
  }

  /**
   * Check if this is the first render (empty container or no cached elements)
   * @returns {boolean}
   */
  _isInitialRender() {
    return !this._initialized || this.container.children.length === 0;
  }

  /**
   * Initial render - populate empty container
   * @param {Array} projects - Sorted projects array
   */
  _initialRender(projects) {
    // Clear container and cache
    this.container.innerHTML = '';
    this.domCache.clear();

    // Create document fragment for efficient DOM manipulation
    const fragment = document.createDocumentFragment();

    projects.forEach(project => {
      const listItem = this._createProjectElement(project);
      fragment.appendChild(listItem);
      this.domCache.set(project.projectId, listItem);
    });

    this.container.appendChild(fragment);
  }

  /**
   * Update render - efficiently update existing list
   * @param {Array} projects - New projects data
   */
  _updateRender(projects) {
    // Create maps for efficient lookups
    const newProjectsMap = new Map(projects.map(p => [p.projectId, p]));
    const existingIds = new Set(this.domCache.keys());
    const newIds = new Set(newProjectsMap.keys());

    // Find projects to add, remove, and potentially update
    const toAdd = [...newIds].filter(id => !existingIds.has(id));
    const toRemove = [...existingIds].filter(id => !newIds.has(id));
    const toCheck = [...newIds].filter(id => existingIds.has(id));

    // Remove obsolete projects
    toRemove.forEach(projectId => {
      const element = this.domCache.get(projectId);
      if (element && element.parentNode) {
        element.parentNode.removeChild(element);
      }
      this.domCache.delete(projectId);
    });

    // Update existing projects that may have changed
    toCheck.forEach(projectId => {
      const project = newProjectsMap.get(projectId);
      const element = this.domCache.get(projectId);
      
      if (element && this._hasProjectChanged(element, project)) {
        this._updateProjectElement(element, project);
      }
    });

    // Add new projects
    if (toAdd.length > 0) {
      const fragment = document.createDocumentFragment();
      
      toAdd.forEach(projectId => {
        const project = newProjectsMap.get(projectId);
        const listItem = this._createProjectElement(project);
        fragment.appendChild(listItem);
        this.domCache.set(projectId, listItem);
      });

      this.container.appendChild(fragment);
    }

    // Re-sort the entire list if needed (only if we added new items or order changed)
    if (toAdd.length > 0 && projects.length > 1) {
      this._sortProjects(projects);
    }
  }

  /**
   * Create a new project DOM element
   * @param {Object} project - Project data
   * @returns {HTMLElement} - Created list item element
   */
  _createProjectElement(project) {
    const li = document.createElement('li');
    li.setAttribute('projectid', project.projectId);
    li.setAttribute('last-modified', project.lastModified.toString());
    
    // Create the project card div
    const div = document.createElement('div');
    div.setAttribute('project-id', project.projectId);
    div.className = 'project-card';
    
    // Create inner content container
    const contentDiv = document.createElement('div');
    
    // Project name
    const nameH5 = document.createElement('h5');
    nameH5.className = 'project-name';
    nameH5.textContent = this.escapeHtml(project.projectName);
    
    // Author
    const authorP = document.createElement('p');
    authorP.className = 'project-author';
    authorP.textContent = `Author: ${this.escapeHtml(project.author)}`;
    
    // Version
    const versionP = document.createElement('p');
    versionP.className = 'project-version';
    versionP.textContent = `Version: ${this.escapeHtml(project.version)}`;
    
    // Last Modified
    const lastModifiedP = document.createElement('p');
    lastModifiedP.className = 'project-last-modified';
    lastModifiedP.textContent = `Last Modified: ${this.escapeHtml(this._formatLastModified(project.lastModified))}`;
    
    // Append all content elements
    contentDiv.appendChild(nameH5);
    contentDiv.appendChild(authorP);
    contentDiv.appendChild(versionP);
    contentDiv.appendChild(lastModifiedP);
    
    div.appendChild(contentDiv);
    li.appendChild(div);

    li.addEventListener('click', async ()=>{
      const projectId = li.querySelector(".project-card").getAttribute("project-id");

      const response = await sendMessage({
        action: "SESSION_STORAGE:SET",
        key: "AI2_SELECTED_PROJECT_ID",
        value: projectId
      });

      if (response.success){
        contentScriptCache.setSelectedProjectId(projectId);
        await this.fetcher.fetchAllData();

        projectLinkModal.hide();
        textFormatterModal.show();
      }
      
      
    });
    
    return li;
  }

  /**
   * Update an existing project DOM element
   * @param {HTMLElement} element - DOM element to update
   * @param {Object} project - New project data
   */
  _updateProjectElement(element, project) {
    // Update attributes
    element.setAttribute('last-modified', project.lastModified.toString());
    
    const projectCard = element.querySelector('.project-card');
    if (projectCard) {
      projectCard.setAttribute('project-id', project.projectId);
    }
    
    // Update project name
    const nameElement = element.querySelector('.project-name');
    if (nameElement) {
      nameElement.textContent = this.escapeHtml(project.projectName);
    }
    
    // Update author
    const authorElement = element.querySelector('.project-author');
    if (authorElement) {
      authorElement.textContent = `Author: ${this.escapeHtml(project.author)}`;
    }
    
    // Update version
    const versionElement = element.querySelector('.project-version');
    if (versionElement) {
      versionElement.textContent = `Version: ${this.escapeHtml(project.version)}`;
    }
    
    // Update last modified
    const lastModifiedElement = element.querySelector('.project-last-modified');
    if (lastModifiedElement) {
      lastModifiedElement.textContent = `Last Modified: ${this.escapeHtml(this._formatLastModified(project.lastModified))}`;
    }
  }

  /**
   * Check if a project has changed compared to its DOM representation
   * @param {HTMLElement} element - DOM element
   * @param {Object} project - Project data
   * @returns {boolean} - True if project has changed
   */
  _hasProjectChanged(element, project) {
    const currentLastModified = element.getAttribute('last-modified');
    const currentName = element.querySelector('.project-name')?.textContent;
    const currentAuthor = element.querySelector('.project-author')?.textContent;
    const currentVersion = element.querySelector('.project-version')?.textContent;
    const currentLastModifiedText = element.querySelector('.project-last-modified')?.textContent;
    
    return (
      currentLastModified !== project.lastModified.toString() ||
      currentName !== this.escapeHtml(project.projectName) ||
      currentAuthor !== `Author: ${this.escapeHtml(project.author)}` ||
      currentVersion !== `Version: ${this.escapeHtml(project.version)}` ||
      currentLastModifiedText !== `Last Modified: ${this.escapeHtml(this._formatLastModified(project.lastModified))}`
    );
  }

  /**
   * Sort projects in the DOM based on lastModified timestamp
   * @param {Array} projects - Sorted projects array (reference for order)
   */
  _sortProjects(projects) {
    // Create array of elements in the desired order
    const orderedElements = projects
      .map(project => this.domCache.get(project.projectId))
      .filter(element => element); // Filter out any null/undefined elements

    // Remove all elements from container
    while (this.container.firstChild) {
      this.container.removeChild(this.container.firstChild);
    }

    // Re-append in correct order
    const fragment = document.createDocumentFragment();
    orderedElements.forEach(element => {
      fragment.appendChild(element);
    });
    
    this.container.appendChild(fragment);
  }

  /**
   * Get current projects data from DOM
   * @returns {Array} - Array of project data objects
   */
  getCurrentProjects() {
    return Array.from(this.container.children).map(li => ({
      projectId: li.getAttribute('projectid'),
      projectName: li.querySelector('.project-name')?.textContent || '',
      author: li.querySelector('.project-author')?.textContent?.replace('Author: ', '') || '',
      version: li.querySelector('.project-version')?.textContent?.replace('Version: ', '') || '',
      lastModified: parseInt(li.getAttribute('last-modified')) || 0
    }));
  }

  /**
   * Clear all projects from the list
   */
  clear() {
    this.container.innerHTML = '';
    this.domCache.clear();
    this._initialized = false;
  }

  /**
   * Get the number of projects currently displayed
   * @returns {number}
   */
  getProjectCount() {
    return this.domCache.size;
  }

  /**
   * Escape HTML to prevent XSS attacks
   * @param {string} text - Text to escape
   * @returns {string} - Escaped text
   */
  escapeHtml(text) {
    if (typeof text !== 'string') {
      return String(text);
    }
    
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Format timestamp to readable date string
   * @param {number} timestamp - Unix timestamp
   * @returns {string} - Formatted date string
   */
  _formatLastModified(timestamp) {
    try {
      const date = new Date(timestamp);
      return date.toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  }
}

const projectsLinkManager = new ProjectsLinkManager();
export { projectsLinkManager };
