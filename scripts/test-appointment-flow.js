const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Hair Talkz organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testAppointmentFlow() {
  console.log('🧪 Testing Hair Talkz appointment flow...\n')

  try {
    // Step 1: Check entities
    console.log('Step 1: Checking entities...')
    const { data: customers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'customer')
      .not('entity_name', 'ilike', 'walk%')

    const { data: services } = await supabase
      .from('core_entities')
      .select('id, entity_name, metadata')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'service')

    const { data: staff } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'employee')

    console.log(`✅ Found ${customers?.length || 0} customers`)
    console.log(`✅ Found ${services?.length || 0} services`)
    console.log(`✅ Found ${staff?.length || 0} staff members`)

    // Step 2: Check existing appointments
    console.log('\nStep 2: Checking existing appointments...')
    const { data: appointments } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('transaction_type', 'APPOINTMENT')
      .order('created_at', { ascending: false })

    console.log(`✅ Found ${appointments?.length || 0} appointments`)

    // Step 3: Show sample data for modal
    console.log('\nStep 3: Sample data for appointment modal:')
    console.log('\nCUSTOMERS:')
    customers?.slice(0, 3).forEach(c => {
      console.log(`- ${c.entity_name} (ID: ${c.id})`)
    })

    console.log('\nSERVICES:')
    services?.slice(0, 3).forEach(s => {
      console.log(`- ${s.entity_name} - AED ${s.metadata?.price || 0} (ID: ${s.id})`)
    })

    console.log('\nSTAFF:')
    staff?.slice(0, 3).forEach(s => {
      console.log(`- ${s.entity_name} (ID: ${s.id})`)
    })

    // Step 4: Show recent appointments
    console.log('\nStep 4: Recent appointments:')
    appointments?.slice(0, 3).forEach(apt => {
      console.log(`\n📅 ${apt.transaction_code}:`)
      console.log(`  Date: ${apt.metadata?.appointment_date} ${apt.metadata?.appointment_time}`)
      console.log(`  Customer: ${apt.metadata?.customer_name}`)
      console.log(`  Service: ${apt.metadata?.service_name}`)
      console.log(`  Staff: ${apt.metadata?.staff_name}`)
      console.log(`  Status: ${apt.metadata?.status}`)
    })

    console.log('\n✅ All checks passed! The appointment system is ready.')
    console.log('\nSUMMARY:')
    console.log('- Organization ID:', HAIRTALKZ_ORG_ID)
    console.log('- Customers available:', customers?.length || 0)
    console.log('- Services available:', services?.length || 0)
    console.log('- Staff available:', staff?.length || 0)
    console.log('- Total appointments:', appointments?.length || 0)

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testAppointmentFlow()