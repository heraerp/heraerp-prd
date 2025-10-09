#!/usr/bin/env node
/**
 * Diagnose Finance DNA v2 Issues
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables manually
const envPath = join(__dirname, '../.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value && !key.startsWith('#')) {
      process.env[key.trim()] = value.trim();
    }
  });
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const organizationId = process.env.DEFAULT_ORGANIZATION_ID;

async function checkTableSchema() {
  console.log('🔍 Checking Table Schemas');
  console.log('');
  
  // Check universal_transaction_lines columns
  console.log('📋 universal_transaction_lines columns:');
  const { data: sample, error } = await supabase
    .from('universal_transaction_lines')
    .select('*')
    .limit(1);
    
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else if (sample && sample.length > 0) {
    console.log('Available columns:', Object.keys(sample[0]).join(', '));
  } else {
    console.log('No data found in table');
  }
  
  console.log('');
}

async function testSmartCodeFormats() {
  console.log('🧪 Testing Smart Code Formats');
  console.log('');
  
  const testCodes = [
    'HERA.ACCOUNTING.AUDIT.OPERATION.v2',
    'HERA.ACCOUNTING.SECURITY.RLS.ENFORCEMENT.v2',
    'HERA.SALON.POS.TXN.SALE.v1', // Existing format
    'HERA.REST.SALE.ORDER.v1'      // Existing format
  ];
  
  for (const code of testCodes) {
    console.log(`Testing: ${code}`);
    
    const { data, error } = await supabase.rpc('validate_finance_dna_smart_code', {
      p_smart_code: code
    });
    
    if (error) {
      console.log(`   ❌ Error: ${error.message}`);
    } else {
      console.log(`   ${data ? '✅' : '❌'} Valid: ${data}`);
    }
  }
  
  console.log('');
}

async function checkExistingSmartCodes() {
  console.log('🔍 Checking Existing Smart Codes in Database');
  console.log('');
  
  const { data: transactions, error } = await supabase
    .from('universal_transactions')
    .select('smart_code')
    .eq('organization_id', organizationId)
    .not('smart_code', 'is', null)
    .limit(10);
    
  if (error) {
    console.log(`❌ Error: ${error.message}`);
  } else {
    console.log('Sample existing smart codes:');
    transactions.forEach((tx, i) => {
      console.log(`${i + 1}. ${tx.smart_code}`);
    });
  }
  
  console.log('');
}

async function testAuditLoggingWithCorrectSmartCode() {
  console.log('🧪 Testing Audit Logging with Existing Smart Code Format');
  console.log('');
  
  // Try with a known working smart code format
  const { data, error } = await supabase.rpc('hera_audit_operation_v2', {
    p_organization_id: organizationId,
    p_operation_type: 'FINANCE_DNA_TEST',
    p_operation_details: {
      test_name: 'Finance DNA v2 Testing'
    },
    p_smart_code: 'HERA.SALON.POS.TXN.AUDIT.v1' // Use existing format
  });
  
  if (error) {
    console.log(`❌ Audit logging still failed: ${error.message}`);
  } else {
    console.log(`✅ Audit logging succeeded with ID: ${data}`);
  }
  
  console.log('');
}

async function checkColumnNaming() {
  console.log('🔍 Checking Column Naming Issues');
  console.log('');
  
  // Check if it's line_entity_id vs entity_id
  const { data: lineColumns, error: lineError } = await supabase
    .from('universal_transaction_lines')
    .select('entity_id, line_entity_id')
    .limit(1);
    
  if (lineError) {
    console.log(`Column check result: ${lineError.message}`);
    
    // Try with different column name
    const { data: altColumns, error: altError } = await supabase
      .from('universal_transaction_lines')
      .select('entity_id')
      .limit(1);
      
    if (altError) {
      console.log(`Alternative check: ${altError.message}`);
    } else {
      console.log('✅ entity_id column exists');
    }
  } else {
    console.log('✅ Both line_entity_id and entity_id columns exist');
  }
  
  console.log('');
}

async function main() {
  console.log('Finance DNA v2 Issue Diagnosis');
  console.log('=============================');
  console.log('');
  
  await checkTableSchema();
  await testSmartCodeFormats();
  await checkExistingSmartCodes();
  await testAuditLoggingWithCorrectSmartCode();
  await checkColumnNaming();
}

main().catch(console.error);