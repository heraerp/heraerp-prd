import { test, expect } from '@playwright/test'

test.describe('Matrix nav role gating', () => {
  test('sales can see Sales but not Finance', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('matrixRoles', JSON.stringify(['sales']))
    })
    await page.goto('/matrix')
    await page.waitForURL(/\/matrix\/home/)

    await expect(page.locator('a:has-text("Sales")')).toBeVisible()
    await expect(page.locator('a:has-text("Finance")')).toHaveCount(0)
  })

  test('accountant can see Finance', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('matrixRoles', JSON.stringify(['accountant']))
    })
    await page.goto('/matrix')
    await page.waitForURL(/\/matrix\/home/)

    await expect(page.locator('a:has-text("Finance")')).toBeVisible()
  })
})

