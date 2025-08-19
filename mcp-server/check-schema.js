#!/usr/bin/env node
/**
 * Check actual database schema
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('\n📊 Checking HERA Database Schema...\n');

  // Query to get table columns from information schema
  const { data, error } = await supabase
    .rpc('get_table_columns', {
      schema_name: 'public'
    })
    .select();

  if (error) {
    // If RPC doesn't exist, try a different approach
    console.log('Trying alternative method...\n');
    
    // Test by inserting minimal data
    await testTables();
    return;
  }

  if (data) {
    const tables = {};
    data.forEach(row => {
      if (!tables[row.table_name]) {
        tables[row.table_name] = [];
      }
      tables[row.table_name].push(row.column_name);
    });

    Object.entries(tables).forEach(([table, columns]) => {
      if (table.startsWith('core_') || table.startsWith('universal_')) {
        console.log(`\n${table}:`);
        columns.forEach(col => console.log(`  - ${col}`));
      }
    });
  }
}

async function testTables() {
  // Test each table by querying with limit 0
  const tables = [
    'core_organizations',
    'core_entities',
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];

  for (const table of tables) {
    console.log(`\n${table}:`);
    
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(0);
      
      if (!error && data !== null) {
        // Get column names from empty result
        console.log('  Table exists and is accessible');
        
        // Try to get one record to see structure
        const { data: sample } = await supabase
          .from(table)
          .select('*')
          .limit(1)
          .single();
          
        if (sample) {
          console.log('  Columns:');
          Object.keys(sample).forEach(key => {
            console.log(`    - ${key}: ${typeof sample[key]}`);
          });
        }
      } else if (error) {
        console.log(`  Error: ${error.message}`);
      }
    } catch (e) {
      console.log(`  Error: ${e.message}`);
    }
  }
}

main().catch(console.error);