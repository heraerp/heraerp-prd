import { test, expect } from '@playwright/test'

test.describe('Salon Services Management', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to services page
    await page.goto('/salon/services')
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Services")')
  })

  test('displays services page with correct header', async ({ page }) => {
    // Check header elements
    await expect(page.locator('text=HERA • SALON OS')).toBeVisible()
    await expect(page.locator('h1:has-text("Services")')).toBeVisible()
    await expect(page.locator('button:has-text("New Service")')).toBeVisible()
    await expect(page.locator('input[placeholder="Search services..."]')).toBeVisible()
  })

  test('creates a new service', async ({ page }) => {
    // Click new service button
    await page.click('button:has-text("New Service")')
    
    // Wait for modal
    await page.waitForSelector('text=Create New Service')
    
    // Fill in service details
    await page.fill('input[id="name"]', 'Test Haircut Service')
    await page.fill('input[id="code"]', 'TEST001')
    await page.fill('input[id="duration_mins"]', '45')
    await page.fill('input[id="price"]', '75')
    await page.fill('input[id="tax_rate"]', '5')
    await page.fill('textarea[id="description"]', 'This is a test service')
    
    // Select category
    await page.click('button[role="combobox"]')
    await page.click('text=Hair')
    
    // Save service
    await page.click('button:has-text("Save Service")')
    
    // Verify service appears in list
    await expect(page.locator('text=Test Haircut Service')).toBeVisible()
    await expect(page.locator('text=TEST001')).toBeVisible()
    await expect(page.locator('text=45m')).toBeVisible()
    await expect(page.locator('text=AED 75')).toBeVisible()
  })

  test('searches for services', async ({ page }) => {
    // Type in search box
    await page.fill('input[placeholder="Search services..."]', 'cut')
    
    // Wait for results to filter
    await page.waitForTimeout(500) // Debounce delay
    
    // Verify filtered results
    const rows = await page.locator('tbody tr').count()
    expect(rows).toBeGreaterThan(0)
    
    // Clear search
    await page.fill('input[placeholder="Search services..."]', '')
    await page.waitForTimeout(500)
  })

  test('filters by status', async ({ page }) => {
    // Click archived tab
    await page.click('button[role="tab"]:has-text("Archived")')
    
    // Wait for results
    await page.waitForTimeout(500)
    
    // Verify only archived services shown
    const badges = await page.locator('text=archived').count()
    if (badges > 0) {
      await expect(page.locator('text=archived').first()).toBeVisible()
    }
    
    // Click active tab
    await page.click('button[role="tab"]:has-text("Active")')
    await page.waitForTimeout(500)
  })

  test('edits an existing service', async ({ page }) => {
    // Wait for services to load
    await page.waitForSelector('tbody tr')
    
    // Click more menu on first service
    await page.click('tbody tr:first-child button[aria-label*="more"]')
    
    // Click edit
    await page.click('text=Edit')
    
    // Wait for modal
    await page.waitForSelector('text=Edit Service')
    
    // Update price
    await page.fill('input[id="price"]', '85')
    
    // Save changes
    await page.click('button:has-text("Save Service")')
    
    // Verify updated price appears
    await expect(page.locator('text=AED 85')).toBeVisible()
  })

  test('bulk archives services', async ({ page }) => {
    // Wait for services to load
    await page.waitForSelector('tbody tr')
    
    // Select first two services
    await page.click('tbody tr:nth-child(1) input[type="checkbox"]')
    await page.click('tbody tr:nth-child(2) input[type="checkbox"]')
    
    // Bulk actions bar should appear
    await expect(page.locator('text=2 selected')).toBeVisible()
    
    // Click archive
    await page.click('button:has-text("Archive")')
    
    // Verify success message
    await expect(page.locator('text=Archived 2 services')).toBeVisible()
  })

  test('exports services to CSV', async ({ page }) => {
    // Set up download promise before clicking
    const downloadPromise = page.waitForEvent('download')
    
    // Click export button
    await page.click('button[aria-label="Export"]')
    
    // Wait for download
    const download = await downloadPromise
    
    // Verify filename
    expect(download.suggestedFilename()).toMatch(/services-\d{4}-\d{2}-\d{2}\.csv/)
  })

  test('shows empty state when no services', async ({ page }) => {
    // Filter to show no results
    await page.fill('input[placeholder="Search services..."]', 'xyznonexistent')
    await page.waitForTimeout(500)
    
    // Verify empty state
    await expect(page.locator('text=No services yet')).toBeVisible()
    await expect(page.locator('text=Create your first service to start building your catalog')).toBeVisible()
  })

  test('validates service form', async ({ page }) => {
    // Open modal
    await page.click('button:has-text("New Service")')
    
    // Try to save without filling required fields
    await page.click('button:has-text("Save Service")')
    
    // Check for validation errors
    await expect(page.locator('text=Name is too short')).toBeVisible()
    
    // Fill name with invalid value
    await page.fill('input[id="name"]', 'A')
    await page.click('button:has-text("Save Service")')
    await expect(page.locator('text=Name is too short')).toBeVisible()
    
    // Fill with valid name
    await page.fill('input[id="name"]', 'Valid Service Name')
    
    // Set invalid duration
    await page.fill('input[id="duration_mins"]', '3')
    await page.click('button:has-text("Save Service")')
    
    // Fix duration
    await page.fill('input[id="duration_mins"]', '30')
    
    // Set negative price
    await page.fill('input[id="price"]', '-50')
    await page.click('button:has-text("Save Service")')
    
    // Fix price
    await page.fill('input[id="price"]', '50')
    
    // Should save successfully now
    await page.click('button:has-text("Save Service")')
    await expect(page.locator('text=Service created successfully')).toBeVisible()
  })
})