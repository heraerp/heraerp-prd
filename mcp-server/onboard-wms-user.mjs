#!/usr/bin/env node
/**
 * Onboard WMS User - wms@heraerp.com
 * Using hera_onboard_user_v1 RPC function
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const testData = {
  actor_user_id: "09b0b92a-d797-489e-bc03-5ca0a6272674", // Michele Hair (Platform Admin)
  organization_id: "1fbab8d2-583c-44d2-8671-6d187c1ee755", // HERA Waste Management Demo
  email: "wms@heraerp.com",
  password: "demo2025!",
  role: "ORG_OWNER"
};

async function onboardWMSUser() {
  console.log('👤 Onboarding WMS User...');
  console.log('📧 Email:', testData.email);
  console.log('🏢 Organization ID:', testData.organization_id);
  console.log('🎭 Role:', testData.role);
  console.log('');

  try {
    // Step 1: Create Supabase auth user
    console.log('🔐 Step 1: Creating Supabase auth user...');
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testData.email,
      password: testData.password,
      email_confirm: true,
      user_metadata: {
        full_name: 'WMS Admin',
        organization_id: testData.organization_id
      }
    });

    if (authError) {
      console.log('❌ Auth user creation failed:', authError.message);
      
      // Check if user already exists
      if (authError.message.includes('already registered')) {
        console.log('💡 User already exists, fetching existing user...');
        
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
        
        if (listError) {
          throw new Error('Failed to list users: ' + listError.message);
        }
        
        const existingUser = users.find(u => u.email === testData.email);
        
        if (!existingUser) {
          throw new Error('User exists but could not be found');
        }
        
        console.log('✅ Found existing auth user:');
        console.log('   Auth User ID:', existingUser.id);
        console.log('   Email:', existingUser.email);
        console.log('   Created:', new Date(existingUser.created_at).toLocaleString());
        console.log('');
        
        // Use existing user for onboarding
        testData.auth_user_id = existingUser.id;
      } else {
        throw authError;
      }
    } else {
      console.log('✅ Supabase auth user created successfully!');
      console.log('   Auth User ID:', authData.user.id);
      console.log('   Email:', authData.user.email);
      console.log('');
      
      testData.auth_user_id = authData.user.id;
    }

    // Step 2: Onboard user using hera_onboard_user_v1
    console.log('🚀 Step 2: Onboarding user to organization...');

    const { data: onboardData, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
      p_actor_user_id: testData.actor_user_id,
      p_organization_id: testData.organization_id,
      p_supabase_user_id: testData.auth_user_id,
      p_role: testData.role,
      p_is_active: true,
      p_effective_at: new Date().toISOString()
    });

    if (onboardError) {
      console.log('❌ User onboarding FAILED:', onboardError);
      throw new Error(onboardError.message);
    }

    console.log('✅ User Onboarded Successfully!');
    console.log('');
    console.log('📝 Onboarding Details:');
    console.log('   Auth User ID:', testData.auth_user_id);
    console.log('   Email:', testData.email);
    console.log('   Organization: HERA Waste Management Demo');
    console.log('   Role:', testData.role);
    console.log('');

    // Step 3: Verify onboarding by checking user entity and relationships
    console.log('🔍 Step 3: Verifying user onboarding...');

    // Check for USER entity in PLATFORM org
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', '00000000-0000-0000-0000-000000000000') // PLATFORM org
      .eq('entity_type', 'USER')
      .eq('metadata->auth_user_id', testData.auth_user_id)
      .single();

    if (entityError) {
      console.log('⚠️ Could not verify user entity:', entityError.message);
    } else {
      console.log('✅ User Entity Found:');
      console.log('   Entity ID:', userEntity.id);
      console.log('   Entity Name:', userEntity.entity_name);
      console.log('   Entity Code:', userEntity.entity_code);
      console.log('   Smart Code:', userEntity.smart_code);
      console.log('');

      // Check for MEMBER_OF relationship
      const { data: membership, error: memberError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', testData.organization_id)
        .eq('from_entity_id', userEntity.id)
        .eq('relationship_type', 'MEMBER_OF')
        .single();

      if (memberError) {
        console.log('⚠️ Could not verify membership:', memberError.message);
      } else {
        console.log('✅ Membership Relationship Found:');
        console.log('   Relationship ID:', membership.id);
        console.log('   From (User):', membership.from_entity_id);
        console.log('   To (Org):', membership.to_entity_id);
        console.log('   Type:', membership.relationship_type);
        console.log('   Is Active:', membership.is_active ? '✅ Yes' : '❌ No');
        console.log('');
      }

      // Check for HAS_ROLE relationship
      const { data: roleRel, error: roleError } = await supabase
        .from('core_relationships')
        .select('*')
        .eq('organization_id', testData.organization_id)
        .eq('from_entity_id', userEntity.id)
        .eq('relationship_type', 'HAS_ROLE');

      if (roleError) {
        console.log('⚠️ Could not verify role:', roleError.message);
      } else if (roleRel && roleRel.length > 0) {
        console.log('✅ Role Relationship Found:');
        roleRel.forEach((role, index) => {
          console.log(`   Role ${index + 1}:`);
          console.log('      Relationship ID:', role.id);
          console.log('      Type:', role.relationship_type);
          console.log('      Data:', JSON.stringify(role.relationship_data, null, 2));
          console.log('');
        });
      }
    }

    // Summary
    console.log('═'.repeat(60));
    console.log('🎉 WMS USER ONBOARDING COMPLETE!');
    console.log('');
    console.log('📋 Summary:');
    console.log('   ✅ Auth User: wms@heraerp.com');
    console.log('   ✅ Password: demo2025!');
    console.log('   ✅ Organization: HERA Waste Management Demo');
    console.log('   ✅ Role: ORG_OWNER');
    console.log('   ✅ Status: Active');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('   Email: wms@heraerp.com');
    console.log('   Password: demo2025!');
    console.log('');
    console.log('🚀 Next Steps:');
    console.log('   1. Test login with credentials');
    console.log('   2. Access WMS app at /wms/auth');
    console.log('   3. Set up additional users (managers, dispatchers, drivers)');
    console.log('   4. Create initial entities (routes, vehicles, customers)');

    return {
      success: true,
      auth_user_id: testData.auth_user_id,
      user_entity_id: userEntity?.id
    };

  } catch (error) {
    console.error('\n❌ User onboarding failed:', error.message);
    if (error.details) {
      console.error('📋 Error details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the user onboarding
console.log('🚀 HERA WMS - User Onboarding');
console.log('═'.repeat(60));
console.log('');
onboardWMSUser()
  .then(result => {
    if (result.success) {
      console.log('\n✅ Onboarding completed successfully!');
      process.exit(0);
    } else {
      console.log('\n❌ Onboarding failed:', result.error);
      process.exit(1);
    }
  })
  .catch(error => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });
