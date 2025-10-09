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

console.log('Checking universal_transactions schema...');
const { data, error } = await supabase
  .from('universal_transactions')
  .select('*')
  .limit(1);

if (error) {
  console.error('Error:', error);
} else {
  console.log('universal_transactions columns:', Object.keys(data[0] || {}));
}

console.log('\nChecking universal_transaction_lines schema...');
const { data: linesData, error: linesError } = await supabase
  .from('universal_transaction_lines')
  .select('*')
  .limit(1);

if (linesError) {
  console.error('Error:', linesError);
} else {
  console.log('universal_transaction_lines columns:', Object.keys(linesData[0] || {}));
}