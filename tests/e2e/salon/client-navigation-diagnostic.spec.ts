import { test, expect } from '@playwright/test';

test('Diagnose Clients Navigation', async ({ page }) => {
  await page.goto('/salon');
  await page.waitForLoadState('networkidle');
  
  console.log('\n=== SIDEBAR DIAGNOSTIC ===\n');
  
  // Expand sidebar
  const sidebar = page.locator('.fixed.left-0').first();
  await sidebar.hover();
  await page.waitForTimeout(500);
  
  // Get all buttons in sidebar
  const buttons = await sidebar.locator('button').all();
  console.log(`Total buttons in sidebar: ${buttons.length}`);
  
  // Log each button's details
  for (let i = 0; i < buttons.length; i++) {
    const button = buttons[i];
    const text = await button.textContent();
    const isVisible = await button.isVisible();
    const classes = await button.getAttribute('class');
    
    console.log(`\nButton ${i}:`);
    console.log(`  Text: "${text?.trim()}"`);
    console.log(`  Visible: ${isVisible}`);
    console.log(`  Classes: ${classes?.substring(0, 100)}...`);
    
    // Check if this could be the Clients button
    if (text?.includes('Clients')) {
      console.log('  *** THIS IS THE CLIENTS BUTTON ***');
      
      // Try clicking it
      try {
        await button.click();
        await page.waitForTimeout(1000);
        console.log(`  Clicked! New URL: ${page.url()}`);
        
        // If navigation worked, break
        if (page.url().includes('clients')) {
          console.log('  ✓ Navigation successful!');
          break;
        }
      } catch (e) {
        console.log(`  Click failed: ${e.message}`);
      }
    }
  }
  
  // Also check for any span elements with "Clients" text
  console.log('\n=== SEARCHING FOR CLIENTS TEXT ===\n');
  const clientsElements = await page.locator('*:has-text("Clients"):visible').all();
  console.log(`Found ${clientsElements.length} elements with "Clients" text`);
  
  for (let i = 0; i < Math.min(5, clientsElements.length); i++) {
    const elem = clientsElements[i];
    const tagName = await elem.evaluate(el => el.tagName);
    const className = await elem.getAttribute('class');
    const parentTag = await elem.evaluate(el => el.parentElement?.tagName);
    console.log(`  ${i}: <${tagName}> class="${className}" parent=<${parentTag}>`);
  }
  
  // Try a different approach - look for the third navigation item
  console.log('\n=== TRYING POSITION-BASED NAVIGATION ===\n');
  const navButtons = await sidebar.locator('nav button, button[class*="justify-start"], button[class*="w-full"]').all();
  console.log(`Found ${navButtons.length} navigation buttons`);
  
  if (navButtons.length >= 3) {
    console.log('Clicking third navigation button (should be Clients)...');
    await navButtons[2].click();
    await page.waitForTimeout(1000);
    console.log(`New URL: ${page.url()}`);
  }
  
  // Take a screenshot
  await page.screenshot({ path: 'test-results/sidebar-diagnostic.png', fullPage: true });
});