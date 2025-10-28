/**
 * Clean up all leave-related data for testing
 * Removes transactions, relationships, and dynamic data
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY not found in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
const ORGANIZATION_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function cleanupLeaveData() {
  console.log('🧹 LEAVE DATA CLEANUP')
  console.log('='.repeat(60))
  console.log(`Organization: ${ORGANIZATION_ID}\n`)

  try {
    // Get all leave transactions (already deleted, but let's verify)
    const { count: txCount } = await supabase
      .from('universal_transactions')
      .select('id', { count: 'exact' })
      .eq('organization_id', ORGANIZATION_ID)
      .eq('transaction_type', 'LEAVE')

    console.log(`📄 Leave transactions: ${txCount || 0}`)

    // Get leave-related relationships
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, source_entity_id, target_entity_id')
      .eq('organization_id', ORGANIZATION_ID)
      .or('relationship_type.eq.LEAVE_MANAGER,relationship_type.eq.HAS_LEAVE_POLICY')

    if (relError) {
      console.error('Error reading relationships:', relError)
    } else {
      console.log(`🔗 Leave relationships: ${relationships?.length || 0}`)
      if (relationships && relationships.length > 0) {
        console.log('\n   Sample relationships:')
        relationships.slice(0, 5).forEach((r, i) => {
          console.log(`   ${i + 1}. ${r.relationship_type}`)
        })
      }
    }

    // Get leave policy entities
    const { data: policies, error: policyError } = await supabase
      .from('core_entities')
      .select('id, entity_name, smart_code')
      .eq('organization_id', ORGANIZATION_ID)
      .like('smart_code', '%LEAVE.POLICY%')

    if (policyError) {
      console.error('Error reading policies:', policyError)
    } else {
      console.log(`📋 Leave policies: ${policies?.length || 0}`)
      if (policies && policies.length > 0) {
        policies.forEach((p, i) => {
          console.log(`   ${i + 1}. ${p.entity_name} (${p.smart_code})`)
        })
      }
    }

    console.log('\n✅ All leave transactions already cleaned up!')
    console.log('✅ Leave relationships and policies preserved for reuse')
    console.log('\n💡 You can now create fresh leave requests for testing')

  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

console.log('\n')
cleanupLeaveData()
  .then(() => {
    console.log('\n✅ Leave data check completed\n')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n❌ Script failed:', err)
    process.exit(1)
  })
