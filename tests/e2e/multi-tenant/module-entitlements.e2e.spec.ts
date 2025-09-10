/**
 * E2E Tests for Module Entitlements
 * Tests the module access control and entitlement management
 */

import { test, expect, Page } from '@playwright/test';

test.describe('Module Entitlements', () => {
  let page: Page;
  
  // Helper to check module access
  async function checkModuleAccess(page: Page, subdomain: string, modulePath: string, shouldHaveAccess: boolean) {
    await page.goto(`/~${subdomain}/${modulePath}`);
    
    if (shouldHaveAccess) {
      // Should see the module content
      await expect(page.locator('h1')).not.toContainText(/access denied|unauthorized/i);
      await expect(page.url()).toContain(modulePath);
    } else {
      // Should see access denied or be redirected
      const accessDenied = page.locator('[data-testid="access-denied"]');
      const unauthorizedPage = page.locator('text=/unauthorized|access denied|not authorized/i');
      
      // Either access denied message or redirect to dashboard
      const isAccessDenied = await accessDenied.isVisible().catch(() => false) || 
                            await unauthorizedPage.isVisible().catch(() => false) ||
                            !page.url().includes(modulePath);
      
      expect(isAccessDenied).toBeTruthy();
    }
  }

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
  });

  test('module access based on entitlements', async () => {
    // Test organization with limited modules
    const limitedOrgSubdomain = 'test-limited';
    
    // Modules this org should have access to
    const grantedModules = [
      { path: 'salon/pos', name: 'Point of Sale' },
      { path: 'salon/clients', name: 'Client Management' }
    ];
    
    // Modules this org should NOT have access to
    const deniedModules = [
      { path: 'inventory', name: 'Inventory Management' },
      { path: 'accounting', name: 'Accounting' },
      { path: 'restaurant/kitchen', name: 'Kitchen Display' }
    ];
    
    // Test granted modules
    for (const module of grantedModules) {
      await checkModuleAccess(page, limitedOrgSubdomain, module.path, true);
    }
    
    // Test denied modules
    for (const module of deniedModules) {
      await checkModuleAccess(page, limitedOrgSubdomain, module.path, false);
    }
  });

  test('module navigation menu reflects entitlements', async () => {
    // Navigate to organization with specific entitlements
    await page.goto('/~skcuts');
    
    // Expected modules for salon
    const expectedModules = [
      'salon-pos',
      'salon-appointments',
      'salon-clients',
      'salon-inventory'
    ];
    
    const unexpectedModules = [
      'restaurant-kitchen',
      'manufacturing-bom',
      'healthcare-patients'
    ];
    
    // Open navigation menu
    const navToggle = page.locator('[data-testid="nav-menu-toggle"]');
    if (await navToggle.isVisible()) {
      await navToggle.click();
    }
    
    // Check that expected modules are visible
    for (const moduleId of expectedModules) {
      const moduleLink = page.locator(`[data-testid="nav-link-${moduleId}"]`);
      await expect(moduleLink).toBeVisible();
    }
    
    // Check that unexpected modules are not visible
    for (const moduleId of unexpectedModules) {
      const moduleLink = page.locator(`[data-testid="nav-link-${moduleId}"]`);
      await expect(moduleLink).not.toBeVisible();
    }
  });

  test('real-time module entitlement updates', async () => {
    const testSubdomain = 'test-dynamic';
    
    // Navigate to organization
    await page.goto(`/~${testSubdomain}`);
    
    // Initially, inventory module should not be accessible
    await checkModuleAccess(page, testSubdomain, 'inventory', false);
    
    // Open module management page in a new tab
    const adminPage = await page.context().newPage();
    await adminPage.goto(`/~${testSubdomain}/settings/modules`);
    
    // Grant inventory module access
    await adminPage.click('[data-testid="module-inventory-toggle"]');
    await adminPage.click('[data-testid="save-modules-button"]');
    
    // Wait for success message
    await expect(adminPage.locator('[data-testid="success-message"]')).toContainText(/modules updated/i);
    
    // Go back to original page and refresh
    await page.reload();
    
    // Now inventory should be accessible
    await checkModuleAccess(page, testSubdomain, 'inventory', true);
    
    // Verify the module appears in navigation
    const inventoryLink = page.locator('[data-testid="nav-link-inventory"]');
    await expect(inventoryLink).toBeVisible();
  });

  test('module usage tracking', async () => {
    const testSubdomain = 'skcuts';
    
    // Navigate to POS module
    await page.goto(`/~${testSubdomain}/salon/pos`);
    
    // Perform some actions that should be tracked
    await page.click('[data-testid="new-sale-button"]');
    await page.click('[data-testid="add-service-button"]');
    
    // Navigate to usage dashboard
    await page.goto(`/~${testSubdomain}/settings/usage`);
    
    // Verify usage statistics are displayed
    await expect(page.locator('[data-testid="module-usage-pos"]')).toBeVisible();
    
    // Check that usage count has increased
    const posUsageCount = await page.locator('[data-testid="pos-usage-count"]').textContent();
    expect(parseInt(posUsageCount || '0')).toBeGreaterThan(0);
  });

  test('module-specific permissions within entitled modules', async () => {
    const testSubdomain = 'skcuts';
    
    // Test with a user who has read-only access to POS
    // This assumes the test user has limited permissions
    await page.goto(`/~${testSubdomain}/salon/pos`);
    
    // Can view POS
    await expect(page.locator('h1')).toContainText(/point of sale/i);
    
    // But cannot perform write actions
    const newSaleButton = page.locator('[data-testid="new-sale-button"]');
    
    // Button should either be disabled or clicking it shows permission error
    if (await newSaleButton.isDisabled()) {
      expect(await newSaleButton.isDisabled()).toBeTruthy();
    } else {
      await newSaleButton.click();
      await expect(page.locator('[data-testid="permission-error"]')).toContainText(/permission|authorized/i);
    }
  });

  test('module dependencies and bundling', async () => {
    const testSubdomain = 'test-bundle';
    
    // Navigate to module settings
    await page.goto(`/~${testSubdomain}/settings/modules`);
    
    // Try to enable a module that has dependencies
    const inventoryToggle = page.locator('[data-testid="module-inventory-toggle"]');
    await inventoryToggle.click();
    
    // Should show dependency warning
    await expect(page.locator('[data-testid="dependency-warning"]')).toContainText(/requires.*pos/i);
    
    // Should auto-select dependent modules
    const posToggle = page.locator('[data-testid="module-pos-toggle"]');
    await expect(posToggle).toBeChecked();
    
    // Test module bundles
    await page.click('[data-testid="bundle-salon-complete"]');
    
    // Should select all salon-related modules
    const salonModules = ['salon-pos', 'salon-appointments', 'salon-clients', 'salon-inventory'];
    for (const moduleId of salonModules) {
      const toggle = page.locator(`[data-testid="module-${moduleId}-toggle"]`);
      await expect(toggle).toBeChecked();
    }
  });

  test('module access audit trail', async () => {
    const testSubdomain = 'skcuts';
    
    // Access various modules
    const modulesToAccess = [
      'salon/pos',
      'salon/appointments',
      'salon/clients'
    ];
    
    for (const module of modulesToAccess) {
      await page.goto(`/~${testSubdomain}/${module}`);
      await page.waitForLoadState('networkidle');
    }
    
    // Navigate to audit log
    await page.goto(`/~${testSubdomain}/settings/audit`);
    
    // Filter by module access events
    await page.selectOption('[data-testid="audit-filter-type"]', 'module_access');
    await page.click('[data-testid="apply-filter-button"]');
    
    // Verify access events are logged
    const auditEntries = page.locator('[data-testid="audit-entry"]');
    await expect(auditEntries).toHaveCount(3);
    
    // Verify audit entry details
    const firstEntry = auditEntries.first();
    await expect(firstEntry).toContainText(/module.*access/i);
    await expect(firstEntry).toContainText(/salon\/pos|salon\/appointments|salon\/clients/);
  });

  test.afterEach(async () => {
    await page.close();
  });
});