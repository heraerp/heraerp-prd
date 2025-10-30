#!/usr/bin/env node
/**
 * Test hera_auth_introspect_v1 with Hairtalkz users
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const TEST_USERS = [
  { email: 'hairtalkz2022@gmail.com', id: '001a2eb9-b14c-4dda-ae8c-595fb377a982', role: 'Owner' },
  { email: 'hairtalkz01@gmail.com', id: '4e1340cf-fefc-4d21-92ee-a8c4a244364b', role: 'Receptionist 1' },
  { email: 'hairtalkz02@gmail.com', id: '4afcbd3c-2641-4d5a-94ea-438a0bb9b99d', role: 'Receptionist 2' }
];

console.log('🔍 TESTING hera_auth_introspect_v1\n');
console.log('=' .repeat(70));

for (const user of TEST_USERS) {
  console.log(`\n👤 Testing: ${user.email} (${user.role})`);
  console.log(`   User ID: ${user.id}\n`);

  try {
    const { data, error } = await supabase.rpc('hera_auth_introspect_v1', {
      p_actor_user_id: user.id
    });

    if (error) {
      console.error(`   ❌ ERROR:`, error.message);
      if (error.details) console.error(`   Details:`, error.details);
      if (error.hint) console.error(`   Hint:`, error.hint);
      if (error.code) console.error(`   Code:`, error.code);
    } else {
      console.log(`   ✅ SUCCESS\n`);
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(`   ❌ EXCEPTION:`, err.message);
  }

  console.log('\n' + '─'.repeat(70));
}

console.log('\n✨ Test complete\n');
