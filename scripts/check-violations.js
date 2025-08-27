#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkViolations() {
  console.log('🔍 Checking for tables/views that violate HERA sacred architecture...\n');
  
  // Sacred tables
  const SACRED_TABLES = [
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];
  
  // Valid HERA views
  const VALID_VIEWS = [
    'entity_with_dynamic_data',
    'transaction_with_lines',
    'v_memberships'
  ];
  
  try {
    // Check tables using raw SQL query
    const { data: tableData, error: tableError } = await supabase.rpc('get_public_tables', {});
    
    if (tableError) {
      console.log('⚠️  RPC not available, using alternative method...');
      
      // Alternative: Try to query each suspicious table
      const suspiciousTables = ['entities', 'entity_fields', 'core_memberships', 'core_clients', 'gl_chart_of_accounts'];
      
      for (const tableName of suspiciousTables) {
        try {
          const { count, error } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });
            
          if (!error) {
            console.log(`❌ VIOLATION: Table '${tableName}' exists (${count || 0} rows)`);
          }
        } catch (e) {
          // Table doesn't exist, which is good
        }
      }
    } else if (tableData) {
      console.log('📊 Tables in public schema:');
      tableData.forEach(table => {
        const isSacred = SACRED_TABLES.includes(table.table_name);
        console.log(`  ${isSacred ? '✅' : '❌'} ${table.table_name}`);
      });
    }
    
    // Try to check views
    console.log('\n📊 Checking views...');
    const suspiciousViews = ['entities', 'entity_fields', 'v_clients', 'v_gl_accounts'];
    
    for (const viewName of suspiciousViews) {
      try {
        const { error } = await supabase
          .from(viewName)
          .select('*')
          .limit(1);
          
        if (!error) {
          console.log(`❌ VIOLATION: View '${viewName}' exists`);
        }
      } catch (e) {
        // View doesn't exist, which is good
      }
    }
    
    console.log('\n✨ Check complete!');
    console.log('\nTo clean up violations, run:');
    console.log('  node scripts/cleanup-violations.js');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkViolations();