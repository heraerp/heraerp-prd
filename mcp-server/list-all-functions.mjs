#!/usr/bin/env node
/**
 * List all available RPC functions in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function listAllFunctions() {
  console.log('🔍 Discovering all available RPC functions...\n');

  // Test various function name patterns to trigger helpful error hints
  const testPatterns = [
    'user',
    'resolve',
    'validate',
    'check',
    'get_user',
    'find_user',
    'auth',
    'membership',
    'hera'
  ];

  const discoveredFunctions = new Set();

  for (const pattern of testPatterns) {
    try {
      const { error } = await supabase.rpc(pattern + '_nonexistent_xyz', {});

      if (error && error.hint) {
        // Extract function name from hint
        const match = error.hint.match(/public\.(\w+)/);
        if (match) {
          discoveredFunctions.add(match[1]);
        }
      }
    } catch (err) {
      // Ignore exceptions
    }
  }

  console.log('✅ Discovered functions via error hints:\n');
  const sortedFunctions = Array.from(discoveredFunctions).sort();
  sortedFunctions.forEach(func => {
    console.log(`   - ${func}`);
  });

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Filtering for user/auth/membership related functions:\n');

  const relevantFunctions = sortedFunctions.filter(func =>
    func.includes('user') ||
    func.includes('auth') ||
    func.includes('member') ||
    func.includes('resolve') ||
    func.includes('validate') ||
    func.includes('hera')
  );

  if (relevantFunctions.length > 0) {
    relevantFunctions.forEach(func => {
      console.log(`   ✅ ${func}`);
    });
  } else {
    console.log('   ⚠️  No obvious user/auth functions found');
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('Testing hera_* functions:\n');

  const heraFunctions = sortedFunctions.filter(f => f.startsWith('hera_'));

  for (const func of heraFunctions) {
    console.log(`\n📋 ${func}:`);

    // Try to discover signature
    const { error } = await supabase.rpc(func, {});

    if (error) {
      console.log(`   Signature hint: ${error.message}`);
      if (error.hint) {
        console.log(`   Hint: ${error.hint}`);
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════\n');
}

listAllFunctions().catch(console.error);
