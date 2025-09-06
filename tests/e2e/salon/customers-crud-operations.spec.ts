import { test, expect } from '@playwright/test'

test.describe('Customer CRUD Operations - Full Cycle', () => {
  const timestamp = Date.now()
  const testCustomer = {
    name: `Test Customer ${timestamp}`,
    email: `test.${timestamp}@example.com`,
    phone: '+971 50 123 4567',
    whatsapp: '+971 50 123 4567',
    address: '123 Test Street, Dubai Marina, Dubai, UAE',
    dob: '1990-01-15',
    gender: 'Female',
    hairType: 'Curly',
    skinType: 'Normal', 
    colorFormula: 'Formula #123',
    preferredStaff: 'Rocky',
    preferredLocation: 'Park Regis',
    tags: ['VIP', 'Color Client'],
    marketingConsent: true,
    smsConsent: true,
    whatsappConsent: true
  }
  
  test.beforeEach(async ({ page }) => {
    // Navigate to customers page
    await page.goto('/salon-data/customers')
    await page.waitForLoadState('networkidle')
  })
  
  test('Complete CRUD cycle for customer', async ({ page }) => {
    // Step 1: CREATE - Add new customer
    await test.step('Create new customer', async () => {
      // Click Add Customer button
      await page.click('button:has-text("Add Customer")')
      
      // Wait for modal/form to appear
      await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible()
      
      // Fill in customer details
      await page.fill('input[name="name"], #customerName', testCustomer.name)
      await page.fill('input[name="email"], #email', testCustomer.email)
      await page.fill('input[name="phone"], #phone', testCustomer.phone)
      
      // Fill optional fields if they exist
      const whatsappField = page.locator('input[name="whatsapp"], #whatsapp')
      if (await whatsappField.count() > 0) {
        await whatsappField.fill(testCustomer.whatsapp)
      }
      
      const addressField = page.locator('textarea[name="address"], #address')
      if (await addressField.count() > 0) {
        await addressField.fill(testCustomer.address)
      }
      
      // Personal information
      const dobField = page.locator('input[type="date"][name="dob"], #dob')
      if (await dobField.count() > 0) {
        await dobField.fill(testCustomer.dob)
      }
      
      // Preferences (if dropdowns exist)
      const genderSelect = page.locator('select[name="gender"], #gender')
      if (await genderSelect.count() > 0) {
        await genderSelect.selectOption(testCustomer.gender)
      }
      
      // Marketing consents (checkboxes)
      const marketingCheckbox = page.locator('input[type="checkbox"][name="marketingConsent"], #marketingConsent')
      if (await marketingCheckbox.count() > 0 && testCustomer.marketingConsent) {
        await marketingCheckbox.check()
      }
      
      // Save the customer
      await page.click('button:has-text("Save"), button:has-text("Create Customer"), button[type="submit"]')
      
      // Wait for success message or modal to close
      await Promise.race([
        expect(page.locator('text=/successfully created|saved successfully/i')).toBeVisible(),
        expect(page.locator('.fixed.inset-0, [role="dialog"]')).not.toBeVisible()
      ])
    })
    
    // Step 2: READ - Verify customer appears in list
    await test.step('Verify customer in list', async () => {
      // Search for the created customer
      await page.fill('input[placeholder*="Search"]', testCustomer.name)
      await page.keyboard.press('Enter')
      
      // Wait for search results
      await page.waitForTimeout(500)
      
      // Verify customer appears in the list
      const customerRow = page.locator('tr', { hasText: testCustomer.name })
      await expect(customerRow).toBeVisible()
      
      // Verify email is shown
      await expect(customerRow.locator(`text=${testCustomer.email}`)).toBeVisible()
      
      // Verify phone is shown
      const phoneFormatted = testCustomer.phone.replace(/(\+\d{3})\s(\d{2})\s(\d{3})\s(\d{4})/, '$1 $2 $3 $4')
      await expect(customerRow.locator(`text=/${phoneFormatted}|${testCustomer.phone}/`)).toBeVisible()
    })
    
    // Step 3: READ - View customer details
    await test.step('View customer details', async () => {
      // Click on the customer to open detail modal
      const customerRow = page.locator('tr', { hasText: testCustomer.name })
      await customerRow.locator('td:nth-child(2)').click()
      
      // Wait for detail modal
      await expect(page.locator('.fixed.inset-0')).toBeVisible()
      
      // Verify customer name in modal header
      await expect(page.locator('h2', { hasText: testCustomer.name })).toBeVisible()
      
      // Verify contact information
      await expect(page.locator(`text=${testCustomer.email}`)).toBeVisible()
      await expect(page.locator(`text=/${testCustomer.phone}/`)).toBeVisible()
      
      // Navigate through tabs
      await page.click('button:has-text("Activity")')
      await expect(page.locator('text=/Activity|Recent Activity/')).toBeVisible()
      
      await page.click('button:has-text("Value Programs")')
      await expect(page.locator('text=/Loyalty Points/')).toBeVisible()
      
      // Close modal
      await page.click('button[aria-label*="close"], button:has(.lucide-x)').first()
      await expect(page.locator('.fixed.inset-0')).not.toBeVisible()
    })
    
    // Step 4: UPDATE - Edit customer information
    await test.step('Update customer information', async () => {
      // Open customer detail modal again
      const customerRow = page.locator('tr', { hasText: testCustomer.name })
      await customerRow.locator('td:nth-child(2)').click()
      await expect(page.locator('.fixed.inset-0')).toBeVisible()
      
      // Click Edit Profile button
      await page.click('button:has-text("Edit Profile"), button:has-text("Edit")')
      
      // Update customer information
      const updatedName = `${testCustomer.name} Updated`
      const updatedEmail = `updated.${timestamp}@example.com`
      
      await page.fill('input[name="name"], #customerName', updatedName)
      await page.fill('input[name="email"], #email', updatedEmail)
      
      // Save changes
      await page.click('button:has-text("Save"), button:has-text("Update"), button[type="submit"]')
      
      // Wait for success message
      await expect(page.locator('text=/successfully updated|saved successfully/i')).toBeVisible()
      
      // Close modal
      await page.click('button[aria-label*="close"], button:has(.lucide-x)').first()
      
      // Verify updated information in list
      await page.fill('input[placeholder*="Search"]', updatedName)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      
      const updatedRow = page.locator('tr', { hasText: updatedName })
      await expect(updatedRow).toBeVisible()
      await expect(updatedRow.locator(`text=${updatedEmail}`)).toBeVisible()
    })
    
    // Step 5: DELETE - Remove the customer
    await test.step('Delete customer', async () => {
      // Ensure we have the updated customer in view
      const updatedName = `${testCustomer.name} Updated`
      await page.fill('input[placeholder*="Search"]', updatedName)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      
      // Open customer detail modal
      const customerRow = page.locator('tr', { hasText: updatedName })
      await customerRow.locator('td:nth-child(2)').click()
      await expect(page.locator('.fixed.inset-0')).toBeVisible()
      
      // Look for delete option in modal footer or actions menu
      const moreActionsButton = page.locator('button:has(.lucide-more-vertical), button[aria-label*="more"]')
      if (await moreActionsButton.count() > 0) {
        await moreActionsButton.click()
        await page.click('button:has-text("Delete"), button:has(.lucide-trash-2)')
      } else {
        // Direct delete button
        await page.click('button:has-text("Delete"), button:has(.lucide-trash-2)')
      }
      
      // Confirm deletion in confirmation dialog
      await page.click('button:has-text("Confirm"), button:has-text("Yes"), button:has-text("Delete").last()')
      
      // Wait for success message
      await expect(page.locator('text=/successfully deleted|removed successfully/i')).toBeVisible()
      
      // Verify customer no longer appears in list
      await page.fill('input[placeholder*="Search"]', updatedName)
      await page.keyboard.press('Enter')
      await page.waitForTimeout(500)
      
      const deletedRow = page.locator('tr', { hasText: updatedName })
      await expect(deletedRow).not.toBeVisible()
    })
  })
  
  test('Validate required fields', async ({ page }) => {
    // Click Add Customer
    await page.click('button:has-text("Add Customer")')
    await expect(page.locator('.fixed.inset-0, [role="dialog"]')).toBeVisible()
    
    // Try to save without filling required fields
    await page.click('button:has-text("Save"), button:has-text("Create Customer"), button[type="submit"]')
    
    // Check for validation errors
    await expect(page.locator('text=/required|please enter|must provide/i')).toBeVisible()
    
    // Fill only name and try again
    await page.fill('input[name="name"], #customerName', 'Test Validation')
    await page.click('button:has-text("Save"), button:has-text("Create Customer"), button[type="submit"]')
    
    // Should still show validation for email/phone
    await expect(page.locator('text=/email.*required|phone.*required/i')).toBeVisible()
    
    // Cancel
    await page.click('button:has-text("Cancel"), button[aria-label*="close"]')
  })
  
  test('Test customer quick actions', async ({ page }) => {
    // Get first customer in list
    const firstRow = page.locator('tbody tr:first-child')
    const customerName = await firstRow.locator('td:nth-child(2) p.font-medium').textContent()
    
    // Test Book Appointment action
    await firstRow.locator('button:has(.lucide-calendar)').click()
    // This would navigate to appointment booking or open a booking modal
    // For now, just verify the button is clickable
    
    // Test Send Message action
    await firstRow.locator('button:has(.lucide-message-circle)').click()
    // This would open messaging interface
    
    // Test More Actions menu
    await firstRow.locator('button:has(.lucide-more-vertical)').click()
    // Verify dropdown menu appears with additional options
  })
})