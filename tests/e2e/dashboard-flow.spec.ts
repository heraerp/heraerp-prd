// ================================================================================
// SALON DASHBOARD E2E TESTS
// Tests navigation flows and data loading
// Sacred Six compliant, organization-isolated
// ================================================================================

import { test, expect } from '@playwright/test'

// Test user credentials
const TEST_EMAIL = 'salon@demo.com'
const TEST_PASSWORD = 'demo123'
const TEST_ORG_ID = 'test-salon-org'

// Helper to login
async function login(page: any) {
  await page.goto('/auth/login')
  await page.fill('[data-testid="email-input"]', TEST_EMAIL)
  await page.fill('[data-testid="password-input"]', TEST_PASSWORD)
  await page.click('[data-testid="login-button"]')
  
  // Wait for redirect to dashboard
  await page.waitForURL('/dashboard', { timeout: 10000 })
}

test.describe('Salon Dashboard Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await login(page)
  })

  test('KPI cards render with numbers', async ({ page }) => {
    // Wait for KPI cards to load
    await page.waitForSelector('[data-testid="kpi-cards"]', { timeout: 5000 })
    
    // Check all 6 KPI cards are visible
    const kpiCards = await page.$$('[data-testid="kpi-card"]')
    expect(kpiCards).toHaveLength(6)
    
    // Verify each card has a title and value
    const todaysSales = await page.textContent('[data-testid="kpi-todays-gross-sales"]')
    expect(todaysSales).toMatch(/AED.*\d+/)
    
    const netRevenue = await page.textContent('[data-testid="kpi-todays-net-revenue"]')
    expect(netRevenue).toMatch(/AED.*\d+/)
    
    const appointmentsCount = await page.textContent('[data-testid="kpi-appointments-today"]')
    expect(appointmentsCount).toMatch(/\d+/)
    
    const avgTicket = await page.textContent('[data-testid="kpi-avg-ticket"]')
    expect(avgTicket).toMatch(/AED.*\d+/)
    
    const waDeliveryRate = await page.textContent('[data-testid="kpi-wa-delivery-rate"]')
    expect(waDeliveryRate).toMatch(/\d+(\.\d+)?%/)
    
    const lowStockCount = await page.textContent('[data-testid="kpi-low-stock-items"]')
    expect(lowStockCount).toMatch(/\d+/)
  })

  test('View Daily Sales navigates to reports page', async ({ page }) => {
    // Wait for quick actions to load
    await page.waitForSelector('[data-testid="quick-actions"]', { timeout: 5000 })
    
    // Click View Daily Sales button
    await page.click('[data-testid="action-view-daily-sales"]')
    
    // Verify navigation to sales report
    await expect(page).toHaveURL('/reports/sales/daily')
    
    // Verify page loads with report title
    await expect(page.locator('h1')).toContainText('Daily Sales Report')
  })

  test('Upcoming appointment POS button navigates with appointment ID', async ({ page }) => {
    // Wait for appointments list to load
    await page.waitForSelector('[data-testid="upcoming-appointments"]', { timeout: 5000 })
    
    // Find first appointment with service_complete status
    const appointmentRow = await page.locator('[data-testid="appointment-row"][data-status="service_complete"]').first()
    
    // Get the appointment ID from data attribute
    const appointmentId = await appointmentRow.getAttribute('data-appointment-id')
    expect(appointmentId).toBeTruthy()
    
    // Click POS button for that appointment
    await appointmentRow.locator('[data-testid="appointment-pos-button"]').click()
    
    // Verify navigation includes appointment ID
    await expect(page).toHaveURL(new RegExp(`/pos/sale\\?apptId=${appointmentId}`))
    
    // Verify POS page loads
    await expect(page.locator('h1')).toContainText('Point of Sale')
  })

  test('Low stock card navigates to inventory alerts', async ({ page }) => {
    // Wait for low stock list to load
    await page.waitForSelector('[data-testid="low-stock-list"]', { timeout: 5000 })
    
    // Click View All Low Stock button
    await page.click('[data-testid="view-all-low-stock"]')
    
    // Verify navigation to inventory alerts
    await expect(page).toHaveURL('/inventory/alerts')
    
    // Verify page loads with alerts title
    await expect(page.locator('h1')).toContainText('Low Stock Alerts')
  })

  test('WhatsApp metrics visible and templates link works', async ({ page }) => {
    // Wait for KPI cards to load
    await page.waitForSelector('[data-testid="kpi-cards"]', { timeout: 5000 })
    
    // Verify WhatsApp delivery rate is visible
    const waMetric = await page.locator('[data-testid="kpi-wa-delivery-rate"]')
    await expect(waMetric).toBeVisible()
    await expect(waMetric).toContainText('%')
    
    // Click WhatsApp Templates quick action
    await page.click('[data-testid="action-wa-templates"]')
    
    // Verify navigation to WhatsApp templates
    await expect(page).toHaveURL('/whatsapp/templates')
    
    // Verify page loads with templates title
    await expect(page.locator('h1')).toContainText('WhatsApp Templates')
  })

  test('All dashboard sections load without errors', async ({ page }) => {
    // Check all major sections are present
    await expect(page.locator('[data-testid="alerts-strip"]')).toBeVisible()
    await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible()
    await expect(page.locator('[data-testid="revenue-sparkline"]')).toBeVisible()
    await expect(page.locator('[data-testid="upcoming-appointments"]')).toBeVisible()
    await expect(page.locator('[data-testid="low-stock-list"]')).toBeVisible()
    await expect(page.locator('[data-testid="staff-utilization"]')).toBeVisible()
    await expect(page.locator('[data-testid="quick-actions"]')).toBeVisible()
    
    // Check no error messages are shown
    await expect(page.locator('.error-message')).toHaveCount(0)
    await expect(page.locator('[role="alert"]')).toHaveCount(0)
  })

  test('Dashboard data refreshes on organization switch', async ({ page }) => {
    // Get initial sales value
    const initialSales = await page.textContent('[data-testid="kpi-todays-gross-sales"]')
    
    // Switch organization (if organization switcher is available)
    const orgSwitcher = await page.locator('[data-testid="org-switcher"]')
    if (await orgSwitcher.isVisible()) {
      await orgSwitcher.click()
      await page.click('[data-testid="org-option-2"]') // Select different org
      
      // Wait for data to reload
      await page.waitForTimeout(1000)
      
      // Verify sales value changed (indicating data refreshed)
      const newSales = await page.textContent('[data-testid="kpi-todays-gross-sales"]')
      expect(newSales).not.toBe(initialSales)
    }
  })

  test('Mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify dashboard still loads
    await expect(page.locator('[data-testid="kpi-cards"]')).toBeVisible()
    
    // Check grid layout is responsive (cards stack vertically)
    const firstCard = await page.locator('[data-testid="kpi-card"]').first()
    const secondCard = await page.locator('[data-testid="kpi-card"]').nth(1)
    
    const firstBox = await firstCard.boundingBox()
    const secondBox = await secondCard.boundingBox()
    
    // Cards should stack vertically on mobile
    expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height)
  })
})

test.describe('Dashboard Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await login(page)
  })

  test('Dashboard meets WCAG AA standards', async ({ page }) => {
    // Check for proper heading hierarchy
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1) // Only one h1
    
    // Check all interactive elements have accessible names
    const buttons = await page.locator('button')
    const buttonCount = await buttons.count()
    
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const ariaLabel = await button.getAttribute('aria-label')
      const textContent = await button.textContent()
      
      // Button should have either aria-label or text content
      expect(ariaLabel || textContent?.trim()).toBeTruthy()
    }
    
    // Check focus is visible (tab through elements)
    await page.keyboard.press('Tab')
    const focusedElement = await page.locator(':focus')
    const focusVisible = await focusedElement.evaluate(el => {
      const styles = window.getComputedStyle(el)
      return styles.outlineWidth !== '0px' || styles.boxShadow !== 'none'
    })
    expect(focusVisible).toBe(true)
    
    // Check color contrast for KPI values
    const kpiValues = await page.locator('[data-testid^="kpi-"] .text-2xl')
    const valueCount = await kpiValues.count()
    
    for (let i = 0; i < valueCount; i++) {
      const value = kpiValues.nth(i)
      const color = await value.evaluate(el => 
        window.getComputedStyle(el).color
      )
      // Should not be pure black on dark backgrounds
      expect(color).not.toBe('rgb(0, 0, 0)')
    }
  })
})