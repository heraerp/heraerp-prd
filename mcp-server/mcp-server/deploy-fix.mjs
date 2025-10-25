#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import dotenv from 'dotenv'

// Load from parent directory
dotenv.config({ path: '../.env' })

console.log('🔍 Environment check:')
console.log('  SUPABASE_URL:', process.env.SUPABASE_URL ? '✅' : '❌')
console.log('  SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌')
console.log('')

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

console.log('🚀 Deploying hera_txn_query_v1 Full Projection Fix')
console.log('─'.repeat(80))

const sql = readFileSync('../fix-hera-txn-query-v1-full-projection.sql', 'utf8')

console.log('📄 SQL loaded (' + sql.length + ' characters)')
console.log('')

// Test current state
console.log('🔍 Testing current RPC state...')
const { data: beforeData, error: beforeError } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_filters: { transaction_type: 'LEAVE', limit: 1 }
})

if (beforeError) {
  console.error('❌ Cannot test:', beforeError)
} else {
  const item = beforeData?.data?.items?.[0]
  if (item) {
    console.log('📊 Current state:')
    console.log('   Fields:', Object.keys(item).length)
    console.log('   metadata:', 'metadata' in item ? '✅' : '❌')
    console.log('   source_entity_id:', 'source_entity_id' in item ? '✅' : '❌')
  }
}

console.log('')
console.log('─'.repeat(80))

// Try pg deployment
try {
  const pg = await import('pg')
  
  if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL not set')
  }
  
  console.log('🔧 Executing SQL via PostgreSQL...')
  const { Client } = pg.default
  const client = new Client({ connectionString: process.env.DATABASE_URL })
  
  await client.connect()
  await client.query(sql)
  await client.end()
  
  console.log('✅ SQL executed!')
  
} catch (err) {
  console.log('⚠️  pg deployment failed:', err.message)
  console.log('')
  console.log('📋 Manual deployment required:')
  console.log('   1. Open: https://supabase.com/dashboard/project/qqagokigwuujyeyrgdkq/sql')
  console.log('   2. Paste SQL from: ./fix-hera-txn-query-v1-full-projection.sql')
  console.log('   3. Click "Run"')
  console.log('')
  process.exit(0)
}

// Verify
console.log('')
console.log('🔍 Verifying...')
const { data: afterData, error: afterError } = await supabase.rpc('hera_txn_query_v1', {
  p_org_id: '378f24fb-d496-4ff7-8afa-ea34895a0eb8',
  p_filters: { transaction_type: 'LEAVE', limit: 1 }
})

if (afterError) {
  console.error('❌ Verification failed:', afterError)
  process.exit(1)
}

const item = afterData?.data?.items?.[0]
console.log('📊 After deployment:')
console.log('   Fields:', Object.keys(item || {}).length)
console.log('   metadata:', 'metadata' in (item || {}) ? '✅' : '❌')
console.log('   source_entity_id:', 'source_entity_id' in (item || {}) ? '✅' : '❌')
console.log('   target_entity_id:', 'target_entity_id' in (item || {}) ? '✅' : '❌')
console.log('   created_at:', 'created_at' in (item || {}) ? '✅' : '❌')

const success = item && 'metadata' in item && 'source_entity_id' in item
console.log('')
console.log(success ? '✅ DEPLOYMENT SUCCESSFUL!' : '❌ DEPLOYMENT FAILED')
process.exit(success ? 0 : 1)
