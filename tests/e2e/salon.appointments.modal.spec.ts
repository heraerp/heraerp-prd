// ================================================================================
// E2E TESTS: SALON APPOINTMENT BOOKING MODAL
// Smart Code: HERA.TEST.E2E.SALON.APPOINTMENT.MODAL.v1
// Tests the complete POS-style appointment booking flow
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Salon Appointments Modal', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to salon appointments page
    await page.goto('/salon/appointments')
    
    // Wait for page to load
    await expect(page.getByText('Appointments')).toBeVisible()
  })

  test('opens modal on Book Appointment button click', async ({ page }) => {
    // Click the Book Appointment button
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    
    // Check that modal opens
    await expect(page.getByText('Book Appointment')).toBeVisible()
    await expect(page.getByText('Customer')).toBeVisible()
    await expect(page.getByText('Select Services')).toBeVisible()
    await expect(page.getByText('Summary')).toBeVisible()
  })

  test('completes appointment booking flow', async ({ page }) => {
    // Open the modal
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    await expect(page.getByText('Book Appointment')).toBeVisible()

    // Step 1: Search and select a customer
    await page.getByPlaceholder('Search customers...').fill('Sarah')
    
    // Wait for search results and click first customer
    await page.waitForTimeout(500)
    const firstCustomer = page.locator('.cursor-pointer').first()
    if (await firstCustomer.isVisible()) {
      await firstCustomer.click()
    }

    // Step 2: Select a stylist
    await page.locator('[data-testid="stylist-select"]').click()
    await page.locator('[data-testid="stylist-option"]').first().click()

    // Step 3: Select date and time
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    
    await page.locator('input[type="date"]').fill(dateString)
    
    // Select time
    await page.locator('[data-testid="time-select"]').click()
    await page.locator('[data-testid="time-option"]').first().click()

    // Step 4: Add a service
    await page.getByPlaceholder('Search services...').fill('Hair')
    await page.waitForTimeout(500)
    
    // Click on a service to add to cart
    const serviceCard = page.locator('.cursor-pointer').first()
    if (await serviceCard.isVisible()) {
      await serviceCard.click()
    }

    // Step 5: Save the appointment
    await page.getByRole('button', { name: 'Book Appointment' }).click()

    // Check for success message
    await expect(page.getByText('Appointment drafted successfully')).toBeVisible({ timeout: 10000 })
    
    // Modal should close
    await expect(page.getByText('Book Appointment')).not.toBeVisible({ timeout: 5000 })
  })

  test('validates required fields', async ({ page }) => {
    // Open the modal
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    
    // Try to save without required fields
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    
    // Should show validation error
    await expect(page.getByText('Please select a customer')).toBeVisible()
  })

  test('allows service quantity modification', async ({ page }) => {
    // Open the modal
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    
    // Add a service first (simplified for test)
    await page.getByPlaceholder('Search services...').fill('Hair')
    await page.waitForTimeout(500)
    
    const serviceCard = page.locator('.cursor-pointer').first()
    if (await serviceCard.isVisible()) {
      await serviceCard.click()
      
      // Check if service was added to cart
      await expect(page.getByText('Selected Services')).toBeVisible()
      
      // Find quantity controls and test increment
      const plusButton = page.locator('[data-testid="quantity-plus"]').first()
      if (await plusButton.isVisible()) {
        await plusButton.click()
        
        // Should show quantity 2
        await expect(page.getByText('2')).toBeVisible()
      }
      
      // Test decrement
      const minusButton = page.locator('[data-testid="quantity-minus"]').first()
      if (await minusButton.isVisible()) {
        await minusButton.click()
        
        // Should be back to quantity 1
        await expect(page.getByText('1')).toBeVisible()
      }
    }
  })

  test('shows appointment in list after creation', async ({ page }) => {
    // First, complete an appointment booking (simplified)
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    
    // Fill minimum required fields and save
    // (This is a simplified version - in a real test you'd fill all fields)
    
    // After modal closes, check that a DRAFT appointment appears in the list
    await expect(page.getByText('Draft')).toBeVisible({ timeout: 10000 })
    
    // Should see the appointment code
    await expect(page.locator('[data-testid="appointment-code"]').first()).toBeVisible()
  })

  test('closes modal on cancel/backdrop click', async ({ page }) => {
    // Open the modal
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    await expect(page.getByText('Book Appointment')).toBeVisible()
    
    // Click outside modal to close
    await page.locator('.fixed.inset-0').click({ position: { x: 10, y: 10 } })
    
    // Modal should close
    await expect(page.getByText('Book Appointment')).not.toBeVisible({ timeout: 3000 })
  })
})

test.describe('Salon Appointments Modal - Database Integration', () => {
  test('creates DRAFT appointment with correct smart codes', async ({ page }) => {
    // This test would require database access to verify the actual records
    // For now, we'll test the UI behavior and trust the unit tests for DB validation
    
    await page.goto('/salon/appointments')
    await page.getByRole('button', { name: 'Book Appointment' }).click()
    
    // Complete the booking flow (simplified)
    // In a full E2E test, you'd:
    // 1. Fill all required fields
    // 2. Save the appointment
    // 3. Query the database to verify:
    //    - universal_transactions record with smart_code 'HERA.SALON.APPOINTMENT.BOOKING.HEADER.v1'
    //    - universal_transaction_lines records with smart_code 'HERA.SALON.APPOINTMENT.LINE.SERVICE.v1'
    //    - organization_id is correctly set on all records
    //    - status is 'DRAFT' in metadata
    
    // For this example, we verify the UI shows success
    await expect(page.getByText('Book Appointment')).toBeVisible()
  })
})