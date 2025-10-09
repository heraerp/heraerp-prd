#!/usr/bin/env node
/**
 * Fix Auth User Mapping
 * Adds the required auth_user_id to user entity metadata
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

console.log('🔗 FIXING AUTH USER MAPPING');
console.log('===========================');
console.log(`User ID: ${USER_ID}`);
console.log('');

async function fixAuthUserMapping() {
  try {
    console.log('1️⃣ Checking current user entity...');
    
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .single();
    
    if (entityError || !userEntity) {
      console.log('❌ User entity not found:', entityError?.message);
      return;
    }
    
    console.log('✅ Found user entity:');
    console.log(`   ID: ${userEntity.id}`);
    console.log(`   Name: ${userEntity.entity_name}`);
    console.log(`   Organization: ${userEntity.organization_id}`);
    console.log(`   Current metadata: ${JSON.stringify(userEntity.metadata)}`);
    
    console.log('');
    console.log('2️⃣ Adding auth_user_id to metadata...');
    
    // Add auth_user_id to metadata
    const updatedMetadata = {
      ...userEntity.metadata,
      auth_user_id: USER_ID
    };
    
    const { data: updatedEntity, error: updateError } = await supabase
      .from('core_entities')
      .update({
        metadata: updatedMetadata
      })
      .eq('id', USER_ID)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating user entity:', updateError.message);
      return;
    }
    
    console.log('✅ User entity updated successfully!');
    console.log(`   Updated metadata: ${JSON.stringify(updatedEntity.metadata)}`);
    
    console.log('');
    console.log('3️⃣ Testing auth introspect compatibility...');
    
    // Test the auth introspect query
    const { data: userEntities, error: introspectError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, metadata')
      .in('entity_type', ['USER', 'user'])
      .contains('metadata', { auth_user_id: USER_ID });
    
    if (introspectError) {
      console.log('❌ Introspect test failed:', introspectError.message);
    } else {
      console.log(`✅ Introspect test passed: Found ${userEntities?.length || 0} matching entities`);
      
      if (userEntities && userEntities.length > 0) {
        userEntities.forEach((entity, index) => {
          console.log(`   Entity ${index + 1}:`);
          console.log(`     ID: ${entity.id}`);
          console.log(`     Organization: ${entity.organization_id}`);
          console.log(`     Type: ${entity.entity_type}`);
          console.log(`     Has auth_user_id: ${entity.metadata?.auth_user_id ? 'Yes' : 'No'}`);
        });
      }
    }
    
    console.log('');
    console.log('4️⃣ Testing RPC function with user scope...');
    
    // Test the RPC function that should now work
    try {
      const { data: rpcResult, error: rpcError } = await supabase
        .rpc('resolve_user_identity_v1');
      
      if (rpcError) {
        console.log('❌ RPC still failing:', rpcError.message);
      } else {
        console.log('✅ RPC Result:', rpcResult);
        
        if (rpcResult && rpcResult.length > 0) {
          console.log('🎉 RPC now returns organization memberships!');
        } else {
          console.log('⚠️ RPC still returns empty - may need user-scoped token');
        }
      }
    } catch (rpcTestError) {
      console.log('⚠️ RPC test error (may be normal with service key):', rpcTestError.message);
    }
    
    console.log('');
    console.log('5️⃣ Final verification...');
    
    // Final verification of all components
    const { data: finalEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .single();
    
    const { data: relationship } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .single();
    
    const hasAuthMapping = finalEntity?.metadata?.auth_user_id === USER_ID;
    const hasMembership = relationship ? true : false;
    
    console.log('🔍 Final verification status:');
    console.log(`   User entity exists: ✅`);
    console.log(`   Auth user mapping: ${hasAuthMapping ? '✅' : '❌'}`);
    console.log(`   Membership relationship: ${hasMembership ? '✅' : '❌'}`);
    console.log(`   Metadata: ${JSON.stringify(finalEntity?.metadata)}`);
    
    console.log('');
    console.log('🎯 SUMMARY');
    console.log('==========');
    
    if (hasAuthMapping && hasMembership) {
      console.log('🎉 AUTH USER MAPPING FIXED!');
      console.log('✅ User entity now has required auth_user_id in metadata');
      console.log('✅ USER_MEMBER_OF_ORG relationship exists');
      console.log('🚀 Authentication should now work properly');
      console.log('');
      console.log('💡 What was fixed:');
      console.log('   - Added auth_user_id to user entity metadata');
      console.log('   - Auth introspect endpoint can now find the user');
      console.log('   - User-to-organization mapping is complete');
      console.log('');
      console.log('🔍 Next steps:');
      console.log('   1. Test login in the web application');
      console.log('   2. Verify /api/v2/auth/introspect returns valid data');
      console.log('   3. Confirm organization context loads properly');
    } else {
      console.log('⚠️ SOME ISSUES REMAIN');
      if (!hasAuthMapping) {
        console.log('❌ Auth user mapping still missing');
      }
      if (!hasMembership) {
        console.log('❌ Membership relationship still missing');
      }
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the fix
fixAuthUserMapping();