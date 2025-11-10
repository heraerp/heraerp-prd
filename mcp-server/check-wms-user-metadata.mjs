#!/usr/bin/env node
/**
 * Check WMS user's Supabase auth metadata
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function checkWMSUserMetadata() {
  console.log('🔍 Checking WMS User Auth Metadata...\n');
  console.log('═'.repeat(80));

  const email = 'wms@heraerp.com';

  try {
    // Get the auth user
    console.log('\n📋 Step 1: Get Supabase Auth User');
    console.log('─'.repeat(80));

    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    if (listError) throw listError;

    const authUser = users.users.find(u => u.email === email);
    if (!authUser) {
      throw new Error(`Auth user ${email} not found`);
    }

    console.log('\n✅ Auth User:');
    console.log(`   Auth User ID: ${authUser.id}`);
    console.log(`   Email: ${authUser.email}`);
    console.log(`   Email Confirmed: ${authUser.email_confirmed_at ? '✅' : '❌'}`);
    console.log(`   Created: ${new Date(authUser.created_at).toLocaleString()}`);
    console.log(`   Last Sign In: ${authUser.last_sign_in_at ? new Date(authUser.last_sign_in_at).toLocaleString() : 'Never'}`);

    console.log('\n📝 User Metadata:');
    console.log(JSON.stringify(authUser.user_metadata, null, 2));

    console.log('\n📝 App Metadata:');
    console.log(JSON.stringify(authUser.app_metadata, null, 2));

    // Check if there's a cached organization_id
    console.log('\n═'.repeat(80));
    console.log('💡 DIAGNOSIS');
    console.log('═'.repeat(80));

    const userOrgId = authUser.user_metadata?.organization_id;
    const userEntityId = authUser.user_metadata?.hera_user_entity_id;

    console.log('\n📊 Metadata Analysis:');
    console.log(`   organization_id: ${userOrgId || 'Not set'}`);
    console.log(`   hera_user_entity_id: ${userEntityId || 'Not set'}`);

    if (userOrgId) {
      // Check if this org ID exists
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('*')
        .eq('id', userOrgId)
        .single();

      if (orgError) {
        console.log(`\n   ⚠️ organization_id points to non-existent org: ${userOrgId}`);
      } else {
        console.log(`\n   ✅ organization_id points to: ${org.organization_name} (${org.organization_code})`);

        // Check which apps this org has
        const { data: apps, error: appsError } = await supabase
          .from('core_relationships')
          .select(`
            id,
            to_entity_id,
            relationship_data
          `)
          .eq('organization_id', userOrgId)
          .eq('relationship_type', 'ORG_HAS_APP')
          .eq('is_active', true);

        if (!appsError && apps) {
          console.log(`\n   📱 This org has ${apps.length} app(s):`);

          for (const app of apps) {
            const { data: appEntity } = await supabase
              .from('core_entities')
              .select('entity_code, entity_name')
              .eq('id', app.to_entity_id)
              .single();

            if (appEntity) {
              console.log(`      - ${appEntity.entity_name} (${appEntity.entity_code})`);
            }
          }

          if (apps.length > 0) {
            // Check alphabetical ordering
            const appCodes = [];
            for (const app of apps) {
              const { data: appEntity } = await supabase
                .from('core_entities')
                .select('entity_code, entity_name')
                .eq('id', app.to_entity_id)
                .single();

              if (appEntity) {
                appCodes.push({ code: appEntity.entity_code, name: appEntity.entity_name });
              }
            }

            // Sort by name then code
            appCodes.sort((a, b) => {
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              if (a.code < b.code) return -1;
              if (a.code > b.code) return 1;
              return 0;
            });

            console.log(`\n   📊 Apps in alphabetical order (as login will see them):`);
            appCodes.forEach((app, i) => {
              console.log(`      ${i + 1}. ${app.name} (${app.code}) ${i === 0 ? '← FIRST APP (login will use this)' : ''}`);
            });

            if (appCodes.length > 1 && appCodes[0].code !== 'WMS') {
              console.log(`\n   ❌ PROBLEM FOUND:`);
              console.log(`      First app is ${appCodes[0].code}, not WMS!`);
              console.log(`      This is why wms@heraerp.com loads ${appCodes[0].code} instead of WMS.`);
            }
          }
        }
      }
    }

    // Check if user_entity_id matches current onboarding
    const expectedUserEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085';
    if (userEntityId && userEntityId !== expectedUserEntityId) {
      console.log(`\n   ⚠️ WARNING: hera_user_entity_id mismatch!`);
      console.log(`      In metadata: ${userEntityId}`);
      console.log(`      Expected: ${expectedUserEntityId}`);
      console.log(`      This could cause authentication issues.`);
    }

    console.log('\n═'.repeat(80));
    console.log('🔧 RECOMMENDATION');
    console.log('═'.repeat(80));

    const wmsOrgId = '1fbab8d2-583c-44d2-8671-6d187c1ee755';

    if (userOrgId !== wmsOrgId) {
      console.log('\n💡 Update user metadata to point to WMS organization:');
      console.log(`   Current organization_id: ${userOrgId || 'None'}`);
      console.log(`   Should be: ${wmsOrgId}`);
      console.log(`\n   Run this to fix:`);
      console.log(`   await supabase.auth.admin.updateUserById('${authUser.id}', {`);
      console.log(`     user_metadata: { organization_id: '${wmsOrgId}' }`);
      console.log(`   })`);
    } else {
      console.log('\n✅ User metadata points to correct WMS organization');
    }

  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error.details) {
      console.error('📋 Details:', error.details);
    }
    if (error.hint) {
      console.error('💡 Hint:', error.hint);
    }
  }
}

checkWMSUserMetadata();
