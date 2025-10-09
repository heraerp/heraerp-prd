#!/usr/bin/env node
/**
 * Final Auth Verification
 * Complete test of all authentication components after fixes
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

console.log('🔍 FINAL AUTHENTICATION VERIFICATION');
console.log('====================================');
console.log(`User ID: ${USER_ID}`);
console.log(`Target Org: ${TARGET_ORG_ID}`);
console.log(`Platform Org: ${PLATFORM_ORG_ID}`);
console.log('');

async function finalAuthVerification() {
  try {
    console.log('1️⃣ Testing Auth Introspect Query (Exact Match)...');
    
    // Test the EXACT query that the auth introspect endpoint uses
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('id, organization_id, entity_type, metadata')
      .in('entity_type', ['USER', 'user'])
      .contains('metadata', { auth_user_id: USER_ID });
    
    if (entityError) {
      console.log('❌ Auth introspect query failed:', entityError.message);
    } else {
      console.log(`✅ Auth introspect query succeeded: Found ${userEntities?.length || 0} entities`);
      
      if (userEntities && userEntities.length > 0) {
        const userEntity = userEntities.find(e => e.organization_id === PLATFORM_ORG_ID) || userEntities[0];
        console.log('✅ User entity details:');
        console.log(`   ID: ${userEntity.id}`);
        console.log(`   Type: "${userEntity.entity_type}"`);
        console.log(`   Organization: ${userEntity.organization_id}`);
        console.log(`   Auth User ID: ${userEntity.metadata?.auth_user_id}`);
        console.log(`   Matches User ID: ${userEntity.metadata?.auth_user_id === USER_ID ? '✅' : '❌'}`);
      } else {
        console.log('❌ No entities found - auth introspect will fail');
      }
    }
    
    console.log('');
    console.log('2️⃣ Testing Dynamic Data Resolution...');
    
    // Test dynamic data resolution in target organization
    const { data: dynamicRows, error: dynErr } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type')
      .eq('entity_id', USER_ID)
      .eq('organization_id', TARGET_ORG_ID);
    
    if (dynErr) {
      console.log('❌ Dynamic data query failed:', dynErr.message);
    } else {
      console.log(`✅ Dynamic data query succeeded: Found ${dynamicRows?.length || 0} fields`);
      
      if (dynamicRows && dynamicRows.length > 0) {
        const map = {};
        for (const f of dynamicRows) {
          const value = f.field_type === 'json' ? f.field_value_json : f.field_value_text;
          map[f.field_name] = value;
        }
        
        const salonRole = map['salon_role'];
        const role = map['role'];
        const permissionsValue = map['permissions'];
        
        console.log('✅ Dynamic data mapping:');
        console.log(`   role: ${role || 'None'}`);
        console.log(`   salon_role: ${salonRole || 'None'}`);
        console.log(`   permissions: ${permissionsValue || 'None'}`);
        
        const resolvedRole = salonRole || role;
        const resolvedPermissions = Array.isArray(permissionsValue) ? permissionsValue : [];
        
        console.log(`   Resolved role: ${resolvedRole || 'None'}`);
        console.log(`   Resolved permissions: ${JSON.stringify(resolvedPermissions)}`);
      } else {
        console.log('⚠️ No dynamic data found - will use defaults');
      }
    }
    
    console.log('');
    console.log('3️⃣ Testing Organization Membership...');
    
    const { data: membershipRel, error: membershipError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .eq('organization_id', TARGET_ORG_ID);
    
    if (membershipError) {
      console.log('❌ Membership query failed:', membershipError.message);
    } else {
      console.log(`✅ Membership query succeeded: Found ${membershipRel?.length || 0} relationships`);
      
      if (membershipRel && membershipRel.length > 0) {
        const rel = membershipRel[0];
        console.log('✅ Membership relationship details:');
        console.log(`   ID: ${rel.id}`);
        console.log(`   From Entity: ${rel.from_entity_id}`);
        console.log(`   To Entity: ${rel.to_entity_id}`);
        console.log(`   Organization: ${rel.organization_id}`);
        console.log(`   Type: ${rel.relationship_type}`);
        console.log(`   Active: ${rel.is_active}`);
        console.log(`   Smart Code: ${rel.smart_code}`);
      } else {
        console.log('❌ No membership relationship found');
      }
    }
    
    console.log('');
    console.log('4️⃣ Simulating Complete Auth Flow...');
    
    console.log('🔄 Simulating auth introspect endpoint logic:');
    
    // Step 1: Find user entity
    console.log('   Step 1: Finding user entity with auth_user_id...');
    if (userEntities && userEntities.length > 0) {
      const userEntity = userEntities.find(e => e.organization_id === PLATFORM_ORG_ID) || userEntities[0];
      console.log(`   ✅ Found user entity: ${userEntity.id}`);
      
      // Step 2: Read dynamic fields
      console.log('   Step 2: Reading dynamic fields...');
      if (dynamicRows && dynamicRows.length > 0) {
        console.log(`   ✅ Found ${dynamicRows.length} dynamic fields`);
        
        // Step 3: Resolve roles and permissions
        console.log('   Step 3: Resolving roles and permissions...');
        const map = {};
        for (const f of dynamicRows) {
          const value = f.field_type === 'json' ? f.field_value_json : f.field_value_text;
          map[f.field_name] = value;
        }
        
        const resolvedRole = map['salon_role'] || map['role'];
        const resolvedPermissions = Array.isArray(map['permissions']) ? map['permissions'] : [];
        
        console.log(`   ✅ Resolved role: ${resolvedRole || 'user'}`);
        console.log(`   ✅ Resolved permissions: ${JSON.stringify(resolvedPermissions)}`);
        
        // Step 4: Build auth response
        console.log('   Step 4: Building auth response...');
        const authResponse = {
          user_id: USER_ID,
          email: 'michele@hairtalkz.com',
          organization_id: TARGET_ORG_ID,
          roles: resolvedRole ? [resolvedRole] : ['user'],
          permissions: resolvedPermissions.length > 0 ? resolvedPermissions : ['entities:read', 'transactions:read', 'dashboard:read'],
          source: 'server'
        };
        
        console.log('   ✅ Expected auth response:');
        console.log(`      ${JSON.stringify(authResponse, null, 6)}`);
        
      } else {
        console.log('   ⚠️ No dynamic fields - will use JWT defaults');
      }
    } else {
      console.log('   ❌ No user entity found - auth will fail');
    }
    
    console.log('');
    console.log('5️⃣ Testing RPC Functions (Expected to be Empty)...');
    
    // Test RPC functions (these should return empty with service role)
    const { data: identityResult } = await supabase.rpc('resolve_user_identity_v1');
    const { data: rolesResult } = await supabase.rpc('resolve_user_roles_in_org', { p_org: TARGET_ORG_ID });
    
    console.log('✅ RPC function results (service role):');
    console.log(`   resolve_user_identity_v1: ${JSON.stringify(identityResult)}`);
    console.log(`   resolve_user_roles_in_org: ${JSON.stringify(rolesResult)}`);
    console.log('💡 Empty results are expected with service role tokens');
    
    console.log('');
    console.log('🎯 FINAL VERIFICATION SUMMARY');
    console.log('=============================');
    
    const hasUserEntity = userEntities && userEntities.length > 0;
    const hasCorrectType = userEntities?.some(e => e.entity_type === 'USER');
    const hasAuthMapping = userEntities?.some(e => e.metadata?.auth_user_id === USER_ID);
    const hasMembership = membershipRel && membershipRel.length > 0;
    const hasDynamicData = dynamicRows && dynamicRows.length > 0;
    
    console.log(`Auth Introspect Query: ${hasUserEntity ? '✅' : '❌'}`);
    console.log(`Correct Entity Type (USER): ${hasCorrectType ? '✅' : '❌'}`);
    console.log(`Auth User Mapping: ${hasAuthMapping ? '✅' : '❌'}`);
    console.log(`Organization Membership: ${hasMembership ? '✅' : '❌'}`);
    console.log(`Dynamic Data: ${hasDynamicData ? '✅' : '❌'}`);
    
    const allGood = hasUserEntity && hasCorrectType && hasAuthMapping && hasMembership;
    
    console.log('');
    
    if (allGood) {
      console.log('🎉 ALL AUTHENTICATION COMPONENTS VERIFIED!');
      console.log('✅ Auth introspect endpoint should return 200');
      console.log('✅ User should be able to log in successfully');
      console.log('✅ Organization context should load properly');
      console.log('✅ Permissions should be applied correctly');
      console.log('');
      console.log('🚀 AUTHENTICATION IS FULLY OPERATIONAL!');
      console.log('');
      console.log('💡 What will happen when user logs in:');
      console.log('   1. JWT token validates successfully');
      console.log('   2. Auth introspect finds USER entity');
      console.log('   3. Organization membership resolves to Hairtalkz');
      console.log('   4. User role and permissions are applied');
      console.log('   5. Dashboard loads with proper organization context');
    } else {
      console.log('⚠️ SOME ISSUES REMAIN:');
      if (!hasUserEntity) console.log('❌ User entity not found by auth introspect query');
      if (!hasCorrectType) console.log('❌ Entity type is not "USER"');
      if (!hasAuthMapping) console.log('❌ Auth user mapping missing');
      if (!hasMembership) console.log('❌ Organization membership missing');
    }
    
  } catch (error) {
    console.log('');
    console.log('🔥 VERIFICATION ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Execute the final verification
finalAuthVerification();