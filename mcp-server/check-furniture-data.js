#!/usr/bin/env node
require('dotenv').config({ path: '../.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FURNITURE_ORG_ID = 'f0af4ced-9d12-4a55-a649-b484368db249';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkFurnitureData() {
  console.log('🪑 Checking furniture data for Kerala Furniture Works (Demo)...');
  console.log(`📍 Organization ID: ${FURNITURE_ORG_ID}\n`);

  // Check organization
  const { data: org } = await supabase
    .from('core_organizations')
    .select('*')
    .eq('id', FURNITURE_ORG_ID)
    .single();
  
  console.log('Organization:', org?.organization_name || 'Not found');

  // Check products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'product');
  
  console.log('\nProducts:', products?.length || 0);
  products?.forEach(p => console.log(`  - ${p.entity_name}`));

  // Check customers
  const { data: customers } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID)
    .eq('entity_type', 'customer');
  
  console.log('\nCustomers:', customers?.length || 0);
  customers?.forEach(c => console.log(`  - ${c.entity_name}`));

  // Check transactions
  const { data: transactions } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', FURNITURE_ORG_ID);
  
  console.log('\nTransactions:', transactions?.length || 0);
  transactions?.forEach(t => console.log(`  - ${t.transaction_code}: ${t.transaction_type}`));
}

checkFurnitureData();