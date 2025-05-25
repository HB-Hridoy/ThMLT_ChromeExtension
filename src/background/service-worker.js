
import { handleProjectsDataFetch } from './handlers/projectsHandler.js';
import { handleSessionStorage } from './handlers/sessionStorageHandler.js';
import { handlePrimitivesDataFetch } from './handlers/primitiveColorsHandler.js';
import { handleSemanticsDataFetch } from './handlers/semanticColorsHandler.js';
import { handleFontsDataFetch } from './handlers/fontsHandler.js';
import { handleTranslationsDataFetch } from './handlers/translationsHandler.js';

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

const messageHandlers = {
    "PROJECTS:FETCH_DATA": handleProjectsDataFetch,
    "COLORS:FETCH_PRIMITIVE": handlePrimitivesDataFetch,
    "COLORS:FETCH_SEMANTIC": handleSemanticsDataFetch,
    "FONTS:FETCH_DATA": handleFontsDataFetch,
    "TRANSLATIONS:FETCH_DATA": handleTranslationsDataFetch,

    "SESSION_STORAGE:SET": handleSessionStorage,
    "SESSION_STORAGE:GET": handleSessionStorage,

};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    const handler = messageHandlers[message.action];
    if (!handler) {
        sendResponse({ success: false, error: "Unknown message action" });
        return;
    }

    (async () => {
        try {
            const result = await handler(message, sender);
            console.log(`${message.action} action result`, result);
            
            sendResponse(result);
        } catch (err) {
            sendResponse({ success: false, error: err.message });
        }
    })();

    return true; // keep the message channel open for async handler
});