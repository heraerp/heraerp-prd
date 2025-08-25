import { test, expect } from '@playwright/test';

// Helper functions
async function expandSidebar(page) {
  const sidebar = page.locator('.fixed.left-0').first();
  await sidebar.hover();
  await page.waitForTimeout(500);
}

async function navigateToClients(page) {
  await expandSidebar(page);
  const clientsButton = page.locator('.fixed.left-0 button').filter({ hasText: 'Clients' }).first();
  await clientsButton.click();
  await page.waitForURL('**/salon/clients', { timeout: 10000 });
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000); // Extra wait for dynamic content
}

test.describe('Client Management - Production Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
  });

  test('✅ CM-001: Navigate to Clients page', async ({ page }) => {
    await navigateToClients(page);
    expect(page.url()).toContain('/salon/clients');
  });

  test('✅ CM-002: Main page elements load', async ({ page }) => {
    await navigateToClients(page);
    
    // Wait for any heading to appear
    await page.waitForSelector('h1, h2, h3', { timeout: 10000 });
    
    // Check for any heading with "Client" text
    const headings = await page.locator('h1, h2, h3').all();
    let hasClientHeading = false;
    
    for (const heading of headings) {
      const text = await heading.textContent();
      if (text?.toLowerCase().includes('client')) {
        hasClientHeading = true;
        break;
      }
    }
    
    expect(hasClientHeading).toBeTruthy();
    
    // Check for Add button
    const addButtonExists = await page.getByRole('button').filter({ 
      hasText: /add|new|create/i 
    }).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(addButtonExists).toBeTruthy();
  });

  test('✅ CM-003: Search input functionality', async ({ page }) => {
    await navigateToClients(page);
    
    // Multiple search input selectors
    const searchSelectors = [
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      'input[type="search"]',
      'input[placeholder*="name"]',
      'input[placeholder*="client"]'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        searchInput = input;
        break;
      }
    }
    
    expect(searchInput).not.toBeNull();
    
    if (searchInput) {
      await searchInput.click();
      await searchInput.fill('Test Search');
      const value = await searchInput.inputValue();
      expect(value).toBe('Test Search');
    }
  });

  test('✅ CM-004: Add Client dialog functionality', async ({ page }) => {
    await navigateToClients(page);
    
    const addButton = page.getByRole('button').filter({ 
      hasText: /add.*client|new.*client|create.*client/i 
    }).first();
    
    await addButton.click();
    
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Check critical form fields
    const nameField = dialog.locator('input').filter({ 
      hasNot: page.locator('[type="hidden"]') 
    }).first();
    await expect(nameField).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('✅ CM-005: Client data display', async ({ page }) => {
    await navigateToClients(page);
    
    // Wait for content area
    await page.waitForTimeout(2000);
    
    // Check for any client-related content
    const hasClientContent = await page.locator(
      '.grid, table, [class*="client"], [class*="Client"], text=/no.*client|add.*client/i'
    ).first().isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(hasClientContent).toBeTruthy();
  });

  test('✅ CM-006: Export functionality exists', async ({ page }) => {
    await navigateToClients(page);
    
    const exportButton = page.getByRole('button').filter({ hasText: 'Export' }).first();
    const exportExists = await exportButton.isVisible({ timeout: 5000 }).catch(() => false);
    
    expect(exportExists).toBeTruthy();
  });

  test('✅ CM-007: Filter options available', async ({ page }) => {
    await navigateToClients(page);
    
    // Check for any filter-related elements
    const filterElements = await page.locator(
      'button:has-text("Filter"), select, [role="combobox"], button:has-text("All")'
    ).count();
    
    expect(filterElements).toBeGreaterThan(0);
  });

  test('✅ CM-008: Form validation works', async ({ page }) => {
    await navigateToClients(page);
    
    // Open add dialog
    const addButton = page.getByRole('button').filter({ 
      hasText: /add.*client/i 
    }).first();
    await addButton.click();
    
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Try to submit without filling required fields
    const submitButton = dialog.getByRole('button').filter({ 
      hasText: /create|submit|save|add/i 
    }).last(); // Last button is usually submit
    
    await submitButton.click();
    await page.waitForTimeout(1000);
    
    // Check if we're still in the dialog (validation prevented submission)
    const stillInDialog = await dialog.isVisible();
    expect(stillInDialog).toBeTruthy();
    
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('✅ CM-009: Responsive design basics', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    // Check sidebar still works on mobile
    const sidebar = page.locator('.fixed.left-0').first();
    await expect(sidebar).toBeVisible();
    
    // Try to navigate (might be icon-only on mobile)
    await sidebar.hover();
    const clientsButton = sidebar.locator('button').nth(3);
    await clientsButton.click();
    
    // Verify navigation worked
    await page.waitForTimeout(2000);
    const onClientsPage = page.url().includes('clients');
    expect(onClientsPage).toBeTruthy();
  });
});

test.describe('Performance Benchmarks', () => {
  test('⚡ Page loads in reasonable time', async ({ page }) => {
    const start = Date.now();
    await page.goto('/salon/clients');
    await page.waitForLoadState('domcontentloaded');
    const docTime = Date.now() - start;
    
    await page.waitForLoadState('networkidle');
    const fullTime = Date.now() - start;
    
    console.log(`DOM ready: ${docTime}ms, Full load: ${fullTime}ms`);
    
    // Generous limits for CI environments
    expect(docTime).toBeLessThan(15000); // 15s for DOM
    expect(fullTime).toBeLessThan(30000); // 30s for full load
  });

  test('⚡ Navigation is responsive', async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    const start = Date.now();
    await navigateToClients(page);
    const navTime = Date.now() - start;
    
    console.log(`Navigation time: ${navTime}ms`);
    expect(navTime).toBeLessThan(10000); // 10s max
  });
});

// Summary test for quick validation
test('🎯 Client Management Quick Validation', async ({ page }) => {
  // Navigate to clients
  await page.goto('/salon');
  await navigateToClients(page);
  
  // Quick checks
  const checks = {
    'URL correct': page.url().includes('/salon/clients'),
    'Page has content': (await page.locator('body').textContent())?.length > 100,
    'Has buttons': (await page.getByRole('button').count()) > 0,
    'Has heading': (await page.locator('h1, h2, h3').count()) > 0
  };
  
  console.log('Quick validation results:', checks);
  
  // At least 3 out of 4 should pass
  const passed = Object.values(checks).filter(v => v).length;
  expect(passed).toBeGreaterThanOrEqual(3);
});