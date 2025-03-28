

  //Tabs switching function
  const primitivesTabButton = document.getElementById("primitives-tab");
  const semanticTabButton = document.getElementById("semantic-tab");

  const semanticRowEditButton = document.getElementById("semantic-row-edit-button");
  const semanticRowDeleteButton = document.getElementById("semantic-row-delete-button");

  const addRowToSemanticButton = document.getElementById("add-row-to-semantic-button");
  const addNewSemanticRowInput = document.getElementById("add-new-semantic-row-input");
  const addNewSemanticRowErrors = document.getElementById("add-new-semantic-row-errors");

  const renameSemanticRowButton = document.getElementById("rename-semantic-row-button");
  const editSemanticRowInput = document.getElementById("edit-semantic-row-input");
  const editSemanticRowErrors = document.getElementById("edit-semantic-row-errors");

  const primitiveModalElement = document.getElementById("primitive-modal");
  const primitiveModal = new Modal(primitiveModalElement, {
    onHide: () => {
        document.querySelectorAll(".bg-gray-900\\/50, .bg-gray-900\\/80").forEach(backdrop => {
            backdrop.remove();
        });
    }
  });

  const primitiveModalMode = document.querySelector('h3[primitiveModalMode]');

  const showAddPrimitiveModal = document.getElementById("show-add-primitive-modal");
  const showEditPrimitiveModal = document.getElementById("primitive-edit-button");

  const pm_nameInput = document.getElementById("primitive-modal-name-input");
  const pm_nameInputError = document.getElementById("primitive-modal-name-input-error");

  const pm_colorText = document.getElementById("primitive-modal-color-text");

  const pm_deleteButton = document.getElementById("primitive-modal-delete-button");
  const pm_actionButton = document.getElementById("primitive-modal-action-button");

  //-------------------------

  const semanticModalElement = document.getElementById("semantic-modal");
  const semanticModal = new Modal(semanticModalElement, {
    onHide: () => {
        document.querySelectorAll(".bg-gray-900\\/50, .bg-gray-900\\/80").forEach(backdrop => {
            backdrop.remove();
        });
    }
  });

  const semanticModalMode = document.querySelector('h3[semanticModalMode]');

  const showAddSemanticModal = document.getElementById("show-add-semantic-modal");
  const showEditSemanticModal = document.getElementById("semantic-edit-button");

  const sm_nameInput = document.getElementById("semantic-modal-name-input");
  const sm_nameInputError = document.getElementById("semantic-modal-name-input-error");

  const sm_deleteButton = document.getElementById("semantic-modal-delete-button");
  const sm_actionButton = document.getElementById("semantic-modal-action-button");

  //-----------------

  const themeModalElement = document.getElementById("theme-modal");
  const themeModal = new Modal(themeModalElement, {
    onHide: () => {
        document.querySelectorAll(".bg-gray-900\\/50, .bg-gray-900\\/80").forEach(backdrop => {
            backdrop.remove();
        });
    }
  });

  const themeModalMode = document.querySelector('h3[themeModalMode]');

  const showAddThemeModal = document.getElementById("show-add-theme-modal");

  const tm_nameInput = document.getElementById("theme-modal-theme-name-input");
  const tm_nameInputError = document.getElementById("theme-modal-theme-name-input-error");

  const tm_defaultCheckbox = document.getElementById("default-theme-checkbox");

  const tm_deleteButton = document.getElementById("theme-modal-delete-button");
  const tm_actionButton = document.getElementById("theme-modal-action-button");
  //------------------

  const addNewThemeButton = document.getElementById("add-new-theme-button");
  const newThemeInput = document.getElementById("add-new-theme-input");
  const newThemeInputErrors = document.getElementById("add-new-theme-errors");

  const renameThemeModeButton = document.getElementById("rename-theme-mode-button");
  const deleteThemeModeButton = document.getElementById("delete-theme-mode-button");
  const editThemeModeInput = document.getElementById("edit-theme-mode-input");
  const editThemeModeErrors = document.getElementById("edit-theme-mode-errors");

  const primitiveTable = document.getElementById('primitive-table');
  const primitiveTableBody = document.querySelector("#primitives-table tbody");

  const semanticTable = document.getElementById('semantic-table');
  const semanticTableBody = document.querySelector("#semantic-table tbody");

  const selectPrimitiveModal = document.getElementById("select-primitive-modal");
  const editThemeModeModal = document.getElementById("edit-theme-mode-modal");

  const projectDataDownloadButton = document.getElementById("project-data-download-button");
  const projectDataCopyButton = document.getElementById("project-data-copy-button");
  const injectProjectDataToBlocky = document.getElementById("inject-project-data-to-blocky-button");
  const projectDeleteButton = document.getElementById("delete-project-button");
  const projectDeleteInput = document.getElementById("delete-project-input");

  projectDataDownloadButton.addEventListener("click", ()=>{
    exportProjectAsJson(CacheOperations.activeProject, true);
  });

  projectDataCopyButton.addEventListener("click", async ()=>{

    try {
        const dataToCopy = await exportProjectAsJson(CacheOperations.activeProject, false);
        await navigator.clipboard.writeText(dataToCopy);
        AlertManager.success("Project data copied to clipboard", 2500);
    } catch (err) {
        AlertManager.error("Failed to copy project data to clipboard", 2500);
        console.error("Clipboard copy failed", err);
    }
  });

  injectProjectDataToBlocky.addEventListener("click", async () => {
    const projectData = await exportProjectAsJson(CacheOperations.activeProject, false);
    BlockyInjector.updateColorThemes(projectData);
  })

  projectDeleteButton.addEventListener("click", async ()=>{
    const projectName = CacheOperations.activeProject;
    if (projectDeleteInput.value.trim() === projectName) {
      try {
        await deleteProject(projectName);

        const projectElement = document.querySelector(`div[project-id="${projectName}"]`);
        if (projectElement) {
          projectElement.remove();
        }
        const projectsContainer = document.getElementById("projects-container");
        if (projectsContainer.children.length === 0) { 
          ScreenManager.showNoProjectScreen();
        } else {
          ScreenManager.showProjectsScreen();
        }
        ScreenManager.showHomeScreen();
      } catch (error) {
        console.log(error);
        
      }
      
    }
  });

  projectDeleteInput.addEventListener("input", (e)=>{
    const inputValue = e.target.value.trim();

    if (inputValue !== CacheOperations.activeProject) {
    projectDeleteButton.classList.replace("bg-red-700", "bg-gray-700");
    projectDeleteButton.classList.replace("hover:bg-red-800", "hover:bg-gray-800");
    }else{
    projectDeleteButton.classList.replace("bg-gray-700", "bg-red-700");
    projectDeleteButton.classList.replace("hover:bg-gray-800", "hover:bg-red-800");
    }
    
  });
  
  
  document.getElementById("color-screen-back-button").addEventListener("click", () => {
    ScreenManager.showProjectManagementScreen();
  });


  // open primitives tab
  primitivesTabButton.addEventListener('click', () => {
    SwitchTabs("primitives");
    SessionManager.setColorTab(SessionManager.PRIMITIVES_COLOR_TAB);
  });
  // Open semantic screen
  semanticTabButton.addEventListener('click', () => {
      SwitchTabs("semantic");
      SessionManager.setColorTab(SessionManager.SEMANTIC_COLOR_TAB);
  });

  function SwitchTabs(tabName) {

    const availableTabs = ["primitives", "semantic"];
    availableTabs.forEach(tab => {
      document.getElementById(`${tab}-screen`).classList.replace("visible", "hidden");
      document.getElementById(`${tab}-tab`).className = "inline-block p-2 hover:text-blue-600";
    });
    
    document.getElementById(`${tabName}-screen`).classList.replace("hidden", "visible");
    document.getElementById(`${tabName}-tab`).className = "inline-block p-2 border-b-2 rounded-t-lg border-blue-300 bg-blue-600 text-white";
  }


  //Primitives Screen

  // Adding event listener for hover functionality to show the delete button
  primitiveTableBody.addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      const rowId = parentRow.getAttribute("primitive-row-index");
      if(rowId){
        const editButtonContainer = parentRow.querySelector("#color-box-parent");
        showEditPrimitiveModal.classList.replace("hidden", "flex");
        showEditPrimitiveModal.setAttribute("primitive-row-index", rowId);
        editButtonContainer.appendChild(showEditPrimitiveModal);

      }
      
    }
  }, true); // Use capture phase for this to run first

  primitiveTableBody.addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      showEditPrimitiveModal.classList.replace("felx", "hidden");
    }
  }, true); // Use capture phase for this to run first

  pm_nameInput.addEventListener("input", () => {
    checkErrorsInPrimitiveModal();
  });
  
  showAddPrimitiveModal.addEventListener("click", () =>{

    // Reset action button to default
    replaceClass(pm_actionButton, "bg-", "bg-gray-500");
    replaceClass(pm_actionButton, "hover:bg-", "hover:bg-gray-600");
    pm_actionButton.disabled = true;
    pm_actionButton.innerHTML = "Add new primitive";

    pm_deleteButton.classList.add("hidden");

    // If there's an open pickr, close it before opening the new one
    if (pickrInstance && pickrInstance.isOpen()) {
      pickrInstance.hide();
    }

    pm_nameInputError.classList.toggle("hidden", true);
    pm_nameInput.style.borderColor = "";

    primitiveModalMode.setAttribute("primitiveModalMode", "add");
    primitiveModalMode.innerHTML = "Add New Primitive";

    pm_nameInput.value = "";

  });

  showEditPrimitiveModal.addEventListener("click", ()=> {

    // Reset action button to default
    replaceClass(pm_actionButton, "bg-", "bg-gray-500");
    replaceClass(pm_actionButton, "hover:bg-", "hover:bg-gray-600");
    pm_actionButton.disabled = true;
    pm_actionButton.innerHTML = "Update Primitive";

    pm_deleteButton.classList.remove("hidden");
    // If there's an open pickr, close it before opening the new one
    if (pickrInstance && pickrInstance.isOpen()) {
      pickrInstance.hide();
    }

    pm_nameInputError.classList.toggle("hidden", true);
    pm_nameInput.style.borderColor = "";

    primitiveModalMode.setAttribute("primitiveModalMode", "edit");
    primitiveModalMode.innerHTML = "Edit Primitive";

    const rowId = showEditPrimitiveModal.getAttribute("primitive-row-index");
    const row = primitiveTableBody.querySelector(`tr[primitive-row-index = "${rowId}"]`);

    const primitiveName = row.querySelector("#primitive-name").textContent.trim();
    const primitiveValue = row.querySelector("#color-text").textContent.trim();

    primitiveModalElement.setAttribute("primitiveName", primitiveName);
    primitiveModalElement.setAttribute("primitiveValue", primitiveValue);

    pm_nameInput.value = primitiveName;
    pickrInstance.setColor(primitiveValue);
    pm_colorText.textContent = primitiveValue;

    document.querySelector(".pcr-last-color").style.setProperty("--pcr-color", primitiveValue);

  });

  pm_actionButton.addEventListener("click", async () => {
    const modalMode = primitiveModalMode.getAttribute("primitiveModalMode");

    if (modalMode === "add") {
      try {
        const primitiveName = pm_nameInput.value.trim();
        const primitiveVaule = pm_colorText.textContent.trim();
        const result = await addPrimitiveColor(CacheOperations.activeProject, primitiveName, primitiveVaule, currentPrimitiveRowId);
        AlertManager.success(result, 2500);
        addNewRowToPrimitiveTable(primitiveName, primitiveVaule);
  
        primitiveModal.hide();
      } catch (error) {
        AlertManager.error(error, 2500);
      }
    } else if (modalMode === "edit") {
      const rowId = showEditPrimitiveModal.getAttribute("primitive-row-index");
      const row = primitiveTableBody.querySelector(`tr[primitive-row-index = "${rowId}"]`);

      const primitiveNameElement = row.querySelector("#primitive-name");
      const primiitveValueElement = row.querySelector("#color-text");
      const primiitveColorBoxElement = row.querySelector("#color-box");

      const primitiveName = primitiveNameElement.textContent.trim();
      const primitiveValue = primiitveValueElement.textContent.trim();

      const newPrimitiveName = pm_nameInput.value.trim();
      const newPrimitiveValue = pm_colorText.innerText.trim();

      if (primitiveName !== newPrimitiveName || primitiveValue !== newPrimitiveValue) {
        try {
          const result = await updatePrimitive(CacheOperations.activeProject, primitiveName, newPrimitiveName, newPrimitiveValue, "@default");
          primitiveModal.hide();
          AlertManager.success(result, 2500);

          //Sync Primitive Data to Semantic Table
          semanticTableBody.querySelectorAll(`td.semantic-table-cell.semantic-value-cell`).forEach(cell => {
            const thumbnailElement = cell.querySelector(`.semantic-color-thumbnail`);
            const semanticNameElement = cell.querySelector(`.semantic-pill-text`);

            semanticNameElement.innerHTML = newPrimitiveName;
            thumbnailElement.style.backgroundColor = newPrimitiveValue;    
          
          });

          primitiveNameElement.innerHTML = newPrimitiveName;
          primiitveValueElement.innerHTML = newPrimitiveValue;
          primiitveColorBoxElement.style.backgroundColor = newPrimitiveValue;

        } catch (error) {
          console.error(error);
          AlertManager.error(error);
        }
      }
    }
  });

  pm_deleteButton.addEventListener("click", async () => {
    const rowId = showEditPrimitiveModal.getAttribute("primitive-row-index");
    const row = primitiveTableBody.querySelector(`tr[primitive-row-index = "${rowId}"]`);
    const primitiveName = row.querySelector("#primitive-name").textContent.trim();
    const message = `Are sure to delete primitive <p class="text-red-600 font-bold">${primitiveName}</p> permanently?`

    openConfirmation(message, async () => {
      try {
        const result = await deletePrimitiveColor(CacheOperations.activeProject, primitiveName);

        primitiveTableBody.removeChild(row);
        AlertManager.success(result, 2500); 
      } catch (error) {
        AlertManager.error(error, 2500);
      }
    });

  });

  const colorTextObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'childList') {
        if (pm_colorText.innerText.trim() !== primitiveModalElement.getAttribute("primitiveName") && primitiveModalElement.classList.contains("flex")) {
          replaceClass(pm_actionButton, "bg-", "bg-blue-700");
          replaceClass(pm_actionButton, "hover:bg-", "hover:bg-blue-800");
          pm_actionButton.disabled = false;
        }
        
      }
    });
  });

  colorTextObserver.observe(pm_colorText, { childList: true });

  function checkErrorsInPrimitiveModal() {
    // Reset action button to default
    replaceClass(pm_actionButton, "bg-", "bg-gray-500");
    replaceClass(pm_actionButton, "hover:bg-", "hover:bg-gray-600");
    pm_actionButton.disabled = true;

    const primitiveName = primitiveModalElement.getAttribute("primitiveName");
    const inputValue = pm_nameInput.value.trim();
    let errorMessage = "";

    if (!inputValue) {
      errorMessage = "Primitive name is required";
    } else if (CacheOperations.getAllPrimitiveNames().includes(inputValue) && primitiveName !== inputValue) {
      errorMessage = "Primitive name already exist!";
    } else if (!nameRegex.test(inputValue)) {
      errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
    }
    
    if (errorMessage) {
      pm_nameInputError.innerHTML = errorMessage;
      pm_nameInputError.classList.remove("hidden");

      pm_nameInput.style.borderColor = "red";

      replaceClass(pm_actionButton, "bg-", "bg-gray-500");
      replaceClass(pm_actionButton, "hover:bg-", "hover:bg-gray-600");
      pm_actionButton.disabled = true;

    } else {
      pm_nameInputError.classList.add("hidden");
      replaceClass(pm_actionButton, "bg-", "bg-blue-700");
      replaceClass(pm_actionButton, "hover:bg-", "hover:bg-blue-800");
      pm_actionButton.disabled = false;
    }

    if (primitiveName === inputValue) {
      replaceClass(pm_actionButton, "bg-", "bg-gray-500");
      replaceClass(pm_actionButton, "hover:bg-", "hover:bg-gray-600");
      pm_actionButton.disabled = true;
    }
  }


  //Semantic Screen

  // Show row edit button on semantic table row hover
  document.querySelector("#semantic-table tbody").addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      const rowId = parentRow.getAttribute("data-index");
      if(rowId){
        const editButtonContainer = document.getElementById("semantic-row-edit-button-container-"+rowId);
        showEditSemanticModal.classList.replace("hidden", "flex");
        showEditSemanticModal.setAttribute("data-index", rowId);
        showEditSemanticModal.setAttribute("semantic-row-index", rowId);
        editButtonContainer.appendChild(showEditSemanticModal);
      }
      
    }
  }, true); 

  // hide row edit button on semantic table row hover
  document.querySelector("#semantic-table tbody").addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      showEditSemanticModal.classList.replace("felx", "hidden");
    }
  }, true); 

  sm_nameInput.addEventListener("input", () => {
    checkErrorsInSemanticModal();
  });
  
  showAddSemanticModal.addEventListener("click", () =>{

    // Reset action button to default
    replaceClass(sm_actionButton, "bg-", "bg-gray-500");
    replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
    sm_actionButton.disabled = true;
    sm_actionButton.innerHTML = "Add Semantic";

    sm_deleteButton.classList.add("hidden");

    sm_nameInputError.classList.toggle("hidden", true);
    sm_nameInput.style.borderColor = "";

    semanticModalMode.setAttribute("semanticModalMode", "add");
    semanticModalMode.innerHTML = "Add New Semantic";

    sm_nameInput.value = "";

  });

  showEditSemanticModal.addEventListener("click", ()=> {

    // Reset action button to default
    replaceClass(sm_actionButton, "bg-", "bg-gray-500");
    replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
    sm_actionButton.disabled = true;
    sm_actionButton.innerHTML = "Update Semantic";

    sm_deleteButton.classList.remove("hidden");

    sm_nameInputError.classList.toggle("hidden", true);
    sm_nameInput.style.borderColor = "";

    semanticModalMode.setAttribute("semanticModalMode", "edit");
    semanticModalMode.innerHTML = "Edit Semantic";

    const rowId = showEditSemanticModal.getAttribute("semantic-row-index");
    
    const row = semanticTableBody.querySelector(`tr[semantic-row-index = "${rowId}"]`);

    const semanticName = row.querySelector(".semantic-name").textContent.trim();
    semanticModalElement.setAttribute("semanticName", semanticName);

    sm_nameInput.value = semanticName;

  });

  sm_actionButton.addEventListener("click", async () => {
    const modalMode = semanticModalMode.getAttribute("semanticModalMode");

    if (modalMode === "add") {
      try {
        const semanticName = sm_nameInput.value.trim();
        let semanticValues = [];

        for (const themeMode of CacheOperations.getAllThemeModes()) {
          await addSemantic(CacheOperations.activeProject, semanticName,"Click to link color", themeMode, currentSemanticRowId);
          semanticValues.push("Click to link color");
        }

        if (semanticValues.length === CacheOperations.getAllThemeModes().length) {
          addNewRowToSemanticTable(semanticName, semanticValues, CacheOperations.getAllThemeModes());
        }
      } catch (error) {
        AlertManager.error(error, 2500);
        console.error(error);
        
      }
    } else if (modalMode === "edit") {
      const rowId = showEditSemanticModal.getAttribute("semantic-row-index");
      const row = semanticTableBody.querySelector(`tr[semantic-row-index="${rowId}"]`);

      const selectedSemanticCell = row.querySelector(".semantic-name");

      const oldSemanticName = selectedSemanticCell.textContent.trim();
      const newSemanticName = sm_nameInput.value.trim()
      

      try {
        for (const themeMode of CacheOperations.getAllThemeModes()) {
          await updateSemantic(CacheOperations.activeProject, oldSemanticName, newSemanticName, themeMode, "@default", "@default", false);
        }
        selectedSemanticCell.textContent = newSemanticName;
        console.log(...Logger.multiLog(
          ["[SUCCESS]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
          ["Renamed semantic"],
          [oldSemanticName, Logger.Types.ERROR, Logger.Formats.BOLD],
          ["=>"],
          [newSemanticName, Logger.Types.SUCCESS, Logger.Formats.BOLD]
        ));
        
        AlertManager.success("Semantic updated successfully", 2500);
      } catch (error) {
        console.error(error);
      }
    }

    semanticModal.hide();
    
  });

  sm_deleteButton.addEventListener("click", async () => {

    const rowId = showEditSemanticModal.getAttribute("semantic-row-index");
    const row = semanticTableBody.querySelector(`tr[semantic-row-index = "${rowId}"]`);

    const semanticName = semanticModalElement.getAttribute("semanticname");
    const message = `Are sure to delete semantic <p class="text-red-600 font-bold">${semanticName}</p> permanently?`

    openConfirmation(message, async () => {
      try {
        const result = await deleteSemantic(CacheOperations.activeProject, semanticName);

        semanticTableBody.removeChild(row);
        AlertManager.success(result, 2500); 
      } catch (error) {
        AlertManager.error(error, 2500);
      }
    });

  });

  function checkErrorsInSemanticModal() {
    // Reset action button to default
    replaceClass(sm_actionButton, "bg-", "bg-gray-500");
    replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
    sm_actionButton.disabled = true;

    const semanticName = semanticModalElement.getAttribute("semanticName");
    const inputValue = sm_nameInput.value.trim();
    let errorMessage = "";

    if (!inputValue) {
      errorMessage = "Semantic name is required";
    } else if (CacheOperations.getAllSemanticNames().includes(inputValue) && semanticName !== inputValue) {
      errorMessage = "Semantic name already exist!";
    } else if (!nameRegex.test(inputValue)) {
      errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
    }
    
    if (errorMessage) {
      sm_nameInputError.innerHTML = errorMessage;
      sm_nameInputError.classList.remove("hidden");

      sm_nameInput.style.borderColor = "red";

      replaceClass(sm_actionButton, "bg-", "bg-gray-500");
      replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
      sm_actionButton.disabled = true;

    } else {
      sm_nameInputError.classList.add("hidden");
      sm_nameInput.style.borderColor = "";

      replaceClass(sm_actionButton, "bg-", "bg-blue-700");
      replaceClass(sm_actionButton, "hover:bg-", "hover:bg-blue-800");
      sm_actionButton.disabled = false;
    }

    if (semanticName === inputValue) {
      replaceClass(sm_actionButton, "bg-", "bg-gray-500");
      replaceClass(sm_actionButton, "hover:bg-", "hover:bg-gray-600");
      sm_actionButton.disabled = true;
    }
    
  }

  showAddThemeModal.addEventListener("click", () => { 
    themeModalElement.setAttribute("themeName", "");
    tm_nameInput.value = "";
    tm_nameInputError.classList.toggle("hidden", true);
    tm_nameInput.style.borderColor = "";
    document.getElementById("default-theme-checkbox-container").classList.toggle("hidden", true);

    // Reset action button to default
    replaceClass(tm_actionButton, "bg-", "bg-gray-500");
    replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
    tm_actionButton.disabled = true;

    tm_deleteButton.classList.toggle("hidden", true);

    tm_actionButton.innerHTML = "Add Theme";
    themeModalMode.setAttribute("themeModalMode", "add");
    themeModalMode.innerHTML = "Add New Theme";

    // themeModal.show();
  });

  tm_nameInput.addEventListener("input", () => {
    checkErrorsInThemeModal();
  });

  tm_defaultCheckbox.addEventListener("change", () => {
    if (themeModalMode.getAttribute("themeModalMode") === "edit") {
      replaceClass(tm_actionButton, "bg-", tm_defaultCheckbox.checked ? "bg-blue-700" : "bg-gray-500");
      replaceClass(tm_actionButton, "hover:bg-", tm_defaultCheckbox.checked ? "hover:bg-blue-800" : "hover:bg-gray-600");
      tm_actionButton.disabled = !tm_defaultCheckbox.checked;
    }
  });
  function checkErrorsInThemeModal() {

    // Reset action button to default
    replaceClass(tm_actionButton, "bg-", "bg-gray-500");
    replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
    tm_actionButton.disabled = true;

    const themeName = themeModalElement.getAttribute("themeName").toLowerCase() || "";
    
    const inputValue = tm_nameInput.value.trim().toLowerCase();
    let errorMessage = "";

    if (!inputValue) {
      errorMessage = "Theme name is required";
    } else if (
      CacheOperations.getAllThemeModes()
      .map(mode => mode.toLowerCase())
      .includes(inputValue) &&
      themeName !== inputValue
    ) {
      errorMessage = "Theme already exist!";
    } else if (!nameRegex.test(inputValue)) {
      errorMessage = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
    }
    
    if (errorMessage) {
      tm_nameInputError.innerHTML = errorMessage;
      tm_nameInputError.classList.remove("hidden");

      tm_nameInput.style.borderColor = "red";

      replaceClass(tm_actionButton, "bg-", "bg-gray-500");
      replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
      tm_actionButton.disabled = true;

    } else {
      tm_nameInputError.classList.add("hidden");
      tm_nameInput.style.borderColor = "";

      replaceClass(tm_actionButton, "bg-", "bg-blue-700");
      replaceClass(tm_actionButton, "hover:bg-", "hover:bg-blue-800");
      tm_actionButton.disabled = false;
    }

    if (themeName === inputValue) {
      replaceClass(tm_actionButton, "bg-", "bg-gray-500");
      replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
      tm_actionButton.disabled = true;
    }

    if (themeModalMode.getAttribute("themeModalMode") === "edit" && tm_defaultCheckbox.checked) {
      replaceClass(tm_actionButton, "bg-", "bg-blue-700");
      replaceClass(tm_actionButton, "hover:bg-", "hover:bg-blue-800");
      tm_actionButton.disabled = false;
    }
    
  }

  tm_actionButton.addEventListener("click", async () => {
    const modalMode = themeModalMode.getAttribute("themeModalMode");
    if (modalMode === "add") {
      addNewTheme(tm_nameInput.value.trim());
    } else if (modalMode === "edit") {
      const themeMode = themeModalElement.getAttribute("themeName");
      const newThemeMode = tm_nameInput.value.trim();

      try {
        if (themeMode !== newThemeMode) {
          await renameThemeMode(CacheOperations.activeProject, themeMode, newThemeMode);
          renameThemeInSemanticTable(themeMode, newThemeMode);
          CacheOperations.renameThemeMode(themeMode, newThemeMode);
        }
      
        if (tm_defaultCheckbox.checked) {
          await updateDefaultThemeMode(CacheOperations.activeProject, newThemeMode);
          CacheOperations.defaultThemeMode = newThemeMode;

          // Update default-theme-header attribute for semantic table header row
          const headerCells = document.querySelectorAll('#semantic-table-header-row td[theme-mode]');
          headerCells.forEach(cell => {
            const themeMode = cell.getAttribute('theme-mode');
            if (themeMode === CacheOperations.defaultThemeMode) {
              cell.setAttribute('default-theme-header', 'true');
              cell.style.backgroundColor = "#93c4fd";
              
            } else {
              cell.setAttribute('default-theme-header', 'false');
              cell.style.backgroundColor = "#fff";
            }
          });
        }
      
        themeModal.hide();
        AlertManager.success("Theme updated successfully", 1500);
      } catch (error) {
        console.log(...Logger.multiLog(
          ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
          [error, Logger.Types.ERROR]
        ));
      }
      
    }
  });

  tm_deleteButton.addEventListener("click", () => {

    const themeMode = themeModalElement.getAttribute("themeName");

    if (CacheOperations.defaultThemeMode === themeMode) {
      console.log(...Logger.multiLog(
        ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
        ["Cannot delete default theme mode", Logger.Types.ERROR]
      ));
      AlertManager.error("Cannot delete default theme mode", 2000);
      themeModal.hide();
      return;
    }
    
    const message = `Are sure to delete theme mode <p class="text-red-600 font-bold">${themeMode}</p> permanently?`

    openConfirmation(message, async () => {
      try {
        await deleteTheme(CacheOperations.activeProject, themeMode);
        deleteThemeFromSemanticTable(themeMode);
        CacheOperations.deleteThemeMode(themeMode);
        
      } catch (error) {
        console.log(...Logger.multiLog(
          ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
          [error, Logger.Types.ERROR]
        ));
      }
    });

  });

  document.getElementById("theme-modal-close-button").addEventListener("click", () =>{
    themeModal.hide();
  });


  // Close primitives modal
  document.getElementById("close-primitive-modal").addEventListener("click", function(){
    CloseSelectPrimitiveModal();
   
  });

  document.getElementById("select-primitive-modal-primitives-container").addEventListener("click", async (e) =>{
    
    const target = e.target;
    if (target.closest("li[data-index][data-primitive-name][data-primitive-value]")){

      try {
        const liElement = target.closest("li[data-index][data-primitive-name][data-primitive-value]");
        
        const dataIndex = liElement.getAttribute("data-index");
        const primitiveName = liElement.getAttribute("data-primitive-name");
        const primitiveValue = liElement.getAttribute("data-primitive-value");

        const themeMode = selectPrimitiveModal.getAttribute("theme-mode");
        const semanticName = selectPrimitiveModal.getAttribute("semantic-name");

        await updateSemantic(CacheOperations.activeProject, semanticName, "@default", themeMode, primitiveName, "@default", true);

        const tableBody = document.querySelector("#semantic-table tbody");
        // Get the <td> element with the specific data-index and class
        const targetTd = tableBody.querySelector(`td.semantic-value-cell[data-index="${dataIndex}"][theme-mode="${themeMode}"]`);

        targetTd.querySelector(".semantic-color-thumbnail").style.backgroundColor = primitiveValue;
        targetTd.querySelector(".semantic-pill-text").textContent = `/ ${primitiveName}`;

        const div = targetTd.querySelector(".semantic-mode-value");

        if (div.classList.contains("bg-red-200")) {
          div.classList.replace("bg-red-200", "bg-white");
        }

        CloseSelectPrimitiveModal();
        
      } catch (error) {
        console.error(error);
        
      }
      
    }
    
    
  });
  


  semanticTableBody.addEventListener("click", async function (event) {
    const target = event.target;

    if (target.closest(".semantic-value-cell")){
      //console.log(target.closest(".semantic-value-cell"));

      const parentTd = target.closest('td');
      const dataIndex = parentTd ? parentTd.getAttribute('data-index') : null;
      const semanticName = CacheOperations.getAllSemanticNames()[dataIndex - 1];
      const themeMode = parentTd ? parentTd.getAttribute('theme-mode') : null;

      ShowSelectPrimitiveModal(dataIndex, themeMode, semanticName);
    } else if (target.tagName === "TD" && target.getAttribute("theme-mode")) {

      const isDefaultTheme = target.getAttribute("default-theme-header");

      const themeMode = target.getAttribute("theme-mode")
      themeModalElement.setAttribute("themeName", themeMode);
      tm_nameInput.value = themeMode;
      tm_nameInputError.classList.toggle("hidden", true);
      tm_nameInput.style.borderColor = "";
      document.getElementById("default-theme-checkbox-container").classList.toggle("hidden", false);

      if (isDefaultTheme === "true") {
        tm_defaultCheckbox.checked = true;
        tm_defaultCheckbox.disabled = true;
      } else {
        tm_defaultCheckbox.checked = false;
        tm_defaultCheckbox.disabled = false;
      }

      // Reset action button to default
      replaceClass(tm_actionButton, "bg-", "bg-gray-500");
      replaceClass(tm_actionButton, "hover:bg-", "hover:bg-gray-600");
      tm_actionButton.disabled = true;

      tm_deleteButton.classList.toggle("hidden", false);

      tm_actionButton.innerHTML = "Update Theme";
      themeModalMode.setAttribute("themeModalMode", "edit");
      themeModalMode.innerHTML = "Edit Theme";

      themeModal.show();
    }
    
    
  });


  function addNewRowToSemanticTable(semanticName, semanticValues, themeModes){

    const tableBody = document.querySelector("#semantic-table tbody");
    
    let semanticValueCells =""; 

    for (let i = 0; i < themeModes.length; i++) {
      const semanticValue = semanticValues[i] || '';
      semanticValueCells = semanticValueCells + CreateElement.semanticTableValueCell(currentSemanticRowId, semanticValue, themeModes[i]);
      // semanticValueCells = semanticValueCells +`
      //                       <td class="semantic-table-cell semantic-value-cell" data-index = "${currentSemanticRowId}" theme-mode = ${themeModes[i]}>
      //                           <div class="semantic-mode-value semantic-mode-cell hide-border ${semanticValue === "Click to link color" ? 'bg-red-200' : 'bg-white'} bg-red-200">
      //                               <div class="semantic-alias-pill-cell semantic-alias-pill-base">
      //                                   <div class="semantic-pill-cover "
      //                                       aria-disabled="false" 
      //                                       style="transform: translate(0px, 0px);">
      //                                       <div class="semantic-pill" >
      //                                           <div class="semantic-color-thumbnail-container">
      //                                               <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
      //                                                   style="background-color: ${semanticValue === "Click to link color" ? "#ffffff" : CacheOperations.getPrimitiveValue(semanticValue)}">
      //                                               </div>
      //                                           </div>
      //                                           <div class="semantic-pill-text">
      //                                                       ${semanticValue === "Click to link color" ? semanticValue : "/ " + semanticValue}
      //                                           </div>
      //                                       </div>
      //                                   </div>
      //                               </div>
      //                           </div>
      //                       </td>
      //                     `;
    }
    

    // const newRow = `
    //                   <tr data-index="${currentSemanticRowId}" class=" seamntic-name-cell semantic-table-row  semantic-table-item-row">
    //                         <td data-index = "${currentSemanticRowId}" class="cursor-copy semantic-table-cell semantic-table-cell-has-padding">
    //                             <div class="flex flex-row items-center w-full overflow-hidden gap-2 select-none">
    //                                 <div class="row-icon">
    //                                     <svg width="24" height="24" fill="none" viewBox="0 0 24 24">
    //                                         <path fill="var(--color-icon)" fill-rule="evenodd"
    //                                             d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
    //                                             clip-rule="evenodd"></path>
    //                                     </svg>
    //                                 </div>
    //                                 <div class="semantic-name inline-flex min-w-0 ">
    //                                     ${semanticName}
    //                                 </div>
    //                             </div>
    //                         </td>
    //                         ${semanticValueCells}
    //                         <td class="semantic-table-cell" style="position: sticky; right: 0px; z-index: 100;">
    //                           <div id="semantic-row-edit-button-container-${currentSemanticRowId}" class="h-full w-full">
    //                           </div>
    //                         </td>
    //                     </tr>
    //                 `;

    const newRow = `
                      <tr data-index="${currentSemanticRowId}" semantic-row-index = "${currentSemanticRowId}" order-index="${currentSemanticRowId}" draggable="true" class=" seamntic-name-cell semantic-table-row  semantic-table-item-row">
                            ${CreateElement.semanticTableNameCell(currentSemanticRowId, semanticName)}
                            ${semanticValueCells}
                            <td class="semantic-table-cell" style="position: sticky; right: 0px; z-index: 100;">
                              <div id="semantic-row-edit-button-container-${currentSemanticRowId}" class="h-full w-full">
                              </div>
                            </td>
                        </tr>
                    `;
      
    // Insert the new row into the table body
    tableBody.insertAdjacentHTML("beforeend", newRow);

    // Make the new row draggable
    const addedRow = tableBody.lastElementChild;
    makeSemanticRowDraggable(addedRow);
    currentSemanticRowId++;


  }

  async function renameSemanticRow() {
    const rowId = semanticRowDeleteButton.getAttribute("data-index");
    const tableBody = document.querySelector("#semantic-table tbody");
    const row = tableBody.querySelector(`tr[data-index="${rowId}"]`);

    const selectedSemanticCell = row.querySelector(".semantic-name");

    

    try {

      const result = renameSemantic(selectedSemanticCell.textContent.trim(), editSemanticRowInput.value, CacheOperations.activeProject)

      selectedSemanticCell.textContent = editSemanticRowInput.value;
    } catch (error) {
      console.error(error);
    }
    
  }

  async function addNewTheme(newThemeMode) {
    
    const table = document.getElementById('semantic-table');
    const theadRow = document.getElementById('semantic-table-header-row');
    const bodyRows = table.querySelectorAll('tbody tr');
    try {

      for (const semanticName of CacheOperations.getAllSemanticNames()){
        await addSemantic(CacheOperations.activeProject, semanticName, "Click to link color", newThemeMode, currentSemanticRowId);
      }

      const newTdHTML = `
                          <td class="semantic-table-cell semantic-value-cell" data-index = "${currentSemanticRowId}" theme-mode = ${newThemeMode}>
                                <div class="semantic-mode-value semantic-mode-cell hide-border bg-red-200">
                                    <div class="semantic-alias-pill-cell semantic-alias-pill-base">
                                        <div class="semantic-pill-cover "
                                            aria-disabled="false" 
                                            style="transform: translate(0px, 0px);">
                                            <div class="semantic-pill" >
                                                <div class="semantic-color-thumbnail-container">
                                                    <div class="semantic-color-thumbnail" tabindex="0" data-tooltip-type="text"
                                                        style="background-color: rgb(22,22,27)">
                                                    </div>
                                                </div>
                                                <div class="semantic-pill-text">
                                                            Click to link color
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </td>
                        `;

        theadRow.insertBefore(CreateElement.semanticThemeModeCell(newThemeMode), theadRow.lastElementChild);

        let tempRowId = 1;

        // Add the new <td> to each row in tbody
        bodyRows.forEach(row => {
          if(row.id !== "semantic-table-header-row"){

          const newTd = document.createElement('td');

          newTd.classList.add("semantic-table-cell");
          newTd.classList.add("semantic-value-cell");

          newTd.setAttribute("data-index", tempRowId);
          newTd.setAttribute("theme-mode", newThemeMode);
          
          newTd.innerHTML = newTdHTML;
          row.insertBefore(newTd, row.lastElementChild);

          tempRowId++;
          }
        });

        semanticTableColumns += 1; // Increase the column count

        let newGridTemplateColumns = '';

        // Loop through the columns and create the column definitions
        for (let i = 0; i < semanticTableColumns; i++) {
          if (i === semanticTableColumns - 1) {
            newGridTemplateColumns += '40px';  // Last column is 40px
          } else if (i === semanticTableColumns - 2) {
            newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
          } else {
            newGridTemplateColumns += '200px ';  // Regular columns are 200px
          }

          // Add a space between columns if it's not the last column
          if (i !== semanticTableColumns - 1) {
            newGridTemplateColumns += ' ';
          }
        }

        CacheOperations.addNewThemeMode(newThemeMode)
        table.style.gridTemplateColumns = newGridTemplateColumns;

        themeModal.hide();
      
      
    } catch (error) {
      AlertManager.error(error, 2500);
      console.log(error);
    }
  }

  function renameThemeInSemanticTable(themeMode, newThemeMode) {
    const table = document.getElementById('semantic-table');
    const theadRow = document.getElementById('semantic-table-header-row');
    const bodyRows = table.querySelectorAll('tbody tr');

    // Rename the header cell
    const themeModeCell = theadRow.querySelector(`td[theme-mode="${themeMode}"]`);
    if (themeModeCell) {
      themeModeCell.setAttribute('theme-mode', newThemeMode);
      themeModeCell.textContent = newThemeMode;
    }

    // Rename the body cells
    bodyRows.forEach(row => {
      const tdToRename = row.querySelector(`td[theme-mode="${themeMode}"]`);
      if (tdToRename) {
        tdToRename.setAttribute('theme-mode', newThemeMode);
      }
    });
  }

  function deleteThemeFromSemanticTable(themeMode) {
    const table = document.getElementById('semantic-table');
    const theadRow = document.getElementById('semantic-table-header-row');
    const bodyRows = table.querySelectorAll('tbody tr');
    
    if (themeMode === "default") {
      throw new Error("Default theme cannot be deleted");
    }

    try {
      // for (const semanticName of CacheOperations.getAllSemanticNames()){
      //   deleteSemanticColor(semanticName, CacheOperations.activeProject, themeMode);
      // }

      const themeModeCell = theadRow.querySelector(`td[theme-mode="${themeMode}"]`);

      if (themeModeCell) {
        themeModeCell.remove();
      }

      let tempRowId = 1;

      // Remove the <td> from each row in tbody
      bodyRows.forEach(row => {
        if(row.id !== "semantic-table-header-row"){

          const tdToRemove = row.querySelector(`td[theme-mode="${themeMode}"]`);

          if (tdToRemove) {
            tdToRemove.remove();
          }

          tempRowId++;
        }
      });

      semanticTableColumns -= 1; // Decrease the column count

      let newGridTemplateColumns = '';

      // Loop through the columns and create the column definitions
      for (let i = 0; i < semanticTableColumns; i++) {
        if (i === semanticTableColumns - 1) {
          newGridTemplateColumns += '40px';  // Last column is 40px
        } else if (i === semanticTableColumns - 2) {
          newGridTemplateColumns += 'minmax(200px, 1fr)';  // Second last column is minmax(200px, 1fr)
        } else {
          newGridTemplateColumns += '200px ';  // Regular columns are 200px
        }

        // Add a space between columns if it's not the last column
        if (i !== semanticTableColumns - 1) {
          newGridTemplateColumns += ' ';
        }
      }

      CacheOperations.deleteThemeMode(themeMode);
      table.style.gridTemplateColumns = newGridTemplateColumns;
    } catch (error) {
      AlertManager.error(error, 2500);
      console.log(error);
    }
  }

  function addNewRowToPrimitiveTable(primitiveName, primitiveValue) {
    
    const tableBody = document.querySelector("#primitives-table tbody");

    const newRow = `
                  <tr primitive-row-index = "${currentPrimitiveRowId}" order-index="${currentPrimitiveRowId}" draggable="true" class="bg-white border-b cursor-grab active:cursor-grabbing">
                    <td class="px-6 py-3 font-medium text-gray-900 whitespace-nowrap w-2/4">
                      <div class="flex items-center w-full">
                        <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24">
                          <path fill="#000000" fill-rule="evenodd"
                              d="M16.95 7.05a6.97 6.97 0 0 1 2.005 4.15c.2 1.75-1.36 2.8-2.73 2.8H15a1 1 0 0 0-1 1v1.225c0 1.37-1.05 2.93-2.8 2.73A7 7 0 1 1 16.95 7.05m1.01 4.264c.112.97-.759 1.686-1.735 1.686H15a2 2 0 0 0-2 2v1.225c0 .976-.715 1.847-1.686 1.736a6 6 0 1 1 6.647-6.646M13 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m-3.134 2.5a1 1 0 1 0-1.732-1 1 1 0 0 0 1.732 1m5.634.366a1 1 0 1 1-1-1.732 1 1 0 0 1 1 1.732M8.134 14.5a1 1 0 1 0 1.732-1 1 1 0 0 0-1.732 1"
                              clip-rule="evenodd"></path>
                        </svg>
                        <p id="primitive-name" class="text-xs text-gray-500 ml-2 w-full">${primitiveName}</p>
                        
                      </div>
                    </td>
                    <td class="px-6 py-3 w-2/4">
                      <div id="color-box-parent" class="w-full flex items-center">
                        <div id="color-box" class=" h-4 w-4 min-h-4 min-w-4 mr-2 border rounded-sm" style="background-color: ${primitiveValue} ;"></div>
                        <p id="color-text" class="flex-1 text-xs mr-2">${primitiveValue}</p>
                      </div>
                    </td>
                  </tr>
    `;
    
    tableBody.insertAdjacentHTML("beforeend", newRow);

    // Make the new row draggable
    const addedRow = tableBody.lastElementChild;
    makePrimitiveRowDraggable(addedRow);

    currentPrimitiveRowId++;
    
  }

  function ShowSelectPrimitiveModal(dataIndex, themeMode, semanticName) {

    const primitivesContainer = document.getElementById('select-primitive-modal-primitives-container');
    primitivesContainer.innerHTML = "";

    for (const [primitiveName, primitiveValue] of CacheOperations.getAllPrimitives()) {

      const newPrimitiveItem = ` 
                          <li data-index = "${dataIndex}" data-primitive-name = "${primitiveName}" data-primitive-value = "${primitiveValue}">
                              <div class="flex items-center p-3 text-base font-bold text-gray-900 rounded-lg bg-gray-50 hover:bg-gray-100 group hover:shadow dark:bg-gray-600 dark:hover:bg-gray-500 dark:text-white">
                                <div class="color-box h-5 w-5 mr-2 border rounded-md" style="background-color: ${primitiveValue};"></div>
                                <p class="color-text text-sm mr-2 flex-1">${primitiveName}</p>
                              </div>
                          </li>`;
      
      primitivesContainer.insertAdjacentHTML("beforeend", newPrimitiveItem);
    }
    selectPrimitiveModal.setAttribute("data-index", dataIndex);
    selectPrimitiveModal.setAttribute("theme-mode", themeMode);
    selectPrimitiveModal.setAttribute("semantic-name", semanticName);
    selectPrimitiveModal.classList.replace("hidden","flex");
  }

  function CloseSelectPrimitiveModal() {
    selectPrimitiveModal.classList.replace("flex","hidden");
  }

  function makePrimitiveRowDraggable(row) {
    row.setAttribute('draggable', true);
  
    // Drag Start
    row.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', row.getAttribute('primitive-row-index'));
      row.classList.add('dragging');
    });
  
    // Drag Over
    row.addEventListener('dragover', function (e) {
      e.preventDefault(); // Allow dropping
  
      const draggingRow = document.querySelector('.dragging'); // Get the row being dragged
      const currentRow = e.target.closest('tr'); // Get the row being hovered over
  
      if (draggingRow && currentRow && draggingRow !== currentRow) {
        const rows = Array.from(row.parentElement.querySelectorAll('tr'));
        const currentIndex = rows.indexOf(currentRow);
        const draggingIndex = rows.indexOf(draggingRow);

        if (draggingIndex < currentIndex) {
          // Insert the dragging row after the current row
          row.parentElement.insertBefore(draggingRow, currentRow.nextSibling);
        } else {
          // Insert the dragging row before the current row
          row.parentElement.insertBefore(draggingRow, currentRow);
        }

      }

    });
  
    // Drop
    row.addEventListener('drop', function (e) {
      e.preventDefault();

      const rows = Array.from(row.parentElement.querySelectorAll('tr'));
  
      // Update the order-index for all rows
      rows.forEach((row, index) => {
        row.setAttribute('order-index', index + 1); // Start from 1
      });
  
      row.classList.remove('dragging'); 

    });
  
    // Drag End
    row.addEventListener('dragend', function () {
      
      row.classList.remove('dragging');

      // Update Order Indexes in DB
      const tableBody = document.querySelector("#primitives-table tbody");

      const rows = tableBody.querySelectorAll('tr');

      try {
        rows.forEach(async (row, index) => {
          const primitiveName = row.querySelector("#primitive-name").textContent.trim();
          const newOrderIndex = index + 1;
          
          await updatePrimitive(CacheOperations.activeProject, primitiveName, "@default", "@default", newOrderIndex, false);
        });

        console.log(...Logger.multiLog(
          ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
          ["Updated primitive table order index"]
        ));
      } catch (error) {
        console.error(error); 
      }
    });
  }

  function makeSemanticRowDraggable(row) {
    row.setAttribute('draggable', true);
  
    // Drag Start
    row.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', row.getAttribute('semantic-row-index'));
      row.classList.add('dragging');
      row.querySelector('td:first-child').style.backgroundColor = 'rgb(225, 239, 254)';
    });
  
    // Drag Over
    row.addEventListener('dragover', function (e) {
      e.preventDefault(); // Allow dropping
  
      const draggingRow = document.querySelector('.dragging'); // Get the row being dragged
      const currentRow = e.target.closest('tr'); // Get the row being hovered over
  
      if (draggingRow && currentRow && draggingRow !== currentRow) {
        const rows = Array.from(row.parentElement.querySelectorAll('tr'));
        const currentIndex = rows.indexOf(currentRow);
        const draggingIndex = rows.indexOf(draggingRow);

        if (draggingIndex < currentIndex) {
          // Insert the dragging row after the current row
          row.parentElement.insertBefore(draggingRow, currentRow.nextSibling);
        } else {
          // Insert the dragging row before the current row
          row.parentElement.insertBefore(draggingRow, currentRow);
        }

      }

    });
  
    // Drop
    row.addEventListener('drop', function (e) {
      e.preventDefault();

      const rows = Array.from(row.parentElement.querySelectorAll('tr'));
  
      // Update the order-index for all rows
      rows.forEach((row, index) => {
        row.setAttribute('order-index', index + 1); // Start from 1
      });
  
      row.classList.remove('dragging'); 
      row.querySelector('td:first-child').style.removeProperty('background-color');
    });
  
    // Drag End
    row.addEventListener('dragend', function () {
      
      row.classList.remove('dragging');
      row.querySelector('td:first-child').style.removeProperty('background-color');

      // Update Order Indexes in DB
      const rows = semanticTableBody.querySelectorAll('tr');

      try {
        const themeModes = CacheOperations.getAllThemeModes();
        rows.forEach(async (row, index) => {
          const semanticElement = row.querySelector(".semantic-name");
          if (semanticElement) {
            const semanticName = semanticElement.innerText.trim();
            const newOrderIndex = index + 1;

            await Promise.all(themeModes.map(themeMode => 
              updateSemantic(CacheOperations.activeProject, semanticName, "@default", themeMode, "@default", newOrderIndex, false)
            ));
          }
          
        });

        console.log(...Logger.multiLog(
          ["[INFO]", Logger.Types.INFO, Logger.Formats.BOLD],
          ["Updated semantic table order index"]
        ));
      } catch (error) {
        console.error(error);
      }

    });
  }

  

