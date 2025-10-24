#!/usr/bin/env node

/**
 * List all transaction-related RPC functions in Supabase
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function listTransactionRpcs() {
  console.log('Listing all transaction-related RPCs in database...\n');

  try {
    // Query pg_catalog to find functions with 'transaction' in the name
    const { data, error } = await supabase.rpc('exec_sql', {
      query: `
        SELECT
          p.proname as function_name,
          pg_catalog.pg_get_function_arguments(p.oid) as arguments,
          pg_catalog.pg_get_function_result(p.oid) as return_type,
          d.description
        FROM pg_catalog.pg_proc p
        LEFT JOIN pg_catalog.pg_namespace n ON n.oid = p.pronamespace
        LEFT JOIN pg_catalog.pg_description d ON d.objoid = p.oid
        WHERE n.nspname = 'public'
          AND p.proname LIKE '%transaction%'
        ORDER BY p.proname;
      `
    });

    if (error) {
      console.log('❌ exec_sql not available, trying alternative method...\n');

      // Try known transaction function names
      const knownFunctions = [
        'hera_transactions_crud_v1',
        'hera_transaction_crud_v1',
        'hera_create_transaction',
        'hera_get_transactions',
        'hera_update_transaction',
        'get_transactions',
        'create_transaction'
      ];

      console.log('Testing known transaction function names:\n');

      for (const funcName of knownFunctions) {
        try {
          const { error: testError } = await supabase.rpc(funcName, {});

          if (testError) {
            if (testError.code === 'PGRST202') {
              console.log(`❌ ${funcName} - NOT FOUND`);
            } else {
              console.log(`✅ ${funcName} - EXISTS (error: ${testError.message.substring(0, 80)}...)`);
            }
          }
        } catch (err) {
          console.log(`⚠️  ${funcName} - Exception: ${err.message.substring(0, 60)}`);
        }
      }
    } else {
      console.log('✅ Found transaction RPCs:\n');
      if (data && data.length > 0) {
        data.forEach(func => {
          console.log(`Function: ${func.function_name}`);
          console.log(`Arguments: ${func.arguments}`);
          console.log(`Returns: ${func.return_type}`);
          if (func.description) {
            console.log(`Description: ${func.description}`);
          }
          console.log('---\n');
        });
      } else {
        console.log('No transaction-related RPCs found.');
      }
    }
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

listTransactionRpcs().catch(console.error);
