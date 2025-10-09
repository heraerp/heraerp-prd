#!/usr/bin/env node
/**
 * Test the existing create-user-membership MCP tool
 * Tests the MCP tool against our authentication scenario
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

console.log('🧪 TESTING create-user-membership MCP TOOL');
console.log('===========================================');
console.log('');

// Import the MCP auth tools
const { getAuthorizationHandlers, validateHeraAuthRules } = await import('./hera-mcp-auth-tools.js');

async function testCreateUserMembership() {
  try {
    const TEST_USER_ID = '48089a0e-5199-4d82-b9ac-3a09b68a6864'; // Known user entity ID
    const TEST_AUTH_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // Supabase auth user ID
    const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Hair Talkz organization
    
    console.log('🎯 TEST PARAMETERS');
    console.log('==================');
    console.log(`User Entity ID: ${TEST_USER_ID}`);
    console.log(`Auth User ID: ${TEST_AUTH_USER_ID}`);
    console.log(`Organization ID: ${TEST_ORG_ID}`);
    console.log('');

    // Get the MCP handlers
    const handlers = getAuthorizationHandlers(supabase, supabase);
    const createUserMembershipHandler = handlers['create-user-membership'];

    if (!createUserMembershipHandler) {
      console.log('❌ create-user-membership handler not found');
      return;
    }

    console.log('1️⃣ Testing create-user-membership with correct parameters...');
    
    // Test parameters for the MCP tool
    const membershipArgs = {
      user_id: TEST_USER_ID,           // User entity ID (not auth ID)
      organization_id: TEST_ORG_ID,    // Organization ID
      role: 'admin',                   // Role to assign
      permissions: ['read', 'write', 'delete'], // Custom permissions
      department_access: ['all']       // Department access
    };

    console.log('📋 Calling create-user-membership with args:', JSON.stringify(membershipArgs, null, 2));
    console.log('');

    const result = await createUserMembershipHandler(membershipArgs);
    
    console.log('📊 RESULT:', JSON.stringify(result, null, 2));
    console.log('');

    if (result.success) {
      console.log('✅ create-user-membership executed successfully!');
      console.log(`   Membership ID: ${result.membership_id}`);
      console.log(`   Role: ${result.role}`);
      console.log(`   Permissions: ${JSON.stringify(result.permissions)}`);
    } else {
      console.log('❌ create-user-membership failed:', result.message);
    }
    console.log('');

    // Test 2: Verify the relationship was created correctly
    console.log('2️⃣ Verifying relationship in database...');
    
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', TEST_USER_ID)
      .eq('to_entity_id', TEST_ORG_ID)
      .eq('relationship_type', 'member_of')
      .eq('organization_id', TEST_ORG_ID)
      .single();

    if (relError) {
      console.log('❌ Database verification failed:', relError.message);
    } else {
      console.log('✅ Database relationship verified:');
      console.log(`   Relationship ID: ${relationship.id}`);
      console.log(`   Type: ${relationship.relationship_type}`);
      console.log(`   Role: ${relationship.metadata?.role}`);
      console.log(`   Permissions: ${JSON.stringify(relationship.metadata?.permissions)}`);
      console.log(`   Status: ${relationship.status}`);
      console.log(`   Smart Code: ${relationship.smart_code}`);
    }
    console.log('');

    // Test 3: Check if this resolves the authentication issue
    console.log('3️⃣ Testing authentication resolution...');
    
    // This is the exact query that was failing in user-entity-resolver.ts
    const { data: authRelationship, error: authError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', TEST_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG') // Note: This is different from 'member_of'!
      .maybeSingle();

    if (authError) {
      console.log('⚠️ Authentication query failed:', authError.message);
    } else if (!authRelationship) {
      console.log('⚠️ Authentication query returned null');
      console.log('💡 ISSUE IDENTIFIED: MCP tool creates "member_of" but auth system expects "USER_MEMBER_OF_ORG"');
    } else {
      console.log('✅ Authentication query succeeded!');
      console.log(`   Organization: ${authRelationship.organization_id}`);
      console.log(`   To Entity: ${authRelationship.to_entity_id}`);
    }
    console.log('');

    // Test 4: Test with correct relationship type
    console.log('4️⃣ Testing with correct USER_MEMBER_OF_ORG relationship type...');
    
    // First, remove the existing 'member_of' relationship if it exists
    if (relationship) {
      await supabase
        .from('core_relationships')
        .delete()
        .eq('id', relationship.id);
      console.log('🗑️ Removed existing "member_of" relationship');
    }

    // Create the correct relationship type manually
    const { data: correctRelationship, error: correctError } = await supabase
      .from('core_relationships')
      .insert({
        organization_id: TEST_ORG_ID,
        from_entity_id: TEST_USER_ID,
        to_entity_id: TEST_ORG_ID,
        relationship_type: 'USER_MEMBER_OF_ORG', // Correct type for auth
        smart_code: 'HERA.AUTH.USER.MEMBER.ORG.V1',
        metadata: {
          role: 'admin',
          permissions: ['read', 'write', 'delete'],
          created_via: 'test_script'
        },
        status: 'active'
      })
      .select()
      .single();

    if (correctError) {
      console.log('❌ Failed to create correct relationship:', correctError.message);
    } else {
      console.log('✅ Created USER_MEMBER_OF_ORG relationship:');
      console.log(`   Relationship ID: ${correctRelationship.id}`);
      console.log(`   Type: ${correctRelationship.relationship_type}`);
    }
    console.log('');

    // Test 5: Verify authentication query now works
    console.log('5️⃣ Re-testing authentication query...');
    
    const { data: finalAuthTest, error: finalAuthError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', TEST_USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .maybeSingle();

    if (finalAuthError) {
      console.log('❌ Final authentication query failed:', finalAuthError.message);
    } else if (!finalAuthTest) {
      console.log('❌ Final authentication query returned null');
    } else {
      console.log('🎉 Final authentication query succeeded!');
      console.log(`   Organization: ${finalAuthTest.organization_id}`);
      console.log(`   To Entity: ${finalAuthTest.to_entity_id}`);
    }
    console.log('');

    console.log('🎯 ANALYSIS & CONCLUSIONS');
    console.log('=========================');
    console.log('');
    
    if (result.success && finalAuthTest) {
      console.log('✅ MCP Tool Works: create-user-membership creates relationships successfully');
      console.log('❗ ISSUE FOUND: Relationship type mismatch');
      console.log('   - MCP tool creates: "member_of"');
      console.log('   - Auth system expects: "USER_MEMBER_OF_ORG"');
      console.log('');
      console.log('🔧 SOLUTIONS:');
      console.log('   1. Update MCP tool to use "USER_MEMBER_OF_ORG" relationship type');
      console.log('   2. OR update auth system to use "member_of" relationship type');
      console.log('   3. OR create both relationship types for compatibility');
      console.log('');
      console.log('💡 RECOMMENDATION: Update MCP tool for consistency with authentication system');
    } else {
      console.log('❌ Issues found with MCP tool or authentication setup');
    }

  } catch (error) {
    console.log('');
    console.log('🔥 TESTING ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the test
testCreateUserMembership();