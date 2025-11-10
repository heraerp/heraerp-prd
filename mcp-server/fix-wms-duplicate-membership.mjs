#!/usr/bin/env node
/**
 * Fix WMS User Duplicate MEMBER_OF Relationships
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

async function fixWMSDuplicateMembership() {
  console.log('🔧 Fixing WMS User Duplicate MEMBER_OF Relationships...\n');
  console.log('═'.repeat(60));

  const userEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085';
  const wmsOrgId = '1fbab8d2-583c-44d2-8671-6d187c1ee755';

  try {
    // Get the duplicate relationships
    const { data: duplicates, error: fetchError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('organization_id', wmsOrgId)
      .order('created_at', { ascending: true });

    if (fetchError) {
      throw fetchError;
    }

    console.log(`Found ${duplicates.length} MEMBER_OF relationships\n`);

    if (duplicates.length <= 1) {
      console.log('✅ No duplicates found - nothing to fix!');
      return;
    }

    // Check the target organizations
    console.log('📋 Checking target organizations:\n');
    for (const rel of duplicates) {
      const { data: org, error: orgError } = await supabase
        .from('core_entities')
        .select('id, entity_name, entity_code, entity_type')
        .eq('id', rel.to_entity_id)
        .single();

      console.log(`Relationship ${rel.id}:`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   To Entity: ${rel.to_entity_id}`);
      if (!orgError && org) {
        console.log(`   Target: ${org.entity_name} (${org.entity_code})`);
        console.log(`   Type: ${org.entity_type}`);
      } else {
        console.log(`   ⚠️ Could not fetch target entity`);
      }
      console.log();
    }

    // Keep the newest relationship, deactivate the older one
    const newestRelationship = duplicates[duplicates.length - 1];
    const oldRelationships = duplicates.slice(0, -1);

    console.log('═'.repeat(60));
    console.log('🎯 ACTION PLAN');
    console.log('═'.repeat(60));
    console.log(`\n✅ KEEP: ${newestRelationship.id}`);
    console.log(`   Created: ${new Date(newestRelationship.created_at).toLocaleString()}`);
    console.log(`   To: ${newestRelationship.to_entity_id}\n`);

    for (const rel of oldRelationships) {
      console.log(`❌ DEACTIVATE: ${rel.id}`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   To: ${rel.to_entity_id}`);
    }

    console.log('\n═'.repeat(60));
    console.log('⚠️ This will deactivate the older duplicate relationship(s)');
    console.log('═'.repeat(60));

    // Deactivate old relationships
    for (const rel of oldRelationships) {
      console.log(`\n🔧 Deactivating relationship ${rel.id}...`);

      const { error: updateError } = await supabase
        .from('core_relationships')
        .update({
          is_active: false,
          expiration_date: new Date().toISOString(),
          updated_by: '09b0b92a-d797-489e-bc03-5ca0a6272674', // Michele Hair (Platform Admin)
          updated_at: new Date().toISOString()
        })
        .eq('id', rel.id);

      if (updateError) {
        console.error(`   ❌ Error: ${updateError.message}`);
      } else {
        console.log(`   ✅ Deactivated successfully`);
      }
    }

    // Verify the fix
    console.log('\n═'.repeat(60));
    console.log('🔍 VERIFICATION');
    console.log('═'.repeat(60));

    const { data: afterFix, error: verifyError } = await supabase
      .from('core_relationships')
      .select('id, is_active, created_at, to_entity_id')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('organization_id', wmsOrgId)
      .eq('is_active', true);

    if (verifyError) {
      throw verifyError;
    }

    console.log(`\nActive MEMBER_OF relationships: ${afterFix.length}\n`);
    afterFix.forEach((rel, i) => {
      console.log(`${i + 1}. ID: ${rel.id}`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   To: ${rel.to_entity_id}`);
      console.log(`   Active: ✅`);
      console.log();
    });

    if (afterFix.length === 1) {
      console.log('✅ SUCCESS! Only one active MEMBER_OF relationship remains.');
      console.log('\n🧪 Testing hera_auth_introspect_v1...\n');

      const { data: introspectResult, error: introspectError } = await supabase
        .rpc('hera_auth_introspect_v1', {
          p_actor_user_id: userEntityId
        });

      if (introspectError) {
        console.error('❌ hera_auth_introspect_v1 still has error:', introspectError);
      } else {
        console.log('✅ hera_auth_introspect_v1 works now!');
        console.log('\n📊 Result:');
        console.log(JSON.stringify(introspectResult, null, 2));
      }
    } else {
      console.log(`⚠️ WARNING: ${afterFix.length} active relationships remain (expected 1)`);
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

fixWMSDuplicateMembership();
