import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('@a11y dashboard has no violations', async ({ page }) => {
  const base = process.env.PLAYWRIGHT_BASE_URL || 'http://localhost:3000'
  await page.goto(`${base}/dashboard`)
  const { violations } = await new AxeBuilder({ page }).analyze()
  expect(violations).toEqual([])
})

