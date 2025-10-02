const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkProductData() {
  try {
    const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

    console.log('\n=== Checking Product Entities ===')
    const { data: products, error: productsError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'product')
      .order('entity_name')

    if (productsError) {
      console.error('Error fetching products:', productsError)
      return
    }

    console.log(`\nFound ${products.length} products:\n`)

    for (const product of products) {
      console.log(`\n--- ${product.entity_name} ---`)
      console.log(`ID: ${product.id}`)
      console.log(`Code: ${product.entity_code || 'NULL'}`)
      console.log(`Status: ${product.status || 'NULL'}`)
      console.log(`Smart Code: ${product.smart_code}`)
      console.log(`Description: ${product.entity_description || 'NULL'}`)
      console.log(`Metadata: ${JSON.stringify(product.metadata, null, 2)}`)

      // Check dynamic data for this product
      console.log(`\nDynamic Data:`)
      const { data: dynamicData, error: dynamicError } = await supabase
        .from('core_dynamic_data')
        .select('*')
        .eq('organization_id', orgId)
        .eq('entity_id', product.id)
        .order('field_name')

      if (dynamicError) {
        console.error('  Error fetching dynamic data:', dynamicError)
      } else if (dynamicData.length === 0) {
        console.log('  (No dynamic data found)')
      } else {
        dynamicData.forEach(field => {
          const value = field.field_value_text ||
                       field.field_value_number ||
                       field.field_value_boolean ||
                       field.field_value_date ||
                       field.field_value_json
          console.log(`  - ${field.field_name} (${field.field_type}): ${value}`)
        })
      }
    }

    console.log('\n\n=== Summary ===')
    console.log(`Total products: ${products.length}`)
    const withPrice = products.filter(p => p.metadata?.price).length
    const withCategory = products.filter(p => p.metadata?.category).length
    const withStatus = products.filter(p => p.status).length

    console.log(`Products with price in metadata: ${withPrice}`)
    console.log(`Products with category in metadata: ${withCategory}`)
    console.log(`Products with status: ${withStatus}`)

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

checkProductData()
