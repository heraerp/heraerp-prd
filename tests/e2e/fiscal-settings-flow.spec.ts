// ================================================================================
// FISCAL SETTINGS E2E TESTS
// End-to-end tests for fiscal settings workflows
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Fiscal Settings Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to fiscal settings page
    await page.goto('/settings/fiscal')
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Fiscal Settings")')
  })

  test('should load fiscal configuration', async ({ page }) => {
    // Check that config fields are present
    await expect(page.locator('label:has-text("Fiscal Year Start")')).toBeVisible()
    await expect(page.locator('label:has-text("Retained Earnings Account")')).toBeVisible()
    await expect(page.locator('label:has-text("Auto-lock After Days")')).toBeVisible()
    
    // Check that periods table or empty state is shown
    const periodsSection = page.locator('text="Fiscal Periods"')
    await expect(periodsSection).toBeVisible()
  })

  test('should update fiscal configuration', async ({ page }) => {
    // Update retained earnings account
    const reAccountInput = page.locator('input[id="retained_earnings_account"]')
    await reAccountInput.clear()
    await reAccountInput.fill('3250')
    
    // Update lock after days
    const lockDaysInput = page.locator('input[id="lock_after_days"]')
    await lockDaysInput.clear()
    await lockDaysInput.fill('10')
    
    // Save configuration
    const saveButton = page.locator('button:has-text("Save Configuration")')
    await saveButton.click()
    
    // Check for success toast
    await expect(page.locator('text="Fiscal Configuration Saved"')).toBeVisible()
    
    // Reload page and verify values persist
    await page.reload()
    await expect(reAccountInput).toHaveValue('3250')
    await expect(lockDaysInput).toHaveValue('10')
  })

  test('should lock an open period', async ({ page }) => {
    // Ensure we have periods (this assumes periods exist in test data)
    const firstLockButton = page.locator('button[aria-label*="Lock"]').first()
    
    if (await firstLockButton.count() > 0) {
      // Click lock button
      await firstLockButton.click()
      
      // Confirm in dialog
      await page.locator('button:has-text("Lock Period")').click()
      
      // Check for success indication
      await expect(page.locator('text="Period locked"').or(page.locator('.badge:has-text("Locked")'))).toBeVisible()
    }
  })

  test('should complete checklist items', async ({ page }) => {
    // Find first unchecked item in checklist
    const firstUnchecked = page.locator('.checkbox:not(:checked)').first()
    
    if (await firstUnchecked.count() > 0) {
      // Check the item
      await firstUnchecked.check()
      
      // Verify it stays checked
      await expect(firstUnchecked).toBeChecked()
      
      // Progress bar should update
      const progress = page.locator('[role="progressbar"]')
      await expect(progress).toBeVisible()
    }
  })

  test('should enable close period when checklist complete', async ({ page }) => {
    // Check all checklist items
    const checklistItems = page.locator('input[type="checkbox"][id^="checklist-"]')
    const count = await checklistItems.count()
    
    for (let i = 0; i < count; i++) {
      const item = checklistItems.nth(i)
      if (!(await item.isChecked())) {
        await item.check()
      }
    }
    
    // Verify "Close Period" button becomes enabled
    const closePeriodButton = page.locator('button:has-text("Close Period")')
    await expect(closePeriodButton).toBeEnabled()
  })

  test('should show year close dialog when all periods closed', async ({ page }) => {
    // Click "Close Fiscal Year" button if enabled
    const closeYearButton = page.locator('button:has-text("Close Fiscal Year")')
    
    if (await closeYearButton.isEnabled()) {
      await closeYearButton.click()
      
      // Verify dialog appears
      await expect(page.locator('text="Close Fiscal Year"').first()).toBeVisible()
      
      // Check required fields
      await expect(page.locator('label:has-text("Fiscal Year")')).toBeVisible()
      await expect(page.locator('label:has-text("Retained Earnings Account")')).toBeVisible()
      
      // Verify confirmation checkbox
      await expect(page.locator('text="I confirm all periods are closed"')).toBeVisible()
    }
  })

  test('should display audit smart codes', async ({ page }) => {
    // Check for smart code display in various places
    await expect(page.locator('text="HERA.FIN.FISCAL.CONFIG.UPDATE.v1"')).toBeVisible()
    
    // Open a confirmation dialog to see smart codes
    const actionButton = page.locator('button[aria-label*="Lock"]').first()
    if (await actionButton.count() > 0) {
      await actionButton.click()
      await expect(page.locator('text="HERA.FIN.FISCAL.PERIOD.LOCK.v1"')).toBeVisible()
    }
  })

  test('should handle validation errors', async ({ page }) => {
    // Try to set invalid lock_after_days
    const lockDaysInput = page.locator('input[id="lock_after_days"]')
    await lockDaysInput.clear()
    await lockDaysInput.fill('100') // Over max of 90
    
    // Try to save
    const saveButton = page.locator('button:has-text("Save Configuration")')
    await saveButton.click()
    
    // Should show error
    await expect(page.locator('text="must be between"').or(page.locator('text="maximum"'))).toBeVisible()
  })

  test('should generate fiscal periods', async ({ page }) => {
    // Click generate periods button
    const generateButton = page.locator('button:has-text("Generate Periods")')
    
    if (await generateButton.isEnabled()) {
      // If periods exist, expect confirmation dialog
      await generateButton.click()
      
      // Handle potential confirmation
      const dialog = page.locator('text="This will replace all existing periods"')
      if (await dialog.isVisible({ timeout: 1000 })) {
        await page.locator('button:has-text("OK")').click()
      }
      
      // Check for success
      await expect(page.locator('text="Periods Generated"').or(page.locator('text="periods created"'))).toBeVisible()
    }
  })
})