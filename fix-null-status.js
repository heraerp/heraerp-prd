// Fix product with null status
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixNullStatus() {
  console.log('Finding products with null status...')

  const { data: products, error: fetchError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'product')
    .is('status', null)

  if (fetchError) {
    console.error('Error fetching products:', fetchError)
    return
  }

  console.log(`Found ${products ? products.length : 0} products with null status`)

  if (products && products.length > 0) {
    for (const product of products) {
      console.log(`Updating product: ${product.entity_name} (${product.id})`)

      const { error: updateError } = await supabase
        .from('core_entities')
        .update({ status: 'active' })
        .eq('id', product.id)

      if (updateError) {
        console.error(`Error updating ${product.entity_name}:`, updateError)
      } else {
        console.log(`✅ Updated ${product.entity_name} to status='active'`)
      }
    }
  }

  console.log('Done!')
}

fixNullStatus()
