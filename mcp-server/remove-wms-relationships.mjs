#!/usr/bin/env node
/**
 * Remove all MEMBER_OF and HAS_ROLE relationships for wms@heraerp.com
 * This will allow fresh relationship creation
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

async function removeWMSRelationships() {
  console.log('🗑️  Removing WMS User Relationships...\n');
  console.log('═'.repeat(80));

  const email = 'wms@heraerp.com';
  const userEntityId = '5febe281-3c9a-4774-9b18-ffded0be2085';

  try {
    // Step 1: Get all MEMBER_OF relationships
    console.log('\n📋 Step 1: Finding MEMBER_OF relationships...');
    console.log('─'.repeat(80));

    const { data: memberOfRels, error: memberError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'MEMBER_OF');

    if (memberError) throw memberError;

    console.log(`\nFound ${memberOfRels.length} MEMBER_OF relationship(s):\n`);
    memberOfRels.forEach((rel, i) => {
      console.log(`${i + 1}. Relationship ID: ${rel.id}`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
      console.log(`   To Entity: ${rel.to_entity_id}`);
      console.log(`   Organization: ${rel.organization_id}`);
      console.log();
    });

    // Step 2: Get all HAS_ROLE relationships
    console.log('📋 Step 2: Finding HAS_ROLE relationships...');
    console.log('─'.repeat(80));

    const { data: hasRoleRels, error: roleError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', userEntityId)
      .eq('relationship_type', 'HAS_ROLE');

    if (roleError) throw roleError;

    console.log(`\nFound ${hasRoleRels.length} HAS_ROLE relationship(s):\n`);
    hasRoleRels.forEach((rel, i) => {
      console.log(`${i + 1}. Relationship ID: ${rel.id}`);
      console.log(`   Created: ${new Date(rel.created_at).toLocaleString()}`);
      console.log(`   Is Active: ${rel.is_active ? '✅' : '❌'}`);
      console.log(`   To Entity (Role): ${rel.to_entity_id}`);
      console.log(`   Organization: ${rel.organization_id}`);
      if (rel.relationship_data) {
        console.log(`   Role Data:`, JSON.stringify(rel.relationship_data, null, 2));
      }
      console.log();
    });

    const totalRelationships = memberOfRels.length + hasRoleRels.length;

    if (totalRelationships === 0) {
      console.log('✅ No relationships found - nothing to remove!');
      return;
    }

    // Step 3: Confirm deletion
    console.log('═'.repeat(80));
    console.log('⚠️  DELETION SUMMARY');
    console.log('═'.repeat(80));
    console.log(`\nUser: wms@heraerp.com`);
    console.log(`User Entity ID: ${userEntityId}`);
    console.log(`\nRelationships to DELETE:`);
    console.log(`   - MEMBER_OF: ${memberOfRels.length}`);
    console.log(`   - HAS_ROLE: ${hasRoleRels.length}`);
    console.log(`   - TOTAL: ${totalRelationships}`);
    console.log('\n⚠️  This will PERMANENTLY DELETE these relationships!');
    console.log('You will need to recreate them fresh.\n');

    // Step 4: Delete MEMBER_OF relationships
    if (memberOfRels.length > 0) {
      console.log('═'.repeat(80));
      console.log('🗑️  Step 3: Deleting MEMBER_OF relationships...');
      console.log('─'.repeat(80));

      for (const rel of memberOfRels) {
        console.log(`\nDeleting MEMBER_OF relationship: ${rel.id}`);

        const { error: deleteError } = await supabase
          .from('core_relationships')
          .delete()
          .eq('id', rel.id);

        if (deleteError) {
          console.error(`   ❌ Error: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Deleted successfully`);
        }
      }
    }

    // Step 5: Delete HAS_ROLE relationships
    if (hasRoleRels.length > 0) {
      console.log('\n═'.repeat(80));
      console.log('🗑️  Step 4: Deleting HAS_ROLE relationships...');
      console.log('─'.repeat(80));

      for (const rel of hasRoleRels) {
        console.log(`\nDeleting HAS_ROLE relationship: ${rel.id}`);

        const { error: deleteError } = await supabase
          .from('core_relationships')
          .delete()
          .eq('id', rel.id);

        if (deleteError) {
          console.error(`   ❌ Error: ${deleteError.message}`);
        } else {
          console.log(`   ✅ Deleted successfully`);
        }
      }
    }

    // Step 6: Verify deletion
    console.log('\n═'.repeat(80));
    console.log('🔍 Step 5: Verification...');
    console.log('─'.repeat(80));

    const { data: remainingRels, error: verifyError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type')
      .eq('from_entity_id', userEntityId)
      .in('relationship_type', ['MEMBER_OF', 'HAS_ROLE']);

    if (verifyError) throw verifyError;

    console.log(`\nRemaining relationships: ${remainingRels.length}`);

    if (remainingRels.length === 0) {
      console.log('\n✅ SUCCESS! All MEMBER_OF and HAS_ROLE relationships removed.');
      console.log('\n🔄 Next Steps:');
      console.log('   1. The WMS user auth is now clean');
      console.log('   2. You can create fresh MEMBER_OF and HAS_ROLE relationships');
      console.log('   3. Make sure to use correct organization entity IDs');
      console.log('   4. Ensure to_entity_id matches organization_id for MEMBER_OF');
    } else {
      console.log('\n⚠️  WARNING: Some relationships still remain:');
      remainingRels.forEach(rel => {
        console.log(`   - ${rel.relationship_type}: ${rel.id}`);
      });
    }

    // Step 7: Test hera_auth_introspect_v1
    console.log('\n═'.repeat(80));
    console.log('🧪 Step 6: Testing hera_auth_introspect_v1...');
    console.log('─'.repeat(80));

    const { data: introspectResult, error: introspectError } = await supabase
      .rpc('hera_auth_introspect_v1', {
        p_actor_user_id: userEntityId
      });

    if (introspectError) {
      console.log('\n⚠️  hera_auth_introspect_v1 result (expected to have no orgs):');
      console.error('Error:', introspectError.message);
    } else {
      console.log('\n✅ hera_auth_introspect_v1 result:');
      console.log(JSON.stringify(introspectResult, null, 2));

      if (introspectResult.organization_count === 0) {
        console.log('\n✅ PERFECT! User has no organizations (as expected after cleanup)');
      } else {
        console.log(`\n⚠️  User still has ${introspectResult.organization_count} organization(s)`);
      }
    }

    console.log('\n═'.repeat(80));
    console.log('🎉 CLEANUP COMPLETE!');
    console.log('═'.repeat(80));
    console.log(`\nUser Entity ID: ${userEntityId}`);
    console.log('Email: wms@heraerp.com');
    console.log('Status: Ready for fresh relationship creation');
    console.log('\n📝 To create fresh relationships, use:');
    console.log('   - hera_onboard_user_v1 RPC function');
    console.log('   - Or manually insert MEMBER_OF and HAS_ROLE relationships');
    console.log('   - Remember: to_entity_id = organization_id for MEMBER_OF');

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

removeWMSRelationships();
