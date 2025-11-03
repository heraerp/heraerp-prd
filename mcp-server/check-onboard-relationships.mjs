#!/usr/bin/env node
/**
 * Check what relationships hera_onboard_user_v1 created and under which from_entity_id
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkOnboardRelationships() {
  console.log('🔍 Checking relationships created by hera_onboard_user_v1\n');
  console.log('='.repeat(80));

  const demoSupabaseUserId = 'a55cc033-e909-4c59-b974-8ff3e098f2bf';
  const demoUserEntityId = '4d93b3f8-dfe8-430c-83ea-3128f6a520cf'; // From onboarding result
  const demoOrgId = '9a9cc652-5c64-4917-a990-3d0fb6398543';

  console.log('\n📋 User IDs:');
  console.log(`   Supabase User ID: ${demoSupabaseUserId}`);
  console.log(`   User Entity ID: ${demoUserEntityId}`);
  console.log(`   Organization ID: ${demoOrgId}`);

  // Query 1: Relationships FROM user_entity_id
  console.log('\n📋 Query 1: Relationships FROM user_entity_id...');
  const { data: entityRels, error: entityError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', demoUserEntityId)
    .order('created_at', { ascending: true });

  if (entityError) {
    console.error('❌ Error:', entityError.message);
  } else {
    console.log(`✅ Found ${entityRels?.length || 0} relationships FROM user_entity_id:`);
    if (entityRels && entityRels.length > 0) {
      entityRels.forEach((rel, idx) => {
        console.log(`\n   [${idx + 1}] Relationship ID: ${rel.id}`);
        console.log(`       Type: ${rel.relationship_type}`);
        console.log(`       From: ${rel.from_entity_id}`);
        console.log(`       To: ${rel.to_entity_id}`);
        console.log(`       Org: ${rel.organization_id}`);
        console.log(`       Smart Code: ${rel.smart_code}`);
        console.log(`       Created At: ${rel.created_at}`);
        console.log(`       Created By: ${rel.created_by}`);
        console.log(`       Data: ${JSON.stringify(rel.relationship_data)}`);
      });
    }
  }

  // Query 2: Relationships FROM Supabase user ID
  console.log('\n📋 Query 2: Relationships FROM Supabase user ID...');
  const { data: supabaseRels, error: supabaseError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', demoSupabaseUserId)
    .order('created_at', { ascending: true });

  if (supabaseError) {
    console.error('❌ Error:', supabaseError.message);
  } else {
    console.log(`✅ Found ${supabaseRels?.length || 0} relationships FROM Supabase user ID:`);
    if (supabaseRels && supabaseRels.length > 0) {
      supabaseRels.forEach((rel, idx) => {
        console.log(`\n   [${idx + 1}] Relationship ID: ${rel.id}`);
        console.log(`       Type: ${rel.relationship_type}`);
        console.log(`       From: ${rel.from_entity_id}`);
        console.log(`       To: ${rel.to_entity_id}`);
        console.log(`       Org: ${rel.organization_id}`);
        console.log(`       Smart Code: ${rel.smart_code}`);
        console.log(`       Created At: ${rel.created_at}`);
        console.log(`       Created By: ${rel.created_by}`);
        console.log(`       Data: ${JSON.stringify(rel.relationship_data)}`);
      });
    }
  }

  // Query 3: All MEMBER_OF relationships to the demo org
  console.log('\n📋 Query 3: All MEMBER_OF relationships TO demo org...');
  const { data: orgMemberRels, error: orgError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('to_entity_id', '245be60f-6000-441f-b999-375a5e19e072') // Demo org entity ID
    .eq('relationship_type', 'MEMBER_OF')
    .order('created_at', { ascending: true });

  if (orgError) {
    console.error('❌ Error:', orgError.message);
  } else {
    console.log(`✅ Found ${orgMemberRels?.length || 0} MEMBER_OF relationships to demo org:`);
    if (orgMemberRels && orgMemberRels.length > 0) {
      orgMemberRels.forEach((rel, idx) => {
        console.log(`\n   [${idx + 1}] Relationship ID: ${rel.id}`);
        console.log(`       From Entity: ${rel.from_entity_id}`);
        console.log(`       Is User Entity ID: ${rel.from_entity_id === demoUserEntityId}`);
        console.log(`       Is Supabase User ID: ${rel.from_entity_id === demoSupabaseUserId}`);
        console.log(`       Smart Code: ${rel.smart_code}`);
        console.log(`       Created At: ${rel.created_at}`);
        console.log(`       Created By: ${rel.created_by}`);
      });
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));

  console.log('\n🔑 KEY FINDINGS:');
  console.log(`   Relationships from user_entity_id: ${entityRels?.length || 0}`);
  console.log(`   Relationships from Supabase user ID: ${supabaseRels?.length || 0}`);

  const rpcCreatedRels = entityRels?.filter(r =>
    r.smart_code?.includes('HERA.SECURITY') ||
    r.created_by === demoSupabaseUserId
  );

  const manualRels = supabaseRels?.filter(r =>
    r.smart_code?.includes('HERA.SALON')
  );

  console.log(`\n✅ RPC-created relationships (HERA.SECURITY.*): ${rpcCreatedRels?.length || 0}`);
  if (rpcCreatedRels && rpcCreatedRels.length > 0) {
    console.log('   These were created by hera_onboard_user_v1');
    console.log(`   They use from_entity_id: ${rpcCreatedRels[0].from_entity_id}`);
    console.log(`   This is the USER ENTITY ID (not Supabase ID)`);
  }

  console.log(`\n⚠️  Manual relationships (HERA.SALON.*): ${manualRels?.length || 0}`);
  if (manualRels && manualRels.length > 0) {
    console.log('   These were created manually (workaround)');
    console.log(`   They use from_entity_id: ${manualRels[0].from_entity_id}`);
    console.log(`   This is the SUPABASE USER ID (auth.users.id)`);
  }

  console.log('\n🐛 THE BUG:');
  console.log('   hera_onboard_user_v1 creates relationships FROM user_entity_id ✓');
  console.log('   hera_auth_introspect_v1 looks for relationships FROM Supabase user ID ✗');
  console.log('   Result: Introspection cannot find properly created relationships!');

  console.log('\n');
}

checkOnboardRelationships();
