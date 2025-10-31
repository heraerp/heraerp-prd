#!/usr/bin/env node
/**
 * Check TKN DETOX GEL product barcode in database
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function checkProduct() {
  console.log('🔍 Searching for product: TKN DETOX GEL')
  console.log('🔍 Expected barcode: 8429421443531')
  console.log('')

  // Get all active products
  const result = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'READ',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'PRODUCT',
      status: 'active'
    },
    p_dynamic: {},
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      limit: 100
    }
  })

  if (result.error) {
    console.error('❌ RPC Error:', result.error)
    return
  }

  // Extract products from nested response structure
  let products = result.data?.data?.list || result.data?.list || result.data?.data || result.data?.items || []
  if (!Array.isArray(products)) {
    products = result.data ? [result.data] : []
  }

  console.log(`✅ Found ${products.length} total products`)
  console.log('')

  // Find TKN DETOX GEL
  const tknProduct = products.find(p => {
    const name = p.entity?.entity_name || p.entity_name || ''
    return name.includes('TKN DETOX')
  })

  if (!tknProduct) {
    console.log('❌ TKN DETOX GEL product not found!')
    console.log('Available products:')
    products.slice(0, 5).forEach(p => {
      const name = p.entity?.entity_name || p.entity_name
      console.log(`  - ${name}`)
    })
    return
  }

  console.log('✅ Found TKN DETOX GEL product:')
  console.log('ID:', tknProduct.entity?.id || tknProduct.id)
  console.log('Name:', tknProduct.entity?.entity_name || tknProduct.entity_name)
  console.log('')
  console.log('📦 Full Product Structure:')
  console.log(JSON.stringify(tknProduct, null, 2).substring(0, 2000))
  console.log('')

  // Check barcode fields specifically
  const dynamicFields = tknProduct.dynamic_fields || []
  console.log('🔍 Barcode-related fields:')

  const barcodeFields = dynamicFields.filter(f =>
    f.field_name?.includes('barcode') ||
    f.field_name?.includes('gtin') ||
    f.field_name?.includes('sku')
  )

  if (barcodeFields.length === 0) {
    console.log('❌ NO barcode fields found!')
  } else {
    barcodeFields.forEach(f => {
      console.log(`  - ${f.field_name}:`,
        f.field_value_text || f.field_value_number || f.field_value_json || 'NULL'
      )
    })
  }
}

checkProduct().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})
