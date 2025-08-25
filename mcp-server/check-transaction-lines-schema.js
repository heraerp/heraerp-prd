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

async function checkSchema() {
  try {
    // Try to insert a dummy record to see the error message with column names
    const { data, error } = await supabase
      .from('universal_transaction_lines')
      .insert({
        dummy: 'test'
      });
    
    if (error) {
      console.log('Error message (this helps us see required columns):');
      console.log(error.message);
      console.log('\nError details:', error.details);
    }
    
    // Try to select to see what columns we get
    const { data: sample, error: selectError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .limit(1);
    
    if (sample && sample.length > 0) {
      console.log('\nSample record columns:');
      console.log(Object.keys(sample[0]));
    }
    
    // Also check a working example from transactions
    const { data: txnLines } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .limit(5);
    
    if (txnLines && txnLines.length > 0) {
      console.log('\nExample transaction line:');
      console.log(JSON.stringify(txnLines[0], null, 2));
    } else {
      console.log('\nNo transaction lines found in database');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

checkSchema();