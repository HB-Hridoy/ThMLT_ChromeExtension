import cache, { CACHE_KEYS } from './Utility/HybridCacheSystem.js';
import ThMLT_DB from './Utility/ThMLT_DB.js';

const thmltDatabase = new ThMLT_DB();

setTimeout(() => {
  thmltDatabase.getAllProjects((error, projects) => {
    if (error) return console.error("Error:", error.message);

    const projectNames = projects.map(project => project.projectName);
    cache.set(CACHE_KEYS.PROJECTS, projects);
    cache.set(CACHE_KEYS.PROJECT_NAMES, projectNames);
  });

  // thmltDatabase.getColorDataForAI2("exTest", (error, colorData, defaultThemeMode) => {
  //   if (error) return console.error("Error:", error.message);

  //   console.log("Color Data:", colorData);
  //   console.log("Default Theme Mode:", defaultThemeMode);
    
  // });
}, 2000);

chrome.runtime.onInstalled.addListener(() => {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "Projects") {
    cache.get(CACHE_KEYS.PROJECTS, (projects) => {
      cache.get(CACHE_KEYS.PROJECT_NAMES, (projectNames) => {
        sendResponse({ 
          action: "Projects",
          projects: projects,
          projectNames: projectNames
        });
      })
    })
    return true;

  } else if (message.action === "fetchData") {
    let messageResponse = {
        action: "fetchData",
        translationData: null,
        fontData: null,
        colorData: null,
        defaultThemeMode: null
    };

    const translationPromise = new Promise((resolve) => {
        if (message.translationData) {
            thmltDatabase.isTranslationDataAvailable(message.projectName, (error, isTranslationDataAvailable) => {
                if (error) {
                    console.error("Error:", error.message);
                }
                if (isTranslationDataAvailable) {
                    thmltDatabase.getTranslationData(message.projectName, (error, translationData) => {
                        if (error) {
                            console.error("Error:", error.message);
                        } else {
                            messageResponse.translationData = translationData;
                        }
                        resolve();
                    });
                } else {
                    console.log("Translation Data not available");
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });

    const fontPromise = new Promise((resolve) => {
        if (message.fontData) {
            thmltDatabase.getAllFonts(message.projectName, (error, fontData) => {
                if (error) {
                    console.error("Error:", error.message);
                } else {
                    messageResponse.fontData = fontData;
                }
                resolve();
            });
        } else {
            resolve();
        }
    });

    const colorPromise = new Promise((resolve) => {
        if (message.colorData) {
            thmltDatabase.getColorDataForAI2(message.projectName, (error, colorData, defaultThemeMode) => {
                if (error) {
                    console.error("Error:", error.message);
                } else {
                    messageResponse.colorData = colorData;
                    messageResponse.defaultThemeMode = defaultThemeMode;
                }
                resolve();
            });
        } else {
            resolve();
        }
    });

    Promise.all([translationPromise, fontPromise, colorPromise]).then(() => {
        sendResponse(messageResponse);
    });

    return true;
  }

});





