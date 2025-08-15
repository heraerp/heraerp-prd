#!/usr/bin/env node

console.log('🔍 CHECKING CURRENT COA STRUCTURE IN SUPABASE');
console.log('=' .repeat(50));

const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co',
  process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function checkCOAStructure() {
  try {
    console.log('📊 Step 1: Checking core_entities table structure...');
    
    // Get a sample row to see column structure
    const { data: sampleEntity, error: sampleError } = await supabase
      .from('core_entities')
      .select('*')
      .limit(1)
      .single();

    if (sampleError) {
      console.error('❌ Error getting sample entity:', sampleError);
      return;
    }

    console.log('✅ Sample entity columns:', Object.keys(sampleEntity || {}));

    console.log('\n📊 Step 2: Looking for GL accounts...');
    
    // Look for accounts that might be GL accounts
    const { data: glAccounts, error: glError } = await supabase
      .from('core_entities')
      .select('*')
      .ilike('entity_type', '%gl%')
      .limit(10);

    if (glError) {
      console.warn('⚠️ Error searching for GL accounts:', glError.message);
    } else {
      console.log(`✅ Found ${glAccounts?.length || 0} potential GL accounts`);
      if (glAccounts && glAccounts.length > 0) {
        console.log('Sample GL account:', glAccounts[0]);
      }
    }

    console.log('\n📊 Step 3: Looking for accounts with numeric entity_code...');
    
    // Look for accounts with numeric codes
    const { data: numericAccounts, error: numericError } = await supabase
      .from('core_entities')
      .select('*')
      .filter('entity_code', 'like', '[0-9]%')
      .limit(10);

    if (numericError) {
      console.warn('⚠️ Error searching for numeric accounts:', numericError.message);
    } else {
      console.log(`✅ Found ${numericAccounts?.length || 0} accounts with numeric codes`);
      if (numericAccounts && numericAccounts.length > 0) {
        console.log('Sample numeric account:', numericAccounts[0]);
      }
    }

    console.log('\n📊 Step 4: Looking for salon accounts...');
    
    // Look for salon-specific accounts
    const { data: salonAccounts, error: salonError } = await supabase
      .from('core_entities')
      .select('*')
      .ilike('smart_code', '%salon%')
      .limit(10);

    if (salonError) {
      console.warn('⚠️ Error searching for salon accounts:', salonError.message);
    } else {
      console.log(`✅ Found ${salonAccounts?.length || 0} salon accounts`);
      if (salonAccounts && salonAccounts.length > 0) {
        console.log('Sample salon account:', salonAccounts[0]);
      }
    }

    console.log('\n📊 Step 5: Checking core_dynamic_data for account_type...');
    
    // Check if account_type is stored in dynamic data
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('field_name', 'account_type')
      .limit(5);

    if (dynamicError) {
      console.warn('⚠️ Error checking dynamic data:', dynamicError.message);
    } else {
      console.log(`✅ Found ${dynamicData?.length || 0} account_type entries in dynamic data`);
      if (dynamicData && dynamicData.length > 0) {
        console.log('Sample account_type data:', dynamicData[0]);
      }
    }

  } catch (error) {
    console.error('❌ Check failed:', error.message);
    console.error(error);
  }
}

checkCOAStructure().catch(console.error);