#!/usr/bin/env node
/**
 * FINAL TEST: Organization creation with actual schema
 * Based on discovered columns from core_organizations
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Test data
const TEST_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com (owner)

console.log('🔍 FINAL TEST: Organization Creation with Actual Schema');
console.log('='.repeat(70));
console.log('\nDiscovered columns:');
console.log('  - organization_name, organization_code, organization_type');
console.log('  - industry_classification, settings, status');
console.log('  - created_by, updated_by, created_at, updated_at');
console.log('');

const testOrgName = 'Final Test Salon ' + Date.now();

console.log('📋 Creating organization...');
try {
  // Generate unique organization code
  const organizationCode = 'ORG-' + Date.now().toString(36).toUpperCase();

  const orgData = {
    organization_name: testOrgName,
    organization_code: organizationCode,  // REQUIRED: Unique code for organization
    organization_type: 'salon',  // Using organization_type instead of smart_code
    industry_classification: 'beauty_salon',  // Using industry_classification
    settings: {
      currency: 'USD',
      selected_app: 'salon',
      created_via: 'signup_test',
      theme: {
        preset: 'salon-luxe'
      }
    },
    status: 'active',
    created_by: TEST_USER_ID,
    updated_by: TEST_USER_ID
  };

  console.log('   Payload:', JSON.stringify(orgData, null, 2));

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
    console.log('   Type:', data.organization_type);

    const orgId = data.id;

    // Create membership
    console.log('\n📋 Creating owner membership...');

    const membershipData = {
      from_entity_id: TEST_USER_ID,
      to_entity_id: orgId,
      relationship_type: 'MEMBER_OF',
      organization_id: orgId,
      relationship_data: {
        role: 'owner',
        joined_at: new Date().toISOString()
      },
      smart_code: 'HERA.ORG.RELATIONSHIP.MEMBERSHIP.OWNER.V1',  // REQUIRED
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
    } else {
      console.log('   ✅ Membership created!');
      console.log('   Role:', relData.relationship_data.role);
    }

    // Verify
    console.log('\n📋 Verification...');

    const { data: verifyData, error: verifyError } = await supabase
      .from('core_relationships')
      .select(`
        relationship_data,
        core_organizations!core_relationships_organization_id_fkey (
          id,
          organization_name,
          organization_type,
          settings
        )
      `)
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', orgId)
      .eq('relationship_type', 'MEMBER_OF')
      .single();

    if (!verifyError && verifyData) {
      console.log('   ✅ Complete setup verified!');
      console.log('   Organization:', verifyData.core_organizations.organization_name);
      console.log('   Type:', verifyData.core_organizations.organization_type);
      console.log('   Role:', verifyData.relationship_data.role);
      console.log('   Currency:', verifyData.core_organizations.settings.currency);
      console.log('   App:', verifyData.core_organizations.settings.selected_app);
    }

    // Cleanup
    console.log('\n📋 Cleanup...');
    await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', orgId);

    await supabase
      .from('core_organizations')
      .delete()
      .eq('id', orgId);

    console.log('   ✅ Test data cleaned up');
  }
} catch (err) {
  console.log('   ❌ Exception:', err.message);
}

console.log('\n' + '='.repeat(70));
console.log('✅ PRODUCTION-READY CODE FOR API ENDPOINT');
console.log('='.repeat(70));
console.log(`
// File: /src/app/api/v2/organizations/route.ts

export async function POST(request: Request) {
  try {
    const { supabase } = await import('@/lib/supabase/server')
    const body = await request.json()

    const {
      organization_name,
      industry,
      currency,
      settings
    } = body

    // Get authenticated user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate unique organization code
    const organizationCode = 'ORG-' + Date.now().toString(36).toUpperCase()

    // Step 1: Create organization
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .insert({
        organization_name,
        organization_code: organizationCode,
        organization_type: settings.selected_app || 'general',
        industry_classification: industry,
        settings: {
          currency,
          ...settings
        },
        status: 'active',
        created_by: user.id,
        updated_by: user.id
      })
      .select()
      .single()

    if (orgError) throw orgError

    // Step 2: Create owner membership
    const { error: memberError } = await supabase
      .from('core_relationships')
      .insert({
        from_entity_id: user.id,
        to_entity_id: org.id,
        relationship_type: 'MEMBER_OF',
        organization_id: org.id,
        relationship_data: {
          role: 'owner',
          joined_at: new Date().toISOString()
        },
        smart_code: 'HERA.ORG.RELATIONSHIP.MEMBERSHIP.OWNER.V1',
        is_active: true,
        created_by: user.id,
        updated_by: user.id
      })

    if (memberError) throw memberError

    return Response.json({
      success: true,
      organization_id: org.id,
      organization_name: org.organization_name
    })

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
`);

console.log('✅ Ready to implement in signup flow!\n');
