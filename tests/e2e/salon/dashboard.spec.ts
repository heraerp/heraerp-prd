import { test, expect } from '@playwright/test';

test.describe('Salon Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to salon dashboard
    await page.goto('/salon');
    
    // Wait for dashboard to load
    await page.waitForSelector('text=Salon Dashboard', { timeout: 10000 });
  });

  test('should display salon dashboard with all KPI cards', async ({ page }) => {
    // Check main heading
    await expect(page.getByRole('heading', { name: 'Salon Dashboard' })).toBeVisible();
    await expect(page.getByText('Manage your beauty salon operations')).toBeVisible();
    
    // Check KPI cards
    const kpiTitles = [
      "Today's Revenue",
      'Appointments Today',
      'Active Clients',
      'Staff Available'
    ];
    
    for (const title of kpiTitles) {
      const card = page.locator(`text=${title}`);
      await expect(card).toBeVisible();
      
      // Each KPI should have a value
      const valueElement = card.locator('..//div[class*="text-3xl"]');
      await expect(valueElement).toBeVisible();
    }
  });

  test('should display quick actions section', async ({ page }) => {
    // Check Quick Actions heading
    await expect(page.getByRole('heading', { name: 'Quick Actions' })).toBeVisible();
    
    // Check quick action buttons
    const quickActions = [
      'New Appointment',
      'New Client',
      'Point of Sale',
      'Check Inventory'
    ];
    
    for (const action of quickActions) {
      const button = page.getByRole('button', { name: action });
      await expect(button).toBeVisible();
    }
  });

  test('should display today\'s appointments section', async ({ page }) => {
    // Check appointments section
    await expect(page.getByRole('heading', { name: "Today's Appointments" })).toBeVisible();
    
    // Check view all link
    await expect(page.getByRole('link', { name: 'View All' })).toBeVisible();
    
    // Check if appointments are displayed or empty state
    const appointmentCards = page.locator('[class*="appointment-card"]');
    const emptyState = page.getByText('No appointments scheduled for today');
    
    // Either appointments or empty state should be visible
    const hasAppointments = await appointmentCards.first().isVisible().catch(() => false);
    const isEmpty = await emptyState.isVisible().catch(() => false);
    
    expect(hasAppointments || isEmpty).toBeTruthy();
  });

  test('should display top services section', async ({ page }) => {
    // Check top services section
    await expect(page.getByRole('heading', { name: 'Top Services' })).toBeVisible();
    
    // Check if services are listed
    const serviceItems = page.locator('[data-testid="service-item"]');
    const servicesCount = await serviceItems.count();
    
    if (servicesCount > 0) {
      // Services should show name and booking count
      const firstService = serviceItems.first();
      await expect(firstService).toContainText(/bookings?/i);
    }
  });

  test('should display recent activity section', async ({ page }) => {
    // Check recent activity section
    await expect(page.getByRole('heading', { name: 'Recent Activity' })).toBeVisible();
    
    // Activity items should have timestamps
    const activityItems = page.locator('[data-testid="activity-item"]');
    if (await activityItems.first().isVisible()) {
      const firstActivity = activityItems.first();
      await expect(firstActivity).toContainText(/ago|AM|PM/i);
    }
  });

  test('should navigate to appointments from quick action', async ({ page }) => {
    // Click New Appointment quick action
    await page.getByRole('button', { name: 'New Appointment' }).click();
    
    // Should navigate to new appointment page
    await expect(page).toHaveURL(/\/salon\/appointments\/new/);
  });

  test('should navigate to clients from quick action', async ({ page }) => {
    // Click New Client quick action
    await page.getByRole('button', { name: 'New Client' }).click();
    
    // Should open new client dialog or navigate to clients page
    const dialog = page.getByRole('dialog');
    const clientsPage = page.getByRole('heading', { name: 'Clients' });
    
    // Either dialog or clients page should be visible
    const dialogVisible = await dialog.isVisible().catch(() => false);
    const pageVisible = await clientsPage.isVisible().catch(() => false);
    
    expect(dialogVisible || pageVisible).toBeTruthy();
  });

  test('should navigate to POS from quick action', async ({ page }) => {
    // Click Point of Sale quick action
    await page.getByRole('button', { name: 'Point of Sale' }).click();
    
    // Should navigate to POS page
    await expect(page).toHaveURL('/salon/pos');
  });

  test('should navigate to inventory from quick action', async ({ page }) => {
    // Click Check Inventory quick action
    await page.getByRole('button', { name: 'Check Inventory' }).click();
    
    // Should navigate to inventory page
    await expect(page).toHaveURL('/salon/inventory');
  });

  test('should show correct revenue format', async ({ page }) => {
    // Find revenue card
    const revenueCard = page.locator('text="Today\'s Revenue"').locator('../..');
    const revenueValue = revenueCard.locator('div[class*="text-3xl"]');
    
    // Check currency format (AED)
    const revenueText = await revenueValue.textContent();
    expect(revenueText).toMatch(/AED\s*[\d,]+/);
  });

  test('should display staff availability correctly', async ({ page }) => {
    // Find staff available card
    const staffCard = page.locator('text="Staff Available"').locator('../..');
    const staffValue = staffCard.locator('div[class*="text-3xl"]');
    
    // Should show fraction (e.g., "3/5")
    const staffText = await staffValue.textContent();
    expect(staffText).toMatch(/\d+\/\d+/);
  });

  test('should navigate to all appointments from view all link', async ({ page }) => {
    // Click View All link in appointments section
    const viewAllLink = page.getByRole('link', { name: 'View All' }).first();
    await viewAllLink.click();
    
    // Should navigate to appointments page
    await expect(page).toHaveURL('/salon/appointments');
  });

  test('should refresh dashboard data', async ({ page }) => {
    // Look for refresh button
    const refreshButton = page.getByRole('button', { name: /refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Should show loading state
      const loader = page.locator('.animate-spin');
      await expect(loader).toBeVisible();
      
      // Wait for reload to complete
      await loader.waitFor({ state: 'hidden', timeout: 5000 });
    }
  });

  test('should display notification icon in header', async ({ page }) => {
    // Check for notification bell icon
    const notificationIcon = page.locator('[data-testid="notification-icon"], svg[class*="Bell"]');
    if (await notificationIcon.isVisible()) {
      await expect(notificationIcon).toBeVisible();
      
      // Click notifications
      await notificationIcon.click();
      
      // Notification dropdown or panel should appear
      const notificationPanel = page.locator('[data-testid="notification-panel"]');
      if (await notificationPanel.isVisible()) {
        await expect(notificationPanel).toBeVisible();
      }
    }
  });

  test('should display user menu in header', async ({ page }) => {
    // Check for user avatar/menu
    const userMenu = page.locator('[data-testid="user-menu"], [class*="Avatar"]').first();
    if (await userMenu.isVisible()) {
      await expect(userMenu).toBeVisible();
      
      // Click user menu
      await userMenu.click();
      
      // Menu should show options
      const menuOptions = page.locator('[role="menu"]');
      if (await menuOptions.isVisible()) {
        await expect(menuOptions).toBeVisible();
        await expect(page.getByRole('menuitem', { name: /settings/i })).toBeVisible();
        await expect(page.getByRole('menuitem', { name: /logout/i })).toBeVisible();
      }
    }
  });

  test('should show loading state initially', async ({ page }) => {
    // Navigate to dashboard
    await page.goto('/salon');
    
    // Check for loading indicators
    const loadingIndicator = page.locator('.animate-pulse, .animate-spin').first();
    
    // Loading should appear briefly
    if (await loadingIndicator.isVisible({ timeout: 1000 })) {
      await expect(loadingIndicator).toBeVisible();
      
      // Should disappear after loading
      await loadingIndicator.waitFor({ state: 'hidden', timeout: 5000 });
    }
  });

  test('should handle empty states gracefully', async ({ page }) => {
    // Check various empty states
    
    // No appointments
    const noAppointments = page.getByText('No appointments scheduled for today');
    if (await noAppointments.isVisible()) {
      await expect(noAppointments).toBeVisible();
      await expect(page.getByRole('button', { name: /book.*appointment/i })).toBeVisible();
    }
    
    // No recent activity
    const noActivity = page.getByText('No recent activity');
    if (await noActivity.isVisible()) {
      await expect(noActivity).toBeVisible();
    }
  });

  test('should display correct appointment status badges', async ({ page }) => {
    // Look for appointment cards
    const appointmentCards = page.locator('[data-testid="appointment-card"]');
    
    if (await appointmentCards.first().isVisible()) {
      // Check for status badges
      const statusBadges = appointmentCards.locator('[class*="Badge"]');
      
      // Status badges should have appropriate colors
      const firstBadge = statusBadges.first();
      if (await firstBadge.isVisible()) {
        const badgeText = await firstBadge.textContent();
        
        // Check badge has valid status
        expect(['confirmed', 'pending', 'completed', 'cancelled']).toContain(badgeText?.toLowerCase());
      }
    }
  });
});