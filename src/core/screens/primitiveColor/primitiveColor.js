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

  const primitiveTable = document.getElementById('primitive-table');
  const primitiveTableBody = document.querySelector("#primitives-table tbody");


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
          AlertManager.success(result, 1500);

          //Sync Primitive Data to Semantic Table
          semanticTableBody.querySelectorAll(`td.semantic-table-cell.semantic-value-cell`).forEach(cell => {

            const thumbnailElement = cell.querySelector(`.semantic-color-thumbnail`);
            const semanticValueElement = cell.querySelector(`.semantic-pill-text`);

            if (semanticValueElement.innerText.trim() === primitiveName) {
              semanticValueElement.innerHTML = newPrimitiveName;
              thumbnailElement.style.backgroundColor = newPrimitiveValue; 
            }
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

        //Sync Primitive Data to Semantic Table
        semanticTableBody.querySelectorAll(`td.semantic-table-cell.semantic-value-cell`).forEach(cell => {

          const thumbnailElement = cell.querySelector(`.semantic-color-thumbnail`);
          const semanticValueElement = cell.querySelector(`.semantic-pill-text`);

          if (semanticValueElement.innerText.trim() === primitiveName) {
            semanticValueElement.innerHTML = "Click to link color";
            thumbnailElement.style.backgroundColor = "#fff"; 
          }
        });

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

   // Close primitives modal
   document.getElementById("close-primitive-modal").addEventListener("click", function(){
    CloseSelectPrimitiveModal();
   
  });