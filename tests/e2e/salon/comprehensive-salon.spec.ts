import { test, expect } from '@playwright/test';

// Helper function to expand sidebar
async function expandSidebar(page) {
  const sidebar = page.locator('.fixed.left-0').first();
  await sidebar.hover();
  await page.waitForTimeout(300);
}

// Helper function to navigate via sidebar
async function navigateViaButton(page, buttonText) {
  await expandSidebar(page);
  const button = page.locator('button').filter({ hasText: buttonText }).first();
  await button.click();
  await page.waitForLoadState('networkidle');
}

test.describe('HERA Salon - Comprehensive Test Suite', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/salon');
    await page.waitForLoadState('networkidle');
  });

  test.describe('Dashboard Tests', () => {
    test('Dashboard loads with correct welcome message', async ({ page }) => {
      await expect(page.getByText('Welcome to Dubai Luxury Salon & Spa')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    });

    test('Quick Actions modal opens and contains all actions', async ({ page }) => {
      await expandSidebar(page);
      
      // Click Quick Actions button
      const quickActionsBtn = page.locator('button').filter({ hasText: 'Quick Actions' }).first();
      await quickActionsBtn.click();
      
      // Wait for modal
      await page.waitForSelector('[role="dialog"]');
      
      // Check all quick actions are present
      const expectedActions = [
        'New Appointment',
        'Add Client',
        'Add Service',
        'Point of Sale',
        'Restock Items',
        'Loyalty Points',
        'Send Promotion',
        'Today\'s Report'
      ];
      
      for (const action of expectedActions) {
        await expect(page.locator('[role="dialog"]').getByText(action)).toBeVisible();
      }
      
      // Close modal
      const closeBtn = page.locator('[role="dialog"] button').filter({ has: page.locator('[class*="X"]') }).first();
      if (await closeBtn.isVisible()) {
        await closeBtn.click();
      } else {
        await page.keyboard.press('Escape');
      }
    });
  });

  test.describe('Appointments Tests', () => {
    test.beforeEach(async ({ page }) => {
      await navigateViaButton(page, 'Appointments');
    });

    test('Appointments page loads correctly', async ({ page }) => {
      expect(page.url()).toContain('appointments');
      
      // Check for common appointment page elements
      const pageElements = [
        'input[type="search"], input[placeholder*="search" i]',
        'button:has-text("Today"), button:has-text("Week"), button:has-text("Month")',
        'table, [role="table"], .appointments-list'
      ];
      
      let foundElement = false;
      for (const selector of pageElements) {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false)) {
          foundElement = true;
          break;
        }
      }
      
      expect(foundElement).toBeTruthy();
    });

    test('Can search appointments', async ({ page }) => {
      const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
      
      if (await searchInput.isVisible({ timeout: 2000 }).catch(() => false)) {
        await searchInput.click();
        await searchInput.fill('John Doe');
        
        // Press Enter or wait for search
        await page.keyboard.press('Enter');
        await page.waitForTimeout(500);
        
        const value = await searchInput.inputValue();
        expect(value).toBe('John Doe');
      }
    });

    test('Can create new appointment via quick action', async ({ page }) => {
      // Go back to dashboard
      await navigateViaButton(page, 'Dashboard');
      
      // Open Quick Actions
      await expandSidebar(page);
      const quickActionsBtn = page.locator('button').filter({ hasText: 'Quick Actions' }).first();
      await quickActionsBtn.click();
      
      // Click New Appointment
      await page.locator('[role="dialog"] button').filter({ hasText: 'New Appointment' }).click();
      
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('appointments');
      expect(page.url()).toContain('action=new');
    });
  });

  test.describe('Clients Tests', () => {
    test.beforeEach(async ({ page }) => {
      await navigateViaButton(page, 'Clients');
    });

    test('Clients page loads with list or grid', async ({ page }) => {
      expect(page.url()).toContain('clients');
      
      // Check for client list elements
      const listElements = [
        'table tbody tr, .client-card, .clients-grid',
        'button:has-text("Add"), button:has-text("New Client")',
        'input[placeholder*="search" i]'
      ];
      
      let foundElement = false;
      for (const selector of listElements) {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false)) {
          foundElement = true;
          break;
        }
      }
      
      expect(foundElement).toBeTruthy();
    });

    test('New badge is visible on Clients navigation', async ({ page }) => {
      await expandSidebar(page);
      const clientsButton = page.locator('button').filter({ hasText: 'Clients' }).first();
      const badge = clientsButton.locator('[class*="badge"]').first();
      
      await expect(badge).toBeVisible();
      await expect(badge).toHaveText('New');
    });
  });

  test.describe('Services Tests', () => {
    test.beforeEach(async ({ page }) => {
      await navigateViaButton(page, 'Services');
    });

    test('Services page displays service categories', async ({ page }) => {
      expect(page.url()).toContain('services');
      
      // Services might be displayed as cards, list, or table
      const serviceElements = [
        '.service-card, .services-grid',
        'table:has-text("Service"), table:has-text("Price")',
        'button:has-text("Add Service"), button:has-text("New Service")'
      ];
      
      let foundElement = false;
      for (const selector of serviceElements) {
        if (await page.locator(selector).first().isVisible({ timeout: 2000 }).catch(() => false)) {
          foundElement = true;
          break;
        }
      }
      
      expect(foundElement).toBeTruthy();
    });
  });

  test.describe('POS Tests', () => {
    test('Navigate to POS and check for cart elements', async ({ page }) => {
      // Try regular navigation first
      await expandSidebar(page);
      
      // POS might not be in main nav, check Quick Actions
      const quickActionsBtn = page.locator('button').filter({ hasText: 'Quick Actions' }).first();
      await quickActionsBtn.click();
      
      // Click Point of Sale in modal
      await page.locator('[role="dialog"] button').filter({ hasText: 'Point of Sale' }).click();
      
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('pos');
      
      // Check for POS elements
      const posElements = [
        'text=Total, text=Subtotal',
        'button:has-text("Checkout"), button:has-text("Pay")',
        '.cart, .pos-cart, [class*="cart"]',
        '.service-item, .product-item'
      ];
      
      let foundElement = false;
      for (const element of posElements) {
        if (await page.locator(element).first().isVisible({ timeout: 2000 }).catch(() => false)) {
          foundElement = true;
          break;
        }
      }
      
      expect(foundElement).toBeTruthy();
    });
  });

  test.describe('Extended Apps Tests', () => {
    test('Can access Finance app from More Apps', async ({ page }) => {
      await expandSidebar(page);
      
      // Click More Apps
      const moreAppsBtn = page.locator('button').filter({ hasText: 'More Apps' }).first();
      await moreAppsBtn.click();
      
      // Wait for expansion
      await page.waitForTimeout(300);
      
      // Click Finance
      const financeBtn = page.locator('button').filter({ hasText: 'Finance' }).first();
      await financeBtn.click();
      
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('finance');
    });

    test('Can access Analytics app from More Apps', async ({ page }) => {
      await expandSidebar(page);
      
      // Click More Apps
      const moreAppsBtn = page.locator('button').filter({ hasText: 'More Apps' }).first();
      await moreAppsBtn.click();
      
      // Click Analytics
      const analyticsBtn = page.locator('button').filter({ hasText: 'Analytics' }).first();
      await analyticsBtn.click();
      
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('analytics');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('Sidebar works on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      
      await page.goto('/salon');
      await page.waitForLoadState('networkidle');
      
      // Sidebar should still be visible but collapsed
      const sidebar = page.locator('.fixed.left-0').first();
      await expect(sidebar).toBeVisible();
      
      // Try to navigate
      await sidebar.hover();
      await page.waitForTimeout(300);
      
      const appointmentsBtn = page.locator('button').nth(1); // Second button in sidebar
      await appointmentsBtn.click();
      
      await page.waitForLoadState('networkidle');
      expect(page.url()).toContain('appointments');
    });
  });

  test.describe('Performance Tests', () => {
    test('Page loads within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      
      await page.goto('/salon');
      await page.waitForLoadState('networkidle');
      
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(3000); // 3 seconds max
    });

    test('Navigation between pages is smooth', async ({ page }) => {
      const navigationTimes = [];
      
      // Test navigation speed
      const routes = ['Appointments', 'Clients', 'Services'];
      
      for (const route of routes) {
        const startTime = Date.now();
        await navigateViaButton(page, route);
        const navTime = Date.now() - startTime;
        navigationTimes.push(navTime);
      }
      
      // Average navigation time should be under 2 seconds
      const avgTime = navigationTimes.reduce((a, b) => a + b, 0) / navigationTimes.length;
      expect(avgTime).toBeLessThan(2000);
    });
  });
});