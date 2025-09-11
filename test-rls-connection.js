#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

console.log('🔧 Testing Supabase RLS Connection...\n')

// Test 1: Check environment variables
console.log('1️⃣ Environment Variables:')
console.log('   NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing')
console.log('   NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing')
console.log('   SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ Set' : '❌ Missing')
console.log('   DEFAULT_ORGANIZATION_ID:', process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'Not set')
console.log()

// Test 2: Try with anon key (will fail with RLS)
console.log('2️⃣ Testing with Anon Key (expects RLS error):')
try {
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  
  const { data: anonData, error: anonError } = await anonClient
    .from('core_entities')
    .insert({
      entity_type: 'test',
      entity_name: 'RLS Test with Anon',
      organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'test-org',
      smart_code: 'HERA.TEST.RLS.v1'
    })
    .select()

  if (anonError) {
    console.log('   ❌ Expected RLS Error:', anonError.message)
  } else {
    console.log('   ⚠️  Unexpected success - RLS might be disabled!')
  }
} catch (e) {
  console.log('   ❌ Error:', e.message)
}
console.log()

// Test 3: Try with service role key (should succeed)
console.log('3️⃣ Testing with Service Role Key (should bypass RLS):')
try {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  const { data: serviceData, error: serviceError } = await serviceClient
    .from('core_entities')
    .insert({
      entity_type: 'test',
      entity_name: 'RLS Test with Service Role',
      organization_id: process.env.NEXT_PUBLIC_DEFAULT_ORGANIZATION_ID || 'f0af4ced-9d12-4a55-a649-b484368db249',
      smart_code: 'HERA.TEST.RLS.SERVICE.v1',
      metadata: {
        test: true,
        created_at: new Date().toISOString()
      }
    })
    .select()
    .single()

  if (serviceError) {
    console.log('   ❌ Service Role Error:', serviceError.message)
    console.log('   Details:', serviceError)
  } else {
    console.log('   ✅ Success! Created entity:', serviceData.id)
    console.log('   Entity Name:', serviceData.entity_name)
    
    // Clean up test data
    const { error: deleteError } = await serviceClient
      .from('core_entities')
      .delete()
      .eq('id', serviceData.id)
    
    if (!deleteError) {
      console.log('   🧹 Test data cleaned up')
    }
  }
} catch (e) {
  console.log('   ❌ Error:', e.message)
}
console.log()

// Test 4: Check RLS policies
console.log('4️⃣ Checking RLS Policies:')
try {
  const serviceClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )
  
  // Query to check if RLS is enabled
  const { data: rlsCheck, error: rlsError } = await serviceClient
    .rpc('check_table_rls', { table_name: 'core_entities' })
    .single()
  
  if (rlsError) {
    // This RPC might not exist, so we'll check differently
    console.log('   ℹ️  Cannot directly check RLS status')
  } else {
    console.log('   RLS Status:', rlsCheck)
  }
  
  // Alternative: Try to query without organization_id filter
  const { count, error: countError } = await serviceClient
    .from('core_entities')
    .select('*', { count: 'exact', head: true })
  
  if (!countError) {
    console.log('   📊 Total entities in database:', count)
  }
} catch (e) {
  console.log('   ℹ️  RLS check error:', e.message)
}

console.log('\n✨ RLS Test Complete!')
console.log('\n💡 Tips:')
console.log('1. For scripts and server-side: Use SUPABASE_SERVICE_ROLE_KEY')
console.log('2. For client-side: Ensure user is authenticated first')
console.log('3. Always include organization_id in your inserts')
console.log('4. Use Universal API when possible - it handles auth context')