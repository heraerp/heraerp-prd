#!/usr/bin/env node
/**
 * Debug why demo user logs out but hairtalkz stays logged in
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function debugDifference() {
  console.log('🔍 Debugging: Why does demo log out but hairtalkz stays logged in?\n');

  const users = [
    { 
      email: 'hairtalkz01@gmail.com', 
      authUid: '4e1340cf-fefc-4d21-92ee-a8c4a244364b',
      label: '✅ STAYS LOGGED IN' 
    },
    { 
      email: 'demo@heraerp.com', 
      authUid: 'a55cc033-e909-4c59-b974-8ff3e098f2bf',
      label: '❌ LOGS OUT IMMEDIATELY' 
    }
  ];

  for (const { email, authUid, label } of users) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`${label}: ${email}`);
    console.log('='.repeat(70));

    // Check if USER entity exists with ID = authUid
    const { data: directMatch } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', authUid)
      .eq('entity_type', 'USER')
      .single();

    if (directMatch) {
      console.log('✅ USER entity ID matches auth UID (direct match)');
      console.log('   This means auth UID works directly in all lookups');
    } else {
      console.log('⚠️ USER entity ID does NOT match auth UID');
      console.log('   This means mapping is required via metadata');
      
      // Find the actual USER entity
      const { data: mappedEntity } = await supabase
        .from('core_entities')
        .select('*')
        .eq('entity_type', 'USER')
        .contains('metadata', { supabase_user_id: authUid })
        .single();
      
      if (mappedEntity) {
        console.log('✅ USER entity found via metadata mapping');
        console.log(`   Auth UID: ${authUid}`);
        console.log(`   User Entity ID: ${mappedEntity.id}`);
        console.log(`   ⚠️ MISMATCH - This requires special handling!`);
      }
    }
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log('\n💡 HYPOTHESIS:');
  console.log('The issue is NOT about which ID is stored.');
  console.log('The issue is about SESSION PERSISTENCE after page redirect.');
  console.log('\nLet me check if there are differences in:');
  console.log('1. Session storage/cookies');
  console.log('2. HERAAuthProvider initialization');
  console.log('3. Organization membership validation\n');
}

debugDifference().catch(console.error);
