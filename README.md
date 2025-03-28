# ThMLT Chrome Extension (v1.0.2)

This project is a Chrome extension designed to manage and manipulate themes, colors, and filter specific layouts for [ThMLT AI2 Extension](https://github.com/hridoy/ThMLT_ChromeExtension). The chrome extension provides various functionalities including importing/exporting JSON data, managing projects, and filtering layout components.

## Features

### Home Screen
- **Project Management**: Add, delete, and view projects.
- **Import JSON**: Import project data from a JSON file.
- **Export JSON**: Export project data to a JSON file.

### Colors Management

- **Primitives Management**: Add, edit, delete, and view primitive colors.
- **Semantic Management**: Add, edit, delete, and view semantic colors.
- **Theme Modes**: Add, rename, delete, and view theme modes.

### Tools Screen
- **Filter AI2 Layout**: Filter and display specific components from an AI2 layout JSON.

    #### Filterable Components
    - `Vertical Arrangement`
    - `Vertical Scroll Arrangement`
    - `Horizontal Arrangement`
    - `Horizontal Scroll Arrangement`

### Import JSON
- **JSON Editor**: Edit and validate JSON data before importing.
- **Error Handling**: Display error logs if the JSON structure is invalid.

## JSON Structure

The JSON structure for importing/exporting project data includes the following fields:
- `ProjectName`: The name of the project.
- `Author`: The author of the project.
- `Version`: The version of the project.
- `Modes`: An array of theme modes.
- `DefaultMode`: The default theme mode.
- `Primitives`: An object containing primitive colors.
- `Semantic`: An object containing semantic colors for each theme mode.

<details>
    <summary>Click to expand JSON Structure Example</summary>

    {
        "ProjectName": "Sample Project",
        "Author": "John Doe",
        "Version": "1.0",
        "Modes": [
            "Light",
            "Dark"
        ],
        "DefaultMode": "Light",
        "Primitives": {
            "PrimaryColor": "#FFFFFF",
            "SecondaryColor": "#000000"
        },
        "Semantic": {
            "Light": {
                "Background": "#FFFFFF",
                "Text": "#000000"
            },
            "Dark": {
                "Background": "#000000",
                "Text": "#FFFFFF"
            }
        }
    }

</details>

## Usage

### Importing JSON
1. Click on the "Import from JSON" button.
2. Paste the JSON data into the editor.
3. Click "Convert" to validate and import the data.

### Exporting JSON
1. Click on the "Options" button to access the project settings menu.
2. Select the "Copy" button to copy the structured JSON data to the clipboard.
3. Select the "Download" button to download the project data as a JSON file.

### Filtering AI2 Layout
1. Paste the AI2 layout JSON into the input field.
2. Click "Convert" to filter and display the allowed components.

## Installation

1. Clone the repository.
2. Open Chrome and navigate to `chrome://extensions/`.
3. Enable "Developer mode" and click "Load unpacked".
4. Select the cloned repository folder.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.




