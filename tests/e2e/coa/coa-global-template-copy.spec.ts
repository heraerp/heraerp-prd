import { test, expect } from '@playwright/test';

test.describe('COA Global Template Copy End-to-End', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/coa');
    await expect(page.getByText('Universal Chart of Accounts')).toBeVisible();
  });

  test('should copy Universal Base template for new organization', async ({ page }) => {
    // Navigate to Template Builder
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    
    // Click "Use Template" button
    await page.getByRole('button', { name: 'Use Template' }).click();
    
    // Check Template Builder opens
    await expect(page.getByText('Universal Chart of Accounts Builder')).toBeVisible();
    await expect(page.getByText('Step 1 of 4: Organization Details')).toBeVisible();
    
    // Fill organization details
    await page.getByLabel('Organization Name *').fill('Acme Corporation');
    await page.getByLabel('Organization Code *').fill('ACME001');
    await page.getByLabel('Business Type').selectOption('corporation');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    // Proceed to Country Selection
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await expect(page.getByText('Step 2 of 4: Country & Compliance')).toBeVisible();
    
    // Select USA for compliance
    await page.getByRole('button', { name: 'Select USA' }).click();
    await expect(page.getByText('USA Compliance Template Selected')).toBeVisible();
    await expect(page.getByText('38 additional accounts will be added')).toBeVisible();
    
    // Proceed to Industry Selection
    await page.getByRole('button', { name: 'Next: Industry Selection' }).click();
    await expect(page.getByText('Step 3 of 4: Industry Specialization')).toBeVisible();
    
    // Select Professional Services
    await page.getByRole('button', { name: 'Select Professional Services' }).click();
    await expect(page.getByText('Professional Services Template Selected')).toBeVisible();
    await expect(page.getByText('27 additional accounts will be added')).toBeVisible();
    
    // Proceed to Review & Customize
    await page.getByRole('button', { name: 'Next: Review & Customize' }).click();
    await expect(page.getByText('Step 4 of 4: Review & Customize')).toBeVisible();
    
    // Check template summary
    await expect(page.getByText('Universal Base: 67 accounts')).toBeVisible();
    await expect(page.getByText('USA Compliance: +38 accounts')).toBeVisible();
    await expect(page.getByText('Professional Services: +27 accounts')).toBeVisible();
    await expect(page.getByText('Total: 132 accounts')).toBeVisible();
    
    // Add custom account
    await page.getByRole('button', { name: 'Add Custom Account' }).click();
    await page.getByLabel('Account Type *').selectOption('expenses');
    await page.getByLabel('Account Code *').fill('5950000');
    await page.getByLabel('Account Name *').fill('Professional Development');
    await page.getByLabel('Description').fill('Training and certification expenses');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    // Verify custom account added
    await expect(page.getByText('Professional Development')).toBeVisible();
    await expect(page.getByText('Total: 133 accounts')).toBeVisible();
    
    // Build the COA
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    
    // Check success message
    await expect(page.getByText('Chart of Accounts Created Successfully!')).toBeVisible();
    await expect(page.getByText('133 accounts have been created for Acme Corporation')).toBeVisible();
    
    // Verify redirect to GL Accounts
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // Check that accounts are loaded
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
    await expect(page.getByText('Professional Development')).toBeVisible();
  });

  test('should copy and customize Country-specific template', async ({ page }) => {
    // Navigate to Countries templates
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Countries' }).click();
    
    // Select India template
    const indiaCard = page.locator('text=India Compliance Template').locator('../..');
    await indiaCard.getByRole('button', { name: 'Use Template' }).click();
    
    // Check Template Builder opens with India pre-selected
    await expect(page.getByText('Step 2 of 4: Country & Compliance')).toBeVisible();
    await expect(page.getByText('India Compliance Template Selected')).toBeVisible();
    
    // Go back to fill organization details
    await page.getByRole('button', { name: 'Previous' }).click();
    
    // Fill organization details
    await page.getByLabel('Organization Name *').fill('Mumbai Tech Solutions');
    await page.getByLabel('Organization Code *').fill('MTS001');
    await page.getByLabel('Business Type').selectOption('private_limited');
    await page.getByLabel('Primary Currency').selectOption('INR');
    
    // Continue with India template
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Next: Industry Selection' }).click();
    
    // Skip industry specialization
    await page.getByRole('button', { name: 'Skip Industry Selection' }).click();
    
    // Review the template
    await expect(page.getByText('Universal Base: 67 accounts')).toBeVisible();
    await expect(page.getByText('India Compliance: +45 accounts')).toBeVisible();
    await expect(page.getByText('Total: 112 accounts')).toBeVisible();
    
    // Add India-specific custom accounts
    await page.getByRole('button', { name: 'Add Custom Account' }).click();
    await page.getByLabel('Account Type *').selectOption('assets');
    await page.getByLabel('Account Code *').fill('1350000');
    await page.getByLabel('Account Name *').fill('GST Input Credit Receivable');
    await page.getByLabel('Description').fill('GST input tax credit to be claimed');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    // Build the COA
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    
    // Verify success
    await expect(page.getByText('Chart of Accounts Created Successfully!')).toBeVisible();
    await expect(page.getByText('113 accounts have been created for Mumbai Tech Solutions')).toBeVisible();
  });

  test('should copy and layer Industry template on Country template', async ({ page }) => {
    // Navigate to Industries templates
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Industries' }).click();
    
    // Select Restaurant template
    const restaurantCard = page.locator('text=Restaurant & Food Service').locator('../..');
    await restaurantCard.getByRole('button', { name: 'Use Template' }).click();
    
    // Fill organization details
    await expect(page.getByText('Step 1 of 4: Organization Details')).toBeVisible();
    await page.getByLabel('Organization Name *').fill('Tasty Bites Restaurant');
    await page.getByLabel('Organization Code *').fill('TBR001');
    await page.getByLabel('Business Type').selectOption('llc');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    // Select USA for compliance
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Select USA' }).click();
    
    // Restaurant industry should be pre-selected
    await page.getByRole('button', { name: 'Next: Industry Selection' }).click();
    await expect(page.getByText('Restaurant & Food Service Template Selected')).toBeVisible();
    
    // Review layered template
    await page.getByRole('button', { name: 'Next: Review & Customize' }).click();
    await expect(page.getByText('Universal Base: 67 accounts')).toBeVisible();
    await expect(page.getByText('USA Compliance: +38 accounts')).toBeVisible();
    await expect(page.getByText('Restaurant & Food Service: +42 accounts')).toBeVisible();
    await expect(page.getByText('Total: 147 accounts')).toBeVisible();
    
    // Add restaurant-specific accounts
    await page.getByRole('button', { name: 'Add Custom Account' }).click();
    await page.getByLabel('Account Type *').selectOption('expenses');
    await page.getByLabel('Account Code *').fill('5850000');
    await page.getByLabel('Account Name *').fill('Online Delivery Platform Fees');
    await page.getByLabel('Description').fill('Fees paid to UberEats, DoorDash, etc.');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    // Build the COA
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    
    // Verify success with all layers
    await expect(page.getByText('148 accounts have been created for Tasty Bites Restaurant')).toBeVisible();
    
    // Check restaurant-specific accounts exist
    await page.getByPlaceholder('Search by account name or code...').fill('Food Inventory');
    await expect(page.getByText('Food Inventory')).toBeVisible();
    
    await page.getByPlaceholder('Search by account name or code...').clear();
    await page.getByPlaceholder('Search by account name or code...').fill('Online Delivery');
    await expect(page.getByText('Online Delivery Platform Fees')).toBeVisible();
  });

  test('should handle template conflicts and overrides correctly', async ({ page }) => {
    // Start template building process
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    await page.getByRole('button', { name: 'Use Template' }).click();
    
    // Fill basic details
    await page.getByLabel('Organization Name *').fill('Conflict Test Corp');
    await page.getByLabel('Organization Code *').fill('CTC001');
    await page.getByLabel('Business Type').selectOption('corporation');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    // Select country and industry that might have conflicts
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Select USA' }).click();
    
    await page.getByRole('button', { name: 'Next: Industry Selection' }).click();
    await page.getByRole('button', { name: 'Select Healthcare' }).click();
    
    // Review and check for conflict resolution
    await page.getByRole('button', { name: 'Next: Review & Customize' }).click();
    
    // Check that conflicts are properly resolved
    await expect(page.getByText('Template Conflicts Resolved')).toBeVisible();
    await expect(page.getByText('2 accounts were merged')).toBeVisible();
    await expect(page.getByText('Healthcare specialization takes precedence')).toBeVisible();
    
    // Verify final count is correct (no duplicates)
    await expect(page.getByText('Total: 140 accounts')).toBeVisible();
    
    // Build and verify
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    await expect(page.getByText('140 accounts have been created')).toBeVisible();
  });

  test('should validate account code uniqueness during custom additions', async ({ page }) => {
    // Start template building
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    await page.getByRole('button', { name: 'Use Template' }).click();
    
    // Quick setup
    await page.getByLabel('Organization Name *').fill('Validation Test Inc');
    await page.getByLabel('Organization Code *').fill('VTI001');
    await page.getByLabel('Business Type').selectOption('corporation');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    // Skip to customization
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Skip Country Selection' }).click();
    await page.getByRole('button', { name: 'Skip Industry Selection' }).click();
    
    // Try to add account with existing code
    await page.getByRole('button', { name: 'Add Custom Account' }).click();
    await page.getByLabel('Account Type *').selectOption('assets');
    await page.getByLabel('Account Code *').fill('1100000'); // Cash account - already exists
    await page.getByLabel('Account Name *').fill('Duplicate Cash Account');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    // Check validation error
    await expect(page.getByText('Account code 1100000 already exists')).toBeVisible();
    await expect(page.getByText('Please choose a different account code')).toBeVisible();
    
    // Fix with unique code
    await page.getByLabel('Account Code *').clear();
    await page.getByLabel('Account Code *').fill('1150000');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    // Should succeed
    await expect(page.getByText('Duplicate Cash Account')).toBeVisible();
  });

  test('should preserve template hierarchy and relationships', async ({ page }) => {
    // Create organization with full template stack
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    await page.getByRole('button', { name: 'Use Template' }).click();
    
    // Setup with all layers
    await page.getByLabel('Organization Name *').fill('Hierarchy Test LLC');
    await page.getByLabel('Organization Code *').fill('HTL001');
    await page.getByLabel('Business Type').selectOption('llc');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Select USA' }).click();
    
    await page.getByRole('button', { name: 'Next: Industry Selection' }).click();
    await page.getByRole('button', { name: 'Select Manufacturing' }).click();
    
    await page.getByRole('button', { name: 'Next: Review & Customize' }).click();
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    
    // Verify hierarchy is preserved in GL Accounts
    await expect(page.getByRole('heading', { name: 'GL Accounts Management' })).toBeVisible();
    
    // Check account types are properly grouped
    await page.getByRole('combobox').selectOption('assets');
    await expect(page.getByText('Cash and Cash Equivalents')).toBeVisible();
    await expect(page.getByText('Raw Materials Inventory')).toBeVisible(); // Manufacturing-specific
    
    await page.getByRole('combobox').selectOption('liabilities');
    await expect(page.getByText('Accounts Payable')).toBeVisible();
    await expect(page.getByText('Accrued Payroll Taxes')).toBeVisible(); // USA-specific
    
    await page.getByRole('combobox').selectOption('expenses');
    await expect(page.getByText('Manufacturing Overhead')).toBeVisible(); // Manufacturing-specific
    
    // Verify account codes follow proper ranges
    const assetCodes = page.locator('[data-account-type="assets"] [data-account-code]');
    await expect(assetCodes.first()).toHaveAttribute('data-account-code', /^1[0-9]{6}$/);
    
    const liabilityCodes = page.locator('[data-account-type="liabilities"] [data-account-code]');
    await expect(liabilityCodes.first()).toHaveAttribute('data-account-code', /^2[0-9]{6}$/);
  });

  test('should handle template versioning and updates', async ({ page }) => {
    // Check for template version information
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    
    // Verify version info is displayed
    await expect(page.getByText('Version 2.1.0')).toBeVisible();
    await expect(page.getByText('Last Updated: January 2024')).toBeVisible();
    
    // Check if there are update notifications
    const updateBadge = page.locator('.template-update-badge');
    if (await updateBadge.isVisible()) {
      await expect(updateBadge.getByText('Update Available')).toBeVisible();
      
      // Click to see update details
      await updateBadge.click();
      await expect(page.getByText('Template Update Details')).toBeVisible();
      await expect(page.getByText('New accounts added:')).toBeVisible();
      await expect(page.getByText('Deprecated accounts:')).toBeVisible();
    }
    
    // Use template and verify version is tracked
    await page.getByRole('button', { name: 'Use Template' }).click();
    
    // Quick setup
    await page.getByLabel('Organization Name *').fill('Version Test Corp');
    await page.getByLabel('Organization Code *').fill('VTC001');
    await page.getByLabel('Business Type').selectOption('corporation');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    // Skip to build
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Skip Country Selection' }).click();
    await page.getByRole('button', { name: 'Skip Industry Selection' }).click();
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    
    // Verify version tracking in created COA
    await expect(page.getByText('Created from Universal Base v2.1.0')).toBeVisible();
  });

  test('should support bulk template operations', async ({ page }) => {
    // Navigate to Templates Dashboard
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Select multiple templates for bulk operations
    await page.getByRole('checkbox', { name: 'Select India template' }).check();
    await page.getByRole('checkbox', { name: 'Select USA template' }).check();
    await page.getByRole('checkbox', { name: 'Select Restaurant template' }).check();
    
    // Check bulk actions are available
    await expect(page.getByRole('button', { name: 'Bulk Export (3)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Bulk Update (3)' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Compare Templates (3)' })).toBeVisible();
    
    // Test bulk export
    await page.getByRole('button', { name: 'Bulk Export (3)' }).click();
    await expect(page.getByText('Exporting 3 templates...')).toBeVisible();
    
    // Test template comparison
    await page.getByRole('button', { name: 'Compare Templates (3)' }).click();
    await expect(page.getByRole('heading', { name: 'Template Comparison' })).toBeVisible();
    
    // Check comparison table
    await expect(page.getByText('Account Differences')).toBeVisible();
    await expect(page.getByText('India: 45 accounts')).toBeVisible();
    await expect(page.getByText('USA: 38 accounts')).toBeVisible();
    await expect(page.getByText('Restaurant: 42 accounts')).toBeVisible();
    
    // Check unique accounts per template
    await expect(page.getByText('India-specific:')).toBeVisible();
    await expect(page.getByText('GST Input Tax Credit')).toBeVisible();
    
    await expect(page.getByText('USA-specific:')).toBeVisible();
    await expect(page.getByText('Federal Income Tax Payable')).toBeVisible();
    
    await expect(page.getByText('Restaurant-specific:')).toBeVisible();
    await expect(page.getByText('Food Inventory')).toBeVisible();
  });

  test('should maintain audit trail during template copying', async ({ page }) => {
    // Create new organization with template
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    await page.getByRole('button', { name: 'Use Template' }).click();
    
    // Fill details with audit tracking enabled
    await page.getByLabel('Organization Name *').fill('Audit Trail Corp');
    await page.getByLabel('Organization Code *').fill('ATC001');
    await page.getByLabel('Business Type').selectOption('corporation');
    await page.getByLabel('Primary Currency').selectOption('USD');
    
    // Enable audit logging
    await page.getByRole('checkbox', { name: 'Enable detailed audit logging' }).check();
    
    await page.getByRole('button', { name: 'Next: Country Selection' }).click();
    await page.getByRole('button', { name: 'Skip Country Selection' }).click();
    await page.getByRole('button', { name: 'Skip Industry Selection' }).click();
    
    // Add custom account to track
    await page.getByRole('button', { name: 'Add Custom Account' }).click();
    await page.getByLabel('Account Type *').selectOption('assets');
    await page.getByLabel('Account Code *').fill('1250000');
    await page.getByLabel('Account Name *').fill('Audit Test Account');
    await page.getByRole('button', { name: 'Add Account' }).click();
    
    await page.getByRole('button', { name: 'Build Chart of Accounts' }).click();
    
    // Check audit trail is accessible
    await page.getByRole('button', { name: 'View Audit Trail' }).click();
    
    // Verify audit entries
    await expect(page.getByRole('heading', { name: 'COA Creation Audit Trail' })).toBeVisible();
    await expect(page.getByText('Template Selection: Universal Base v2.1.0')).toBeVisible();
    await expect(page.getByText('Custom Account Added: Audit Test Account (1250000)')).toBeVisible();
    await expect(page.getByText('COA Built: 68 accounts created')).toBeVisible();
    await expect(page.getByText('Created by: System User')).toBeVisible();
    
    // Check timestamps are recorded
    const auditEntries = page.locator('.audit-entry');
    await expect(auditEntries).toHaveCount(4); // Template selection, custom account, build, completion
    
    // Verify each entry has timestamp
    for (let i = 0; i < 4; i++) {
      await expect(auditEntries.nth(i).locator('.timestamp')).toBeVisible();
    }
  });
});