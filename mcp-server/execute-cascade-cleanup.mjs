#!/usr/bin/env node
/**
 * Execute comprehensive cascade cleanup via Supabase
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

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

console.log('🧹 Executing Finance DNA v2 Comprehensive Cascade Cleanup');
console.log('========================================================');

// Read the comprehensive cleanup SQL file
const sqlPath = join(__dirname, '../database/functions/finance-dna-v2/93-comprehensive-cascade-cleanup.sql');
const sqlContent = readFileSync(sqlPath, 'utf8');

console.log('📖 Read cleanup SQL file:', sqlPath);
console.log('📝 SQL Content Length:', sqlContent.length, 'characters');
console.log('');

async function executeCascadeCleanup() {
  try {
    console.log('🚀 Executing comprehensive cascade cleanup...');
    
    const { data, error } = await supabase.rpc('exec', {
      query: sqlContent
    });
    
    if (error) {
      console.error('❌ Error executing cleanup:', error.message);
      return false;
    }
    
    console.log('✅ Cleanup executed successfully');
    console.log('📊 Result:', data);
    return true;
    
  } catch (err) {
    console.error('🔥 Fatal error:', err.message);
    return false;
  }
}

async function main() {
  const success = await executeCascadeCleanup();
  
  if (success) {
    console.log('');
    console.log('🎉 COMPREHENSIVE CASCADE CLEANUP COMPLETED');
    console.log('✅ Finance DNA v2 should now be ready for testing');
    console.log('');
    console.log('Next: Run the final test again:');
    console.log('node finance-dna-v2-final-test.mjs');
    process.exit(0);
  } else {
    console.log('');
    console.log('❌ CLEANUP FAILED');
    console.log('Manual intervention required');
    process.exit(1);
  }
}

main().catch(err => {
  console.error('🔥 Fatal error:', err.message);
  process.exit(1);
});