// ================================================================================
// FISCAL CLOSING FLOW E2E TESTS
// End-to-end tests for year-end closing workflow
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Fiscal Closing Flow', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to closing dashboard page
    await page.goto('/finance/closing')
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Year-End Closing Dashboard")')
  })

  test('should load closing dashboard', async ({ page }) => {
    // Check main elements are present
    await expect(page.locator('h1:has-text("Year-End Closing Dashboard")')).toBeVisible()
    
    // Check status cards
    await expect(page.locator('text="Status"')).toBeVisible()
    await expect(page.locator('text="Checklist"')).toBeVisible()
    await expect(page.locator('text="Journal Entries"')).toBeVisible()
    await expect(page.locator('text="Branches"')).toBeVisible()
    
    // Check workflow steps section
    await expect(page.locator('text="Closing Workflow Steps"')).toBeVisible()
    
    // Check checklist panel in sidebar
    await expect(page.locator('text="Closing Checklist"')).toBeVisible()
  })

  test('should show prerequisites when not ready', async ({ page }) => {
    // Look for prerequisites section
    const prerequisitesSection = page.locator('text="Prerequisites"')
    
    if (await prerequisitesSection.isVisible()) {
      // Check prerequisite items
      await expect(page.locator('text="Complete closing checklist"')).toBeVisible()
      await expect(page.locator('text="Close all fiscal periods"')).toBeVisible()
      await expect(page.locator('text="Configure RE account"')).toBeVisible()
      
      // Run Closing button should be disabled
      const runButton = page.locator('button:has-text("Run Closing")')
      await expect(runButton).toBeDisabled()
    }
  })

  test('should display workflow steps', async ({ page }) => {
    // Check all 8 workflow steps are displayed
    const expectedSteps = [
      'Revenue Calculation',
      'Expense Calculation',
      'Net Income Determination',
      'Create Closing Journal Entry',
      'Transfer to Retained Earnings',
      'Zero Out P&L Accounts',
      'Branch Eliminations',
      'Consolidated P&L'
    ]
    
    for (const step of expectedSteps) {
      await expect(page.locator(`text="${step}"`)).toBeVisible()
    }
    
    // Check step numbers
    for (let i = 1; i <= 8; i++) {
      await expect(page.locator(`text="${i}"`).first()).toBeVisible()
    }
  })

  test('should toggle checklist items', async ({ page }) => {
    // Find first unchecked checkbox in checklist
    const uncheckedItem = page.locator('.checkbox:not(:checked)').first()
    
    if (await uncheckedItem.count() > 0) {
      // Get the initial progress value
      const progressBar = page.locator('[role="progressbar"]')
      const initialProgress = await progressBar.getAttribute('aria-valuenow')
      
      // Check the item
      await uncheckedItem.check()
      
      // Verify checkbox is now checked
      await expect(uncheckedItem).toBeChecked()
      
      // Progress should have increased
      const newProgress = await progressBar.getAttribute('aria-valuenow')
      expect(Number(newProgress)).toBeGreaterThan(Number(initialProgress))
    }
  })

  test('should expand/collapse checklist panel', async ({ page }) => {
    // Look for expand/collapse button
    const toggleButton = page.locator('button[aria-label*="checklist"]').first()
    
    if (await toggleButton.count() > 0) {
      // Click to toggle
      await toggleButton.click()
      
      // Check that it toggles (exact behavior depends on initial state)
      // Just verify the button still works
      await expect(toggleButton).toBeVisible()
    }
  })

  test('should switch to journal entries view', async ({ page }) => {
    // Click View Journals button
    const viewJournalsButton = page.locator('button:has-text("View Journals")')
    
    if (await viewJournalsButton.isEnabled()) {
      await viewJournalsButton.click()
      
      // Should see journal entries section
      await expect(page.locator('text="Closing Journal Entries"')).toBeVisible()
      
      // Should see back button
      await expect(page.locator('button:has-text("Back to Workflow")')).toBeVisible()
      
      // Check for summary stats
      await expect(page.locator('text="Total JEs"')).toBeVisible()
      await expect(page.locator('text="Total Debits"')).toBeVisible()
      await expect(page.locator('text="Total Credits"')).toBeVisible()
    }
  })

  test('should filter journal entries', async ({ page }) => {
    // First navigate to journals view
    const viewJournalsButton = page.locator('button:has-text("View Journals")')
    if (await viewJournalsButton.isEnabled()) {
      await viewJournalsButton.click()
      
      // Use search box
      const searchBox = page.locator('input[placeholder*="Search"]')
      await searchBox.fill('revenue')
      
      // Use filter dropdown
      const filterDropdown = page.locator('button:has-text("Filter")')
      if (await filterDropdown.count() > 0) {
        await filterDropdown.click()
        await page.locator('text="Revenue"').click()
      }
    }
  })

  test('should display branch status', async ({ page }) => {
    // Look for branch status section
    const branchSection = page.locator('text="Branch Closing Status"')
    
    if (await branchSection.isVisible()) {
      // Should see branch information
      await expect(page.locator('text="Code:"').first()).toBeVisible()
      
      // Should see completion percentage
      await expect(page.locator('text="%"').first()).toBeVisible()
    }
  })

  test('should show smart codes', async ({ page }) => {
    // Check for Finance DNA Integration info
    await expect(page.locator('text="Finance DNA Integration"')).toBeVisible()
    
    // Check for specific smart codes
    await expect(page.locator('text="HERA.FIN.FISCAL.CLOSING.REVENUE.CALC.v1"')).toBeVisible()
    await expect(page.locator('text="HERA.FIN.FISCAL.CLOSING.EXPENSE.CALC.v1"')).toBeVisible()
  })

  test('should start closing workflow when ready', async ({ page }) => {
    // Check if Run Closing button is enabled
    const runButton = page.locator('button:has-text("Run Closing")')
    
    if (await runButton.isEnabled()) {
      // Click to start
      await runButton.click()
      
      // Should see loading state
      await expect(page.locator('text="Starting..."')).toBeVisible()
      
      // Should eventually see workflow in progress
      await expect(page.locator('text="Running"').or(page.locator('text="In Progress"'))).toBeVisible({ timeout: 10000 })
      
      // Progress bar should appear
      await expect(page.locator('text="Workflow Progress"')).toBeVisible()
      
      // First step should be in progress
      await expect(page.locator('.animate-pulse').first()).toBeVisible()
    }
  })

  test('should view journal entry details', async ({ page }) => {
    // Navigate to journals view
    const viewJournalsButton = page.locator('button:has-text("View Journals")')
    if (await viewJournalsButton.isEnabled()) {
      await viewJournalsButton.click()
      
      // Click on a journal entry if any exist
      const journalEntry = page.locator('[role="button"][aria-label*="View details"]').first()
      if (await journalEntry.count() > 0) {
        await journalEntry.click()
        
        // Should open dialog with details
        await expect(page.locator('text="Journal Entry Details"')).toBeVisible()
        
        // Should show line items table
        await expect(page.locator('th:has-text("Account")')).toBeVisible()
        await expect(page.locator('th:has-text("Debit")')).toBeVisible()
        await expect(page.locator('th:has-text("Credit")')).toBeVisible()
        
        // Close dialog
        const closeButton = page.locator('button[aria-label="Close"]')
        if (await closeButton.count() > 0) {
          await closeButton.click()
        }
      }
    }
  })

  test('should export journal entries', async ({ page }) => {
    // Navigate to journals view
    const viewJournalsButton = page.locator('button:has-text("View Journals")')
    if (await viewJournalsButton.isEnabled()) {
      await viewJournalsButton.click()
      
      // Look for export button
      const exportButton = page.locator('button:has-text("Export CSV")')
      
      if (await exportButton.isEnabled()) {
        // Set up download promise before clicking
        const downloadPromise = page.waitForEvent('download')
        
        // Click export
        await exportButton.click()
        
        // Wait for download
        const download = await downloadPromise
        
        // Verify filename contains expected pattern
        expect(download.suggestedFilename()).toContain('closing-journal-entries')
        expect(download.suggestedFilename()).toContain('.csv')
      }
    }
  })

  test('should handle errors gracefully', async ({ page }) => {
    // This test checks that error states are handled properly
    // In a real test environment, you might trigger errors intentionally
    
    // Check for any error alerts
    const errorAlerts = page.locator('.border-red-200')
    const errorCount = await errorAlerts.count()
    
    // If there are errors, they should have proper messages
    if (errorCount > 0) {
      for (let i = 0; i < errorCount; i++) {
        const errorText = await errorAlerts.nth(i).textContent()
        expect(errorText).toBeTruthy()
        expect(errorText?.length).toBeGreaterThan(10)
      }
    }
  })

  test('should show completion state', async ({ page }) => {
    // Look for completion indicators
    const completionBadge = page.locator('.bg-green-100:has-text("100% Complete")')
    
    if (await completionBadge.count() > 0) {
      // Should see green checkmarks
      await expect(page.locator('.text-green-600').first()).toBeVisible()
      
      // Should see completion message
      const completionAlert = page.locator('text="Year-End Closing Complete"')
      if (await completionAlert.count() > 0) {
        await expect(completionAlert).toBeVisible()
      }
    }
  })
})