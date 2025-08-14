import { test, expect } from '@playwright/test';

test.describe('COA Templates Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to COA page
    await page.goto('/coa');
    
    // Wait for page to load
    await expect(page.getByText('Universal Chart of Accounts')).toBeVisible();
  });

  test('should display templates dashboard with stats', async ({ page }) => {
    // Check main title
    await expect(page.getByRole('heading', { name: 'COA Templates Dashboard' })).toBeVisible();
    
    // Check stats cards are visible
    await expect(page.getByText('1,847').first()).toBeVisible(); // Organizations
    await expect(page.getByText('Organizations').first()).toBeVisible();
    
    await expect(page.getByText('8').first()).toBeVisible(); // Active Templates
    await expect(page.getByText('Active Templates')).toBeVisible();
    
    await expect(page.getByText('3').first()).toBeVisible(); // Countries
    await expect(page.getByText('Countries').first()).toBeVisible();
    
    await expect(page.getByText('4').first()).toBeVisible(); // Industries
    await expect(page.getByText('Industries').first()).toBeVisible();
  });

  test('should navigate between template tabs', async ({ page }) => {
    // Click on Templates Dashboard tab
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Check Templates Overview tab is default
    await expect(page.getByRole('tab', { name: 'Templates Overview' })).toHaveAttribute('data-state', 'active');
    
    // Navigate to Universal Base tab
    await page.getByRole('tab', { name: 'Universal Base' }).click();
    await expect(page.getByText('The foundation template that works for any business worldwide')).toBeVisible();
    await expect(page.getByText('67').first()).toBeVisible(); // Base accounts count
    
    // Navigate to Countries tab
    await page.getByRole('tab', { name: 'Countries' }).click();
    await expect(page.getByText('India Compliance Template')).toBeVisible();
    await expect(page.getByText('USA Compliance Template')).toBeVisible();
    await expect(page.getByText('UK Compliance Template')).toBeVisible();
    
    // Navigate to Industries tab
    await page.getByRole('tab', { name: 'Industries' }).click();
    await expect(page.getByText('Restaurant & Food Service')).toBeVisible();
    await expect(page.getByText('Healthcare & Medical')).toBeVisible();
    await expect(page.getByText('Manufacturing').first()).toBeVisible();
    await expect(page.getByText('Professional Services')).toBeVisible();
  });

  test('should search templates', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Search for India
    await page.getByPlaceholder('Search templates...').fill('India');
    
    // Check India template is visible
    await expect(page.getByText('India Compliance Template')).toBeVisible();
    
    // Check other templates are filtered out
    await expect(page.getByText('USA Compliance Template')).not.toBeVisible();
  });

  test('should display template actions', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Find a template card (India)
    const indiaCard = page.locator('text=India Compliance Template').locator('../..');
    
    // Check action buttons are present
    await expect(indiaCard.getByRole('button', { name: 'View' })).toBeVisible();
    await expect(indiaCard.getByRole('button', { name: 'Edit' })).toBeVisible();
    
    // Universal base template should not have delete button
    const universalCard = page.locator('text=Universal Base Template').locator('../..');
    await expect(universalCard.getByRole('button', { name: 'View' })).toBeVisible();
    await expect(universalCard.getByRole('button', { name: 'Edit' })).toBeVisible();
    await expect(universalCard.getByRole('button', { name: 'Delete' })).not.toBeVisible();
  });

  test('should display template metadata correctly', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Check template cards show correct information
    const indiaCard = page.locator('text=India Compliance Template').locator('../..');
    
    // Check account count
    await expect(indiaCard.getByText('45')).toBeVisible(); // Account count
    await expect(indiaCard.getByText('Accounts')).toBeVisible();
    
    // Check organizations using
    await expect(indiaCard.getByText('423')).toBeVisible(); // Organizations using
    await expect(indiaCard.getByText('In Use')).toBeVisible();
    
    // Check status badge
    await expect(indiaCard.getByText('active')).toBeVisible();
  });

  test('should handle export and import actions', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Check export button exists
    await expect(page.getByRole('button', { name: 'Export All' })).toBeVisible();
    
    // Check import button exists
    await expect(page.getByRole('button', { name: 'Import' })).toBeVisible();
    
    // Check refresh button exists and works
    await expect(page.getByRole('button', { name: 'Refresh' })).toBeVisible();
    
    // Click refresh
    await page.getByRole('button', { name: 'Refresh' }).click();
    
    // Check loading state appears
    await expect(page.getByText('Loading templates dashboard...')).toBeVisible();
    
    // Wait for reload to complete
    await expect(page.getByText('Loading templates dashboard...')).not.toBeVisible({ timeout: 5000 });
  });

  test('should create new template', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    
    // Click new template button
    await page.getByRole('button', { name: 'New Template' }).click();
    
    // In a real implementation, this would open a dialog/form
    // For now, we just check the button exists and is clickable
  });

  test('should display country templates with correct details', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Countries' }).click();
    
    // Check India template
    const indiaCard = page.locator('text=India Compliance Template').locator('../..');
    await expect(indiaCard.getByText('Legal & Tax Compliance')).toBeVisible();
    await expect(indiaCard.getByText('Compliance Accounts')).toBeVisible();
    await expect(indiaCard.getByText('45')).toBeVisible(); // Account count
    
    // Check USA template
    const usaCard = page.locator('text=USA Compliance Template').locator('../..');
    await expect(usaCard.getByText('38')).toBeVisible(); // Account count
    
    // Check UK template
    const ukCard = page.locator('text=UK Compliance Template').locator('../..');
    await expect(ukCard.getByText('32')).toBeVisible(); // Account count
  });

  test('should display industry templates with correct details', async ({ page }) => {
    await page.getByRole('tab', { name: 'Templates Dashboard' }).click();
    await page.getByRole('tab', { name: 'Industries' }).click();
    
    // Check Restaurant template
    const restaurantCard = page.locator('text=Restaurant & Food Service').locator('../..');
    await expect(restaurantCard.getByText('Industry-Specific Accounts')).toBeVisible();
    await expect(restaurantCard.getByText('42')).toBeVisible(); // Account count
    
    // Check Healthcare template
    const healthcareCard = page.locator('text=Healthcare & Medical').locator('../..');
    await expect(healthcareCard.getByText('38')).toBeVisible(); // Account count
    
    // Check Manufacturing template
    const manufacturingCard = page.locator('text=Manufacturing').locator('../..');
    await expect(manufacturingCard.getByText('35')).toBeVisible(); // Account count
    
    // Check Professional Services template
    const professionalCard = page.locator('text=Professional Services').locator('../..');
    await expect(professionalCard.getByText('27')).toBeVisible(); // Account count
  });

  test('should display governance notice', async ({ page }) => {
    // Check governance notice at bottom of page
    await expect(page.getByText('Governance & Compliance')).toBeVisible();
    await expect(page.getByText(/This Universal Global COA system is mandatory/)).toBeVisible();
    
    // Check compliance badges
    await expect(page.getByText('Governance Required')).toBeVisible();
    await expect(page.getByText('Zero Exceptions')).toBeVisible();
  });
});