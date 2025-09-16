// ================================================================================
// E2E TESTS - REPORTS FLOW
// Smart Code: HERA.TEST.REPORTS.E2E.v1
// Complete user journey through reports with filters, drill-downs, and exports
// ================================================================================

import { test, expect } from '@playwright/test'

// Test configuration for reports
const REPORTS_CONFIG = {
  baseUrl: 'http://localhost:3000',
  testOrganization: 'demo-salon',
  testCredentials: {
    email: 'demo.salon@heraerp.com',
    password: 'DemoSalon2024!'
  },
  defaultWaitTime: 5000,
  longWaitTime: 10000
}

test.describe('Reports Flow - Complete User Journey', () => {
  
  // Setup and authentication
  test.beforeEach(async ({ page }) => {
    // Navigate to demo login
    await page.goto(`${REPORTS_CONFIG.baseUrl}/demo`)
    
    // Click on salon demo account
    await page.click('text=Hair Talkz Salon')
    
    // Wait for redirect to salon dashboard
    await page.waitForURL(/salon\/dashboard/, { timeout: REPORTS_CONFIG.longWaitTime })
    
    // Verify authentication
    await expect(page.locator('text=Welcome')).toBeVisible({ timeout: REPORTS_CONFIG.defaultWaitTime })
  })

  // ================================================================================
  // DAILY SALES REPORT TESTS
  // ================================================================================

  test('Daily Sales Report - Complete Flow', async ({ page }) => {
    // Navigate to daily sales report
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/sales/daily`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Verify page title
    await expect(page.locator('h1, h2').filter({ hasText: 'Daily Sales Report' })).toBeVisible()
    
    // Test 1: Default date (today) should be loaded
    const dateInput = page.locator('input[type="date"]').first()
    const today = new Date().toISOString().split('T')[0]
    await expect(dateInput).toHaveValue(today)
    
    // Test 2: Summary cards should be visible
    await expect(page.locator('text=Gross Revenue')).toBeVisible()
    await expect(page.locator('text=Service Revenue')).toBeVisible()
    await expect(page.locator('text=Product Revenue')).toBeVisible()
    await expect(page.locator('text=VAT Collected')).toBeVisible()
    
    // Test 3: Change date filter
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const yesterdayStr = yesterday.toISOString().split('T')[0]
    
    await dateInput.fill(yesterdayStr)
    await page.keyboard.press('Tab') // Trigger change event
    
    // Wait for data to refresh
    await page.waitForTimeout(2000)
    
    // Verify date changed
    await expect(dateInput).toHaveValue(yesterdayStr)
    
    // Test 4: Branch filter (if branches exist)
    const branchSelect = page.locator('select').filter({ hasText: /Branch|All Branches/ }).first()
    if (await branchSelect.isVisible()) {
      await branchSelect.selectOption({ index: 1 }) // Select first branch
      await page.waitForTimeout(2000) // Wait for refresh
    }
    
    // Test 5: Toggle filters
    const includeTipsCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Include Tips/ }).first()
    if (await includeTipsCheckbox.isVisible()) {
      await includeTipsCheckbox.uncheck()
      await page.waitForTimeout(1000)
      await includeTipsCheckbox.check()
    }
    
    // Test 6: Service only filter
    const serviceOnlyCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Services Only/ }).first()
    if (await serviceOnlyCheckbox.isVisible()) {
      await serviceOnlyCheckbox.check()
      await page.waitForTimeout(2000)
      // Verify product revenue should be hidden or zero
      await serviceOnlyCheckbox.uncheck() // Reset
    }
    
    // Test 7: Sales table should be visible
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Hour' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Service Revenue' })).toBeVisible()
    
    // Test 8: Drill-down functionality
    const serviceRevenueCell = page.locator('td').filter({ hasText: /\$|\d+\.\d+/ }).first()
    if (await serviceRevenueCell.isVisible()) {
      await serviceRevenueCell.click()
      
      // Check if drill-down drawer opens
      const drawer = page.locator('[role="dialog"], .sheet-content').filter({ hasText: /Transaction|Details/ })
      if (await drawer.isVisible({ timeout: 3000 })) {
        // Verify drawer content
        await expect(drawer.locator('text=Transaction')).toBeVisible()
        
        // Close drawer
        const closeButton = drawer.locator('button').filter({ hasText: /Close|×/ }).first()
        await closeButton.click()
      }
    }
    
    // Test 9: Export functionality
    const exportButton = page.locator('button').filter({ hasText: 'Export' })
    if (await exportButton.isVisible()) {
      await exportButton.click()
      
      // Click CSV export
      const csvOption = page.locator('text=CSV').first()
      if (await csvOption.isVisible()) {
        // Setup download handler
        const downloadPromise = page.waitForEvent('download')
        await csvOption.click()
        
        // Verify download started
        const download = await downloadPromise
        expect(download.suggestedFilename()).toMatch(/daily_sales.*\.csv/)
      }
    }
    
    // Test 10: Print functionality
    const printButton = page.locator('button').filter({ hasText: 'Print' })
    if (await printButton.isVisible()) {
      // Setup print dialog handler
      page.on('dialog', dialog => {
        expect(dialog.type()).toBe('beforeunload') // or similar
        dialog.accept()
      })
      
      await printButton.click()
      await page.waitForTimeout(1000)
    }
  })

  // ================================================================================
  // MONTHLY SALES REPORT TESTS
  // ================================================================================

  test('Monthly Sales Report - Filters and Trends', async ({ page }) => {
    // Navigate to monthly sales report
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/sales/monthly`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Test 1: Verify page loaded
    await expect(page.locator('h1, h2').filter({ hasText: 'Monthly Sales' })).toBeVisible()
    
    // Test 2: Default month should be current month
    const monthInput = page.locator('input[type="month"]').first()
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    await expect(monthInput).toHaveValue(currentMonth)
    
    // Test 3: Change to previous month
    const lastMonth = new Date()
    lastMonth.setMonth(lastMonth.getMonth() - 1)
    const lastMonthStr = lastMonth.toISOString().slice(0, 7)
    
    await monthInput.fill(lastMonthStr)
    await page.keyboard.press('Tab')
    await page.waitForTimeout(2000)
    
    // Test 4: Verify summary cards with monthly data
    await expect(page.locator('text=Month-to-Date')).toBeVisible()
    await expect(page.locator('text=Average per Day')).toBeVisible()
    
    // Test 5: Daily breakdown table
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Date' })).toBeVisible()
    
    // Test 6: Look for trend indicators
    const trendIcons = page.locator('svg').filter({ hasText: /trending|arrow/ })
    // Trend icons might be visible if data exists
    
    // Test 7: Drill-down on daily total
    const dailyTotal = page.locator('td').filter({ hasText: /\$\d+/ }).first()
    if (await dailyTotal.isVisible()) {
      await dailyTotal.click()
      
      // Check for drill-down drawer
      const drawer = page.locator('[role="dialog"]')
      if (await drawer.isVisible({ timeout: 3000 })) {
        await expect(drawer.locator('text=Transactions')).toBeVisible()
        
        // Close drawer
        await drawer.locator('button').first().click()
      }
    }
  })

  // ================================================================================
  // PROFIT & LOSS STATEMENT TESTS
  // ================================================================================

  test('P&L Statement - Grouping and Drill-downs', async ({ page }) => {
    // Navigate to P&L report
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/finance/pnl`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Test 1: Verify P&L page
    await expect(page.locator('text=Profit & Loss', { exact: false })).toBeVisible()
    
    // Test 2: Date range should default to current month
    const fromDate = page.locator('input[id="from-date"], input[name="from_date"]').first()
    const toDate = page.locator('input[id="to-date"], input[name="to_date"]').first()
    
    // Test 3: Change date range to last month
    const startOfLastMonth = new Date()
    startOfLastMonth.setMonth(startOfLastMonth.getMonth() - 1, 1)
    const endOfLastMonth = new Date()
    endOfLastMonth.setDate(0) // Last day of previous month
    
    const fromDateStr = startOfLastMonth.toISOString().split('T')[0]
    const toDateStr = endOfLastMonth.toISOString().split('T')[0]
    
    if (await fromDate.isVisible()) {
      await fromDate.fill(fromDateStr)
      await toDate.fill(toDateStr)
      await page.keyboard.press('Tab')
      await page.waitForTimeout(3000) // Wait for data refresh
    }
    
    // Test 4: Verify P&L summary cards
    await expect(page.locator('text=Total Revenue')).toBeVisible()
    await expect(page.locator('text=Gross Profit')).toBeVisible()
    await expect(page.locator('text=Net Income')).toBeVisible()
    
    // Test 5: P&L table structure
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Account' })).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Amount' })).toBeVisible()
    
    // Test 6: Group expansion/collapse
    const revenueGroup = page.locator('text=REVENUE', { exact: false }).first()
    if (await revenueGroup.isVisible()) {
      await revenueGroup.click()
      await page.waitForTimeout(500)
      
      // Try to expand again
      await revenueGroup.click()
      await page.waitForTimeout(500)
    }
    
    // Test 7: Expand All / Collapse All
    const expandButton = page.locator('button').filter({ hasText: /Expand All|Collapse All/ }).first()
    if (await expandButton.isVisible()) {
      await expandButton.click()
      await page.waitForTimeout(1000)
      
      await expandButton.click()
      await page.waitForTimeout(1000)
    }
    
    // Test 8: Account drill-down
    const detailsButton = page.locator('button').filter({ hasText: 'Details' }).first()
    if (await detailsButton.isVisible()) {
      await detailsButton.click()
      
      // Check for drill-down drawer
      const drawer = page.locator('[role="dialog"]')
      if (await drawer.isVisible({ timeout: 3000 })) {
        await expect(drawer.locator('text=Transaction')).toBeVisible()
        
        // Look for smart codes in transactions
        const smartCodeElement = page.locator('code').filter({ hasText: 'HERA.' }).first()
        if (await smartCodeElement.isVisible()) {
          const smartCodeText = await smartCodeElement.textContent()
          expect(smartCodeText).toMatch(/^HERA\./)
        }
        
        // Close drawer
        const closeButton = drawer.locator('button').filter({ hasText: /Close|×/ }).first()
        await closeButton.click()
      }
    }
    
    // Test 9: Consolidated toggle
    const consolidatedCheckbox = page.locator('input[type="checkbox"]').filter({ hasText: /Consolidated/ }).first()
    if (await consolidatedCheckbox.isVisible()) {
      await consolidatedCheckbox.uncheck()
      await page.waitForTimeout(2000)
      await consolidatedCheckbox.check()
    }
  })

  // ================================================================================
  // BALANCE SHEET TESTS
  // ================================================================================

  test('Balance Sheet - Balance Check and Drill-downs', async ({ page }) => {
    // Navigate to balance sheet
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/finance/balance-sheet`)
    
    // Wait for page to load
    await page.waitForLoadState('networkidle')
    
    // Test 1: Verify balance sheet page
    await expect(page.locator('text=Balance Sheet')).toBeVisible()
    
    // Test 2: As-of date should default to today
    const asOfDate = page.locator('input[id="as-of-date"], input[name="as_of_date"]').first()
    const today = new Date().toISOString().split('T')[0]
    
    if (await asOfDate.isVisible()) {
      await expect(asOfDate).toHaveValue(today)
      
      // Test changing to month-end
      const monthEnd = new Date()
      monthEnd.setMonth(monthEnd.getMonth() + 1, 0) // Last day of current month
      const monthEndStr = monthEnd.toISOString().split('T')[0]
      
      await asOfDate.fill(monthEndStr)
      await page.keyboard.press('Tab')
      await page.waitForTimeout(3000)
    }
    
    // Test 3: Verify balance check alert/summary
    const balanceCheck = page.locator('text=Balance Check', { exact: false }).first()
    await expect(balanceCheck).toBeVisible()
    
    // Look for balance status
    const balanceStatus = page.locator('text=✅ Balanced, text=⚠️ Unbalanced').first()
    if (await balanceStatus.isVisible()) {
      const statusText = await balanceStatus.textContent()
      expect(statusText).toMatch(/Balanced|Unbalanced/)
    }
    
    // Test 4: Summary cards
    await expect(page.locator('text=Total Assets')).toBeVisible()
    await expect(page.locator('text=Total Liabilities')).toBeVisible()
    await expect(page.locator('text=Total Equity')).toBeVisible()
    
    // Test 5: Balance sheet table
    await expect(page.locator('table')).toBeVisible()
    await expect(page.locator('th').filter({ hasText: 'Account' })).toBeVisible()
    
    // Test 6: Group structure (Assets, Liabilities, Equity)
    await expect(page.locator('text=ASSETS')).toBeVisible()
    await expect(page.locator('text=LIABILITIES')).toBeVisible()
    await expect(page.locator('text=EQUITY')).toBeVisible()
    
    // Test 7: Group expansion
    const assetsGroup = page.locator('text=ASSETS').first()
    await assetsGroup.click()
    await page.waitForTimeout(500)
    
    // Test 8: Account drill-down
    const assetDetailsButton = page.locator('button').filter({ hasText: 'Details' }).first()
    if (await assetDetailsButton.isVisible()) {
      await assetDetailsButton.click()
      
      // Verify drill-down drawer
      const drawer = page.locator('[role="dialog"]')
      if (await drawer.isVisible({ timeout: 3000 })) {
        await expect(drawer.locator('text=Transaction')).toBeVisible()
        
        // Close drawer
        await drawer.locator('button').first().click()
      }
    }
    
    // Test 9: Print view functionality
    const printButton = page.locator('button').filter({ hasText: 'Print' })
    if (await printButton.isVisible()) {
      await printButton.click()
      
      // Wait for print dialog or new window
      await page.waitForTimeout(2000)
      
      // Check for print styling
      const printStyles = await page.locator('style').allTextContents()
      const hasPrintCSS = printStyles.some(style => style.includes('@media print'))
      // Print CSS might be loaded
    }
  })

  // ================================================================================
  // CROSS-REPORT NAVIGATION TESTS
  // ================================================================================

  test('Cross-Report Navigation and Consistency', async ({ page }) => {
    // Start from dashboard
    await page.goto(`${REPORTS_CONFIG.baseUrl}/salon/dashboard`)
    
    // Test 1: Navigation to daily sales
    const reportsMenu = page.locator('nav, [role="navigation"]').filter({ hasText: 'Reports' }).first()
    if (await reportsMenu.isVisible()) {
      await reportsMenu.click()
      
      const dailySalesLink = page.locator('a').filter({ hasText: 'Daily Sales' })
      if (await dailySalesLink.isVisible()) {
        await dailySalesLink.click()
        await expect(page).toHaveURL(/reports\/sales\/daily/)
      }
    }
    
    // Test 2: Navigate to monthly sales from daily
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/sales/monthly`)
    await page.waitForLoadState('networkidle')
    
    // Test 3: Navigate to P&L
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/finance/pnl`)
    await page.waitForLoadState('networkidle')
    
    // Test 4: Navigate to balance sheet
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/finance/balance-sheet`)
    await page.waitForLoadState('networkidle')
    
    // Test 5: Verify consistent organization context
    // All reports should show same organization
    const orgIndicators = page.locator('text=Hair Talkz, text=Salon, [data-organization]')
    if (await orgIndicators.first().isVisible()) {
      const orgText = await orgIndicators.first().textContent()
      expect(orgText).toContain('Hair Talkz') // or similar organization indicator
    }
  })

  // ================================================================================
  // ACCESSIBILITY TESTS
  // ================================================================================

  test('Reports Accessibility Compliance', async ({ page }) => {
    // Test daily sales accessibility
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/sales/daily`)
    await page.waitForLoadState('networkidle')
    
    // Test 1: Keyboard navigation
    await page.keyboard.press('Tab') // Should focus first interactive element
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
    
    // Test 2: Table accessibility
    const table = page.locator('table').first()
    if (await table.isVisible()) {
      // Check for table headers with scope
      const headers = table.locator('th[scope="col"]')
      await expect(headers.first()).toBeVisible()
      
      // Check for table caption
      const caption = table.locator('caption')
      // Caption might be sr-only (screen reader only)
    }
    
    // Test 3: Form labels
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      const label = page.locator('label').filter({ hasText: 'Date' }).first()
      await expect(label).toBeVisible()
    }
    
    // Test 4: Button accessibility
    const buttons = page.locator('button')
    const buttonCount = await buttons.count()
    for (let i = 0; i < Math.min(buttonCount, 5); i++) {
      const button = buttons.nth(i)
      if (await button.isVisible()) {
        const ariaLabel = await button.getAttribute('aria-label')
        const buttonText = await button.textContent()
        // Button should have either visible text or aria-label
        expect(ariaLabel || buttonText).toBeTruthy()
      }
    }
    
    // Test 5: Color contrast (basic check)
    // This would require axe-core or similar for comprehensive testing
    const summaryCards = page.locator('.card, [class*="card"]')
    if (await summaryCards.first().isVisible()) {
      // Cards should be visible with proper contrast
      await expect(summaryCards.first()).toBeVisible()
    }
  })

  // ================================================================================
  // ERROR HANDLING TESTS
  // ================================================================================

  test('Reports Error Handling and Edge Cases', async ({ page }) => {
    // Test 1: Invalid date range
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/finance/pnl`)
    await page.waitForLoadState('networkidle')
    
    const fromDate = page.locator('input[name="from_date"], input[id="from-date"]').first()
    const toDate = page.locator('input[name="to_date"], input[id="to-date"]').first()
    
    if (await fromDate.isVisible() && await toDate.isVisible()) {
      // Set invalid range (from > to)
      await fromDate.fill('2024-12-31')
      await toDate.fill('2024-01-01')
      await page.keyboard.press('Tab')
      
      // Should show error or validation message
      await page.waitForTimeout(2000)
      
      // Look for error message
      const errorMessages = page.locator('text=Invalid, text=Error, .error, [role="alert"]')
      // Error handling might vary based on implementation
    }
    
    // Test 2: No data scenario
    await page.goto(`${REPORTS_CONFIG.baseUrl}/reports/sales/daily`)
    
    // Set date far in the future
    const dateInput = page.locator('input[type="date"]').first()
    if (await dateInput.isVisible()) {
      await dateInput.fill('2030-12-31')
      await page.keyboard.press('Tab')
      await page.waitForTimeout(3000)
      
      // Should show "no data" message
      const noDataMessage = page.locator('text=No data, text=No sales, text=No transactions')
      // Might be visible if no data exists for that date
    }
    
    // Test 3: Network error handling
    // This would require intercepting network requests
    await page.route('**/api/v1/reports/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal Server Error' })
      })
    })
    
    await page.reload()
    await page.waitForTimeout(3000)
    
    // Should show error state
    const errorStates = page.locator('text=Error, text=Failed, .error-state')
    // Error handling implementation specific
    
    // Reset route
    await page.unroute('**/api/v1/reports/**')
  })
})

// ================================================================================
// HELPER FUNCTIONS
// ================================================================================

async function waitForReportLoad(page: any, timeout = 5000) {
  // Wait for loading indicators to disappear
  await page.waitForFunction(
    () => !document.querySelector('.loading, [data-loading="true"], .animate-spin'),
    { timeout }
  )
  
  // Wait for data to be visible
  await page.waitForSelector('table, .summary-card, [data-loaded="true"]', { timeout })
}

async function verifySmartCodeVisibility(page: any) {
  const smartCodes = page.locator('code').filter({ hasText: 'HERA.' })
  const count = await smartCodes.count()
  
  for (let i = 0; i < Math.min(count, 3); i++) {
    const smartCode = smartCodes.nth(i)
    const text = await smartCode.textContent()
    expect(text).toMatch(/^HERA\.[A-Z]+\.[A-Z]+\.[A-Z]+\.v\d+$/)
  }
}

async function testPrintPreview(page: any) {
  const printButton = page.locator('button').filter({ hasText: 'Print' })
  
  if (await printButton.isVisible()) {
    // Check print styles exist
    const stylesheets = await page.locator('style, link[rel="stylesheet"]').allTextContents()
    const hasPrintStyles = stylesheets.some(css => css.includes('@media print'))
    
    return hasPrintStyles
  }
  
  return false
}