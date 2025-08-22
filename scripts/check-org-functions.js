#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing required environment variables');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkFunctions() {
  console.log('🔍 Checking for organization functions in database...\n');

  const functionsToCheck = [
    'create_organization_with_owner',
    'check_subdomain_availability',
    'get_user_organizations',
    'get_organization_by_subdomain'
  ];

  for (const funcName of functionsToCheck) {
    try {
      // Try to get function info using a dummy call
      const { data, error } = await supabase.rpc(funcName, {});
      
      if (error && error.code === 'PGRST202') {
        console.log(`❌ ${funcName} - NOT FOUND`);
      } else if (error) {
        console.log(`⚠️  ${funcName} - EXISTS (error: ${error.message})`);
      } else {
        console.log(`✅ ${funcName} - EXISTS`);
      }
    } catch (err) {
      console.log(`❌ ${funcName} - NOT FOUND`);
    }
  }

  console.log('\n📋 To deploy missing functions:');
  console.log('1. Go to Supabase Dashboard → SQL Editor');
  console.log('2. Copy and paste the SQL from: database/migrations/002_organization_functions.sql');
  console.log('3. Click "Run"');
}

checkFunctions();