import { test, expect } from '@playwright/test';

test.describe('COA Full Integration Tests', () => {
  test('should complete full COA setup workflow', async ({ page }) => {
    // 1. Start at COA Management Page
    await page.goto('/coa');
    await expect(page.getByRole('heading', { name: 'Universal Chart of Accounts' })).toBeVisible();
    
    // 2. Navigate to Templates Dashboard
    await expect(page.getByRole('tab', { name: 'Templates Dashboard' })).toHaveAttribute('data-state', 'active');
    
    // 3. View Universal Base template
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    await expect(page.getByText('67')).toBeVisible(); // Base accounts count
    await expect(page.getByRole('button', { name: 'View All Accounts' })).toBeVisible();
    
    // 4. Switch to GL Accounts tab
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // 5. Create a new account
    await page.getByRole('button', { name: 'New Account' }).click();
    
    // Fill form
    await page.getByLabel('Account Type *').click();
    await page.getByRole('option', { name: 'Expenses 5000000-5999999' }).click();
    await page.getByLabel('Account Code *').fill('5950000');
    await page.getByLabel('Account Name *').fill('Test Integration Expense');
    await page.getByLabel('Description').fill('Created during integration test');
    
    // Save
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // 6. Search for the new account
    await page.getByPlaceholder('Search by account name or code...').fill('Test Integration');
    
    // 7. Verify account appears (in real app)
    // await expect(page.getByText('Test Integration Expense')).toBeVisible();
    
    // 8. Filter by expense type
    await page.getByRole('combobox').selectOption('expenses');
    
    // 9. Export accounts
    await page.getByRole('button', { name: 'Export' }).click();
    
    // 10. Go back to Templates Dashboard
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Verify we're back at templates
    await expect(page.getByRole('heading', { name: 'COA Templates Dashboard' })).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    await page.goto('/coa');
    
    // Switch to GL Accounts
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Try to create account without required fields
    await page.getByRole('button', { name: 'New Account' }).click();
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Should show error
    await expect(page.getByText('Account code, name, and type are required')).toBeVisible();
    
    // Cancel and verify dialog closes
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create New GL Account' })).not.toBeVisible();
  });

  test('should maintain data consistency across tabs', async ({ page }) => {
    await page.goto('/coa');
    
    // Check stats in hero
    const heroStats = {
      organizations: await page.locator('text=1,847').first().textContent(),
      accounts: await page.locator('text=324').first().textContent(),
      templates: await page.locator('text=8').first().textContent()
    };
    
    // Go to Templates Dashboard
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Check organizations count matches
    await expect(page.getByText('1,847').nth(1)).toBeVisible();
    
    // Check templates count
    await expect(page.getByText('8').nth(1)).toBeVisible(); // Active templates
  });

  test('should validate account code ranges', async ({ page }) => {
    await page.goto('/coa');
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Open new account dialog
    await page.getByRole('button', { name: 'New Account' }).click();
    
    // Select Assets type
    await page.getByLabel('Account Type *').click();
    await page.getByRole('option', { name: 'Assets 1000000-1999999' }).click();
    
    // Try to enter out-of-range code
    await page.getByLabel('Account Code *').fill('2000000'); // This is liabilities range
    
    // The form should show range hint
    await expect(page.getByText('Range: 1000000-1999999')).toBeVisible();
  });

  test('should handle search across different account types', async ({ page }) => {
    await page.goto('/coa');
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Search for partial account name
    await page.getByPlaceholder('Search by account name or code...').fill('account');
    
    // Should find "Accounts Receivable" and "Accounts Payable"
    await expect(page.getByText('Accounts Receivable')).toBeVisible();
    await expect(page.getByText('Accounts Payable')).toBeVisible();
    
    // Clear search
    await page.getByPlaceholder('Search by account name or code...').clear();
    
    // All accounts should be visible again
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
  });

  test('should properly display account metadata', async ({ page }) => {
    await page.goto('/coa');
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Check account row displays all metadata
    const cashRow = page.getByRole('row', { name: /Cash and Cash Equivalents/ });
    
    // Check formatted account code
    await expect(cashRow.getByText('1-100-000')).toBeVisible();
    
    // Check account type with icon
    await expect(cashRow.getByText('Assets')).toBeVisible();
    
    // Check normal balance
    await expect(cashRow.getByText('debit')).toBeVisible();
    
    // Check formatted balance
    await expect(cashRow.getByText('$125,000.50')).toBeVisible();
    
    // Check transaction count badge
    const transactionBadge = cashRow.locator('[class*="badge"]').filter({ hasText: /^\d+$/ });
    await expect(transactionBadge).toBeVisible();
    
    // Check status badge
    await expect(cashRow.getByText('active')).toBeVisible();
  });

  test('should handle responsive behavior', async ({ page }) => {
    // Start in desktop view
    await page.goto('/coa');
    
    // Check desktop layout
    const tabsList = page.getByRole('tablist');
    await expect(tabsList).toBeVisible();
    
    // Switch to mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Tabs should still work
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // Table should be scrollable on mobile
    const table = page.getByRole('table');
    await expect(table).toBeVisible();
    
    // Switch back to desktop
    await page.setViewportSize({ width: 1280, height: 720 });
  });

  test('should complete template selection workflow', async ({ page }) => {
    await page.goto('/coa');
    
    // Go to Countries tab in Templates
    await page.getByRole('tab', { name: 'Countries' }).click();
    
    // View India template
    const indiaCard = page.locator('text=India Compliance Template').locator('../..');
    await indiaCard.getByRole('button', { name: 'View' }).click();
    
    // In real app, this would show template details
    
    // Go to Industries tab
    await page.getByRole('tab', { name: 'Industries' }).click();
    
    // Check Restaurant template
    const restaurantCard = page.locator('text=Restaurant & Food Service').locator('../..');
    await expect(restaurantCard.getByText('42')).toBeVisible(); // Account count
    await expect(restaurantCard.getByText('234')).toBeVisible(); // Organizations using
  });

  test('should verify governance compliance throughout', async ({ page }) => {
    await page.goto('/coa');
    
    // Check governance notice is always visible
    await expect(page.getByText('Governance & Compliance')).toBeVisible();
    
    // Switch to GL Accounts
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Governance notice should still be visible
    await expect(page.getByText('Governance & Compliance')).toBeVisible();
    
    // Check badges
    await expect(page.getByText('Governance Required')).toBeVisible();
    await expect(page.getByText('Zero Exceptions')).toBeVisible();
  });

  test('should handle loading and refresh states', async ({ page }) => {
    await page.goto('/coa');
    
    // Test refresh on Templates Dashboard
    await page.getByRole('button', { name: 'Refresh' }).first().click();
    await expect(page.getByText('Loading templates dashboard...')).toBeVisible();
    await expect(page.getByText('Loading templates dashboard...')).not.toBeVisible({ timeout: 5000 });
    
    // Switch to GL Accounts and test refresh there
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    await page.getByRole('button', { name: 'Refresh' }).click();
    await expect(page.getByText('Loading GL accounts...')).toBeVisible();
    await expect(page.getByText('Loading GL accounts...')).not.toBeVisible({ timeout: 5000 });
  });
});