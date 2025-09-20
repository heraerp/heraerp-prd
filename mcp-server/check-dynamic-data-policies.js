const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDynamicDataPolicies() {
  console.log('🔍 Checking core_dynamic_data policies...\n');
  
  // Test queries with different approaches
  console.log('1️⃣ Service Role Query (should work):');
  const { data: serviceData, error: serviceError } = await supabase
    .from('core_dynamic_data')
    .select('id')
    .limit(1);
    
  console.log('Result:', serviceError ? `❌ ${serviceError.message}` : '✅ Success');
  
  console.log('\n2️⃣ Anon Key Query (failing):');
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  
  const { data: anonData, error: anonError } = await anonClient
    .from('core_dynamic_data')
    .select('id')
    .limit(1);
    
  console.log('Result:', anonError ? `❌ ${anonError.message}` : '✅ Success');
  
  if (anonError?.message.includes('app.current_org')) {
    console.log('\n🚨 DIAGNOSIS: The policy still references app.current_org');
    console.log('\n📋 IMMEDIATE FIX:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Run this SQL to fix core_dynamic_data specifically:\n');
    
    console.log(`-- Drop ALL policies on core_dynamic_data
DROP POLICY IF EXISTS "hera_dna_dynamic_data_access" ON core_dynamic_data;
DROP POLICY IF EXISTS "simple_dynamic_data_access" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable read access for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable insert for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable update for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "Enable delete for organization members" ON core_dynamic_data;
DROP POLICY IF EXISTS "dynamic_data_org_isolation" ON core_dynamic_data;

-- Create simple authentication-based policy
CREATE POLICY "auth_dynamic_data_access" ON core_dynamic_data
FOR ALL USING (
  auth.role() = 'service_role' OR 
  auth.role() = 'authenticated'
);`);
  }
}

checkDynamicDataPolicies().catch(console.error);