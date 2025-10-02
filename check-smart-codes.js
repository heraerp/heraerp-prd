#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkSmartCodes() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  // Check existing smart codes in dynamic data
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('smart_code')
    .not('smart_code', 'is', null)
    .limit(10);

  if (!dynamicError && dynamicData) {
    console.log('Existing smart codes in core_dynamic_data:');
    dynamicData.forEach(d => console.log('  -', d.smart_code));
  }

  // Check smart codes in entities
  const { data: entityData } = await supabase
    .from('core_entities')
    .select('smart_code')
    .not('smart_code', 'is', null)
    .limit(5);

  if (entityData) {
    console.log('\nSmart codes in entities:');
    entityData.forEach(d => console.log('  -', d.smart_code));
  }
}

checkSmartCodes();