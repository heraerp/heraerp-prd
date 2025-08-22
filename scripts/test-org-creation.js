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

async function testOrganizationCreation() {
  console.log('🧪 Testing organization creation flow...\n');

  // Generate a unique subdomain for testing
  const testSubdomain = 'test-org-' + Date.now();
  
  // Test 1: Check subdomain availability
  console.log('1. Checking subdomain availability for:', testSubdomain);
  const { data: availData, error: availError } = await supabase
    .rpc('check_subdomain_availability', { p_subdomain: testSubdomain });
  
  if (availError) {
    console.error('   ❌ Error checking availability:', availError.message);
    return;
  }
  console.log('   ✅ Subdomain available:', availData);

  // Test 2: Create a test organization (without auth - will show expected error)
  console.log('\n2. Testing create_organization_with_owner function...');
  const { data: createData, error: createError } = await supabase
    .rpc('create_organization_with_owner', {
      p_org_name: 'Test Organization',
      p_subdomain: testSubdomain,
      p_owner_id: '642fe246-6ac2-4e1e-8f18-cb28187634c5', // Your user ID
      p_owner_email: 'snarayana@hanaset.com',
      p_owner_name: 'Test User',
      p_org_type: 'general'
    });
  
  if (createError) {
    console.error('   ❌ Error creating organization:', createError.message);
  } else if (createData?.success === false) {
    console.error('   ❌ Organization creation failed:', createData.error);
  } else {
    console.log('   ✅ Organization created successfully!');
    console.log('   Organization ID:', createData?.organization?.id);
    console.log('   Subdomain:', createData?.organization?.subdomain);
    console.log('   User ID:', createData?.user?.id);
  }

  // Test 3: Verify the subdomain is now taken
  console.log('\n3. Verifying subdomain is now taken...');
  const { data: checkData, error: checkError } = await supabase
    .rpc('check_subdomain_availability', { p_subdomain: testSubdomain });
  
  if (checkError) {
    console.error('   ❌ Error checking availability:', checkError.message);
  } else {
    console.log('   ✅ Subdomain status:', checkData);
  }

  // Test 4: Get user organizations
  console.log('\n4. Getting user organizations...');
  const { data: orgsData, error: orgsError } = await supabase
    .rpc('get_user_organizations', { 
      p_user_id: '642fe246-6ac2-4e1e-8f18-cb28187634c5' 
    });
  
  if (orgsError) {
    console.error('   ❌ Error getting organizations:', orgsError.message);
  } else {
    console.log('   ✅ User organizations:', JSON.stringify(orgsData, null, 2));
  }

  console.log('\n✅ All tests completed!');
}

testOrganizationCreation();