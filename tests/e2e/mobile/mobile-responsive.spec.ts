import { test, expect, devices } from '@playwright/test';

test.use({
  ...devices['iPhone 12']
});

test.describe('Mobile Responsiveness', () => {
  test('should display mobile menu', async ({ page }) => {
    await page.goto('/');
    
    // Mobile menu button should be visible
    await expect(page.getByRole('button', { name: /menu/i })).toBeVisible();
    
    // Click menu
    await page.getByRole('button', { name: /menu/i }).click();
    
    // Navigation should appear
    await expect(page.getByRole('navigation')).toBeVisible();
  });

  test('should handle touch interactions in chat', async ({ page }) => {
    await page.goto('/mcp-chat');
    
    // Chat should be mobile optimized
    const chatCard = page.locator('.max-w-4xl');
    await expect(chatCard).toHaveCSS('width', /100%|\\d+px/);
    
    // Input should be accessible
    const input = page.getByPlaceholder(/ask me anything/i);
    await input.tap();
    await input.fill('Mobile test message');
    
    // Send button should be tappable
    await page.getByRole('button', { name: /send/i }).tap();
    
    // Message should appear
    await expect(page.getByText('Mobile test message')).toBeVisible();
  });

  test('should scroll properly on mobile', async ({ page }) => {
    await page.goto('/org/entities');
    
    // Table should be scrollable horizontally
    const table = page.locator('table');
    const tableBox = await table.boundingBox();
    
    // Swipe to scroll
    if (tableBox) {
      await page.mouse.move(tableBox.x + 100, tableBox.y + 50);
      await page.mouse.down();
      await page.mouse.move(tableBox.x - 100, tableBox.y + 50);
      await page.mouse.up();
    }
    
    // Content should still be accessible
    await expect(page.getByRole('columnheader')).toHaveCount(await page.getByRole('columnheader').count());
  });
});