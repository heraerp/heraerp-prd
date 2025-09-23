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

async function testStaffQuery() {
  console.log('🔍 Testing staff query for Hair Talkz salon...\n')

  try {
    // Method 1: Direct query using core_entities
    console.log('Method 1: Direct query from core_entities')
    const { data: directStaff, error: directError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'employee')

    if (directError) {
      console.error('Direct query error:', directError)
    } else {
      console.log(`Found ${directStaff?.length || 0} employees directly`)
      directStaff?.forEach(emp => {
        console.log(`- ${emp.entity_name} (${emp.entity_code})`)
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Method 2: Using RPC function hera_entity_profiles
    console.log('Method 2: Using hera_entity_profiles function (recommended)')
    const { data: profileStaff, error: profileError } = await supabase
      .rpc('hera_entity_profiles', {
        p_organization_id: HAIRTALKZ_ORG_ID,
        p_entity_type: 'employee',
        p_smartcode_like: null
      })

    if (profileError) {
      console.error('Profile query error:', profileError)
    } else {
      console.log(`Found ${profileStaff?.length || 0} employees with profiles`)
      
      // First, let's see what columns are returned
      if (profileStaff?.length > 0) {
        console.log('Available columns:', Object.keys(profileStaff[0]))
      }
      
      profileStaff?.forEach(emp => {
        console.log(`\n👤 ${emp.entity_name} (${emp.entity_code})`)
        console.log(`   Full profile:`, JSON.stringify(emp, null, 2))
      })
    }

    console.log('\n' + '='.repeat(50) + '\n')

    // Method 3: Get staff with their appointment counts
    console.log('Method 3: Staff with appointment statistics')
    const { data: appointments } = await supabase
      .from('universal_transactions')
      .select('target_entity_id, metadata')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('transaction_type', 'appointment')

    // Count appointments per staff
    const appointmentCounts = {}
    appointments?.forEach(apt => {
      const staffId = apt.target_entity_id
      appointmentCounts[staffId] = (appointmentCounts[staffId] || 0) + 1
    })

    console.log('\n📊 Appointment counts by staff:')
    for (const [staffId, count] of Object.entries(appointmentCounts)) {
      const staff = directStaff?.find(s => s.id === staffId)
      if (staff) {
        console.log(`   ${staff.entity_name}: ${count} appointments`)
      }
    }

    console.log('\n✅ Staff query test completed!')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the test
testStaffQuery()