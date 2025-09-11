
export class ElementWatcher {
  constructor(config = {}) {
    this.config = {
      elements: [],
      throttleDelay: 100,
      observeOptions: { childList: true, subtree: true, characterData: true },
      rootElement: document.body,
      autoStart: true,
      debug: false,
      ...config
    };

    this.watchers = new Map();
    this.textObservers = new Map();
    this.throttleTimers = new Map();
    this.lastTexts = new Map();
    this.processedElements = new Set();
    this.mainObserver = null;
    this.isRunning = false;

    if (this.config.autoStart) {
      this.start();
    }
  }

  /**
   * Start watching for elements
   */
  start() {
    if (this.isRunning) return;

    this.log('Starting ElementWatcher');
    
    this.mainObserver = new MutationObserver((mutations) => {
      requestAnimationFrame(() => this.handleMutations(mutations));
    });

    this.mainObserver.observe(this.config.rootElement, this.config.observeOptions);
    this.isRunning = true;

    // Check for existing elements immediately
    this.checkAllElements();
  }

  /**
   * Stop watching and cleanup all observers
   */
  stop() {
    if (!this.isRunning) return;

    this.log('Stopping ElementWatcher...');

    if (this.mainObserver) {
      this.mainObserver.disconnect();
      this.mainObserver = null;
    }

    // Cleanup text observers
    this.textObservers.forEach(observer => observer.disconnect());
    this.textObservers.clear();

    // Clear throttle timers
    this.throttleTimers.forEach(timer => clearTimeout(timer));
    this.throttleTimers.clear();

    this.isRunning = false;
  }

  /**
   * Add a new element to watch
   */
  addElement(elementConfig) {
    const id = this.generateElementId(elementConfig);
    this.config.elements.push({ id, ...elementConfig });
    
    if (this.isRunning) {
      this.checkElement(elementConfig, id);
    }
    
    return id;
  }

  /**
   * Remove an element from watching
   */
  removeElement(elementId) {
    this.config.elements = this.config.elements.filter(el => el.id !== elementId);
    this.processedElements.delete(elementId);
    
    // Cleanup associated observers
    if (this.textObservers.has(elementId)) {
      this.textObservers.get(elementId).disconnect();
      this.textObservers.delete(elementId);
    }
    
    if (this.throttleTimers.has(elementId)) {
      clearTimeout(this.throttleTimers.get(elementId));
      this.throttleTimers.delete(elementId);
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.config = { ...this.config, ...newConfig };
    
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Change the root element being observed
   */
  setRootElement(newRootElement) {
    if (typeof newRootElement === 'string') {
      newRootElement = document.querySelector(newRootElement);
      if (!newRootElement) {
        throw new Error(`Root element not found: ${newRootElement}`);
      }
    }

    if (!(newRootElement instanceof Element)) {
      throw new Error('Root element must be a DOM Element or valid selector string');
    }

    const wasRunning = this.isRunning;
    
    if (wasRunning) {
      this.stop();
    }
    
    this.config.rootElement = newRootElement;
    this.log(`Root element changed to: ${newRootElement.tagName}${newRootElement.className ? '.' + newRootElement.className : ''}`);
    
    // Reset processed elements since we're watching a new root
    this.processedElements.clear();
    this.lastTexts.clear();
    
    if (wasRunning) {
      this.start();
    }
  }

  /**
   * Get current root element
   */
  getRootElement() {
    return this.config.rootElement;
  }

  /**
   * Handle mutations from main observer
   */
  handleMutations(mutations) {
    // Check if all elements have been processed
    const unprocessedElements = this.config.elements.filter(
      el => !this.processedElements.has(el.id || this.generateElementId(el))
    );

    if (unprocessedElements.length === 0) {
      // Check if any elements require ongoing text watching
      const needsWatch = this.config.elements.some(el => el.watchText);
      
      if (!needsWatch) {
        this.log('All elements processed (no watchText), stopping main observer');
        this.mainObserver.disconnect();
        return;
      }
    }


    this.checkAllElements();
  }

  /**
   * Check all configured elements
   */
  checkAllElements() {
    this.config.elements.forEach(elementConfig => {
      const id = elementConfig.id || this.generateElementId(elementConfig);
      if (!this.processedElements.has(id)) {
        this.checkElement(elementConfig, id);
      }
    });
  }

  /**
   * Check for a specific element
   */
  checkElement(elementConfig, id) {
    const element = document.querySelector(elementConfig.selector);

    if (!element) return;

    const prevElement = this.watchers.get(id);

    // Call onFound only if the element is new
    if (element !== prevElement) {
      this.log(`Element found: ${elementConfig.selector}`);
      this.watchers.set(id, element);

      if (elementConfig.onFound) {
        try {
          elementConfig.onFound(element, elementConfig);
        } catch (error) {
          console.error('Error in onFound callback:', error);
        }
      }
    }

    // Always setup or re-setup text watcher
    if (elementConfig.watchText && elementConfig.onTextChange) {
      this.setupTextWatcher(element, elementConfig, id);
    }
  }



  /**
   * Setup text change observer for an element
   */
  setupTextWatcher(element, elementConfig, id) {
    // Disconnect existing observer for this element
    if (this.textObservers.has(id)) {
      this.textObservers.get(id).disconnect();
    }

    const textObserver = new MutationObserver(() => {
      this.handleTextChangeThrottled(element, elementConfig, id);
    });

    textObserver.observe(element, {
      characterData: true, // detect text node changes
      childList: true,     // detect child node additions/removals
      subtree: true        // include nested nodes
    });

    this.textObservers.set(id, textObserver);

    // Run once immediately
    this.handleTextChange(element, elementConfig, id);
  }




  /**
   * Handle text changes with throttling
   */
  handleTextChangeThrottled(element, elementConfig, id) {
    if (this.throttleTimers.has(id)) return;

    const timer = setTimeout(() => {
      this.handleTextChange(element, elementConfig, id);
      this.throttleTimers.delete(id);
    }, this.config.throttleDelay);

    this.throttleTimers.set(id, timer);
  }

  /**
   * Handle text changes
   */
  handleTextChange(element, elementConfig, id) {
    // Normalize text (removes extra whitespace/newlines)
    const currentText = (element.textContent || "").trim();
    const lastText = this.lastTexts.get(id) || "";

    if (currentText === lastText) return;

    this.log(`Text changed for ${elementConfig.selector}: "${lastText}" → "${currentText}"`);

    this.lastTexts.set(id, currentText);

    if (elementConfig.onTextChange) {
      try {
        elementConfig.onTextChange(currentText, lastText, element, elementConfig);
      } catch (error) {
        console.error("Error in onTextChange callback:", error);
      }
    }
  }


  /**
   * Generate unique ID for element config
   */
  generateElementId(elementConfig) {
    return `${elementConfig.selector}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log debug messages
   */
  log(message) {
    if (this.config.debug) {
      console.log(`[ElementWatcher] ${message}`);
    }
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      totalElements: this.config.elements.length,
      processedElements: this.processedElements.size,
      activeTextObservers: this.textObservers.size,
      config: { ...this.config }
    };
  }
}

/**
 * ============================================================================
 * ElementWatcher Documentation
 * ============================================================================
 *
 * A reusable utility class that observes DOM elements based on a list of
 * configuration rules. Useful in dynamic applications where elements load
 * asynchronously (e.g., App Inventor 2, SPAs, Chrome extensions).
 *
 * ----------------------------------------------------------------------------
 * 🔧 USAGE EXAMPLE:
 * ----------------------------------------------------------------------------
 * const watcher = new ElementWatcher({
 *   debug: true,
 *   throttleDelay: 100,
 *   elements: [
 *     {
 *       selector: '.ode-PropertiesComponentName',
 *       onFound: (el) => console.log("Component name found!"),
 *       watchText: true,
 *       onTextChange: (newText, oldText, el) => {
 *         if (newText.endsWith("(Label)")) {
 *           createEditTextWithThmltModalButton();
 *         }
 *       }
 *     },
 *     {
 *       selector: '.ya-Toolbar',
 *       onFound: (el) => createTestButton(el)
 *     }
 *   ]
 * });
 *
 * ----------------------------------------------------------------------------
 * 🧠 NOTE:
 * ----------------------------------------------------------------------------
 * ✅ Create ONE instance of ElementWatcher per page.
 * ✅ Use `addElement()` to dynamically register new selectors later.
 * ✅ Use `removeElement(id)` to stop watching a specific element.
 * ✅ `updateConfig()` allows hot-swapping configuration (e.g., throttleDelay).
 * ✅ `setRootElement()` changes the base node being observed.
 *
 * ❌ DO NOT create multiple instances unless you're watching separate isolated DOM roots.
 *
 * ----------------------------------------------------------------------------
 * 📦 METHODS:
 * ----------------------------------------------------------------------------
 * watcher.start()                     - Starts the main observer.
 * watcher.stop()                      - Stops and cleans up observers.
 * watcher.addElement(config)          - Adds a new element config to watch.
 * watcher.removeElement(id)           - Removes an element config using its ID.
 * watcher.updateConfig(newConfig)     - Updates watcher configuration on the fly.
 * watcher.setRootElement(el | query)  - Sets a new root node to observe.
 * watcher.getRootElement()            - Returns the current root node.
 * watcher.getStatus()                 - Returns debug info about active watchers.
 *
 * ----------------------------------------------------------------------------
 * 📌 Element Config Options:
 * ----------------------------------------------------------------------------
 * {
 *   selector: string,                      // Required: CSS selector to target
 *   onFound?: (element) => void,          // Optional: Called when element is found
 *   watchText?: boolean,                  // Optional: Enable text monitoring
 *   onTextChange?: (newText, oldText, el) // Optional: Callback on text change
 * }
 *
 * ============================================================================
 */
