

const ai2LayoutTetxt = document.getElementById('ai2-layout-text');
const filterLayoutButton = document.getElementById('filter-layout-button');

const copyFilteredLayoutButton = document.getElementById('copy-filtered-layout-button');
const downloadFilteredLayoutButton = document.getElementById('download-filtered-layout-button');

filterLayoutButton.addEventListener('click', function() {
    try {
        const json = JSON.parse(ai2LayoutTetxt.value);
        const filteredNames = filterNames(json);
        filteredtedArrangementCodeEditor.setValue(JSON.stringify(filteredNames, null, 2));
    } catch (error) {
        console.error("Error parsing JSON or filtering names:", error);
        alert("An error occurred while processing the layout. Please check the input and try again.");
    }
});

function filterNames(json) {
    const allowedTypes = [
        "VerticalArrangement",
        "VerticalScrollArrangement",
        "HorizontalArrangement",
        "HorizontalScrollArrangement"
    ];
    
    let result = {};
    
    function traverse(components) {
        if (!components) return;
        
        components.forEach(component => {
            if (allowedTypes.includes(component["$Type"])) {
                result[component["$Name"]] = "";
            }
            
            // Recursively check for nested components
            if (component["$Components"]) {
                traverse(component["$Components"]);
            }
        });
    }
    
    traverse(json["$components"]);
    
    return result;
}