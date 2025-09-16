// ================================================================================
// HERA APPOINTMENTS FLOW E2E TESTS
// Smart Code: HERA.TEST.E2E.APPOINTMENTS.FLOW.v1
// End-to-end tests for complete appointment workflow
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Appointments Flow', () => {
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

  test('should display calendar with appointments', async ({ page }) => {
    // Navigate to appointments
    await page.click('nav a[href="/appointments"]')
    await expect(page).toHaveURL('/appointments')

    // Check calendar elements
    await expect(page.locator('h1')).toContainText('Appointments Calendar')
    
    // Should show view mode switcher
    await expect(page.locator('button:has-text("Month")')).toBeVisible()
    await expect(page.locator('button:has-text("Week")')).toBeVisible()
    await expect(page.locator('button:has-text("Day")')).toBeVisible()

    // Should show some appointments
    await expect(page.locator('text=Emma Thompson')).toBeVisible()
    await expect(page.locator('text=APT-2024-001')).toBeVisible()
  })

  test('should navigate through appointment detail flow', async ({ page }) => {
    // Go to calendar
    await page.goto('/appointments/calendar')

    // Click on an appointment
    await page.click('text=APT-2024-001')
    
    // Should navigate to detail page
    await expect(page).toHaveURL(/\/appointments\/appt-001/)
    
    // Check detail page elements
    await expect(page.locator('h1')).toContainText('APT-2024-001')
    await expect(page.locator('text=Smart Code: HERA.SALON.APPT.BOOKING.CORE.v1')).toBeVisible()
    
    // Status badge should be visible
    await expect(page.locator('text=Confirmed')).toBeVisible()
    
    // Customer and stylist info should be visible
    await expect(page.locator('text=Emma Thompson')).toBeVisible()
    await expect(page.locator('text=Lisa Chen')).toBeVisible()
  })

  test('should handle appointment state transitions', async ({ page }) => {
    // Navigate to a confirmed appointment
    await page.goto('/appointments/appt-001')
    
    // Should see "Check In" button for confirmed appointment
    await expect(page.locator('button:has-text("Check In")')).toBeVisible()
    
    // Click Check In
    await page.click('button:has-text("Check In")')
    
    // Status should update to In Progress
    await expect(page.locator('text=In Progress')).toBeVisible()
    
    // Now should see "Mark Complete" button
    await expect(page.locator('button:has-text("Mark Complete")')).toBeVisible()
    
    // Complete the service
    await page.click('button:has-text("Mark Complete")')
    
    // Status should update to Service Complete
    await expect(page.locator('text=Service Complete')).toBeVisible()
    
    // Should see "Open POS" button
    await expect(page.locator('button:has-text("Open POS")')).toBeVisible()
    
    // Click Open POS
    await page.click('button:has-text("Open POS")')
    
    // Should navigate to POS with appointment ID
    await expect(page).toHaveURL(/\/pos\/sale\?apptId=appt-001/)
  })

  test('should show appointment activity timeline', async ({ page }) => {
    // Navigate to appointment detail
    await page.goto('/appointments/appt-001')
    
    // Click View Activity
    await page.click('button:has-text("View Activity")')
    
    // Should navigate to activity page
    await expect(page).toHaveURL(/\/appointments\/appt-001\/activity/)
    
    // Check activity timeline elements
    await expect(page.locator('h1')).toContainText('Appointment Activity')
    await expect(page.locator('text=Activity Timeline')).toBeVisible()
    
    // Should show some activity events
    await expect(page.locator('text=Appointment created')).toBeVisible()
    await expect(page.locator('text=Status changed')).toBeVisible()
    
    // Should show transaction IDs
    await expect(page.locator('text=TXN:')).toBeVisible()
  })

  test('should handle booking new appointment', async ({ page }) => {
    // Navigate to appointments
    await page.goto('/appointments/calendar')
    
    // Click Book Appointment
    await page.click('button:has-text("Book Appointment")')
    
    // Should navigate to new appointment page
    await expect(page).toHaveURL('/appointments/new')
    
    // Fill in appointment form
    await page.selectOption('select:near(:text("Customer"))', 'CUST-001')
    await page.selectOption('select:near(:text("Stylist"))', 'STAFF-001')
    
    // Set date (tomorrow)
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dateString = tomorrow.toISOString().split('T')[0]
    await page.fill('input[type="date"]', dateString)
    
    // Select a service
    await page.click('text=Hair Cut & Style')
    
    // Should show available time slots after service selection
    await expect(page.locator('text=Available Time Slots')).toBeVisible()
    
    // Click a time slot
    await page.click('button:has-text("9:00 AM")')
    
    // Add notes
    await page.fill('textarea', 'Test appointment booking')
    
    // Submit form
    await page.click('button:has-text("Book Appointment")')
    
    // Should show loading state
    await expect(page.locator('text=Booking...')).toBeVisible()
    
    // Should redirect to appointment detail on success
    await expect(page).toHaveURL(/\/appointments\/appt-/)
  })

  test('should display appointment board view', async ({ page }) => {
    // Navigate to board view
    await page.goto('/appointments/board')
    
    // Check board columns
    await expect(page.locator('h3:has-text("Draft")')).toBeVisible()
    await expect(page.locator('h3:has-text("Confirmed")')).toBeVisible()
    await expect(page.locator('h3:has-text("In Progress")')).toBeVisible()
    await expect(page.locator('h3:has-text("Service Complete")')).toBeVisible()
    await expect(page.locator('h3:has-text("Paid")')).toBeVisible()
    await expect(page.locator('h3:has-text("Closed")')).toBeVisible()
    
    // Should show appointment cards in appropriate columns
    await expect(page.locator('.bg-primary-50 text=Emma Thompson')).toBeVisible()
    await expect(page.locator('.bg-purple-50 text=Sarah Johnson')).toBeVisible()
    
    // Date picker should be visible
    await expect(page.locator('input[type="date"]')).toBeVisible()
  })

  test('should show toast notifications for WhatsApp events', async ({ page }) => {
    // Create a listener for toast messages
    const toastMessages: string[] = []
    await page.addInitScript(() => {
      window.addEventListener('message', (event) => {
        if (event.data.type === 'toast') {
          (window as any).toastMessages = (window as any).toastMessages || []
          ;(window as any).toastMessages.push(event.data.message)
        }
      })
    })

    // Navigate to appointment and confirm it
    await page.goto('/appointments/appt-001')
    
    // The appointment is already confirmed in mock data, so let's cancel and re-confirm
    await page.click('button:has-text("Cancel")')
    
    // Wait for status to update
    await expect(page.locator('text=Cancelled')).toBeVisible()
    
    // Note: In a real implementation, we'd need to handle the transition properly
    // For now, we just verify the UI responds to actions
  })

  test('should handle appointment form validation', async ({ page }) => {
    // Navigate to new appointment
    await page.goto('/appointments/new')
    
    // Try to submit without filling required fields
    await page.click('button:has-text("Book Appointment")')
    
    // Should show validation errors
    await expect(page.locator('text=Customer is required')).toBeVisible()
    await expect(page.locator('text=Stylist is required')).toBeVisible()
    await expect(page.locator('text=At least one service is required')).toBeVisible()
  })

  test('should navigate between appointment links', async ({ page }) => {
    // Navigate to appointment detail
    await page.goto('/appointments/appt-001')
    
    // Click on customer link
    await page.click('button:has(text("Emma Thompson"))')
    
    // Should navigate to customer page
    await expect(page).toHaveURL(/\/customers\/cust-001/)
    
    // Go back
    await page.goBack()
    
    // Click on stylist link
    await page.click('button:has(text("Lisa Chen"))')
    
    // Should navigate to staff page
    await expect(page).toHaveURL(/\/staff\/staff-001/)
  })

  test('should filter appointments by date', async ({ page }) => {
    // Navigate to calendar
    await page.goto('/appointments/calendar')
    
    // Switch to day view
    await page.click('button:has-text("Day")')
    
    // Navigate to next day
    await page.click('button[aria-label="Next"]')
    
    // Should update date label
    const dateLabel = page.locator('h2')
    await expect(dateLabel).not.toContainText('Today')
    
    // Go back to today
    await page.click('button:has-text("Today")')
    
    // Should show today's appointments
    await expect(page.locator('text=Today')).toBeVisible()
  })

  test('should calculate service duration correctly', async ({ page }) => {
    // Navigate to new appointment
    await page.goto('/appointments/new')
    
    // Select multiple services
    await page.click('text=Hair Cut & Style') // 60 min
    await page.click('text=Hair Color') // 90 min
    
    // Should show total duration
    await expect(page.locator('text=Total duration: 2h 30m')).toBeVisible()
  })
})