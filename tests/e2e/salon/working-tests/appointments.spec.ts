import { test, expect } from '@playwright/test';

test.describe('Salon Appointments - Working Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to appointments via URL
    await page.goto('/salon/appointments');
    // Give page time to load
    await page.waitForLoadState('networkidle');
  });

  test('should load appointments page', async ({ page }) => {
    // Check URL
    expect(page.url()).toContain('/appointments');
    
    // Page should have some content (not 404)
    const pageContent = await page.textContent('body');
    expect(pageContent).toBeTruthy();
    expect(pageContent?.length).toBeGreaterThan(100);
  });

  test('should have appointments heading', async ({ page }) => {
    // Look for any heading with Appointments
    const possibleHeadings = [
      page.locator('h1:has-text("Appointments")'),
      page.locator('h2:has-text("Appointments")'), 
      page.locator('[class*="heading"]:has-text("Appointments")')
    ];
    
    let found = false;
    for (const heading of possibleHeadings) {
      if (await heading.isVisible({ timeout: 5000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    
    expect(found).toBeTruthy();
  });

  test('should have search functionality', async ({ page }) => {
    // Look for search input
    const searchInputs = [
      page.getByPlaceholder(/search/i),
      page.locator('input[type="search"]'),
      page.locator('input').filter({ hasText: /search/i })
    ];
    
    let searchFound = false;
    for (const input of searchInputs) {
      if (await input.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        searchFound = true;
        break;
      }
    }
    
    expect(searchFound).toBeTruthy();
  });

  test('should have action buttons', async ({ page }) => {
    // Look for common action buttons
    const buttonTexts = ['New', 'Add', 'Create', 'Book'];
    
    let buttonFound = false;
    for (const text of buttonTexts) {
      const button = page.getByRole('button').filter({ hasText: new RegExp(text, 'i') });
      if (await button.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        buttonFound = true;
        break;
      }
    }
    
    expect(buttonFound).toBeTruthy();
  });
});