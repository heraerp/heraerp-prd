import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkDetails() {
  console.log('\n🔍 Checking Today\'s Appointment Details...\n')

  const today = new Date().toISOString().split('T')[0]

  const { data: appointments, error } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'APPOINTMENT')
    .gte('created_at', `${today}T00:00:00Z`)
    .order('created_at', { ascending: false})

  if (error) {
    console.log('❌ Error:', error.message)
    return
  }

  console.log(`Found ${appointments?.length || 0} appointments created today\n`)

  appointments?.forEach((apt, i) => {
    console.log(`\n${i+1}. Appointment ${apt.transaction_code}:`)
    console.log(`   ID: ${apt.id}`)
    console.log(`   Organization ID: ${apt.organization_id}`)
    console.log(`   Transaction Type: ${apt.transaction_type}`)
    console.log(`   Transaction Status: ${apt.transaction_status}`)
    console.log(`   Transaction Date: ${apt.transaction_date}`)
    console.log(`   Created At: ${apt.created_at}`)
    console.log(`   Customer (source): ${apt.source_entity_id}`)
    console.log(`   Stylist (target): ${apt.target_entity_id}`)
    console.log(`   Total Amount: ${apt.total_amount}`)
    console.log(`   Metadata:`, JSON.stringify(apt.metadata, null, 2))
  })

  // Also check what organization IDs exist
  const { data: orgs } = await supabase
    .from('core_organizations')
    .select('id, name')
    .limit(10)

  console.log('\n\n📋 Organizations in database:')
  orgs?.forEach(org => {
    console.log(`   - ${org.name}: ${org.id}`)
  })
}

checkDetails().catch(console.error)
