#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

async function checkMetadataColumns() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  console.log('🔍 Checking which tables HAVE metadata column:\n');

  // Check core_entities
  try {
    const { data: entitiesData, error: e1 } = await supabase
      .from('core_entities')
      .select('metadata')
      .limit(1);
    console.log('✅ core_entities HAS metadata column');
    if (entitiesData && entitiesData.length > 0) {
      console.log('   Sample metadata:', entitiesData[0].metadata);
    }
  } catch (err) {
    console.log('❌ core_entities does NOT have metadata column');
  }

  // Check core_dynamic_data
  try {
    const { data: dynamicData, error: e2 } = await supabase
      .from('core_dynamic_data')
      .select('metadata')
      .limit(1);

    if (e2) {
      console.log('❌ core_dynamic_data does NOT have metadata column');
      console.log('   Error:', e2.message);
    } else {
      console.log('✅ core_dynamic_data HAS metadata column');
      if (dynamicData && dynamicData.length > 0) {
        console.log('   Sample metadata:', dynamicData[0].metadata);
      }
    }
  } catch (err) {
    console.log('❌ core_dynamic_data does NOT have metadata column');
    console.log('   Error:', err.message);
  }

  // Check what columns core_dynamic_data actually has
  console.log('\n🔍 What columns does core_dynamic_data actually have?');
  try {
    const { data: sample, error } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .limit(1);

    if (!error && sample && sample.length > 0) {
      console.log('core_dynamic_data columns:', Object.keys(sample[0]).join(', '));
    } else {
      console.log('No data in core_dynamic_data or error:', error?.message);
    }
  } catch (err) {
    console.log('Error getting core_dynamic_data structure:', err.message);
  }
}

checkMetadataColumns();