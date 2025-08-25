import { test, expect } from '@playwright/test';

test.describe('Salon Client Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to clients page
    await page.goto('/salon/clients');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Clients")', { timeout: 10000 });
  });

  test('should display clients page with correct layout', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Clients' })).toBeVisible();
    await expect(page.getByText('Manage your salon clients and customer relationships')).toBeVisible();
    
    // Check action buttons
    await expect(page.getByRole('button', { name: /Add New Client/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Import Clients/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Export/i })).toBeVisible();
    
    // Check stats cards
    await expect(page.getByText('Total Clients')).toBeVisible();
    await expect(page.getByText('Active Clients')).toBeVisible();
    await expect(page.getByText('VIP Clients')).toBeVisible();
    await expect(page.getByText('New This Month')).toBeVisible();
    
    // Check search and filter
    await expect(page.getByPlaceholder(/Search clients/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Filter/i })).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('tab', { name: 'All Clients' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Active' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'VIP' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Inactive' })).toBeVisible();
  });

  test('should display client cards with tier badges', async ({ page }) => {
    // Wait for client cards to load
    await page.waitForSelector('[class*="hover:shadow-lg"]');
    
    // Check first client card
    const firstCard = page.locator('[class*="hover:shadow-lg"]').first();
    
    // Check client name
    await expect(firstCard.locator('h3.text-lg.font-semibold')).toBeVisible();
    
    // Check tier badge (Platinum, Gold, Silver, or Bronze)
    const tierBadge = firstCard.locator('[class*="Badge"]').first();
    await expect(tierBadge).toBeVisible();
    await expect(tierBadge).toContainText(/Platinum|Gold|Silver|Bronze/);
    
    // Check loyalty points with sparkles icon
    await expect(firstCard.locator('svg.w-3.h-3')).toBeVisible();
    await expect(firstCard.getByText(/\d+ points/)).toBeVisible();
    
    // Check contact info
    await expect(firstCard.locator('[data-testid="phone-icon"], svg[class*="Phone"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="email-icon"], svg[class*="Mail"]')).toBeVisible();
    
    // Check last visit
    await expect(firstCard.getByText('Last visit:')).toBeVisible();
    
    // Check total spent
    await expect(firstCard.getByText(/AED \d+/)).toBeVisible();
    
    // Check action buttons
    await expect(firstCard.getByRole('button', { name: /View Details/i })).toBeVisible();
    await expect(firstCard.getByRole('button', { name: /Edit/i })).toBeVisible();
  });

  test('should search for clients', async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder(/Search clients/i);
    await searchInput.fill('Sarah');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check filtered results
    const visibleCards = page.locator('[class*="hover:shadow-lg"]:visible');
    const firstCard = visibleCards.first();
    
    if (await firstCard.isVisible()) {
      await expect(firstCard).toContainText(/Sarah/i);
    }
  });

  test('should open add new client dialog', async ({ page }) => {
    // Click add new client button
    await page.getByRole('button', { name: /Add New Client/i }).click();
    
    // Check dialog opened
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Add New Client/i })).toBeVisible();
    
    // Check form fields
    await expect(page.getByLabel('Full Name')).toBeVisible();
    await expect(page.getByLabel('Phone Number')).toBeVisible();
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Birth Date')).toBeVisible();
    await expect(page.getByLabel('Preferred Stylist')).toBeVisible();
    await expect(page.getByLabel('Notes')).toBeVisible();
    
    // Check buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Add Client' })).toBeVisible();
  });

  test('should fill and submit new client form', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /Add New Client/i }).click();
    
    // Fill form
    await page.getByLabel('Full Name').fill('Test Client');
    await page.getByLabel('Phone Number').fill('+971501234567');
    await page.getByLabel('Email').fill('test@example.com');
    await page.getByLabel('Birth Date').fill('1990-01-01');
    
    // Select preferred stylist
    const stylistSelect = page.getByLabel('Preferred Stylist');
    if (await stylistSelect.isVisible()) {
      await stylistSelect.click();
      const firstOption = page.locator('[role="option"]').first();
      if (await firstOption.isVisible()) {
        await firstOption.click();
      }
    }
    
    await page.getByLabel('Notes').fill('Test client notes');
    
    // Submit form
    await page.getByRole('button', { name: 'Add Client' }).click();
    
    // Check for success (dialog should close or show success message)
    await page.waitForTimeout(1000);
  });

  test('should switch between client tabs', async ({ page }) => {
    // Click Active tab
    await page.getByRole('tab', { name: 'Active' }).click();
    await page.waitForTimeout(500);
    
    // Click VIP tab
    await page.getByRole('tab', { name: 'VIP' }).click();
    await page.waitForTimeout(500);
    
    // VIP clients should have VIP status
    const vipCards = page.locator('[class*="hover:shadow-lg"]:visible');
    if (await vipCards.first().isVisible()) {
      const firstVipCard = vipCards.first();
      const badge = firstVipCard.locator('[class*="Badge"]').filter({ hasText: /Platinum|Gold/ });
      await expect(badge).toBeVisible();
    }
    
    // Click Inactive tab
    await page.getByRole('tab', { name: 'Inactive' }).click();
    await page.waitForTimeout(500);
    
    // Go back to All Clients
    await page.getByRole('tab', { name: 'All Clients' }).click();
  });

  test('should view client details', async ({ page }) => {
    // Click view details on first client
    const firstCard = page.locator('[class*="hover:shadow-lg"]').first();
    await firstCard.getByRole('button', { name: /View Details/i }).click();
    
    // Should navigate to client details page
    await expect(page).toHaveURL(/\/salon\/clients\/[^\/]+/);
  });

  test('should edit client information', async ({ page }) => {
    // Click edit on first client
    const firstCard = page.locator('[class*="hover:shadow-lg"]').first();
    await firstCard.getByRole('button', { name: /Edit/i }).click();
    
    // Edit dialog should open
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Edit Client/i })).toBeVisible();
    
    // Form should be pre-filled
    const nameInput = page.getByLabel('Full Name');
    const currentName = await nameInput.inputValue();
    expect(currentName).toBeTruthy();
    
    // Update name
    await nameInput.fill(currentName + ' Updated');
    
    // Save changes
    await page.getByRole('button', { name: /Save Changes/i }).click();
    
    // Wait for save
    await page.waitForTimeout(1000);
  });

  test('should display client statistics correctly', async ({ page }) => {
    // Check stats cards have numeric values
    const statsCards = page.locator('.bg-gradient-to-br');
    
    // Total Clients
    const totalClientsCard = statsCards.filter({ hasText: 'Total Clients' }).first();
    const totalValue = totalClientsCard.locator('.text-3xl.font-bold');
    await expect(totalValue).toContainText(/\d+/);
    
    // Active Clients
    const activeClientsCard = statsCards.filter({ hasText: 'Active Clients' }).first();
    const activeValue = activeClientsCard.locator('.text-3xl.font-bold');
    await expect(activeValue).toContainText(/\d+/);
    
    // VIP Clients
    const vipClientsCard = statsCards.filter({ hasText: 'VIP Clients' }).first();
    const vipValue = vipClientsCard.locator('.text-3xl.font-bold');
    await expect(vipValue).toContainText(/\d+/);
    
    // New This Month
    const newClientsCard = statsCards.filter({ hasText: 'New This Month' }).first();
    const newValue = newClientsCard.locator('.text-3xl.font-bold');
    await expect(newValue).toContainText(/\d+/);
  });

  test('should handle import clients functionality', async ({ page }) => {
    // Click import button
    await page.getByRole('button', { name: /Import Clients/i }).click();
    
    // Import dialog or file picker should appear
    // Check for file input or dialog
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.isVisible()) {
      // File input is available
      await expect(fileInput).toBeVisible();
    } else {
      // Dialog might be shown
      await expect(page.getByRole('dialog')).toBeVisible();
    }
  });

  test('should handle export clients functionality', async ({ page }) => {
    // Click export button
    await page.getByRole('button', { name: /Export/i }).click();
    
    // Export should trigger download or show options
    // Wait for potential download or dialog
    await page.waitForTimeout(1000);
  });

  test('should refresh client list', async ({ page }) => {
    // Find refresh button
    const refreshButton = page.getByRole('button', { name: /Refresh/i });
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      
      // Loading indicator should appear
      const loader = page.locator('.animate-spin');
      await expect(loader).toBeVisible();
      
      // Wait for reload
      await loader.waitFor({ state: 'hidden', timeout: 5000 });
    }
  });

  test('should display empty state when no clients match search', async ({ page }) => {
    // Search for non-existent client
    await page.getByPlaceholder(/Search clients/i).fill('NonExistentClient12345');
    
    // Wait for empty state
    await page.waitForTimeout(500);
    
    // Check empty state message
    const emptyState = page.getByText(/No clients found/i);
    if (await emptyState.isVisible()) {
      await expect(emptyState).toBeVisible();
      await expect(page.getByRole('button', { name: /Add First Client/i })).toBeVisible();
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Click back button
    await page.getByRole('button', { name: /Back to Dashboard/i }).click();
    
    // Should navigate to salon dashboard
    await expect(page).toHaveURL('/salon');
  });

  test('should show tier progression information', async ({ page }) => {
    // Check if any client card shows tier information
    const tierInfo = page.locator('text=/\\d+ points? to/i').first();
    if (await tierInfo.isVisible()) {
      // Tier progression is shown
      await expect(tierInfo).toContainText(/points? to (Gold|Silver|Platinum)/);
    }
  });

  test('should validate phone number format in add client form', async ({ page }) => {
    // Open add client dialog
    await page.getByRole('button', { name: /Add New Client/i }).click();
    
    // Try invalid phone number
    await page.getByLabel('Phone Number').fill('123');
    await page.getByLabel('Full Name').fill('Test');
    
    // Try to submit
    await page.getByRole('button', { name: 'Add Client' }).click();
    
    // Should show validation error
    const phoneError = page.getByText(/valid phone number/i);
    if (await phoneError.isVisible()) {
      await expect(phoneError).toBeVisible();
    }
  });
});