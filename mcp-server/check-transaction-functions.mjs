#!/usr/bin/env node

/**
 * 🔍 CHECK AVAILABLE TRANSACTION FUNCTIONS
 * 
 * This script checks what transaction RPC functions are actually available
 * in the Supabase database to fix the function signature issues.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment
config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('🔍 CHECKING AVAILABLE TRANSACTION FUNCTIONS')
console.log('===========================================')
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function listFunctions() {
  console.log('📡 Querying available RPC functions...')
  console.log('')
  
  try {
    const { data, error } = await supabase
      .from('pg_proc')
      .select('proname, pronargs')
      .like('proname', '%txn%')
      .order('proname')
    
    if (error) {
      console.log('❌ Error querying functions:', error.message)
      return
    }
    
    console.log('🔍 Transaction-related functions found:')
    data.forEach(func => {
      console.log(`   ${func.proname} (${func.pronargs} args)`)
    })
    console.log('')
    
    // Also check for hera functions
    const { data: heraData, error: heraError } = await supabase
      .from('pg_proc')
      .select('proname, pronargs')
      .like('proname', '%hera%')
      .order('proname')
    
    if (!heraError && heraData) {
      console.log('🧬 HERA-specific functions found:')
      heraData.forEach(func => {
        console.log(`   ${func.proname} (${func.pronargs} args)`)
      })
    }
    
  } catch (error) {
    console.log('💥 Exception:', error.message)
  }
}

// Test specific function calls
async function testTransactionFunctions() {
  console.log('')
  console.log('🧪 Testing specific transaction function calls...')
  console.log('')
  
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const userId = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'
  
  // Test different function signatures
  const testFunctions = [
    'hera_txn_crud_v1',
    'hera_transactions_crud_v1', 
    'hera_transactions_crud_v2',
    'create_transaction_v1',
    'universal_transaction_create'
  ]
  
  for (const funcName of testFunctions) {
    console.log(`🔬 Testing ${funcName}...`)
    
    try {
      // Try with minimal payload first to see function signature
      const { data, error } = await supabase.rpc(funcName, {
        p_action: 'READ',
        p_actor_user_id: userId,
        p_organization_id: orgId
      })
      
      if (error) {
        if (error.message.includes('Could not find the function')) {
          console.log(`   ❌ Function not found: ${funcName}`)
        } else {
          console.log(`   ⚠️ Function exists but error: ${error.message}`)
        }
      } else {
        console.log(`   ✅ Function works: ${funcName}`)
        console.log(`      Response: ${JSON.stringify(data).substring(0, 100)}...`)
      }
      
    } catch (error) {
      console.log(`   💥 Exception: ${error.message}`)
    }
  }
}

async function runFunctionCheck() {
  await listFunctions()
  await testTransactionFunctions()
  
  console.log('')
  console.log('🏁 Function check completed.')
}

runFunctionCheck().catch(error => {
  console.error('💥 Function check failed:', error.message)
})