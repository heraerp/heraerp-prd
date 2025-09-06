/**
 * HERA Global Setup for Playwright E2E Tests with MCP Integration
 * Smart Code: HERA.TEST.GLOBAL.SETUP.MCP.v1
 */

import { chromium, FullConfig } from '@playwright/test'

async function globalSetup(config: FullConfig) {
  console.log('🚀 Setting up HERA E2E tests with MCP integration...')
  
  const { baseURL } = config.projects[0].use
  
  const browser = await chromium.launch()
  const page = await browser.newPage()
  
  try {
    // Health check
    console.log('🏥 Performing health check...')
    await page.goto(`${baseURL}/api/health`)
    const healthResponse = await page.textContent('pre')
    console.log('✅ Health check passed:', JSON.parse(healthResponse || '{}'))
    
    // MCP server check
    console.log('🔌 Checking MCP server connectivity...')
    const mcpResponse = await page.request.post(`${baseURL}/api/v1/mcp/tools`, {
      data: {
        tool: 'create-entity',
        input: {
          entity_type: 'test_setup',
          entity_name: 'E2E Setup Test',
          smart_code: 'HERA.TEST.SETUP.ENTITY.v1',
          organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID
        }
      }
    })
    
    if (mcpResponse.ok()) {
      const mcpData = await mcpResponse.json()
      console.log('✅ MCP server is ready:', mcpData.success ? 'Connected' : 'Error')
    } else {
      console.warn('⚠️ MCP server not responding, tests may fail')
    }
    
    // Ensure test organization exists
    console.log('🏢 Setting up test organization...')
    await page.request.post(`${baseURL}/api/v1/organizations`, {
      data: {
        name: 'E2E Test Organization',
        subdomain: 'e2e-test',
        smart_code: 'HERA.TEST.ORG.E2E.v1'
      }
    })
    
    console.log('✅ Global setup completed successfully')
    
  } catch (error) {
    console.error('❌ Global setup failed:', error)
    process.exit(1)
  } finally {
    await browser.close()
  }
}

export default globalSetup