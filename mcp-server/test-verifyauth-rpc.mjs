#!/usr/bin/env node
/**
 * Test the hera_entities_crud_v1 RPC call that verifyAuth is using
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const TEST_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // hairtalkz2022@gmail.com
const PLATFORM_ORG = '00000000-0000-0000-0000-000000000000';

console.log('🔍 Testing hera_entities_crud_v1 RPC call (same as verifyAuth)...\n');

async function testRPC() {
  console.log('Parameters:');
  console.log('  p_action: READ');
  console.log('  p_actor_user_id:', TEST_USER_ID);
  console.log('  p_organization_id:', PLATFORM_ORG);
  console.log('  p_entity: { entity_id:', TEST_USER_ID, ', entity_type: USER }');
  console.log('  p_options: { include_relationships: true, relationship_types: [MEMBER_OF] }');
  console.log();

  try {
    const { data: userResult, error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: PLATFORM_ORG,
      p_entity: {
        entity_id: TEST_USER_ID,
        entity_type: 'USER'
      },
      p_dynamic: {},
      p_relationships: {},
      p_options: {
        include_relationships: true,
        relationship_types: ['MEMBER_OF']
      }
    });

    if (error) {
      console.log('❌ RPC Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
      return;
    }

    console.log('✅ RPC Success');
    console.log('\nResponse structure:');
    console.log('  success:', userResult?.success);
    console.log('  action:', userResult?.action);
    console.log('  has data:', !!userResult?.data);
    console.log('  data keys:', userResult?.data ? Object.keys(userResult.data) : null);

    if (userResult?.data) {
      console.log('\nData contents:');
      console.log('  entity:', userResult.data.entity ? 'present' : 'null');
      console.log('  relationships:', Array.isArray(userResult.data.relationships) ? `array[${userResult.data.relationships.length}]` : 'null');
      console.log('  dynamic_data:', Array.isArray(userResult.data.dynamic_data) ? `array[${userResult.data.dynamic_data.length}]` : 'null');

      if (userResult.data.relationships && userResult.data.relationships.length > 0) {
        console.log('\nRelationships found:');
        userResult.data.relationships.forEach((rel, i) => {
          console.log(`  [${i + 1}] Type: ${rel.relationship_type}`);
          console.log(`      To Entity: ${rel.to_entity_id}`);
          console.log(`      Organization: ${rel.organization_id}`);
          console.log(`      Role: ${rel.relationship_data?.role || 'none'}`);
          console.log(`      Active: ${rel.is_active}`);
        });
      } else {
        console.log('\n⚠️  NO RELATIONSHIPS FOUND');
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('TESTING FALLBACK: Direct query');
    console.log('='.repeat(70));

    // Test direct query as fallback
    const { data: directRels, error: directError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id, relationship_data, is_active')
      .eq('from_entity_id', TEST_USER_ID)
      .eq('relationship_type', 'MEMBER_OF')
      .eq('is_active', true);

    if (directError) {
      console.log('❌ Direct query error:', directError.message);
    } else {
      console.log(`✅ Direct query found ${directRels?.length || 0} relationships`);
      if (directRels && directRels.length > 0) {
        directRels.forEach((rel, i) => {
          console.log(`  [${i + 1}] Org: ${rel.organization_id}`);
          console.log(`      Role: ${rel.relationship_data?.role || 'none'}`);
        });
      }
    }

  } catch (err) {
    console.log('❌ Exception:', err.message);
  }
}

testRPC().catch(console.error);
