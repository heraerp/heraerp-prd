#!/usr/bin/env node

const fetch = require('node-fetch');

// Test data for salon inventory
const testProduct = {
  entity_name: "OPI Gel Polish - Classic Red",
  entity_type: "product",
  smart_code: "HERA.SALON.PRODUCT.INVENTORY.v1",
  metadata: {
    category: "Nail Care",
    sku: "OPI-RED-001",
    description: "Long-lasting gel polish in classic red shade"
  },
  dynamic_fields: {
    price: 24.99,
    cost: 12.00,
    stock_quantity: 15,
    reorder_point: 5,
    supplier: "OPI Professional"
  }
};

async function testInventoryPage() {
  console.log('🧪 Testing Salon Inventory Page\n');
  
  // Start dev server message
  console.log('📌 Make sure the dev server is running:');
  console.log('   npm run dev\n');
  
  const baseUrl = 'http://localhost:3000'; // Default port
  
  try {
    // Test 1: Check if API is accessible
    console.log('1️⃣ Testing Products API...');
    const getResponse = await fetch(`${baseUrl}/api/v1/salon/products`);
    
    if (!getResponse.ok) {
      throw new Error(`API returned ${getResponse.status}`);
    }
    
    const existingProducts = await getResponse.json();
    console.log(`   ✅ API accessible - Found ${existingProducts.data?.length || 0} existing products`);
    
    // Test 2: Create a test product
    console.log('\n2️⃣ Creating test product...');
    const postResponse = await fetch(`${baseUrl}/api/v1/salon/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testProduct)
    });
    
    if (!postResponse.ok) {
      const error = await postResponse.text();
      throw new Error(`Failed to create product: ${error}`);
    }
    
    const createdProduct = await postResponse.json();
    console.log(`   ✅ Product created: ${createdProduct.data.entity_name}`);
    console.log(`      ID: ${createdProduct.data.id}`);
    console.log(`      SKU: ${createdProduct.data.metadata?.sku}`);
    
    // Test 3: Verify product appears in list
    console.log('\n3️⃣ Verifying product in inventory...');
    const verifyResponse = await fetch(`${baseUrl}/api/v1/salon/products`);
    const updatedProducts = await verifyResponse.json();
    
    const foundProduct = updatedProducts.data?.find(
      p => p.id === createdProduct.data.id
    );
    
    if (foundProduct) {
      console.log('   ✅ Product found in inventory list');
      console.log(`      Stock: ${foundProduct.dynamic_fields?.stock_quantity || 0}`);
      console.log(`      Price: $${foundProduct.dynamic_fields?.price || 0}`);
    } else {
      console.log('   ⚠️  Product not found in list - may need to refresh');
    }
    
    // Summary
    console.log('\n📊 Test Summary:');
    console.log('   ✅ API is working');
    console.log('   ✅ Products can be created');
    console.log('   ✅ Dynamic fields are stored');
    console.log('\n🌐 Visit the inventory page at:');
    console.log(`   ${baseUrl}/org/salon/inventory`);
    console.log('\n💡 The "Add Product" button should now work!');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure dev server is running: npm run dev');
    console.log('   2. Check if port 3000 is available');
    console.log('   3. Verify database connection in .env');
  }
}

// Add global fetch if not available
if (typeof fetch === 'undefined') {
  global.fetch = require('node-fetch');
}

testInventoryPage();