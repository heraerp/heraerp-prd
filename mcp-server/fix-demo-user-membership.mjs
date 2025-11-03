#!/usr/bin/env node
/**
 * Fix demo@heraerp.com user membership
 * Link user to HERA ERP DEMO organization with SALON and CASHEW apps
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixDemoUserMembership() {
  console.log('🔧 Fixing demo@heraerp.com user membership\n');
  console.log('=' .repeat(80));

  try {
    // Step 1: Get demo user ID
    console.log('\n👤 Step 1: Finding demo@heraerp.com user...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'demo@heraerp.com',
      password: 'demo123'
    });

    if (authError) {
      console.error('❌ Auth failed:', authError.message);
      return;
    }

    const demoUserId = authData.user.id;
    console.log(`✅ Demo user ID: ${demoUserId}`);

    // Step 2: Find or create HERA ERP DEMO organization
    console.log('\n🏢 Step 2: Finding HERA ERP DEMO organization...');
    let { data: orgs, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .ilike('organization_name', '%HERA%DEMO%');

    if (orgError) {
      console.error('❌ Error finding org:', orgError.message);
      return;
    }

    console.log(`Found ${orgs?.length || 0} matching organizations`);

    let demoOrg;
    if (orgs && orgs.length > 0) {
      demoOrg = orgs[0];
      console.log(`✅ Using existing org: ${demoOrg.organization_name} (${demoOrg.id})`);
    } else {
      console.log('📝 Creating HERA ERP DEMO organization...');
      const { data: newOrg, error: createOrgError } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: 'HERA ERP DEMO',
          organization_type: 'demo',
          industry: 'multi',
          is_active: true
        })
        .select()
        .single();

      if (createOrgError) {
        console.error('❌ Error creating org:', createOrgError.message);
        return;
      }

      demoOrg = newOrg;
      console.log(`✅ Created org: ${demoOrg.id}`);
    }

    // Step 3: Check existing membership via core_relationships
    console.log('\n🔗 Step 3: Checking existing MEMBER_OF relationship...');
    const { data: existingMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', demoUserId)
      .eq('to_entity_id', demoOrg.id)
      .eq('relationship_type', 'MEMBER_OF');

    if (existingMembership && existingMembership.length > 0) {
      console.log('✅ MEMBER_OF relationship already exists');
      console.log(JSON.stringify(existingMembership[0], null, 2));
    } else {
      console.log('📝 Creating MEMBER_OF relationship...');
      const { data: newMembership, error: membershipError } = await supabase
        .from('core_relationships')
        .insert({
          from_entity_id: demoUserId,
          to_entity_id: demoOrg.id,
          relationship_type: 'MEMBER_OF',
          organization_id: demoOrg.id,
          is_active: true,
          effective_date: new Date().toISOString(),
          relationship_data: {
            role: 'ORG_OWNER',
            permissions: ['*']
          },
          smart_code: 'HERA.SALON.REL.TYPE.MEMBER.OF.v1'
        })
        .select();

      if (membershipError) {
        console.error('❌ Error creating membership:', membershipError.message);
        console.error('   Details:', membershipError.details);
        console.error('   Hint:', membershipError.hint);
        return;
      }

      console.log('✅ MEMBER_OF relationship created successfully');
      console.log(JSON.stringify(newMembership[0], null, 2));
    }

    // Step 4: Verify apps are linked to org
    console.log('\n📱 Step 4: Checking apps linked to organization...');
    const { data: orgApps, error: appsError } = await supabase
      .from('core_relationships')
      .select(`
        *,
        app:core_entities!core_relationships_to_entity_id_fkey(*)
      `)
      .eq('from_entity_id', demoOrg.id)
      .eq('relationship_type', 'ORG_HAS_APP');

    if (appsError) {
      console.error('❌ Error checking apps:', appsError.message);
    } else {
      console.log(`Found ${orgApps?.length || 0} apps linked to org`);
      if (orgApps && orgApps.length > 0) {
        orgApps.forEach(rel => {
          console.log(`   - ${rel.app?.entity_name || 'Unknown'}`);
        });
      } else {
        console.log('⚠️ No apps found! Need to link SALON and CASHEW apps');
      }
    }

    // Step 5: Re-test introspection
    console.log('\n🧪 Step 5: Testing hera_auth_introspect_v1 again...');
    const { data: introspectData, error: introspectError } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: demoUserId
    });

    if (introspectError) {
      console.error('❌ Introspection failed:', introspectError.message);
    } else {
      console.log('✅ Introspection results:');
      console.log(JSON.stringify(introspectData, null, 2));

      const primaryOrg = introspectData.organizations?.[0];
      console.log('\n📊 Summary:');
      console.log(`   Organizations: ${introspectData.organizations?.length || 0}`);
      console.log(`   Org Name: ${primaryOrg?.name || 'N/A'}`);
      console.log(`   Apps: ${primaryOrg?.apps?.length || 0}`);
      if (primaryOrg?.apps) {
        primaryOrg.apps.forEach(app => {
          console.log(`      - ${app.name} (${app.code})`);
        });
      }
    }

    await supabase.auth.signOut();
    console.log('\n✅ Done!\n');

  } catch (err) {
    console.error('❌ Exception:', err.message);
    console.error(err.stack);
  }
}

fixDemoUserMembership();
