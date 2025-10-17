#!/usr/bin/env node

/**
 * Diagnose User Entity Resolution for Production
 * Checks membership and user entity for stuck authentication
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77';

async function diagnoseUserEntity() {
  console.log('🔍 Diagnosing User Entity Resolution');
  console.log('=====================================');
  console.log(`User ID: ${USER_ID}`);
  console.log();

  try {
    // Check if user exists in Supabase auth
    console.log('1️⃣ Checking Supabase Auth User...');
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID);
    
    if (authError) {
      console.log('❌ Auth user lookup failed:', authError.message);
      return;
    }
    
    if (!authUser?.user) {
      console.log('❌ User not found in Supabase auth');
      return;
    }
    
    console.log('✅ Auth user found:', {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at
    });
    console.log();

    // Check for user entity in core_entities
    console.log('2️⃣ Checking User Entity in core_entities...');
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('smart_code', `HERA.PLATFORM.USER.ENTITY.${USER_ID.toUpperCase()}.V1`);

    if (entityError) {
      console.log('❌ Entity lookup failed:', entityError.message);
      return;
    }

    console.log(`📊 Found ${userEntities?.length || 0} user entities`);
    if (userEntities?.length > 0) {
      console.log('✅ User entity found:', {
        id: userEntities[0].id,
        entity_name: userEntities[0].entity_name,
        organization_id: userEntities[0].organization_id,
        smart_code: userEntities[0].smart_code
      });
    } else {
      console.log('❌ No user entity found');
    }
    console.log();

    // Check for memberships
    console.log('3️⃣ Checking User Memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .from('core_relationships')
      .select(`
        *,
        target_entity:core_entities!target_entity_id(
          id, entity_name, entity_type, organization_id
        )
      `)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('source_entity_id', userEntities?.[0]?.id || 'null');

    if (membershipError) {
      console.log('❌ Membership lookup failed:', membershipError.message);
      return;
    }

    console.log(`📊 Found ${memberships?.length || 0} memberships`);
    if (memberships?.length > 0) {
      memberships.forEach((membership, index) => {
        console.log(`✅ Membership ${index + 1}:`, {
          id: membership.id,
          organization_id: membership.organization_id,
          target_org: membership.target_entity?.entity_name,
          created_at: membership.created_at
        });
      });
    } else {
      console.log('❌ No memberships found');
    }
    console.log();

    // Check organizations available
    console.log('4️⃣ Checking Available Organizations...');
    const { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name, organization_type')
      .limit(10);

    if (orgError) {
      console.log('❌ Organization lookup failed:', orgError.message);
      return;
    }

    console.log(`📊 Found ${orgs?.length || 0} organizations`);
    orgs?.forEach((org, index) => {
      console.log(`🏢 Org ${index + 1}:`, {
        id: org.id,
        name: org.organization_name,
        type: org.organization_type
      });
    });
    console.log();

    // Provide fix recommendations
    console.log('🛠️ RECOMMENDATIONS:');
    console.log('=====================================');
    
    if (!userEntities?.length) {
      console.log('❗ Missing user entity - need to create it');
      console.log('💡 Fix: Run user entity creation script');
    }
    
    if (!memberships?.length && userEntities?.length > 0) {
      console.log('❗ Missing memberships - need to create relationships');
      console.log('💡 Fix: Run membership setup script');
    }
    
    if (userEntities?.length > 0 && memberships?.length > 0) {
      console.log('✅ User entity and memberships exist - check auth provider logic');
    }

  } catch (error) {
    console.error('💥 Diagnosis failed:', error);
  }
}

async function fixUserEntity() {
  console.log('\n🔧 ATTEMPTING AUTOMATIC FIX...');
  console.log('=====================================');

  try {
    // Get default organization (assuming salon org for now)
    const { data: defaultOrg } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_type', 'salon')
      .limit(1)
      .single();

    if (!defaultOrg) {
      console.log('❌ No default organization found');
      return;
    }

    console.log('🏢 Using default organization:', defaultOrg.organization_name);

    // Try to create/fix user membership
    const { data: result, error } = await supabase.rpc('setup_user_membership_secure', {
      p_organization_id: defaultOrg.id,
      p_user_id: USER_ID
    });

    if (error) {
      console.log('❌ Membership setup failed:', error.message);
      return;
    }

    console.log('✅ Membership setup result:', result);
    console.log('🎉 Try logging in again!');

  } catch (error) {
    console.error('💥 Fix attempt failed:', error);
  }
}

// Run diagnosis
await diagnoseUserEntity();

// Ask if user wants to run fix
console.log('\n❓ Run automatic fix? (This will create user entity and membership)');
console.log('💡 To run fix: node diagnose-user-entity-production.mjs --fix');

if (process.argv.includes('--fix')) {
  await fixUserEntity();
}