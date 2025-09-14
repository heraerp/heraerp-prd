#\!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const KERALA_FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function checkFurnitureData() {
  console.log('🔍 Checking Kerala Furniture Works data...\n');
  
  // Check organization
  const { data: orgData, error: orgError } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', KERALA_FURNITURE_ORG_ID);
    
  console.log('📦 Organization:', orgData ? orgData.length : 0, 'found');
  
  // Check products
  const { data: productData, error: productError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('entity_type', 'product');
    
  console.log('🪑 Products:', productData ? productData.length : 0, 'found');
  
  // Check customers
  const { data: customerData, error: customerError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('entity_type', 'customer');
    
  console.log('👥 Customers:', customerData ? customerData.length : 0, 'found');
  
  // Check sales orders
  const { data: orderData, error: orderError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', KERALA_FURNITURE_ORG_ID)
    .eq('transaction_type', 'sales_order');
    
  console.log('📋 Sales Orders:', orderData ? orderData.length : 0, 'found');
  
  if (orderData && orderData.length > 0) {
    console.log('\nOrder Details:');
    orderData.forEach(order => {
      console.log(`  - ${order.transaction_code}: ₹${order.total_amount} (Status: ${order.transaction_status})`);
    });
    
    // Check order lines
    const orderIds = orderData.map(o => o.id);
    const { data: lineData, error: lineError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .in('transaction_id', orderIds);
      
    console.log('\n📝 Order Lines:', lineData ? lineData.length : 0, 'found');
  }
}

checkFurnitureData().catch(console.error);
EOF < /dev/null