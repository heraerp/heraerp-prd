import { test, expect } from '@playwright/test';

test.describe('Salon POS - Working Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon/pos');
    await page.waitForLoadState('networkidle');
  });

  test('should load POS page', async ({ page }) => {
    expect(page.url()).toContain('/pos');
    
    // Should have substantial content
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(100);
  });

  test('should have POS interface elements', async ({ page }) => {
    // Look for common POS elements
    const posElements = [
      'Point of Sale',
      'Total',
      'Checkout',
      'Cart',
      'Add',
      'Payment'
    ];
    
    let elementsFound = 0;
    for (const text of posElements) {
      const element = page.getByText(new RegExp(text, 'i')).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        elementsFound++;
      }
    }
    
    // Should find at least some POS elements
    expect(elementsFound).toBeGreaterThan(0);
  });

  test('should have service or product sections', async ({ page }) => {
    // Look for tabs or sections
    const sections = [
      page.getByRole('tab'),
      page.getByText(/Services|Products/i)
    ];
    
    let sectionFound = false;
    for (const section of sections) {
      if (await section.first().isVisible({ timeout: 3000 }).catch(() => false)) {
        sectionFound = true;
        break;
      }
    }
    
    expect(sectionFound).toBeTruthy();
  });
});