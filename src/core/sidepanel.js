import { showHomeScreen, addProjectCard } from "./screens/home/home.js";
import sessionManager from "../utils/sessionManager.js";

import { getDatabaseManager } from "../db/DatabaseManager.js";

(async () => {
  const db = await getDatabaseManager();

  try {
    await showHomeScreen();

    const projects = await db.projects.getAll();

    for (const project of projects) {
      addProjectCard(project);
    }

    sessionManager.restoreSession();
  } catch (error) {
    console.error(error);
  }

})();


export function replaceClass(element, prefix, newClass) {
  element.className = element.className
      .split(" ") // Split into array
      .filter(cls => !cls.startsWith(prefix)) // Remove old class with prefix
      .join(" "); // Convert back to string
  
  element.classList.add(newClass); // Add new class
}

export function debounce(fn, delay = 300, options = { leading: false, trailing: true }) {
  let timer;
  let lastInvokeTime = 0;

  const { leading, trailing } = options;

  function invokeFunction(context, args) {
    fn.apply(context, args);
    lastInvokeTime = Date.now();
  }

  return function (...args) {
    const now = Date.now();
    const timeElapsed = now - lastInvokeTime;

    // Leading edge: Execute immediately if 'leading' is true and the delay has passed.
    if (leading && timeElapsed >= delay) {
      invokeFunction(this, args);
    }

    // Cancel previous call if necessary.
    clearTimeout(timer);

    // Trailing edge: Call after the delay if 'trailing' is true.
    if (trailing) {
      timer = setTimeout(() => {
        const timeRemaining = delay - timeElapsed;
        if (timeRemaining <= 0) {
          invokeFunction(this, args);
        }
      }, timeElapsed < delay ? delay - timeElapsed : 0);
    }
  };
}

export function throttle(fn, limit) {
  let lastCall = 0;
  let pendingCall = null;

  return function (...args) {
    const now = Date.now();

    if (now - lastCall >= limit) {
      lastCall = now;
      fn.apply(this, args);
    } else {
      // If a call is attempted during throttle delay, store the latest args
      clearTimeout(pendingCall);
      pendingCall = setTimeout(() => {
        lastCall = Date.now();
        fn.apply(this, args);
      }, limit - (now - lastCall));
    }
  };
}

export function calculateNewOrderIndex(prevIndex, nextIndex) {
  if (prevIndex === null && nextIndex === null) return 1000; 

  if (prevIndex === null) {
    const distanceToNext = nextIndex - 1000;

    if (distanceToNext <= 0) {
      const midIndex = Math.floor(nextIndex / 2);
      if (midIndex <= 1) throw new Error('No gap to insert');
      return midIndex;
    }

    return distanceToNext; 
  }         

  if (nextIndex === null) return prevIndex + 1000;        

  const gapBetween = nextIndex - prevIndex;
  if (gapBetween <= 1) throw new Error('No gap to insert');

  return prevIndex + Math.floor(gapBetween / 2);
}



