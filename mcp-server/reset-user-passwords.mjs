#!/usr/bin/env node
/**
 * Reset passwords for salon users using Supabase Admin API
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const users = [
  {
    email: 'Hairtalkz2022@gmail.com',
    password: 'Hairtalkz2025!',
    role: 'owner',
    id: '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'
  },
  {
    email: 'hairtalkz01@gmail.com',
    password: 'Hairtalkz',
    role: 'receptionist',
    id: '4578ce6d-db51-4838-9dc9-faca4cbe30bb'
  },
  {
    email: 'hairtalkz02@gmail.com',
    password: 'Hairtalkz',
    role: 'receptionist',
    id: 'b3fcd455-7df2-42d2-bdd1-c962636cc8a7'
  }
];

async function resetPasswords() {
  console.log('🔐 Resetting user passwords...\n');

  for (const user of users) {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`User: ${user.email} (${user.role})`);
    console.log(`User ID: ${user.id}`);
    console.log(`New Password: ${user.password}`);
    console.log('='.repeat(70));

    try {
      // Update user password using admin API
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password: user.password,
          email_confirm: true  // Ensure email is confirmed
        }
      );

      if (error) {
        console.log('❌ Password reset FAILED');
        console.log(`   Error: ${error.message}`);
      } else {
        console.log('✅ Password reset SUCCESSFUL');
        console.log(`   User: ${data.user.email}`);
        console.log(`   Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`);
      }
    } catch (err) {
      console.log('❌ Exception:', err.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('TESTING NEW PASSWORDS');
  console.log('='.repeat(70) + '\n');

  // Test each password
  const supabaseClient = createClient(supabaseUrl, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  for (const user of users) {
    console.log(`\nTesting login: ${user.email}`);

    const { data, error } = await supabaseClient.auth.signInWithPassword({
      email: user.email,
      password: user.password
    });

    if (error) {
      console.log(`   ❌ Login failed: ${error.message}`);
    } else {
      console.log(`   ✅ Login successful!`);
      await supabaseClient.auth.signOut();
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('CREDENTIALS FOR LOGIN');
  console.log('='.repeat(70) + '\n');

  users.forEach(user => {
    const icon = user.role === 'owner' ? '👑' : '📋';
    console.log(`${icon} ${user.role.toUpperCase()}: ${user.email}`);
    console.log(`   Password: ${user.password}\n`);
  });

  console.log('🔗 Login at: http://localhost:3000/salon-access\n');
}

resetPasswords().catch(console.error);
