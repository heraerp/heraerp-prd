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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
});

async function cleanupViolations() {
  console.log('🧹 Starting HERA database cleanup...\n');
  
  const violations = [
    // Views first (they might depend on tables)
    { type: 'VIEW', name: 'entities' },
    { type: 'VIEW', name: 'entity_fields' },
    { type: 'VIEW', name: 'v_clients' },
    { type: 'VIEW', name: 'v_gl_accounts' },
    
    // Then tables
    { type: 'TABLE', name: 'entities' },
    { type: 'TABLE', name: 'entity_fields' },
    { type: 'TABLE', name: 'core_memberships' },
    { type: 'TABLE', name: 'core_clients' },
    { type: 'TABLE', name: 'gl_chart_of_accounts' }
  ];
  
  let successCount = 0;
  let errorCount = 0;
  
  for (const violation of violations) {
    const dropSql = `DROP ${violation.type} IF EXISTS ${violation.name} CASCADE`;
    console.log(`⏳ Executing: ${dropSql}`);
    
    try {
      // Since RPC might not be available, we'll use a workaround
      // Try to create a function that executes our SQL
      const functionName = `temp_cleanup_${Date.now()}`;
      const createFunctionSql = `
        CREATE OR REPLACE FUNCTION ${functionName}()
        RETURNS void AS $$
        BEGIN
          ${dropSql};
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
      `;
      
      // This won't work directly, but let's check if the table/view exists first
      const { error: checkError } = await supabase
        .from(violation.name)
        .select('*', { count: 'exact', head: true });
      
      if (!checkError) {
        console.log(`  ⚠️  ${violation.type} '${violation.name}' exists but cannot be dropped via API`);
        errorCount++;
      } else if (checkError.code === '42P01') {
        console.log(`  ✅ ${violation.type} '${violation.name}' does not exist`);
        successCount++;
      } else {
        console.log(`  ℹ️  ${violation.type} '${violation.name}' - ${checkError.message}`);
      }
    } catch (e) {
      console.log(`  ❌ Error: ${e.message}`);
      errorCount++;
    }
  }
  
  console.log('\n📊 Summary:');
  console.log(`  ✅ Verified absent: ${successCount}`);
  console.log(`  ❌ Still exist: ${errorCount}`);
  
  if (errorCount > 0) {
    console.log('\n⚠️  Some violations still exist. To remove them, run this SQL directly in Supabase:');
    console.log('\n-- Copy and paste this SQL into Supabase SQL Editor:');
    console.log('-- https://app.supabase.com/project/awfcrncxngqwbhqapffb/editor/sql\n');
    
    violations.forEach(v => {
      console.log(`DROP ${v.type} IF EXISTS ${v.name} CASCADE;`);
    });
    
    console.log('\n-- Then verify only sacred tables remain:');
    console.log(`SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;`);
  }
}

cleanupViolations();