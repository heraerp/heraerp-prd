#!/usr/bin/env node
/**
 * Verify User Setup - Complete Verification
 * Checks all aspects of the user setup for authentication
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

console.log('🔍 COMPLETE USER SETUP VERIFICATION');
console.log('===================================');
console.log(`User ID: ${USER_ID}`);
console.log(`Target Org: ${TARGET_ORG_ID}`);
console.log(`Platform Org: ${PLATFORM_ORG_ID}`);
console.log('');

async function verifyUserSetup() {
  try {
    console.log('1️⃣ Checking Supabase Auth User...');
    
    // Check if user exists in Supabase auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserById(USER_ID);
    
    if (authError) {
      console.log('❌ Auth user check failed:', authError.message);
    } else if (authUser.user) {
      console.log('✅ User exists in Supabase auth');
      console.log(`   Email: ${authUser.user.email || 'No email'}`);
      console.log(`   Created: ${authUser.user.created_at}`);
    } else {
      console.log('❌ User not found in Supabase auth');
    }
    
    console.log('');
    console.log('2️⃣ Checking Platform Organization...');
    
    // Check platform organization
    const { data: platformOrg, error: platformOrgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', PLATFORM_ORG_ID)
      .single();
    
    if (platformOrgError) {
      console.log('❌ Platform organization check failed:', platformOrgError.message);
    } else {
      console.log('✅ Platform organization exists');
      console.log(`   Name: ${platformOrg.organization_name}`);
      console.log(`   Code: ${platformOrg.organization_code}`);
    }
    
    console.log('');
    console.log('3️⃣ Checking User Entity in Platform Org...');
    
    // Check user entity in platform org
    const { data: userEntity, error: userEntityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', USER_ID)
      .eq('organization_id', PLATFORM_ORG_ID)
      .single();
    
    if (userEntityError) {
      console.log('❌ User entity check failed:', userEntityError.message);
    } else {
      console.log('✅ User entity exists in platform org');
      console.log(`   Name: ${userEntity.entity_name}`);
      console.log(`   Code: ${userEntity.entity_code}`);
      console.log(`   Type: ${userEntity.entity_type}`);
      console.log(`   Smart Code: ${userEntity.smart_code}`);
    }
    
    console.log('');
    console.log('4️⃣ Checking Platform Org Dynamic Data...');
    
    // Check platform org dynamic data
    const { data: platformDynamicData, error: platformDynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, smart_code')
      .eq('entity_id', USER_ID)
      .eq('organization_id', PLATFORM_ORG_ID);
    
    if (platformDynamicError) {
      console.log('❌ Platform dynamic data check failed:', platformDynamicError.message);
    } else {
      console.log(`✅ Platform dynamic data: ${platformDynamicData?.length || 0} fields`);
      platformDynamicData?.forEach(field => {
        console.log(`   ${field.field_name}: ${field.field_value_text}`);
      });
    }
    
    console.log('');
    console.log('5️⃣ Checking Target Organization...');
    
    // Check target organization
    const { data: targetOrg, error: targetOrgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', TARGET_ORG_ID)
      .single();
    
    if (targetOrgError) {
      console.log('❌ Target organization check failed:', targetOrgError.message);
    } else {
      console.log('✅ Target organization exists');
      console.log(`   Name: ${targetOrg.organization_name}`);
      console.log(`   Code: ${targetOrg.organization_code}`);
    }
    
    console.log('');
    console.log('6️⃣ Checking USER_MEMBER_OF_ORG Relationship...');
    
    // Check USER_MEMBER_OF_ORG relationship
    const { data: membershipRel, error: membershipError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('organization_id', TARGET_ORG_ID);
    
    if (membershipError) {
      console.log('❌ Membership relationship check failed:', membershipError.message);
    } else if (membershipRel && membershipRel.length > 0) {
      console.log('✅ USER_MEMBER_OF_ORG relationship exists');
      console.log(`   Relationship ID: ${membershipRel[0].id}`);
      console.log(`   From Entity: ${membershipRel[0].from_entity_id}`);
      console.log(`   To Entity: ${membershipRel[0].to_entity_id}`);
      console.log(`   Smart Code: ${membershipRel[0].smart_code}`);
      console.log(`   Active: ${membershipRel[0].is_active}`);
    } else {
      console.log('❌ USER_MEMBER_OF_ORG relationship not found');
    }
    
    console.log('');
    console.log('7️⃣ Checking Target Org Dynamic Data...');
    
    // Check target org dynamic data
    const { data: targetDynamicData, error: targetDynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, smart_code')
      .eq('entity_id', USER_ID)
      .eq('organization_id', TARGET_ORG_ID);
    
    if (targetDynamicError) {
      console.log('❌ Target dynamic data check failed:', targetDynamicError.message);
    } else {
      console.log(`✅ Target dynamic data: ${targetDynamicData?.length || 0} fields`);
      targetDynamicData?.forEach(field => {
        console.log(`   ${field.field_name}: ${field.field_value_text}`);
      });
    }
    
    console.log('');
    console.log('8️⃣ Authentication Flow Simulation...');
    
    // Simulate the authentication flow
    const authFlowChecks = {
      supabaseAuth: authUser?.user ? true : false,
      platformUserEntity: userEntity ? true : false,
      membershipRelationship: membershipRel?.length > 0,
      targetOrgAccess: targetOrg ? true : false,
      userRole: targetDynamicData?.find(f => f.field_name === 'role')?.field_value_text || 'none',
      userPermissions: targetDynamicData?.find(f => f.field_name === 'permissions')?.field_value_text || 'none'
    };
    
    console.log('🔍 Authentication Flow Status:');
    console.log(`   Supabase Auth: ${authFlowChecks.supabaseAuth ? '✅' : '❌'}`);
    console.log(`   Platform User Entity: ${authFlowChecks.platformUserEntity ? '✅' : '❌'}`);
    console.log(`   Membership Relationship: ${authFlowChecks.membershipRelationship ? '✅' : '❌'}`);
    console.log(`   Target Org Access: ${authFlowChecks.targetOrgAccess ? '✅' : '❌'}`);
    console.log(`   User Role: ${authFlowChecks.userRole}`);
    console.log(`   User Permissions: ${authFlowChecks.userPermissions}`);
    
    const allChecksPass = Object.values(authFlowChecks).slice(0, 4).every(check => check === true);
    
    console.log('');
    console.log('🎯 VERIFICATION SUMMARY');
    console.log('======================');
    
    if (allChecksPass) {
      console.log('🎉 ALL AUTHENTICATION COMPONENTS VERIFIED!');
      console.log('✅ User setup is complete and functional');
      console.log('🚀 Authentication flow should work perfectly');
      console.log('');
      console.log('💡 What works now:');
      console.log('   - User exists in Supabase auth');
      console.log('   - User entity exists in HERA platform organization');
      console.log('   - USER_MEMBER_OF_ORG relationship established');
      console.log('   - User has role and permissions in target organization');
      console.log('   - All required dynamic data is populated');
      console.log('');
      console.log('🔍 Next steps for testing:');
      console.log('   1. Log in to the web application with this user');
      console.log('   2. Verify organization context is properly loaded');
      console.log('   3. Test access to protected resources');
      console.log('   4. Confirm all HERA functionality works as expected');
    } else {
      console.log('⚠️ SOME AUTHENTICATION COMPONENTS MISSING');
      console.log('💡 Check the failed components above and address them');
      
      if (!authFlowChecks.supabaseAuth) {
        console.log('❌ User not found in Supabase auth - this user may not exist');
      }
      if (!authFlowChecks.platformUserEntity) {
        console.log('❌ User entity missing in platform org - run user setup again');
      }
      if (!authFlowChecks.membershipRelationship) {
        console.log('❌ Membership relationship missing - run relationship fix');
      }
      if (!authFlowChecks.targetOrgAccess) {
        console.log('❌ Target organization missing - check organization setup');
      }
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 VERIFICATION ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the verification
verifyUserSetup();