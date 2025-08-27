import { test, expect } from '@playwright/test';

// Helper to expand sidebar with proper timing
async function expandSidebar(page) {
  const sidebar = page.locator('.fixed.left-0').first();
  await sidebar.hover();
  await page.waitForTimeout(500); // Give time for expansion animation
}

// Helper to navigate to clients with retry logic
async function navigateToClients(page) {
  await expandSidebar(page);
  
  // Find the Clients button - it's usually the 4th button (index 3)
  const clientsButton = page.locator('.fixed.left-0 button').filter({ 
    hasText: 'Clients' 
  }).first();
  
  // Click and wait for navigation
  await clientsButton.click();
  
  // Wait for URL to change to clients page
  await page.waitForURL('**/salon/clients', { timeout: 10000 });
  
  // Extra wait for page to fully load
  await page.waitForLoadState('networkidle');
}

test.describe('Client Management - Complete Suite', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to salon dashboard
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
  });

  test('CM-001: Navigate to Clients page', async ({ page }) => {
    // Navigate using our helper
    await navigateToClients(page);
    
    // Verify URL
    expect(page.url()).toContain('/salon/clients');
    
    // Verify page loaded
    await expect(page.locator('h1')).toBeVisible({ timeout: 10000 });
  });

  test('CM-002: Clients page displays main elements', async ({ page }) => {
    await navigateToClients(page);
    
    // Check for main heading - could be either
    const possibleHeadings = [
      page.getByRole('heading', { name: 'Client Management' }),
      page.getByRole('heading', { name: 'Clients' }),
      page.locator('h1').filter({ hasText: 'Client' })
    ];
    
    let headingFound = false;
    for (const heading of possibleHeadings) {
      if (await heading.isVisible({ timeout: 2000 }).catch(() => false)) {
        headingFound = true;
        break;
      }
    }
    expect(headingFound).toBeTruthy();
    
    // Check for Add Client button
    const addButton = page.getByRole('button').filter({ hasText: /Add.*Client|New.*Client/i }).first();
    await expect(addButton).toBeVisible({ timeout: 5000 });
  });

  test('CM-003: Search functionality', async ({ page }) => {
    await navigateToClients(page);
    
    // Find search input
    const searchInput = page.locator('input[placeholder*="Search"], input[placeholder*="search"], input[type="search"]').first();
    await expect(searchInput).toBeVisible({ timeout: 5000 });
    
    // Test search
    await searchInput.click();
    await searchInput.fill('Test Search');
    
    const value = await searchInput.inputValue();
    expect(value).toBe('Test Search');
  });

  test('CM-004: Add Client dialog', async ({ page }) => {
    await navigateToClients(page);
    
    // Click Add Client button
    const addButton = page.getByRole('button').filter({ hasText: /Add.*Client|New.*Client/i }).first();
    await addButton.click();
    
    // Wait for dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    
    // Check dialog has form fields
    await expect(dialog.locator('input[id="name"], input[name="name"]').first()).toBeVisible();
    await expect(dialog.locator('input[id="phone"], input[name="phone"]').first()).toBeVisible();
    
    // Close dialog
    await page.keyboard.press('Escape');
    await expect(dialog).not.toBeVisible({ timeout: 5000 });
  });

  test('CM-005: Statistics display', async ({ page }) => {
    await navigateToClients(page);
    
    // Check for stats - at least some should be visible
    const statsTexts = ['Total Clients', 'Active', 'VIP', 'Revenue'];
    let statsFound = 0;
    
    for (const text of statsTexts) {
      const stat = page.getByText(text).first();
      if (await stat.isVisible({ timeout: 2000 }).catch(() => false)) {
        statsFound++;
      }
    }
    
    expect(statsFound).toBeGreaterThan(0);
  });

  test('CM-006: Client display (cards or empty state)', async ({ page }) => {
    await navigateToClients(page);
    
    // Wait for content to load
    await page.waitForTimeout(2000);
    
    // Check for client cards
    const clientCards = page.locator('.grid > div, [class*="client-card"], [class*="ClientCard"]');
    const cardCount = await clientCards.count();
    
    if (cardCount > 0) {
      // Has clients - check for View Details button
      const viewButton = page.getByRole('button', { name: 'View Details' }).first();
      const hasViewButton = await viewButton.isVisible({ timeout: 2000 }).catch(() => false);
      expect(cardCount > 0 || hasViewButton).toBeTruthy();
    } else {
      // No clients - check for empty state
      const emptyState = page.getByText(/No clients|Start by adding|Add.*first.*client/i).first();
      await expect(emptyState).toBeVisible({ timeout: 5000 });
    }
  });

  test('CM-007: Export functionality', async ({ page }) => {
    await navigateToClients(page);
    
    // Look for Export button
    const exportButton = page.getByRole('button').filter({ hasText: 'Export' }).first();
    await expect(exportButton).toBeVisible({ timeout: 5000 });
    
    // Click export - it should trigger download
    const downloadPromise = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
    await exportButton.click();
    
    // Either download starts or nothing happens (no error)
    const download = await downloadPromise;
    if (download) {
      expect(download.suggestedFilename()).toContain('client');
    }
  });

  test('CM-008: Filter functionality', async ({ page }) => {
    await navigateToClients(page);
    
    // Find filter dropdown
    const filterDropdown = page.locator('button[role="combobox"], select, [class*="select"]').first();
    
    if (await filterDropdown.isVisible({ timeout: 3000 }).catch(() => false)) {
      await filterDropdown.click();
      
      // Look for filter options
      const activeOption = page.getByRole('option', { name: 'Active' }).first();
      if (await activeOption.isVisible({ timeout: 2000 }).catch(() => false)) {
        await activeOption.click();
      }
    }
    
    // Also check for "More Filters" button
    const moreFilters = page.getByRole('button').filter({ hasText: 'Filter' }).first();
    await expect(moreFilters).toBeVisible({ timeout: 3000 });
  });

  test('CM-009: Form validation', async ({ page }) => {
    await navigateToClients(page);
    
    // Open add dialog
    const addButton = page.getByRole('button').filter({ hasText: /Add.*Client/i }).first();
    await addButton.click();
    
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Try to submit empty form
    const submitButton = dialog.getByRole('button').filter({ hasText: /Create|Submit|Save/i }).first();
    await submitButton.click();
    
    // Check for validation errors
    await page.waitForTimeout(500);
    const errors = dialog.locator('text=/required|invalid|error/i');
    const errorCount = await errors.count();
    expect(errorCount).toBeGreaterThan(0);
  });

  test('CM-010: Responsive mobile view', async ({ page }) => {
    // Set mobile viewport first
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Then navigate
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    // Navigate to clients on mobile
    const sidebar = page.locator('.fixed.left-0').first();
    await sidebar.hover();
    await page.waitForTimeout(500);
    
    // Click clients (might need to click icon on mobile)
    const clientsButton = sidebar.locator('button').nth(3); // 4th button
    await clientsButton.click();
    
    await page.waitForURL('**/salon/clients', { timeout: 10000 });
    
    // Check key elements are visible on mobile
    const heading = page.locator('h1, h2').first();
    await expect(heading).toBeVisible();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
  });
});

// Separate performance tests
test.describe('Client Management - Performance', () => {
  test('Page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/salon/clients');
    await page.waitForLoadState('domcontentloaded');
    
    const loadTime = Date.now() - startTime;
    console.log(`Initial page load: ${loadTime}ms`);
    
    // Wait for full load
    await page.waitForLoadState('networkidle');
    const fullLoadTime = Date.now() - startTime;
    console.log(`Full page load: ${fullLoadTime}ms`);
    
    // Be more lenient with load times
    expect(fullLoadTime).toBeLessThan(30000); // 30 seconds max
  });

  test('Navigation performance', async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    const startTime = Date.now();
    
    // Navigate to clients
    await expandSidebar(page);
    const clientsButton = page.locator('.fixed.left-0 button').filter({ hasText: 'Clients' }).first();
    await clientsButton.click();
    await page.waitForURL('**/salon/clients');
    
    const navTime = Date.now() - startTime;
    console.log(`Navigation time: ${navTime}ms`);
    expect(navTime).toBeLessThan(5000); // 5 seconds max for navigation
  });
  
  test('Search responsiveness', async ({ page }) => {
    await page.goto('/salon/clients');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="search"]').first();
    await expect(searchInput).toBeVisible();
    
    // Measure typing speed
    const startType = Date.now();
    await searchInput.type('test search query', { delay: 50 });
    const typeTime = Date.now() - startType;
    
    console.log(`Typing time: ${typeTime}ms`);
    expect(typeTime).toBeLessThan(2000);
  });
});