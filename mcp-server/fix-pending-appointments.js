import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function fixPendingAppointments() {
  console.log('\n🔧 Fixing Pending Appointments → Draft...\n')

  // Find all appointments with 'pending' status
  const { data: pendingAppointments, error: queryError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'APPOINTMENT')
    .eq('transaction_status', 'pending')

  if (queryError) {
    console.log('❌ Error querying appointments:', queryError.message)
    return
  }

  console.log(`Found ${pendingAppointments?.length || 0} appointments with 'pending' status\n`)

  if (!pendingAppointments || pendingAppointments.length === 0) {
    console.log('✅ No pending appointments to fix!')
    return
  }

  // Update each one to 'draft'
  let updated = 0
  let failed = 0

  for (const apt of pendingAppointments) {
    console.log(`\nUpdating appointment ${apt.transaction_code}:`)
    console.log(`   ID: ${apt.id}`)
    console.log(`   Current status: ${apt.transaction_status}`)
    console.log(`   Customer: ${apt.source_entity_id}`)

    const { error: updateError } = await supabase
      .from('universal_transactions')
      .update({
        transaction_status: 'draft',
        updated_at: new Date().toISOString()
      })
      .eq('id', apt.id)

    if (updateError) {
      console.log(`   ❌ Failed: ${updateError.message}`)
      failed++
    } else {
      console.log(`   ✅ Updated to 'draft'`)
      updated++
    }
  }

  console.log('\n\n📊 Summary:')
  console.log(`   Total pending: ${pendingAppointments.length}`)
  console.log(`   ✅ Updated: ${updated}`)
  console.log(`   ❌ Failed: ${failed}`)
}

fixPendingAppointments().catch(console.error)
