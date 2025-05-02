
class components {
  constructor() {
    this.escapeHtml = (str) =>
      String(str).replace(/[&<>"']/g, (char) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#039;"
        }[char])
      );
    
  }

  projectCard(data = {}) {
    const {
      projectId = "",
      projectName = "Untitled",
      author = "Unknown",
      version = "1.0.0"
    } = data;

    return `<div project-id="${this.escapeHtml(projectId)}" class="project-card 
                                                    visible 
                                                    max-w-[calc(100%-1rem)] p-6 mb-4 mx-4 
                                                    bg-gray-50 
                                                    border 
                                                    border-gray-200 
                                                    rounded-lg shadow 
                                                    hover:bg-gray-200">

              <div>
                <h5 class="mb-2 text-sm font-bold tracking-tight text-gray-900">${this.escapeHtml(projectName)}</h5>
                <p class="text-xs font-normal text-gray-700">Author: ${this.escapeHtml(author)}</p>
                <p class="text-xs font-normal text-gray-700">Version: ${this.escapeHtml(version)}</p>
              </div> 
            </div>`
  }
}

export default components;
