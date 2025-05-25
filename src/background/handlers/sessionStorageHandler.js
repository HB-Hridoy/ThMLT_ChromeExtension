export async function handleSessionStorage(message) {
  try {
    switch (message.action) {
      case "SESSION_STORAGE:SET":
        await new Promise((resolve, reject) => {
          chrome.storage.session.set({ [message.key]: message.value }, () => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              console.log("[HANDLER] [SUCCESS] Stored into chrome session storage!", message.value);
              resolve();
            }
          });
        });
        return { success: true };

      case "SESSION_STORAGE:GET":
        const value = await new Promise((resolve, reject) => {
          chrome.storage.session.get([message.key], (result) => {
            if (chrome.runtime.lastError) {
              reject(chrome.runtime.lastError);
            } else {
              console.log("[HANDLER] [SUCCESS] Retrieved from chrome session storage!", result[message.key]);
              resolve(result[message.key]);
            }
          });
        });
        return { success: true, data: value };

      default:
        console.warn("[HANDLER] [WARNING] Unknown action for session storage:", message.action);
        return { success: false, error: "Unknown action" };
    }
  } catch (error) {
    console.error("[HANDLER] [ERROR] Session storage operation failed", error);
    return { success: false, error: error.message || "Unknown error" };
  }
}
