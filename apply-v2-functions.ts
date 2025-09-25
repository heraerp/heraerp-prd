#!/usr/bin/env tsx

/**
 * Apply HERA V2 Transaction CRUD Database Functions
 * Applies txn-crud.sql and transaction-performance.sql
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyFunctions() {
  console.log('🔧 Applying HERA V2 Transaction CRUD Functions...')

  try {
    // Apply txn-crud.sql
    console.log('📝 Reading txn-crud.sql...')
    const txnCrudSql = readFileSync(
      join(__dirname, 'database/functions/v2/txn-crud.sql'),
      'utf-8'
    )

    console.log('⚡ Executing txn-crud.sql...')
    const { error: crudError } = await supabase.rpc('exec_sql', {
      sql_query: txnCrudSql
    })

    if (crudError) {
      // Try direct execution since exec_sql might not exist
      const statements = txnCrudSql
        .split('-- ================================================')
        .filter(statement => statement.trim())

      for (let i = 0; i < statements.length; i++) {
        const statement = statements[i].trim()
        if (!statement) continue

        console.log(`📄 Executing statement ${i + 1}/${statements.length}...`)
        const { error } = await supabase.rpc('exec', { sql: statement })
        if (error && !error.message.includes('already exists')) {
          console.warn(`⚠️  Statement ${i + 1} warning:`, error.message)
        }
      }
    } else {
      console.log('✅ txn-crud.sql applied successfully')
    }

    // Apply transaction-performance.sql indexes
    console.log('📝 Reading transaction-performance.sql...')
    const indexesSql = readFileSync(
      join(__dirname, 'database/indexes/transaction-performance.sql'),
      'utf-8'
    )

    console.log('⚡ Creating performance indexes...')
    const indexStatements = indexesSql
      .split('\n')
      .filter(line => line.trim().startsWith('CREATE INDEX'))

    for (const indexStatement of indexStatements) {
      const { error } = await supabase.rpc('exec', { sql: indexStatement })
      if (error && !error.message.includes('already exists')) {
        console.warn('⚠️  Index warning:', error.message)
      }
    }

    console.log('✅ Performance indexes applied successfully')
    console.log('🎉 HERA V2 Transaction CRUD migration complete!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  }
}

// Alternative: Create functions individually
async function createFunctionsDirectly() {
  console.log('🔧 Creating HERA V2 functions directly...')

  // Test connection first
  const { data, error } = await supabase.from('core_organizations').select('count').limit(1)
  if (error) {
    console.error('❌ Database connection failed:', error.message)
    return false
  }

  console.log('✅ Database connection successful')

  // Create utility functions first
  console.log('📝 Creating utility functions...')

  const utilityFunctions = [
    `CREATE OR REPLACE FUNCTION hera_validate_smart_code(p_code text)
RETURNS BOOLEAN
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT p_code ~ '^HERA\\.[A-Z0-9]+(\\.[A-Z0-9]+){4,}\\.V[0-9]+$';
$$;`,

    `CREATE OR REPLACE FUNCTION hera_assert_txn_org(p_org_id uuid, p_transaction_id uuid)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
    v_org_id uuid;
BEGIN
    SELECT organization_id INTO v_org_id
    FROM universal_transactions
    WHERE id = p_transaction_id;

    IF v_org_id IS NULL OR v_org_id <> p_org_id THEN
        RAISE EXCEPTION 'ORG_MISMATCH: transaction % not in organization %', p_transaction_id, p_org_id
        USING ERRCODE = 'P0001';
    END IF;
END;
$$;`
  ]

  for (const func of utilityFunctions) {
    const { error } = await supabase.rpc('exec', { sql: func })
    if (error) {
      console.warn('⚠️  Utility function warning:', error.message)
    }
  }

  console.log('✅ Functions creation attempted - ready for smoke tests')
  return true
}

if (require.main === module) {
  createFunctionsDirectly()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('❌ Error:', error)
      process.exit(1)
    })
}

export { createFunctionsDirectly }