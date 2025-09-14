import { test, expect } from '@playwright/test'

test.describe('Furniture Tender - Dashboard @smoke', () => {
  test('loads dashboard and shows tenders list', async ({ page }) => {
    await page.goto('/furniture/tender/dashboard')

    // Header
    await expect(page.getByRole('heading', { name: 'Tender Analytics Dashboard' })).toBeVisible()
    await expect(page.getByText('Performance Overview')).toBeVisible()

    // Switch to All Tenders and ensure table headers render
    await page.getByRole('tab', { name: 'All Tenders' }).click()
    await expect(page.getByRole('columnheader', { name: 'Tender Code' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Title & Department' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Status' })).toBeVisible()

    // Mock table contains seeded-like codes
    await expect(page.getByText('KFD/2025/WOOD/001')).toBeVisible()
    await expect(page.getByText('Teak Wood Supply - Nilambur Range')).toBeVisible()

    // Action button visible
    await expect(page.getByRole('button', { name: 'View' }).first()).toBeVisible()
  })
})

