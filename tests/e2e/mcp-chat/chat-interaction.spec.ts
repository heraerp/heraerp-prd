import { test, expect } from '@playwright/test';

test.describe('MCP Chat Interface', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/mcp-chat');
  });

  test('should display chat interface correctly', async ({ page }) => {
    // Check chat elements
    await expect(page.getByText(/HERA AI Assistant/i)).toBeVisible();
    await expect(page.getByPlaceholder(/ask me anything/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /send/i })).toBeVisible();
    
    // Check welcome message
    await expect(page.getByText(/Hello! I'm your HERA assistant/i)).toBeVisible();
  });

  test('should send and receive messages', async ({ page }) => {
    // Type a message
    const input = page.getByPlaceholder(/ask me anything/i);
    await input.fill('Show today\'s sales summary');
    
    // Send message
    await page.getByRole('button', { name: /send/i }).click();
    
    // Check user message appears
    await expect(page.getByText('Show today\'s sales summary').last()).toBeVisible();
    
    // Wait for response
    await expect(page.getByText(/sales summary|no sales recorded/i)).toBeVisible({
      timeout: 10000
    });
  });

  test('should handle create customer command', async ({ page }) => {
    // Send create command
    await page.getByPlaceholder(/ask me anything/i).fill('Create a new customer named John Doe');
    await page.getByRole('button', { name: /send/i }).click();
    
    // Wait for response
    await expect(page.getByText(/successfully created customer/i)).toBeVisible({
      timeout: 10000
    });
    
    // Response should contain customer ID
    await expect(page.getByText(/ID:/)).toBeVisible();
  });

  test('should show example prompts on first load', async ({ page }) => {
    // Check example prompts are visible
    await expect(page.getByText('Try asking:')).toBeVisible();
    await expect(page.getByRole('button', { name: /create a new customer/i })).toBeVisible();
    
    // Click an example prompt
    await page.getByRole('button', { name: /show today's sales summary/i }).click();
    
    // Input should be filled
    await expect(page.getByPlaceholder(/ask me anything/i)).toHaveValue(/show today's sales summary/i);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    const input = page.getByPlaceholder(/ask me anything/i);
    
    // Type and press Enter
    await input.fill('List all customers');
    await input.press('Enter');
    
    // Message should be sent
    await expect(page.getByText('List all customers').last()).toBeVisible();
    
    // Input should be cleared
    await expect(input).toHaveValue('');
  });
});