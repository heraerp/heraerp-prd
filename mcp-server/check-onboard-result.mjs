#!/usr/bin/env node
/**
 * Check what hera_onboard_user_v1 actually created
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

async function checkOnboardResult() {
  console.log('🔍 Checking hera_onboard_user_v1 Result...\n');
  console.log('═'.repeat(80));

  const userEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085';
  const wmsOrgId = '1fbab8d2-583c-44d2-8671-6d187c1ee755';

  try {
    // Check the USER entity
    console.log('\n📋 Step 1: Check USER entity');
    console.log('─'.repeat(80));

    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', userEntityId)
      .single();

    if (entityError) {
      console.error('❌ Error:', entityError.message);
    } else {
      console.log('✅ USER Entity:');
      console.log(`   Entity ID: ${userEntity.id}`);
      console.log(`   Entity Name: ${userEntity.entity_name}`);
      console.log(`   Entity Code: ${userEntity.entity_code}`);
      console.log(`   Entity Type: ${userEntity.entity_type}`);
      console.log(`   Smart Code: ${userEntity.smart_code}`);
      console.log(`   Organization ID: ${userEntity.organization_id}`);
      console.log(`   Created By: ${userEntity.created_by}`);
      console.log(`   Updated By: ${userEntity.updated_by}`);
      if (userEntity.metadata) {
        console.log('   Metadata:', JSON.stringify(userEntity.metadata, null, 2));
      }
    }

    // Check MEMBER_OF relationships
    console.log('\n📋 Step 2: Check ALL relationships from this user');
    console.log('─'.repeat(80));

    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .order('created_at', { ascending: false });

    if (relError) {
      console.error('❌ Error:', relError.message);
    } else {
      console.log(`\nFound ${relationships.length} relationship(s):\n`);

      relationships.forEach((rel, i) => {
        console.log(`${i + 1}. Relationship ID: ${rel.id}`);
        console.log(`   Type: ${rel.relationship_type}`);
        console.log(`   From (User): ${rel.from_entity_id}`);
        console.log(`   To: ${rel.to_entity_id}`);
        console.log(`   Organization: ${rel.organization_id}`);
        console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
        console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
        console.log(`   Effective Date: ${rel.effective_date || 'N/A'}`);
        console.log(`   Expiration Date: ${rel.expiration_date || 'N/A'}`);
        if (rel.relationship_data) {
          console.log(`   Data:`, JSON.stringify(rel.relationship_data, null, 2));
        }
        console.log();
      });

      // Count by type
      const memberOfCount = relationships.filter(r => r.relationship_type === 'MEMBER_OF').length;
      const hasRoleCount = relationships.filter(r => r.relationship_type === 'HAS_ROLE').length;

      console.log('─'.repeat(80));
      console.log('📊 Summary:');
      console.log(`   MEMBER_OF: ${memberOfCount}`);
      console.log(`   HAS_ROLE: ${hasRoleCount}`);
      console.log(`   Total: ${relationships.length}`);
    }

    // Check what the onboard result said
    console.log('\n📋 Step 3: Verify the entities from onboard result');
    console.log('─'.repeat(80));

    const orgEntityId = '7d8d65cc-ac27-4515-b9a7-bee1f2886581'; // From onboard result

    console.log(`\n🔍 Checking org_entity_id: ${orgEntityId}`);
    const { data: orgEntity, error: orgEntityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', orgEntityId)
      .single();

    if (orgEntityError) {
      console.error('   ❌ Error:', orgEntityError.message);
    } else {
      console.log('   ✅ Found in core_entities:');
      console.log(`      Entity ID: ${orgEntity.id}`);
      console.log(`      Entity Type: ${orgEntity.entity_type}`);
      console.log(`      Entity Name: ${orgEntity.entity_name}`);
      console.log(`      Entity Code: ${orgEntity.entity_code}`);
      console.log(`      Smart Code: ${orgEntity.smart_code}`);
      console.log(`      Organization ID: ${orgEntity.organization_id}`);
    }

    // Test hera_auth_introspect_v1
    console.log('\n═'.repeat(80));
    console.log('🧪 Step 4: Test hera_auth_introspect_v1');
    console.log('─'.repeat(80));

    const { data: introspectResult, error: introspectError } = await supabase
      .rpc('hera_auth_introspect_v1', {
        p_actor_user_id: userEntityId
      });

    if (introspectError) {
      console.error('\n❌ Error:', introspectError);
    } else {
      console.log('\n✅ Result:');
      console.log(JSON.stringify(introspectResult, null, 2));

      console.log('\n─'.repeat(80));
      console.log('📊 Analysis:');
      console.log(`   User ID: ${introspectResult.user_id}`);
      console.log(`   Organization Count: ${introspectResult.organization_count}`);
      console.log(`   Default Org: ${introspectResult.default_organization_id || 'None'}`);
      console.log(`   Default App: ${introspectResult.default_app || 'None'}`);
      console.log(`   Platform Admin: ${introspectResult.is_platform_admin ? 'Yes' : 'No'}`);

      if (introspectResult.organization_count === 0) {
        console.log('\n❌ ISSUE: No organizations found!');
        console.log('   This means MEMBER_OF relationships are not being detected.');
      } else {
        console.log('\n✅ Organizations found:');
        introspectResult.organizations.forEach((org, i) => {
          console.log(`\n   ${i + 1}. ${org.name} (${org.code})`);
          console.log(`      Primary Role: ${org.primary_role}`);
          console.log(`      Apps: ${org.apps?.length || 0}`);
        });
      }
    }

    console.log('\n═'.repeat(80));
    console.log('💡 DIAGNOSIS');
    console.log('═'.repeat(80));

    console.log('\n🔍 Checking for MEMBER_OF relationships...');
    const memberOfRels = relationships.filter(r => r.relationship_type === 'MEMBER_OF');

    if (memberOfRels.length === 0) {
      console.log('❌ NO MEMBER_OF relationships found!');
      console.log('   hera_onboard_user_v1 did NOT create MEMBER_OF relationship.');
      console.log('   This is why hera_auth_introspect_v1 returns no organizations.');
    } else {
      console.log(`✅ Found ${memberOfRels.length} MEMBER_OF relationship(s)`);
      memberOfRels.forEach(rel => {
        console.log(`\n   Relationship: ${rel.id}`);
        console.log(`   To: ${rel.to_entity_id}`);
        console.log(`   Org: ${rel.organization_id}`);
        console.log(`   Active: ${rel.is_active ? '✅' : '❌'}`);

        if (rel.to_entity_id === rel.organization_id) {
          console.log('   ✅ IDs match correctly');
        } else {
          console.log('   ❌ IDs do NOT match - this could be the issue!');
        }
      });
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

checkOnboardResult();
