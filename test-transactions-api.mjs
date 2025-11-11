#!/usr/bin/env node
/**
 * Test dynamic third level transaction CRUD operations via API
 * Testing retail/inventory/main transactions endpoint
 */

const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // HERA Salon org

async function testTransactionsAPI() {
  console.log('🧪 Testing Dynamic Third Level Transaction CRUD Operations');
  console.log('📍 Testing: /api/v2/retail/inventory/main/transactions');
  console.log('🏢 Organization ID:', DEFAULT_ORG_ID);
  
  try {
    // Test 1: GET request to fetch stock movement transactions
    console.log('\n📖 Test 1: GET stock movement transactions...');
    const getUrl = `${API_BASE_URL}/api/v2/retail/inventory/main/transactions?transactionType=MOVEMENT&organizationId=${DEFAULT_ORG_ID}&limit=10`;
    
    const getResponse = await fetch(getUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log(`Status: ${getResponse.status} ${getResponse.statusText}`);
    
    if (getResponse.ok) {
      const getData = await getResponse.json();
      console.log('✅ GET Success');
      console.log('📊 Response Data:', JSON.stringify(getData, null, 2));
    } else {
      const errorData = await getResponse.text();
      console.log('❌ GET Failed');
      console.log('🐛 Error Response:', errorData);
    }
    
    // Test 2: POST request to create a new stock movement transaction
    console.log('\n➕ Test 2: POST create stock movement...');
    const postUrl = `${API_BASE_URL}/api/v2/retail/inventory/main/transactions`;
    
    const createPayload = {
      operation: 'create',
      transactionType: 'MOVEMENT',
      organizationId: DEFAULT_ORG_ID,
      transactionData: {
        transaction_type: 'MOVEMENT',
        description: 'Test inventory movement'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'INVENTORY',
          description: 'Stock movement for test item',
          quantity: 10,
          unit_amount: 25.99,
          line_amount: 259.90
        }
      ]
    };
    
    const postResponse = await fetch(postUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(createPayload)
    });
    
    console.log(`Status: ${postResponse.status} ${postResponse.statusText}`);
    
    if (postResponse.ok) {
      const postData = await postResponse.json();
      console.log('✅ POST Success');
      console.log('📊 Created Transaction:', JSON.stringify(postData, null, 2));
    } else {
      const errorData = await postResponse.text();
      console.log('❌ POST Failed');
      console.log('🐛 Error Response:', errorData);
    }
    
  } catch (error) {
    console.error('💥 Test Error:', error);
  }
}

// Run the test
testTransactionsAPI();