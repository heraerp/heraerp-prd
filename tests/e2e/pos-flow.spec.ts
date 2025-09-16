// ================================================================================
// HERA POS FLOW E2E TESTS
// Smart Code: HERA.TEST.E2E.POS.FLOW.v1
// End-to-end tests for complete POS workflow
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('POS Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Set up mock environment
    await page.addInitScript(() => {
      window.localStorage.setItem('hera-use-mock', 'true')
    })

    // Login first
    await page.goto('/login')
    await page.fill('input[type="email"]', 'owner@hairtalkz.com')
    await page.fill('input[type="password"]', 'password123')
    await page.click('button[type="submit"]')
    await expect(page).toHaveURL('/dashboard')
  })

  test('should display empty cart on POS page', async ({ page }) => {
    // Navigate to POS
    await page.goto('/pos/sale')

    // Check page elements
    await expect(page.locator('h1')).toContainText('Point of Sale')
    
    // Cart should be empty
    await expect(page.locator('text=Your cart is empty')).toBeVisible()
    
    // Service and product tabs should be visible
    await expect(page.locator('button:has-text("Services")')).toBeVisible()
    await expect(page.locator('button:has-text("Products")')).toBeVisible()
    
    // Quick actions should be visible
    await expect(page.locator('text=Quick Actions')).toBeVisible()
  })

  test('should add services to cart', async ({ page }) => {
    await page.goto('/pos/sale')

    // Click on a service
    await page.click('text=Hair Cut & Style')
    
    // Service should appear in cart
    await expect(page.locator('text=Hair Cut & Style')).toBeVisible()
    await expect(page.locator('text=AED 150.00')).toBeVisible()
    
    // Add another service
    await page.click('text=Hair Color')
    
    // Check cart totals
    await expect(page.locator('text=Services Subtotal')).toBeVisible()
    await expect(page.locator('text=AED 500.00')).toBeVisible() // 150 + 350
    
    // VAT should be calculated
    await expect(page.locator('text=VAT (5%)')).toBeVisible()
    await expect(page.locator('text=AED 25.00')).toBeVisible()
    
    // Grand total
    await expect(page.locator('text=Total')).toBeVisible()
    await expect(page.locator('text=AED 525.00')).toBeVisible()
  })

  test('should add products to cart with inventory check', async ({ page }) => {
    await page.goto('/pos/sale')

    // Switch to products tab
    await page.click('button:has-text("Products")')
    
    // Add a product
    await page.click('text=Shampoo - Keratin Care')
    
    // Product should appear in cart
    await expect(page.locator('text=Shampoo - Keratin Care')).toBeVisible()
    await expect(page.locator('text=SKU: PRD-001')).toBeVisible()
    await expect(page.locator('text=45 in stock')).toBeVisible()
  })

  test('should apply discounts', async ({ page }) => {
    await page.goto('/pos/sale')

    // Add a service first
    await page.click('text=Hair Cut & Style')
    
    // Apply quick discount
    await page.click('button:has-text("10% Off")')
    
    // Discount should appear in cart
    await expect(page.locator('text=Discount')).toBeVisible()
    await expect(page.locator('text=Quick 10% discount')).toBeVisible()
    await expect(page.locator('text=-AED 15.00')).toBeVisible() // 10% of 150
  })

  test('should add tips', async ({ page }) => {
    await page.goto('/pos/sale')

    // Add a service
    await page.click('text=Hair Cut & Style')
    
    // Add 15% tip
    await page.click('button:has-text("15% Tip")')
    
    // Tip should appear in cart
    await expect(page.locator('text=Gratuity')).toBeVisible()
    await expect(page.locator('text=+AED 22.50')).toBeVisible() // 15% of 150
  })

  test('should proceed to checkout', async ({ page }) => {
    await page.goto('/pos/sale')

    // Add services
    await page.click('text=Hair Cut & Style')
    await page.click('text=Hair Color')
    
    // Click checkout
    await page.click('button:has-text("Checkout (2)")')
    
    // Should navigate to payment page
    await expect(page).toHaveURL(/\/pos\/payment\?invoice=/)
    
    // Invoice summary should be visible
    await expect(page.locator('h1')).toContainText('Process Payment')
    await expect(page.locator('text=Invoice Summary')).toBeVisible()
    await expect(page.locator('text=AED 525.00')).toBeVisible() // Total
  })

  test('should process cash payment', async ({ page }) => {
    // Start from payment page with an invoice
    await page.goto('/pos/sale')
    await page.click('text=Hair Cut & Style')
    await page.click('button:has-text("Checkout")')
    
    // On payment page
    await expect(page.locator('h1')).toContainText('Process Payment')
    
    // Select cash payment
    await page.click('text=Cash Payment')
    
    // Enter cash received
    await page.fill('input[id="cash-received"]', '200')
    
    // Change should be calculated
    await expect(page.locator('text=Change')).toBeVisible()
    await expect(page.locator('text=AED 42.50')).toBeVisible() // 200 - 157.50
    
    // Process payment
    await page.click('button:has-text("Process Payment")')
    
    // Should show loading state
    await expect(page.locator('text=Processing Payment')).toBeVisible()
    
    // Should navigate to invoice
    await expect(page).toHaveURL(/\/pos\/invoice\//)
  })

  test('should display invoice after payment', async ({ page }) => {
    // Complete a payment flow
    await page.goto('/pos/sale')
    await page.click('text=Hair Cut & Style')
    await page.click('button:has-text("Checkout")')
    await page.click('text=Cash Payment')
    await page.fill('input[id="cash-received"]', '200')
    await page.click('button:has-text("Process Payment")')
    
    // Invoice page
    await expect(page.locator('h1')).toContainText('Invoice')
    
    // Invoice details
    await expect(page.locator('text=Hair Talkz')).toBeVisible()
    await expect(page.locator('text=INV-')).toBeVisible()
    await expect(page.locator('text=PAID')).toBeVisible()
    
    // Action buttons
    await expect(page.locator('button:has-text("Print")')).toBeVisible()
    await expect(page.locator('button:has-text("Email")')).toBeVisible()
    await expect(page.locator('button:has-text("Download")')).toBeVisible()
  })

  test('should load appointment into POS', async ({ page }) => {
    // Navigate to POS with appointment
    await page.goto('/pos/sale?apptId=appt-001')
    
    // Should show appointment context
    await expect(page.locator('text=HERA.SALON.POS.SALE.FROM_APPT.v1')).toBeVisible()
    
    // Back to appointment button should be visible
    await expect(page.locator('button:has-text("Back to Appointment")')).toBeVisible()
    
    // Services should be pre-loaded
    await expect(page.locator('text=Hair Cut & Style')).toBeVisible()
    await expect(page.locator('text=Hair Color')).toBeVisible()
    
    // Commission preview should show stylist
    await expect(page.locator('text=Commission Preview')).toBeVisible()
    await expect(page.locator('text=Lisa Chen')).toBeVisible()
  })

  test('should navigate between POS and appointments', async ({ page }) => {
    await page.goto('/pos/sale?apptId=appt-001')
    
    // Click back to appointment
    await page.click('button:has-text("Back to Appointment")')
    
    // Should navigate to appointment detail
    await expect(page).toHaveURL('/appointments/appt-001')
    
    // Navigate back to POS
    await page.goBack()
    await expect(page).toHaveURL('/pos/sale?apptId=appt-001')
  })

  test('should update quantities in cart', async ({ page }) => {
    await page.goto('/pos/sale')

    // Add a service
    await page.click('text=Hair Cut & Style')
    
    // Increase quantity
    await page.click('button[aria-label="Increase quantity"]')
    
    // Quantity should be 2
    await expect(page.locator('span.text-center').first()).toHaveText('2')
    
    // Total should update
    await expect(page.locator('text=AED 300.00')).toBeVisible() // 2 * 150
    
    // Decrease quantity
    await page.click('button[aria-label="Decrease quantity"]')
    
    // Quantity should be back to 1
    await expect(page.locator('span.text-center').first()).toHaveText('1')
  })

  test('should remove items from cart', async ({ page }) => {
    await page.goto('/pos/sale')

    // Add multiple items
    await page.click('text=Hair Cut & Style')
    await page.click('text=Hair Color')
    
    // Remove first item
    await page.click('button[aria-label="Remove item"]').first()
    
    // First item should be removed
    await expect(page.locator('text=Hair Cut & Style')).not.toBeVisible()
    
    // Second item should still be there
    await expect(page.locator('text=Hair Color')).toBeVisible()
  })

  test('should search for services', async ({ page }) => {
    await page.goto('/pos/sale')

    // Search for a service
    await page.fill('input[placeholder="Search services..."]', 'keratin')
    
    // Only Keratin Treatment should be visible
    await expect(page.locator('text=Keratin Treatment')).toBeVisible()
    await expect(page.locator('text=Hair Cut & Style')).not.toBeVisible()
    
    // Clear search
    await page.fill('input[placeholder="Search services..."]', '')
    
    // All services should be visible again
    await expect(page.locator('text=Hair Cut & Style')).toBeVisible()
  })

  test('should handle commission calculations', async ({ page }) => {
    await page.goto('/pos/sale')

    // Add services
    await page.click('text=Hair Cut & Style') // 150
    await page.click('text=Hair Color') // 350
    
    // Commission preview should show
    await expect(page.locator('text=Commission Preview')).toBeVisible()
    await expect(page.locator('text=35%')).toBeVisible()
    
    // Service total: 500, Commission: 175
    await expect(page.locator('text=AED 500.00')).toBeVisible()
    await expect(page.locator('text=AED 175.00')).toBeVisible()
    
    // Add a product (should not affect commission)
    await page.click('button:has-text("Products")')
    await page.click('text=Shampoo - Keratin Care')
    
    // Commission should still be 175 (only on services)
    await expect(page.locator('text=AED 175.00')).toBeVisible()
  })
})