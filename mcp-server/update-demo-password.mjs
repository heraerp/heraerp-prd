#!/usr/bin/env node
/**
 * Update demo user password
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function updateDemoPassword() {
  console.log('🔐 Updating demo user password...\n');

  const demoEmail = 'demo@heraerp.com';
  const newPassword = 'demo2025!';

  // Get the demo user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const demoUser = users.find(u => u.email === demoEmail);

  if (!demoUser) {
    console.error('❌ Demo user not found');
    return;
  }

  console.log('Found demo user:');
  console.log('  Email:', demoUser.email);
  console.log('  ID:', demoUser.id);

  // Update password using admin API
  const { data, error } = await supabase.auth.admin.updateUserById(
    demoUser.id,
    { password: newPassword }
  );

  if (error) {
    console.error('❌ Failed to update password:', error);
    return;
  }

  console.log('\n✅ Password updated successfully!');
  console.log('📋 New credentials:');
  console.log('   Email: demo@heraerp.com');
  console.log('   Password: demo2025!');
  console.log('\n🔒 Old password (demo123) will no longer work');
}

updateDemoPassword().catch(console.error);
