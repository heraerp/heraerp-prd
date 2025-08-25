#!/usr/bin/env node

const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Load environment variables
config({ path: path.join(__dirname, '.env') });

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testColumns() {
  try {
    // Try common column names
    const columnsToTest = [
      'gl_account_entity_id',
      'account_entity_id',
      'line_currency_code',
      'base_currency_code',
      'exchange_rate',
      'cost_center_entity_id',
      'project_entity_id',
      'line_status'
    ];
    
    for (const column of columnsToTest) {
      const { data, error } = await supabase
        .from('universal_transaction_lines')
        .select(column)
        .limit(1);
      
      if (!error) {
        console.log(`✅ Column '${column}' exists`);
      } else if (error.message.includes('column')) {
        console.log(`❌ Column '${column}' does not exist`);
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testColumns();