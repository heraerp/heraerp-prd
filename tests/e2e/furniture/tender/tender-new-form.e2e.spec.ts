import { test, expect } from '@playwright/test'

test.describe('Furniture Tender - New Tender Form @smoke', () => {
  test('validates fields and handles mock-mode error gracefully', async ({ page }) => {
    await page.goto('/furniture/tender/new')

    // Header
    await expect(page.getByRole('heading', { name: 'Add New Tender' })).toBeVisible()

    // Required fields validation
    await page.getByRole('button', { name: 'Create Tender' }).click()
    // Expect native validation to prevent submission without values
    await expect(page).toHaveURL(/\/furniture\/tender\/new/)

    // Fill minimal required fields
    await page.getByLabel('Tender Code *').fill('KFD/2025/WOOD/999')
    await page.getByLabel('Tender Title *').fill('Automation Test Tender')

    await page.getByLabel('Estimated Value (₹) *').fill('4500000')
    // Blur triggers EMD auto-calc
    await page.getByLabel('Estimated Value (₹) *').blur()
    await expect(page.getByLabel('EMD Amount (₹) *')).toHaveValue(/90000/)

    // Attempt submit (will fail in mock mode due to Supabase not configured)
    await page.getByRole('button', { name: 'Create Tender' }).click()

    // Expect an error toast to appear (mock mode path)
    await expect(
      page.getByText(/Database Not Configured|Failed to create tender|Supabase not configured/i)
    ).toBeVisible()
  })
})

