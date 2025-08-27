import { test, expect } from '@playwright/test';

test.describe('Salon Diagnostic Tests', () => {
  test('should navigate to salon page', async ({ page }) => {
    // Try to navigate to salon page
    await page.goto('/salon', { waitUntil: 'domcontentloaded' });
    
    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/salon-page.png' });
    
    // Log the page title
    const title = await page.title();
    console.log('Page title:', title);
    
    // Log the URL
    console.log('Current URL:', page.url());
    
    // Check if we're on the salon page
    await expect(page.url()).toContain('/salon');
  });

  test('should check page content', async ({ page }) => {
    await page.goto('/salon', { waitUntil: 'networkidle' });
    
    // Log all text content
    const textContent = await page.textContent('body');
    console.log('Page contains:', textContent?.substring(0, 200) + '...');
    
    // Check for any error messages
    const errorElements = await page.locator('.error, [class*="error"], [class*="Error"]').all();
    if (errorElements.length > 0) {
      console.log('Found error elements:', errorElements.length);
      for (const elem of errorElements) {
        const text = await elem.textContent();
        console.log('Error text:', text);
      }
    }
    
    // Check for loading indicators still present
    const loadingElements = await page.locator('.animate-spin, .animate-pulse, [class*="loading"], [class*="Loading"]').all();
    if (loadingElements.length > 0) {
      console.log('Found loading elements:', loadingElements.length);
    }
    
    // Check for main heading variations
    const possibleHeadings = [
      'h1:has-text("Salon Dashboard")',
      'h1:has-text("Salon")',
      'h2:has-text("Salon")',
      'text="Salon Dashboard"',
      '[class*="heading"]:has-text("Salon")'
    ];
    
    let headingFound = false;
    for (const selector of possibleHeadings) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          console.log('Found heading with selector:', selector);
          headingFound = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }
    
    if (!headingFound) {
      console.log('No salon heading found');
    }
  });

  test('should check authentication state', async ({ page }) => {
    // Check if we're redirected to login
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    const finalUrl = page.url();
    console.log('Final URL after navigation:', finalUrl);
    
    if (finalUrl.includes('/auth/login') || finalUrl.includes('/login')) {
      console.log('Redirected to login page - authentication required');
    }
    
    // Check for auth-related elements
    const authElements = [
      'button:has-text("Sign In")',
      'button:has-text("Login")',
      'input[type="email"]',
      'input[type="password"]'
    ];
    
    for (const selector of authElements) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Found auth element:', selector);
      }
    }
  });

  test('should check for organization context', async ({ page }) => {
    await page.goto('/salon');
    
    // Check localStorage for organization info
    const localStorage = await page.evaluate(() => {
      return {
        orgId: window.localStorage.getItem('organizationId'),
        authToken: window.localStorage.getItem('authToken') ? 'present' : 'missing',
        userInfo: window.localStorage.getItem('user') ? 'present' : 'missing'
      };
    });
    
    console.log('LocalStorage state:', localStorage);
    
    // Check for organization selector
    const orgSelectors = [
      'text="Select Organization"',
      'text="Choose Organization"',
      '[class*="organization"]',
      'select[name*="org"]'
    ];
    
    for (const selector of orgSelectors) {
      const element = await page.locator(selector).first();
      if (await element.isVisible({ timeout: 1000 }).catch(() => false)) {
        console.log('Found organization selector:', selector);
      }
    }
  });
});