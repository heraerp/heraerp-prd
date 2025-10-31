import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function checkGLJournalBranches() {
  console.log('\n🔍 Checking GL_JOURNAL transactions and branch data...\n')

  // 1. Check GL_JOURNAL transactions
  const { data: glTransactions, error: glError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, transaction_date, transaction_type, smart_code, source_entity_id, target_entity_id, metadata')
    .eq('organization_id', TEST_ORG_ID)
    .eq('transaction_type', 'GL_JOURNAL')
    .like('smart_code', 'HERA.SALON.FINANCE.TXN.JOURNAL.POSSALE%')
    .order('transaction_date', { ascending: false })
    .limit(10)

  if (glError) {
    console.error('❌ Error fetching GL_JOURNAL:', glError)
    return
  }

  console.log(`Found ${glTransactions.length} GL_JOURNAL transactions:\n`)

  glTransactions.forEach((txn, i) => {
    console.log(`${i + 1}. ID: ${txn.id}`)
    console.log(`   Code: ${txn.transaction_code}`)
    console.log(`   Date: ${txn.transaction_date}`)
    console.log(`   Smart Code: ${txn.smart_code}`)
    console.log(`   Source Entity: ${txn.source_entity_id || 'NULL'}`)
    console.log(`   Target Entity (Branch): ${txn.target_entity_id || 'NULL'}`)
    console.log(`   Metadata keys: ${txn.metadata ? Object.keys(txn.metadata).join(', ') : 'NULL'}`)
    if (txn.metadata?.branch_id) {
      console.log(`   ✅ Branch ID in metadata: ${txn.metadata.branch_id}`)
    }
    if (txn.metadata?.net_revenue) {
      console.log(`   💰 Net Revenue: ${txn.metadata.net_revenue}`)
    }
    if (txn.metadata?.total_cr) {
      console.log(`   💰 Total Credit: ${txn.metadata.total_cr}`)
    }
    console.log('')
  })

  // 2. Check branches
  console.log('\n🏢 Checking branches...\n')

  const { data: branches, error: branchError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type')
    .eq('organization_id', TEST_ORG_ID)
    .eq('entity_type', 'BRANCH')
    .order('created_at', { ascending: false })

  if (branchError) {
    console.error('❌ Error fetching branches:', branchError)
    return
  }

  console.log(`Found ${branches.length} branches:\n`)
  branches.forEach((branch, i) => {
    console.log(`${i + 1}. ID: ${branch.id}`)
    console.log(`   Name: ${branch.entity_name}`)
    console.log('')
  })

  // 3. Analysis: Where is branch ID stored?
  console.log('\n🔍 ANALYSIS: Branch ID Storage\n')

  const branchInTargetEntity = glTransactions.filter(t => t.target_entity_id !== null).length
  const branchInMetadata = glTransactions.filter(t => t.metadata?.branch_id).length

  console.log(`GL Transactions with target_entity_id: ${branchInTargetEntity}`)
  console.log(`GL Transactions with metadata.branch_id: ${branchInMetadata}`)

  if (branchInMetadata > 0) {
    console.log('\n⚠️  Branch IDs are stored in METADATA, not target_entity_id!')
    console.log('The filter needs to check metadata.branch_id instead of target_entity_id')
  } else if (branchInTargetEntity > 0) {
    console.log('\n✅ Branch IDs are stored in target_entity_id (correct)')
  } else {
    console.log('\n❌ No branch IDs found in either location!')
  }
}

checkGLJournalBranches()
