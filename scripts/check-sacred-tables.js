#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Sacred tables
const SACRED_TABLES = [
  'core_organizations',
  'core_entities',
  'core_dynamic_data',
  'core_relationships',
  'universal_transactions',
  'universal_transaction_lines'
];

async function checkSacredTables() {
  console.log('🔍 Checking HERA Sacred Tables...\n');
  
  let allGood = true;
  
  // Check each sacred table
  for (const tableName of SACRED_TABLES) {
    try {
      const { count, error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.log(`❌ ${tableName}: Error - ${error.message}`);
        allGood = false;
      } else {
        console.log(`✅ ${tableName}: Exists (${count || 0} rows)`);
      }
    } catch (e) {
      console.log(`❌ ${tableName}: ${e.message}`);
      allGood = false;
    }
  }
  
  console.log('\n📊 Checking for non-sacred tables...');
  
  // List of tables that should NOT exist
  const violatingTables = [
    'entities',
    'entity_fields',
    'core_memberships',
    'core_clients', 
    'gl_chart_of_accounts'
  ];
  
  let violations = 0;
  
  for (const tableName of violatingTables) {
    try {
      const { error } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });
      
      if (!error) {
        console.log(`❌ VIOLATION: Table '${tableName}' still exists`);
        violations++;
      } else if (error.code === '42P01') {
        // Table doesn't exist - this is good!
        console.log(`✅ Table '${tableName}' has been removed`);
      }
    } catch (e) {
      // Error likely means table doesn't exist - good
    }
  }
  
  console.log('\n📋 Summary:');
  console.log(`Sacred Tables: ${allGood ? '✅ All present' : '❌ Some missing'}`);
  console.log(`Violations: ${violations === 0 ? '✅ None found' : `❌ ${violations} tables need removal`}`);
  
  if (violations > 0) {
    console.log('\n⚠️  To complete cleanup, run this SQL in Supabase:');
    console.log('\n-- Remove remaining violations:');
    for (const table of violatingTables) {
      console.log(`DROP TABLE IF EXISTS ${table} CASCADE;`);
    }
  } else {
    console.log('\n✨ Database is clean and follows HERA sacred architecture!');
  }
}

checkSacredTables();