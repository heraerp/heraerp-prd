#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkSmartCodePattern() {
  // Get some existing smart codes from core_dynamic_data
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .select('smart_code')
    .not('smart_code', 'is', null)
    .limit(10);
  
  if (error) {
    console.error('Error:', error);
    return;
  }
  
  console.log('Existing smart codes in core_dynamic_data:');
  data.forEach(row => {
    console.log(`  - ${row.smart_code}`);
  });
  
  // Test our smart codes
  const testCodes = [
    'HERA.SALON.CATALOG.ENTITY.DYN.v1',
    'HERA.SALON.INVENTORY.REORDER_LEVEL.v1',
    'HERA.SALON.CATALOG.PRICE_LIST.DYN.v1',
    'HERA.SALON.DYN.FIELD.v1',
    'HERA.SALON.DYN.v1'
  ];
  
  console.log('\nTesting smart code patterns:');
  const pattern = /^HERA\.[A-Z0-9_]{3,30}(?:\.[A-Z0-9_]{2,40}){3,8}\.v[0-9]+$/;
  
  testCodes.forEach(code => {
    const matches = pattern.test(code);
    console.log(`  ${code} - ${matches ? '✅ VALID' : '❌ INVALID'}`);
  });
}

checkSmartCodePattern();