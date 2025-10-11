import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkLatest() {
  console.log('\n🔍 Checking LATEST appointment in database...\n')

  // Get the absolute latest appointment
  const { data: latest, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'APPOINTMENT')
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  if (!latest || latest.length === 0) {
    console.log('❌ No appointments found!')
    return
  }

  const apt = latest[0]

  console.log('📋 LATEST APPOINTMENT:')
  console.log('=' .repeat(60))
  console.log(`ID: ${apt.id}`)
  console.log(`Transaction Code: ${apt.transaction_code}`)
  console.log(`Organization ID: ${apt.organization_id}`)
  console.log(`Transaction Type: ${apt.transaction_type}`)
  console.log(`Transaction Status: ${apt.transaction_status}`)
  console.log(`Transaction Date: ${apt.transaction_date}`)
  console.log(`Created At: ${apt.created_at}`)
  console.log(`Customer (source_entity_id): ${apt.source_entity_id}`)
  console.log(`Stylist (target_entity_id): ${apt.target_entity_id}`)
  console.log(`Total Amount: ${apt.total_amount}`)
  console.log('\nMetadata:')
  console.log(JSON.stringify(apt.metadata, null, 2))

  // Check if customer exists and get name
  if (apt.source_entity_id) {
    const { data: customer } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('id', apt.source_entity_id)
      .single()

    if (customer) {
      console.log(`\n👤 Customer: ${customer.entity_name} (${customer.entity_type})`)
    } else {
      console.log(`\n⚠️ Customer ID ${apt.source_entity_id} NOT FOUND!`)
    }
  }

  // Check if stylist exists
  if (apt.target_entity_id) {
    const { data: stylist } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('id', apt.target_entity_id)
      .single()

    if (stylist) {
      console.log(`💇 Stylist: ${stylist.entity_name} (${stylist.entity_type})`)
    } else {
      console.log(`⚠️ Stylist ID ${apt.target_entity_id} NOT FOUND!`)
    }
  }

  // Check all appointments in the last hour
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
  const { data: recent, count } = await supabase
    .from('universal_transactions')
    .select('id, transaction_code, created_at, metadata', { count: 'exact' })
    .eq('transaction_type', 'APPOINTMENT')
    .gte('created_at', oneHourAgo)
    .order('created_at', { ascending: false })

  console.log(`\n\n📊 Appointments created in last hour: ${count || 0}`)
  if (recent && recent.length > 0) {
    recent.forEach((apt, i) => {
      const hasMetadata = apt.metadata && Object.keys(apt.metadata).length > 0
      console.log(`   ${i+1}. ${apt.transaction_code} - ${apt.created_at} ${hasMetadata ? '✅ has metadata' : '❌ EMPTY metadata'}`)
    })
  }
}

checkLatest().catch(console.error)
