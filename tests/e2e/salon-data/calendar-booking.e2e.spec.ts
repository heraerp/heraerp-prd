import { test, expect } from '@playwright/test'
import fs from 'fs/promises'
import path from 'path'

async function writeReport(filename: string, content: string) {
  const reportsDir = path.resolve(__dirname, '../../reports')
  await fs.mkdir(reportsDir, { recursive: true })
  const filePath = path.join(reportsDir, filename)
  await fs.writeFile(filePath, content, 'utf8')
  return filePath
}

test.describe('Salon Calendar Booking (/salon-data/calendar)', () => {
  test('book an appointment end-to-end (headless)', async ({ page }) => {
    // Navigate to calendar page
    await page.goto('/salon-data/calendar')

    // Wait for calendar UI
    await expect(page.getByRole('button', { name: 'New Appointment' })).toBeVisible({ timeout: 15000 })

    // Open booking modal
    await page.getByRole('button', { name: 'New Appointment' }).click()
    await expect(page.getByRole('dialog').getByText('New Appointment')).toBeVisible({ timeout: 10000 })

    // Select stylist (fallback demo data provides one stylist)
    const stylistTrigger = page.getByRole('combobox').or(page.getByText('Select a stylist'))
    await stylistTrigger.first().click()
    // Use the custom class used in SelectItem for reliable targeting
    const firstStylist = page.locator('.hera-select-item').first()
    await firstStylist.click()

    // Select at least one service
    // Demo fallback provides service "Brazilian Blowout"; try it first
    const brazilianService = page.getByText('Brazilian Blowout', { exact: false })
    if (await brazilianService.isVisible().catch(() => false)) {
      await brazilianService.click()
    } else {
      // Fallback: click the first selectable service card (has a Checkbox inside)
      const anyService = page.locator('div:has(input[type="checkbox"])').first()
      await anyService.click()
    }

    // Set a time (use existing default if present)
    const timeInput = page.getByRole('textbox', { name: /time/i }).first().or(page.locator('input[type="time"]').first())
    if (await timeInput.isVisible().catch(() => false)) {
      // Some environments may already have a default; ensure a valid time
      await timeInput.fill('10:00')
    }

    // Try to select a customer
    const customerSearch = page.getByPlaceholder('Search customers...')
    let customerSelected = false
    if (await customerSearch.isVisible().catch(() => false)) {
      await customerSearch.fill('Sa')
      // Wait briefly for any search results
      await page.waitForTimeout(1000)

      // A customer row is a clickable div within the grid; try to click the first matching entry
      const candidate = page.locator('div[role="dialog"] .grid > div').first()
      if (await candidate.isVisible().catch(() => false)) {
        await candidate.click({ trial: true }).catch(() => {})
        await candidate.click().catch(() => {})
        customerSelected = true
      }
    }

    // Attempt to save
    const saveButton = page.getByRole('button', { name: 'Save' })

    // If disabled, capture diagnostics and write a Claude prompt
    const isDisabled = !(await saveButton.isEnabled().catch(() => false))
    if (isDisabled) {
      const reasons: string[] = []
      if (!customerSelected) {
        reasons.push('- No customers available to select in the modal. Save remains disabled without a customer.')
      }

      // Check console errors for missing API methods like readEntities
      const consoleErrors: string[] = []
      page.on('console', (msg) => {
        if (msg.type() === 'error') consoleErrors.push(msg.text())
      })

      // Take a small pause to collect potential console errors
      await page.waitForTimeout(500)

      const errorReport = `CLAUDE_PROMPT: Fix salon calendar booking flow

Context:
- Route: /salon-data/calendar
- Flow: Click "New Appointment" -> select stylist -> select service -> select customer -> Save

Observed Issue:
${reasons.join('\n') || '- Save button disabled unexpectedly.'}

Likely Root Causes (from code inspection):
- BookAppointmentModal uses universalApi.readEntities(...) which does not exist in src/lib/universal-api.ts. Calls throw and data fails to load.
- There is a demo fallback for stylists/services when organizationId === 'demo-salon', but no fallback for customers, leaving the customer list empty.

Suggested Fixes:
1) Implement universalApi.readEntities in src/lib/universal-api.ts as a thin wrapper over getEntities/query, or update BookAppointmentModal to use existing methods (e.g., universalApi.getEntities with appropriate filters).
2) Add demo fallback customers in BookAppointmentModal when organizationId === 'demo-salon' and fetch fails, similar to the stylists/services fallback.
3) Optionally, allow quick-add inline customer in the modal so a booking can proceed without pre-existing customers.

Helpful Selectors in UI:
- New Appointment button: role=button, name="New Appointment"
- Stylist select item: .hera-select-item
- Service item: Visible text like "Brazilian Blowout" or any service with a checkbox
- Customer search: input[placeholder="Search customers..."]
- Save button: role=button, name="Save"

Console Errors (if any captured):\n${consoleErrors.join('\n') || 'None captured in headless attempt.'}
`

      const out = await writeReport('calendar-booking-error.md', errorReport)
      test.info().annotations.push({ type: 'diagnostic-report', description: `Written to ${out}` })
      test.fail(true, 'Booking could not proceed due to missing customer or disabled Save.')
      return
    }

    // If enabled, complete the booking
    await saveButton.click()

    // Expect the modal to close after booking and a new appointment to appear eventually
    await expect(page.getByRole('dialog').getByText('New Appointment')).toBeHidden({ timeout: 10000 })

    // Write success report
    const success = `SUCCESS: Appointment booking flow passed on /salon-data/calendar`;
    const out = await writeReport('calendar-booking-success.md', success)
    test.info().annotations.push({ type: 'report', description: `Written to ${out}` })
  })
})

