#!/usr/bin/env node
/**
 * Check Smart Code Constraints in Database
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

async function checkConstraints() {
  console.log('🔍 Checking Smart Code Constraints');
  console.log('');
  
  // Check universal_transactions constraints
  const { data: constraints, error } = await supabase
    .from('information_schema.check_constraints')
    .select('constraint_name, check_clause')
    .ilike('constraint_name', '%smart_code%');
    
  if (error) {
    console.log('❌ Error querying constraints:', error.message);
    return;
  }
  
  console.log('📋 Smart Code Constraints Found:');
  constraints.forEach(constraint => {
    console.log(`- ${constraint.constraint_name}: ${constraint.check_clause}`);
  });
  
  console.log('');
  
  // Test the problematic smart code
  const testCode = 'HERA.ACCOUNTING.AUDIT.OPERATION.v2';
  console.log(`🧪 Testing smart code: ${testCode}`);
  
  const { data: isValid, error: validationError } = await supabase.rpc('validate_finance_dna_smart_code', {
    p_smart_code: testCode
  });
  
  if (validationError) {
    console.log(`❌ Validation error: ${validationError.message}`);
  } else {
    console.log(`✅ Validation result: ${isValid}`);
  }
}

async function main() {
  await checkConstraints();
}

main().catch(console.error);