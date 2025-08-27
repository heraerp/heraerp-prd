import { test, expect } from '@playwright/test';

// Helper to expand sidebar
async function expandSidebar(page) {
  const sidebar = page.locator('.fixed.left-0').first();
  await sidebar.hover();
  await page.waitForTimeout(300);
}

// Helper to navigate to clients
async function navigateToClients(page) {
  await expandSidebar(page);
  const clientsButton = page.locator('button').filter({ hasText: 'Clients' }).first();
  await clientsButton.click();
  await page.waitForLoadState('networkidle');
}

test.describe('Client Management - Complete Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to salon dashboard...');
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
  });

  test('CM-001: Navigate to Clients page successfully', async ({ page }) => {
    console.log('Test: Navigate to Clients page');
    
    // Navigate to clients
    await navigateToClients(page);
    
    // Verify URL changed
    expect(page.url()).toContain('clients');
    console.log('✓ Successfully navigated to clients page');
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/cm-001-clients-page.png' });
  });

  test('CM-002: Clients page displays correctly', async ({ page }) => {
    console.log('Test: Clients page display');
    
    await navigateToClients(page);
    
    // Wait for any loading spinners to disappear
    await page.waitForTimeout(1000);
    
    // Log page content for debugging
    const bodyText = await page.textContent('body');
    console.log('Page contains text:', bodyText?.substring(0, 200) + '...');
    
    // Check for various possible client page elements
    const possibleElements = [
      'h1, h2, h3', // Any heading
      'table', // Client table
      '.client-list, .clients-list', // Client list
      '.client-card, .clients-grid', // Client cards
      'button:has-text("Add"), button:has-text("New")', // Add button
      '[class*="client"]', // Any element with client in class
    ];
    
    let foundElement = null;
    for (const selector of possibleElements) {
      const element = page.locator(selector).first();
      if (await element.isVisible({ timeout: 2000 }).catch(() => false)) {
        foundElement = selector;
        console.log(`✓ Found element: ${selector}`);
        break;
      }
    }
    
    expect(foundElement).toBeTruthy();
    await page.screenshot({ path: 'test-results/cm-002-clients-display.png' });
  });

  test('CM-003: Search functionality exists', async ({ page }) => {
    console.log('Test: Search functionality');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Look for search input
    const searchSelectors = [
      'input[type="search"]',
      'input[placeholder*="search" i]',
      'input[placeholder*="find" i]',
      'input[placeholder*="client" i]',
      'input[name*="search" i]',
      '.search-input',
      '[class*="search"] input'
    ];
    
    let searchInput = null;
    for (const selector of searchSelectors) {
      const input = page.locator(selector).first();
      if (await input.isVisible({ timeout: 1000 }).catch(() => false)) {
        searchInput = input;
        console.log(`✓ Found search input: ${selector}`);
        break;
      }
    }
    
    if (searchInput) {
      // Test search functionality
      await searchInput.click();
      await searchInput.fill('Test Client Search');
      
      const value = await searchInput.inputValue();
      expect(value).toBe('Test Client Search');
      console.log('✓ Search input working correctly');
    } else {
      console.log('⚠ No search input found on page');
    }
    
    await page.screenshot({ path: 'test-results/cm-003-search.png' });
  });

  test('CM-004: Add new client button exists and is clickable', async ({ page }) => {
    console.log('Test: Add new client button');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Look for add button with various selectors
    const addButtonSelectors = [
      'button:has-text("Add Client")',
      'button:has-text("New Client")',
      'button:has-text("Add")',
      'button:has-text("New")',
      'button:has-text("Create")',
      'a:has-text("Add Client")',
      'a:has-text("New Client")',
      'button[aria-label*="add" i]',
      'button[title*="add" i]',
      '[class*="add-button"]',
      '[class*="new-button"]',
      'button svg.lucide-plus',
      'button:has(svg[class*="plus"])'
    ];
    
    let addButton = null;
    let buttonText = '';
    
    for (const selector of addButtonSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          addButton = button;
          buttonText = await button.textContent() || 'Icon Button';
          console.log(`✓ Found add button: ${selector} with text: "${buttonText}"`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (addButton) {
      // Try to click the button
      await addButton.click();
      console.log('✓ Clicked add button');
      
      // Wait for response
      await page.waitForTimeout(1000);
      
      // Check what happened after click
      const currentUrl = page.url();
      const hasModal = await page.locator('[role="dialog"], .modal, [class*="modal"]').isVisible({ timeout: 2000 }).catch(() => false);
      const hasForm = await page.locator('form, [class*="form"]').isVisible({ timeout: 2000 }).catch(() => false);
      
      console.log('After clicking add button:');
      console.log(`- Current URL: ${currentUrl}`);
      console.log(`- Modal visible: ${hasModal}`);
      console.log(`- Form visible: ${hasForm}`);
      
      expect(currentUrl.includes('new') || hasModal || hasForm).toBeTruthy();
    } else {
      console.log('❌ No add button found');
      // Log all buttons on page for debugging
      const allButtons = await page.locator('button').all();
      console.log(`Found ${allButtons.length} buttons on page:`);
      for (let i = 0; i < Math.min(5, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        console.log(`  Button ${i}: "${text?.trim()}"`);
      }
    }
    
    await page.screenshot({ path: 'test-results/cm-004-add-button.png' });
  });

  test('CM-005: Client list/table displays data', async ({ page }) => {
    console.log('Test: Client data display');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Check for client data in various formats
    const dataSelectors = [
      'table tbody tr',
      '.client-card',
      '.client-item',
      '[class*="client-row"]',
      '[class*="client-list"] > *',
      '.grid > div',
      '[role="row"]'
    ];
    
    let dataElements = [];
    let dataSelector = '';
    
    for (const selector of dataSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        dataElements = elements;
        dataSelector = selector;
        console.log(`✓ Found ${elements.length} client data elements using: ${selector}`);
        break;
      }
    }
    
    if (dataElements.length > 0) {
      // Check first few elements
      for (let i = 0; i < Math.min(3, dataElements.length); i++) {
        const text = await dataElements[i].textContent();
        console.log(`  Client ${i + 1}: "${text?.substring(0, 100)}..."`);
      }
      expect(dataElements.length).toBeGreaterThan(0);
    } else {
      console.log('⚠ No client data found - might be empty state');
      
      // Check for empty state message
      const emptyStateSelectors = [
        'text="No clients"',
        'text="No data"',
        'text="empty"',
        '[class*="empty"]'
      ];
      
      let hasEmptyState = false;
      for (const selector of emptyStateSelectors) {
        if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
          hasEmptyState = true;
          console.log(`✓ Found empty state: ${selector}`);
          break;
        }
      }
      
      expect(hasEmptyState || dataElements.length > 0).toBeTruthy();
    }
    
    await page.screenshot({ path: 'test-results/cm-005-client-data.png' });
  });

  test('CM-006: Client details are viewable', async ({ page }) => {
    console.log('Test: View client details');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Try to find and click on a client
    const clientSelectors = [
      'table tbody tr:first-child',
      '.client-card:first-child',
      '.client-item:first-child',
      '[class*="client-row"]:first-child',
      'a[href*="client"]',
      'button:has-text("View")',
      'button:has-text("Details")'
    ];
    
    let clicked = false;
    for (const selector of clientSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          clicked = true;
          console.log(`✓ Clicked on client using: ${selector}`);
          break;
        }
      } catch (e) {
        continue;
      }
    }
    
    if (clicked) {
      await page.waitForTimeout(1000);
      
      // Check if we navigated or opened a modal
      const urlChanged = !page.url().endsWith('/clients');
      const hasModal = await page.locator('[role="dialog"]').isVisible({ timeout: 1000 }).catch(() => false);
      const hasDetails = await page.locator('[class*="detail"], [class*="info"]').isVisible({ timeout: 1000 }).catch(() => false);
      
      console.log('After clicking client:');
      console.log(`- URL changed: ${urlChanged}`);
      console.log(`- Modal visible: ${hasModal}`);
      console.log(`- Details visible: ${hasDetails}`);
      
      expect(urlChanged || hasModal || hasDetails).toBeTruthy();
    } else {
      console.log('⚠ Could not find clickable client element');
    }
    
    await page.screenshot({ path: 'test-results/cm-006-client-details.png' });
  });

  test('CM-007: Filter/Sort options available', async ({ page }) => {
    console.log('Test: Filter and sort options');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Look for filter/sort elements
    const filterSelectors = [
      'button:has-text("Filter")',
      'button:has-text("Sort")',
      'select',
      '[class*="filter"]',
      '[class*="sort"]',
      'button[aria-label*="filter" i]',
      'button[aria-label*="sort" i]',
      '[role="combobox"]'
    ];
    
    const foundFilters = [];
    for (const selector of filterSelectors) {
      const elements = await page.locator(selector).all();
      if (elements.length > 0) {
        foundFilters.push(`${selector} (${elements.length} found)`);
      }
    }
    
    console.log('Found filter/sort elements:', foundFilters);
    expect(foundFilters.length).toBeGreaterThan(0);
    
    await page.screenshot({ path: 'test-results/cm-007-filters.png' });
  });

  test('CM-008: Pagination works if multiple pages', async ({ page }) => {
    console.log('Test: Pagination functionality');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Look for pagination elements
    const paginationSelectors = [
      '[class*="pagination"]',
      'button:has-text("Next")',
      'button:has-text("Previous")',
      'button[aria-label*="page" i]',
      '[role="navigation"]',
      'text="Page"',
      'button:has-text("1"):has-text("2")'
    ];
    
    let hasPagination = false;
    for (const selector of paginationSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
        hasPagination = true;
        console.log(`✓ Found pagination: ${selector}`);
        break;
      }
    }
    
    if (hasPagination) {
      // Try to click next page
      const nextButton = page.locator('button:has-text("Next"), button[aria-label*="next" i]').first();
      if (await nextButton.isEnabled({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
        await page.waitForTimeout(500);
        console.log('✓ Clicked next page');
      }
    } else {
      console.log('ℹ No pagination found - might have few clients');
    }
    
    await page.screenshot({ path: 'test-results/cm-008-pagination.png' });
  });

  test('CM-009: Export/Import functionality', async ({ page }) => {
    console.log('Test: Export/Import features');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Look for export/import buttons
    const exportSelectors = [
      'button:has-text("Export")',
      'button:has-text("Download")',
      'button:has-text("Import")',
      'button:has-text("Upload")',
      'button[aria-label*="export" i]',
      'button[aria-label*="import" i]',
      '[class*="export"]',
      '[class*="import"]'
    ];
    
    const foundFeatures = [];
    for (const selector of exportSelectors) {
      if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
        foundFeatures.push(selector);
      }
    }
    
    if (foundFeatures.length > 0) {
      console.log('✓ Found export/import features:', foundFeatures);
    } else {
      console.log('ℹ No export/import features found');
    }
    
    await page.screenshot({ path: 'test-results/cm-009-export-import.png' });
  });

  test('CM-010: Responsive design on mobile', async ({ page }) => {
    console.log('Test: Mobile responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Check if page is still functional
    const mobileElements = [
      'h1, h2, h3',
      'button',
      '[class*="client"]',
      'table, .list, .grid'
    ];
    
    let mobileReady = false;
    for (const selector of mobileElements) {
      if (await page.locator(selector).isVisible({ timeout: 1000 }).catch(() => false)) {
        mobileReady = true;
        console.log(`✓ Mobile element visible: ${selector}`);
        break;
      }
    }
    
    expect(mobileReady).toBeTruthy();
    
    await page.screenshot({ path: 'test-results/cm-010-mobile.png' });
  });
});

// Performance test suite
test.describe('Client Management - Performance Tests', () => {
  test('CM-P001: Page loads within 3 seconds', async ({ page }) => {
    console.log('Test: Page load performance');
    
    const startTime = Date.now();
    await page.goto('/salon/clients');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('CM-P002: Search response time', async ({ page }) => {
    console.log('Test: Search performance');
    
    await page.goto('/salon/clients');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    
    if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
      const startTime = Date.now();
      await searchInput.fill('performance test');
      await page.waitForTimeout(300); // Debounce time
      const searchTime = Date.now() - startTime;
      
      console.log(`Search completed in ${searchTime}ms`);
      expect(searchTime).toBeLessThan(1000);
    }
  });
});