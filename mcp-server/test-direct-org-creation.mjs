#!/usr/bin/env node
/**
 * Test direct organization creation via table insert
 * This is the fallback approach for signup flow
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const TEST_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)
const TEST_EMAIL = 'hairtalkz2022@gmail.com';

console.log('🔍 Testing Direct Organization Creation');
console.log('='.repeat(70));

// Step 1: Check core_organizations schema
console.log('\n📋 Step 1: Checking core_organizations schema...');
try {
  const { data, error } = await supabase
    .from('core_organizations')
    .select('*')
    .limit(1);

  if (error) {
    console.log('   ❌ Error:', error.message);
  } else {
    console.log('   ✅ Table accessible');
    if (data && data.length > 0) {
      console.log('   📝 Sample columns:', Object.keys(data[0]).join(', '));
    }
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

// Step 2: Create organization (Sacred Six pattern)
console.log('\n📋 Step 2: Creating test organization...');

const testOrgName = 'Test Salon ' + Date.now();

try {
  const orgData = {
    organization_name: testOrgName,
    smart_code: 'HERA.ORG.ENTITY.SALON.V1',
    settings: {
      industry: 'salon',
      currency: 'USD',
      selected_app: 'salon',
      created_via: 'signup_test',
      theme: {
        preset: 'salon-luxe'
      }
    },
    created_by: TEST_USER_ID,
    updated_by: TEST_USER_ID
  };

  const { data, error } = await supabase
    .from('core_organizations')
    .insert(orgData)
    .select()
    .single();

  if (error) {
    console.log('   ❌ Error:', error.message);
    console.log('   Code:', error.code);
    console.log('   Details:', error.details);
  } else {
    console.log('   ✅ Organization created!');
    console.log('   ID:', data.id);
    console.log('   Name:', data.organization_name);
    console.log('   Smart Code:', data.smart_code);

    const orgId = data.id;

    // Step 3: Create membership relationship
    console.log('\n📋 Step 3: Creating owner membership...');

    const membershipData = {
      from_entity_id: TEST_USER_ID,
      to_entity_id: orgId,
      relationship_type: 'MEMBER_OF',
      organization_id: orgId,
      relationship_data: {
        role: 'owner',
        joined_at: new Date().toISOString(),
        invited_by: null,
        is_primary: true
      },
      smart_code: 'HERA.ORG.RELATIONSHIP.MEMBERSHIP.V1',
      is_active: true,
      created_by: TEST_USER_ID,
      updated_by: TEST_USER_ID
    };

    const { data: relData, error: relError } = await supabase
      .from('core_relationships')
      .insert(membershipData)
      .select()
      .single();

    if (relError) {
      console.log('   ❌ Error:', relError.message);
      console.log('   Code:', relError.code);
    } else {
      console.log('   ✅ Membership created!');
      console.log('   ID:', relData.id);
      console.log('   Role:', relData.relationship_data.role);
    }

    // Step 4: Verify the complete setup
    console.log('\n📋 Step 4: Verifying complete setup...');

    // Check organization
    const { data: orgCheck } = await supabase
      .from('core_organizations')
      .select('id, organization_name, settings')
      .eq('id', orgId)
      .single();

    if (orgCheck) {
      console.log('   ✅ Organization verified:');
      console.log('      Name:', orgCheck.organization_name);
      console.log('      Industry:', orgCheck.settings?.industry);
      console.log('      Currency:', orgCheck.settings?.currency);
      console.log('      App:', orgCheck.settings?.selected_app);
    }

    // Check membership
    const { data: memberCheck } = await supabase
      .from('core_relationships')
      .select('relationship_data, is_active')
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    if (memberCheck) {
      console.log('   ✅ Membership verified:');
      console.log('      Role:', memberCheck.relationship_data.role);
      console.log('      Active:', memberCheck.is_active);
    }

    // Step 5: Test the /api/v2/auth/resolve-membership endpoint pattern
    console.log('\n📋 Step 5: Simulating resolve-membership query...');

    const { data: resolveData, error: resolveError } = await supabase
      .from('core_relationships')
      .select(`
        organization_id,
        relationship_data,
        core_organizations!core_relationships_organization_id_fkey (
          id,
          organization_name,
          settings
        )
      `)
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true)
      .single();

    if (resolveError) {
      console.log('   ❌ Error:', resolveError.message);
    } else {
      console.log('   ✅ Resolve query works!');
      console.log('   Organization:', resolveData.core_organizations?.organization_name);
      console.log('   Role:', resolveData.relationship_data.role);
      console.log('   Settings:', JSON.stringify(resolveData.core_organizations?.settings, null, 2));
    }

    // Step 6: Cleanup
    console.log('\n📋 Step 6: Cleaning up...');

    // Delete membership first (foreign key constraint)
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', orgId);

    // Delete organization
    const { error: deleteError } = await supabase
      .from('core_organizations')
      .delete()
      .eq('id', orgId);

    if (deleteError) {
      console.log('   ⚠️  Cleanup warning:', deleteError.message);
    } else {
      console.log('   ✅ Test data cleaned up');
    }
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
  console.log('   Stack:', err.stack);
}

console.log('\n' + '='.repeat(70));
console.log('📊 IMPLEMENTATION GUIDE FOR SIGNUP FLOW');
console.log('='.repeat(70));
console.log('\n✅ WORKING PATTERN - Use this in /api/v2/organizations:');
console.log('\n1. Create Organization:');
console.log(`
await supabase
  .from('core_organizations')
  .insert({
    organization_name: businessName,
    smart_code: 'HERA.ORG.ENTITY.SALON.V1',
    settings: {
      industry: industry,
      currency: currency,
      selected_app: selectedApp,
      created_via: 'signup'
    },
    created_by: userId,
    updated_by: userId
  })
  .select()
  .single();
`);

console.log('2. Create Owner Membership:');
console.log(`
await supabase
  .from('core_relationships')
  .insert({
    from_entity_id: userId,
    to_entity_id: organizationId,
    relationship_type: 'MEMBER_OF',
    organization_id: organizationId,
    relationship_data: {
      role: 'owner',
      joined_at: new Date().toISOString()
    },
    smart_code: 'HERA.ORG.RELATIONSHIP.MEMBERSHIP.V1',
    is_active: true,
    created_by: userId,
    updated_by: userId
  });
`);

console.log('\n3. Return to client:');
console.log(`
{
  success: true,
  organization_id: organizationId,
  role: 'owner'
}
`);

console.log('\n✅ This pattern:');
console.log('   - Creates organization in Sacred Six pattern');
console.log('   - Stores business data in settings JSON');
console.log('   - Creates owner membership relationship');
console.log('   - Uses proper smart codes');
console.log('   - Includes actor stamping (created_by/updated_by)');
console.log('');
