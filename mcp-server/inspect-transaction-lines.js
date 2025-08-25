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

async function inspectSchema() {
  try {
    // Look for transaction lines for existing transactions
    const transactionIds = [
      '375725ba-88e2-453a-9915-93f7ceaed652', // journal entry
      '69c68697-b295-4f3e-bfcd-2d7fcf0c9a84'  // sales invoice
    ];
    
    console.log('Checking for transaction lines for known transactions...\n');
    
    const { data: lines, error } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .in('transaction_id', transactionIds);
    
    if (error) {
      console.log('Error:', error.message);
    }
    
    if (lines && lines.length > 0) {
      console.log('Found transaction lines:');
      console.log('Columns:', Object.keys(lines[0]));
      console.log('\nSample line:');
      console.log(JSON.stringify(lines[0], null, 2));
    } else {
      console.log('No transaction lines found for these transactions');
      
      // Try to create a minimal transaction line to see required fields
      console.log('\nAttempting to create a transaction line to discover schema...');
      
      const { error: insertError } = await supabase
        .from('universal_transaction_lines')
        .insert({
          transaction_id: transactionIds[0],
          organization_id: '3df8cc52-3d81-42d5-b088-7736ae26cc7c',
          line_number: 1,
          line_type: 'debit',
          line_amount: 100,
          smart_code: 'HERA.TEST.LINE.v1',
          entity_id: transactionIds[0]
        })
        .select();
      
      if (insertError) {
        console.log('\nInsert error (this reveals required fields):');
        console.log(insertError.message);
        
        // Parse error to find required fields
        const missingFieldMatch = insertError.message.match(/null value in column "(\w+)"/);
        if (missingFieldMatch) {
          console.log('\nRequired field found:', missingFieldMatch[1]);
        }
      }
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

inspectSchema();