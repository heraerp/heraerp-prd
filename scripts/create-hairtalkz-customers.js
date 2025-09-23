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

async function createTestCustomers() {
  console.log('🚀 Creating test customers for Hair Talkz salon...')

  try {
    const customers = [
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_type: 'customer',
        entity_name: 'Sarah Johnson',
        entity_code: 'CUST-SARAH-001',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        metadata: {
          phone: '+971501234567',
          email: 'sarah.johnson@email.com',
          preferred_stylist: 'Maria Stylist',
          notes: 'Prefers morning appointments'
        }
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_type: 'customer',
        entity_name: 'Emily Davis',
        entity_code: 'CUST-EMILY-002',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        metadata: {
          phone: '+971502345678',
          email: 'emily.davis@email.com',
          preferred_stylist: 'Sofia Senior',
          notes: 'Color specialist client'
        }
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_type: 'customer',
        entity_name: 'Jessica Williams',
        entity_code: 'CUST-JESSICA-003',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        metadata: {
          phone: '+971503456789',
          email: 'jessica.williams@email.com',
          preferred_stylist: 'Anna Expert',
          notes: 'VIP customer - special pricing'
        }
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_type: 'customer',
        entity_name: 'Fatima Al-Rashid',
        entity_code: 'CUST-FATIMA-004',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        metadata: {
          phone: '+971504567890',
          email: 'fatima.rashid@email.com',
          notes: 'Prefers female stylists only'
        }
      },
      {
        organization_id: HAIRTALKZ_ORG_ID,
        entity_type: 'customer',
        entity_name: 'Aisha Mohammed',
        entity_code: 'CUST-AISHA-005',
        smart_code: 'HERA.SALON.CRM.CUSTOMER.PROFILE.V1',
        metadata: {
          phone: '+971505678901',
          email: 'aisha.mohammed@email.com',
          preferred_stylist: 'Maria Stylist',
          notes: 'Regular - every 3 weeks'
        }
      }
    ]

    const { data: createdCustomers, error } = await supabase
      .from('core_entities')
      .insert(customers)
      .select()

    if (error) {
      console.error('Error creating customers:', error)
      return
    }

    console.log(`✅ Successfully created ${createdCustomers.length} customers!`)
    
    createdCustomers.forEach(customer => {
      console.log(`- ${customer.entity_name} (${customer.entity_code})`)
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
createTestCustomers()