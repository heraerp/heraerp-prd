import { test, expect } from '@playwright/test';

test('Debug Salon Navigation Structure', async ({ page }) => {
  await page.goto('/salon');
  await page.waitForLoadState('networkidle');
  
  // Log all links and buttons in the sidebar
  const sidebarSelectors = [
    '.fixed.left-0',
    '[class*="sidebar"]',
    'nav'
  ];
  
  for (const selector of sidebarSelectors) {
    const sidebar = page.locator(selector).first();
    if (await sidebar.isVisible()) {
      console.log(`\nFound sidebar with selector: ${selector}`);
      
      // Get all links
      const links = await sidebar.locator('a').all();
      console.log(`Found ${links.length} links:`);
      for (const link of links) {
        const text = await link.textContent();
        const href = await link.getAttribute('href');
        const isVisible = await link.isVisible();
        console.log(`  - Link: "${text?.trim()}" href="${href}" visible=${isVisible}`);
      }
      
      // Get all buttons
      const buttons = await sidebar.locator('button').all();
      console.log(`Found ${buttons.length} buttons:`);
      for (const button of buttons) {
        const text = await button.textContent();
        const isVisible = await button.isVisible();
        console.log(`  - Button: "${text?.trim()}" visible=${isVisible}`);
      }
      
      // Get all clickable divs/p tags
      const clickables = await sidebar.locator('div[onclick], p[onclick], div[role="button"], p[role="button"]').all();
      console.log(`Found ${clickables.length} other clickable elements`);
    }
  }
  
  // Check what happens when we try to click Appointments
  console.log('\nTrying to find Appointments element...');
  const appointmentsElements = await page.locator('text="Appointments"').all();
  console.log(`Found ${appointmentsElements.length} elements with text "Appointments"`);
  
  for (let i = 0; i < appointmentsElements.length; i++) {
    const elem = appointmentsElements[i];
    const tagName = await elem.evaluate(el => el.tagName);
    const className = await elem.getAttribute('class');
    const parent = await elem.evaluate(el => ({
      tag: el.parentElement?.tagName,
      class: el.parentElement?.className,
      href: (el.parentElement as any)?.href
    }));
    console.log(`  ${i}: <${tagName}> class="${className}"`);
    console.log(`      Parent: <${parent.tag}> class="${parent.class}" href="${parent.href}"`);
  }
  
  // Try to understand the navigation structure
  console.log('\nChecking page structure for navigation...');
  const navStructure = await page.evaluate(() => {
    // Find all elements that might be navigation items
    const navItems = Array.from(document.querySelectorAll('*')).filter(el => {
      const text = el.textContent?.trim();
      return text === 'Appointments' || text === 'Clients' || text === 'Dashboard';
    });
    
    return navItems.map(el => {
      let clickableParent = el;
      // Find the nearest clickable parent
      while (clickableParent && clickableParent.tagName !== 'A' && clickableParent.tagName !== 'BUTTON' && !clickableParent.onclick) {
        clickableParent = clickableParent.parentElement as HTMLElement;
      }
      
      return {
        text: el.textContent?.trim(),
        elementTag: el.tagName,
        elementClass: el.className,
        clickableTag: clickableParent?.tagName || 'none',
        clickableClass: clickableParent?.className || 'none',
        hasOnClick: !!clickableParent?.onclick,
        href: (clickableParent as any)?.href
      };
    });
  });
  
  console.log('\nNavigation structure:');
  console.log(JSON.stringify(navStructure, null, 2));
});