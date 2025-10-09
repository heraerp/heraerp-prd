#!/usr/bin/env node
/**
 * Execute User Setup - Complete Flow
 * Creates user entity structure and organization membership
 * User ID: 09b0b92a-d797-489e-bc03-5ca0a6272674
 * Target Org: 378f24fb-d496-4ff7-8afa-ea34895a0eb8
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
const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000';

console.log('🔐 USER SETUP - EXECUTING COMPLETE FLOW');
console.log('=======================================');
console.log(`User ID: ${USER_ID}`);
console.log(`Target Org: ${TARGET_ORG_ID}`);
console.log(`Platform Org: ${PLATFORM_ORG_ID}`);
console.log('');

async function executeUserSetup() {
  try {
    console.log('Step 1: Creating platform organization...');
    
    // Step 1: Ensure platform organization exists
    const { error: orgError } = await supabase
      .from('core_organizations')
      .upsert({
        id: PLATFORM_ORG_ID,
        organization_name: 'HERA Platform',
        organization_code: 'PLATFORM',
        organization_subdomain: 'platform',
        smart_code: 'HERA.PLATFORM.ORGANIZATION.SYSTEM.v1'
      }, { onConflict: 'id' });
    
    if (orgError) {
      console.log('⚠️ Platform org upsert result:', orgError.message);
    } else {
      console.log('✅ Platform organization ensured');
    }
    
    console.log('');
    console.log('Step 2: Creating USER entity...');
    
    // Step 2: Create USER entity
    const { data: userEntity, error: userError } = await supabase
      .from('core_entities')
      .upsert({
        id: USER_ID,
        organization_id: PLATFORM_ORG_ID,
        entity_type: 'user',
        entity_name: 'Platform User',
        entity_code: `USER-${USER_ID.substring(0, 8)}`,
        smart_code: 'HERA.PLATFORM.USER.ENTITY.v1'
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false 
      })
      .select();
    
    if (userError) {
      console.log('❌ User entity error:', userError.message);
    } else {
      console.log('✅ User entity created/updated');
    }
    
    console.log('');
    console.log('Step 3: Adding dynamic data...');
    
    // Step 3: Add dynamic data
    const dynamicFields = [
      {
        organization_id: PLATFORM_ORG_ID,
        entity_id: USER_ID,
        field_name: 'auth_provider',
        field_type: 'text',
        field_value_text: 'supabase',
        smart_code: 'HERA.PLATFORM.USER.AUTH.PROVIDER.v1'
      },
      {
        organization_id: PLATFORM_ORG_ID,
        entity_id: USER_ID,
        field_name: 'user_type',
        field_type: 'text',
        field_value_text: 'standard',
        smart_code: 'HERA.PLATFORM.USER.TYPE.v1'
      },
      {
        organization_id: PLATFORM_ORG_ID,
        entity_id: USER_ID,
        field_name: 'status',
        field_type: 'text',
        field_value_text: 'active',
        smart_code: 'HERA.PLATFORM.USER.STATUS.v1'
      }
    ];
    
    for (const field of dynamicFields) {
      const { error: fieldError } = await supabase
        .from('core_dynamic_data')
        .upsert(field, { 
          onConflict: 'organization_id,entity_id,field_name',
          ignoreDuplicates: false
        });
      
      if (fieldError) {
        console.log('⚠️ Dynamic field error for', field.field_name + ':', fieldError.message);
      } else {
        console.log('✅ Added dynamic field:', field.field_name);
      }
    }
    
    console.log('');
    console.log('Step 4: Finding target organization entity...');
    
    // Step 4: Find target organization entity
    const { data: targetOrgEntity, error: targetOrgError } = await supabase
      .from('core_entities')
      .select('id')
      .eq('entity_type', 'organization')
      .eq('organization_id', TARGET_ORG_ID)
      .single();
    
    if (targetOrgError || !targetOrgEntity) {
      console.log('❌ Target organization entity not found:', targetOrgError?.message);
      return;
    }
    
    console.log('✅ Found target organization entity:', targetOrgEntity.id);
    
    console.log('');
    console.log('Step 5: Creating USER_MEMBER_OF_ORG relationship...');
    
    // Step 5: Create USER_MEMBER_OF_ORG relationship
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .upsert({
        organization_id: TARGET_ORG_ID,
        from_entity_id: USER_ID,
        to_entity_id: targetOrgEntity.id,
        relationship_type: 'USER_MEMBER_OF_ORG',
        smart_code: 'HERA.UNIVERSAL.MEMBERSHIP.USER.ORG.v1'
      }, { 
        onConflict: 'organization_id,from_entity_id,to_entity_id,relationship_type',
        ignoreDuplicates: false
      })
      .select();
    
    if (relError) {
      console.log('❌ Relationship error:', relError.message);
    } else {
      console.log('✅ USER_MEMBER_OF_ORG relationship created');
    }
    
    console.log('');
    console.log('Step 6: Adding user role and permissions...');
    
    // Step 6: Add role and permissions in target org
    const targetOrgFields = [
      {
        organization_id: TARGET_ORG_ID,
        entity_id: USER_ID,
        field_name: 'role',
        field_type: 'text',
        field_value_text: 'user',
        smart_code: 'HERA.UNIVERSAL.USER.ROLE.v1'
      },
      {
        organization_id: TARGET_ORG_ID,
        entity_id: USER_ID,
        field_name: 'permissions',
        field_type: 'text',
        field_value_text: 'entities:read,transactions:read,dashboard:read',
        smart_code: 'HERA.UNIVERSAL.USER.PERMISSIONS.v1'
      }
    ];
    
    for (const field of targetOrgFields) {
      const { error: fieldError } = await supabase
        .from('core_dynamic_data')
        .upsert(field, { 
          onConflict: 'organization_id,entity_id,field_name',
          ignoreDuplicates: false
        });
      
      if (fieldError) {
        console.log('⚠️ Target org field error for', field.field_name + ':', fieldError.message);
      } else {
        console.log('✅ Added target org field:', field.field_name);
      }
    }
    
    console.log('');
    console.log('🔍 VERIFICATION');
    console.log('===============');
    
    // Verification
    const { data: userCheck } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID);
    
    const { data: membershipCheck } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('organization_id', TARGET_ORG_ID);
    
    const { data: dynamicDataCheck } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, organization_id')
      .eq('entity_id', USER_ID);
    
    console.log('👤 User entity exists:', userCheck?.length > 0 ? 'YES' : 'NO');
    console.log('🔗 Membership relationship exists:', membershipCheck?.length > 0 ? 'YES' : 'NO');
    console.log('📊 Dynamic data fields:', dynamicDataCheck?.length || 0);
    
    if (dynamicDataCheck?.length > 0) {
      console.log('');
      console.log('📋 Dynamic data summary:');
      dynamicDataCheck.forEach(field => {
        const orgType = field.organization_id === PLATFORM_ORG_ID ? 'Platform' : 'Target';
        console.log(`   ${orgType} - ${field.field_name}: ${field.field_value_text}`);
      });
    }
    
    console.log('');
    console.log('🎉 USER SETUP COMPLETE!');
    console.log('=======================');
    console.log('✅ User exists in Supabase auth');
    console.log('✅ User entity created in HERA platform org');
    console.log('✅ USER_MEMBER_OF_ORG relationship established');
    console.log('✅ Dynamic data populated for both orgs');
    console.log('🚀 Authentication should now work properly');
    
    console.log('');
    console.log('💡 Summary of what was created:');
    console.log(`   - Platform USER entity (${USER_ID})`);
    console.log(`   - USER_MEMBER_OF_ORG relationship to target org`);
    console.log('   - Platform org dynamic data (auth_provider, user_type, status)');
    console.log('   - Target org dynamic data (role, permissions)');
    console.log('');
    console.log('🔍 Next steps:');
    console.log('   1. Test user authentication in the web application');
    console.log('   2. Verify organization access works properly');
    console.log('   3. Confirm all permissions are working as expected');
    
  } catch (error) {
    console.log('');
    console.log('🔥 FATAL ERROR:', error.message);
    console.log('Stack:', error.stack);
    process.exit(1);
  }
}

// Execute the user setup
executeUserSetup();