#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

async function findWorkingUser() {
  // List all auth users
  const { data: authUsers } = await supabase.auth.admin.listUsers();
  
  console.log('📋 All Auth Users:');
  authUsers.users.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} (${u.id})`);
    console.log(`   Created: ${u.created_at}`);
    console.log(`   Confirmed: ${u.email_confirmed_at ? 'YES' : 'NO'}`);
  });
}

findWorkingUser().catch(console.error);
