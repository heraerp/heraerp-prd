#!/usr/bin/env node
/**
 * Test what the API actually returns for demo user
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';
import fetch from 'node-fetch';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_ANON_KEY || ''
);

async function testAPIResponse() {
  console.log('🧪 Testing /api/v2/auth/resolve-membership response...\n');

  // 1. Login to get JWT
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'demo@heraerp.com',
    password: 'demo123'
  });

  if (authError) {
    console.error('❌ Login failed:', authError);
    return;
  }

  console.log('✅ Login successful, JWT obtained');

  // 2. Call the API
  const response = await fetch('http://localhost:3000/api/v2/auth/resolve-membership', {
    headers: { 
      Authorization: `Bearer ${authData.session.access_token}` 
    },
  });

  const result = await response.json();

  console.log('\n📋 API Response Structure:');
  console.log(JSON.stringify(result, null, 2));

  console.log('\n🔍 Key Fields:');
  console.log(`   user_id (auth UID): ${result.user_id}`);
  console.log(`   user_entity_id: ${result.user_entity_id}`);
  console.log(`   organization_count: ${result.organization_count}`);
  console.log(`   default_organization_id: ${result.default_organization_id}`);

  if (result.membership) {
    console.log('\n👤 Membership Object:');
    console.log(`   organization_id: ${result.membership.organization_id}`);
    console.log(`   role: ${result.membership.role}`);
    console.log(`   primary_role: ${result.membership.primary_role}`);
    console.log(`   is_owner: ${result.membership.is_owner}`);
  }

  await supabase.auth.signOut();
}

testAPIResponse().catch(console.error);
