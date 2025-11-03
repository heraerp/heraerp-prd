#!/usr/bin/env node
/**
 * Verify if user entity exists for demo@heraerp.com
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function verifyUserEntity() {
  console.log('🔍 Verifying user entity for demo@heraerp.com\n');
  console.log('='.repeat(80));

  const demoUserId = 'a55cc033-e909-4c59-b974-8ff3e098f2bf';
  const userEntityId = '4d93b3f8-dfe8-430c-83ea-3128f6a520cf'; // From onboarding result

  console.log('\n📋 Step 1: Check for user entity by entity ID...');
  const { data: entityById, error: entityError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', userEntityId)
    .maybeSingle();

  if (entityError) {
    console.error('❌ Query error:', entityError.message);
  } else if (entityById) {
    console.log('✅ User entity found by ID:');
    console.log(JSON.stringify(entityById, null, 2));
  } else {
    console.log('❌ No entity found with ID:', userEntityId);
  }

  console.log('\n📋 Step 2: Check for user entity by Supabase ID in metadata...');
  const { data: entitiesByMetadata, error: metadataError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'USER')
    .contains('metadata', { supabase_user_id: demoUserId });

  if (metadataError) {
    console.error('❌ Query error:', metadataError.message);
  } else if (entitiesByMetadata && entitiesByMetadata.length > 0) {
    console.log(`✅ Found ${entitiesByMetadata.length} USER entities with matching metadata:`);
    entitiesByMetadata.forEach((entity, idx) => {
      console.log(`\n   [${idx + 1}] Entity ID: ${entity.id}`);
      console.log(`       Entity Type: ${entity.entity_type}`);
      console.log(`       Entity Name: ${entity.entity_name}`);
      console.log(`       Metadata: ${JSON.stringify(entity.metadata)}`);
      console.log(`       Org ID: ${entity.organization_id}`);
    });
  } else {
    console.log('❌ No USER entities found with metadata.supabase_user_id:', demoUserId);
  }

  console.log('\n📋 Step 3: Check relationships FROM user_entity_id...');
  const { data: entityRels } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', userEntityId);

  console.log(`✅ Relationships from user_entity_id (${userEntityId}): ${entityRels?.length || 0}`);
  if (entityRels && entityRels.length > 0) {
    entityRels.forEach((rel, idx) => {
      console.log(`   [${idx + 1}] ${rel.relationship_type} → ${rel.to_entity_id}`);
      console.log(`       Org ID: ${rel.organization_id}`);
      console.log(`       Smart Code: ${rel.smart_code}`);
    });
  }

  console.log('\n📋 Step 4: Check relationships FROM Supabase user ID...');
  const { data: supabaseRels } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', demoUserId);

  console.log(`✅ Relationships from Supabase user ID (${demoUserId}): ${supabaseRels?.length || 0}`);
  if (supabaseRels && supabaseRels.length > 0) {
    supabaseRels.forEach((rel, idx) => {
      console.log(`   [${idx + 1}] ${rel.relationship_type} → ${rel.to_entity_id}`);
      console.log(`       Org ID: ${rel.organization_id}`);
      console.log(`       Smart Code: ${rel.smart_code}`);
    });
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 ANALYSIS');
  console.log('='.repeat(80));

  console.log('\n✅ ARCHITECTURE VERIFICATION:');
  console.log(`   User entity exists: ${!!entityById}`);
  console.log(`   User entity ID: ${entityById?.id || 'N/A'}`);
  console.log(`   Supabase user ID: ${demoUserId}`);
  console.log(`   IDs match: ${entityById?.id === demoUserId}`);
  console.log(`   Relationships from entity ID: ${entityRels?.length || 0}`);
  console.log(`   Relationships from Supabase ID: ${supabaseRels?.length || 0}`);

  if (entityById && entityById.id !== demoUserId) {
    console.log('\n🔑 KEY FINDING:');
    console.log('   ⚠️  User entity ID is DIFFERENT from Supabase user ID');
    console.log('   ⚠️  This is the CORRECT HERA architecture pattern');
    console.log('   ⚠️  Metadata mapping exists: supabase_user_id → entity_id');

    if (entityRels && entityRels.length > 0 && supabaseRels && supabaseRels.length > 0) {
      console.log('\n🚨 DUPLICATE RELATIONSHIPS DETECTED:');
      console.log('   ⚠️  Relationships exist from BOTH entity ID and Supabase ID');
      console.log('   ⚠️  This indicates a workaround was applied');
      console.log('   ⚠️  hera_auth_introspect_v1 is using Supabase ID relationships');
    } else if (entityRels && entityRels.length > 0) {
      console.log('\n🐛 BUG CONFIRMED:');
      console.log('   ❌ Relationships exist from entity ID (correct)');
      console.log('   ❌ NO relationships from Supabase ID');
      console.log('   ❌ hera_auth_introspect_v1 cannot find them!');
      console.log('   ❌ RPC needs to resolve entity_id from Supabase ID first');
    }
  }

  console.log('\n');
}

verifyUserEntity();
