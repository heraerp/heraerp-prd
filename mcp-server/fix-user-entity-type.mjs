#!/usr/bin/env node
/**
 * Fix User Entity Type
 * Changes entity_type from 'user' to 'USER' for auth compatibility
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

console.log('🔧 FIXING USER ENTITY TYPE');
console.log('==========================');
console.log(`User ID: ${USER_ID}`);
console.log('');

async function fixUserEntityType() {
  try {
    console.log('1️⃣ Checking current user entity...');
    
    const { data: currentEntity, error: currentError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .single();
    
    if (currentError || !currentEntity) {
      console.log('❌ User entity not found:', currentError?.message);
      return;
    }
    
    console.log('✅ Found user entity:');
    console.log(`   ID: ${currentEntity.id}`);
    console.log(`   Current entity_type: "${currentEntity.entity_type}"`);
    console.log(`   Name: ${currentEntity.entity_name}`);
    console.log(`   Organization: ${currentEntity.organization_id}`);
    
    if (currentEntity.entity_type === 'USER') {
      console.log('✅ Entity type is already correct (USER)');
      console.log('💡 The issue might be elsewhere');
      return;
    }
    
    console.log('');
    console.log('2️⃣ Updating entity_type to "USER"...');
    
    const { data: updatedEntity, error: updateError } = await supabase
      .from('core_entities')
      .update({
        entity_type: 'USER'
      })
      .eq('id', USER_ID)
      .select()
      .single();
    
    if (updateError) {
      console.log('❌ Error updating entity_type:', updateError.message);
      return;
    }
    
    console.log('✅ Entity type updated successfully!');
    console.log(`   New entity_type: "${updatedEntity.entity_type}"`);
    
    console.log('');
    console.log('3️⃣ Testing auth introspect query...');
    
    // Test both entity types to see what the introspect endpoint finds
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
          console.log(`     Type: "${entity.entity_type}"`);
          console.log(`     Organization: ${entity.organization_id}`);
          console.log(`     Has auth_user_id: ${entity.metadata?.auth_user_id ? 'Yes' : 'No'}`);
        });
      }
    }
    
    console.log('');
    console.log('4️⃣ Testing specific USER entity type query...');
    
    // Test the exact query the auth introspect uses
    const { data: userTypeEntities, error: userTypeError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, metadata')
      .eq('entity_type', 'USER')
      .contains('metadata', { auth_user_id: USER_ID });
    
    if (userTypeError) {
      console.log('❌ USER entity type test failed:', userTypeError.message);
    } else {
      console.log(`✅ USER entity type test: Found ${userTypeEntities?.length || 0} entities`);
      
      if (userTypeEntities && userTypeEntities.length > 0) {
        console.log('🎉 Auth introspect should now find the user entity!');
      } else {
        console.log('⚠️ Still not finding USER entity - check metadata');
      }
    }
    
    console.log('');
    console.log('5️⃣ Final verification...');
    
    const { data: finalEntity } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .single();
    
    const isCorrectType = finalEntity?.entity_type === 'USER';
    const hasAuthMapping = finalEntity?.metadata?.auth_user_id === USER_ID;
    
    console.log('🔍 Final verification status:');
    console.log(`   Entity type is "USER": ${isCorrectType ? '✅' : '❌'}`);
    console.log(`   Has auth_user_id: ${hasAuthMapping ? '✅' : '❌'}`);
    console.log(`   Metadata: ${JSON.stringify(finalEntity?.metadata)}`);
    
    console.log('');
    console.log('🎯 SUMMARY');
    console.log('==========');
    
    if (isCorrectType && hasAuthMapping) {
      console.log('🎉 USER ENTITY TYPE FIXED!');
      console.log('✅ Entity type is now "USER" (uppercase)');
      console.log('✅ Auth user mapping is correct');
      console.log('🚀 Auth introspect endpoint should now work');
      console.log('');
      console.log('💡 What was fixed:');
      console.log('   - Changed entity_type from "user" to "USER"');
      console.log('   - Auth introspect can now find the user entity');
      console.log('   - User authentication should work properly');
      console.log('');
      console.log('🔍 Next steps:');
      console.log('   1. Test login in the web application');
      console.log('   2. Verify /api/v2/auth/introspect returns 200');
      console.log('   3. Check that organization context loads');
    } else {
      console.log('⚠️ ISSUES REMAIN');
      if (!isCorrectType) {
        console.log('❌ Entity type is still not "USER"');
      }
      if (!hasAuthMapping) {
        console.log('❌ Auth user mapping is missing');
      }
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the fix
fixUserEntityType();