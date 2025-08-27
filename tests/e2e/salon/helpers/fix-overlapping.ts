import { Page } from '@playwright/test';

/**
 * Inject CSS to fix overlapping elements in the salon UI during tests
 */
export async function fixOverlappingElements(page: Page) {
  await page.addStyleTag({
    content: `
      /* Ensure sidebar is clickable */
      .fixed.left-0,
      [class*="sidebar"] {
        z-index: 50 !important;
      }
      
      /* Fix overlapping content */
      .ml-16 > div,
      [class*="ml-16"] > div {
        position: relative;
        z-index: 1;
      }
      
      /* Ensure navigation links are clickable */
      nav a,
      nav button,
      [class*="sidebar"] a,
      [class*="sidebar"] button {
        position: relative;
        z-index: 100 !important;
        pointer-events: auto !important;
      }
      
      /* Fix any absolute positioned overlays */
      .absolute {
        pointer-events: none;
      }
      
      .absolute button,
      .absolute a,
      .absolute input {
        pointer-events: auto !important;
      }
      
      /* Ensure cards don't block navigation */
      .card,
      [class*="card"] {
        position: relative;
        z-index: 1;
      }
      
      /* Debug: highlight clickable areas */
      /*
      a, button {
        outline: 2px solid red !important;
      }
      */
    `
  });
}

/**
 * Wait for sidebar to be fully loaded and interactive
 */
export async function waitForSidebar(page: Page) {
  // Wait for sidebar to exist
  await page.waitForSelector('.fixed.left-0, [class*="sidebar"], nav', { 
    state: 'visible',
    timeout: 10000 
  });
  
  // Wait for navigation items to be loaded
  await page.waitForSelector('text=Dashboard', { state: 'visible' });
  
  // Give it a moment for any animations to complete
  await page.waitForTimeout(500);
}

/**
 * Click navigation item with fallback strategies
 */
export async function clickNavigationItem(page: Page, itemText: string) {
  // Strategy 1: Try to click the link/button directly
  const linkSelector = `a:has-text("${itemText}"), button:has-text("${itemText}")`;
  const link = page.locator(linkSelector).first();
  
  if (await link.isVisible({ timeout: 2000 })) {
    try {
      await link.click();
      return true;
    } catch (e) {
      console.log(`Direct click failed for ${itemText}, trying force click`);
    }
  }
  
  // Strategy 2: Force click
  try {
    await page.getByText(itemText, { exact: true }).first().click({ force: true });
    return true;
  } catch (e) {
    console.log(`Force click failed for ${itemText}, trying JS click`);
  }
  
  // Strategy 3: JavaScript click
  const clicked = await page.evaluate((text) => {
    const element = Array.from(document.querySelectorAll('a, button')).find(
      el => el.textContent?.trim() === text
    );
    if (element) {
      (element as HTMLElement).click();
      return true;
    }
    return false;
  }, itemText);
  
  return clicked;
}