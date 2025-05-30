
const AppContext = {
  shadowRoot: null,

  init({ shadowRoot }) {
    this.shadowRoot = shadowRoot;
  },

  getShadowRoot() {
    return this.shadowRoot;
  },
};

export default AppContext;