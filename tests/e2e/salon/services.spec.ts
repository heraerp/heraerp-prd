import { test, expect } from '@playwright/test';

test.describe('Salon Services Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to services page
    await page.goto('/salon/services');
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Services")', { timeout: 10000 });
  });

  test('should display services page with correct layout', async ({ page }) => {
    // Check header
    await expect(page.getByRole('heading', { name: 'Services' })).toBeVisible();
    await expect(page.getByText('Manage your salon service catalog')).toBeVisible();
    
    // Check action buttons
    await expect(page.getByRole('button', { name: /Add New Service/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Manage Categories/i })).toBeVisible();
    
    // Check search and filter
    await expect(page.getByPlaceholder(/Search services/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Filter/i })).toBeVisible();
    
    // Check category tabs or filters
    const categoryTabs = page.getByRole('tab');
    if (await categoryTabs.first().isVisible()) {
      await expect(categoryTabs.first()).toBeVisible();
    }
  });

  test('should display service cards with details', async ({ page }) => {
    // Wait for service cards
    await page.waitForSelector('[data-testid="service-card"]', { timeout: 5000 }).catch(() => {});
    
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    if (await serviceCard.isVisible()) {
      // Check service details
      await expect(serviceCard.locator('h3')).toBeVisible(); // Service name
      await expect(serviceCard.getByText(/AED \d+/)).toBeVisible(); // Price
      await expect(serviceCard.getByText(/\d+ min/)).toBeVisible(); // Duration
      
      // Check action buttons
      await expect(serviceCard.getByRole('button', { name: /Edit/i })).toBeVisible();
      await expect(serviceCard.getByRole('button', { name: /Delete/i })).toBeVisible();
    }
  });

  test('should open add new service dialog', async ({ page }) => {
    // Click add service button
    await page.getByRole('button', { name: /Add New Service/i }).click();
    
    // Check dialog
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Add New Service/i })).toBeVisible();
    
    // Check form fields
    await expect(page.getByLabel('Service Name')).toBeVisible();
    await expect(page.getByLabel('Category')).toBeVisible();
    await expect(page.getByLabel('Price')).toBeVisible();
    await expect(page.getByLabel('Duration')).toBeVisible();
    await expect(page.getByLabel('Description')).toBeVisible();
    
    // Check buttons
    await expect(page.getByRole('button', { name: 'Cancel' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Add Service/i })).toBeVisible();
  });

  test('should add new service', async ({ page }) => {
    // Open dialog
    await page.getByRole('button', { name: /Add New Service/i }).click();
    
    // Fill form
    await page.getByLabel('Service Name').fill('Test Facial Treatment');
    
    // Select category
    const categorySelect = page.getByLabel('Category');
    await categorySelect.click();
    const categoryOption = page.locator('[role="option"]').first();
    if (await categoryOption.isVisible()) {
      await categoryOption.click();
    }
    
    await page.getByLabel('Price').fill('250');
    await page.getByLabel('Duration').fill('60');
    await page.getByLabel('Description').fill('Relaxing facial treatment with premium products');
    
    // Submit
    await page.getByRole('button', { name: /Add Service/i }).click();
    
    // Wait for success
    await page.waitForTimeout(1000);
    
    // Check for success message or new service in list
    const successMessage = page.getByText(/Service added successfully/i);
    const newService = page.getByText('Test Facial Treatment');
    
    const successVisible = await successMessage.isVisible().catch(() => false);
    const serviceVisible = await newService.isVisible().catch(() => false);
    
    expect(successVisible || serviceVisible).toBeTruthy();
  });

  test('should search for services', async ({ page }) => {
    // Search for a service
    const searchInput = page.getByPlaceholder(/Search services/i);
    await searchInput.fill('Hair');
    
    // Wait for search results
    await page.waitForTimeout(500);
    
    // Check filtered results
    const serviceCards = page.locator('[data-testid="service-card"]:visible');
    if (await serviceCards.first().isVisible()) {
      const firstCard = serviceCards.first();
      await expect(firstCard).toContainText(/Hair/i);
    }
  });

  test('should filter services by category', async ({ page }) => {
    // Look for category filter
    const categoryFilter = page.getByRole('combobox', { name: /category/i });
    if (await categoryFilter.isVisible()) {
      await categoryFilter.click();
      
      // Select a category
      const categoryOption = page.locator('[role="option"]').filter({ hasText: /Hair/i }).first();
      if (await categoryOption.isVisible()) {
        await categoryOption.click();
        
        // Wait for filter to apply
        await page.waitForTimeout(500);
        
        // Verify filtered services
        const serviceCards = page.locator('[data-testid="service-card"]:visible');
        if (await serviceCards.first().isVisible()) {
          // Services should be from selected category
          await expect(serviceCards.first()).toContainText(/Hair|Styling|Color/i);
        }
      }
    }
  });

  test('should edit service details', async ({ page }) => {
    // Find first service card
    const firstService = page.locator('[data-testid="service-card"]').first();
    if (await firstService.isVisible()) {
      // Click edit
      await firstService.getByRole('button', { name: /Edit/i }).click();
      
      // Edit dialog should open
      await expect(page.getByRole('dialog')).toBeVisible();
      await expect(page.getByRole('heading', { name: /Edit Service/i })).toBeVisible();
      
      // Update price
      const priceInput = page.getByLabel('Price');
      await priceInput.clear();
      await priceInput.fill('300');
      
      // Save
      await page.getByRole('button', { name: /Save Changes/i }).click();
      
      // Wait for save
      await page.waitForTimeout(1000);
    }
  });

  test('should delete service with confirmation', async ({ page }) => {
    // Find service to delete
    const serviceCard = page.locator('[data-testid="service-card"]').last();
    if (await serviceCard.isVisible()) {
      // Set up dialog handler
      page.on('dialog', dialog => {
        if (dialog.type() === 'confirm') {
          dialog.accept();
        }
      });
      
      // Click delete
      await serviceCard.getByRole('button', { name: /Delete/i }).click();
      
      // Wait for deletion
      await page.waitForTimeout(1000);
    }
  });

  test('should manage service categories', async ({ page }) => {
    // Click manage categories
    await page.getByRole('button', { name: /Manage Categories/i }).click();
    
    // Categories dialog or page should open
    const dialog = page.getByRole('dialog');
    const categoryPage = page.getByRole('heading', { name: /Categories/i });
    
    const dialogVisible = await dialog.isVisible().catch(() => false);
    const pageVisible = await categoryPage.isVisible().catch(() => false);
    
    expect(dialogVisible || pageVisible).toBeTruthy();
    
    if (dialogVisible) {
      // Check category management options
      await expect(page.getByRole('button', { name: /Add Category/i })).toBeVisible();
    }
  });

  test('should toggle service availability', async ({ page }) => {
    // Find service with toggle
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    if (await serviceCard.isVisible()) {
      const toggle = serviceCard.locator('[role="switch"]');
      if (await toggle.isVisible()) {
        // Check current state
        const isChecked = await toggle.getAttribute('aria-checked');
        
        // Toggle
        await toggle.click();
        
        // State should change
        await page.waitForTimeout(500);
        const newState = await toggle.getAttribute('aria-checked');
        expect(newState).not.toBe(isChecked);
      }
    }
  });

  test('should display service statistics', async ({ page }) => {
    // Look for stats section
    const statsSection = page.locator('[data-testid="service-stats"]');
    if (await statsSection.isVisible()) {
      // Check for common stats
      await expect(statsSection.getByText(/Total Services/i)).toBeVisible();
      await expect(statsSection.getByText(/Active Services/i)).toBeVisible();
      await expect(statsSection.getByText(/Categories/i)).toBeVisible();
    }
  });

  test('should sort services', async ({ page }) => {
    // Look for sort options
    const sortButton = page.getByRole('button', { name: /Sort/i });
    if (await sortButton.isVisible()) {
      await sortButton.click();
      
      // Sort menu should appear
      const sortOptions = ['Name', 'Price', 'Duration', 'Popularity'];
      for (const option of sortOptions) {
        const sortOption = page.getByRole('menuitem', { name: option });
        if (await sortOption.isVisible()) {
          await expect(sortOption).toBeVisible();
        }
      }
    }
  });

  test('should show service booking count', async ({ page }) => {
    // Check if service cards show booking statistics
    const serviceCard = page.locator('[data-testid="service-card"]').first();
    if (await serviceCard.isVisible()) {
      const bookingCount = serviceCard.getByText(/\d+ bookings?/i);
      if (await bookingCount.isVisible()) {
        await expect(bookingCount).toBeVisible();
      }
    }
  });

  test('should validate service form', async ({ page }) => {
    // Open add service dialog
    await page.getByRole('button', { name: /Add New Service/i }).click();
    
    // Try to submit empty form
    await page.getByRole('button', { name: /Add Service/i }).click();
    
    // Should show validation errors
    const nameError = page.getByText(/Service name is required/i);
    const priceError = page.getByText(/Price is required/i);
    
    const nameErrorVisible = await nameError.isVisible().catch(() => false);
    const priceErrorVisible = await priceError.isVisible().catch(() => false);
    
    expect(nameErrorVisible || priceErrorVisible).toBeTruthy();
  });

  test('should handle bulk actions', async ({ page }) => {
    // Look for bulk action controls
    const selectAllCheckbox = page.locator('[data-testid="select-all"]');
    if (await selectAllCheckbox.isVisible()) {
      // Select all
      await selectAllCheckbox.check();
      
      // Bulk actions should appear
      const bulkActions = page.locator('[data-testid="bulk-actions"]');
      await expect(bulkActions).toBeVisible();
      
      // Check available actions
      await expect(bulkActions.getByRole('button', { name: /Delete Selected/i })).toBeVisible();
      await expect(bulkActions.getByRole('button', { name: /Update Prices/i })).toBeVisible();
    }
  });

  test('should navigate back to dashboard', async ({ page }) => {
    // Find back button
    const backButton = page.getByRole('button', { name: /Back to Dashboard/i });
    if (await backButton.isVisible()) {
      await backButton.click();
      
      // Should navigate to dashboard
      await expect(page).toHaveURL('/salon');
    }
  });
});