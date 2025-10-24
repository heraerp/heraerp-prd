#!/usr/bin/env node
/**
 * Test user-related functions to understand validation logic
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const SALON_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8';
const OWNER_USER_ID = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a';

async function testUserFunctions() {
  console.log('🔍 Testing user validation functions...\n');

  // Test 1: auth_user_entity_id
  console.log('═══════════════════════════════════════════════════════');
  console.log('Function: auth_user_entity_id\n');

  try {
    const { data, error } = await supabase.rpc('auth_user_entity_id', {
      p_auth_user_id: OWNER_USER_ID
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Trying without p_ prefix...\n');

      const { data: data2, error: error2 } = await supabase.rpc('auth_user_entity_id', {
        auth_user_id: OWNER_USER_ID
      });

      if (error2) {
        console.log('❌ Error:', error2.message);
      } else {
        console.log('✅ Success!');
        console.log('   Result:', JSON.stringify(data2, null, 2));
      }
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 2: get_user_organizations
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Function: get_user_organizations\n');

  try {
    const { data, error } = await supabase.rpc('get_user_organizations', {
      p_user_id: OWNER_USER_ID
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Test 3: process_existing_user
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Function: process_existing_user\n');

  try {
    const { data, error } = await supabase.rpc('process_existing_user', {
      p_user_id: OWNER_USER_ID,
      p_organization_id: SALON_ORG_ID
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Details:', error.details);
      console.log('   Hint:', error.hint);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  // Manual query: Check what the HERAAuthProvider might be looking for
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Manual Query: Check user membership validation\n');

  console.log('Query 1: Check MEMBER_OF relationships:\n');
  const { data: memberOfRels, error: memberOfError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', OWNER_USER_ID)
    .eq('to_entity_id', SALON_ORG_ID)
    .eq('relationship_type', 'MEMBER_OF');

  if (memberOfError) {
    console.log('❌ Error:', memberOfError.message);
  } else {
    console.log('✅ Found MEMBER_OF relationships:', memberOfRels.length);
    if (memberOfRels.length > 0) {
      console.log('   First relationship:', JSON.stringify(memberOfRels[0], null, 2));
    }
  }

  console.log('\nQuery 2: Check USER_MEMBER_OF_ORG relationships:\n');
  const { data: userMemberRels, error: userMemberError } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('from_entity_id', OWNER_USER_ID)
    .eq('to_entity_id', SALON_ORG_ID)
    .eq('relationship_type', 'USER_MEMBER_OF_ORG');

  if (userMemberError) {
    console.log('❌ Error:', userMemberError.message);
  } else {
    console.log('✅ Found USER_MEMBER_OF_ORG relationships:', userMemberRels.length);
    if (userMemberRels.length > 0) {
      console.log('   First relationship:', JSON.stringify(userMemberRels[0], null, 2));
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('Summary:\n');
  console.log(`📊 MEMBER_OF relationships: ${memberOfRels?.length || 0}`);
  console.log(`📊 USER_MEMBER_OF_ORG relationships: ${userMemberRels?.length || 0}`);
  console.log('\n💡 The authentication system likely checks one of these relationship types');
  console.log('   to validate user membership in the organization.\n');

  console.log('═══════════════════════════════════════════════════════\n');
}

testUserFunctions().catch(console.error);
