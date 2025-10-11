import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkAppointments() {
  console.log('\n🔍 Checking Appointments in Database...\n')

  // Check with UPPERCASE
  const { data: upperData, error: upperError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_date, transaction_status, created_at')
    .eq('transaction_type', 'APPOINTMENT')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('1️⃣ UPPERCASE "APPOINTMENT" query:')
  if (upperError) {
    console.log('   ❌ Error:', upperError.message)
  } else {
    console.log(`   ✅ Found ${upperData?.length || 0} appointments`)
    if (upperData && upperData.length > 0) {
      console.log('   Latest:', {
        id: upperData[0].id.substring(0, 8),
        type: upperData[0].transaction_type,
        date: upperData[0].transaction_date,
        status: upperData[0].transaction_status,
        created: upperData[0].created_at
      })
    }
  }

  // Check with lowercase
  const { data: lowerData, error: lowerError } = await supabase
    .from('universal_transactions')
    .select('id, transaction_type, transaction_date, transaction_status, created_at')
    .eq('transaction_type', 'appointment')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log('\n2️⃣ lowercase "appointment" query:')
  if (lowerError) {
    console.log('   ❌ Error:', lowerError.message)
  } else {
    console.log(`   ✅ Found ${lowerData?.length || 0} appointments`)
    if (lowerData && lowerData.length > 0) {
      console.log('   Latest:', {
        id: lowerData[0].id.substring(0, 8),
        type: lowerData[0].transaction_type,
        date: lowerData[0].transaction_date,
        status: lowerData[0].transaction_status,
        created: lowerData[0].created_at
      })
    }
  }

  // Check all transaction types to see what we have
  const { data: allTypes } = await supabase
    .from('universal_transactions')
    .select('transaction_type')
    .limit(100)

  const uniqueTypes = [...new Set(allTypes?.map(t => t.transaction_type) || [])]
  console.log('\n3️⃣ All transaction_type values in database:')
  uniqueTypes.forEach(type => {
    console.log(`   - "${type}"`)
  })

  // Check today's appointments specifically
  const today = new Date().toISOString().split('T')[0]
  const { data: todayUpper } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'APPOINTMENT')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)

  const { data: todayLower } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'appointment')
    .gte('created_at', `${today}T00:00:00Z`)
    .lte('created_at', `${today}T23:59:59Z`)

  console.log(`\n4️⃣ Created TODAY (${today}):`)
  console.log(`   UPPERCASE: ${todayUpper?.length || 0} appointments`)
  console.log(`   lowercase: ${todayLower?.length || 0} appointments`)

  if (todayUpper && todayUpper.length > 0) {
    console.log('\n   Today\'s UPPERCASE appointments:')
    todayUpper.forEach((apt, i) => {
      console.log(`   ${i+1}. ${apt.transaction_code} - ${apt.transaction_status} (${apt.created_at})`)
    })
  }

  if (todayLower && todayLower.length > 0) {
    console.log('\n   Today\'s lowercase appointments:')
    todayLower.forEach((apt, i) => {
      console.log(`   ${i+1}. ${apt.transaction_code} - ${apt.transaction_status} (${apt.created_at})`)
    })
  }
}

checkAppointments().catch(console.error)
