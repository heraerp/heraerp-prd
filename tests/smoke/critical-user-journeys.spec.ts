// ================================================================================
// CRITICAL USER JOURNEYS SMOKE TEST
// Validates end-to-end workflows for production readiness
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Critical User Journeys', () => {
  
  // Journey 1: WhatsApp Template → Send Message
  test('WhatsApp messaging workflow', async ({ page }) => {
    // Navigate to WhatsApp templates
    await page.goto('/whatsapp/templates')
    await expect(page.locator('h1:has-text("WhatsApp Templates")')).toBeVisible()
    
    // Create template
    await page.locator('button:has-text("Create Template")').click()
    await page.locator('input[name="name"]').fill('appointment_reminder_smoke')
    await page.locator('textarea[name="body"]').fill('Hi {{1}}, reminder about your appointment on {{2}}')
    await page.locator('button:has-text("Save Template")').click()
    
    // Verify template created
    await expect(page.locator('text="Template created successfully"')).toBeVisible()
    await expect(page.locator('td:has-text("appointment_reminder_smoke")')).toBeVisible()
  })

  // Journey 2: Settings → Fiscal Configuration → Period Close
  test('Fiscal period management workflow', async ({ page }) => {
    // Navigate to fiscal settings
    await page.goto('/settings/fiscal')
    await expect(page.locator('h1:has-text("Fiscal Settings")')).toBeVisible()
    
    // Configure fiscal year
    await page.locator('input#retained_earnings_account').fill('3200')
    await page.locator('button:has-text("Save Configuration")').click()
    await expect(page.locator('text="Fiscal Configuration Saved"')).toBeVisible()
    
    // Generate periods
    await page.locator('button:has-text("Generate Periods")').click()
    await expect(page.locator('text="periods created")')).toBeVisible()
    
    // Complete checklist
    const checkboxes = page.locator('input[type="checkbox"][id^="checklist-"]')
    const count = await checkboxes.count()
    for (let i = 0; i < Math.min(count, 3); i++) {
      await checkboxes.nth(i).check()
    }
    
    // Verify progress
    const progress = page.locator('[role="progressbar"]')
    await expect(progress).toBeVisible()
  })

  // Journey 3: Finance Rules → Create Rule → View JSON
  test('Finance DNA rules workflow', async ({ page }) => {
    // Navigate to finance rules
    await page.goto('/finance/rules')
    await expect(page.locator('h1:has-text("Finance DNA Rules")')).toBeVisible()
    
    // Create new rule
    await page.locator('button:has-text("Create Rule")').click()
    await page.locator('input#rule-title').fill('Smoke Test Rule')
    await page.locator('input#rule-smart-code').fill('HERA.TEST.SMOKE.v1')
    await page.locator('textarea[placeholder*="HERA.POS.SALE"]').fill('HERA.SMOKE.TXN.v1')
    
    // Add mapping
    await page.locator('button[role="tab"]:has-text("Mappings")').click()
    await page.locator('button:has-text("Add Mapping")').click()
    await page.locator('input[placeholder="4100"]').fill('4100')
    
    // Save rule
    await page.locator('button:has-text("Save Rule")').click()
    await expect(page.locator('text="Rule Created")')).toBeVisible()
    
    // View JSON
    const ruleCard = page.locator('text="Smoke Test Rule"').locator('..')
    await ruleCard.locator('button:has-text("View JSON")').click()
    await expect(page.locator('text="Copy"')).toBeVisible()
    await page.locator('button:has-text("Close")').click()
  })

  // Journey 4: Year-End Closing Dashboard
  test('Year-end closing workflow', async ({ page }) => {
    // Navigate to closing dashboard
    await page.goto('/finance/closing')
    await expect(page.locator('h1:has-text("Year-End Closing Dashboard")')).toBeVisible()
    
    // Check workflow steps
    const steps = [
      'Revenue Calculation',
      'Expense Calculation',
      'Net Income Determination',
      'Create Closing Journal Entry',
      'Transfer to Retained Earnings',
      'Zero Out P&L Accounts',
      'Branch Eliminations',
      'Consolidated P&L'
    ]
    
    for (const step of steps) {
      await expect(page.locator(`text="${step}"`)).toBeVisible()
    }
    
    // Check prerequisites
    await expect(page.locator('text="Complete closing checklist"')).toBeVisible()
    await expect(page.locator('text="Close all fiscal periods"')).toBeVisible()
    
    // Check smart codes
    await expect(page.locator('text="HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1"')).toBeVisible()
  })

  // Journey 5: Settings Center Navigation
  test('Settings center workflow', async ({ page }) => {
    // Navigate to settings
    await page.goto('/settings')
    
    // Check all sections accessible
    const sections = [
      { link: 'Branch Management', heading: 'Branch Management' },
      { link: 'Role Management', heading: 'Role Management' },
      { link: 'Sales Settings', heading: 'Sales Settings' },
      { link: 'Notification Settings', heading: 'Notification Settings' },
      { link: 'System Settings', heading: 'System Settings' }
    ]
    
    for (const section of sections) {
      await page.locator(`a:has-text("${section.link}")`).click()
      await expect(page.locator(`h1:has-text("${section.heading}")`)).toBeVisible()
      await page.goto('/settings') // Go back
    }
  })

  // Journey 6: Data Integrity Check
  test('Sacred Six compliance check', async ({ page }) => {
    // This test verifies that all features use Sacred Six tables
    
    // Check WhatsApp template storage
    await page.goto('/whatsapp/templates')
    await expect(page.locator('text="core_entities"').or(page.locator('text="Sacred Six"'))).toBeVisible()
    
    // Check Finance Rules storage
    await page.goto('/finance/rules')
    await expect(page.locator('text="core_dynamic_data"')).toBeVisible()
    await expect(page.locator('text="FIN_DNA.RULES"')).toBeVisible()
    
    // Check Settings storage
    await page.goto('/settings/system')
    await expect(page.locator('text="Policy-as-data"').or(page.locator('text="core_dynamic_data"'))).toBeVisible()
  })
})

// Performance smoke test
test.describe('Performance Checks', () => {
  test('Page load times under 3 seconds', async ({ page }) => {
    const pages = [
      '/whatsapp/templates',
      '/settings/fiscal',
      '/finance/closing',
      '/finance/rules'
    ]
    
    for (const url of pages) {
      const startTime = Date.now()
      await page.goto(url)
      const loadTime = Date.now() - startTime
      
      expect(loadTime).toBeLessThan(3000) // 3 seconds
      console.log(`${url} loaded in ${loadTime}ms`)
    }
  })
})