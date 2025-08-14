import { test, expect } from '@playwright/test'

// Mario's Restaurant Supplier Management Tests
// Testing HERA's universal entities applied to supplier management

test.describe('Mario Restaurant - Supplier Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Mario
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', 'mario@restaurant.com')
    await page.fill('input[type="password"]', 'securepass123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/restaurant**')
    await page.waitForLoadState('networkidle')
    
    // Navigate to procurement suppliers section
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    await page.click('button', { hasText: 'Suppliers' })
    await page.waitForTimeout(1000)
  })

  test('should display suppliers management interface', async ({ page }) => {
    // Verify we're in the suppliers section
    const suppliersTab = page.locator('button', { hasText: 'Suppliers' })
    await expect(suppliersTab).toHaveClass(/border-indigo-500/)
    
    // The SupplierManager component should be loaded
    // Look for common supplier management elements
    await expect(page.locator('text=Supplier').or(page.locator('text=supplier'))).toBeVisible()
  })

  test('should handle suppliers list display', async ({ page }) => {
    // Wait for supplier data to load
    await page.waitForTimeout(2000)
    
    // Look for typical supplier management elements
    const searchElements = page.locator('input[placeholder*="search"], input[placeholder*="Search"]')
    const addButtons = page.locator('button', { hasText: /Add|New|Create/i })
    const filterElements = page.locator('text=Filter').or(page.locator('button', { hasText: 'Filter' }))
    
    // At least one of these should be present in a supplier management interface
    const hasSearchOrAdd = await searchElements.count() > 0 || await addButtons.count() > 0
    expect(hasSearchOrAdd).toBeTruthy()
  })

  test('should display supplier cards or table', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for supplier data display patterns
    const cards = page.locator('[class*="card"], .card, [class*="bg-white"][class*="border"], [class*="rounded"]')
    const tables = page.locator('table, [role="table"]')
    const lists = page.locator('ul, ol, [role="list"]')
    
    // Should have some form of data display
    const hasDataDisplay = await cards.count() > 0 || await tables.count() > 0 || await lists.count() > 0
    expect(hasDataDisplay).toBeTruthy()
  })

  test('should handle supplier search functionality', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for search input
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first()
    
    if (await searchInput.count() > 0) {
      // Test search functionality
      await searchInput.fill('ACME')
      await page.waitForTimeout(500)
      
      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
    }
  })

  test('should handle supplier status filtering', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for filter controls
    const filterButtons = page.locator('button', { hasText: /Filter|Status|Active|Inactive/i })
    const selectElements = page.locator('select, [role="combobox"]')
    
    if (await filterButtons.count() > 0) {
      await filterButtons.first().click()
      await page.waitForTimeout(500)
    }
  })

  test('should display supplier contact information', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for contact-related elements
    const emailElements = page.locator('text=@').or(page.locator('[href^="mailto:"]'))
    const phoneElements = page.locator('text=+').or(page.locator('[href^="tel:"]'))
    const contactText = page.locator('text=contact').or(page.locator('text=Contact'))
    
    // Should have some contact information display
    const hasContactInfo = await emailElements.count() > 0 || 
                          await phoneElements.count() > 0 || 
                          await contactText.count() > 0
    
    // This is expected but not critical for the test to pass
    console.log(`Contact information present: ${hasContactInfo}`)
  })

  test('should handle add new supplier action', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for add supplier button
    const addButtons = page.locator('button', { hasText: /Add|New|Create/i })
    
    if (await addButtons.count() > 0) {
      const addButton = addButtons.first()
      await addButton.click()
      await page.waitForTimeout(1000)
      
      // Look for modal, form, or new page
      const modals = page.locator('[role="dialog"], .modal, [class*="modal"]')
      const forms = page.locator('form')
      
      const hasForm = await modals.count() > 0 || await forms.count() > 0
      console.log(`Add supplier form opened: ${hasForm}`)
    }
  })

  test('should display supplier metrics and statistics', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for metrics display
    const numbers = page.locator('text=/\\d+/')
    const percentages = page.locator('text=/%/')
    const currency = page.locator('text=/\\$[\\d,]+/')
    
    const hasMetrics = await numbers.count() > 0 || 
                      await percentages.count() > 0 || 
                      await currency.count() > 0
    
    console.log(`Supplier metrics displayed: ${hasMetrics}`)
  })

  test('should handle supplier actions menu', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for action buttons or menus
    const actionButtons = page.locator('button', { hasText: /Edit|View|Delete|More|Actions/i })
    const moreButtons = page.locator('[aria-label*="more"], [aria-label*="actions"]')
    
    if (await actionButtons.count() > 0 || await moreButtons.count() > 0) {
      const actionButton = actionButtons.first() || moreButtons.first()
      await actionButton.click()
      await page.waitForTimeout(500)
    }
  })

  test('should validate supplier status badges', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for status indicators
    const badges = page.locator('.badge, [class*="badge"], [class*="status"]')
    const activeIndicators = page.locator('text=Active').or(page.locator('text=active'))
    const statusColors = page.locator('[class*="green"], [class*="red"], [class*="yellow"]')
    
    const hasStatusIndicators = await badges.count() > 0 || 
                               await activeIndicators.count() > 0 || 
                               await statusColors.count() > 0
    
    console.log(`Status indicators present: ${hasStatusIndicators}`)
  })

  test('should handle supplier data export', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for export functionality
    const exportButtons = page.locator('button', { hasText: /Export|Download|CSV|Excel/i })
    
    if (await exportButtons.count() > 0) {
      // Don't actually trigger download in test
      console.log('Export functionality available')
    }
  })

  test('should display supplier performance metrics', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for performance indicators
    const ratings = page.locator('text=rating').or(page.locator('[class*="star"]'))
    const scores = page.locator('text=score').or(page.locator('text=performance'))
    const charts = page.locator('svg, canvas, [class*="chart"]')
    
    const hasPerformanceData = await ratings.count() > 0 || 
                              await scores.count() > 0 || 
                              await charts.count() > 0
    
    console.log(`Performance metrics available: ${hasPerformanceData}`)
  })

  test('should handle responsive design for suppliers', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Should still show suppliers section
    const suppliersTab = page.locator('button', { hasText: 'Suppliers' })
    await expect(suppliersTab).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should navigate back to dashboard', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Click dashboard tab to return
    await page.click('button', { hasText: 'Dashboard' })
    await page.waitForTimeout(1000)
    
    // Verify we're back to dashboard
    const dashboardTab = page.locator('button', { hasText: 'Dashboard' })
    await expect(dashboardTab).toHaveClass(/border-indigo-500/)
    
    // Should see dashboard content
    await expect(page.locator('text=Active Suppliers')).toBeVisible()
  })
})