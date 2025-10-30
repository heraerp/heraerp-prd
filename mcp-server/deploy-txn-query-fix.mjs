#!/usr/bin/env node
/**
 * Deploy hera_txn_query_v1 fix to Supabase
 * Executes SQL to update RPC function with full field projection
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import dotenv from 'dotenv'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') })

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials in .env')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🚀 Deploying hera_txn_query_v1 Full Projection Fix')
console.log('─'.repeat(80))

// Read SQL file
const sqlPath = join(__dirname, '..', 'fix-hera-txn-query-v1-full-projection.sql')
const sql = readFileSync(sqlPath, 'utf8')

console.log('📄 SQL file loaded:', sqlPath)
console.log('📏 SQL length:', sql.length, 'characters')
console.log('')

// Try to execute via RPC if available, otherwise provide instructions
console.log('🔍 Testing current state...')
const { data: beforeData, error: beforeError } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_filters: { transaction_type: 'LEAVE', limit: 1 }
})

if (beforeError) {
  console.error('❌ Cannot test current state:', beforeError)
} else {
  const firstItem = beforeData?.data?.items?.[0]
  if (firstItem) {
    console.log('📊 Current state:')
    console.log('   Fields returned:', Object.keys(firstItem).length)
    console.log('   Has metadata:', 'metadata' in firstItem ? '✅' : '❌')
    console.log('   Has source_entity_id:', 'source_entity_id' in firstItem ? '✅' : '❌')
    console.log('   Has target_entity_id:', 'target_entity_id' in firstItem ? '✅' : '❌')
  }
}

console.log('')
console.log('─'.repeat(80))

// Try direct PostgreSQL execution via pg library
try {
  // Check if pg is available
  const pg = await import('pg').catch(() => null)

  if (pg && process.env.DATABASE_URL) {
    console.log('🔧 Executing SQL via PostgreSQL connection...')

    const { Client } = pg.default
    const client = new Client({ connectionString: process.env.DATABASE_URL })

    await client.connect()
    await client.query(sql)
    await client.end()

    console.log('✅ SQL executed successfully via pg!')

  } else {
    throw new Error('pg library not available or DATABASE_URL not set')
  }

} catch (pgError) {
  console.log('⚠️  Direct PostgreSQL execution not available')
  console.log('   Reason:', pgError.message)
  console.log('')
  console.log('📋 Please deploy manually using one of these methods:')
  console.log('')
  console.log('   METHOD 1: Supabase Dashboard (Recommended)')
  console.log('   1. Open: https://supabase.com/dashboard/project/qqagokigwuujyeyrgdkq/sql')
  console.log('   2. Click "New Query"')
  console.log('   3. Paste SQL from: ./fix-hera-txn-query-v1-full-projection.sql')
  console.log('   4. Click "Run"')
  console.log('')
  console.log('   METHOD 2: psql Command Line')
  console.log('   $ psql $DATABASE_URL < ./fix-hera-txn-query-v1-full-projection.sql')
  console.log('')
  console.log('─'.repeat(80))
  process.exit(0)
}

// Verify deployment
console.log('')
console.log('🔍 Verifying deployment...')

const { data: afterData, error: afterError } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_filters: { transaction_type: 'LEAVE', limit: 1 }
})

if (afterError) {
  console.error('❌ Verification failed:', afterError)
  process.exit(1)
}

const firstItem = afterData?.data?.items?.[0]
if (!firstItem) {
  console.error('❌ No items returned')
  process.exit(1)
}

console.log('📊 After deployment:')
console.log('   Fields returned:', Object.keys(firstItem).length)
console.log('   Has metadata:', 'metadata' in firstItem ? '✅' : '❌')
console.log('   Has source_entity_id:', 'source_entity_id' in firstItem ? '✅' : '❌')
console.log('   Has target_entity_id:', 'target_entity_id' in firstItem ? '✅' : '❌')
console.log('   Has created_at:', 'created_at' in firstItem ? '✅' : '❌')
console.log('   Has updated_at:', 'updated_at' in firstItem ? '✅' : '❌')

const requiredFields = ['metadata', 'source_entity_id', 'target_entity_id', 'created_at', 'updated_at']
const allPresent = requiredFields.every(field => field in firstItem)

console.log('')
console.log('─'.repeat(80))

if (allPresent) {
  console.log('✅ DEPLOYMENT SUCCESSFUL!')
  console.log('')
  console.log('🎯 Next steps:')
  console.log('   1. Refresh the leave management page')
  console.log('   2. Verify staff names display correctly')
  console.log('   3. Verify dates display correctly')
  console.log('   4. Verify leave reasons display')
  console.log('')
  console.log('📋 Sample metadata returned:')
  console.log(JSON.stringify(firstItem.metadata, null, 2))
  process.exit(0)
} else {
  console.log('❌ DEPLOYMENT INCOMPLETE')
  console.log('   Missing fields:', requiredFields.filter(f => !(f in firstItem)))
  process.exit(1)
}
