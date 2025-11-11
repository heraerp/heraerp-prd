#!/usr/bin/env node
/**
 * Onboard existing WMS auth user to organization
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  actor_user_id: "09b0b92a-d797-489e-bc03-5ca0a6272674", // Michele Hair
  organization_id: "1fbab8d2-583c-44d2-8671-6d187c1ee755", // HERA Waste Management Demo
  auth_user_id: "04102715-4b65-449f-ac5b-5a138bc1c46b", // Existing auth user
  email: "wms@heraerp.com",
  role: "ORG_OWNER"
};

async function onboardUser() {
  console.log('🚀 Onboarding WMS User to Organization...');
  console.log('📧 Email:', testData.email);
  console.log('👤 Auth User ID:', testData.auth_user_id);
  console.log('🏢 Organization ID:', testData.organization_id);
  console.log('🎭 Role:', testData.role);
  console.log('');

  try {
    // Onboard using hera_onboard_user_v1
    console.log('🔗 Calling hera_onboard_user_v1...');
    
    const { data, error } = await supabase.rpc('hera_onboard_user_v1', {
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_supabase_user_id: testData.auth_user_id,
      p_role: testData.role,
      p_is_active: true,
      p_effective_at: new Date().toISOString()
    });

    if (error) {
      console.log('❌ Onboarding failed:', error);
      throw error;
    }

    console.log('✅ User onboarded successfully!');
    console.log('');
    console.log('📝 Result:', JSON.stringify(data, null, 2));
    console.log('');

    // Verify by checking USER entity
    console.log('🔍 Verifying user entity...');
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000')
      .eq('entity_type', 'USER')
      .ilike('metadata->>auth_user_id', testData.auth_user_id);

    if (entityError) {
      console.log('⚠️ Entity query error:', entityError.message);
    } else if (!userEntity || userEntity.length === 0) {
      console.log('⚠️ No user entity found');
    } else {
      const user = userEntity[0];
      console.log('✅ User Entity:');
      console.log('   Entity ID:', user.id);
      console.log('   Entity Name:', user.entity_name);
      console.log('   Entity Code:', user.entity_code);
      console.log('   Smart Code:', user.smart_code);
      console.log('');

      // Check MEMBER_OF relationship
      const { data: membership } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', testData.organization_id)
        .eq('from_entity_id', user.id)
        .eq('relationship_type', 'MEMBER_OF');

      if (membership && membership.length > 0) {
        console.log('✅ Membership Relationship:');
        console.log('   ID:', membership[0].id);
        console.log('   Type:', membership[0].relationship_type);
        console.log('   Is Active:', membership[0].is_active ? 'Yes' : 'No');
        console.log('');
      }

      // Check HAS_ROLE relationship
      const { data: roles } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', testData.organization_id)
        .eq('from_entity_id', user.id)
        .eq('relationship_type', 'HAS_ROLE');

      if (roles && roles.length > 0) {
        console.log('✅ Role Relationships:');
        roles.forEach((role, i) => {
          console.log(`   ${i + 1}. Type: ${role.relationship_type}`);
          console.log(`      Data:`, role.relationship_data);
        });
        console.log('');
      }
    }

    console.log('═'.repeat(60));
    console.log('🎉 ONBOARDING COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Email: wms@heraerp.com');
    console.log('   ✅ Password: demo2025!');
    console.log('   ✅ Organization: HERA Waste Management Demo');
    console.log('   ✅ Role: ORG_OWNER');
    console.log('   ✅ Status: Active');
    console.log('');
    console.log('🔑 Login with these credentials to access WMS at /wms/auth');

  } catch (error) {
    console.error('❌ Error:', error.message || error);
    if (error.details) console.error('Details:', error.details);
    if (error.hint) console.error('Hint:', error.hint);
    process.exit(1);
  }
}

onboardUser();
