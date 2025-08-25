import { test, expect } from '@playwright/test';

test.describe('Multi-Organization Flow', () => {
  test.use({
    storageState: 'tests/e2e/auth-state.json' // Authenticated state
  });

  test('should create new organization', async ({ page }) => {
    await page.goto('/auth/organizations/new');
    
    // Fill organization form
    await page.getByLabel('Organization Name').fill('Test Restaurant UAT');
    await page.getByLabel('Industry').selectOption('restaurant');
    await page.getByLabel('Subdomain').fill('test-restaurant-uat');
    
    // Submit form
    await page.getByRole('button', { name: /create organization/i }).click();
    
    // Should redirect to app selection
    await expect(page).toHaveURL(/\/auth\/organizations\/[^\/]+\/apps/);
    await expect(page.getByText('Select Applications')).toBeVisible();
  });

  test('should select and install apps', async ({ page }) => {
    // Assuming we're on app selection page
    await page.goto('/auth/organizations/test-org-id/apps');
    
    // Select apps
    await page.getByRole('checkbox', { name: /Point of Sale/i }).check();
    await page.getByRole('checkbox', { name: /Inventory Management/i }).check();
    await page.getByRole('checkbox', { name: /Customer Management/i }).check();
    
    // Continue
    await page.getByRole('button', { name: /continue/i }).click();
    
    // Should show success and redirect
    await expect(page.getByText(/apps installed successfully/i)).toBeVisible();
  });

  test('should switch between organizations', async ({ page }) => {
    await page.goto('/auth/organizations');
    
    // Should see organization list
    await expect(page.getByRole('heading', { name: /your organizations/i })).toBeVisible();
    
    // Click on an organization
    await page.getByRole('button', { name: /mario's restaurant/i }).click();
    
    // Should redirect to organization dashboard
    await expect(page).toHaveURL(/\/org/);
  });
});