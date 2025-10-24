/**
 * Test RPC with UPPERCASE entity type
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testRPCUppercase() {
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
  const targetBarcode = '8429421443531'

  console.log('🔍 Testing RPC with UPPERCASE entity_type="PRODUCT"')
  console.log('')

  const { data: result, error: rpcError } = await supabase.rpc('hera_entity_read_v1', {
    p_organization_id: orgId,
    p_entity_id: null,
    p_entity_type: 'PRODUCT', // UPPERCASE
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

  console.log('✅ RPC Success')
  console.log('   Products returned:', result?.data?.length || 0)
  console.log('')

  const products = result?.data || []

  if (products.length === 0) {
    console.log('❌ No products returned!')
    return
  }

  console.log('📦 Product details:')
  products.forEach((product, idx) => {
    console.log(`\n   ${idx + 1}. ${product.entity_name}`)
    console.log(`      ID: ${product.id}`)
    console.log(`      Entity Type: ${product.entity_type}`)
    console.log(`      Status: ${product.status}`)
    console.log(`      Has barcode_primary: ${!!product.barcode_primary}`)
    if (product.barcode_primary) {
      console.log(`      barcode_primary: ${product.barcode_primary}`)
      console.log(
        `      Matches target: ${product.barcode_primary === targetBarcode ? '✅ YES' : '❌ NO'}`
      )
    }
  })

  console.log('')
  const match = products.find((p) => p.barcode_primary === targetBarcode)
  if (match) {
    console.log('✅ FOUND PRODUCT WITH BARCODE!')
    console.log(`   Name: ${match.entity_name}`)
  } else {
    console.log('❌ NO PRODUCT WITH BARCODE FOUND')
    console.log('')
    console.log('🔍 Checking if barcode_primary fields are empty...')
    const withBarcode = products.filter((p) => p.barcode_primary)
    console.log(`   Products with barcode_primary: ${withBarcode.length}/${products.length}`)

    if (withBarcode.length === 0) {
      console.log('')
      console.log('🚨 ISSUE: RPC is not returning barcode_primary fields!')
      console.log('   This means p_include_dynamic_data: true is not working')
      console.log('   The RPC function may have a bug or the field mapping is wrong')
    }
  }
}

testRPCUppercase()
  .then(() => {
    console.log('\n✅ Test complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
