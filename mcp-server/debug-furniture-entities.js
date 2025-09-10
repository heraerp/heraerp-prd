#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '../.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  const organizationId = process.env.DEFAULT_ORGANIZATION_ID || 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';
  
  console.log('Organization ID:', organizationId);
  
  // Check all products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'product')
    .order('created_at', { ascending: false })
    .limit(10);
  
  console.log('\n📦 Products in organization:');
  products?.forEach(p => {
    console.log(`- ${p.entity_name} (${p.entity_code}) - ID: ${p.id}`);
  });
  
  // Check specific product
  const { data: desk } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('entity_type', 'product')
    .eq('entity_code', 'DESK-EXE-001')
    .single();
  
  console.log('\n🔍 Desk product:', desk ? 'FOUND' : 'NOT FOUND');
  if (desk) {
    console.log('  ID:', desk.id);
    console.log('  Name:', desk.entity_name);
  }
}

main();