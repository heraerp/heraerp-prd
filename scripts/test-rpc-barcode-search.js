/**
 * Test RPC function used by barcode search API
 * Usage: node scripts/test-rpc-barcode-search.js
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRPCBarcodeSearch() {
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const targetBarcode = '8429421443531'

  console.log('🔍 Testing hera_entity_read_v1 RPC (same call as API)...')
  console.log('📍 Organization ID:', orgId)
  console.log('🔎 Target barcode:', targetBarcode)
  console.log('')

  const { data: result, error: rpcError } = await supabase.rpc('hera_entity_read_v1', {
    p_organization_id: orgId,
    p_entity_id: null,
    p_entity_type: 'product',
    p_status: 'active',
    p_include_relationships: false,
    p_include_dynamic_data: true,
    p_limit: 100,
    p_offset: 0
  })

  if (rpcError) {
    console.error('❌ RPC Error:', rpcError)
    return
  }

  console.log('✅ RPC Response Structure:')
  console.log('   Success:', result?.success)
  console.log('   Has data array:', !!result?.data)
  console.log('   Products count:', result?.data?.length || 0)
  console.log('')

  const products = result?.data || []

  if (products.length === 0) {
    console.log('❌ No products returned from RPC!')
    console.log('   This means the RPC function has an issue')
    return
  }

  console.log('📦 Products returned:')
  products.forEach((product, idx) => {
    console.log(`\n   Product ${idx + 1}:`)
    console.log(`   - ID: ${product.id}`)
    console.log(`   - Name: ${product.entity_name}`)
    console.log(`   - Status: ${product.status}`)
    console.log(`   - Has barcode_primary: ${!!product.barcode_primary}`)
    console.log(`   - barcode_primary value: ${product.barcode_primary}`)
    console.log(
      `   - All barcode fields:`,
      Object.keys(product).filter(
        (k) => k.includes('barcode') || k.includes('gtin') || k.includes('sku')
      )
    )
  })

  console.log('')
  console.log('🔎 Searching for barcode:', targetBarcode)

  const matchingProducts = products.filter((product) => {
    // Same logic as API
    if (
      product.barcode_primary &&
      product.barcode_primary.toLowerCase() === targetBarcode.toLowerCase()
    ) {
      return true
    }
    if (Array.isArray(product.barcodes_alt)) {
      const altMatch = product.barcodes_alt.some(
        (alt) => alt && alt.toLowerCase() === targetBarcode.toLowerCase()
      )
      if (altMatch) return true
    }
    if (product.gtin && product.gtin.toLowerCase() === targetBarcode.toLowerCase()) {
      return true
    }
    if (product.sku && product.sku.toLowerCase() === targetBarcode.toLowerCase()) {
      return true
    }
    if (product.barcode && product.barcode.toLowerCase() === targetBarcode.toLowerCase()) {
      return true
    }
    return false
  })

  console.log('')
  if (matchingProducts.length > 0) {
    console.log('✅ FOUND MATCHING PRODUCTS:', matchingProducts.length)
    matchingProducts.forEach((p) => {
      console.log(`   - ${p.entity_name} (${p.barcode_primary})`)
    })
  } else {
    console.log('❌ NO MATCHING PRODUCTS FOUND')
    console.log('')
    console.log('🔍 Possible reasons:')
    console.log('   1. barcode_primary is not included in RPC response')
    console.log('   2. Field name is different (check field names above)')
    console.log('   3. Value has whitespace or different casing')
  }
}

testRPCBarcodeSearch()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
