import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const orgId = process.env.DEFAULT_ORGANIZATION_ID

console.log('🔍 Checking Leave System Data...\n')

// Check Leave Policies
console.log('📋 LEAVE POLICIES:')
console.log('=' .repeat(60))
const { data: policies, error: policiesError } = await supabase
  .from('core_entities')
  .select('id, entity_type, entity_name, smart_code, status, created_at')
  .eq('organization_id', orgId)
  .eq('entity_type', 'LEAVE_POLICY')
  .order('created_at', { ascending: false })

if (policiesError) {
  console.error('❌ Policies Error:', policiesError)
} else {
  console.log(`✅ Found ${policies.length} leave policies:`)
  policies.forEach((p, i) => {
    console.log(`  ${i + 1}. ${p.entity_name}`)
    console.log(`     - ID: ${p.id}`)
    console.log(`     - Type: ${p.entity_type}`)
    console.log(`     - Smart Code: ${p.smart_code}`)
    console.log(`     - Status: ${p.status}`)
    console.log(`     - Created: ${p.created_at}`)
  })
  if (policies.length === 0) {
    console.log('  ⚠️  No leave policies found in database')
  }
}

// Check Staff Entities
console.log('\n👥 STAFF ENTITIES:')
console.log('=' .repeat(60))
const { data: staff, error: staffError } = await supabase
  .from('core_entities')
  .select('id, entity_type, entity_name, smart_code, status, created_at')
  .eq('organization_id', orgId)
  .eq('entity_type', 'STAFF')
  .order('created_at', { ascending: false })
  .limit(10)

if (staffError) {
  console.error('❌ Staff Error:', staffError)
} else {
  console.log(`✅ Found ${staff.length} staff members:`)
  staff.forEach((s, i) => {
    console.log(`  ${i + 1}. ${s.entity_name}`)
    console.log(`     - ID: ${s.id}`)
    console.log(`     - Status: ${s.status}`)
    console.log(`     - Created: ${s.created_at}`)
  })
  if (staff.length === 0) {
    console.log('  ⚠️  No staff entities found in database')
  }
}

// Check Dynamic Data for Leave Policies
if (policies && policies.length > 0) {
  console.log('\n🧬 LEAVE POLICY DYNAMIC DATA:')
  console.log('=' .repeat(60))
  const policyId = policies[0].id
  const { data: dynamicData, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('field_name, field_type, field_value_text, field_value_number, field_value_boolean, field_value_date')
    .eq('entity_id', policyId)

  if (dynamicError) {
    console.error('❌ Dynamic Data Error:', dynamicError)
  } else {
    console.log(`✅ Found ${dynamicData.length} dynamic fields for policy "${policies[0].entity_name}":`)
    dynamicData.forEach((field, i) => {
      const value = field.field_value_text ||
                   field.field_value_number ||
                   field.field_value_boolean ||
                   field.field_value_date
      console.log(`  ${i + 1}. ${field.field_name} (${field.field_type}): ${value}`)
    })
  }
}

// Check Leave Requests (Transactions)
console.log('\n📝 LEAVE REQUESTS (Transactions):')
console.log('=' .repeat(60))
const { data: transactions, error: txnError } = await supabase
  .from('universal_transactions')
  .select('id, transaction_type, transaction_code, transaction_status, smart_code, created_at')
  .eq('organization_id', orgId)
  .eq('transaction_type', 'LEAVE')
  .order('created_at', { ascending: false })
  .limit(10)

if (txnError) {
  console.error('❌ Transactions Error:', txnError)
} else {
  console.log(`✅ Found ${transactions.length} leave requests:`)
  transactions.forEach((txn, i) => {
    console.log(`  ${i + 1}. ${txn.transaction_code}`)
    console.log(`     - Status: ${txn.transaction_status}`)
    console.log(`     - Smart Code: ${txn.smart_code}`)
    console.log(`     - Created: ${txn.created_at}`)
  })
  if (transactions.length === 0) {
    console.log('  ℹ️  No leave requests found (this is normal if none created yet)')
  }
}

console.log('\n' + '='.repeat(60))
console.log('✅ Database verification complete')
