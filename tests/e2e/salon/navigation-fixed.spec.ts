import { test, expect } from '@playwright/test';

test.describe('HERA Salon - Fixed Navigation Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
    
    // Wait for sidebar to be fully loaded
    await page.waitForSelector('.fixed.left-0', { state: 'visible' });
    
    // Hover over sidebar to expand it (based on onMouseEnter event)
    const sidebar = page.locator('.fixed.left-0').first();
    await sidebar.hover();
    
    // Wait for expansion animation
    await page.waitForTimeout(500);
  });

  test('Navigate to Appointments using icon button', async ({ page }) => {
    // The sidebar uses Button components with icon and text
    // When expanded, it shows both icon and label
    const appointmentsButton = page.locator('button').filter({ 
      hasText: 'Appointments' 
    }).first();
    
    await expect(appointmentsButton).toBeVisible();
    await appointmentsButton.click();
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('appointments');
  });

  test('Navigate to Clients using icon button', async ({ page }) => {
    const clientsButton = page.locator('button').filter({ 
      hasText: 'Clients' 
    }).first();
    
    await expect(clientsButton).toBeVisible();
    await clientsButton.click();
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('clients');
  });

  test('Navigate to POS using Quick Actions', async ({ page }) => {
    // First try the regular navigation
    const posButton = page.locator('button').filter({ 
      hasText: 'Point of Sale' 
    }).first();
    
    if (await posButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await posButton.click();
    } else {
      // Alternative: Use Quick Actions button
      const quickActionsButton = page.locator('button').filter({ 
        hasText: 'Quick Actions' 
      }).first();
      
      await quickActionsButton.click();
      
      // Wait for modal to open
      await page.waitForSelector('[role="dialog"]', { state: 'visible' });
      
      // Click POS in quick actions
      const posQuickAction = page.locator('[role="dialog"] button').filter({ 
        hasText: 'Point of Sale' 
      }).first();
      
      await posQuickAction.click();
    }
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('pos');
  });

  test('Navigation works with collapsed sidebar', async ({ page }) => {
    // Move mouse away to collapse sidebar
    await page.mouse.move(400, 200);
    await page.waitForTimeout(500);
    
    // Now sidebar should be collapsed (w-16)
    // Hover over the appointments icon
    const sidebar = page.locator('.fixed.left-0').first();
    
    // Find the button that contains the Calendar icon (Appointments)
    // In collapsed state, only icons are visible
    const appointmentsIconButton = sidebar.locator('button').nth(1); // Appointments is second item
    
    // Hover to see tooltip
    await appointmentsIconButton.hover();
    
    // Wait for tooltip
    await page.waitForSelector('[role="tooltip"]', { state: 'visible' });
    
    // Click the icon
    await appointmentsIconButton.click();
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('appointments');
  });

  test('Complete navigation flow through multiple pages', async ({ page }) => {
    // Ensure sidebar is expanded
    const sidebar = page.locator('.fixed.left-0').first();
    await sidebar.hover();
    await page.waitForTimeout(300);
    
    // Navigate to Appointments
    const appointmentsBtn = page.locator('button').filter({ hasText: 'Appointments' }).first();
    await appointmentsBtn.click();
    await page.waitForURL('**/appointments');
    
    // Navigate to Clients
    await sidebar.hover(); // Re-expand if needed
    const clientsBtn = page.locator('button').filter({ hasText: 'Clients' }).first();
    await clientsBtn.click();
    await page.waitForURL('**/clients');
    
    // Navigate to Services
    await sidebar.hover();
    const servicesBtn = page.locator('button').filter({ hasText: 'Services' }).first();
    await servicesBtn.click();
    await page.waitForURL('**/services');
    
    // Go back to Dashboard
    await sidebar.hover();
    const dashboardBtn = page.locator('button').filter({ hasText: 'Dashboard' }).first();
    await dashboardBtn.click();
    await page.waitForURL('**/salon');
    
    expect(page.url()).toMatch(/\/salon$/);
  });

  test('More Apps section expands and navigates', async ({ page }) => {
    // Expand sidebar
    const sidebar = page.locator('.fixed.left-0').first();
    await sidebar.hover();
    await page.waitForTimeout(300);
    
    // Click More Apps button
    const moreAppsBtn = page.locator('button').filter({ hasText: 'More Apps' }).first();
    await moreAppsBtn.click();
    
    // Wait for apps list to expand
    await page.waitForTimeout(300);
    
    // Click Finance app
    const financeBtn = page.locator('button').filter({ hasText: 'Finance' }).first();
    await expect(financeBtn).toBeVisible();
    await financeBtn.click();
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('finance');
  });

  test('Sidebar badge counts are visible', async ({ page }) => {
    // Expand sidebar
    const sidebar = page.locator('.fixed.left-0').first();
    await sidebar.hover();
    await page.waitForTimeout(300);
    
    // Check for badge on Appointments (shows "12")
    const appointmentsBadge = page.locator('.fixed.left-0 button:has-text("Appointments") .badge, .fixed.left-0 button:has-text("Appointments") [class*="badge"]').first();
    await expect(appointmentsBadge).toBeVisible();
    await expect(appointmentsBadge).toHaveText('12');
    
    // Check for badge on Clients (shows "New")
    const clientsBadge = page.locator('.fixed.left-0 button:has-text("Clients") .badge, .fixed.left-0 button:has-text("Clients") [class*="badge"]').first();
    await expect(clientsBadge).toBeVisible();
    await expect(clientsBadge).toHaveText('New');
  });

  test('Active navigation item has visual indicator', async ({ page }) => {
    // Dashboard should be active initially
    const sidebar = page.locator('.fixed.left-0').first();
    await sidebar.hover();
    await page.waitForTimeout(300);
    
    // Check for active indicator on Dashboard
    const dashboardBtn = page.locator('button').filter({ hasText: 'Dashboard' }).first();
    const activeIndicator = dashboardBtn.locator('.absolute.left-0.bg-gradient-to-b');
    await expect(activeIndicator).toBeVisible();
    
    // Navigate to Appointments
    const appointmentsBtn = page.locator('button').filter({ hasText: 'Appointments' }).first();
    await appointmentsBtn.click();
    await page.waitForURL('**/appointments');
    
    // Now Appointments should have the active indicator
    await sidebar.hover();
    const appointmentsActiveIndicator = appointmentsBtn.locator('.absolute.left-0.bg-gradient-to-b');
    await expect(appointmentsActiveIndicator).toBeVisible();
  });

  test('Settings and Notifications buttons work', async ({ page }) => {
    // These are in the footer of the sidebar
    const sidebar = page.locator('.fixed.left-0').first();
    
    // Click Settings button (it's at the bottom)
    const settingsBtn = sidebar.locator('button').filter({ has: page.locator('[class*="Settings"]') }).first();
    await settingsBtn.click();
    
    await page.waitForLoadState('networkidle');
    expect(page.url()).toContain('settings');
  });
});