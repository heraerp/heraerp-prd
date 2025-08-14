const { chromium } = require('@playwright/test');

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();
  
  try {
    console.log('Navigating to /coa...');
    await page.goto('http://localhost:3000/coa');
    
    console.log('Waiting for page to load...');
    await page.waitForTimeout(3000);
    
    console.log('Page title:', await page.title());
    console.log('Page content:');
    const content = await page.content();
    console.log(content.substring(0, 1000) + '...');
    
    // Check for errors in console
    const consoleMessages = [];
    page.on('console', msg => consoleMessages.push(msg.text()));
    
    await page.waitForTimeout(2000);
    console.log('Console messages:', consoleMessages);
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await browser.close();
  }
})();