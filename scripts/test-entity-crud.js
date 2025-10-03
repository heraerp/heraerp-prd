#!/usr/bin/env node

const fetch = require('node-fetch');
require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') });

const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const TEST_TOKEN = 'demo-token-salon-owner';

async function apiCall(endpoint, options = {}) {
  const url = `${API_BASE_URL}/api/v2/${endpoint}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${TEST_TOKEN}`,
      'x-hera-api-version': 'v2',
      ...options.headers
    }
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    console.error(`❌ ${options.method || 'GET'} ${endpoint} failed:`, data);
    throw new Error(data.error || 'API call failed');
  }
  
  return data;
}

async function testCRUD() {
  console.log('🧪 Testing HERA V2 Entity CRUD Operations\n');
  
  try {
    // 1. Create a test category
    console.log('1️⃣ Creating test category...');
    const createResponse = await apiCall('entities', {
      method: 'POST',
      body: JSON.stringify({
        entity_type: 'CATEGORY',
        entity_name: 'Test Category ' + Date.now(),
        smart_code: 'HERA.TEST.CATEGORY.ENTITY.ITEM.V1',
        dynamic_fields: {
          kind: { value: 'SERVICE', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.KIND.V1' },
          name: { value: 'Test Category', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.NAME.V1' },
          status: { value: 'active', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1' }
        }
      })
    });
    
    console.log('✅ Created:', {
      id: createResponse.data.id,
      name: createResponse.data.entity_name
    });
    
    const entityId = createResponse.data.id;
    
    // 2. Read all categories
    console.log('\n2️⃣ Reading categories...');
    const readResponse = await apiCall('entities?entity_type=CATEGORY&include_dynamic=true');
    console.log(`✅ Found ${readResponse.data.length} categories`);
    
    // Find our created category
    const ourCategory = readResponse.data.find(c => c.id === entityId);
    if (ourCategory) {
      console.log('✅ Our category found:', {
        id: ourCategory.id,
        name: ourCategory.entity_name,
        kind: ourCategory.dynamic_fields?.kind?.value
      });
    }
    
    // 3. Update the category
    console.log('\n3️⃣ Updating category...');
    const updateResponse = await apiCall('entities', {
      method: 'PUT',
      body: JSON.stringify({
        entity_id: entityId,
        entity_name: 'Updated Test Category',
        dynamic_fields: {
          name: { value: 'Updated Test Category', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.NAME.V1' },
          status: { value: 'inactive', type: 'text', smart_code: 'HERA.SALON.CATEGORY.DYN.STATUS.V1' }
        }
      })
    });
    console.log('✅ Updated successfully');
    
    // 4. Delete (soft) the category
    console.log('\n4️⃣ Soft deleting category...');
    const deleteResponse = await apiCall(`entities/${entityId}?hard_delete=false`, {
      method: 'DELETE'
    });
    console.log('✅ Soft deleted:', deleteResponse);
    
    // 5. Verify it is archived
    console.log('\n5️⃣ Verifying archived status...');
    const verifyResponse = await apiCall('entities?entity_type=CATEGORY&status=all&include_dynamic=true');
    const archivedCategory = verifyResponse.data.find(c => c.id === entityId);
    
    if (archivedCategory && archivedCategory.status === 'archived') {
      console.log('✅ Category is archived');
    } else {
      console.log('⚠️ Category status:', archivedCategory?.status || 'not found');
    }
    
    console.log('\n✅ All CRUD operations completed successfully!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run the test
testCRUD().catch(console.error);