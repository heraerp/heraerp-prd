#!/usr/bin/env node
/**
 * Compare hera_auth_introspect_v1 results between demo@heraerp.com and hairtalkz01@gmail.com
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function compareUsers() {
  console.log('🔍 Comparing hera_auth_introspect_v1 for both users\n');
  console.log('=' .repeat(80));

  // Test User 1: demo@heraerp.com
  const demoUserId = 'a55cc033-e909-4c59-b974-8ff3e098f2bf';
  console.log('\n👤 USER 1: demo@heraerp.com');
  console.log(`   Supabase ID: ${demoUserId}`);

  const { data: demoIntrospect, error: demoError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: demoUserId
  });

  if (demoError) {
    console.error('❌ Error:', demoError.message);
  } else {
    console.log('✅ Introspection result:');
    console.log(JSON.stringify(demoIntrospect, null, 2));
  }

  // Check demo user's entity and relationships
  console.log('\n🔍 Checking demo user entity and relationships...');

  const { data: demoEntity } = await supabase
    .from('core_entities')
    .select('*')
    .or(`metadata->supabase_user_id.eq.${demoUserId},id.eq.${demoUserId}`)
    .limit(1)
    .single();

  if (demoEntity) {
    console.log(`   ✅ User Entity ID: ${demoEntity.id}`);
    console.log(`   Entity Type: ${demoEntity.entity_type}`);
    console.log(`   Metadata: ${JSON.stringify(demoEntity.metadata)}`);

    // Check relationships from this entity
    const { data: demoRels } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', demoEntity.id)
      .eq('relationship_type', 'MEMBER_OF');

    console.log(`   MEMBER_OF relationships: ${demoRels?.length || 0}`);
    if (demoRels && demoRels.length > 0) {
      demoRels.forEach(rel => {
        console.log(`      → To: ${rel.to_entity_id}`);
      });
    }
  } else {
    console.log('   ❌ No user entity found');
  }

  console.log('\n' + '=' .repeat(80));

  // Test User 2: hairtalkz01@gmail.com
  const hairtalkzUserId = '4e1340cf-fefc-4d21-92ee-a8c4a244364b';
  console.log('\n👤 USER 2: hairtalkz01@gmail.com');
  console.log(`   Supabase ID: ${hairtalkzUserId}`);

  const { data: hairtalkzIntrospect, error: hairtalkzError } = await supabase.rpc('hera_auth_introspect_v1', {
    p_actor_user_id: hairtalkzUserId
  });

  if (hairtalkzError) {
    console.error('❌ Error:', hairtalkzError.message);
  } else {
    console.log('✅ Introspection result:');
    console.log(JSON.stringify(hairtalkzIntrospect, null, 2));
  }

  // Check hairtalkz user's entity and relationships
  console.log('\n🔍 Checking hairtalkz user entity and relationships...');

  const { data: hairtalkzEntity } = await supabase
    .from('core_entities')
    .select('*')
    .or(`metadata->supabase_user_id.eq.${hairtalkzUserId},id.eq.${hairtalkzUserId}`)
    .limit(1)
    .single();

  if (hairtalkzEntity) {
    console.log(`   ✅ User Entity ID: ${hairtalkzEntity.id}`);
    console.log(`   Entity Type: ${hairtalkzEntity.entity_type}`);
    console.log(`   Metadata: ${JSON.stringify(hairtalkzEntity.metadata)}`);

    // Check relationships from this entity
    const { data: hairtalkzRels } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', hairtalkzEntity.id)
      .eq('relationship_type', 'MEMBER_OF');

    console.log(`   MEMBER_OF relationships: ${hairtalkzRels?.length || 0}`);
    if (hairtalkzRels && hairtalkzRels.length > 0) {
      hairtalkzRels.forEach(rel => {
        console.log(`      → To: ${rel.to_entity_id}`);
      });
    }
  } else {
    console.log('   ❌ No user entity found');
  }

  console.log('\n' + '=' .repeat(80));
  console.log('📊 COMPARISON SUMMARY');
  console.log('=' .repeat(80));

  console.log('\nUser 1 (demo@heraerp.com):');
  console.log(`   Organizations found: ${demoIntrospect?.organizations?.length || 0}`);
  console.log(`   Has entity: ${!!demoEntity}`);
  console.log(`   Entity matches Supabase ID: ${demoEntity?.id === demoUserId}`);

  console.log('\nUser 2 (hairtalkz01@gmail.com):');
  console.log(`   Organizations found: ${hairtalkzIntrospect?.organizations?.length || 0}`);
  console.log(`   Has entity: ${!!hairtalkzEntity}`);
  console.log(`   Entity matches Supabase ID: ${hairtalkzEntity?.id === hairtalkzUserId}`);

  console.log('\n🔑 KEY DIFFERENCE:');
  if (demoEntity && hairtalkzEntity) {
    if (demoEntity.id === demoUserId && hairtalkzEntity.id !== hairtalkzUserId) {
      console.log('   ⚠️  Demo user entity ID MATCHES Supabase ID (direct match)');
      console.log('   ✅ Hairtalkz user entity ID is DIFFERENT (has mapping in metadata)');
    } else if (demoEntity.id !== demoUserId && hairtalkzEntity.id === hairtalkzUserId) {
      console.log('   ✅ Demo user entity ID is DIFFERENT (has mapping in metadata)');
      console.log('   ⚠️  Hairtalkz user entity ID MATCHES Supabase ID (direct match)');
    } else {
      console.log('   Both users have different entity IDs from Supabase IDs');
    }
  }

  console.log('\n');
}

compareUsers();
