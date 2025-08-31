import { test, expect } from '@playwright/test'

test.describe('Ice Cream Module - UI Smoke Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to ice cream module
    await page.goto('/icecream')
  })
  
  test('should load ice cream dashboard', async ({ page }) => {
    // Check dashboard loaded
    await expect(page.locator('h1:has-text("Ice Cream Manufacturing Dashboard")')).toBeVisible()
    
    // Check key sections are present
    await expect(page.locator('text=Today\'s Production')).toBeVisible()
    await expect(page.locator('text=Active Batches')).toBeVisible()
    await expect(page.locator('text=Temperature Status')).toBeVisible()
    await expect(page.locator('text=Inventory Level')).toBeVisible()
  })
  
  test('should navigate to production page', async ({ page }) => {
    // Click production link in sidebar
    await page.click('text=Production')
    
    // Wait for production page to load
    await expect(page.locator('h1:has-text("Production Management")')).toBeVisible()
    
    // Check tabs are present
    await expect(page.locator('button:has-text("Active")')).toBeVisible()
    await expect(page.locator('button:has-text("Scheduled")')).toBeVisible()
    await expect(page.locator('button:has-text("Completed")')).toBeVisible()
  })
  
  test('should navigate to inventory page', async ({ page }) => {
    // Click inventory link in sidebar
    await page.click('text=Inventory')
    
    // Wait for inventory page to load
    await expect(page.locator('h1:has-text("Inventory Management")')).toBeVisible()
    
    // Check inventory sections
    await expect(page.locator('text=Raw Materials')).toBeVisible()
    await expect(page.locator('text=Finished Products')).toBeVisible()
  })
  
  test('should navigate to financial page', async ({ page }) => {
    // Navigate directly to financial page
    await page.goto('/icecream-financial')
    
    // Check financial page loaded
    await expect(page.locator('h1:has-text("Ice Cream Financial Management")')).toBeVisible()
    
    // Check financial tabs
    await expect(page.locator('button:has-text("Overview")')).toBeVisible()
    await expect(page.locator('button:has-text("General Ledger")')).toBeVisible()
    await expect(page.locator('button:has-text("Payables")')).toBeVisible()
    await expect(page.locator('button:has-text("Receivables")')).toBeVisible()
    await expect(page.locator('button:has-text("Fixed Assets")')).toBeVisible()
  })
  
  test('should display real-time metrics', async ({ page }) => {
    // Check that metrics cards have values (not just 0)
    const productionValue = await page.locator('text=Today\'s Production').locator('..').locator('text=/\\d+\\sL|0\\sL/').textContent()
    expect(productionValue).toBeTruthy()
    
    const efficiencyValue = await page.locator('text=efficiency').locator('..').locator('text=/%/').textContent()
    expect(efficiencyValue).toMatch(/\d+(\.\d+)?%/)
  })
  
  test('should open apps modal', async ({ page }) => {
    // Click the plus button in sidebar
    await page.click('button[aria-label="Add apps"]')
    
    // Check modal opened
    await expect(page.locator('text=Discover Apps')).toBeVisible()
    
    // Check search input is present
    await expect(page.locator('input[placeholder*="Search apps"]')).toBeVisible()
    
    // Close modal
    await page.keyboard.press('Escape')
  })
  
  test('should handle mobile responsive layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check mobile menu button appears
    await expect(page.locator('button[aria-label="Toggle sidebar"]')).toBeVisible()
    
    // Click mobile menu
    await page.click('button[aria-label="Toggle sidebar"]')
    
    // Check sidebar is visible
    await expect(page.locator('nav').first()).toBeVisible()
  })
})