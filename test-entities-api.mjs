#!/usr/bin/env node
/**
 * Test dynamic third level entity CRUD operations via API
 * Testing retail/inventory/main entities endpoint
 */

import { createClient } from '@supabase/supabase-js';

const API_BASE_URL = 'http://localhost:3000';
const DEFAULT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // HERA Salon org

async function testEntitiesAPI() {
  console.log('🧪 Testing Dynamic Third Level Entity CRUD Operations');
  console.log('📍 Testing: /api/v2/retail/inventory/main/entities');
  console.log('🏢 Organization ID:', DEFAULT_ORG_ID);
  
  try {
    // Test 1: GET request to fetch inventory entities
    console.log('\n📖 Test 1: GET inventory entities...');
    const getUrl = `${API_BASE_URL}/api/v2/retail/inventory/main/entities?entityType=INVENTORY&organizationId=${DEFAULT_ORG_ID}&limit=10`;
    
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
    
    // Test 2: POST request to create a new inventory item
    console.log('\n➕ Test 2: POST create inventory item...');
    const postUrl = `${API_BASE_URL}/api/v2/retail/inventory/main/entities`;
    
    const createPayload = {
      operation: 'create',
      entityType: 'INVENTORY',
      organizationId: DEFAULT_ORG_ID,
      entityData: {
        entity_name: 'Test Inventory Item',
        entity_type: 'INVENTORY'
      },
      dynamicFields: [
        {
          field_name: 'quantity',
          field_value_number: 100,
          field_type: 'number',
          smart_code: 'HERA.RETAIL.INVENTORY.MAIN.FIELD.QUANTITY.v1'
        },
        {
          field_name: 'unit_price',
          field_value_number: 25.99,
          field_type: 'number',
          smart_code: 'HERA.RETAIL.INVENTORY.MAIN.FIELD.UNIT_PRICE.v1'
        },
        {
          field_name: 'description',
          field_value_text: 'Test inventory item for API validation',
          field_type: 'text',
          smart_code: 'HERA.RETAIL.INVENTORY.MAIN.FIELD.DESCRIPTION.v1'
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
      console.log('📊 Created Entity:', JSON.stringify(postData, null, 2));
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
testEntitiesAPI();