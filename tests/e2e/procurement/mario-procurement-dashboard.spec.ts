import { test, expect } from '@playwright/test'

// Mario's Restaurant Procurement & Inventory Dashboard Tests
// Testing the universal HERA architecture applied to supply chain management

test.describe('Mario Restaurant - Procurement Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to authentication page
    await page.goto('/auth')
    await page.waitForLoadState('networkidle')
    
    // Login as Mario from the restaurant
    await page.fill('input[type="email"]', 'mario@restaurant.com')
    await page.fill('input[type="password"]', 'securepass123')
    await page.click('button[type="submit"]')
    
    // Wait for authentication to complete
    await page.waitForURL('**/restaurant**')
    await page.waitForLoadState('networkidle')
    
    // Navigate to procurement page
    await page.goto('/procurement')
    await page.waitForLoadState('networkidle')
  })

  test('should display procurement dashboard overview', async ({ page }) => {
    // Verify page title and header
    await expect(page.locator('h1')).toContainText('Procurement & Inventory')
    await expect(page.locator('text=Universal supply chain management powered by HERA')).toBeVisible()

    // Verify overview stats cards are present
    await expect(page.locator('text=Active Suppliers')).toBeVisible()
    await expect(page.locator('text=Products in Catalog')).toBeVisible()
    await expect(page.locator('text=Pending POs')).toBeVisible()
    await expect(page.locator('text=Monthly Spend')).toBeVisible()

    // Verify stats have numeric values
    const activeSuppliers = page.locator('text=Active Suppliers').locator('..').locator('p').nth(1)
    await expect(activeSuppliers).toContainText(/\d+/)
    
    const totalProducts = page.locator('text=Products in Catalog').locator('..').locator('p').nth(1)
    await expect(totalProducts).toContainText(/\d+/)
    
    const pendingPOs = page.locator('text=Pending POs').locator('..').locator('p').nth(1)
    await expect(pendingPOs).toContainText(/\d+/)
    
    const monthlySpend = page.locator('text=Monthly Spend').locator('..').locator('p').nth(1)
    await expect(monthlySpend).toContainText(/\$[\d,]+/)
  })

  test('should have functional navigation tabs', async ({ page }) => {
    // Verify all navigation tabs are present
    await expect(page.locator('button', { hasText: 'Dashboard' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Suppliers' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Products' })).toBeVisible()
    await expect(page.locator('button', { hasText: 'Purchase Orders' })).toBeVisible()

    // Test tab navigation - Dashboard should be active by default
    const dashboardTab = page.locator('button', { hasText: 'Dashboard' })
    await expect(dashboardTab).toHaveClass(/border-indigo-500/)
    await expect(dashboardTab).toHaveClass(/text-indigo-600/)
  })

  test('should display quick actions with proper styling', async ({ page }) => {
    // Verify Quick Actions section
    await expect(page.locator('h3', { hasText: 'Quick Actions' })).toBeVisible()

    // Check all quick action buttons
    const manageSuppliers = page.locator('button', { hasText: 'Manage Suppliers' })
    const productCatalog = page.locator('button', { hasText: 'Product Catalog' })
    const purchaseOrders = page.locator('button', { hasText: 'Purchase Orders' })
    const analytics = page.locator('button', { hasText: 'Analytics' })

    await expect(manageSuppliers).toBeVisible()
    await expect(productCatalog).toBeVisible()
    await expect(purchaseOrders).toBeVisible()
    await expect(analytics).toBeVisible()

    // Verify primary button styling
    await expect(manageSuppliers).toHaveClass(/bg-blue-600/)
    await expect(purchaseOrders).toHaveClass(/from-green-600/)
  })

  test('should show recent activity feed', async ({ page }) => {
    // Verify Recent Activity section
    await expect(page.locator('h3', { hasText: 'Recent Activity' })).toBeVisible()
    
    // Check for refresh button
    await expect(page.locator('button', { hasText: 'Refresh' })).toBeVisible()

    // Verify activity items are displayed
    const activityItems = page.locator('[class*="bg-gray-50 rounded-lg"]')
    await expect(activityItems).toHaveCount(4) // Based on mock data

    // Check first activity item details
    await expect(page.locator('text=PO-2025-001234 created for Acme Corp')).toBeVisible()
    await expect(page.locator('text=2 hours ago')).toBeVisible()
  })

  test('should display HERA architecture information', async ({ page }) => {
    // Verify HERA system info card
    await expect(page.locator('text=HERA Procurement & Inventory - Phase 1 Complete')).toBeVisible()
    await expect(page.locator('text=universal 6-table architecture')).toBeVisible()

    // Check architecture feature highlights
    await expect(page.locator('text=✅ Supplier Management')).toBeVisible()
    await expect(page.locator('text=✅ Product Catalog')).toBeVisible()
    await expect(page.locator('text=✅ Purchase Orders')).toBeVisible()

    // Verify universal architecture description
    await expect(page.locator('text=Universal entities with dynamic contact and business data')).toBeVisible()
    await expect(page.locator('text=Unlimited specifications without schema changes')).toBeVisible()
    await expect(page.locator('text=Universal transactions with approval workflows')).toBeVisible()
  })

  test('should navigate to suppliers section', async ({ page }) => {
    // Click on Manage Suppliers quick action
    await page.click('button', { hasText: 'Manage Suppliers' })
    
    // Wait for content to load
    await page.waitForTimeout(1000)

    // Verify suppliers tab is now active
    const suppliersTab = page.locator('button', { hasText: 'Suppliers' })
    await expect(suppliersTab).toHaveClass(/border-indigo-500/)
    await expect(suppliersTab).toHaveClass(/text-indigo-600/)
  })

  test('should navigate to products section', async ({ page }) => {
    // Click on Product Catalog quick action
    await page.click('button', { hasText: 'Product Catalog' })
    
    // Wait for content to load
    await page.waitForTimeout(1000)

    // Verify products tab is now active
    const productsTab = page.locator('button', { hasText: 'Products' })
    await expect(productsTab).toHaveClass(/border-indigo-500/)
    await expect(productsTab).toHaveClass(/text-indigo-600/)
  })

  test('should navigate to purchase orders section', async ({ page }) => {
    // Click on Purchase Orders quick action
    await page.click('button', { hasText: 'Purchase Orders' })
    
    // Wait for content to load
    await page.waitForTimeout(1000)

    // Verify purchase orders tab is now active
    const poTab = page.locator('button', { hasText: 'Purchase Orders' })
    await expect(poTab).toHaveClass(/border-indigo-500/)
    await expect(poTab).toHaveClass(/text-indigo-600/)
  })

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify header remains visible
    await expect(page.locator('h1', { hasText: 'Procurement & Inventory' })).toBeVisible()
    
    // Verify stats cards stack properly on mobile
    const statsCards = page.locator('[class*="grid-cols-1 md:grid-cols-2 lg:grid-cols-4"]')
    await expect(statsCards).toBeVisible()

    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(page.locator('h1', { hasText: 'Procurement & Inventory' })).toBeVisible()

    // Return to desktop
    await page.setViewportSize({ width: 1280, height: 720 })
  })

  test('should validate accessibility features', async ({ page }) => {
    // Check for proper headings hierarchy
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('h3')).toHaveCount(3) // Quick Actions, Recent Activity, HERA info

    // Verify buttons have proper text content
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const textContent = await button.textContent()
      expect(textContent?.trim()).toBeTruthy()
    }

    // Check for proper contrast and visibility
    await expect(page.locator('[class*="text-gray-900"]')).toHaveCount({ min: 1 })
    await expect(page.locator('[class*="bg-white"]')).toHaveCount({ min: 1 })
  })

  test('should have proper loading states', async ({ page }) => {
    // Reload page to test loading
    await page.reload()
    
    // Verify page loads completely
    await page.waitForLoadState('networkidle')
    await expect(page.locator('h1', { hasText: 'Procurement & Inventory' })).toBeVisible()
    
    // Verify all major sections are loaded
    await expect(page.locator('text=Active Suppliers')).toBeVisible()
    await expect(page.locator('text=Quick Actions')).toBeVisible()
    await expect(page.locator('text=Recent Activity')).toBeVisible()
  })
})