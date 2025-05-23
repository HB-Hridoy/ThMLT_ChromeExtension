
import { showPrimitivesTab, showSemanticTab } from "../core/screens/color/colorManagement.js";
import cacheManager from "./cache/cacheManager.js";
import { COLOR_TABS, screens } from "./screenManager.js";
import { showProjectManagementScreen } from "../core/screens/projectManagement/projectManagement.js";
import { showProjectSettingsScreen } from "../core/screens/projectSettings/projectSettings.js";
import { showColorManagementScreen } from "../core/screens/color/colorManagement.js";
import { showFontsManagementScreen } from "../core/screens/font/fontsManagement.js";

class SessionManager {

  constructor(){
    this.DATA = {
      SCREEN: "screen",
      COLOR_TAB: "color-tab",
      PROJECT_ID: "project-id"
    }
  }

  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
    console.log(`[SESSION] Key "${key}" set with value:`, value);
  }

  async get(key) {
    const data = await chrome.storage.local.get(key);
    return data[key];
  }

  async remove(key) {
    await chrome.storage.local.remove(key);
  }

  async clear() {
    for (const key of Object.values(this.DATA)) {
      await this.remove(key);
    }
  }
  
  
  async restoreSession(){
    const projectId = await this.get(this.DATA.PROJECT_ID);
    const screen = await this.get(this.DATA.SCREEN);
  
    if (projectId && screen) {
      console.log("[SESSION] Restoring previous session.");
      cacheManager.projects.activeProjectId = projectId;
  
      cacheManager.projects.get(projectId).themeModes.forEach((theme) => {
        cacheManager.semantics.theme().add({ themeName: theme });
      });
  
      console.log(`[SESSION] Attempting to restore screen with ID:`, screen);

      switch (screen) {
        case screens.PROJECT_MANAGEMENT.id:
          console.log("[SESSION] => Restoring: Project Management Screen");
          await showProjectManagementScreen();
          break;

        case screens.PROJECT_SETTINGS.id:
          console.log("[SESSION] => Restoring: Project Settings Screen");
          await showProjectManagementScreen(); // likely required as parent screen
          console.log("[SESSION] => Loading Settings Subscreen");
          await showProjectSettingsScreen();
          break;

        case screens.COLOR_MANAGEMENT.id:
          console.log("[SESSION] => Restoring: Color Management Screen");
          await showProjectManagementScreen(); // consistent with layout flow
          await showColorManagementScreen();

          const colorTab = await this.get(this.DATA.COLOR_TAB);
          console.log(`[SESSION] Retrieved color tab:`, colorTab);

          if (colorTab === COLOR_TABS.PRIMITIVES.id) {
            console.log("[SESSION] => Showing Primitives Tab");
            await showPrimitivesTab();
          } else if (colorTab === COLOR_TABS.SEMANTIC.id) {
            console.log("[SESSION] => Showing Semantic Tab");
            await showSemanticTab();
          }
          break;

        case screens.FONTS_MANAGEMENT.id:
          console.log("[SESSION] => Restoring: Fonts Management Screen");
          await showProjectManagementScreen();
          await showFontsManagementScreen();
          break;

        default:
          console.log("[SESSION] ⚠️ Unknown screen ID. Skipping restoration.");
      }

  
      console.log("[SESSION] Session restored.");
    } else {
      console.log("[SESSION] No session found.");
    }
  }
  
}

export default new SessionManager();