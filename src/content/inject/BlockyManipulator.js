class Logger {
	static Types = {
			DEFAULT: "default",
			SUCCESS: "success",
			INFO: "info",
			WARNING: "warning",
			ERROR: "error",
			SUBTLE: "subtle",
			DEBUG: "debug",
			CRITICAL: "critical",
	};

	static Formats = {
			REGULAR: "", 
			BOLD: "font-weight: bold;",
			ITALIC: "font-style: italic;",
			UNDERLINE: "text-decoration: underline;",
			STRIKETHROUGH: "text-decoration: line-through;",
			MONOSPACE: "font-family: monospace;",
			HIGHLIGHT: "background: rgba(255, 255, 0, 0.2); padding: 2px 4px; border-radius: 3px;",
			SHADOW: "text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);",
			UPPERCASE: "text-transform: uppercase;",
	};

	static styles = {
			default: "color: #ccc;",
			success: "color: #4CAF50;",
			info: "color: #2196F3;",
			warning: "color: #FFC107;",
			error: "color: #F44336;",
			subtle: "color: #888;",
			debug: "color: #8e44ad;",
			critical: "color: #ff5722; font-weight: bold; text-transform: uppercase;",
	};

	static log(...args) {
			let message = args[0];
			let type = args[1] || Logger.Types.DEFAULT;
			let format = args[2] || Logger.Formats.REGULAR;

			let style = Logger.styles[type] + format;
			return [`%c${message}`, style];
	}

	static multiLog(...args) {
			let msg = "", styles = [];
			
			args.forEach(([text, type = Logger.Types.DEFAULT, format = Logger.Formats.REGULAR]) => {
					msg += `%c${text} `;
					styles.push(Logger.styles[type] + format);
			});

			return [msg, ...styles];
	}
}

function modifyMethodBlockByComponentName(blockType, componentName, methodName, argPosition, newArgValue) {
  console.log("Injected: modifyBlock called with:", { blockType, componentName, methodName, newArgValue });
  
	let found = false;
	waitForBlockly(() => {
		const workspace = Blockly.getMainWorkspace();
		
		workspace.getAllBlocks().forEach(function(block) {
			//  Check if this block matches the block.type, block.typeName, block.methodName
			if (block.type === blockType && block.instanceName === componentName && block.methodName === methodName) {
				// console.log(`Block type: ${block.type}` );
				
				// console.log(`Block: ${Object.keys(block)}` );

				if (argPosition >= 0) {
					const argBlock = block.getChildren()[argPosition];
					if (argBlock && argBlock.type === "text") {
						let oldValue = argBlock.getFieldValue("TEXT");
						
						argBlock.setFieldValue(newArgValue, "TEXT");
						console.log(...Logger.multiLog(
							["[BLOCKLY INJECTION]", Logger.Types.CRITICAL, Logger.Formats.BOLD],
							["For"],
							[`${componentName}.`, Logger.Types.INFO],
							[`${methodName}.`, Logger.Types.WARNING],
							[`ARG${argPosition}`, Logger.Types.SUCCESS],
							["changed to\n"],
							[`${newArgValue}`, Logger.Types.DEFAULT]
						));
						found = true;
					}
				}
			}
		});
	});
	return found ? `Block modified successfully!` : `No matching block found.`;
}

function waitForBlockly(callback) {
	if (window.Blockly) {
			console.log(...Logger.multiLog(
				["[BLOCKLY]", Logger.Types.SUCCESS, Logger.Formats.BOLD],
				["Blockly workspace ready for modification."],
			));
			
			callback();
	} else {
			console.log("Waiting for Blockly...");
			setTimeout(() => waitForBlockly(callback), 500);
	}
}


// Listen for messages from the content script via window.postMessage.
window.addEventListener("message", function(event) {
  if (event.source !== window) return;
  if (event.data && event.data.type === "UPDATE_COLOR_THEMES") {
    console.log("Injected: Received UPDATE_COLOR_THEMES message:", event.data);
    var resultMessage = modifyMethodBlockByComponentName(
			event.data.blockType,
			event.data.componentName,
			event.data.methodName,
			event.data.argPosition,
			event.data.newArgValue
		);
    // Send the result back to the content script.
    window.postMessage({ type: "UPDATE_COLOR_THEMES_RESPONSE", message: resultMessage }, "*");
  }
});
