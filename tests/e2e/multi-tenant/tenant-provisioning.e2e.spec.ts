/**
 * E2E Tests for Multi-Tenant Provisioning Flow
 * Tests the complete tenant provisioning journey from signup to organization access
 */

import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

test.describe('Multi-Tenant Provisioning Flow', () => {
  const testData = {
    organizationName: `Test Org ${Date.now()}`,
    subdomain: `test-org-${Date.now()}`,
    ownerEmail: `test-${Date.now()}@example.com`,
    ownerPassword: 'Test123!@#',
    ownerName: 'Test Owner',
    businessType: 'salon'
  };

  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('complete tenant provisioning flow', async ({ page }) => {
    // Step 1: Navigate to signup page
    await page.goto('/auth/signup');
    
    // Verify we're on the signup page
    await expect(page.locator('h1')).toContainText(/sign up|create account/i);

    // Step 2: Fill signup form
    await page.fill('[data-testid="email-input"]', testData.ownerEmail);
    await page.fill('[data-testid="password-input"]', testData.ownerPassword);
    await page.fill('[data-testid="name-input"]', testData.ownerName);
    
    // Submit signup form
    await page.click('[data-testid="signup-button"]');
    
    // Step 3: Wait for redirect to organization creation
    await page.waitForURL('/auth/organizations/new', { timeout: 10000 });
    
    // Verify we're on the organization creation page
    await expect(page.locator('h1')).toContainText(/create.*organization/i);

    // Step 4: Fill organization details
    await page.fill('[data-testid="org-name-input"]', testData.organizationName);
    await page.fill('[data-testid="subdomain-input"]', testData.subdomain);
    await page.selectOption('[data-testid="business-type-select"]', testData.businessType);
    
    // Submit organization creation
    await page.click('[data-testid="create-org-button"]');
    
    // Step 5: Wait for app selection page
    await page.waitForURL(/\/auth\/organizations\/.*\/apps/, { timeout: 10000 });
    
    // Verify we're on the app selection page
    await expect(page.locator('h1')).toContainText(/select.*apps|choose.*modules/i);

    // Step 6: Select modules for the organization
    // Select POS module
    await page.click('[data-testid="module-pos"]');
    await expect(page.locator('[data-testid="module-pos"]')).toBeChecked();
    
    // Select Appointments module
    await page.click('[data-testid="module-appointments"]');
    await expect(page.locator('[data-testid="module-appointments"]')).toBeChecked();
    
    // Complete app selection
    await page.click('[data-testid="complete-setup-button"]');
    
    // Step 7: Verify redirect to organization subdomain
    // In development, this would be localhost:3000/~subdomain
    // In production, this would be subdomain.heraerp.com
    const expectedUrl = process.env.NODE_ENV === 'production' 
      ? `https://${testData.subdomain}.heraerp.com`
      : `http://localhost:3000/~${testData.subdomain}`;
    
    await page.waitForURL(url => {
      return url.href.includes(testData.subdomain) || url.pathname.includes(`~${testData.subdomain}`);
    }, { timeout: 15000 });
    
    // Verify we're on the organization dashboard
    await expect(page.locator('h1')).toContainText(/dashboard|welcome/i);
    
    // Verify organization context is set
    await expect(page.locator('[data-testid="org-name-display"]')).toContainText(testData.organizationName);
  });

  test('subdomain availability check', async ({ page, request }) => {
    // Navigate to organization creation page (assuming user is already authenticated)
    await page.goto('/auth/organizations/new');
    
    // Try to use an existing subdomain
    const existingSubdomain = 'demo'; // Assuming 'demo' already exists
    
    await page.fill('[data-testid="subdomain-input"]', existingSubdomain);
    
    // Trigger subdomain check (blur event or explicit check button)
    await page.locator('[data-testid="subdomain-input"]').blur();
    
    // Wait for availability check
    await page.waitForSelector('[data-testid="subdomain-error"]', { timeout: 5000 });
    
    // Verify error message
    await expect(page.locator('[data-testid="subdomain-error"]')).toContainText(/already taken|not available/i);
    
    // Try a unique subdomain
    const uniqueSubdomain = `unique-${Date.now()}`;
    await page.fill('[data-testid="subdomain-input"]', uniqueSubdomain);
    await page.locator('[data-testid="subdomain-input"]').blur();
    
    // Wait for success indicator
    await page.waitForSelector('[data-testid="subdomain-success"]', { timeout: 5000 });
    
    // Verify success message
    await expect(page.locator('[data-testid="subdomain-success"]')).toContainText(/available/i);
  });

  test('module entitlement enforcement', async ({ page }) => {
    // This test assumes we have a test organization without certain modules
    const testOrgSubdomain = 'test-limited';
    
    // Navigate to organization with limited modules
    await page.goto(`/~${testOrgSubdomain}`);
    
    // Try to access a module that's not granted
    await page.goto(`/~${testOrgSubdomain}/inventory`);
    
    // Should be redirected or show access denied
    await expect(page.locator('[data-testid="access-denied"]')).toBeVisible();
    await expect(page.locator('[data-testid="access-denied"]')).toContainText(/not authorized|access denied/i);
    
    // Navigate to a granted module
    await page.goto(`/~${testOrgSubdomain}/salon/pos`);
    
    // Should have access
    await expect(page.locator('h1')).toContainText(/point of sale|pos/i);
  });

  test('organization switching', async ({ page }) => {
    // This test assumes the user has multiple organizations
    
    // Navigate to organization selector
    await page.goto('/auth/organizations');
    
    // Verify we see multiple organizations
    const orgCards = page.locator('[data-testid="org-card"]');
    await expect(orgCards).toHaveCount(2); // Assuming user has at least 2 orgs
    
    // Click on first organization
    await orgCards.first().click();
    
    // Verify we're redirected to that organization's subdomain
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });
    
    // Get the current org name
    const firstOrgName = await page.locator('[data-testid="org-name-display"]').textContent();
    
    // Switch to another organization
    await page.click('[data-testid="org-switcher"]');
    await page.click('[data-testid="switch-org-button"]');
    
    // Back to organization selector
    await page.waitForURL('/auth/organizations');
    
    // Click on second organization
    await orgCards.nth(1).click();
    
    // Verify we're in a different organization
    await page.waitForURL(/dashboard|home/, { timeout: 10000 });
    const secondOrgName = await page.locator('[data-testid="org-name-display"]').textContent();
    
    expect(firstOrgName).not.toBe(secondOrgName);
  });

  test('multi-tenant data isolation', async ({ page, request }) => {
    // Create two test organizations with API
    const org1 = {
      subdomain: `org1-${Date.now()}`,
      name: `Org 1 ${Date.now()}`
    };
    
    const org2 = {
      subdomain: `org2-${Date.now()}`,
      name: `Org 2 ${Date.now()}`
    };
    
    // Navigate to first organization
    await page.goto(`/~${org1.subdomain}`);
    
    // Create some data in org1
    await page.goto(`/~${org1.subdomain}/customers`);
    await page.click('[data-testid="add-customer-button"]');
    await page.fill('[data-testid="customer-name-input"]', 'Org1 Customer');
    await page.click('[data-testid="save-button"]');
    
    // Verify customer was created
    await expect(page.locator('text=Org1 Customer')).toBeVisible();
    
    // Switch to second organization
    await page.goto(`/~${org2.subdomain}`);
    
    // Navigate to customers in org2
    await page.goto(`/~${org2.subdomain}/customers`);
    
    // Verify we don't see org1's customer
    await expect(page.locator('text=Org1 Customer')).not.toBeVisible();
    
    // Create different customer in org2
    await page.click('[data-testid="add-customer-button"]');
    await page.fill('[data-testid="customer-name-input"]', 'Org2 Customer');
    await page.click('[data-testid="save-button"]');
    
    // Switch back to org1
    await page.goto(`/~${org1.subdomain}/customers`);
    
    // Verify we don't see org2's customer
    await expect(page.locator('text=Org2 Customer')).not.toBeVisible();
    // But we still see org1's customer
    await expect(page.locator('text=Org1 Customer')).toBeVisible();
  });

  test.afterEach(async ({ page }) => {
    // Cleanup: Could make API calls to delete test organizations
    // This would require admin/test utilities
  });
});