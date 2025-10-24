#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkRPCFunction() {
  try {
    console.log('🔍 Checking for RPC function: hera_entities_crud_v2\n');

    // Query pg_proc to find the function
    const { data: functions, error } = await supabase.rpc('hera_query_sql_v1', {
      p_sql: `
        SELECT
          p.proname as function_name,
          pg_get_function_arguments(p.oid) as arguments,
          pg_get_function_result(p.oid) as return_type,
          d.description,
          p.prosrc as source_code
        FROM pg_proc p
        LEFT JOIN pg_description d ON p.oid = d.objoid
        WHERE p.proname LIKE '%hera_entities_crud%'
        ORDER BY p.proname;
      `
    });

    if (error) {
      console.error('❌ Error querying functions:', error);

      // Try alternative query method
      console.log('\n🔄 Trying alternative query method...\n');

      const { data: altData, error: altError } = await supabase
        .from('pg_proc')
        .select('*')
        .like('proname', '%hera_entities_crud%');

      if (altError) {
        console.error('❌ Alternative method also failed:', altError);
        return;
      }

      console.log('✅ Found functions:', JSON.stringify(altData, null, 2));
      return;
    }

    if (!functions || functions.length === 0) {
      console.log('⚠️  No RPC functions found matching "hera_entities_crud"');
      console.log('\n💡 Searching for all hera_ RPC functions...\n');

      const { data: allFunctions, error: allError } = await supabase.rpc('hera_query_sql_v1', {
        p_sql: `
          SELECT proname as function_name
          FROM pg_proc
          WHERE proname LIKE 'hera_%'
          ORDER BY proname;
        `
      });

      if (!allError && allFunctions) {
        console.log('📋 Available HERA RPC functions:');
        allFunctions.forEach(f => console.log(`   - ${f.function_name}`));
      }
      return;
    }

    console.log('✅ Found RPC Functions:\n');
    functions.forEach((fn, idx) => {
      console.log(`${idx + 1}. Function: ${fn.function_name}`);
      console.log(`   Arguments: ${fn.arguments || 'None'}`);
      console.log(`   Returns: ${fn.return_type}`);
      if (fn.description) {
        console.log(`   Description: ${fn.description}`);
      }
      if (fn.source_code) {
        console.log(`   Source Code Preview:`);
        console.log(`   ${fn.source_code.substring(0, 500)}...`);
      }
      console.log('');
    });

  } catch (err) {
    console.error('❌ Unexpected error:', err);
  }
}

checkRPCFunction();
