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

async function updateCustomerMetadata() {
  console.log('🚀 Updating Hair Talkz customer metadata...\n')

  try {
    // Get all customers
    const { data: customers } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'customer')
      .not('entity_name', 'ilike', 'walk%')

    console.log(`Found ${customers?.length || 0} customers to update\n`)

    // Customer metadata mapping
    const customerMetadata = {
      'Sarah Johnson': {
        phone: '+971501234567',
        email: 'sarah.johnson@email.com',
        preferred_stylist: 'Maria Stylist',
        notes: 'Prefers morning appointments'
      },
      'Emily Davis': {
        phone: '+971502345678',
        email: 'emily.davis@email.com',
        preferred_stylist: 'Sofia Senior',
        notes: 'Color specialist client'
      },
      'Jessica Williams': {
        phone: '+971503456789',
        email: 'jessica.williams@email.com',
        preferred_stylist: 'Anna Expert',
        notes: 'VIP customer - special pricing'
      },
      'Fatima Al-Rashid': {
        phone: '+971504567890',
        email: 'fatima.rashid@email.com',
        notes: 'Prefers female stylists only'
      },
      'Aisha Mohammed': {
        phone: '+971505678901',
        email: 'aisha.mohammed@email.com',
        preferred_stylist: 'Maria Stylist',
        notes: 'Regular - every 3 weeks'
      }
    }

    // Update each customer
    for (const customer of customers || []) {
      const metadata = customerMetadata[customer.entity_name]
      if (!metadata) continue

      console.log(`Updating ${customer.entity_name}...`)

      const updatedMetadata = {
        ...customer.metadata,
        ...metadata
      }

      const { error } = await supabase
        .from('core_entities')
        .update({ 
          metadata: updatedMetadata,
          updated_at: new Date().toISOString()
        })
        .eq('id', customer.id)

      if (error) {
        console.error(`Error updating ${customer.entity_name}:`, error)
      } else {
        console.log(`✅ Updated ${customer.entity_name}`)
      }
    }

    console.log('\n✨ Customer metadata updated successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

// Run the script
updateCustomerMetadata()