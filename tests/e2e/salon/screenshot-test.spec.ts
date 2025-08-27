import { test, expect } from '@playwright/test';

test('take screenshot of salon page', async ({ page }) => {
  // Set longer timeout
  test.setTimeout(60000);
  
  // Navigate to salon
  console.log('Navigating to /salon...');
  await page.goto('/salon', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  
  // Wait a bit for page to render
  console.log('Waiting 3 seconds for page to render...');
  await page.waitForTimeout(3000);
  
  // Take screenshot
  console.log('Taking screenshot...');
  await page.screenshot({ 
    path: 'test-results/salon-actual-page.png',
    fullPage: true 
  });
  
  // Log page title and URL
  const title = await page.title();
  const url = page.url();
  console.log('Page title:', title);
  console.log('Page URL:', url);
  
  // Get all visible text
  const visibleText = await page.evaluate(() => {
    const elements = document.querySelectorAll('*');
    const texts = [];
    elements.forEach(el => {
      if (el.offsetParent !== null && el.textContent && el.childElementCount === 0) {
        const text = el.textContent.trim();
        if (text.length > 0 && text.length < 100) {
          texts.push(text);
        }
      }
    });
    return texts;
  });
  
  console.log('Visible text elements:', visibleText.slice(0, 20));
  
  // Check for specific elements
  const h1Elements = await page.locator('h1').all();
  console.log('H1 elements found:', h1Elements.length);
  for (const h1 of h1Elements) {
    const text = await h1.textContent();
    console.log('H1 text:', text);
  }
  
  // Check for loading spinners
  const spinners = await page.locator('.animate-spin').count();
  console.log('Loading spinners:', spinners);
  
  // Check if we're on a different page
  if (url.includes('/auth') || url.includes('/login')) {
    console.log('WARNING: Redirected to auth page!');
  }
});