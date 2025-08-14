#!/usr/bin/env node

/**
 * SCHEMA VERIFICATION TEST
 * Check what tables and columns exist in the current database
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('🚨 Missing Supabase configuration');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 === SCHEMA VERIFICATION TEST ===\n');
  
  // Check each expected table
  const expectedTables = [
    'core_organizations',
    'core_entities', 
    'core_dynamic_data',
    'core_relationships',
    'universal_transactions',
    'universal_transaction_lines'
  ];

  for (const table of expectedTables) {
    try {
      console.log(`📋 Checking table: ${table}`);
      
      // Try to query the table structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);

      if (error) {
        console.log(`❌ ${table}: ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table exists and accessible`);
        if (data && data.length > 0) {
          console.log(`   Sample columns: ${Object.keys(data[0]).join(', ')}`);
        }
      }
    } catch (err) {
      console.log(`❌ ${table}: ${err.message}`);
    }
    console.log('');
  }

  // Test simple organization creation without metadata
  try {
    console.log('🧪 Testing simple organization creation...');
    const { data, error } = await supabase
      .from('core_organizations')
      .insert({
        organization_name: "Test Restaurant",
        organization_code: 'TEST_REST',
        status: 'active'
      })
      .select()
      .single();

    if (error) {
      console.log(`❌ Simple org creation failed: ${error.message}`);
    } else {
      console.log(`✅ Simple org creation succeeded: ${data.organization_id}`);
      
      // Clean up
      await supabase
        .from('core_organizations')
        .delete()
        .eq('organization_id', data.organization_id);
    }
  } catch (err) {
    console.log(`❌ Simple org creation error: ${err.message}`);
  }
}

checkSchema().catch(console.error);