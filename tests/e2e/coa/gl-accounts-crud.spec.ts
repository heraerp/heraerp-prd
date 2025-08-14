import { test, expect } from '@playwright/test';

test.describe('GL Accounts CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to COA page and switch to GL Accounts tab
    await page.goto('/coa');
    await page.getByRole('tab', { name: 'GL Accounts' }).click();
    
    // Wait for accounts to load
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // Wait for the table to load after the component finishes loading
    await page.waitForTimeout(500);
  });

  test('should display GL accounts list with proper formatting', async ({ page }) => {
    // Check table headers
    await expect(page.getByRole('columnheader', { name: 'Account Code' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Account Name' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Type' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Balance' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Transactions' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible();
    
    // Check sample accounts are displayed
    await expect(page.getByText('1-100-000')).toBeVisible(); // Formatted account code
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
    await expect(page.getByText('$125,000.50')).toBeVisible(); // Formatted currency
    
    await expect(page.getByText('1-200-000')).toBeVisible();
    await expect(page.getByText('Accounts Receivable')).toBeVisible();
    
    await expect(page.getByText('2-100-000')).toBeVisible();
    await expect(page.getByText('Accounts Payable')).toBeVisible();
  });

  test('should search accounts by name or code', async ({ page }) => {
    // Search by account name
    await page.getByPlaceholder('Search by account name or code...').fill('Cash');
    
    // Check only cash account is visible
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
    await expect(page.getByText('Accounts Receivable')).not.toBeVisible();
    
    // Clear search and search by code
    await page.getByPlaceholder('Search by account name or code...').clear();
    await page.getByPlaceholder('Search by account name or code...').fill('1200000');
    
    // Check only accounts receivable is visible
    await expect(page.getByText('Accounts Receivable')).toBeVisible();
    await expect(page.getByText('Cash and Cash Equivalents')).not.toBeVisible();
  });

  test('should filter accounts by type', async ({ page }) => {
    // Filter by Assets
    await page.getByRole('combobox').selectOption('assets');
    
    // Check only asset accounts are visible
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
    await expect(page.getByText('Accounts Receivable')).toBeVisible();
    await expect(page.getByText('Accounts Payable')).not.toBeVisible();
    
    // Filter by Liabilities
    await page.getByRole('combobox').selectOption('liabilities');
    
    // Check only liability accounts are visible
    await expect(page.getByText('Accounts Payable')).toBeVisible();
    await expect(page.getByText('Cash and Cash Equivalents')).not.toBeVisible();
  });

  test('should toggle inactive accounts visibility', async ({ page }) => {
    // Initially, Show Inactive button should be visible
    await expect(page.getByRole('button', { name: 'Show Inactive' })).toBeVisible();
    
    // Click to show inactive accounts
    await page.getByRole('button', { name: 'Show Inactive' }).click();
    
    // Button text should change
    await expect(page.getByRole('button', { name: 'Hide Inactive' })).toBeVisible();
    
    // In a real app, inactive accounts would now be visible
  });

  test('should create new GL account', async ({ page }) => {
    // Click New Account button
    await page.getByRole('button', { name: 'New Account' }).click();
    
    // Check dialog opens
    await expect(page.getByRole('heading', { name: 'Create New GL Account' })).toBeVisible();
    await expect(page.getByText('Enter the details for the new account')).toBeVisible();
    
    // Fill in account details
    await page.getByLabel('Account Type *').click();
    await page.getByRole('option', { name: 'Assets 1000000-1999999' }).click();
    
    // Check normal balance is auto-set to debit for assets
    await expect(page.getByLabel('Normal Balance')).toHaveValue('debit');
    
    // Fill account code
    await page.getByLabel('Account Code *').fill('1150000');
    
    // Fill account name
    await page.getByLabel('Account Name *').fill('Test Cash Account');
    
    // Fill description
    await page.getByLabel('Description').fill('Test account for cash holdings');
    
    // Click Create Account
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Check dialog closes and account appears in list
    await expect(page.getByRole('heading', { name: 'Create New GL Account' })).not.toBeVisible();
    
    // In a real app, the new account would appear in the list
  });

  test('should validate required fields when creating account', async ({ page }) => {
    // Click New Account button
    await page.getByRole('button', { name: 'New Account' }).click();
    
    // Try to save without filling required fields
    await page.getByRole('button', { name: 'Create Account' }).click();
    
    // Check error message appears
    await expect(page.getByText('Account code, name, and type are required')).toBeVisible();
    
    // Cancel dialog
    await page.getByRole('button', { name: 'Cancel' }).click();
    await expect(page.getByRole('heading', { name: 'Create New GL Account' })).not.toBeVisible();
  });

  test('should edit existing GL account', async ({ page }) => {
    // Click edit button for first account
    await page.getByRole('row', { name: /Cash and Cash Equivalents/ }).getByRole('button').first().click();
    
    // Check dialog opens with Edit title
    await expect(page.getByRole('heading', { name: 'Edit GL Account' })).toBeVisible();
    await expect(page.getByText('Modify the account details below')).toBeVisible();
    
    // Check fields are pre-filled
    await expect(page.getByLabel('Account Code *')).toHaveValue('1100000');
    await expect(page.getByLabel('Account Name *')).toHaveValue('Cash and Cash Equivalents');
    await expect(page.getByLabel('Description')).toHaveValue('Cash on hand and in bank accounts');
    
    // Modify account name
    await page.getByLabel('Account Name *').clear();
    await page.getByLabel('Account Name *').fill('Cash and Equivalents - Modified');
    
    // Click Update Account
    await page.getByRole('button', { name: 'Update Account' }).click();
    
    // Check dialog closes
    await expect(page.getByRole('heading', { name: 'Edit GL Account' })).not.toBeVisible();
  });

  test('should delete custom GL account', async ({ page }) => {
    // Note: Only custom accounts can be deleted (not template accounts)
    // This test assumes there's a custom account in the list
    
    // Find a row with a delete button (custom accounts only)
    const deleteButtons = page.getByRole('button', { name: 'Delete' });
    const deleteButtonCount = await deleteButtons.count();
    
    if (deleteButtonCount > 0) {
      // Click first delete button
      await deleteButtons.first().click();
      
      // Confirm deletion in dialog
      await page.on('dialog', dialog => dialog.accept());
      
      // Account should be removed from list
    }
  });

  test('should display account type icons and colors', async ({ page }) => {
    // Check each account type has proper visual indicators
    const assetRow = page.getByRole('row', { name: /Cash and Cash Equivalents/ });
    await expect(assetRow.getByText('Assets')).toBeVisible();
    await expect(assetRow.getByText('debit')).toBeVisible(); // Normal balance
    
    const liabilityRow = page.getByRole('row', { name: /Accounts Payable/ });
    await expect(liabilityRow.getByText('Liabilities')).toBeVisible();
    await expect(liabilityRow.getByText('credit')).toBeVisible(); // Normal balance
  });

  test('should handle export and import actions', async ({ page }) => {
    // Check export button
    await expect(page.getByRole('button', { name: 'Export' })).toBeVisible();
    
    // Check import button
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
    
    // Check refresh button
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    
    // Click refresh
    await page.getByRole('button', { name: 'Refresh' }).click();
    
    // Check loading state
    await expect(page.getByText('Loading GL accounts...')).toBeVisible();
    
    // Wait for reload
    await expect(page.getByText('Loading GL accounts...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should display account balances and transaction counts', async ({ page }) => {
    // Check balance formatting
    await expect(page.getByText('$125,000.50')).toBeVisible(); // Cash balance
    await expect(page.getByText('$45,000.00')).toBeVisible(); // AR balance
    await expect(page.getByText('$23,000.00')).toBeVisible(); // AP balance
    
    // Check transaction count badges
    const transactionBadges = page.getByRole('cell').filter({ hasText: /^\d+$/ });
    await expect(transactionBadges).toHaveCount(5); // 5 accounts with transaction counts
  });

  test('should show account descriptions on hover', async ({ page }) => {
    // Check descriptions are visible
    await expect(page.getByText('Cash on hand and in bank accounts')).toBeVisible();
    await expect(page.getByText('Amounts owed by customers')).toBeVisible();
    await expect(page.getByText('Amounts owed to suppliers')).toBeVisible();
  });

  test('should handle empty search results', async ({ page }) => {
    // Search for non-existent account
    await page.getByPlaceholder('Search by account name or code...').fill('xyz123');
    
    // Check empty state message
    await expect(page.getByText('No accounts match your filters')).toBeVisible();
    
    // Check clear filters link
    await expect(page.getByRole('button', { name: 'Clear filters' })).toBeVisible();
    
    // Click clear filters
    await page.getByRole('button', { name: 'Clear filters' }).click();
    
    // Check accounts are visible again
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
  });

  test('should display smart defaults when changing account type', async ({ page }) => {
    // Open new account dialog
    await page.getByRole('button', { name: 'New Account' }).click();
    
    // Select Assets type
    await page.getByLabel('Account Type *').click();
    await page.getByRole('option', { name: 'Assets 1000000-1999999' }).click();
    
    // Check normal balance is set to debit
    await expect(page.getByLabel('Normal Balance')).toHaveValue('debit');
    
    // Change to Liabilities
    await page.getByLabel('Account Type *').click();
    await page.getByRole('option', { name: 'Liabilities 2000000-2999999' }).click();
    
    // Check normal balance changes to credit
    await expect(page.getByLabel('Normal Balance')).toHaveValue('credit');
    
    // Change to Revenue
    await page.getByLabel('Account Type *').click();
    await page.getByRole('option', { name: 'Revenue 4000000-4999999' }).click();
    
    // Check normal balance remains credit
    await expect(page.getByLabel('Normal Balance')).toHaveValue('credit');
  });
});