import { test, expect } from '@playwright/test';

test.describe('Salon Clients - Working Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon/clients');
    await page.waitForLoadState('networkidle');
  });

  test('should load clients page', async ({ page }) => {
    expect(page.url()).toContain('/clients');
    
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(100);
  });

  test('should have clients heading or title', async ({ page }) => {
    const clientElements = [
      page.locator('h1:has-text("Client")'),
      page.locator('h2:has-text("Client")'),
      page.getByText(/Clients?/i).first()
    ];
    
    let found = false;
    for (const element of clientElements) {
      if (await element.isVisible({ timeout: 3000 }).catch(() => false)) {
        found = true;
        break;
      }
    }
    
    expect(found).toBeTruthy();
  });

  test('should have add client functionality', async ({ page }) => {
    // Look for add/new client button
    const addButtons = [
      page.getByRole('button').filter({ hasText: /add.*client/i }),
      page.getByRole('button').filter({ hasText: /new.*client/i }),
      page.getByRole('button').filter({ hasText: /\+/i })
    ];
    
    let buttonFound = false;
    for (const button of addButtons) {
      if (await button.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        buttonFound = true;
        break;
      }
    }
    
    expect(buttonFound).toBeTruthy();
  });

  test('should have search or filter options', async ({ page }) => {
    const searchElements = [
      page.getByPlaceholder(/search/i),
      page.getByRole('button').filter({ hasText: /filter/i }),
      page.locator('input[type="search"]')
    ];
    
    let searchFound = false;
    for (const element of searchElements) {
      if (await element.first().isVisible({ timeout: 2000 }).catch(() => false)) {
        searchFound = true;
        break;
      }
    }
    
    expect(searchFound).toBeTruthy();
  });
});