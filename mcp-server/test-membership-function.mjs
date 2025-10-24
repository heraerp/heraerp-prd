#!/usr/bin/env node
/**
 * Test setup_user_membership function to discover its actual signature
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testMembershipFunction() {
  console.log('🔍 Testing setup_user_membership function...\n');

  // Test with the owner user
  const testUserId = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'; // Owner
  const testOrgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'; // Salon org

  console.log('Test parameters:');
  console.log(`   User ID: ${testUserId}`);
  console.log(`   Org ID: ${testOrgId}\n`);

  // Try different parameter combinations
  console.log('═══════════════════════════════════════════════════════\n');
  console.log('Test 1: p_supabase_user_id, p_organization_id\n');

  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_supabase_user_id: testUserId,
      p_organization_id: testOrgId
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
  console.log('Test 2: Reversed order (p_organization_id, p_supabase_user_id)\n');

  try {
    const { data, error } = await supabase.rpc('setup_user_membership', {
      p_organization_id: testOrgId,
      p_supabase_user_id: testUserId
    });

    if (error) {
      console.log('❌ Error:', error.message);
      console.log('   Code:', error.code);
      console.log('   Details:', error.details);
    } else {
      console.log('✅ Success!');
      console.log('   Result:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.log('❌ Exception:', err.message);
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

testMembershipFunction().catch(console.error);
