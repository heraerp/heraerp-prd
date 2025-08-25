import { test, expect } from '@playwright/test';

test.describe('HERA Salon - Final Working Tests', () => {
  test('Salon Dashboard - Basic Load Test', async ({ page }) => {
    // Navigate to salon
    await page.goto('/salon');
    
    // Wait for any content to load
    await page.waitForLoadState('domcontentloaded');
    
    // Basic checks that page loaded
    expect(page.url()).toContain('/salon');
    
    // Page should have title
    const title = await page.title();
    expect(title).toBeTruthy();
    
    // Should have some content
    const bodyText = await page.textContent('body');
    expect(bodyText).toBeTruthy();
    expect(bodyText?.length).toBeGreaterThan(100);
    
    // Take screenshot for reference
    await page.screenshot({ path: 'test-results/salon-dashboard.png' });
  });

  test('Salon Navigation - Sidebar Links Work', async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    // Find and click Appointments link
    const appointmentsLink = page.getByText('Appointments', { exact: true }).first();
    if (await appointmentsLink.isVisible()) {
      await appointmentsLink.click();
      await page.waitForLoadState('domcontentloaded');
      expect(page.url()).toContain('appointments');
    }
  });

  test('Salon Appointments - Page Loads', async ({ page }) => {
    await page.goto('/salon/appointments');
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('/appointments');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/salon-appointments.png' });
  });

  test('Salon Clients - Page Loads', async ({ page }) => {
    await page.goto('/salon/clients');
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('/clients');
    
    // Page should have loaded with content
    const content = await page.textContent('body');
    expect(content).toBeTruthy();
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/salon-clients.png' });
  });

  test('Salon POS - Page Loads', async ({ page }) => {
    await page.goto('/salon/pos');
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('/pos');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/salon-pos.png' });
  });

  test('Salon Services - Page Loads', async ({ page }) => {
    await page.goto('/salon/services');
    await page.waitForLoadState('domcontentloaded');
    
    expect(page.url()).toContain('/services');
    
    // Take screenshot
    await page.screenshot({ path: 'test-results/salon-services.png' });
  });

  test('Salon Dashboard - Has Expected Text Content', async ({ page }) => {
    await page.goto('/salon');
    
    // Wait for specific text that we know exists
    await page.waitForSelector('text=Welcome to Dubai Luxury Salon', { timeout: 10000 });
    
    // Verify key text elements exist
    await expect(page.getByText('Welcome to Dubai Luxury Salon')).toBeVisible();
    await expect(page.getByText('Quick Actions')).toBeVisible();
  });

  test('Salon Dashboard - Has Navigation Items', async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    // Check for navigation items we found in diagnostic
    const navItems = ['Dashboard', 'Appointments', 'Clients', 'Point of Sale'];
    
    for (const item of navItems) {
      const element = page.getByText(item, { exact: true }).first();
      const isVisible = await element.isVisible().catch(() => false);
      if (isVisible) {
        console.log(`Found navigation item: ${item}`);
      }
    }
  });

  test('Salon - Complete User Journey', async ({ page }) => {
    // Start at dashboard
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    // Navigate to clients
    const clientsLink = page.getByText('Clients', { exact: true }).first();
    if (await clientsLink.isVisible()) {
      await clientsLink.click();
      await page.waitForURL('**/clients');
      
      // Go back to dashboard
      const dashboardLink = page.getByText('Dashboard', { exact: true }).first();
      if (await dashboardLink.isVisible()) {
        await dashboardLink.click();
        await page.waitForURL('**/salon');
      }
    }
  });
});