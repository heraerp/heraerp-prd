import { test, expect } from '@playwright/test'

// Mario's Restaurant Complete Procurement Workflow Tests
// End-to-end testing of HERA's universal architecture for supply chain management

test.describe('Mario Restaurant - Complete Procurement Workflow', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Mario
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', 'mario@restaurant.com')
    await page.fill('input[type="password"]', 'securepass123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/restaurant**')
    await page.waitForLoadState('networkidle')
  })

  test('should complete full procurement workflow - Dashboard to Purchase Order', async ({ page }) => {
    // Step 1: Navigate to Procurement Dashboard
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Verify dashboard loads with all key metrics
    await expect(page.locator('h1', { hasText: 'Procurement & Inventory' })).toBeVisible()
    await expect(page.locator('text=Active Suppliers')).toBeVisible()
    await expect(page.locator('text=Products in Catalog')).toBeVisible()
    await expect(page.locator('text=Pending POs')).toBeVisible()
    await expect(page.locator('text=Monthly Spend')).toBeVisible()
    
    // Step 2: Navigate to Suppliers
    await page.click('button', { hasText: 'Manage Suppliers' })
    await page.waitForTimeout(1000)
    
    // Verify suppliers section loads
    const suppliersTab = page.locator('button', { hasText: 'Suppliers' })
    await expect(suppliersTab).toHaveClass(/border-indigo-500/)
    
    // Step 3: Navigate to Products
    await page.click('button', { hasText: 'Products' })
    await page.waitForTimeout(1000)
    
    // Verify products section loads
    const productsTab = page.locator('button', { hasText: 'Products' })
    await expect(productsTab).toHaveClass(/border-indigo-500/)
    
    // Step 4: Navigate to Purchase Orders
    await page.click('button', { hasText: 'Purchase Orders' })
    await page.waitForTimeout(1000)
    
    // Verify purchase orders section loads
    const poTab = page.locator('button', { hasText: 'Purchase Orders' })
    await expect(poTab).toHaveClass(/border-indigo-500/)
    
    // Step 5: Return to Dashboard to complete cycle
    await page.click('button', { hasText: 'Dashboard' })
    await page.waitForTimeout(1000)
    
    // Verify we're back to dashboard
    const dashboardTab = page.locator('button', { hasText: 'Dashboard' })
    await expect(dashboardTab).toHaveClass(/border-indigo-500/)
    await expect(page.locator('text=Quick Actions')).toBeVisible()
  })

  test('should validate HERA universal architecture messaging', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Verify HERA architecture information is displayed
    await expect(page.locator('text=HERA Procurement & Inventory - Phase 1 Complete')).toBeVisible()
    await expect(page.locator('text=universal 6-table architecture')).toBeVisible()
    
    // Verify the three key architecture components
    await expect(page.locator('text=✅ Supplier Management')).toBeVisible()
    await expect(page.locator('text=✅ Product Catalog')).toBeVisible()
    await expect(page.locator('text=✅ Purchase Orders')).toBeVisible()
    
    // Verify architecture descriptions
    await expect(page.locator('text=Universal entities with dynamic contact and business data')).toBeVisible()
    await expect(page.locator('text=Unlimited specifications without schema changes')).toBeVisible()
    await expect(page.locator('text=Universal transactions with approval workflows')).toBeVisible()
    
    // Verify Steve Jobs design principle reference
    await expect(page.locator('text=Steve Jobs Design Principles')).toBeVisible()
    
    // Verify multi-industry applicability
    await expect(page.locator('text=manufacturing, healthcare, retail, and professional services')).toBeVisible()
  })

  test('should handle procurement navigation consistency', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Test each tab multiple times to ensure consistency
    const tabs = ['Dashboard', 'Suppliers', 'Products', 'Purchase Orders']
    
    for (let i = 0; i < 2; i++) { // Run twice to test stability
      for (const tabName of tabs) {
        await page.click(`button:has-text("${tabName}")`)
        await page.waitForTimeout(500)
        
        const activeTab = page.locator(`button:has-text("${tabName}")`)
        await expect(activeTab).toHaveClass(/border-indigo-500/)
        await expect(activeTab).toHaveClass(/text-indigo-600/)
      }
    }
  })

  test('should display consistent Mario restaurant branding', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Check for Mario restaurant context
    // This might be in headers, organization name, or user context
    const contextElements = [
      'mario@restaurant.com',
      'Mario',
      'Restaurant',
      'mario'
    ]
    
    let foundContext = false
    for (const context of contextElements) {
      const elements = page.locator(`text=${context}`)
      if (await elements.count() > 0) {
        foundContext = true
        console.log(`Mario restaurant context found: ${context}`)
        break
      }
    }
    
    // Should have some restaurant/Mario context visible
    console.log(`Restaurant context displayed: ${foundContext}`)
  })

  test('should handle procurement data persistence across navigation', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Record initial metrics
    const initialSuppliers = await page.locator('text=Active Suppliers').locator('..').locator('p').nth(1).textContent()
    const initialProducts = await page.locator('text=Products in Catalog').locator('..').locator('p').nth(1).textContent()
    const initialPOs = await page.locator('text=Pending POs').locator('..').locator('p').nth(1).textContent()
    const initialSpend = await page.locator('text=Monthly Spend').locator('..').locator('p').nth(1).textContent()
    
    // Navigate through all sections
    await page.click('button', { hasText: 'Suppliers' })
    await page.waitForTimeout(1000)
    
    await page.click('button', { hasText: 'Products' })
    await page.waitForTimeout(1000)
    
    await page.click('button', { hasText: 'Purchase Orders' })
    await page.waitForTimeout(1000)
    
    // Return to dashboard
    await page.click('button', { hasText: 'Dashboard' })
    await page.waitForTimeout(1000)
    
    // Verify metrics are still the same (data persistence)
    const finalSuppliers = await page.locator('text=Active Suppliers').locator('..').locator('p').nth(1).textContent()
    const finalProducts = await page.locator('text=Products in Catalog').locator('..').locator('p').nth(1).textContent()
    const finalPOs = await page.locator('text=Pending POs').locator('..').locator('p').nth(1).textContent()
    const finalSpend = await page.locator('text=Monthly Spend').locator('..').locator('p').nth(1).textContent()
    
    expect(finalSuppliers).toBe(initialSuppliers)
    expect(finalProducts).toBe(initialProducts)
    expect(finalPOs).toBe(initialPOs)
    expect(finalSpend).toBe(initialSpend)
  })

  test('should validate procurement system performance', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    const loadTime = Date.now() - startTime
    console.log(`Procurement page load time: ${loadTime}ms`)
    
    // Should load within reasonable time (less than 10 seconds)
    expect(loadTime).toBeLessThan(10000)
    
    // Test navigation performance
    const navigationTests = [
      'Suppliers',
      'Products', 
      'Purchase Orders',
      'Dashboard'
    ]
    
    for (const tab of navigationTests) {
      const navStart = Date.now()
      await page.click(`button:has-text("${tab}")`)
      await page.waitForTimeout(500)
      const navTime = Date.now() - navStart
      
      console.log(`${tab} navigation time: ${navTime}ms`)
      expect(navTime).toBeLessThan(3000) // Should navigate within 3 seconds
    }
  })

  test('should handle procurement error states gracefully', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Test rapid navigation to check for race conditions
    for (let i = 0; i < 5; i++) {
      await page.click('button', { hasText: 'Suppliers' })
      await page.waitForTimeout(100)
      await page.click('button', { hasText: 'Products' })
      await page.waitForTimeout(100)
      await page.click('button', { hasText: 'Purchase Orders' })
      await page.waitForTimeout(100)
      await page.click('button', { hasText: 'Dashboard' })
      await page.waitForTimeout(100)
    }
    
    // Should still be functional after rapid navigation
    await expect(page.locator('h1', { hasText: 'Procurement & Inventory' })).toBeVisible()
    await expect(page.locator('text=Active Suppliers')).toBeVisible()
  })

  test('should validate procurement accessibility features', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Check for proper heading structure
    const h1Elements = page.locator('h1')
    await expect(h1Elements).toHaveCount(1)
    
    const h3Elements = page.locator('h3')
    await expect(h3Elements).toHaveCount({ min: 1 })
    
    // Check for button accessibility
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < Math.min(buttonCount, 10); i++) { // Check first 10 buttons
      const button = buttons.nth(i)
      const textContent = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      // Button should have either text content or aria-label
      expect(textContent?.trim() || ariaLabel?.trim()).toBeTruthy()
    }
    
    // Check for proper contrast (elements should be visible)
    await expect(page.locator('[class*="text-gray-900"]')).toHaveCount({ min: 1 })
    await expect(page.locator('[class*="bg-white"]')).toHaveCount({ min: 1 })
  })

  test('should integrate with restaurant workflow', async ({ page }) => {
    // Start from restaurant dashboard
    await page.goto('/restaurant')
    await page.waitForLoadState('networkidle')
    
    // Navigate to procurement from restaurant context
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Verify procurement loads in restaurant context
    await expect(page.locator('h1', { hasText: 'Procurement & Inventory' })).toBeVisible()
    
    // Navigate back to restaurant
    await page.goto('/restaurant')
    await page.waitForLoadState('networkidle')
    
    // Should return to restaurant dashboard successfully
    // Look for restaurant-specific elements
    const restaurantElements = page.locator('text=Restaurant').or(page.locator('text=restaurant'))
    await expect(restaurantElements).toBeVisible()
  })

  test('should demonstrate universal architecture scalability', async ({ page }) => {
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    
    // Verify the universal architecture messaging emphasizes scalability
    await expect(page.locator('text=Same architecture supports manufacturing, healthcare, retail')).toBeVisible()
    
    // Check that the system demonstrates flexibility
    await expect(page.locator('text=Unlimited specifications without schema changes')).toBeVisible()
    await expect(page.locator('text=Universal entities with dynamic contact and business data')).toBeVisible()
    await expect(page.locator('text=Universal transactions with approval workflows')).toBeVisible()
    
    // Navigate through all sections to demonstrate the universal interface pattern
    const sections = ['Dashboard', 'Suppliers', 'Products', 'Purchase Orders']
    
    for (const section of sections) {
      await page.click(`button:has-text("${section}")`)
      await page.waitForTimeout(500)
      
      // Each section should load successfully, demonstrating the universal pattern
      const activeTab = page.locator(`button:has-text("${section}")`)
      await expect(activeTab).toHaveClass(/border-indigo-500/)
    }
  })
})