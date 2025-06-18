let shadowRoot = null;

export async function createShadowRoot() {
  const shadowHost = document.createElement('div');
  shadowHost.id = 'ThMLTShadowDOM';
  document.body.appendChild(shadowHost);

  const root = shadowHost.attachShadow({ mode: 'open' });

  try {
    const response = await fetch(chrome.runtime.getURL('src/content/inject/thmlt-content-script.css'));
    let cssText = (await response.text()).replace(/:root/g, ':host');
    const styleElement = document.createElement('style');
    styleElement.textContent = cssText;
    root.appendChild(styleElement);
  } catch (error) {
    console.error('Failed to fetch CSS:', error);
  }

  return root;
}

export function getShadowRoot() {
  return shadowRoot;
}