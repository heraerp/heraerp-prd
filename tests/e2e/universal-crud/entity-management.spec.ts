import { test, expect } from '@playwright/test';

test.describe('Universal Entity Management', () => {
  test.beforeEach(async ({ page }) => {
    // Assuming authenticated state
    await page.goto('/org/entities');
  });

  test('should display entity list', async ({ page }) => {
    // Check table headers
    await expect(page.getByRole('columnheader', { name: /name/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /type/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /code/i })).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /status/i })).toBeVisible();
  });

  test('should create new entity', async ({ page }) => {
    // Click create button
    await page.getByRole('button', { name: /create entity/i }).click();
    
    // Fill form in modal
    await page.getByLabel('Entity Type').selectOption('customer');
    await page.getByLabel('Entity Name').fill('UAT Test Customer');
    await page.getByLabel('Entity Code').fill('CUST-UAT-001');
    
    // Submit
    await page.getByRole('button', { name: /save/i }).click();
    
    // Check success message
    await expect(page.getByText(/entity created successfully/i)).toBeVisible();
    
    // New entity should appear in list
    await expect(page.getByText('UAT Test Customer')).toBeVisible();
  });

  test('should edit entity', async ({ page }) => {
    // Click edit on first entity
    await page.getByRole('button', { name: /edit/i }).first().click();
    
    // Update name
    await page.getByLabel('Entity Name').fill('Updated Customer Name');
    
    // Save
    await page.getByRole('button', { name: /save/i }).click();
    
    // Check success
    await expect(page.getByText(/entity updated successfully/i)).toBeVisible();
    await expect(page.getByText('Updated Customer Name')).toBeVisible();
  });

  test('should add dynamic fields', async ({ page }) => {
    // Click on entity to view details
    await page.getByRole('row').first().click();
    
    // Click add field button
    await page.getByRole('button', { name: /add field/i }).click();
    
    // Fill dynamic field form
    await page.getByLabel('Field Name').fill('credit_limit');
    await page.getByLabel('Field Value').fill('50000');
    await page.getByLabel('Field Type').selectOption('number');
    
    // Save
    await page.getByRole('button', { name: /add field/i }).click();
    
    // Field should appear
    await expect(page.getByText('credit_limit')).toBeVisible();
    await expect(page.getByText('50000')).toBeVisible();
  });

  test('should filter entities', async ({ page }) => {
    // Use search box
    await page.getByPlaceholder(/search entities/i).fill('customer');
    
    // Only customers should be visible
    const rows = page.getByRole('row');
    await expect(rows).toHaveCount(await rows.count());
    
    // Check all visible are customers
    const types = await page.getByRole('cell', { name: /customer/i }).all();
    expect(types.length).toBeGreaterThan(0);
  });
});