/**
 * Test script for UCR MCP integration
 * Run with: node test-ucr-mcp.js
 */

const API_URL = 'http://localhost:3001/api/v1/mcp/ucr'

// Test organization ID - replace with a real one from your database
const TEST_ORG_ID = 'f0e2e7e8-9d5f-4d5e-91a9-30d4d4e4d4e4' 

async function testMCPEndpoint() {
  console.log('Testing UCR MCP Integration...\n')

  // Test 1: List available tools
  console.log('1. Getting available tools...')
  try {
    const toolsResponse = await fetch(API_URL)
    const tools = await toolsResponse.json()
    console.log('Available tools:', tools.tools.length)
    console.log('First 3 tools:', tools.tools.slice(0, 3).map(t => t.name))
  } catch (error) {
    console.error('Failed to get tools:', error.message)
  }

  // Test 2: List templates
  console.log('\n2. Listing UCR templates...')
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'list_templates',
        args: {},
        organizationId: TEST_ORG_ID
      })
    })
    const result = await response.json()
    console.log('Templates found:', result.templates?.length || 0)
    if (result.templates?.length > 0) {
      console.log('First template:', {
        id: result.templates[0].template_id,
        title: result.templates[0].title,
        industry: result.templates[0].industry
      })
    }
  } catch (error) {
    console.error('Failed to list templates:', error.message)
  }

  // Test 3: Search for rules
  console.log('\n3. Searching for existing rules...')
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'search',
        args: {
          query: '*',
          include_deprecated: false
        },
        organizationId: TEST_ORG_ID
      })
    })
    const result = await response.json()
    console.log('Rules found:', result.rules?.length || 0)
  } catch (error) {
    console.error('Failed to search rules:', error.message)
  }

  // Test 4: Validate payload
  console.log('\n4. Testing payload validation...')
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tool: 'validate_payload',
        args: {
          payload: {
            definitions: {
              max_discount: 30
            }
          }
        },
        organizationId: TEST_ORG_ID
      })
    })
    const result = await response.json()
    console.log('Validation result:', result)
  } catch (error) {
    console.error('Failed to validate payload:', error.message)
  }

  console.log('\n✅ UCR MCP Integration tests complete!')
}

// Run the tests
testMCPEndpoint()