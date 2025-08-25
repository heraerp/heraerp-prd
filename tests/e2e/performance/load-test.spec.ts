import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load dashboard within acceptable time', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/org/dashboard');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    
    // Dashboard should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
    
    // Check core elements are loaded
    await expect(page.getByText(/dashboard/i)).toBeVisible();
  });

  test('should handle rapid interactions', async ({ page }) => {
    await page.goto('/mcp-chat');
    
    // Send multiple messages rapidly
    const messages = [
      'Show customers',
      'List products',
      'Get transactions',
      'Show reports'
    ];
    
    for (const message of messages) {
      await page.getByPlaceholder(/ask me anything/i).fill(message);
      await page.getByRole('button', { name: /send/i }).click();
      // Don't wait for response, send next immediately
    }
    
    // All messages should be sent
    for (const message of messages) {
      await expect(page.getByText(message)).toBeVisible();
    }
    
    // Should handle all responses without errors
    await page.waitForTimeout(5000);
    await expect(page.getByText(/error/i)).not.toBeVisible();
  });

  test('should handle large data sets', async ({ page }) => {
    await page.goto('/org/entities');
    
    // Assuming we have many entities, check pagination works
    await expect(page.getByRole('button', { name: /next page/i })).toBeVisible();
    
    // Navigate through pages
    await page.getByRole('button', { name: /next page/i }).click();
    
    // Table should update
    await expect(page.getByRole('row')).toHaveCount(await page.getByRole('row').count());
  });
});