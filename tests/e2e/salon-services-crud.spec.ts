import { test, expect } from '@playwright/test';

// Test data
const testService = {
  name: 'Test Haircut Service',
  code: 'SVC-TEST-001',
  price: 150.00,
  duration: 45,
  description: 'Test service for E2E testing'
};

const updatedService = {
  name: 'Updated Test Service',
  price: 200.00,
  duration: 60
};

test.describe('Salon Services CRUD Operations', () => {
  // Login before each test
  test.beforeEach(async ({ page }) => {
    // Navigate to login
    await page.goto('http://localhost:3000/auth/login');
    
    // Login with test credentials
    await page.fill('[name="email"]', 'test@example.com');
    await page.fill('[name="password"]', 'testpassword');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to organization page
    await page.waitForURL('**/org/**');
    
    // Navigate to services page
    await page.goto('http://localhost:3000/salon-data/services');
    await page.waitForLoadState('networkidle');
  });

  test('Create a new service', async ({ page }) => {
    // Click Add Service button
    await page.click('button:has-text("Add Service")');
    
    // Fill in service details
    await page.fill('[name="entity_name"]', testService.name);
    await page.fill('[name="entity_code"]', testService.code);
    await page.fill('[name="price"]', testService.price.toString());
    await page.fill('[name="duration"]', testService.duration.toString());
    await page.fill('[name="description"]', testService.description);
    
    // Submit form
    await page.click('button:has-text("Create Service")');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Service created successfully');
    
    // Verify service appears in table
    await expect(page.locator('table')).toContainText(testService.name);
    await expect(page.locator('table')).toContainText(`$${testService.price}`);
  });

  test('Read/View service details', async ({ page }) => {
    // Find and click on the test service
    await page.click(`tr:has-text("${testService.name}")`);
    
    // Verify service details are displayed
    await expect(page.locator('h2')).toContainText(testService.name);
    await expect(page.locator('text=Price')).toBeVisible();
    await expect(page.locator('text=$150.00')).toBeVisible();
    await expect(page.locator('text=Duration')).toBeVisible();
    await expect(page.locator('text=45 minutes')).toBeVisible();
  });

  test('Update an existing service', async ({ page }) => {
    // Find the service in the table
    const serviceRow = page.locator(`tr:has-text("${testService.name}")`);
    
    // Click edit button
    await serviceRow.locator('button:has-text("Edit")').click();
    
    // Update service details
    await page.fill('[name="entity_name"]', updatedService.name);
    await page.fill('[name="price"]', updatedService.price.toString());
    await page.fill('[name="duration"]', updatedService.duration.toString());
    
    // Save changes
    await page.click('button:has-text("Save Changes")');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Service updated successfully');
    
    // Verify updated values in table
    await expect(page.locator('table')).toContainText(updatedService.name);
    await expect(page.locator('table')).toContainText(`$${updatedService.price}`);
  });

  test('Delete a service', async ({ page }) => {
    // Find the updated service in the table
    const serviceRow = page.locator(`tr:has-text("${updatedService.name}")`);
    
    // Click delete button
    await serviceRow.locator('button:has-text("Delete")').click();
    
    // Confirm deletion in dialog
    await page.click('button:has-text("Confirm Delete")');
    
    // Verify success message
    await expect(page.locator('.toast-success')).toContainText('Service deleted successfully');
    
    // Verify service is removed from table
    await expect(page.locator('table')).not.toContainText(updatedService.name);
  });

  test('Search and filter services', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder="Search services..."]', 'Haircut');
    
    // Verify filtered results
    await expect(page.locator('table')).toContainText('Haircut');
    await expect(page.locator('table')).not.toContainText('Manicure');
  });

  test('Validate required fields', async ({ page }) => {
    // Click Add Service button
    await page.click('button:has-text("Add Service")');
    
    // Try to submit without required fields
    await page.click('button:has-text("Create Service")');
    
    // Check for validation errors
    await expect(page.locator('text=Service name is required')).toBeVisible();
    await expect(page.locator('text=Price is required')).toBeVisible();
  });

  test('Handle API errors gracefully', async ({ page }) => {
    // Intercept API call and return error
    await page.route('**/api/v1/universal', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      });
    });
    
    // Try to create a service
    await page.click('button:has-text("Add Service")');
    await page.fill('[name="entity_name"]', 'Test Service');
    await page.fill('[name="price"]', '100');
    await page.click('button:has-text("Create Service")');
    
    // Verify error message
    await expect(page.locator('.toast-error')).toContainText('Failed to create service');
  });
});

// Test with multi-tenant context
test.describe('Multi-tenant Service Management', () => {
  test('Services are isolated by organization', async ({ page }) => {
    // Login as Organization A
    await page.goto('http://localhost:3000/auth/login');
    await page.fill('[name="email"]', 'orgA@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Create service in Org A
    await page.goto('http://localhost:3000/salon-data/services');
    await page.click('button:has-text("Add Service")');
    await page.fill('[name="entity_name"]', 'Org A Exclusive Service');
    await page.fill('[name="price"]', '500');
    await page.click('button:has-text("Create Service")');
    
    // Logout
    await page.click('button:has-text("Sign Out")');
    
    // Login as Organization B
    await page.fill('[name="email"]', 'orgB@example.com');
    await page.fill('[name="password"]', 'password');
    await page.click('button[type="submit"]');
    
    // Verify Org A's service is not visible
    await page.goto('http://localhost:3000/salon-data/services');
    await expect(page.locator('table')).not.toContainText('Org A Exclusive Service');
  });
});