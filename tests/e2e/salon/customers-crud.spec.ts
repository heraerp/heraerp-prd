import { test, expect } from '@playwright/test'
import { Page } from '@playwright/test'

// Test data
const testCustomer = {
  name: 'Test Customer E2E',
  email: 'test.customer.e2e@example.com',
  phone: '+971 50 123 4567',
  whatsapp: '+971 50 123 4567',
  address: '123 Test Street, Dubai, UAE',
  dob: '1990-01-15',
  gender: 'Female',
  hairType: 'Curly',
  skinType: 'Normal',
  preferredStaff: 'Rocky',
  preferredLocation: 'Park Regis',
}

const updatedCustomer = {
  name: 'Test Customer Updated',
  email: 'test.updated@example.com',
  phone: '+971 50 987 6543',
  address: '456 Updated Avenue, Dubai, UAE',
}

// Helper functions
async function navigateToCustomers(page: Page) {
  await page.goto('/salon-data/customers')
  await page.waitForLoadState('networkidle')
  
  // Wait for customer list to load
  await expect(page.locator('table')).toBeVisible()
  await expect(page.getByText('Customers').first()).toBeVisible()
}

async function openCreateCustomerModal(page: Page) {
  await page.click('button:has-text("Add Customer")')
  await expect(page.locator('[role="dialog"], .modal, [data-testid="customer-modal"]')).toBeVisible()
}

async function fillCustomerForm(page: Page, customer: typeof testCustomer) {
  // Basic Information
  await page.fill('input[name="name"], input[placeholder*="name" i]', customer.name)
  await page.fill('input[name="email"], input[placeholder*="email" i]', customer.email)
  await page.fill('input[name="phone"], input[placeholder*="phone" i]', customer.phone)
  
  // Additional fields if visible
  const whatsappInput = page.locator('input[name="whatsapp"], input[placeholder*="whatsapp" i]')
  if (await whatsappInput.isVisible()) {
    await whatsappInput.fill(customer.whatsapp)
  }
  
  const addressInput = page.locator('textarea[name="address"], input[name="address"], textarea[placeholder*="address" i]')
  if (await addressInput.isVisible()) {
    await addressInput.fill(customer.address)
  }
  
  // Personal Information
  const dobInput = page.locator('input[name="dob"], input[type="date"][placeholder*="birth" i]')
  if (await dobInput.isVisible()) {
    await dobInput.fill(customer.dob)
  }
  
  // Gender selection
  const genderSelect = page.locator('select[name="gender"], [data-testid="gender-select"]')
  if (await genderSelect.isVisible()) {
    await genderSelect.selectOption(customer.gender)
  }
  
  // Preferences
  const hairTypeSelect = page.locator('select[name="hairType"], [data-testid="hair-type-select"]')
  if (await hairTypeSelect.isVisible()) {
    await hairTypeSelect.selectOption(customer.hairType)
  }
  
  const skinTypeSelect = page.locator('select[name="skinType"], [data-testid="skin-type-select"]')
  if (await skinTypeSelect.isVisible()) {
    await skinTypeSelect.selectOption(customer.skinType)
  }
  
  // Staff and location preferences
  const staffSelect = page.locator('select[name="preferredStaff"], [data-testid="preferred-staff-select"]')
  if (await staffSelect.isVisible()) {
    await staffSelect.selectOption(customer.preferredStaff)
  }
  
  const locationSelect = page.locator('select[name="preferredLocation"], [data-testid="preferred-location-select"]')
  if (await locationSelect.isVisible()) {
    await locationSelect.selectOption(customer.preferredLocation)
  }
}

async function saveCustomer(page: Page) {
  await page.click('button:has-text("Save"), button:has-text("Create"), button:has-text("Add")')
  
  // Wait for success message or modal to close
  await Promise.race([
    expect(page.locator('.toast-success, [role="alert"]:has-text("success"), .alert-success')).toBeVisible(),
    expect(page.locator('[role="dialog"], .modal, [data-testid="customer-modal"]')).not.toBeVisible()
  ])
}

async function searchCustomer(page: Page, searchTerm: string) {
  const searchInput = page.locator('input[placeholder*="Search" i]')
  await searchInput.fill(searchTerm)
  await searchInput.press('Enter')
  await page.waitForTimeout(500) // Brief wait for search results
}

async function openCustomerDetails(page: Page, customerName: string) {
  // Click on the customer row or name
  const customerRow = page.locator('tr', { hasText: customerName })
  await customerRow.click()
  
  // Wait for detail modal/view to open
  await expect(page.locator('[role="dialog"], .modal, [data-testid="customer-detail"]')).toBeVisible()
}

async function deleteCustomer(page: Page) {
  // Open actions menu if needed
  const moreButton = page.locator('button[aria-label*="more" i], button:has(.lucide-more-vertical)')
  if (await moreButton.isVisible()) {
    await moreButton.click()
  }
  
  // Click delete button
  await page.click('button:has-text("Delete"), button:has(.lucide-trash-2)')
  
  // Confirm deletion
  const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete")')
  if (await confirmButton.isVisible()) {
    await confirmButton.click()
  }
  
  // Wait for success message
  await expect(page.locator('.toast-success, [role="alert"]:has-text("deleted"), .alert-success')).toBeVisible()
}

// Test suite
test.describe('Salon Customers CRUD Operations', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authentication if needed
    // await page.goto('/auth/login')
    // await page.fill('input[name="email"]', 'test@example.com')
    // await page.fill('input[name="password"]', 'password')
    // await page.click('button[type="submit"]')
    
    await navigateToCustomers(page)
  })
  
  test('should display customers list', async ({ page }) => {
    // Check page elements
    await expect(page.getByText('Customers').first()).toBeVisible()
    await expect(page.locator('input[placeholder*="Search" i]')).toBeVisible()
    await expect(page.locator('button:has-text("Add Customer")')).toBeVisible()
    
    // Check summary stats cards
    await expect(page.locator('text=/Total/')).toBeVisible()
    await expect(page.locator('text=/Active/')).toBeVisible()
    await expect(page.locator('text=/VIPs/')).toBeVisible()
    
    // Check table headers
    await expect(page.locator('th:has-text("Customer")')).toBeVisible()
    await expect(page.locator('th:has-text("Contact")')).toBeVisible()
    await expect(page.locator('th:has-text("Last Visit")')).toBeVisible()
    await expect(page.locator('th:has-text("LTV")')).toBeVisible()
    
    // Verify at least one customer is displayed
    const customerRows = page.locator('tbody tr')
    await expect(customerRows).toHaveCount.greaterThan(0)
  })
  
  test('should search and filter customers', async ({ page }) => {
    // Search by name
    await searchCustomer(page, 'Sarah')
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0)
    
    // Clear search
    await page.locator('input[placeholder*="Search" i]').clear()
    await page.keyboard.press('Enter')
    
    // Open filters
    await page.click('button:has-text("Filters")')
    await expect(page.locator('select').first()).toBeVisible()
    
    // Filter by status
    await page.selectOption('select:has-text("All Status")', 'active')
    await page.waitForTimeout(500)
    
    // Verify filtered results
    const statusBadges = page.locator('tbody tr .badge:has-text("active")')
    const rowCount = await page.locator('tbody tr').count()
    const activeBadgeCount = await statusBadges.count()
    
    // Most customers should be active
    expect(activeBadgeCount).toBeGreaterThan(rowCount * 0.8)
  })
  
  test('should open customer detail modal', async ({ page }) => {
    // Get first customer name
    const firstCustomerName = await page.locator('tbody tr:first-child td:nth-child(2) p.font-medium').textContent()
    
    // Click on customer to open detail modal
    await page.locator('tbody tr:first-child td:nth-child(2)').click()
    
    // Wait for modal to open
    await expect(page.locator('.fixed.inset-0')).toBeVisible()
    
    // Verify modal content
    await expect(page.locator('h2', { hasText: firstCustomerName || '' })).toBeVisible()
    
    // Check tabs
    await expect(page.locator('button:has-text("Profile")')).toBeVisible()
    await expect(page.locator('button:has-text("Activity")')).toBeVisible()
    await expect(page.locator('button:has-text("Value Programs")')).toBeVisible()
    
    // Check profile information is displayed
    await expect(page.locator('text=/Contact Information/')).toBeVisible()
    await expect(page.locator('text=/Personal Information/')).toBeVisible()
    
    // Close modal
    await page.locator('button[aria-label*="close" i], button:has(.lucide-x)').first().click()
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible()
  })
  
  test('should navigate between customer detail tabs', async ({ page }) => {
    // Open first customer
    await page.locator('tbody tr:first-child td:nth-child(2)').click()
    await expect(page.locator('.fixed.inset-0')).toBeVisible()
    
    // Click Activity tab
    await page.click('button:has-text("Activity")')
    await expect(page.locator('text=/Activity|Financial Transactions|Recent Activity/')).toBeVisible()
    
    // Click Value Programs tab
    await page.click('button:has-text("Value Programs")')
    await expect(page.locator('text=/Loyalty Points|Membership|Gift Cards/')).toBeVisible()
    
    // Click Files tab
    await page.click('button:has-text("Files")')
    await expect(page.locator('text=/No files uploaded|Upload Files/')).toBeVisible()
    
    // Click Ledger tab
    await page.click('button:has-text("Ledger")')
    await expect(page.locator('text=/Financial Transactions|Export/')).toBeVisible()
    
    // Return to Profile tab
    await page.click('button:has-text("Profile")')
    await expect(page.locator('text=/Contact Information/')).toBeVisible()
    
    // Close modal
    await page.keyboard.press('Escape')
    await expect(page.locator('.fixed.inset-0')).not.toBeVisible()
  })
  
  test('should handle customer selection and bulk actions', async ({ page }) => {
    // Select all customers
    const selectAllCheckbox = page.locator('thead input[type="checkbox"]')
    await selectAllCheckbox.click()
    
    // Verify selection count appears
    await expect(page.locator('text=/selected/')).toBeVisible()
    
    // Verify bulk action buttons appear
    await expect(page.locator('button:has-text("Message")')).toBeVisible()
    await expect(page.locator('button:has-text("Tag")')).toBeVisible()
    await expect(page.locator('button:has-text("Export")')).toBeVisible()
    
    // Unselect all
    await selectAllCheckbox.click()
    await expect(page.locator('text=/selected/')).not.toBeVisible()
    
    // Select individual customers
    await page.locator('tbody tr:nth-child(1) input[type="checkbox"]').click()
    await page.locator('tbody tr:nth-child(2) input[type="checkbox"]').click()
    await expect(page.locator('text=/2 selected/')).toBeVisible()
  })
  
  test('should display customer segments correctly', async ({ page }) => {
    // Check for different segment badges
    const segments = ['VIP', 'Loyal', 'New', 'Regular', 'At Risk']
    
    for (const segment of segments) {
      const segmentBadge = page.locator(`.badge:has-text("${segment}")`)
      if (await segmentBadge.count() > 0) {
        await expect(segmentBadge.first()).toBeVisible()
      }
    }
  })
  
  test('should show customer value information', async ({ page }) => {
    // Check that LTV, loyalty points, and membership info are displayed
    const firstRow = page.locator('tbody tr:first-child')
    
    // Check LTV column
    const ltvText = await firstRow.locator('td:nth-child(6)').textContent()
    expect(ltvText).toMatch(/AED|[0-9]/)
    
    // Check loyalty column (may have points or membership)
    const loyaltyCell = firstRow.locator('td:nth-child(7)')
    const loyaltyText = await loyaltyCell.textContent()
    expect(loyaltyText).toBeTruthy()
  })
  
  test('should handle pagination', async ({ page }) => {
    // Check pagination controls
    await expect(page.locator('text=/Showing 1 to/')).toBeVisible()
    
    const nextButton = page.locator('button:has-text("Next")')
    const prevButton = page.locator('button:has-text("Previous")')
    
    await expect(prevButton).toBeVisible()
    await expect(nextButton).toBeVisible()
    
    // Previous should be disabled on first page
    await expect(prevButton).toBeDisabled()
    
    // If there are more than 20 customers, Next should be enabled
    const totalText = await page.locator('text=/Showing 1 to/').textContent()
    if (totalText && totalText.includes('of') && parseInt(totalText.split('of')[1]) > 20) {
      await expect(nextButton).not.toBeDisabled()
    }
  })
  
  test('should handle empty search results', async ({ page }) => {
    // Search for non-existent customer
    await searchCustomer(page, 'NonExistentCustomer12345')
    
    // Should show no results
    const rowCount = await page.locator('tbody tr').count()
    expect(rowCount).toBe(0)
    
    // Clear search to restore results
    await page.locator('input[placeholder*="Search" i]').clear()
    await page.keyboard.press('Enter')
    await expect(page.locator('tbody tr')).toHaveCount.greaterThan(0)
  })
  
  test.describe('Mobile Responsiveness', () => {
    test.use({ viewport: { width: 375, height: 667 } })
    
    test('should be responsive on mobile', async ({ page }) => {
      await navigateToCustomers(page)
      
      // Check mobile layout
      await expect(page.getByText('Customers').first()).toBeVisible()
      await expect(page.locator('button:has-text("Add Customer")')).toBeVisible()
      
      // Table should be scrollable
      const table = page.locator('table')
      await expect(table).toBeVisible()
      
      // Open customer detail on mobile
      await page.locator('tbody tr:first-child').click()
      await expect(page.locator('.fixed.inset-0')).toBeVisible()
      
      // Modal should be full screen on mobile
      const modal = page.locator('.fixed.inset-0 > div')
      await expect(modal).toBeVisible()
      
      // Close modal
      await page.locator('button:has(.lucide-x)').first().click()
    })
  })
})