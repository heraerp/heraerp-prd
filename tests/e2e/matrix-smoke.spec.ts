import { test, expect } from '@playwright/test'

test.describe('Matrix UI smoke', () => {
  test('nav renders and POS works in mock mode', async ({ page }) => {
    await page.goto('/matrix')

    // Navigate to Home (redirect occurs)
    await page.waitForURL(/\/matrix\/home/)
    await expect(page.locator('text=Matrix IT World')).toBeVisible()

    // Open Sales POS
    await page.click('a:has-text("Sales")')
    await page.waitForURL(/\/matrix\/sales\/pos/)

    // Fill minimal cart and checkout (mock)
    await page.getByRole('button', { name: 'Add Item' }).click()
    const inputs = page.locator('input[placeholder="Product ID"]')
    await inputs.first().fill('prod-1')
    await page.getByPlaceholder('Qty').first().fill('1')
    await page.getByPlaceholder('Price').first().fill('100')
    await page.getByPlaceholder('Paid').fill('100')

    await page.getByRole('button', { name: 'Checkout' }).click()

    await expect(page.getByText(/Sale posted\./)).toBeVisible({ timeout: 10000 })
  })
})

