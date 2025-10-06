import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkTodayAppointments() {
  console.log('🔍 Checking for appointments...\n')

  // Get all appointments from core_entities where entity_type = 'appointment'
  const { data: appointments, error } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'appointment')
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    console.error('❌ Error fetching appointments:', error)
    return
  }

  if (!appointments || appointments.length === 0) {
    console.log('📭 No appointments found in the database')
    return
  }

  console.log(`✅ Found ${appointments.length} appointment(s):\n`)

  appointments.forEach((apt, index) => {
    console.log(`${index + 1}. Appointment ID: ${apt.id}`)
    console.log(`   Name: ${apt.entity_name}`)
    console.log(`   Status: ${apt.status}`)
    console.log(`   Created: ${new Date(apt.created_at).toLocaleString()}`)
    console.log(`   Metadata:`, JSON.stringify(apt.metadata, null, 2))
    console.log('')
  })

  // Also check core_dynamic_data for appointment details
  console.log('\n🔍 Checking dynamic data for appointments...\n')

  for (const apt of appointments) {
    const { data: dynamicData, error: dynError } = await supabase
      .from('core_dynamic_data')
      .select('*')
      .eq('entity_id', apt.id)

    if (!dynError && dynamicData && dynamicData.length > 0) {
      console.log(`📊 Dynamic data for ${apt.entity_name}:`)
      dynamicData.forEach(field => {
        console.log(`   - ${field.field_name}: ${field.field_value_text || field.field_value_number || field.field_value_json}`)
      })
      console.log('')
    }
  }

  // Check relationships for appointments
  console.log('\n🔗 Checking relationships for appointments...\n')

  for (const apt of appointments) {
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .or(`from_entity_id.eq.${apt.id},to_entity_id.eq.${apt.id}`)

    if (!relError && relationships && relationships.length > 0) {
      console.log(`🔗 Relationships for ${apt.entity_name}:`)
      relationships.forEach(rel => {
        console.log(`   - Type: ${rel.relationship_type}`)
        console.log(`     From: ${rel.from_entity_id}`)
        console.log(`     To: ${rel.to_entity_id}`)
      })
      console.log('')
    }
  }
}

checkTodayAppointments()
