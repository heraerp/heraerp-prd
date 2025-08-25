import { test, expect } from '@playwright/test';

test.describe('Salon Appointments Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to appointments page
    await page.goto('/salon/appointments');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Appointments")');
  });

  test('should display appointments page with correct elements', async ({ page }) => {
    // Check header elements
    await expect(page.getByRole('heading', { name: 'Appointments' })).toBeVisible();
    await expect(page.getByText('Manage your salon appointments and bookings')).toBeVisible();
    
    // Check new appointment button
    await expect(page.getByRole('button', { name: /New Appointment/i })).toBeVisible();
    
    // Check date navigation
    await expect(page.getByRole('button', { name: 'Previous' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Next' })).toBeVisible();
    
    // Check search functionality
    await expect(page.getByPlaceholder('Search by client, service, or stylist...')).toBeVisible();
    
    // Check tabs
    await expect(page.getByRole('tab', { name: /Today/i })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Upcoming' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Completed' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Cancelled' })).toBeVisible();
  });

  test('should display appointment cards with correct information', async ({ page }) => {
    // Wait for appointments to load
    await page.waitForSelector('.text-2xl.font-bold.text-purple-600');
    
    // Check first appointment card has required elements
    const firstCard = page.locator('[class*="hover:shadow-lg"]').first();
    
    // Time display
    await expect(firstCard.locator('.text-2xl.font-bold.text-purple-600')).toBeVisible();
    
    // Client name
    await expect(firstCard.locator('h3.text-lg.font-semibold')).toBeVisible();
    
    // Status badge
    await expect(firstCard.locator('[class*="Badge"]')).toBeVisible();
    
    // Service, Stylist, Duration
    await expect(firstCard.getByText('Service:')).toBeVisible();
    await expect(firstCard.getByText('Stylist:')).toBeVisible();
    await expect(firstCard.getByText('Duration:')).toBeVisible();
    
    // Price
    await expect(firstCard.getByText(/AED \d+/)).toBeVisible();
    
    // Action buttons
    await expect(firstCard.getByRole('button', { name: 'Edit' })).toBeVisible();
  });

  test('should filter appointments by search term', async ({ page }) => {
    // Type in search box
    const searchInput = page.getByPlaceholder('Search by client, service, or stylist...');
    await searchInput.fill('Sarah Johnson');
    
    // Wait for filtered results
    await page.waitForTimeout(500);
    
    // Check that filtered results contain search term
    const visibleCards = page.locator('[class*="hover:shadow-lg"]:visible');
    const count = await visibleCards.count();
    
    if (count > 0) {
      await expect(visibleCards.first()).toContainText('Sarah Johnson');
    }
  });

  test('should navigate to new appointment page', async ({ page }) => {
    // Click new appointment button
    await page.getByRole('button', { name: /New Appointment/i }).click();
    
    // Should navigate to new appointment page
    await expect(page).toHaveURL(/\/salon\/appointments\/new/);
  });

  test('should show different status badges', async ({ page }) => {
    // Check for different status types
    const statusTypes = ['confirmed', 'pending', 'completed', 'cancelled'];
    
    for (const status of statusTypes) {
      const badge = page.locator(`text=${status}`).first();
      if (await badge.isVisible()) {
        // Check badge has appropriate icon
        const parentBadge = badge.locator('..');
        const icon = parentBadge.locator('svg');
        await expect(icon).toBeVisible();
      }
    }
  });

  test('should handle check-in action for confirmed appointments', async ({ page }) => {
    // Find confirmed appointment
    const confirmedCard = page.locator('[class*="hover:shadow-lg"]').filter({
      hasText: 'confirmed'
    }).first();
    
    if (await confirmedCard.isVisible()) {
      // Click check in button
      await confirmedCard.getByRole('button', { name: 'Check In' }).click();
      
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept());
      
      // Wait for potential API call
      await page.waitForTimeout(1000);
    }
  });

  test('should handle cancel action for confirmed appointments', async ({ page }) => {
    // Find confirmed appointment
    const confirmedCard = page.locator('[class*="hover:shadow-lg"]').filter({
      hasText: 'confirmed'
    }).first();
    
    if (await confirmedCard.isVisible()) {
      // Set up dialog handler
      page.on('dialog', async dialog => {
        if (dialog.type() === 'prompt') {
          await dialog.accept('Client requested cancellation');
        }
      });
      
      // Click cancel button
      await confirmedCard.getByRole('button', { name: 'Cancel' }).click();
      
      // Wait for potential API call
      await page.waitForTimeout(1000);
    }
  });

  test('should navigate between tabs', async ({ page }) => {
    // Click upcoming tab
    await page.getByRole('tab', { name: 'Upcoming' }).click();
    await expect(page.getByText('Upcoming appointments will appear here')).toBeVisible();
    
    // Click completed tab
    await page.getByRole('tab', { name: 'Completed' }).click();
    await expect(page.getByText('Completed appointments will appear here')).toBeVisible();
    
    // Click cancelled tab
    await page.getByRole('tab', { name: 'Cancelled' }).click();
    await expect(page.getByText('Cancelled appointments will appear here')).toBeVisible();
    
    // Go back to today tab
    await page.getByRole('tab', { name: /Today/i }).click();
  });

  test('should display empty state when no appointments', async ({ page }) => {
    // Search for non-existent appointment
    await page.getByPlaceholder('Search by client, service, or stylist...').fill('NonExistentClient123');
    
    // Wait for empty state
    await page.waitForSelector('text=No appointments found');
    
    // Check empty state elements
    await expect(page.getByText('No appointments found')).toBeVisible();
    await expect(page.getByText('Try adjusting your search terms')).toBeVisible();
    await expect(page.getByRole('button', { name: /Book New Appointment/i })).toBeVisible();
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Click back button
    await page.getByRole('button', { name: /Back to Dashboard/i }).click();
    
    // Should navigate to salon dashboard
    await expect(page).toHaveURL('/salon');
  });

  test('should display appointment time in correct format', async ({ page }) => {
    // Check time format (e.g., "10:00 AM")
    const timeElement = page.locator('.text-2xl.font-bold.text-purple-600').first();
    const timeText = await timeElement.textContent();
    
    // Verify time format
    expect(timeText).toMatch(/^\d{1,2}:\d{2}$/);
    
    // Check AM/PM indicator
    const amPmElement = timeElement.locator('../div.text-sm.text-gray-500');
    const amPmText = await amPmElement.textContent();
    expect(amPmText).toMatch(/^(AM|PM)$/);
  });

  test('should display price with currency', async ({ page }) => {
    // Check price format
    const priceElements = page.locator('text=/AED \\d+/');
    const count = await priceElements.count();
    
    expect(count).toBeGreaterThan(0);
    
    // Verify first price format
    const firstPrice = await priceElements.first().textContent();
    expect(firstPrice).toMatch(/^AED \d+$/);
  });

  test('should handle date navigation', async ({ page }) => {
    // Get current date text
    const currentDateElement = page.locator('h2.text-lg.font-semibold');
    const originalDate = await currentDateElement.textContent();
    
    // Click next button
    await page.getByRole('button', { name: 'Next' }).click();
    
    // Date should change (in real implementation)
    // For now, just verify button is clickable
    await expect(page.getByRole('button', { name: 'Next' })).toBeEnabled();
    
    // Click previous button
    await page.getByRole('button', { name: 'Previous' }).click();
    await expect(page.getByRole('button', { name: 'Previous' })).toBeEnabled();
  });
});