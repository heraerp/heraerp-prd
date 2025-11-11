#!/usr/bin/env node

/**
 * Test Universal Workspace System
 * Smart Code: HERA.TEST.UNIVERSAL.WORKSPACE.SYSTEM.v1
 * 
 * Tests the database-driven universal workspace system
 */

import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:3001'
const API_BASE = `${BASE_URL}/api/v2`

// Test cases
const testCases = [
  {
    name: 'Retail Inventory Stock Workspace',
    url: `${API_BASE}/retail/inventory/stock`,
    expected: {
      domain: 'retail',
      section: 'inventory', 
      workspace: 'stock'
    }
  },
  {
    name: 'Retail Inventory Main Workspace',
    url: `${API_BASE}/retail/inventory/main`,
    expected: {
      domain: 'retail',
      section: 'inventory',
      workspace: 'main'
    }
  },
  {
    name: 'Retail POS Main Workspace',
    url: `${API_BASE}/retail/pos/main`,
    expected: {
      domain: 'retail',
      section: 'pos',
      workspace: 'main'
    }
  }
]

async function testWorkspaceAPI(testCase) {
  console.log(`\n🧪 Testing: ${testCase.name}`)
  console.log(`📡 URL: ${testCase.url}`)
  
  try {
    const response = await fetch(testCase.url)
    const data = await response.json()
    
    if (!response.ok) {
      console.log(`❌ HTTP Error: ${response.status}`)
      console.log(`🔍 Error Details:`, data)
      return false
    }
    
    console.log(`✅ Success: ${response.status}`)
    
    // Validate response structure
    if (!data.workspace || !data.layout_config) {
      console.log(`❌ Invalid response structure`)
      console.log(`🔍 Response:`, JSON.stringify(data, null, 2))
      return false
    }
    
    console.log(`📋 Workspace: ${data.workspace.entity_name}`)
    console.log(`🎨 Icon: ${data.workspace.icon}`)
    console.log(`🎯 Color: ${data.workspace.color}`)
    console.log(`📊 Sections: ${data.layout_config.sections.length}`)
    
    // Count total cards across all sections
    const totalCards = data.layout_config.sections.reduce((total, section) => {
      return total + (section.cards?.length || 0)
    }, 0)
    
    console.log(`🃏 Total Cards: ${totalCards}`)
    
    // Show section breakdown
    data.layout_config.sections.forEach(section => {
      console.log(`  📁 ${section.title}: ${section.cards?.length || 0} cards`)
    })
    
    return true
    
  } catch (error) {
    console.log(`❌ Request Failed:`, error.message)
    return false
  }
}

async function runTests() {
  console.log('🚀 HERA Universal Workspace System Tests')
  console.log('==========================================')
  
  let passed = 0
  let total = testCases.length
  
  for (const testCase of testCases) {
    const success = await testWorkspaceAPI(testCase)
    if (success) {
      passed++
    }
    await new Promise(resolve => setTimeout(resolve, 500)) // Small delay between tests
  }
  
  console.log('\n📊 Test Results')
  console.log('===============')
  console.log(`✅ Passed: ${passed}/${total}`)
  console.log(`❌ Failed: ${total - passed}/${total}`)
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! Universal workspace system is working.')
  } else {
    console.log('\n⚠️  Some tests failed. Check the logs above.')
  }
  
  // Test frontend page accessibility
  console.log('\n🌐 Testing Frontend Page Access')
  console.log('===============================')
  
  const frontendTestCases = [
    {
      name: 'Retail Inventory Stock Page',
      url: `${BASE_URL}/retail/domains/inventory/sections/stock`
    },
    {
      name: 'Retail Inventory Overview Page', 
      url: `${BASE_URL}/retail/domains/inventory/sections/overview`
    }
  ]
  
  for (const testCase of frontendTestCases) {
    console.log(`\n🔍 Testing: ${testCase.name}`)
    console.log(`🌐 URL: ${testCase.url}`)
    
    try {
      const response = await fetch(testCase.url)
      
      if (response.ok) {
        console.log(`✅ Page accessible: ${response.status}`)
      } else {
        console.log(`⚠️  Page response: ${response.status}`)
      }
    } catch (error) {
      console.log(`❌ Page failed:`, error.message)
    }
  }
  
  console.log('\n🏁 Testing Complete')
}

runTests()