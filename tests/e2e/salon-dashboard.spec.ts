// ================================================================================
// SALON DASHBOARD E2E TESTS
// Smart Code: HERA.SALON.DASHBOARD.E2E.v1
// End-to-end tests for salon dashboard and navigation
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Salon Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to demo page
    await page.goto('/demo')
    
    // Click on Salon demo
    await page.click('text=Salon Management')
    
    // Wait for dashboard to load
    await page.waitForURL('**/dashboard')
  })

  test('should display all dashboard components', async ({ page }) => {
    // Check page header
    await expect(page.locator('h1:has-text("Dashboard")')).toBeVisible()
    
    // Check KPI cards (6 cards)
    const kpiCards = page.locator('[data-testid="kpi-card"]')
    await expect(kpiCards).toHaveCount(6)
    
    // Check specific KPI values are displayed
    await expect(page.locator('text=Today\'s Gross Sales')).toBeVisible()
    await expect(page.locator('text=Today\'s Net Revenue')).toBeVisible()
    await expect(page.locator('text=Appointments Today')).toBeVisible()
    await expect(page.locator('text=Average Ticket Size')).toBeVisible()
    await expect(page.locator('text=WhatsApp Delivered')).toBeVisible()
    await expect(page.locator('text=Low Stock Items')).toBeVisible()
    
    // Check alerts strip
    await expect(page.locator('[data-testid="alerts-strip"]')).toBeVisible()
    
    // Check revenue sparkline chart
    await expect(page.locator('[data-testid="revenue-sparkline"]')).toBeVisible()
    
    // Check upcoming appointments
    await expect(page.locator('text=Upcoming Appointments')).toBeVisible()
    
    // Check low stock list
    await expect(page.locator('text=Low Stock Items')).toBeVisible()
    
    // Check staff utilization
    await expect(page.locator('text=Staff Utilization Today')).toBeVisible()
    
    // Check quick actions
    await expect(page.locator('text=Quick Actions')).toBeVisible()
  })

  test('should navigate to appointments from dashboard', async ({ page }) => {
    // Click on an appointment link
    const appointmentLink = page.locator('a[href*="/appointments/"]').first()
    await appointmentLink.click()
    
    // Should navigate to appointments page
    await expect(page).toHaveURL(/\/appointments/)
  })

  test('should navigate to POS from appointment', async ({ page }) => {
    // Click on POS link in appointment
    const posLink = page.locator('a[href*="/pos/sale?apptId="]').first()
    await posLink.click()
    
    // Should navigate to POS with appointment ID
    await expect(page).toHaveURL(/\/pos\/sale\?apptId=/)
  })

  test('should show quick actions and navigate correctly', async ({ page }) => {
    // Test New Appointment button
    await page.click('text=New Appointment')
    await expect(page).toHaveURL(/\/appointments\/new/)
    await page.goBack()
    
    // Test Quick Sale button
    await page.click('text=Quick Sale')
    await expect(page).toHaveURL(/\/pos\/sale/)
    await page.goBack()
    
    // Test WhatsApp Campaign button
    await page.click('text=WhatsApp Campaign')
    await expect(page).toHaveURL(/\/whatsapp\/campaigns\/new/)
    await page.goBack()
    
    // Test Add Expense button
    await page.click('text=Add Expense')
    await expect(page).toHaveURL(/\/finance\/expenses\/new/)
  })

  test('should display role-based navigation in sidebar', async ({ page }) => {
    // Open sidebar on mobile
    const menuButton = page.locator('button[aria-label="Menu"]')
    if (await menuButton.isVisible()) {
      await menuButton.click()
    }
    
    // Check owner/manager navigation items
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Appointments")')).toBeVisible()
    await expect(page.locator('nav a:has-text("POS")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Inventory")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Reports")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Finance")')).toBeVisible()
    await expect(page.locator('nav a:has-text("WhatsApp")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Settings")')).toBeVisible()
  })

  test('should show demo mode indicator and exit demo', async ({ page }) => {
    // Check for demo mode indicator
    await expect(page.locator('text=Demo Mode')).toBeVisible()
    
    // Click Exit Demo
    await page.click('text=Exit Demo')
    
    // Should navigate back to demo selection
    await expect(page).toHaveURL('/demo')
  })
})

test.describe('Accountant Dashboard', () => {
  test('should display accountant dashboard for accountant role', async ({ page, context }) => {
    // Set accountant role in session
    await context.addCookies([
      {
        name: 'demo_role',
        value: 'accountant',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    // Navigate to accountant dashboard
    await page.goto('/accountant')
    
    // Check page header
    await expect(page.locator('h1:has-text("Financial Dashboard")')).toBeVisible()
    
    // Check financial KPIs
    await expect(page.locator('text=Monthly Revenue')).toBeVisible()
    await expect(page.locator('text=Outstanding Receivables')).toBeVisible()
    await expect(page.locator('text=Monthly Expenses')).toBeVisible()
    await expect(page.locator('text=Net Profit Margin')).toBeVisible()
    
    // Check reports section
    await expect(page.locator('text=Financial Reports')).toBeVisible()
    await expect(page.locator('text=Profit & Loss Statement')).toBeVisible()
    await expect(page.locator('text=Balance Sheet')).toBeVisible()
    
    // Check pending tasks
    await expect(page.locator('text=Pending Tasks')).toBeVisible()
    
    // Check compliance alerts
    await expect(page.locator('text=Compliance Reminders')).toBeVisible()
  })

  test('should show accountant-specific navigation', async ({ page, context }) => {
    // Set accountant role
    await context.addCookies([
      {
        name: 'demo_role',
        value: 'accountant',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    await page.goto('/accountant')
    
    // Check accountant navigation
    await expect(page.locator('nav a:has-text("Dashboard")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Reports")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Period Closing")')).toBeVisible()
    await expect(page.locator('nav a:has-text("GL Rules")')).toBeVisible()
    
    // Should NOT see operational items
    await expect(page.locator('nav a:has-text("Appointments")')).not.toBeVisible()
    await expect(page.locator('nav a:has-text("POS")')).not.toBeVisible()
  })
})

test.describe('Role-Based Access Control', () => {
  test('should redirect stylist to appointments', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'demo_role',
        value: 'stylist',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    // Try to access dashboard
    await page.goto('/dashboard')
    
    // Should be redirected to appointments
    await expect(page).toHaveURL(/\/appointments/)
  })

  test('should redirect cashier to POS', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'demo_role',
        value: 'cashier',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    // Try to access dashboard
    await page.goto('/dashboard')
    
    // Should be redirected to POS
    await expect(page).toHaveURL(/\/pos\/sale/)
  })

  test('should block unauthorized access', async ({ page, context }) => {
    await context.addCookies([
      {
        name: 'demo_role',
        value: 'customer',
        domain: 'localhost',
        path: '/'
      }
    ])
    
    // Try to access admin areas
    await page.goto('/finance/closing')
    
    // Should be redirected to customer area
    await expect(page).toHaveURL(/\/customer/)
  })
})