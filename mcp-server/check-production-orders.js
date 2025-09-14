#!/usr/bin/env node
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

async function checkProductionOrders() {
  console.log('🔍 Checking Production Orders...\n');
  
  try {
    // Get all production orders for the organization
    const { data: orders, error } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'production_order')
      .order('total_amount', { ascending: false });

    if (error) throw error;

    console.log(`Found ${orders.length} production orders:\n`);

    for (const order of orders) {
      console.log(`ID: ${order.id}`);
      console.log(`Transaction Code: ${order.transaction_code}`);
      console.log(`Amount: $${order.total_amount.toLocaleString()}`);
      console.log(`Status: ${order.transaction_status}`);
      console.log(`Metadata: ${JSON.stringify(order.metadata, null, 2)}`);
      console.log('---\n');
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

checkProductionOrders();