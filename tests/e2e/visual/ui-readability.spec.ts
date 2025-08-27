import { test, expect } from '@playwright/test';

test.describe('UI Readability Tests', () => {
  test('chat messages should have proper contrast', async ({ page }) => {
    await page.goto('/mcp-chat');
    
    // Wait for chat to load
    await page.waitForSelector('.max-w-4xl');
    
    // Check text contrast in messages
    const assistantMessage = page.locator('p.text-gray-900').first();
    await expect(assistantMessage).toBeVisible();
    
    // Get computed styles
    const textColor = await assistantMessage.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Should be dark gray (rgb values for gray-900)
    expect(textColor).toMatch(/rgb\(17,|gray/);
    
    // Check background contrast
    const messageContainer = page.locator('.bg-gray-50').first();
    const bgColor = await messageContainer.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have light background
    expect(bgColor).toMatch(/rgb\(249,|gray/);
  });

  test('input area should be clearly visible', async ({ page }) => {
    await page.goto('/mcp-chat');
    
    const textarea = page.getByPlaceholder(/ask me anything/i);
    
    // Check visibility
    await expect(textarea).toBeVisible();
    
    // Check styles
    const styles = await textarea.evaluate(el => {
      const computed = window.getComputedStyle(el);
      return {
        fontSize: computed.fontSize,
        color: computed.color,
        backgroundColor: computed.backgroundColor
      };
    });
    
    // Font should be base size (16px)
    expect(styles.fontSize).toBe('16px');
    
    // Should have proper contrast
    expect(styles.color).toMatch(/rgb\(17,|gray-900/);
    expect(styles.backgroundColor).toMatch(/rgb\(255,|white/);
  });

  test('visual regression - chat interface', async ({ page }) => {
    await page.goto('/mcp-chat');
    
    // Wait for interface to stabilize
    await page.waitForTimeout(1000);
    
    // Take screenshot for visual comparison
    await expect(page).toHaveScreenshot('chat-interface.png', {
      fullPage: false,
      clip: { x: 0, y: 0, width: 1280, height: 720 }
    });
  });

  test('dark mode contrast', async ({ page }) => {
    // Set dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/mcp-chat');
    
    // Check dark mode text
    const message = page.locator('p.dark\\:text-gray-100').first();
    const darkTextColor = await message.evaluate(el => 
      window.getComputedStyle(el).color
    );
    
    // Should be light in dark mode
    expect(darkTextColor).toMatch(/rgb\(243,|gray-100/);
    
    // Check dark background
    const container = page.locator('.dark\\:bg-gray-950').first();
    const darkBgColor = await container.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    
    // Should have dark background
    expect(darkBgColor).toMatch(/rgb\(3,|gray-950/);
  });
});