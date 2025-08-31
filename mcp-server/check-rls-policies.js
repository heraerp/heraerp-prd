#!/usr/bin/env node

/**
 * Check RLS policies that might affect ice cream dashboard
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

const KOCHI_ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'

async function checkRLSPolicies() {
  console.log('🔍 Checking RLS policies...\n')

  try {
    // Check if we can query with anon key (simulating frontend)
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const anonClient = createClient(supabaseUrl, supabaseAnonKey)
    
    console.log('1️⃣ Testing with Anonymous Key (simulating frontend)...')
    
    // Test 1: Query organizations
    const { data: orgData, error: orgError } = await anonClient
      .from('core_organizations')
      .select('organization_name')
      .eq('id', KOCHI_ORG_ID)
      .single()
      
    if (orgError) {
      console.log('   ❌ Cannot query organizations:', orgError.message)
      console.log('      This suggests RLS is blocking anonymous access')
    } else {
      console.log('   ✅ Can query organizations:', orgData?.organization_name)
    }
    
    // Test 2: Query entities
    const { data: entityData, error: entityError } = await anonClient
      .from('core_entities')
      .select('entity_type')
      .eq('organization_id', KOCHI_ORG_ID)
      .limit(1)
      
    if (entityError) {
      console.log('   ❌ Cannot query entities:', entityError.message)
    } else {
      console.log('   ✅ Can query entities:', entityData?.length || 0, 'found')
    }
    
    // Test 3: Query transactions
    const { data: txnData, error: txnError } = await anonClient
      .from('universal_transactions')
      .select('transaction_type')
      .eq('organization_id', KOCHI_ORG_ID)
      .limit(1)
      
    if (txnError) {
      console.log('   ❌ Cannot query transactions:', txnError.message)
    } else {
      console.log('   ✅ Can query transactions:', txnData?.length || 0, 'found')
    }
    
    console.log('\n2️⃣ Testing with Service Role Key (backend access)...')
    
    // Same queries with service role
    const { count: serviceOrgCount } = await supabase
      .from('core_organizations')
      .select('*', { count: 'exact', head: true })
      .eq('id', KOCHI_ORG_ID)
      
    const { count: serviceEntityCount } = await supabase
      .from('core_entities')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', KOCHI_ORG_ID)
      
    const { count: serviceTxnCount } = await supabase
      .from('universal_transactions')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', KOCHI_ORG_ID)
      
    console.log('   ✅ Service role can access:')
    console.log(`      - Organizations: ${serviceOrgCount}`)
    console.log(`      - Entities: ${serviceEntityCount}`)
    console.log(`      - Transactions: ${serviceTxnCount}`)
    
    console.log('\n📊 Summary:')
    if (orgError || entityError || txnError) {
      console.log('   ⚠️  RLS policies are blocking anonymous access!')
      console.log('\n   This is why the dashboard shows no data.')
      console.log('\n💡 Solutions:')
      console.log('   1. Add RLS policies to allow public read access for demo orgs')
      console.log('   2. Use authenticated requests (requires user login)')
      console.log('   3. Create demo-specific RLS policies')
      console.log('\n   Example RLS policy for demo access:')
      console.log(`
CREATE POLICY "Allow public read for demo organizations" ON core_entities
FOR SELECT USING (
  organization_id IN (
    '1471e87b-b27e-42ef-8192-343cc5e0d656', -- Kochi Ice Cream
    '8c4f6b2d-5a91-4e8c-b3d7-1f9e8a7c6d54', -- Mario's Restaurant
    'c7d9e4f8-3b2a-4e6d-8f1c-9a7b5c3d2e8f'  -- Bella Beauty Salon
  )
);`)
    } else {
      console.log('   ✅ Anonymous access is working!')
      console.log('   The issue might be elsewhere (CORS, network, etc.)')
    }
    
  } catch (error) {
    console.error('\n❌ Unexpected error:', error)
  }
}

// Run the check
checkRLSPolicies()