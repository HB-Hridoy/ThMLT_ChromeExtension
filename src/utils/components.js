class components {
  constructor() {
    this.escapeHtml = (str) =>
      String(str).replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          }[char])
      );
  }

  projectCard(data = {}) {
    const {
      projectId = "",
      projectName = "Untitled",
      author = "Unknown",
      version = "1.0.0",
      lastModified = Date.now(),
    } = data;

    return `<div project-id="${this.escapeHtml(
      projectId
    )}" class="project-card visible max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 bg-gray-50 border border-gray-200 rounded-lg shadow hover:bg-gray-200">

              <div>
                <h5 class="project-name mb-2 text-sm font-bold tracking-tight text-gray-900">${this.escapeHtml(
                  projectName
                )}</h5>
                <p class="project-author text-xs font-normal text-gray-700">Author: ${this.escapeHtml(
                  author
                )}</p>
                <p class="project-version text-xs font-normal text-gray-700">Version: ${this.escapeHtml(
                  version
                )}</p>
                 <p class="project-last-modified text-xs font-normal text-gray-700">Last Modified: ${this.escapeHtml(
                   lastModified
                 )}</p>
              </div> 
            </div>`;
  }
}

/**
 * Asynchronously loads an HTML fragment from the extension's resources.
 * @param {string} path - The path to the HTML fragment relative to the extension's root.
 * @returns {Promise<string>} A promise that resolves to the HTML fragment as a string.
 */
async function loadHtmlFragment(path) {
  const extensionUrl = chrome.runtime.getURL(path);

  const res = await fetch(extensionUrl);
  if (!res.ok) {
    throw new Error(`Failed to load HTML fragment from ${extensionUrl}`);
  }

  return await res.text();
}

export { components, loadHtmlFragment };
