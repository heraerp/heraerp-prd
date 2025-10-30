/**
 * Check how leave policy is stored in the database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function checkLeavePolicyStorage() {
  console.log('🔍 LEAVE POLICY STORAGE CHECK')
  console.log('='.repeat(60))
  console.log(`Organization: ${ORGANIZATION_ID}\n`)

  // Check in core_entities
  const { data: entities, error: entError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .like('smart_code', '%LEAVE.POLICY%')

  console.log('📦 ENTITIES (core_entities):')
  console.log('='.repeat(60))
  if (entError) {
    console.error('Error:', entError)
  } else if (entities && entities.length > 0) {
    entities.forEach(entity => {
      console.log(`\n✅ Found: ${entity.entity_name}`)
      console.log(`   ID: ${entity.id}`)
      console.log(`   Type: ${entity.entity_type}`)
      console.log(`   Smart Code: ${entity.smart_code}`)
      console.log(`   Created: ${entity.created_at}`)
    })

    // Get dynamic data for the policy
    console.log('\n📋 DYNAMIC DATA (core_dynamic_data):')
    console.log('='.repeat(60))
    for (const entity of entities) {
      const { data: dynamicData, error: dynError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('entity_id', entity.id)
        .eq('organization_id', ORGANIZATION_ID)

      if (dynError) {
        console.error('Error:', dynError)
      } else if (dynamicData && dynamicData.length > 0) {
        console.log(`\n   Fields for ${entity.entity_name}:`)
        dynamicData.forEach(field => {
          const value = field.field_value_text || field.field_value_number || field.field_value_boolean || field.field_value_json
          console.log(`   • ${field.field_name}: ${JSON.stringify(value)}`)
        })
      }
    }
  } else {
    console.log('❌ No leave policies found in entities')
  }

  // Check in universal_transactions (just in case)
  const { data: transactions, error: txError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('organization_id', ORGANIZATION_ID)
    .like('smart_code', '%LEAVE.POLICY%')

  console.log('\n\n📄 TRANSACTIONS (universal_transactions):')
  console.log('='.repeat(60))
  if (txError) {
    console.error('Error:', txError)
  } else if (transactions && transactions.length > 0) {
    transactions.forEach(tx => {
      console.log(`\n✅ Found: ${tx.transaction_code}`)
      console.log(`   ID: ${tx.id}`)
      console.log(`   Type: ${tx.transaction_type}`)
      console.log(`   Smart Code: ${tx.smart_code}`)
    })
  } else {
    console.log('❌ No leave policies found in transactions')
  }

  console.log('\n\n💡 CONCLUSION:')
  console.log('='.repeat(60))
  if (entities && entities.length > 0) {
    console.log('✅ Leave policy is stored as an ENTITY in core_entities')
    console.log('✅ Policy configuration stored in core_dynamic_data')
    console.log('✅ This is the correct HERA pattern for reusable configurations')
  }
}

console.log('\n')
checkLeavePolicyStorage()
  .then(() => {
    console.log('\n✅ Check completed\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
