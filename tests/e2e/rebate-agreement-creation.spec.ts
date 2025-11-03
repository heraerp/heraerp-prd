import { test, expect } from '@playwright/test'

/**
 * HERA Master Data Creation Test Template
 * Entity: Rebate Agreement
 * Pattern: Can be copied for any master data entity
 * 
 * Test Flow:
 * 1. Navigate to creation page
 * 2. Fill basic information (entity_name, entity_code)
 * 3. Fill entity-specific details
 * 4. Submit and verify success
 */

test.describe('Rebate Agreement Creation', () => {
  test.beforeEach(async ({ page }) => {
    // Skip authentication checks by mocking the auth provider
    await page.addInitScript(() => {
      // Mock localStorage for auth state
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'mock-token',
        refresh_token: 'mock-refresh',
        expires_at: Date.now() + 3600000
      }))
      
      // Mock global auth state
      window.__HERA_AUTH_MOCK__ = {
        user: { id: 'test-user-id', entity_id: 'test-user-entity-id' },
        organization: { id: 'test-org-id', name: 'Test Organization' },
        isAuthenticated: true,
        contextLoading: false
      }
    })
    
    // Navigate to the rebate agreement creation page
    await page.goto('/enterprise/procurement/purchasing-rebates/rebate-agreement/new')
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle')
    
    // Wait for the form to be visible or auth loading to complete
    await page.waitForTimeout(2000) // Give time for auth context to load
    
    // Check if we're on the login page (authentication failed)
    const currentUrl = page.url()
    if (currentUrl.includes('/auth/login')) {
      console.log('⚠️ Redirected to login page, authentication mock may not be working')
      // Try to proceed anyway for form testing
      await page.goto('/enterprise/procurement/purchasing-rebates/rebate-agreement/new', { waitUntil: 'networkidle' })
    }
  })

  test('should create a rebate agreement successfully', async ({ page }) => {
    // Generate unique test data
    const timestamp = Date.now()
    const agreementName = `Test Rebate Agreement ${timestamp}`
    const agreementCode = `TRA_${timestamp}`
    
    console.log(`Testing with: ${agreementName} (${agreementCode})`)

    // Step 1: Fill Basic Information Section
    console.log('Step 1: Filling basic information...')
    
    // Entity name (should auto-generate entity code)
    await page.fill('#entity_name', agreementName)
    await expect(page.locator('#entity_name')).toHaveValue(agreementName)
    
    // Verify entity code was auto-generated or fill manually
    const entityCodeValue = await page.locator('#entity_code').inputValue()
    if (!entityCodeValue) {
      await page.fill('#entity_code', agreementCode)
    }
    await expect(page.locator('#entity_code')).toHaveValue(agreementCode)
    
    // Optional: Fill description
    await page.fill('#description', `Automated test rebate agreement created at ${new Date().toISOString()}`)

    // Navigate to details section
    console.log('Step 2: Moving to details section...')
    await page.click('button:has-text("Rebate Agreement Details")')
    
    // Wait for details section to be visible
    await expect(page.locator('text=Agreement Name')).toBeVisible()

    // Step 2: Fill Rebate Agreement Details
    console.log('Step 3: Filling rebate agreement details...')
    
    // Agreement name
    await page.fill('#agreement_name', `${agreementName} - Display Name`)
    
    // Agreement type (Select dropdown)
    await page.click('[data-testid="agreement_type"] button')
    await page.click('text=Volume Based')
    
    // Valid from date
    await page.fill('#valid_from', '2024-01-01')
    
    // Valid to date  
    await page.fill('#valid_to', '2024-12-31')
    
    // Base rate
    await page.fill('#base_rate', '5.5')
    
    // Target volume (optional)
    await page.fill('#target_volume', '10000')
    
    // Settlement method (Select dropdown)
    await page.click('[data-testid="settlement_method"] button')
    await page.click('text=Credit Note')
    
    // Settlement frequency (Select dropdown)
    await page.click('[data-testid="settlement_frequency"] button')
    await page.click('text=Quarterly')
    
    // Currency (Select dropdown)
    await page.click('[data-testid="currency"] button')
    await page.click('text=AED - UAE Dirham')
    
    // Status (Select dropdown)
    await page.click('[data-testid="status"] button')
    await page.click('text=Draft')

    // Step 3: Verify form completion
    console.log('Step 4: Verifying form completion...')
    
    // Check that all required fields are filled
    await expect(page.locator('#entity_name')).toHaveValue(agreementName)
    await expect(page.locator('#entity_code')).toHaveValue(agreementCode)
    await expect(page.locator('#agreement_name')).toHaveValue(`${agreementName} - Display Name`)
    await expect(page.locator('#base_rate')).toHaveValue('5.5')
    
    // Step 4: Submit the form
    console.log('Step 5: Submitting the form...')
    
    // Look for the create button and click it
    const createButton = page.locator('button:has-text("Create Rebate Agreement")')
    await expect(createButton).toBeVisible()
    await expect(createButton).toBeEnabled()
    
    // Click create and wait for response
    await createButton.click()
    
    // Step 5: Verify success
    console.log('Step 6: Verifying successful creation...')
    
    // Wait for either success toast or navigation
    await Promise.race([
      // Success toast appears
      page.waitForSelector('text=Success!', { timeout: 10000 }),
      // Or navigation occurs (redirect to list page)
      page.waitForURL(/\/rebate-agreements/, { timeout: 10000 }),
      // Or any positive confirmation
      page.waitForSelector('text=created successfully', { timeout: 10000 })
    ])
    
    // Verify we either see success message or are redirected
    const currentUrl = page.url()
    const hasSuccessToast = await page.locator('text=Success!').count() > 0
    const hasSuccessMessage = await page.locator('text=created successfully').count() > 0
    const isRedirected = currentUrl.includes('/rebate-agreements')
    
    // Assert that creation was successful
    expect(hasSuccessToast || hasSuccessMessage || isRedirected).toBeTruthy()
    
    console.log(`✅ Test completed successfully!`)
    console.log(`Created: ${agreementName}`)
    console.log(`Code: ${agreementCode}`)
    console.log(`Current URL: ${currentUrl}`)
  })

  test('should validate required fields', async ({ page }) => {
    console.log('Testing form validation...')
    
    // Try to submit empty form
    const createButton = page.locator('button:has-text("Create Rebate Agreement")')
    await createButton.click()
    
    // Should see validation errors
    await expect(page.locator('text=is required')).toBeVisible()
    
    // Fill minimum required fields
    await page.fill('#entity_name', 'Test Validation Agreement')
    
    // Move to details and try to submit
    await page.click('button:has-text("Rebate Agreement Details")')
    await createButton.click()
    
    // Should still see validation for required detail fields
    const hasValidationErrors = await page.locator('.text-red-600').count() > 0
    expect(hasValidationErrors).toBeTruthy()
    
    console.log('✅ Validation test completed')
  })

  test('should auto-generate entity code from name', async ({ page }) => {
    console.log('Testing auto-generation of entity code...')
    
    const testName = 'Test Auto Generation Agreement'
    
    // Fill entity name
    await page.fill('#entity_name', testName)
    
    // Trigger the auto-generation (usually on blur or change)
    await page.press('#entity_name', 'Tab')
    
    // Wait a bit for auto-generation
    await page.waitForTimeout(500)
    
    // Check if entity code was auto-generated
    const entityCode = await page.locator('#entity_code').inputValue()
    
    // Entity code should be generated (typically uppercase with underscores)
    expect(entityCode).toBeTruthy()
    expect(entityCode.length).toBeGreaterThan(0)
    
    console.log(`✅ Auto-generation test completed. Generated code: ${entityCode}`)
  })
})

/**
 * TEMPLATE USAGE GUIDE:
 * 
 * To create tests for other master data entities:
 * 
 * 1. Copy this file
 * 2. Replace "Rebate Agreement" with your entity name
 * 3. Update the URL path to your entity creation page
 * 4. Replace the field selectors (#agreement_name, etc.) with your entity's fields
 * 5. Update the form sections if different
 * 6. Adjust validation expectations based on your entity's requirements
 * 
 * Key patterns to maintain:
 * - Always test entity_name and entity_code (common to all entities)
 * - Test auto-generation of entity_code
 * - Test validation of required fields
 * - Test successful creation flow
 * - Verify success confirmation (toast or redirect)
 * 
 * Example adaptations:
 * - Customer: Fill name, email, phone, customer_type
 * - Product: Fill name, category, price, unit_of_measure
 * - Supplier: Fill name, contact_info, payment_terms
 */