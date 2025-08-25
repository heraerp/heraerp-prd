#!/usr/bin/env node

/**
 * Test script for HERA MCP Server deployed on Railway
 */

const API_URL = 'https://alluring-expression-production.up.railway.app';
const ORG_ID = '3df8cc52-3d81-42d5-b088-7736ae26cc7c'; // Mario's Restaurant

console.log('🚀 Testing HERA MCP Server at:', API_URL);
console.log('Organization ID:', ORG_ID);
console.log('=====================================\n');

async function testHealth() {
  console.log('1. Testing Health Endpoint...');
  try {
    const response = await fetch(`${API_URL}/health`);
    const data = await response.json();
    console.log('✅ Health Check Response:', data);
    return true;
  } catch (error) {
    console.error('❌ Health Check Failed:', error.message);
    return false;
  }
}

async function testRootEndpoint() {
  console.log('\n2. Testing Root Endpoint...');
  try {
    const response = await fetch(`${API_URL}/`);
    const data = await response.json();
    console.log('✅ Root Endpoint Response:', JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Root Endpoint Failed:', error.message);
    return false;
  }
}

async function testChatAPI(message) {
  console.log(`\n3. Testing Chat API with message: "${message}"`);
  try {
    const response = await fetch(`${API_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: message,
        organizationId: ORG_ID,
        context: { mode: 'customer' }
      })
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Chat API Response:');
      console.log('- Success:', data.success);
      console.log('- Response:', data.response);
      if (data.interpretation) {
        console.log('- Interpretation:', JSON.stringify(data.interpretation, null, 2));
      }
      if (data.result) {
        console.log('- Result:', JSON.stringify(data.result, null, 2));
      }
      return true;
    } else {
      console.error('❌ Chat API Error:', data.error || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.error('❌ Chat API Failed:', error.message);
    return false;
  }
}

async function runTests() {
  const tests = [];
  
  // Test 1: Health check
  tests.push(await testHealth());
  
  // Test 2: Root endpoint
  tests.push(await testRootEndpoint());
  
  // Test 3: Simple chat query
  tests.push(await testChatAPI('Show me system statistics'));
  
  // Test 4: POS transaction
  tests.push(await testChatAPI('Process a sale for $25.00'));
  
  // Test 5: Inventory query
  tests.push(await testChatAPI('Show current inventory levels'));
  
  // Summary
  console.log('\n=====================================');
  console.log('TEST SUMMARY:');
  const passed = tests.filter(t => t).length;
  const total = tests.length;
  console.log(`Passed: ${passed}/${total} (${Math.round(passed/total * 100)}%)`);
  
  if (passed === total) {
    console.log('✅ All tests passed! MCP Server is working correctly.');
  } else {
    console.log('⚠️  Some tests failed. Check the logs above.');
  }
}

// Run the tests
runTests().catch(console.error);