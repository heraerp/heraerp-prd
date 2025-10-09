#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';

const envPath = '../.env';
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
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🔍 Debugging Finance DNA v2 Constraint Issues');
console.log('============================================');

// Test the specific smart codes that are failing
const testCodes = [
  'HERA.ACCOUNTING.AUDIT.OPERATION.v2',
  'HERA.ACCOUNTING.JOURNAL.ENTRY.v2',
  'HERA.ACCOUNTING.TRIAL.BALANCE.v2'
];

console.log('\n📋 Testing Smart Code Validation:');
for (const code of testCodes) {
  try {
    const { data, error } = await supabase.rpc('validate_finance_dna_smart_code', {
      p_smart_code: code
    });
    
    console.log(`  ${code}: ${data ? '✅ VALID' : '❌ INVALID'}`);
    if (error) console.log(`    Error: ${error.message}`);
  } catch (err) {
    console.log(`  ${code}: ❌ ERROR - ${err.message}`);
  }
}

console.log('\n🔍 Checking Current Constraint:');
try {
  const { data: constraints, error } = await supabase
    .from('information_schema.check_constraints')
    .select('constraint_name, check_clause')
    .eq('table_name', 'universal_transactions')
    .like('constraint_name', '%smart_code%');
    
  if (constraints) {
    constraints.forEach(constraint => {
      console.log(`  ${constraint.constraint_name}:`);
      console.log(`    ${constraint.check_clause}`);
    });
  }
} catch (err) {
  console.log(`  Error checking constraints: ${err.message}`);
}

console.log('\n🧪 Testing Direct Insert:');
try {
  // Test a simple insert to see the exact error
  const { data, error } = await supabase
    .from('universal_transactions')
    .insert({
      organization_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
      transaction_type: 'SYSTEM_UPDATE',
      transaction_code: 'TEST-DEBUG',
      smart_code: 'HERA.ACCOUNTING.AUDIT.OPERATION.v2',
      total_amount: 0
    })
    .select();
    
  if (error) {
    console.log(`  ❌ Insert failed: ${error.message}`);
    console.log(`  Error code: ${error.code}`);
  } else {
    console.log(`  ✅ Insert succeeded`);
    // Clean up the test record
    await supabase
      .from('universal_transactions')
      .delete()
      .eq('transaction_code', 'TEST-DEBUG');
  }
} catch (err) {
  console.log(`  ❌ Insert error: ${err.message}`);
}