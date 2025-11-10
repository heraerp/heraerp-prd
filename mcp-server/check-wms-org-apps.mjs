#!/usr/bin/env node
/**
 * Check which apps are linked to HERA Waste Management Demo organization
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

async function checkWMSOrgApps() {
  console.log('🔍 Checking Apps Linked to WMS Organization...\n');
  console.log('═'.repeat(80));

  const wmsOrgId = '1fbab8d2-583c-44d2-8671-6d187c1ee755';
  const platformOrgId = '00000000-0000-0000-0000-000000000000';

  try {
    // Step 1: Get organization details
    console.log('\n📋 Step 1: WMS Organization Details');
    console.log('─'.repeat(80));

    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', wmsOrgId)
      .single();

    if (orgError) {
      console.error('❌ Error:', orgError.message);
    } else {
      console.log(`\n✅ Organization: ${org.organization_name}`);
      console.log(`   ID: ${org.id}`);
      console.log(`   Code: ${org.organization_code}`);
      console.log(`   Type: ${org.organization_type}`);
      console.log(`   Status: ${org.status}`);
      if (org.settings) {
        console.log('   Settings:', JSON.stringify(org.settings, null, 2));
      }
    }

    // Step 2: Get ORG_HAS_APP relationships
    console.log('\n📋 Step 2: ORG_HAS_APP Relationships');
    console.log('─'.repeat(80));

    const { data: appRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('organization_id', wmsOrgId)
      .eq('relationship_type', 'ORG_HAS_APP')
      .order('created_at', { ascending: true });

    if (relError) {
      console.error('❌ Error:', relError.message);
    } else {
      console.log(`\nFound ${appRelationships.length} ORG_HAS_APP relationship(s):\n`);

      if (appRelationships.length === 0) {
        console.log('❌ NO APPS LINKED to this organization!');
        console.log('   This is why the user cannot access WMS.');
      } else {
        for (const rel of appRelationships) {
          console.log(`Relationship ID: ${rel.id}`);
          console.log(`   Type: ${rel.relationship_type}`);
          console.log(`   From (Org): ${rel.from_entity_id}`);
          console.log(`   To (App): ${rel.to_entity_id}`);
          console.log(`   Organization: ${rel.organization_id}`);
          console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
          console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
          if (rel.relationship_data) {
            console.log('   Data:', JSON.stringify(rel.relationship_data, null, 2));
          }

          // Get the APP entity details
          const { data: app, error: appError } = await supabase
            .from('core_entities')
            .select('*')
            .eq('id', rel.to_entity_id)
            .single();

          if (appError) {
            console.log(`   ⚠️ Could not fetch app entity: ${appError.message}`);
          } else {
            console.log(`   📱 App Details:`);
            console.log(`      Entity ID: ${app.id}`);
            console.log(`      Entity Code: ${app.entity_code}`);
            console.log(`      Entity Name: ${app.entity_name}`);
            console.log(`      Entity Type: ${app.entity_type}`);
            console.log(`      Smart Code: ${app.smart_code}`);
          }
          console.log();
        }
      }
    }

    // Step 3: Check all available apps in PLATFORM org
    console.log('\n📋 Step 3: Available Apps in PLATFORM Organization');
    console.log('─'.repeat(80));

    const { data: allApps, error: appsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'APP')
      .eq('organization_id', platformOrgId)
      .order('entity_name', { ascending: true });

    if (appsError) {
      console.error('❌ Error:', appsError.message);
    } else {
      console.log(`\nFound ${allApps.length} app(s) in PLATFORM:\n`);

      allApps.forEach((app, i) => {
        console.log(`${i + 1}. ${app.entity_name} (${app.entity_code})`);
        console.log(`   Entity ID: ${app.id}`);
        console.log(`   Smart Code: ${app.smart_code}`);
        console.log();
      });
    }

    // Step 4: Verify what hera_auth_introspect_v1 returns
    console.log('\n═'.repeat(80));
    console.log('🧪 Step 4: Verify hera_auth_introspect_v1 Result');
    console.log('─'.repeat(80));

    const userEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085';

    const { data: introspectResult, error: introspectError } = await supabase
      .rpc('hera_auth_introspect_v1', {
        p_actor_user_id: userEntityId
      });

    if (introspectError) {
      console.error('\n❌ Error:', introspectError);
    } else {
      console.log('\n✅ Introspect Result:');
      console.log(`   Organization Count: ${introspectResult.organization_count}`);
      console.log(`   Default App: ${introspectResult.default_app || 'None'}`);

      if (introspectResult.organizations && introspectResult.organizations.length > 0) {
        introspectResult.organizations.forEach((org, i) => {
          console.log(`\n   Organization ${i + 1}: ${org.name}`);
          console.log(`      ID: ${org.id}`);
          console.log(`      Apps: ${org.apps?.length || 0}`);

          if (org.apps && org.apps.length > 0) {
            org.apps.forEach((app, j) => {
              console.log(`\n      App ${j + 1}:`);
              console.log(`         Code: ${app.code}`);
              console.log(`         Name: ${app.name}`);
              console.log(`         Installed: ${app.installed_at}`);
            });
          }
        });
      }
    }

    // Step 5: Diagnosis
    console.log('\n═'.repeat(80));
    console.log('💡 DIAGNOSIS');
    console.log('═'.repeat(80));

    if (appRelationships.length === 0) {
      console.log('\n❌ PROBLEM: No ORG_HAS_APP relationships found!');
      console.log('   The WMS organization has NO apps linked.');
      console.log('\n🔧 SOLUTION:');
      console.log('   1. Create ORG_HAS_APP relationship linking the WMS app');
      console.log('   2. Use the WMS organization ID as from_entity_id');
      console.log('   3. Use the WMS APP entity ID as to_entity_id');
    } else {
      console.log('\n✅ Apps are linked to the organization');

      const wmsApp = appRelationships.find(rel => {
        // Check if related to WMS app
        return true; // We'll check the app name
      });

      if (introspectResult?.organizations?.[0]?.apps) {
        const apps = introspectResult.organizations[0].apps;
        console.log(`\n📊 Apps returned by hera_auth_introspect_v1: ${apps.length}`);

        if (apps.length > 0) {
          console.log('\n   Apps are ordered by: entity_name, entity_code (alphabetically)');
          console.log('   First app in array:', apps[0].name, `(${apps[0].code})`);

          if (apps[0].code !== 'WMS') {
            console.log('\n   ⚠️ WARNING: WMS is not the first app!');
            console.log('   The login will redirect to the first app:', apps[0].code);
            console.log('\n   This is why wms@heraerp.com loads the wrong app.');
          } else {
            console.log('\n   ✅ WMS is the first app - should work correctly');
          }
        }
      }
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

checkWMSOrgApps();
