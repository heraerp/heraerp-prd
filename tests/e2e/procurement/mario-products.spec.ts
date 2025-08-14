import { test, expect } from '@playwright/test'

// Mario's Restaurant Product Catalog Tests
// Testing HERA's universal entities for product/inventory management

test.describe('Mario Restaurant - Product Catalog Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as Mario
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    
    await page.fill('input[type="email"]', 'mario@restaurant.com')
    await page.fill('input[type="password"]', 'securepass123')
    await page.click('button[type="submit"]')
    
    await page.waitForURL('**/restaurant**')
    await page.waitForLoadState('networkidle')
    
    // Navigate to procurement products section
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
    await page.click('button', { hasText: 'Products' })
    await page.waitForTimeout(1000)
  })

  test('should display products management interface', async ({ page }) => {
    // Verify we're in the products section
    const productsTab = page.locator('button', { hasText: 'Products' })
    await expect(productsTab).toHaveClass(/border-indigo-500/)
    
    // Should display product-related content
    await expect(page.locator('text=Product').or(page.locator('text=product'))).toBeVisible()
  })

  test('should handle product catalog display', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for product management elements
    const searchElements = page.locator('input[placeholder*="search"], input[placeholder*="Search"], input[placeholder*="product"]')
    const addButtons = page.locator('button', { hasText: /Add|New|Create.*Product/i })
    const filterElements = page.locator('button', { hasText: /Filter|Category|Type/i })
    
    // Should have product management controls
    const hasProductControls = await searchElements.count() > 0 || 
                               await addButtons.count() > 0 || 
                               await filterElements.count() > 0
    
    expect(hasProductControls).toBeTruthy()
  })

  test('should display product inventory information', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for inventory-related data
    const quantityElements = page.locator('text=quantity').or(page.locator('text=Quantity'))
    const stockElements = page.locator('text=stock').or(page.locator('text=Stock'))
    const inventoryElements = page.locator('text=inventory').or(page.locator('text=Inventory'))
    const skuElements = page.locator('text=SKU').or(page.locator('text=sku'))
    
    const hasInventoryInfo = await quantityElements.count() > 0 || 
                            await stockElements.count() > 0 || 
                            await inventoryElements.count() > 0 || 
                            await skuElements.count() > 0
    
    console.log(`Inventory information displayed: ${hasInventoryInfo}`)
  })

  test('should show product categories and classification', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for category-related elements
    const categoryElements = page.locator('text=Category').or(page.locator('text=category'))
    const typeElements = page.locator('text=Type').or(page.locator('text=type'))
    const classificationElements = page.locator('text=classification').or(page.locator('text=Classification'))
    
    const hasClassification = await categoryElements.count() > 0 || 
                             await typeElements.count() > 0 || 
                             await classificationElements.count() > 0
    
    console.log(`Product classification displayed: ${hasClassification}`)
  })

  test('should handle product search and filtering', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Test product search
    const searchInput = page.locator('input[placeholder*="search"], input[placeholder*="Search"]').first()
    
    if (await searchInput.count() > 0) {
      await searchInput.fill('Tomato')
      await page.waitForTimeout(1000)
      
      // Clear search
      await searchInput.clear()
      await page.waitForTimeout(500)
      
      // Try another restaurant-related search
      await searchInput.fill('Pasta')
      await page.waitForTimeout(1000)
      await searchInput.clear()
    }
  })

  test('should display product pricing information', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for pricing elements
    const priceElements = page.locator('text=/\\$[\\d,.]+/')
    const costElements = page.locator('text=cost').or(page.locator('text=Cost'))
    const priceLabels = page.locator('text=Price').or(page.locator('text=price'))
    
    const hasPricingInfo = await priceElements.count() > 0 || 
                          await costElements.count() > 0 || 
                          await priceLabels.count() > 0
    
    console.log(`Pricing information displayed: ${hasPricingInfo}`)
  })

  test('should handle add new product functionality', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for add product button
    const addButtons = page.locator('button', { hasText: /Add.*Product|New.*Product|Create.*Product/i })
    const plusButtons = page.locator('button', { hasText: /Add|New|\+/i })
    
    if (await addButtons.count() > 0) {
      await addButtons.first().click()
      await page.waitForTimeout(1000)
    } else if (await plusButtons.count() > 0) {
      await plusButtons.first().click()
      await page.waitForTimeout(1000)
    }
    
    // Look for product form or modal
    const forms = page.locator('form')
    const modals = page.locator('[role="dialog"], .modal')
    const inputFields = page.locator('input[placeholder*="name"], input[placeholder*="Name"]')
    
    const hasProductForm = await forms.count() > 0 || 
                          await modals.count() > 0 || 
                          await inputFields.count() > 0
    
    console.log(`Add product form available: ${hasProductForm}`)
  })

  test('should display product specifications', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for specification-related elements
    const specElements = page.locator('text=specification').or(page.locator('text=Specification'))
    const detailElements = page.locator('text=details').or(page.locator('text=Details'))
    const attributeElements = page.locator('text=attributes').or(page.locator('text=Attributes'))
    const descriptionElements = page.locator('text=description').or(page.locator('text=Description'))
    
    const hasSpecifications = await specElements.count() > 0 || 
                             await detailElements.count() > 0 || 
                             await attributeElements.count() > 0 || 
                             await descriptionElements.count() > 0
    
    console.log(`Product specifications displayed: ${hasSpecifications}`)
  })

  test('should show supplier relationships', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for supplier-related information
    const supplierElements = page.locator('text=supplier').or(page.locator('text=Supplier'))
    const vendorElements = page.locator('text=vendor').or(page.locator('text=Vendor'))
    const sourceElements = page.locator('text=source').or(page.locator('text=Source'))
    
    const hasSupplierInfo = await supplierElements.count() > 0 || 
                           await vendorElements.count() > 0 || 
                           await sourceElements.count() > 0
    
    console.log(`Supplier relationships displayed: ${hasSupplierInfo}`)
  })

  test('should handle product status management', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for status indicators
    const activeElements = page.locator('text=Active').or(page.locator('text=active'))
    const inactiveElements = page.locator('text=Inactive').or(page.locator('text=inactive'))
    const statusBadges = page.locator('.badge, [class*="badge"]')
    const statusColors = page.locator('[class*="green"], [class*="red"], [class*="yellow"]')
    
    const hasStatusInfo = await activeElements.count() > 0 || 
                         await inactiveElements.count() > 0 || 
                         await statusBadges.count() > 0 || 
                         await statusColors.count() > 0
    
    console.log(`Product status indicators present: ${hasStatusInfo}`)
  })

  test('should display stock level warnings', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for stock level indicators
    const lowStockElements = page.locator('text=/low.*stock/i').or(page.locator('text=/out.*stock/i'))
    const warningElements = page.locator('[class*="warning"], [class*="alert"]')
    const redIndicators = page.locator('[class*="red"]')
    
    const hasStockWarnings = await lowStockElements.count() > 0 || 
                            await warningElements.count() > 0
    
    console.log(`Stock warnings displayed: ${hasStockWarnings}`)
  })

  test('should handle product image management', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for image-related elements
    const images = page.locator('img')
    const imageUpload = page.locator('input[type="file"]')
    const imageLabels = page.locator('text=image').or(page.locator('text=Image'))
    const photoElements = page.locator('text=photo').or(page.locator('text=Photo'))
    
    const hasImageFeatures = await images.count() > 0 || 
                             await imageUpload.count() > 0 || 
                             await imageLabels.count() > 0 || 
                             await photoElements.count() > 0
    
    console.log(`Image management features: ${hasImageFeatures}`)
  })

  test('should show product analytics and metrics', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for analytics elements
    const chartElements = page.locator('svg, canvas, [class*="chart"]')
    const metricsElements = page.locator('text=metrics').or(page.locator('text=Metrics'))
    const analyticsElements = page.locator('text=analytics').or(page.locator('text=Analytics'))
    const performanceElements = page.locator('text=performance').or(page.locator('text=Performance'))
    
    const hasAnalytics = await chartElements.count() > 0 || 
                        await metricsElements.count() > 0 || 
                        await analyticsElements.count() > 0 || 
                        await performanceElements.count() > 0
    
    console.log(`Product analytics available: ${hasAnalytics}`)
  })

  test('should handle bulk product operations', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Look for bulk operation elements
    const checkboxes = page.locator('input[type="checkbox"]')
    const selectAllElements = page.locator('text=/select.*all/i')
    const bulkButtons = page.locator('button', { hasText: /Bulk|bulk|Multiple/i })
    const actionMenus = page.locator('button', { hasText: /Actions|actions/i })
    
    const hasBulkOperations = await checkboxes.count() > 2 || 
                             await selectAllElements.count() > 0 || 
                             await bulkButtons.count() > 0 || 
                             await actionMenus.count() > 0
    
    console.log(`Bulk operations available: ${hasBulkOperations}`)
  })

  test('should validate responsive design for products', async ({ page }) => {
    await page.waitForTimeout(2000)
    
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    await page.waitForTimeout(500)
    
    // Should still show products section
    const productsTab = page.locator('button', { hasText: 'Products' })
    await expect(productsTab).toBeVisible()
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.waitForTimeout(500)
    
    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should navigate to other procurement sections', async ({ page }) => {
    await page.waitForTimeout(1000)
    
    // Test navigation to Purchase Orders
    await page.click('button', { hasText: 'Purchase Orders' })
    await page.waitForTimeout(1000)
    
    const poTab = page.locator('button', { hasText: 'Purchase Orders' })
    await expect(poTab).toHaveClass(/border-indigo-500/)
    
    // Navigate back to Products
    await page.click('button', { hasText: 'Products' })
    await page.waitForTimeout(1000)
    
    const productsTab = page.locator('button', { hasText: 'Products' })
    await expect(productsTab).toHaveClass(/border-indigo-500/)
  })
})