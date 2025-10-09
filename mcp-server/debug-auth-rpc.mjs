#!/usr/bin/env node
/**
 * Debug Auth RPC Functions
 * Investigates why the authentication is failing
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
const TARGET_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';

console.log('🔍 DEBUGGING AUTH RPC FUNCTIONS');
console.log('===============================');
console.log(`User ID: ${USER_ID}`);
console.log(`Target Org: ${TARGET_ORG_ID}`);
console.log('');

async function debugAuthRPC() {
  try {
    console.log('1️⃣ Checking if user exists in Supabase auth...');
    
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID);
    
    if (authError || !authUser.user) {
      console.log('❌ User not found in auth:', authError?.message);
      return;
    }
    
    console.log('✅ User found in auth:', authUser.user.email);
    
    console.log('');
    console.log('2️⃣ Checking USER_MEMBER_OF_ORG relationships...');
    
    const { data: userRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
    
    if (relError) {
      console.log('❌ Error querying relationships:', relError.message);
    } else {
      console.log(`👥 USER_MEMBER_OF_ORG relationships found: ${userRelationships?.length || 0}`);
      
      if (userRelationships && userRelationships.length > 0) {
        userRelationships.forEach((rel, index) => {
          console.log(`   Relationship ${index + 1}:`);
          console.log(`     ID: ${rel.id}`);
          console.log(`     From Entity: ${rel.from_entity_id}`);
          console.log(`     To Entity: ${rel.to_entity_id}`);
          console.log(`     Organization: ${rel.organization_id}`);
          console.log(`     Type: ${rel.relationship_type}`);
          console.log(`     Active: ${rel.is_active}`);
          console.log(`     Smart Code: ${rel.smart_code}`);
        });
      } else {
        console.log('❌ No USER_MEMBER_OF_ORG relationships found!');
        console.log('💡 This explains why authentication is failing');
      }
    }
    
    console.log('');
    console.log('3️⃣ Testing resolve_user_identity_v1 RPC function...');
    
    // Test the RPC function that the auth system uses
    const { data: rpcResult, error: rpcError } = await supabase
      .rpc('resolve_user_identity_v1');
    
    if (rpcError) {
      console.log('❌ RPC Error:', rpcError.message);
      
      if (rpcError.message.includes('function') && rpcError.message.includes('does not exist')) {
        console.log('💡 The RPC function resolve_user_identity_v1 does not exist!');
        console.log('🔧 This is likely the root cause of the authentication issue');
      }
    } else {
      console.log('✅ RPC Result:', rpcResult);
    }
    
    console.log('');
    console.log('4️⃣ Checking available RPC functions...');
    
    // Check what RPC functions exist
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname, prosrc')
      .ilike('proname', '%resolve%user%')
      .limit(10);
    
    if (funcError) {
      console.log('❌ Cannot check functions:', funcError.message);
    } else if (!functions || functions.length === 0) {
      console.log('❌ No user resolution RPC functions found!');
      console.log('💡 The required RPC functions need to be created');
    } else {
      console.log(`✅ Found ${functions.length} user-related RPC functions:`);
      functions.forEach(func => {
        console.log(`   - ${func.proname}`);
      });
    }
    
    console.log('');
    console.log('5️⃣ Manual organization resolution...');
    
    // Manually resolve what the RPC should return
    const { data: orgMemberships } = await supabase
      .from('core_relationships')
      .select(`
        organization_id,
        to_entity_id,
        core_entities!core_relationships_to_entity_id_fkey(entity_name)
      `)
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG');
    
    if (orgMemberships && orgMemberships.length > 0) {
      console.log('✅ Manual organization resolution:');
      const orgIds = orgMemberships.map(m => m.organization_id);
      console.log(`   Organization IDs: ${JSON.stringify(orgIds)}`);
      
      orgMemberships.forEach((membership, index) => {
        console.log(`   Membership ${index + 1}:`);
        console.log(`     Org ID: ${membership.organization_id}`);
        console.log(`     To Entity: ${membership.to_entity_id}`);
        console.log(`     Org Name: ${membership.core_entities?.entity_name || 'Unknown'}`);
      });
    } else {
      console.log('❌ Manual resolution found no memberships');
    }
    
    console.log('');
    console.log('6️⃣ Checking user entity mapping...');
    
    // Check how the user entity is mapped
    const { data: userEntities } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID);
    
    if (userEntities && userEntities.length > 0) {
      console.log('✅ User entity found:');
      const entity = userEntities[0];
      console.log(`   ID: ${entity.id}`);
      console.log(`   Organization: ${entity.organization_id}`);
      console.log(`   Type: ${entity.entity_type}`);
      console.log(`   Name: ${entity.entity_name}`);
      console.log(`   Code: ${entity.entity_code}`);
      console.log(`   Metadata: ${JSON.stringify(entity.metadata)}`);
      
      // Check if metadata contains auth_user_id (required by introspect endpoint)
      if (entity.metadata && entity.metadata.auth_user_id) {
        console.log('✅ Entity has auth_user_id in metadata');
      } else {
        console.log('❌ Entity missing auth_user_id in metadata!');
        console.log('💡 The auth introspect endpoint requires this field');
      }
    } else {
      console.log('❌ User entity not found');
    }
    
    console.log('');
    console.log('🎯 DIAGNOSIS SUMMARY');
    console.log('===================');
    
    const hasUserInAuth = authUser?.user ? true : false;
    const hasUserEntity = userEntities?.length > 0;
    const hasMembershipRel = userRelationships?.length > 0;
    const hasRPCFunction = !rpcError || !rpcError.message.includes('does not exist');
    const hasAuthMapping = userEntities?.[0]?.metadata?.auth_user_id ? true : false;
    
    console.log(`Supabase Auth User: ${hasUserInAuth ? '✅' : '❌'}`);
    console.log(`HERA User Entity: ${hasUserEntity ? '✅' : '❌'}`);
    console.log(`Membership Relationship: ${hasMembershipRel ? '✅' : '❌'}`);
    console.log(`RPC Function Exists: ${hasRPCFunction ? '✅' : '❌'}`);
    console.log(`Auth User ID Mapping: ${hasAuthMapping ? '✅' : '❌'}`);
    
    console.log('');
    
    if (!hasMembershipRel) {
      console.log('🔧 ACTION REQUIRED: Create USER_MEMBER_OF_ORG relationship');
    }
    
    if (!hasRPCFunction) {
      console.log('🔧 ACTION REQUIRED: Create resolve_user_identity_v1 RPC function');
    }
    
    if (!hasAuthMapping) {
      console.log('🔧 ACTION REQUIRED: Add auth_user_id to user entity metadata');
    }
    
    const allGood = hasUserInAuth && hasUserEntity && hasMembershipRel && hasRPCFunction && hasAuthMapping;
    
    if (allGood) {
      console.log('🎉 ALL COMPONENTS VERIFIED - Authentication should work!');
    } else {
      console.log('⚠️ ISSUES FOUND - Authentication will fail until resolved');
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 DEBUG ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the debug
debugAuthRPC();