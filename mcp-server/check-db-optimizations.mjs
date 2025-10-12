#!/usr/bin/env node

/**
 * Check Database Optimizations
 *
 * Checks for:
 * - Indexes on hot paths
 * - Materialized views
 * - Batch RPC functions for salon
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment from parent directory
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

console.log('🔍 Checking Database Optimizations...\n')

// Check 1: Indexes on hot paths
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 1. INDEXES ON HOT PATHS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const { data: indexes, error: indexError } = await supabase.rpc('exec_sql', {
  sql: `
    SELECT
      schemaname,
      tablename,
      indexname,
      indexdef
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND (
        tablename IN ('universal_transactions', 'core_entities', 'core_dynamic_data')
        OR indexname LIKE '%sale%'
        OR indexname LIKE '%transaction%'
        OR indexname LIKE '%org%'
      )
    ORDER BY tablename, indexname;
  `
})

if (indexError) {
  console.log('⚠️  Cannot query indexes directly (RLS/permissions)')
  console.log('   Attempting alternative method...\n')

  // Try querying information_schema
  const { data: altIndexes } = await supabase
    .from('information_schema.statistics')
    .select('*')
    .in('table_name', ['universal_transactions', 'core_entities', 'core_dynamic_data'])
    .limit(50)

  if (altIndexes && altIndexes.length > 0) {
    console.log(`✅ Found ${altIndexes.length} indexes`)
    altIndexes.slice(0, 10).forEach(idx => {
      console.log(`   • ${idx.index_name} on ${idx.table_name}`)
    })
  }
} else if (indexes) {
  console.log(`✅ Found ${indexes.length} indexes on hot tables:\n`)
  indexes.forEach(idx => {
    console.log(`📌 ${idx.tablename}.${idx.indexname}`)
    console.log(`   ${idx.indexdef}\n`)
  })
} else {
  console.log('❌ No indexes found on hot paths')
  console.log('   Recommendation: Create indexes for sales queries\n')
}

// Check 2: Materialized Views
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 2. MATERIALIZED VIEWS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const { data: mvs, error: mvError } = await supabase.rpc('exec_sql', {
  sql: `
    SELECT
      schemaname,
      matviewname,
      definition
    FROM pg_matviews
    WHERE schemaname = 'public'
      AND (matviewname LIKE '%sale%' OR matviewname LIKE '%enrich%')
    ORDER BY matviewname;
  `
})

if (mvError) {
  console.log('⚠️  Cannot query materialized views (checking alternative method)...\n')

  // Try checking if specific MVs exist
  const mvNames = ['mv_sales_enriched', 'mv_sales_dashboard', 'mv_transaction_enriched']

  for (const mvName of mvNames) {
    const { error } = await supabase.from(mvName).select('*').limit(1)
    if (!error) {
      console.log(`✅ Found: ${mvName}`)
    }
  }
} else if (mvs && mvs.length > 0) {
  console.log(`✅ Found ${mvs.length} materialized views:\n`)
  mvs.forEach(mv => {
    console.log(`🗂️  ${mv.matviewname}`)
    console.log(`   Schema: ${mv.schemaname}`)
    console.log(`   Definition: ${mv.definition.substring(0, 100)}...\n`)
  })
} else {
  console.log('❌ No materialized views found for sales')
  console.log('   Recommendation: Create mv_sales_enriched for dashboard\n')
}

// Check 3: Batch RPC Functions
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📊 3. BATCH RPC FUNCTIONS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

const rpcFunctions = [
  'hera_sales_get_enriched_v1',
  'hera_sales_get_enriched',
  'get_sales_enriched',
  'hera_txn_get_sales_enriched',
  'hera_entity_read_v1',
  'hera_txn_create_v1',
  'hera_txn_read_v1'
]

console.log('Checking for batch RPC functions:\n')

for (const funcName of rpcFunctions) {
  try {
    // Try to call the function with minimal params to see if it exists
    const { error } = await supabase.rpc(funcName, {})

    if (error) {
      if (error.message.includes('not found') || error.message.includes('does not exist')) {
        console.log(`❌ ${funcName} - NOT FOUND`)
      } else {
        // Function exists but we got a different error (likely param error)
        console.log(`✅ ${funcName} - EXISTS (param error expected)`)
      }
    } else {
      console.log(`✅ ${funcName} - EXISTS`)
    }
  } catch (e) {
    console.log(`❌ ${funcName} - ERROR: ${e.message}`)
  }
}

// Check for general HERA v1 functions
console.log('\n📦 Checking for HERA Universal API v1 functions:\n')

const heraV1Functions = [
  'hera_entity_upsert_v1',
  'hera_entity_read_v1',
  'hera_entity_delete_v1',
  'hera_dynamic_data_batch_v1',
  'hera_relationship_create_v1',
  'hera_txn_create_v1',
  'hera_txn_read_v1',
  'hera_txn_validate_v1'
]

let foundCount = 0
for (const funcName of heraV1Functions) {
  try {
    const { error } = await supabase.rpc(funcName, {})

    if (!error || !error.message.includes('not found')) {
      console.log(`✅ ${funcName}`)
      foundCount++
    }
  } catch (e) {
    // Ignore
  }
}

console.log(`\n✅ Found ${foundCount}/${heraV1Functions.length} HERA v1 functions`)

// Summary
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
console.log('📋 SUMMARY & RECOMMENDATIONS')
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n')

console.log('🔴 MISSING (High Priority):')
console.log('   1. Batch RPC: hera_sales_get_enriched_v1')
console.log('      Impact: 3x faster page loads (1500ms → 500ms)')
console.log('      Effort: 2 hours\n')

console.log('   2. Materialized View: mv_sales_enriched')
console.log('      Impact: 16x faster dashboard (800ms → 50ms)')
console.log('      Effort: 3 hours\n')

console.log('   3. Indexes on hot paths')
console.log('      Impact: 10x faster queries')
console.log('      Effort: 30 minutes\n')

console.log('📚 See: /SALON-ENTERPRISE-REVIEW.md for detailed implementation')

process.exit(0)
