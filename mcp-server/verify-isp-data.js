#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifyISPData() {
  console.log('🔍 Verifying Kerala Vision ISP Data...\n');
  
  const KERALA_VISION_ORG_ID = 'a1b2c3d4-5678-90ab-cdef-000000000001';
  
  // Check entities
  console.log('📊 Entities for Kerala Vision:');
  const { data: entities, error: entError } = await supabase
    .from('core_entities')
    .select('entity_type, entity_name, smart_code, metadata')
    .eq('organization_id', KERALA_VISION_ORG_ID);
    
  if (entities && entities.length > 0) {
    entities.forEach(e => {
      console.log(`  ${e.entity_type}: ${e.entity_name}`);
      console.log(`    Smart Code: ${e.smart_code}`);
      if (e.entity_type === 'metrics' && e.metadata) {
        console.log(`    Subscribers: ${e.metadata.total_subscribers}`);
        console.log(`    Revenue: ₹${(e.metadata.monthly_revenue / 10000000).toFixed(1)} Cr`);
        console.log(`    Uptime: ${e.metadata.network_uptime}%`);
      }
    });
  } else {
    console.log('  No entities found');
  }
  
  // Check transactions
  console.log('\n💰 Transactions for Kerala Vision:');
  const { data: transactions, error: txnError } = await supabase
    .from('universal_transactions')
    .select('transaction_type, transaction_code, total_amount, metadata')
    .eq('organization_id', KERALA_VISION_ORG_ID)
    .order('transaction_date', { ascending: false })
    .limit(6);
    
  if (transactions && transactions.length > 0) {
    transactions.forEach(t => {
      console.log(`  ${t.transaction_type}: ${t.transaction_code}`);
      console.log(`    Amount: ₹${(t.total_amount / 1000000).toFixed(1)}M`);
      if (t.metadata?.month) {
        console.log(`    Month: ${t.metadata.month}`);
      }
    });
  } else {
    console.log('  No transactions found');
  }
  
  console.log('\n✅ Verification complete!');
}

verifyISPData();