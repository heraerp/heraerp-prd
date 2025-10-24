#!/usr/bin/env node
/**
 * Test login credentials directly with Supabase
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const testUsers = [
  { email: 'Hairtalkz2022@gmail.com', password: 'Hairtalkz2025!', role: 'owner' },
  { email: 'hairtalkz01@gmail.com', password: 'Hairtalkz', role: 'receptionist' },
  { email: 'hairtalkz02@gmail.com', password: 'Hairtalkz', role: 'receptionist' }
];

async function testCredentials() {
  console.log('🔐 Testing login credentials...\n');
  console.log(`📍 Supabase URL: ${supabaseUrl}`);
  console.log(`🔑 Using anon key: ${supabaseAnonKey?.substring(0, 20)}...\n`);

  for (const user of testUsers) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`Testing: ${user.email} (${user.role})`);
    console.log(`Password: ${user.password}`);
    console.log('='.repeat(70));

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      });

      if (error) {
        console.log('❌ LOGIN FAILED');
        console.log(`   Error: ${error.message}`);
        console.log(`   Status: ${error.status}`);
        console.log(`   Code: ${error.code || 'N/A'}`);

        // Try to get more details about the user
        console.log('\n🔍 Checking if user exists in Supabase Auth...');
        // We can't directly check without service role, but we can try different passwords

      } else {
        console.log('✅ LOGIN SUCCESSFUL!');
        console.log(`   User ID: ${data.user.id}`);
        console.log(`   Email: ${data.user.email}`);
        console.log(`   Session: ${data.session ? 'Valid' : 'None'}`);

        // Sign out to clean up
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.log('❌ EXCEPTION:', err.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70) + '\n');

  console.log('💡 If login fails with "Invalid login credentials":');
  console.log('   1. Password might be incorrect');
  console.log('   2. User might not exist in auth.users');
  console.log('   3. Email confirmation might be required');
  console.log('   4. User might be disabled\n');

  console.log('🔧 To fix:');
  console.log('   1. Check Supabase Dashboard → Authentication → Users');
  console.log('   2. Verify user exists with correct email');
  console.log('   3. Check if email is confirmed');
  console.log('   4. Try resetting password in Supabase dashboard\n');
}

testCredentials().catch(console.error);
