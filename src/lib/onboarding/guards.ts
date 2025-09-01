/**
 * HERA Universal Onboarding - Guards
 * 
 * DOM readiness checks, route validation, and retry logic
 * Ensures tour steps only show when elements are available
 */

/**
 * Wait for element to appear in DOM
 * Uses CSS selector with configurable timeout
 */
export async function awaitSelector(
  selector: string,
  timeoutMs: number = 5000,
  pollInterval: number = 100
): Promise<Element | null> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    // Check immediately
    const element = document.querySelector(selector);
    if (element && isElementVisible(element)) {
      resolve(element);
      return;
    }
    
    // Poll for element
    const intervalId = setInterval(() => {
      const element = document.querySelector(selector);
      const elapsed = Date.now() - startTime;
      
      if (element && isElementVisible(element)) {
        clearInterval(intervalId);
        resolve(element);
      } else if (elapsed >= timeoutMs) {
        clearInterval(intervalId);
        resolve(null);
      }
    }, pollInterval);
  });
}

/**
 * Wait for custom condition
 * Supports async predicates
 */
export async function awaitCondition(
  condition: () => boolean | Promise<boolean>,
  timeoutMs: number = 5000,
  pollInterval: number = 100
): Promise<boolean> {
  const startTime = Date.now();
  
  return new Promise(async (resolve) => {
    // Check immediately
    try {
      const result = await condition();
      if (result) {
        resolve(true);
        return;
      }
    } catch (error) {
      console.warn('Condition check failed:', error);
    }
    
    // Poll for condition
    const intervalId = setInterval(async () => {
      const elapsed = Date.now() - startTime;
      
      try {
        const result = await condition();
        if (result) {
          clearInterval(intervalId);
          resolve(true);
        } else if (elapsed >= timeoutMs) {
          clearInterval(intervalId);
          resolve(false);
        }
      } catch (error) {
        console.warn('Condition check failed:', error);
        if (elapsed >= timeoutMs) {
          clearInterval(intervalId);
          resolve(false);
        }
      }
    }, pollInterval);
  });
}

/**
 * Check if element is visible
 * More reliable than just existence
 */
export function isElementVisible(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  const style = window.getComputedStyle(element);
  
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    style.display !== 'none' &&
    style.visibility !== 'hidden' &&
    style.opacity !== '0'
  );
}

/**
 * Ensure route matches or navigate
 * Supports both string paths and navigation functions
 */
export async function ensureRoute(
  router: any,
  route: string | ((router: any) => Promise<void>),
  currentPath?: string
): Promise<boolean> {
  try {
    // If route is a function, execute it
    if (typeof route === 'function') {
      await route(router);
      return true;
    }
    
    // Get current path (Next.js or React Router compatible)
    const current = currentPath || getCurrentPath(router);
    
    // Already on correct route
    if (current === route) {
      return true;
    }
    
    // Navigate to route
    await navigateToRoute(router, route);
    
    // Wait for navigation to complete
    await waitForRouteChange(router, route);
    
    return true;
  } catch (error) {
    console.error('Route navigation failed:', error);
    return false;
  }
}

/**
 * Get current path from router
 * Supports multiple router implementations
 */
function getCurrentPath(router: any): string {
  // Next.js App Router
  if (router?.pathname) {
    return router.pathname;
  }
  
  // React Router
  if (router?.location?.pathname) {
    return router.location.pathname;
  }
  
  // Fallback to window location
  if (typeof window !== 'undefined') {
    return window.location.pathname;
  }
  
  return '/';
}

/**
 * Navigate to route
 * Supports multiple router implementations
 */
async function navigateToRoute(router: any, route: string): Promise<void> {
  // Next.js App Router
  if (router?.push) {
    await router.push(route);
    return;
  }
  
  // React Router
  if (router?.navigate) {
    await router.navigate(route);
    return;
  }
  
  // Fallback to window navigation
  if (typeof window !== 'undefined') {
    window.location.pathname = route;
  }
}

/**
 * Wait for route change to complete
 */
async function waitForRouteChange(
  router: any,
  targetRoute: string,
  timeoutMs: number = 3000
): Promise<void> {
  const startTime = Date.now();
  
  return new Promise((resolve) => {
    const checkInterval = setInterval(() => {
      const current = getCurrentPath(router);
      const elapsed = Date.now() - startTime;
      
      if (current === targetRoute || elapsed >= timeoutMs) {
        clearInterval(checkInterval);
        resolve();
      }
    }, 100);
  });
}

/**
 * Combined guard for step readiness
 * Checks route and element availability
 */
export async function isStepReady(
  selector: string,
  options: {
    route?: string | ((router: any) => Promise<void>);
    waitFor?: string | (() => boolean | Promise<boolean>);
    timeoutMs?: number;
    router?: any;
  } = {}
): Promise<boolean> {
  const { route, waitFor, timeoutMs = 5000, router } = options;
  
  // Check route first
  if (route && router) {
    const routeReady = await ensureRoute(router, route);
    if (!routeReady) {
      return false;
    }
  }
  
  // Check custom wait condition
  if (waitFor) {
    if (typeof waitFor === 'string') {
      const element = await awaitSelector(waitFor, timeoutMs);
      if (!element) {
        return false;
      }
    } else {
      const conditionMet = await awaitCondition(waitFor, timeoutMs);
      if (!conditionMet) {
        return false;
      }
    }
  }
  
  // Check target selector
  const targetElement = await awaitSelector(selector, timeoutMs);
  return !!targetElement;
}

/**
 * Batch check multiple selectors
 * Useful for checking if page is fully loaded
 */
export async function awaitMultipleSelectors(
  selectors: string[],
  options: {
    timeoutMs?: number;
    requireAll?: boolean;
  } = {}
): Promise<boolean> {
  const { timeoutMs = 5000, requireAll = true } = options;
  
  const promises = selectors.map(selector => awaitSelector(selector, timeoutMs));
  const results = await Promise.all(promises);
  
  if (requireAll) {
    return results.every(element => element !== null);
  } else {
    return results.some(element => element !== null);
  }
}

/**
 * Check if running in SSR environment
 */
export function isSSR(): boolean {
  return typeof window === 'undefined';
}

/**
 * Check if reduced motion is preferred
 */
export function prefersReducedMotion(): boolean {
  if (isSSR()) {
    return false;
  }
  
  const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  return mediaQuery.matches;
}

/**
 * Debounced resize observer for responsive tours
 */
export function createResizeObserver(
  element: Element,
  callback: (entry: ResizeObserverEntry) => void,
  debounceMs: number = 100
): ResizeObserver | null {
  if (isSSR() || !window.ResizeObserver) {
    return null;
  }
  
  let timeoutId: NodeJS.Timeout;
  
  const observer = new ResizeObserver((entries) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      entries.forEach(callback);
    }, debounceMs);
  });
  
  observer.observe(element);
  
  return observer;
}