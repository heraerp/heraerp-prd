import { test, expect } from '@playwright/test';

// Helper to expand sidebar
async function expandSidebar(page) {
  const sidebar = page.locator('.fixed.left-0').first();
  await sidebar.hover();
  await page.waitForTimeout(300);
}

// Helper to navigate to clients properly
async function navigateToClients(page) {
  await expandSidebar(page);
  
  // The Clients button might have a "New" badge attached
  // Look for button that contains "Clients" text (not exact match)
  const clientsButton = page.locator('button').filter({ 
    has: page.locator('span:has-text("Clients")') 
  }).first();
  
  // Fallback: try different selector
  const fallbackButton = page.locator('button:has-text("Clients")').first();
  
  if (await clientsButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await clientsButton.click();
  } else if (await fallbackButton.isVisible({ timeout: 2000 }).catch(() => false)) {
    await fallbackButton.click();
  } else {
    // Last resort: click by index (Clients is usually 3rd item)
    const allButtons = await page.locator('.fixed.left-0 button').all();
    if (allButtons.length > 2) {
      await allButtons[2].click(); // 0=Dashboard, 1=Appointments, 2=Clients
    }
  }
  
  await page.waitForLoadState('networkidle');
}

test.describe('Client Management - Fixed Tests', () => {
  test.beforeEach(async ({ page }) => {
    console.log('Navigating to salon dashboard...');
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
  });

  test('CM-001: Navigate to Clients page successfully', async ({ page }) => {
    console.log('Test: Navigate to Clients page');
    
    // Navigate using our fixed helper
    await navigateToClients(page);
    
    // Verify URL changed to salon/clients
    expect(page.url()).toContain('/salon/clients');
    console.log('✓ Successfully navigated to clients page');
    console.log(`Current URL: ${page.url()}`);
    
    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/cm-001-fixed-clients-page.png' });
  });

  test('CM-002: Clients page displays correctly', async ({ page }) => {
    console.log('Test: Clients page display');
    
    await navigateToClients(page);
    
    // Wait for page to load
    await page.waitForTimeout(1000);
    
    // Check for the main heading
    const heading = page.getByRole('heading', { name: 'Client Management' });
    await expect(heading).toBeVisible();
    console.log('✓ Found page heading');
    
    // Check for description
    const description = page.getByText('Manage your salon clients and loyalty program');
    await expect(description).toBeVisible();
    console.log('✓ Found page description');
    
    // Check for Add Client button
    const addButton = page.getByRole('button', { name: /Add Client/i });
    await expect(addButton).toBeVisible();
    console.log('✓ Found Add Client button');
    
    await page.screenshot({ path: 'test-results/cm-002-fixed-display.png' });
  });

  test('CM-003: Search functionality exists and works', async ({ page }) => {
    console.log('Test: Search functionality');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Look for search input with placeholder
    const searchInput = page.locator('input[placeholder*="Search by name, phone, email, or ID"]');
    await expect(searchInput).toBeVisible();
    console.log('✓ Found search input');
    
    // Test search functionality
    await searchInput.click();
    await searchInput.fill('Test Client Search');
    
    const value = await searchInput.inputValue();
    expect(value).toBe('Test Client Search');
    console.log('✓ Search input accepts text');
    
    await page.screenshot({ path: 'test-results/cm-003-fixed-search.png' });
  });

  test('CM-004: Add new client dialog opens', async ({ page }) => {
    console.log('Test: Add new client dialog');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Click Add Client button
    const addButton = page.getByRole('button', { name: /Add Client/i });
    await expect(addButton).toBeVisible();
    await addButton.click();
    console.log('✓ Clicked Add Client button');
    
    // Wait for dialog to open
    await page.waitForTimeout(500);
    
    // Check for dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    console.log('✓ Dialog opened');
    
    // Check dialog title
    const dialogTitle = dialog.getByText('Add New Client');
    await expect(dialogTitle).toBeVisible();
    console.log('✓ Dialog title correct');
    
    // Check for form fields
    const nameInput = dialog.locator('input[id="name"]');
    const phoneInput = dialog.locator('input[id="phone"]');
    const emailInput = dialog.locator('input[id="email"]');
    
    await expect(nameInput).toBeVisible();
    await expect(phoneInput).toBeVisible();
    await expect(emailInput).toBeVisible();
    console.log('✓ Form fields visible');
    
    await page.screenshot({ path: 'test-results/cm-004-fixed-add-dialog.png' });
    
    // Close dialog
    const cancelButton = dialog.getByRole('button', { name: 'Cancel' });
    await cancelButton.click();
  });

  test('CM-005: Statistics cards display correctly', async ({ page }) => {
    console.log('Test: Statistics cards');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Check for stats cards
    const statsTexts = [
      'Total Clients',
      'Active',
      'VIP Clients',
      'New This Month',
      'Total Revenue',
      'Avg Lifetime Value'
    ];
    
    for (const text of statsTexts) {
      const statCard = page.getByText(text);
      await expect(statCard).toBeVisible();
      console.log(`✓ Found stat: ${text}`);
    }
    
    await page.screenshot({ path: 'test-results/cm-005-fixed-stats.png' });
  });

  test('CM-006: Filter by status works', async ({ page }) => {
    console.log('Test: Status filter');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Find status filter dropdown
    const statusFilter = page.locator('button[role="combobox"]').filter({ hasText: 'All Clients' }).first();
    
    if (await statusFilter.isVisible({ timeout: 2000 }).catch(() => false)) {
      await statusFilter.click();
      console.log('✓ Clicked status filter');
      
      // Wait for dropdown to open
      await page.waitForTimeout(300);
      
      // Select "Active" option
      const activeOption = page.getByRole('option', { name: 'Active' });
      await activeOption.click();
      console.log('✓ Selected Active filter');
      
      // Verify filter applied
      await expect(statusFilter).toHaveText('Active');
    } else {
      // Try alternative selector
      const selectTrigger = page.locator('[role="combobox"]').first();
      await selectTrigger.click();
      console.log('✓ Opened filter dropdown');
    }
    
    await page.screenshot({ path: 'test-results/cm-006-fixed-filter.png' });
  });

  test('CM-007: Export functionality exists', async ({ page }) => {
    console.log('Test: Export functionality');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Check for Export button
    const exportButton = page.getByRole('button', { name: /Export/i });
    await expect(exportButton).toBeVisible();
    console.log('✓ Export button found');
    
    // Also check for Refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    await expect(refreshButton).toBeVisible();
    console.log('✓ Refresh button found');
    
    await page.screenshot({ path: 'test-results/cm-007-fixed-export.png' });
  });

  test('CM-008: Client cards or empty state displays', async ({ page }) => {
    console.log('Test: Client display');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Check for either client cards or empty state
    const clientCards = page.locator('.grid > div').filter({ 
      has: page.locator('h3') // Client cards have h3 with client name
    });
    
    const clientCount = await clientCards.count();
    
    if (clientCount > 0) {
      console.log(`✓ Found ${clientCount} client cards`);
      
      // Check first client card has expected elements
      const firstCard = clientCards.first();
      const viewButton = firstCard.getByRole('button', { name: 'View Details' });
      await expect(viewButton).toBeVisible();
      console.log('✓ Client card has View Details button');
    } else {
      // Check for empty state
      const emptyState = page.getByText('No clients found');
      const addFirstButton = page.getByRole('button', { name: 'Add First Client' });
      
      await expect(emptyState).toBeVisible();
      await expect(addFirstButton).toBeVisible();
      console.log('✓ Empty state displayed correctly');
    }
    
    await page.screenshot({ path: 'test-results/cm-008-fixed-client-display.png' });
  });

  test('CM-009: Form validation works', async ({ page }) => {
    console.log('Test: Form validation');
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Open add dialog
    const addButton = page.getByRole('button', { name: /Add Client/i });
    await addButton.click();
    
    // Wait for dialog
    const dialog = page.locator('[role="dialog"]');
    await expect(dialog).toBeVisible();
    
    // Try to submit empty form
    const submitButton = dialog.getByRole('button', { name: /Create Client/i });
    await submitButton.click();
    
    // Check for validation errors
    await page.waitForTimeout(500);
    const nameError = dialog.getByText('Name is required');
    const phoneError = dialog.getByText('Phone number is required');
    
    await expect(nameError).toBeVisible();
    await expect(phoneError).toBeVisible();
    console.log('✓ Validation errors displayed');
    
    await page.screenshot({ path: 'test-results/cm-009-fixed-validation.png' });
    
    // Close dialog
    await page.keyboard.press('Escape');
  });

  test('CM-010: Mobile responsive view', async ({ page }) => {
    console.log('Test: Mobile responsiveness');
    
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    await navigateToClients(page);
    await page.waitForTimeout(1000);
    
    // Check main elements are still visible
    const heading = page.getByRole('heading', { name: 'Client Management' });
    await expect(heading).toBeVisible();
    
    // Stats should stack vertically on mobile
    const statsCard = page.getByText('Total Clients').first();
    await expect(statsCard).toBeVisible();
    
    // Search should still be accessible
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    
    console.log('✓ Mobile view displays correctly');
    
    await page.screenshot({ path: 'test-results/cm-010-fixed-mobile.png' });
  });
});

// Performance tests
test.describe('Client Management - Performance', () => {
  test('CM-P001: Page loads within 3 seconds', async ({ page }) => {
    console.log('Test: Page load performance');
    
    const startTime = Date.now();
    await page.goto('/salon/clients');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    console.log(`Page loaded in ${loadTime}ms`);
    expect(loadTime).toBeLessThan(3000);
  });

  test('CM-P002: Search is responsive', async ({ page }) => {
    console.log('Test: Search performance');
    
    await page.goto('/salon/clients');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[placeholder*="Search"]').first();
    await expect(searchInput).toBeVisible();
    
    const startTime = Date.now();
    await searchInput.fill('test search query');
    const typeTime = Date.now() - startTime;
    
    console.log(`Search input responded in ${typeTime}ms`);
    expect(typeTime).toBeLessThan(500);
  });
});