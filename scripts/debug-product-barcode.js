/**
 * Debug script to check product barcode in database
 * Usage: node scripts/debug-product-barcode.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugProductBarcode() {
  const targetBarcode = '8429421443531'
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // Your org ID from logs

  console.log('🔍 Searching for products with barcode:', targetBarcode)
  console.log('📍 Organization ID:', orgId)
  console.log('')

  // 1. Check all products in the org
  console.log('📦 Step 1: Fetching all products...')
  const { data: products, error: productsError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', orgId)
    .eq('entity_type', 'product')

  if (productsError) {
    console.error('❌ Error fetching products:', productsError)
    return
  }

  console.log(`✅ Found ${products.length} products total`)
  console.log('')

  // 2. Check dynamic data for barcode_primary
  console.log('📦 Step 2: Checking dynamic data for barcode_primary...')
  const { data: barcodeFields, error: dynamicError } = await supabase
    .from('core_dynamic_data')
    .select('*')
    .eq('organization_id', orgId)
    .eq('field_name', 'barcode_primary')

  if (dynamicError) {
    console.error('❌ Error fetching dynamic data:', dynamicError)
    return
  }

  console.log(`✅ Found ${barcodeFields.length} products with barcode_primary field`)
  console.log('')

  // 3. Search for matching barcode
  const matchingBarcode = barcodeFields.find(
    (field) => field.field_value_text === targetBarcode
  )

  if (matchingBarcode) {
    console.log('✅ FOUND MATCHING BARCODE!')
    console.log('   Entity ID:', matchingBarcode.entity_id)
    console.log('   Value:', matchingBarcode.field_value_text)
    console.log('')

    // Get the product details
    const product = products.find((p) => p.id === matchingBarcode.entity_id)
    if (product) {
      console.log('📦 Product Details:')
      console.log('   Name:', product.entity_name)
      console.log('   Code:', product.entity_code)
      console.log('   Status:', product.status)
      console.log('   Created:', product.created_at)
      console.log('')

      if (product.status !== 'active') {
        console.log('⚠️  WARNING: Product status is not "active"!')
        console.log('   The API only searches products with status="active"')
        console.log('   Current status:', product.status)
      }
    }
  } else {
    console.log('❌ NO MATCHING BARCODE FOUND')
    console.log('')
    console.log('📋 All barcodes in database:')
    barcodeFields.forEach((field) => {
      const product = products.find((p) => p.id === field.entity_id)
      console.log(
        `   - ${field.field_value_text} (${product?.entity_name || 'Unknown'})`
      )
    })
  }

  console.log('')
  console.log('🔍 Summary:')
  console.log(`   Total products: ${products.length}`)
  console.log(`   Products with barcode_primary: ${barcodeFields.length}`)
  console.log(`   Active products: ${products.filter((p) => p.status === 'active').length}`)
  console.log(`   Searching for: ${targetBarcode}`)
}

debugProductBarcode()
  .then(() => {
    console.log('\n✅ Debug complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
