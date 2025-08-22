#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testOrganizationFunctions() {
  console.log('🧪 Testing organization functions...\n');

  // Test 1: Check subdomain availability
  console.log('1. Testing check_subdomain_availability...');
  const { data: checkData, error: checkError } = await supabase
    .rpc('check_subdomain_availability', { p_subdomain: 'test-org-' + Date.now() });
  
  if (checkError) {
    console.error('   ❌ Error:', checkError.message);
  } else {
    console.log('   ✅ Success:', checkData);
  }

  // Test 2: Check reserved subdomain
  console.log('\n2. Testing reserved subdomain (should be unavailable)...');
  const { data: reservedData, error: reservedError } = await supabase
    .rpc('check_subdomain_availability', { p_subdomain: 'admin' });
  
  if (reservedError) {
    console.error('   ❌ Error:', reservedError.message);
  } else {
    console.log('   ✅ Result:', reservedData);
  }

  // Test 3: Get user organizations (with test UUID)
  console.log('\n3. Testing get_user_organizations...');
  const testUserId = '00000000-0000-0000-0000-000000000000';
  const { data: orgsData, error: orgsError } = await supabase
    .rpc('get_user_organizations', { p_user_id: testUserId });
  
  if (orgsError) {
    console.error('   ❌ Error:', orgsError.message);
  } else {
    console.log('   ✅ Success:', orgsData);
  }

  // Test 4: Get organization by subdomain
  console.log('\n4. Testing get_organization_by_subdomain...');
  const { data: orgBySubdomain, error: orgBySubdomainError } = await supabase
    .rpc('get_organization_by_subdomain', { p_subdomain: 'non-existent-org' });
  
  if (orgBySubdomainError) {
    console.error('   ❌ Error:', orgBySubdomainError.message);
  } else {
    console.log('   ✅ Result:', orgBySubdomain);
  }

  console.log('\n✅ All function tests completed!');
  console.log('\n📝 Note: The create_organization_with_owner function requires authentication,');
  console.log('   so it should be tested through the actual signup flow.');
}

testOrganizationFunctions();