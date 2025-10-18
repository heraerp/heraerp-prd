/**
 * Check Leave Data in Database
 * Checks for STAFF entities and LEAVE transactions
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkLeaveData() {
  console.log('\n🔍 CHECKING LEAVE MANAGEMENT DATA\n')

  // Get organization ID from env
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  console.log(`📍 Organization ID: ${orgId}\n`)

  // 1. Check STAFF entities
  console.log('1️⃣  Checking STAFF entities...')
  const { data: staff, error: staffError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, smart_code, created_at')
    .eq('organization_id', orgId)
    .eq('entity_type', 'STAFF')
    .limit(10)

  if (staffError) {
    console.error('   ❌ Error:', staffError.message)
  } else {
    console.log(`   ✅ Found ${staff.length} STAFF entities`)
    staff.forEach(s => {
      console.log(`      - ${s.entity_name} (${s.id.substring(0, 8)}...)`)
    })
  }

  // 2. Check LEAVE transactions
  console.log('\n2️⃣  Checking LEAVE transactions...')
  const { data: leaves, error: leavesError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_code, transaction_date, source_entity_id, total_amount, transaction_status')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'LEAVE')
    .limit(10)

  if (leavesError) {
    console.error('   ❌ Error:', leavesError.message)
  } else {
    console.log(`   ✅ Found ${leaves.length} LEAVE transactions`)
    leaves.forEach(l => {
      console.log(`      - ${l.transaction_code}: ${l.total_amount} days (${l.transaction_status})`)
    })
  }

  // 3. Check for LEAVE_REQUEST (old naming)
  console.log('\n3️⃣  Checking LEAVE_REQUEST transactions (old naming)...')
  const { data: oldLeaves, error: oldLeavesError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_code, transaction_date')
    .eq('organization_id', orgId)
    .eq('transaction_type', 'LEAVE_REQUEST')
    .limit(10)

  if (oldLeavesError) {
    console.error('   ❌ Error:', oldLeavesError.message)
  } else {
    console.log(`   ✅ Found ${oldLeaves.length} LEAVE_REQUEST transactions`)
  }

  // 4. Check LEAVE_POLICY entities
  console.log('\n4️⃣  Checking LEAVE_POLICY entities...')
  const { data: policies, error: policiesError } = await supabase
    .from('core_entities')
    .select('id, entity_name, entity_type, metadata')
    .eq('organization_id', orgId)
    .eq('entity_type', 'LEAVE_POLICY')
    .limit(10)

  if (policiesError) {
    console.error('   ❌ Error:', policiesError.message)
  } else {
    console.log(`   ✅ Found ${policies.length} LEAVE_POLICY entities`)
    policies.forEach(p => {
      console.log(`      - ${p.entity_name} (${p.metadata?.leave_type || 'N/A'})`)
    })
  }

  // 5. Check all transaction types for this org
  console.log('\n5️⃣  All transaction types in organization...')
  const { data: allTxnTypes, error: allTxnError } = await supabase
    .from('universal_transactions')
    .select('transaction_type')
    .eq('organization_id', orgId)

  if (!allTxnError && allTxnTypes) {
    const types = [...new Set(allTxnTypes.map(t => t.transaction_type))]
    console.log(`   Found transaction types: ${types.join(', ') || 'NONE'}`)
  }

  console.log('\n✅ Data check complete!\n')
}

checkLeaveData().catch(console.error)
