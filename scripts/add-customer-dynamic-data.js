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

async function addCustomerDynamicData() {
  console.log('🚀 Adding dynamic data for Hair Talkz customers...\n')

  try {
    // Get all customers
    const { data: customers } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'customer')
      .not('entity_name', 'ilike', 'walk%')

    console.log(`Found ${customers?.length || 0} customers to update\n`)

    // Customer data mapping
    const customerData = {
      'Sarah Johnson': {
        email: 'sarah.johnson@email.com',
        phone: '+971501234567',
        address: 'Jumeirah Beach Residence, Dubai',
        preferences: 'Prefers morning appointments, allergic to certain hair dyes'
      },
      'Emily Davis': {
        email: 'emily.davis@email.com',
        phone: '+971502345678',
        address: 'Downtown Dubai, Burj Khalifa Area',
        preferences: 'Color specialist client, likes organic products'
      },
      'Jessica Williams': {
        email: 'jessica.williams@email.com',
        phone: '+971503456789',
        address: 'Dubai Marina, Marina Walk',
        preferences: 'VIP customer - special pricing, prefers senior stylists'
      },
      'Fatima Al-Rashid': {
        email: 'fatima.rashid@email.com',
        phone: '+971504567890',
        address: 'Palm Jumeirah, Shoreline Apartments',
        preferences: 'Prefers female stylists only, traditional hair treatments'
      },
      'Aisha Mohammed': {
        email: 'aisha.mohammed@email.com',
        phone: '+971505678901',
        address: 'Business Bay, Executive Towers',
        preferences: 'Regular client - every 3 weeks, keratin treatment specialist'
      }
    }

    // Add dynamic data for each customer
    for (const customer of customers || []) {
      const data = customerData[customer.entity_name]
      if (!data) continue

      console.log(`Updating ${customer.entity_name}...`)

      // Dynamic fields to insert
      const dynamicFields = [
        {
          organization_id: HAIRTALKZ_ORG_ID,
          entity_id: customer.id,
          field_name: 'email',
          field_value_text: data.email,
          smart_code: 'HERA.SALON.CRM.CUSTOMER.EMAIL.V1'
        },
        {
          organization_id: HAIRTALKZ_ORG_ID,
          entity_id: customer.id,
          field_name: 'phone',
          field_value_text: data.phone,
          smart_code: 'HERA.SALON.CRM.CUSTOMER.PHONE.V1'
        },
        {
          organization_id: HAIRTALKZ_ORG_ID,
          entity_id: customer.id,
          field_name: 'address',
          field_value_text: data.address,
          smart_code: 'HERA.SALON.CRM.CUSTOMER.ADDRESS.V1'
        },
        {
          organization_id: HAIRTALKZ_ORG_ID,
          entity_id: customer.id,
          field_name: 'preferences',
          field_value_text: data.preferences,
          smart_code: 'HERA.SALON.CRM.CUSTOMER.PREFERENCES.V1'
        }
      ]

      // Insert or update each field
      for (const field of dynamicFields) {
        // First check if the field exists
        const { data: existing } = await supabase
          .from('core_dynamic_data')
          .select('id')
          .eq('organization_id', field.organization_id)
          .eq('entity_id', field.entity_id)
          .eq('field_name', field.field_name)
          .single()

        if (existing) {
          // Update existing
          const { error } = await supabase
            .from('core_dynamic_data')
            .update({
              field_value_text: field.field_value_text,
              updated_at: new Date().toISOString()
            })
            .eq('id', existing.id)

          if (error) {
            console.error(`Error updating ${field.field_name} for ${customer.entity_name}:`, error)
          }
        } else {
          // Insert new
          const { error } = await supabase
            .from('core_dynamic_data')
            .insert(field)

          if (error) {
            console.error(`Error inserting ${field.field_name} for ${customer.entity_name}:`, error)
          }
        }
      }

      console.log(`✅ Updated ${customer.entity_name}`)
    }

    console.log('\n✨ Customer dynamic data added successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
addCustomerDynamicData()