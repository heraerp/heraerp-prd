/**
 * HERA Global Teardown for Playwright E2E Tests
 * Smart Code: HERA.TEST.GLOBAL.TEARDOWN.MCP.v1
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Cleaning up HERA E2E test artifacts...')
  
  const { baseURL } = config.projects[0].use
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Clean up test data via MCP
    console.log('🗑️ Cleaning up test entities...')
    await page.request.post(`${baseURL}/api/v1/mcp/tools`, {
      data: {
        tool: 'cleanup-test-data',
        input: {
          entity_types: ['test_setup', 'questionnaire_session'],
          organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID,
          smart_code: 'HERA.TEST.CLEANUP.v1'
        }
      }
    })
    
    console.log('✅ Global teardown completed successfully')
    
  } catch (error) {
    console.warn('⚠️ Global teardown encountered issues:', error)
  } finally {
    await browser.close()
  }
}

export default globalTeardown