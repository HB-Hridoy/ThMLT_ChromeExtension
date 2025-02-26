

  const fontsTable = document.getElementById("fonts-table");
  const fontsTableBody = document.querySelector("#fonts-table tbody");

 const showEditFontModalButton = document.getElementById("font-edit-button");
 const showAddFontModalButton = document.getElementById("add-font-modal");

  const fontDetailsModal = new Modal(document.getElementById("font-details-modal"), {
    onHide: () => {
        document.querySelectorAll(".bg-gray-900\\/50, .bg-gray-900\\/80").forEach(backdrop => {
            backdrop.remove();
        });
    }
  });
  const addFontButton = document.getElementById("add-font-button");
  const updateFontButton = document.getElementById("update-font-button");
  const deleteFontButton = document.getElementById("delete-font-button");

  const fontModalMode = document.querySelector('h3[fontModalMode]');

  const fontModalTagInput = document.getElementById("font-tag-input");
  const fontModalTagInputError = document.getElementById("font-tag-error");

  const fontModalShortTagInput = document.getElementById("short-font-tag-input");
  const fontModalShortTagInputError = document.getElementById("short-font-tag-error");

  const fontModalNameInput = document.getElementById("font-name-input");
  const fontModalNameInputError = document.getElementById("font-name-error");

  const fontDetailsErrors = document.getElementById("font-details-errors");
  let fontDeatilsModalHasErrors = false;


  
  document.getElementById("fonts-screen-back-button").addEventListener("click", () => {
    ScreenManager.showProjectManagementScreen();
  });

  // Adding event listener for hover functionality to show the delete button
  fontsTableBody.addEventListener("mouseover", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      const rowId = parentRow.getAttribute("font-row-index");
      if(rowId){
        const editButtonContainer = parentRow.querySelector(".fontNameContainer");
        showEditFontModalButton.classList.replace("hidden", "flex");
        showEditFontModalButton.setAttribute("font-row-index", rowId);
        editButtonContainer.appendChild(showEditFontModalButton);

      }
      
    }
  }, true); // Use capture phase for this to run first

  fontsTableBody.addEventListener("mouseout", function(event) {
    const target = event.target;
    const parentRow = target.closest("tr");

    if (parentRow) {
      showEditFontModalButton.classList.replace("felx", "hidden");
    }
  }, true); // Use capture phase for this to run first

  showEditFontModalButton.addEventListener("click", ()=>{
    if (fontModalMode.getAttribute("fontModalMode") === "add") {
      updateFontButton.classList.replace("hidden", "visible");
      deleteFontButton.classList.replace("hidden", "visible");
      addFontButton.classList.replace("visible", "hidden");
    }
    fontModalMode.setAttribute("fontModalMode", "edit");
    fontModalMode.innerHTML = "Edit Font";

    const rowId = showEditFontModalButton.getAttribute("font-row-index");
    const row = fontsTableBody.querySelector(`tr[font-row-index="${rowId}"]`);
    const fontTag = row.querySelector("#font-tag").textContent.trim();
    const fontTagShort = row.querySelector("#short-font-tag").textContent.trim();
    const fontName = row.querySelector("#font-name").textContent.trim();

    fontModalTagInput.value = fontTag;
    fontModalShortTagInput.value = fontTagShort;
    fontModalNameInput.value = fontName;

    fontModalNameInput.style.borderColor = "";
    fontModalShortTagInput.style.borderColor = "";
    fontModalTagInput.style.borderColor = "";
    
    fontModalNameInputError.classList.toggle("hidden", true);
    fontModalShortTagInputError.classList.toggle("hidden", true);
    fontModalTagInputError.classList.toggle("hidden", true);
    
    
  });

  showAddFontModalButton.addEventListener("click", ()=>{
    if (fontModalMode.getAttribute("fontModalMode") === "edit") {
      updateFontButton.classList.replace("visible", "hidden");
      deleteFontButton.classList.replace("visible", "hidden");
      addFontButton.classList.replace("hidden", "visible");
    }
    fontModalMode.setAttribute("fontModalMode", "add");
    fontModalMode.innerHTML = "Add Font";

    [fontModalTagInput, fontModalShortTagInput, fontModalNameInput]
    .forEach(input => {
      input.value = "";
      input.style.borderColor = "";
    });
    fontModalNameInputError.classList.toggle("hidden", true);
    fontModalShortTagInputError.classList.toggle("hidden", true);
    fontModalTagInputError.classList.toggle("hidden", true);
  });

  [fontModalTagInput, fontModalShortTagInput]
  .forEach(input => input.addEventListener("input", ({ target }) => {

    const inputError = document.getElementById(input.id.replace("-input", "-error"));

    const isInvalid = !nameRegex.test(input.value.trim());

    
    input.style.borderColor = isInvalid ? "red" : "";
    inputError.classList.toggle("hidden", !isInvalid);

    if (isInvalid) {
      inputError.innerText = "Only letters, numbers, hyphens (-), and underscores (_) are allowed.";
    }

    if (input === fontModalTagInput && CacheOperations.isFontTagExist(input.value.trim())) {
      inputError.classList.remove("hidden");
      inputError.innerText = "Font tag already exists!";
      input.style.borderColor = "red";
    } else if (input === fontModalShortTagInput && CacheOperations.isShortFontTagExist(input.value.trim())) {
      inputError.classList.remove("hidden");
      inputError.innerText = "Short font tag already exists!";
      input.style.borderColor = "red";
    }
    checkFontDeatilsModalErrors();

  }));

  
  fontModalNameInput.addEventListener("input", ({ target }) => {
    const nameRegex = /^[a-zA-Z0-9-_\.]+$/;
    const isInvalid = !nameRegex.test(target.value.trim());

    target.style.borderColor = isInvalid ? "red" : "";
    fontModalNameInputError.classList.toggle("hidden", !isInvalid);
    

    if (isInvalid) {
      fontModalNameInputError.innerText = "Only letters, numbers, hyphens (-), underscores (_), and full stops (.) are allowed.";
    } else{
      const isInvalidFormat = !(/\.(ttf|otf)$/i.test(fontModalNameInput.value.trim()));
      fontModalNameInput.style.borderColor = isInvalidFormat ? "red" : "";
      fontModalNameInputError.classList.toggle("hidden", !isInvalidFormat);

      if (isInvalidFormat) {
      fontModalNameInputError.innerText = "Font name must end with .ttf or .otf.";
      }
    }

    checkFontDeatilsModalErrors();

  });

  function checkFontDeatilsModalErrors(checkEmpty) {
    const hasErrors = [fontModalNameInputError, fontModalShortTagInputError, fontModalTagInputError].some(errorElement => !errorElement.classList.contains("hidden"));

    fontDeatilsModalHasErrors = hasErrors;

    const buttonStates = hasErrors
      ? ["bg-blue-700", "bg-gray-500", "hover:bg-blue-800", "hover:bg-gray-600"]
      : ["bg-gray-500", "bg-blue-700", "hover:bg-gray-600", "hover:bg-blue-800"];

    [addFontButton, updateFontButton, deleteFontButton].forEach((button, index) => {
      button.classList.replace(buttonStates[0], buttonStates[1]);
      button.classList.replace(buttonStates[2], buttonStates[3]);
    });

    if (!hasErrors) {
      deleteFontButton.classList.replace("bg-gray-500", "bg-red-700");
      deleteFontButton.classList.replace("hover:bg-gray-600", "hover:bg-red-800");
    }

    if (checkEmpty) {
      const inputs = [fontModalTagInput, fontModalShortTagInput, fontModalNameInput];
      inputs.forEach(input => {
        const inputError = document.getElementById(input.id.replace("-input", "-error"));
        const isEmpty = input.value.trim() === "";

        input.style.borderColor = isEmpty ? "red" : "";
        inputError.classList.toggle("hidden", !isEmpty);

        if (isEmpty) {
        inputError.innerText = "This field cannot be empty.";
        fontDeatilsModalHasErrors = true;
        }
      });
    }

    if (!fontDeatilsModalHasErrors) {
      [fontModalTagInput, fontModalShortTagInput, fontModalNameInput].forEach((input) =>{
        input.style.borderColor = "";
      })
      
    }
    
  }

  addFontButton.addEventListener("click", async ()=>{

    checkFontDeatilsModalErrors(true);
    if (!fontDeatilsModalHasErrors) {
      try {
        const fontTag = fontModalTagInput.value.trim();
        const shortFontTag = fontModalShortTagInput.value.trim();
        const fontName = fontModalNameInput.value.trim();
        addFont(CacheOperations.activeProject, fontTag, shortFontTag, fontName, currentFontsRowId );
        addNewRowToFontsTable(fontTag, shortFontTag, fontName);
      } catch (error) {
        console.log(...Logger.multiLog(
          ["[ERROR]", Logger.Types.ERROR, Logger.Formats.BOLD],
          [error, Logger.Types.ERROR]
        ));
        
      }
      fontDetailsModal.hide();
    }

  });

  updateFontButton.addEventListener("click", async ()=>{

    checkFontDeatilsModalErrors();
    if (!fontDeatilsModalHasErrors) {
      try {
        const activeRowIndex = showEditFontModalButton.getAttribute("font-row-index");

        const row = fontsTableBody.querySelector(`tr[font-row-index="${activeRowIndex}"]`);

        const newFontTag = fontModalTagInput.value.trim();
        const newShortFontTag = fontModalShortTagInput.value.trim();
        const newFontName = fontModalNameInput.value.trim();

        const fontTag = row.querySelector("#font-tag").textContent;
        // const shortFontTag = row.querySelector("#short-font-tag").textContent;
        // const fontName = row.querySelector("#font-name").textContent;

        await updateFont(CacheOperations.activeProject, fontTag, newFontTag, newShortFontTag, newFontName, "@default");

        row.querySelector("#font-tag").innerText = newFontTag;
        row.querySelector("#short-font-tag").innerText = newShortFontTag;
        row.querySelector("#font-name").innerText = newFontName;


        fontDetailsModal.hide();
      } catch (error) {
        console.error(error);  
      }
    }

  });

  deleteFontButton.addEventListener("click", async ()=>{
    const activeRowIndex = showEditFontModalButton.getAttribute("font-row-index");

    const row = fontsTableBody.querySelector(`tr[font-row-index="${activeRowIndex}"]`);
    const fontTag = row.querySelector("#font-tag").textContent;

    const message = `Are sure to delete <p class="text-red-600 font-bold">${fontTag}</p> permanently?`

    openConfirmation(message, async () => {
      try {
        const result = await deleteFont(CacheOperations.activeProject, fontTag);
        AlertManager.success(result, 2000);
        row.remove();
      } catch (error) {
        AlertManager.error(error, 2000);
        console.error(error);
      }
      
    } )
    
  });




  function addNewRowToFontsTable(fontTag, fontTagShort, fontName) {

    const newRow = `
                  <tr font-row-index = "${currentFontsRowId}" order-index = "${currentFontsRowId}" class="bg-white border-b" style="cursor:grab;">
                    <td class="px-6 py-4 font-medium text-gray-900 whitespace-nowrap w-2/4">
                      <div class="flex items-center w-full">
                        <svg class="w-5 h-5 text-gray-500 " aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" viewBox="0 0 24 24">
                          <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m10.5785 19 4.2979-10.92966c.0369-.09379.1674-.09379.2042 0L19.3785 19m-8.8 0H9.47851m1.09999 0h1.65m7.15 0h-1.65m1.65 0h1.1m-7.7-3.9846h4.4M3 16l1.56685-3.9846m0 0 2.73102-6.94506c.03688-.09379.16738-.09379.20426 0l2.50367 6.94506H4.56685Z"/>
                        </svg>                  
                        <p id="font-tag" class="text-xs text-gray-500 mx-2 ">${fontTag}</p>
                        <p id="short-font-tag" class="text-xs font-medium border-1 rounded-sm text-white p-1 bg-blue-500">${fontTagShort}</p>
                        
                      </div>
                    </td>
                    <td class="px-6 py-4 w-2/4">
                      <div class="fontNameContainer flex items-center">
                        <p id="font-name" class="text-xs text-gray-500 ml-2 w-full">${fontName}</p>
                      </div>
                      

                    </td>
                  </tr>
    `;
    
    fontsTableBody.insertAdjacentHTML("beforeend", newRow);

    // Make the new row draggable
    const addedRow = fontsTableBody.lastElementChild;
    makeFontsRowDraggable(addedRow);

    currentFontsRowId++;
  }

  function makeFontsRowDraggable(row) {
    row.setAttribute('draggable', true);
  
    // Drag Start
    row.addEventListener('dragstart', function (e) {
      e.dataTransfer.setData('text/plain', row.getAttribute('font-row-index'));
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

      const rows = fontsTableBody.querySelectorAll('tr');

      rows.forEach((row, index) => {
          const fontTag = row.querySelector("#font-tag").textContent.trim();
          const newOrderIndex = index + 1;

          updateFont(CacheOperations.activeProject, fontTag, "@default", "@default", "@default", newOrderIndex);
          
      });


    });
  }