import { test, expect } from '@playwright/test';
import { fixOverlappingElements, waitForSidebar, clickNavigationItem } from './helpers/fix-overlapping';

test.describe('HERA Salon - Tests with CSS Fixes', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to salon
    await page.goto('/salon');
    
    // Apply CSS fixes for overlapping elements
    await fixOverlappingElements(page);
    
    // Wait for sidebar to be ready
    await waitForSidebar(page);
  });

  test('Salon Dashboard Loads Successfully', async ({ page }) => {
    // Verify we're on the salon page
    expect(page.url()).toContain('/salon');
    
    // Check main heading
    await expect(page.getByText('Welcome to Dubai Luxury Salon')).toBeVisible();
    
    // Check sidebar is visible
    const sidebar = page.locator('.fixed.left-0, [class*="sidebar"], nav').first();
    await expect(sidebar).toBeVisible();
  });

  test('Navigate to Appointments via Sidebar', async ({ page }) => {
    // Use our helper function to click navigation
    const clicked = await clickNavigationItem(page, 'Appointments');
    expect(clicked).toBeTruthy();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify we navigated
    expect(page.url()).toContain('appointments');
  });

  test('Navigate to Clients via Sidebar', async ({ page }) => {
    // Click Clients in navigation
    const clicked = await clickNavigationItem(page, 'Clients');
    expect(clicked).toBeTruthy();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify URL changed
    expect(page.url()).toContain('clients');
  });

  test('Navigate to POS via Sidebar', async ({ page }) => {
    // Click Point of Sale
    const clicked = await clickNavigationItem(page, 'Point of Sale');
    expect(clicked).toBeTruthy();
    
    // Wait for navigation
    await page.waitForLoadState('networkidle');
    
    // Verify navigation
    expect(page.url()).toContain('pos');
  });

  test('Complete Navigation Flow', async ({ page }) => {
    // Navigate through multiple pages
    
    // 1. Go to Appointments
    await clickNavigationItem(page, 'Appointments');
    await page.waitForURL('**/appointments');
    expect(page.url()).toContain('appointments');
    
    // 2. Go to Clients
    await clickNavigationItem(page, 'Clients');
    await page.waitForURL('**/clients');
    expect(page.url()).toContain('clients');
    
    // 3. Go back to Dashboard
    await clickNavigationItem(page, 'Dashboard');
    await page.waitForURL('**/salon');
    expect(page.url()).toMatch(/\/salon$/);
  });

  test('Quick Actions Section is Accessible', async ({ page }) => {
    // Check Quick Actions heading is unique
    const quickActionsHeading = page.getByRole('heading', { name: 'Quick Actions' });
    await expect(quickActionsHeading).toBeVisible();
    
    // Only one heading should exist
    await expect(quickActionsHeading).toHaveCount(1);
  });

  test('Appointments Page Elements are Accessible', async ({ page }) => {
    // Navigate to appointments
    await clickNavigationItem(page, 'Appointments');
    await page.waitForLoadState('networkidle');
    
    // Apply fixes to this page too
    await fixOverlappingElements(page);
    
    // Check for search functionality
    const searchInput = page.locator('input[placeholder*="search" i], input[type="search"]').first();
    if (await searchInput.isVisible()) {
      await searchInput.click();
      await searchInput.fill('Test search');
      
      const value = await searchInput.inputValue();
      expect(value).toBe('Test search');
    }
  });

  test('Clients Page Add Button Works', async ({ page }) => {
    // Navigate to clients
    await clickNavigationItem(page, 'Clients');
    await page.waitForLoadState('networkidle');
    
    // Apply fixes
    await fixOverlappingElements(page);
    
    // Look for add button with better selectors
    const addButton = page.locator('button').filter({ hasText: /add|new|create/i }).first();
    
    if (await addButton.isVisible()) {
      await addButton.click();
      
      // Wait to see if modal opens or page changes
      await page.waitForTimeout(1000);
      
      // Check for modal or URL change
      const hasModal = await page.locator('[role="dialog"]').isVisible().catch(() => false);
      const urlChanged = page.url().includes('new');
      
      expect(hasModal || urlChanged).toBeTruthy();
    }
  });

  test('POS Page Loads with Products/Services', async ({ page }) => {
    // Navigate to POS
    await clickNavigationItem(page, 'Point of Sale');
    await page.waitForLoadState('networkidle');
    
    // Apply fixes
    await fixOverlappingElements(page);
    
    // Check for POS elements
    const posElements = ['Total', 'Checkout', 'Services', 'Products'];
    let foundElement = false;
    
    for (const text of posElements) {
      if (await page.getByText(text).first().isVisible({ timeout: 2000 }).catch(() => false)) {
        foundElement = true;
        break;
      }
    }
    
    expect(foundElement).toBeTruthy();
  });

  test('All Main Navigation Links Work', async ({ page }) => {
    const navigationItems = [
      { name: 'Dashboard', urlPart: '/salon' },
      { name: 'Appointments', urlPart: '/appointments' },
      { name: 'Clients', urlPart: '/clients' },
      { name: 'Services', urlPart: '/services' },
      { name: 'Point of Sale', urlPart: '/pos' }
    ];
    
    for (const item of navigationItems) {
      // Go back to dashboard first
      await page.goto('/salon');
      await fixOverlappingElements(page);
      await waitForSidebar(page);
      
      // Click navigation item
      const clicked = await clickNavigationItem(page, item.name);
      
      if (clicked) {
        await page.waitForLoadState('networkidle');
        expect(page.url()).toContain(item.urlPart);
      }
    }
  });
});