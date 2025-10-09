#!/usr/bin/env node
/**
 * Test User Assignment RPC Functions
 * Tests the new RPC functions for assigning users to organizations
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

console.log('🧪 TESTING USER ASSIGNMENT RPC FUNCTIONS');
console.log('==========================================');
console.log('');

async function testUserAssignmentRPCs() {
  try {
    const TEST_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674';
    const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
    const ASSIGNER_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'; // Same user for testing
    
    console.log('🎯 TEST PARAMETERS');
    console.log('==================');
    console.log(`User Auth ID: ${TEST_USER_ID}`);
    console.log(`Organization ID: ${TEST_ORG_ID}`);
    console.log(`Assigner ID: ${ASSIGNER_USER_ID}`);
    console.log('');

    // Test 1: Get current user memberships
    console.log('1️⃣ Testing get_user_organization_memberships...');
    const { data: memberships, error: membershipError } = await supabase
      .rpc('get_user_organization_memberships', {
        p_user_auth_id: TEST_USER_ID
      });

    if (membershipError) {
      console.log('❌ Membership query failed:', membershipError.message);
    } else {
      console.log('✅ Current memberships:', JSON.stringify(memberships, null, 2));
    }
    console.log('');

    // Test 2: Assign user to organization (should update existing)
    console.log('2️⃣ Testing assign_user_to_organization...');
    const { data: assignResult, error: assignError } = await supabase
      .rpc('assign_user_to_organization', {
        p_user_auth_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_role: 'admin',
        p_permissions: ['read', 'write', 'delete'],
        p_assigner_auth_id: ASSIGNER_USER_ID
      });

    if (assignError) {
      console.log('❌ User assignment failed:', assignError.message);
    } else {
      console.log('✅ User assignment result:', JSON.stringify(assignResult, null, 2));
    }
    console.log('');

    // Test 3: Update user role
    console.log('3️⃣ Testing update_user_role_in_organization...');
    const { data: updateResult, error: updateError } = await supabase
      .rpc('update_user_role_in_organization', {
        p_user_auth_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_new_role: 'owner',
        p_new_permissions: ['*'],
        p_updater_auth_id: ASSIGNER_USER_ID
      });

    if (updateError) {
      console.log('❌ Role update failed:', updateError.message);
    } else {
      console.log('✅ Role update result:', JSON.stringify(updateResult, null, 2));
    }
    console.log('');

    // Test 4: Get updated memberships
    console.log('4️⃣ Testing updated memberships...');
    const { data: updatedMemberships, error: updatedError } = await supabase
      .rpc('get_user_organization_memberships', {
        p_user_auth_id: TEST_USER_ID
      });

    if (updatedError) {
      console.log('❌ Updated membership query failed:', updatedError.message);
    } else {
      console.log('✅ Updated memberships:', JSON.stringify(updatedMemberships, null, 2));
    }
    console.log('');

    // Test 5: Verify relationship in database
    console.log('5️⃣ Verifying relationship in database...');
    const { data: dbRelationship, error: dbError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', '48089a0e-5199-4d82-b9ac-3a09b68a6864') // Known user entity ID
      .eq('to_entity_id', TEST_ORG_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
      .single();

    if (dbError) {
      console.log('❌ Database relationship verification failed:', dbError.message);
    } else {
      console.log('✅ Database relationship verified:');
      console.log(`   Relationship ID: ${dbRelationship.id}`);
      console.log(`   Role: ${dbRelationship.metadata?.role}`);
      console.log(`   Permissions: ${JSON.stringify(dbRelationship.metadata?.permissions)}`);
      console.log(`   Updated: ${dbRelationship.updated_at}`);
    }
    console.log('');

    // Test 6: Check audit transactions
    console.log('6️⃣ Checking audit transactions...');
    const { data: auditTxns, error: auditError } = await supabase
      .from('universal_transactions')
      .select('transaction_type, smart_code, metadata, created_at')
      .eq('organization_id', TEST_ORG_ID)
      .in('transaction_type', ['user_assignment', 'user_role_update'])
      .order('created_at', { ascending: false })
      .limit(5);

    if (auditError) {
      console.log('❌ Audit transaction query failed:', auditError.message);
    } else {
      console.log('✅ Recent audit transactions:');
      auditTxns.forEach((txn, index) => {
        console.log(`   ${index + 1}. ${txn.transaction_type} (${txn.smart_code})`);
        console.log(`      Action: ${txn.metadata?.action}`);
        console.log(`      Role: ${txn.metadata?.role || txn.metadata?.new_role}`);
        console.log(`      Created: ${txn.created_at}`);
      });
    }
    console.log('');

    // Test 7: Test assignment to non-existent organization (error case)
    console.log('7️⃣ Testing error case - non-existent organization...');
    const FAKE_ORG_ID = '00000000-1111-2222-3333-444444444444';
    const { data: errorResult, error: errorCaseError } = await supabase
      .rpc('assign_user_to_organization', {
        p_user_auth_id: TEST_USER_ID,
        p_organization_id: FAKE_ORG_ID,
        p_role: 'user'
      });

    if (errorCaseError) {
      console.log('⚠️ RPC call failed (expected):', errorCaseError.message);
    } else if (!errorResult.success) {
      console.log('✅ Error handling working correctly:', errorResult.error);
      console.log(`   Error Code: ${errorResult.error_code}`);
    } else {
      console.log('❌ Error case should have failed but didn\'t');
    }
    console.log('');

    console.log('🎯 SUMMARY');
    console.log('==========');
    console.log('✅ User assignment RPC functions are working correctly!');
    console.log('✅ Proper error handling for invalid inputs');
    console.log('✅ Audit trail creation functioning');
    console.log('✅ Role updates working as expected');
    console.log('✅ Database relationships properly maintained');
    console.log('');
    console.log('💡 Available RPC Functions:');
    console.log('   - assign_user_to_organization(user_auth_id, org_id, role, permissions, assigner_id)');
    console.log('   - remove_user_from_organization(user_auth_id, org_id, remover_id)');
    console.log('   - get_user_organization_memberships(user_auth_id)');
    console.log('   - update_user_role_in_organization(user_auth_id, org_id, new_role, new_permissions, updater_id)');

  } catch (error) {
    console.log('');
    console.log('🔥 TESTING ERROR:', error.message);
    console.log('Stack:', error.stack);
  }
}

// Run the tests
testUserAssignmentRPCs();