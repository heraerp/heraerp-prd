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

// Service pricing based on Dubai salon standards
const servicePrices = {
  'Root Color': 250,
  'Women Haircut': 150,
  'Men Haircut': 100,
  'Kids Haircut': 80,
  'Blowdry Standard': 120,
  'Blowdry Styling': 150,
  'Full Color': 450,
  'Partial Highlights': 350,
  'Full Highlights': 500,
  'Balayage': 650,
  'Keratin Treatment': 800,
  'Hair Treatment Mask': 200,
  'Toner': 150,
  'Olaplex Add-on': 100
}

async function updateHairTalkzServicePrices() {
  console.log('💰 Updating Hair Talkz service prices...\n')

  try {
    // Get all services for Hair Talkz
    const { data: services, error } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', HAIRTALKZ_ORG_ID)
      .eq('entity_type', 'service')

    if (error) {
      console.error('Error fetching services:', error)
      return
    }

    console.log(`Found ${services.length} services to update\n`)

    // Update each service with appropriate price
    for (const service of services) {
      const price = servicePrices[service.entity_name] || 150 // Default to 150 if not found
      const duration = getDuration(service.entity_name)

      const updatedMetadata = {
        ...service.metadata,
        price: price,
        duration: duration,
        currency: 'AED',
        category: getCategory(service.entity_name)
      }

      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ metadata: updatedMetadata })
        .eq('id', service.id)

      if (updateError) {
        console.error(`Error updating ${service.entity_name}:`, updateError)
      } else {
        console.log(`✅ Updated ${service.entity_name}: AED ${price} (${duration} min)`)
      }
    }

    console.log('\n✨ Hair Talkz service prices updated successfully!')

  } catch (error) {
    console.error('Error:', error)
  }
}

function getDuration(serviceName) {
  const durations = {
    'Root Color': 90,
    'Women Haircut': 45,
    'Men Haircut': 30,
    'Kids Haircut': 20,
    'Blowdry Standard': 30,
    'Blowdry Styling': 45,
    'Full Color': 120,
    'Partial Highlights': 90,
    'Full Highlights': 120,
    'Balayage': 150,
    'Keratin Treatment': 180,
    'Hair Treatment Mask': 45,
    'Toner': 30,
    'Olaplex Add-on': 20
  }
  return durations[serviceName] || 60
}

function getCategory(serviceName) {
  if (serviceName.includes('Haircut')) return 'Cut & Style'
  if (serviceName.includes('Color') || serviceName.includes('Highlights') || serviceName.includes('Balayage') || serviceName.includes('Toner')) return 'Color'
  if (serviceName.includes('Blowdry')) return 'Styling'
  if (serviceName.includes('Treatment') || serviceName.includes('Keratin') || serviceName.includes('Olaplex')) return 'Treatment'
  return 'General'
}

// Run the update
updateHairTalkzServicePrices()