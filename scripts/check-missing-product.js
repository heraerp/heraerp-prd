/**
 * Check why product b195bad3-b54f-4b67-b78f-43c2017a7dca is not returned by RPC
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkMissingProduct() {
  const productId = 'b195bad3-b54f-4b67-b78f-43c2017a7dca'
  const orgId = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

  console.log('🔍 Checking product:', productId)
  console.log('')

  // Check if product exists in core_entities
  const { data: product, error: productError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('id', productId)
    .single()

  if (productError) {
    console.error('❌ Product NOT found in core_entities!')
    console.error('   Error:', productError.message)
    console.error('')
    console.error('🚨 THIS IS THE PROBLEM:')
    console.error('   The product entity does not exist in core_entities table')
    console.error('   But the barcode_primary exists in core_dynamic_data')
    console.error('   This is a data integrity issue - orphaned dynamic data')
    return
  }

  console.log('✅ Product found in core_entities:')
  console.log('   ID:', product.id)
  console.log('   Name:', product.entity_name)
  console.log('   Code:', product.entity_code)
  console.log('   Type:', product.entity_type)
  console.log('   Status:', product.status)
  console.log('   Organization ID:', product.organization_id)
  console.log('   Created:', product.created_at)
  console.log('')

  // Check why it's not returned by RPC
  console.log('🔍 Checking RPC filter conditions:')
  console.log(`   ✓ organization_id === '${orgId}': ${product.organization_id === orgId}`)
  console.log(`   ✓ entity_type === 'product': ${product.entity_type === 'product'}`)
  console.log(`   ✓ status === 'active': ${product.status === 'active'}`)
  console.log('')

  if (product.organization_id !== orgId) {
    console.log('❌ ORGANIZATION MISMATCH!')
    console.log(`   Expected: ${orgId}`)
    console.log(`   Actual:   ${product.organization_id}`)
  }

  if (product.entity_type !== 'product') {
    console.log('❌ ENTITY TYPE MISMATCH!')
    console.log(`   Expected: product`)
    console.log(`   Actual:   ${product.entity_type}`)
  }

  if (product.status !== 'active') {
    console.log('❌ STATUS MISMATCH!')
    console.log(`   Expected: active`)
    console.log(`   Actual:   ${product.status}`)
  }

  // Check if all conditions pass
  if (
    product.organization_id === orgId &&
    product.entity_type === 'product' &&
    product.status === 'active'
  ) {
    console.log('✅ All RPC filter conditions pass!')
    console.log('')
    console.log('🔍 This means the issue is with the RPC function itself')
    console.log('   The product should be returned but is not')
    console.log('   Possible RPC bug or caching issue')
  }
}

checkMissingProduct()
  .then(() => {
    console.log('\n✅ Check complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
