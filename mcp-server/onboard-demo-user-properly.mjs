#!/usr/bin/env node
/**
 * Properly onboard demo@heraerp.com user via hera_onboard_user_v1
 * This will create the user entity and proper MEMBER_OF relationship
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function onboardDemoUser() {
  console.log('🚀 Properly onboarding demo@heraerp.com user...\n');
  console.log('=' .repeat(80));

  try {
    // Step 1: Login as demo user
    console.log('\n🔐 Step 1: Authenticating as demo@heraerp.com...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@heraerp.com',
      password: 'demo123'
    });

    if (authError) {
      console.error('❌ Authentication failed:', authError.message);
      return;
    }

    const demoUserId = authData.user.id;
    const demoEmail = authData.user.email;
    console.log('✅ Authentication successful');
    console.log(`   User ID: ${demoUserId}`);
    console.log(`   Email: ${demoEmail}`);

    // Step 2: Find HERA ERP DEMO organization
    console.log('\n🏢 Step 2: Finding HERA ERP DEMO organization...');
    const { data: orgs } = await supabase
      .from('core_organizations')
      .select('*')
      .ilike('organization_name', '%HERA%DEMO%')
      .single();

    if (!orgs) {
      console.error('❌ HERA ERP DEMO organization not found!');
      return;
    }

    const demoOrgId = orgs.id;
    console.log(`✅ Found organization: ${orgs.organization_name}`);
    console.log(`   Org ID: ${demoOrgId}`);

    // Step 3: Delete the manually created relationship
    console.log('\n🗑️  Step 3: Deleting manually created MEMBER_OF relationship...');
    const { data: existingRels } = await supabase
      .from('core_relationships')
      .select('id')
      .eq('from_entity_id', demoUserId)
      .eq('to_entity_id', demoOrgId)
      .eq('relationship_type', 'MEMBER_OF');

    if (existingRels && existingRels.length > 0) {
      for (const rel of existingRels) {
        const { error: deleteError } = await supabase
          .from('core_relationships')
          .delete()
          .eq('id', rel.id);

        if (deleteError) {
          console.error(`❌ Error deleting relationship ${rel.id}:`, deleteError.message);
        } else {
          console.log(`✅ Deleted relationship: ${rel.id}`);
        }
      }
    } else {
      console.log('   No existing relationships to delete');
    }

    // Step 4: Run hera_onboard_user_v1 with correct signature
    console.log('\n🎯 Step 4: Running hera_onboard_user_v1 RPC...');
    console.log(`   Supabase User ID: ${demoUserId}`);
    console.log(`   Organization ID: ${demoOrgId}`);
    console.log(`   Role: ORG_OWNER`);
    console.log(`   Actor: ${demoUserId} (self-onboarding)`);

    const { data: onboardResult, error: onboardError } = await supabase.rpc('hera_onboard_user_v1', {
      p_supabase_user_id: demoUserId,
      p_organization_id: demoOrgId,
      p_role: 'ORG_OWNER',
      p_actor_user_id: demoUserId,  // Self-onboarding
      p_is_active: true,
      p_effective_at: new Date().toISOString()
    });

    if (onboardError) {
      console.error('❌ Onboarding failed:', onboardError.message);
      console.error('   Details:', onboardError.details);
      console.error('   Hint:', onboardError.hint);
      return;
    }

    console.log('✅ Onboarding successful!');
    console.log('\nOnboarding result:');
    console.log(JSON.stringify(onboardResult, null, 2));

    // Step 5: Verify the results
    console.log('\n🔍 Step 5: Verifying onboarding results...');

    // Check if user entity was created
    const { data: userEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', demoUserId)
      .single();

    if (userEntity) {
      console.log('✅ User entity created in core_entities');
      console.log(`   Entity Type: ${userEntity.entity_type}`);
      console.log(`   Entity Name: ${userEntity.entity_name}`);
    } else {
      console.log('❌ User entity NOT found in core_entities');
    }

    // Check relationships
    const { data: relationships } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', demoUserId);

    console.log(`\n✅ Relationships created: ${relationships?.length || 0}`);
    if (relationships && relationships.length > 0) {
      relationships.forEach((rel, idx) => {
        console.log(`   [${idx + 1}] ${rel.relationship_type}`);
        console.log(`       To: ${rel.to_entity_id}`);
        console.log(`       Data: ${JSON.stringify(rel.relationship_data)}`);
      });
    }

    // Step 6: Test introspection
    console.log('\n🧪 Step 6: Testing hera_auth_introspect_v1...');
    const { data: introspectData, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: demoUserId
    });

    if (introspectError) {
      console.error('❌ Introspection failed:', introspectError.message);
    } else {
      console.log('✅ Introspection successful!');
      console.log('\n📊 Summary:');
      console.log(`   Organizations: ${introspectData.organizations?.length || 0}`);

      const primaryOrg = introspectData.organizations?.[0];
      if (primaryOrg) {
        console.log(`   Org Name: ${primaryOrg.name}`);
        console.log(`   Primary Role: ${primaryOrg.primary_role}`);
        console.log(`   Apps: ${primaryOrg.apps?.length || 0}`);
        if (primaryOrg.apps) {
          primaryOrg.apps.forEach(app => {
            console.log(`      - ${app.name} (${app.code})`);
          });
        }
      }
    }

    await supabase.auth.signOut();
    console.log('\n✅ Done! User properly onboarded.\n');

  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.error(err.stack);
  }
}

onboardDemoUser();
