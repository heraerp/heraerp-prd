// ================================================================================
// FINANCE RULES VIEWER E2E TESTS
// End-to-end tests for Finance DNA rules management
// ================================================================================

import { test, expect } from '@playwright/test'

test.describe('Finance Rules Viewer', () => {
  
  test.beforeEach(async ({ page }) => {
    // Navigate to finance rules page
    await page.goto('/finance/rules')
    
    // Wait for page to load
    await page.waitForSelector('h1:has-text("Finance DNA Rules")')
  })

  test('should load rules viewer', async ({ page }) => {
    // Check main elements are present
    await expect(page.locator('h1:has-text("Finance DNA Rules")')).toBeVisible()
    await expect(page.locator('button:has-text("Create Rule")')).toBeVisible()
    
    // Check filter bar is present
    await expect(page.locator('input[placeholder*="Search by key or title"]')).toBeVisible()
    await expect(page.locator('button:has-text("Category")')).toBeVisible()
    await expect(page.locator('label:has-text("Enabled only")')).toBeVisible()
  })

  test('should filter by category', async ({ page }) => {
    // Click category filter
    const categoryButton = page.locator('button:has-text("Category")')
    await categoryButton.click()
    
    // Select POS category
    await page.locator('.hera-select-item:has-text("POS")').click()
    
    // Check that only POS rules are visible (if any exist)
    const ruleCards = page.locator('[class*="Card"]').filter({ hasText: 'POS' })
    const count = await ruleCards.count()
    
    if (count > 0) {
      // All visible cards should have POS category
      for (let i = 0; i < count; i++) {
        await expect(ruleCards.nth(i).locator('.badge:has-text("pos")')).toBeVisible()
      }
    }
  })

  test('should toggle enabled only filter', async ({ page }) => {
    // Get initial count
    const initialCards = await page.locator('[class*="Card"][class*="hover:shadow-md"]').count()
    
    // Toggle enabled only
    const enabledSwitch = page.locator('input#enabled-only')
    await enabledSwitch.check()
    
    // Count should be less than or equal to initial
    const filteredCards = await page.locator('[class*="Card"][class*="hover:shadow-md"]').count()
    expect(filteredCards).toBeLessThanOrEqual(initialCards)
  })

  test('should open create rule dialog', async ({ page }) => {
    // Click Create Rule button
    await page.locator('button:has-text("Create Rule")').click()
    
    // Dialog should open
    await expect(page.locator('text="Create Posting Rule"')).toBeVisible()
    
    // Check tabs are present
    await expect(page.locator('button[role="tab"]:has-text("General")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("Mappings")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("Conditions")')).toBeVisible()
    await expect(page.locator('button[role="tab"]:has-text("Preview")')).toBeVisible()
    
    // Check form fields
    await expect(page.locator('input#rule-key')).toBeVisible()
    await expect(page.locator('input#rule-title')).toBeVisible()
    await expect(page.locator('input#rule-smart-code')).toBeVisible()
    
    // Close dialog
    await page.locator('button:has-text("Cancel")').click()
  })

  test('should edit a rule', async ({ page }) => {
    // Find first rule card
    const firstRuleCard = page.locator('[class*="Card"][class*="hover:shadow-md"]').first()
    
    if (await firstRuleCard.count() > 0) {
      // Click Edit button
      await firstRuleCard.locator('button:has-text("Edit")').click()
      
      // Dialog should open with Edit title
      await expect(page.locator('text="Edit Posting Rule"')).toBeVisible()
      
      // Key field should be disabled in edit mode
      const keyInput = page.locator('input#rule-key')
      await expect(keyInput).toBeDisabled()
      
      // Should see warning about key changes
      await expect(page.locator('text="Key cannot be changed"')).toBeVisible()
      
      // Edit title
      const titleInput = page.locator('input#rule-title')
      await titleInput.clear()
      await titleInput.fill('Updated Rule Title')
      
      // Save
      await page.locator('button:has-text("Save Rule")').click()
      
      // Should see success toast
      await expect(page.locator('text="Rule Saved"')).toBeVisible()
    }
  })

  test('should clone rule to new version', async ({ page }) => {
    // Find first rule card
    const firstRuleCard = page.locator('[class*="Card"][class*="hover:shadow-md"]').first()
    
    if (await firstRuleCard.count() > 0) {
      // Get current version
      const versionBadge = firstRuleCard.locator('.badge:has-text("v")')
      const versionText = await versionBadge.textContent()
      
      // Click Clone button
      await firstRuleCard.locator('button:has-text("Clone to")').click()
      
      // Should see success toast
      await expect(page.locator('text="Rule Cloned"')).toBeVisible()
      
      // New rule should appear (disabled by default)
      const nextVersion = versionText ? `v${parseInt(versionText.slice(1)) + 1}` : 'v2'
      await expect(page.locator(`.badge:has-text("${nextVersion}")`)).toBeVisible()
    }
  })

  test('should view rule JSON', async ({ page }) => {
    // Find first rule card
    const firstRuleCard = page.locator('[class*="Card"][class*="hover:shadow-md"]').first()
    
    if (await firstRuleCard.count() > 0) {
      // Click View JSON button
      await firstRuleCard.locator('button:has-text("View JSON")').click()
      
      // JSON viewer should open
      await expect(page.locator('text="Copy"')).toBeVisible()
      await expect(page.locator('text="Collapse"').or(page.locator('text="Expand"'))).toBeVisible()
      
      // Should see smart code as badge in JSON
      await expect(page.locator('.badge:has-text("HERA.")')).toBeVisible()
      
      // Close JSON view
      await page.locator('button:has-text("Close")').click()
    }
  })

  test('should manage mappings in editor', async ({ page }) => {
    // Open create dialog
    await page.locator('button:has-text("Create Rule")').click()
    
    // Switch to Mappings tab
    await page.locator('button[role="tab"]:has-text("Mappings")').click()
    
    // Should see empty state
    await expect(page.locator('text="No mappings defined"')).toBeVisible()
    
    // Add mapping
    await page.locator('button:has-text("Add Mapping")').click()
    
    // Should see mapping row
    await expect(page.locator('input[placeholder="4100"]')).toBeVisible()
    
    // Fill mapping details
    await page.locator('input[placeholder="4100"]').fill('4100')
    await page.locator('button:has-text("Debit")').first().click()
    await page.locator('.hera-select-item:has-text("Credit")').click()
    
    // Add another mapping
    await page.locator('button:has-text("Add Mapping")').click()
    
    // Should have 2 rows
    const mappingRows = page.locator('tbody tr')
    await expect(mappingRows).toHaveCount(2)
    
    // Remove first mapping
    await page.locator('button[aria-label*="Remove mapping 1"]').click()
    
    // Should have 1 row
    await expect(mappingRows).toHaveCount(1)
  })

  test('should toggle rule enabled status', async ({ page }) => {
    // Find first rule card with switch
    const firstRuleCard = page.locator('[class*="Card"][class*="hover:shadow-md"]').first()
    
    if (await firstRuleCard.count() > 0) {
      const switchElement = firstRuleCard.locator('button[role="switch"]')
      
      // Get initial state
      const initialState = await switchElement.getAttribute('aria-checked')
      
      // Toggle
      await switchElement.click()
      
      // State should change
      const newState = await switchElement.getAttribute('aria-checked')
      expect(newState).not.toBe(initialState)
      
      // Should see toast
      await expect(page.locator('text="Rule Updated"')).toBeVisible()
    }
  })

  test('should validate rule form', async ({ page }) => {
    // Open create dialog
    await page.locator('button:has-text("Create Rule")').click()
    
    // Try to save without filling required fields
    await page.locator('button:has-text("Save Rule")').click()
    
    // Should see validation errors
    await expect(page.locator('text="Title must be at least 3 characters"')).toBeVisible()
    await expect(page.locator('text="Smart code must start with HERA."')).toBeVisible()
    
    // Fill required fields
    await page.locator('input#rule-title').fill('Test Rule')
    await page.locator('input#rule-smart-code').fill('HERA.TEST.v1')
    await page.locator('textarea[placeholder*="HERA.POS.SALE"]').fill('HERA.TEST.TXN.v1')
    
    // Switch to mappings tab
    await page.locator('button[role="tab"]:has-text("Mappings")').click()
    
    // Add a mapping
    await page.locator('button:has-text("Add Mapping")').click()
    await page.locator('input[placeholder="4100"]').fill('4100')
    
    // Now save should work
    await page.locator('button:has-text("Save Rule")').click()
    await expect(page.locator('text="Rule Created")')).toBeVisible()
  })

  test('should show policy-as-data info', async ({ page }) => {
    // Check for info alert
    await expect(page.locator('text="Policy-as-Data Architecture"')).toBeVisible()
    
    // Should mention core_dynamic_data
    await expect(page.locator('code:has-text("core_dynamic_data")')).toBeVisible()
    
    // Should mention key pattern
    await expect(page.locator('code:has-text("FIN_DNA.RULES.*")')).toBeVisible()
  })

  test('should search rules', async ({ page }) => {
    // Enter search term
    const searchInput = page.locator('input[placeholder*="Search by key or title"]')
    await searchInput.fill('POS')
    
    // Wait for filter to apply
    await page.waitForTimeout(300)
    
    // All visible cards should contain POS in key or title
    const visibleCards = page.locator('[class*="Card"][class*="hover:shadow-md"]')
    const count = await visibleCards.count()
    
    if (count > 0) {
      for (let i = 0; i < count; i++) {
        const cardText = await visibleCards.nth(i).textContent()
        expect(cardText?.toLowerCase()).toContain('pos')
      }
    }
  })

  test('should handle runtime note', async ({ page }) => {
    // Open create or edit dialog
    await page.locator('button:has-text("Create Rule")').click()
    
    // Should see runtime note
    await expect(page.locator('text="Rule changes affect future transactions only"')).toBeVisible()
  })

  test('should format conditions JSON', async ({ page }) => {
    // Open create dialog
    await page.locator('button:has-text("Create Rule")').click()
    
    // Switch to Conditions tab
    await page.locator('button[role="tab"]:has-text("Conditions")').click()
    
    // Enter unformatted JSON
    const textarea = page.locator('textarea[placeholder="{}"]')
    await textarea.fill('{"test":true,"nested":{"value":123}}')
    
    // Click Format JSON
    await page.locator('button:has-text("Format JSON")').click()
    
    // JSON should be formatted
    const formattedValue = await textarea.inputValue()
    expect(formattedValue).toContain('\n')
    expect(formattedValue).toContain('  ')
  })

  test('should preview rule in JSON format', async ({ page }) => {
    // Open create dialog
    await page.locator('button:has-text("Create Rule")').click()
    
    // Fill some fields
    await page.locator('input#rule-title').fill('Preview Test')
    await page.locator('input#rule-smart-code').fill('HERA.PREVIEW.TEST.v1')
    
    // Switch to Preview tab
    await page.locator('button[role="tab"]:has-text("Preview")').click()
    
    // Should see JSON view with the entered data
    await expect(page.locator('text="Preview Test"')).toBeVisible()
    await expect(page.locator('.badge:has-text("HERA.PREVIEW.TEST.v1")')).toBeVisible()
  })
})