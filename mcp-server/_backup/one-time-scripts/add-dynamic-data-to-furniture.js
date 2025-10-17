#!/usr/bin/env node

/**
 * Add Dynamic Data to Existing Furniture Entities
 * This script adds Phase 4 dynamic data to the entities created earlier
 */

const { createClient } = require('@supabase/supabase-js')

require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// The organization ID we're using
const ORG_ID = 'd56e8661-228e-4351-b391-5a36785dcc37'

// Entity IDs from the previous run
const ENTITIES = {
  dining_table: 'dc597419-9ac1-45b6-9446-5cefeb0d29ca',
  office_chair: 'ab78875b-7143-40b7-8f59-f707d4c351b0',
  bedroom_set: '9ee978d0-4c78-4fe4-b2ca-5e6c6772c0bf',
  living_room_category: 'e54a45ac-1295-48fc-a7ad-e0b49942402c',
  solid_oak: '3a1b1217-77c1-4587-a309-0bcd67fd5185',
  wood_supplier: '0b272a39-0e05-447d-8d22-43e41e2b2b3d',
  b2b_customer: '2adea3e8-be41-4231-9b8b-2320d063e584'
}

async function addDynamicDataToProduct(entityId, productName) {
  console.log(`\n🔧 Adding Dynamic Data to ${productName}...`)
  
  const dynamicData = []
  
  try {
    // 1. Dimensions
    const { data: dimensions, error: dimError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'dimensions',
        field_type: 'composite',
        field_value_json: {
          length_mm: productName.includes('Table') ? 2400 : productName.includes('Chair') ? 600 : 2000,
          width_mm: productName.includes('Table') ? 1200 : productName.includes('Chair') ? 600 : 1800,
          height_mm: productName.includes('Table') ? 750 : productName.includes('Chair') ? 1100 : 450,
          unit: 'mm'
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.DIMENSIONS.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!dimError) {
      dynamicData.push(dimensions)
      console.log('  ✅ Added dimensions')
    } else {
      console.error('  ❌ Dimensions error:', dimError.message)
    }
    
    // 2. Weight
    const { data: weight, error: weightError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'weight',
        field_type: 'composite',
        field_value_json: {
          value: productName.includes('Table') ? 85.5 : productName.includes('Chair') ? 15.5 : 120.0,
          unit: 'kg'
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.WEIGHT.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!weightError) {
      dynamicData.push(weight)
      console.log('  ✅ Added weight')
    }
    
    // 3. Fire Rating
    const { data: fireRating, error: fireError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'fire_rating',
        field_type: 'select',
        field_value_text: 'BS5852',
        smart_code: 'HERA.IND.FURN.DYNAMIC.FIRERATING.V1',
        is_required: false
      })
      .select()
      .single()
    
    if (!fireError) {
      dynamicData.push(fireRating)
      console.log('  ✅ Added fire rating')
    }
    
    // 4. Pack Size
    const { data: packSize, error: packError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'pack_size',
        field_type: 'composite',
        field_value_json: {
          package_count: productName.includes('Set') ? 5 : productName.includes('Table') ? 3 : 2,
          total_volume_m3: productName.includes('Set') ? 2.5 : productName.includes('Table') ? 0.85 : 0.35,
          heaviest_package_kg: productName.includes('Set') ? 45 : productName.includes('Table') ? 35 : 15
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.PACKSIZE.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!packError) {
      dynamicData.push(packSize)
      console.log('  ✅ Added pack size')
    }
    
    // 5. Cost Rates
    const { data: costRates, error: costError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'cost_rates',
        field_type: 'composite',
        field_value_json: {
          material_cost: productName.includes('Table') ? 250 : productName.includes('Chair') ? 80 : 450,
          labor_hours: productName.includes('Table') ? 4.5 : productName.includes('Chair') ? 2.0 : 8.0,
          labor_rate: 45,
          overhead_rate: 1.35,
          currency: 'AED'
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.COSTRATES.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!costError) {
      dynamicData.push(costRates)
      console.log('  ✅ Added cost rates')
    }
    
    // 6. Warranty Terms
    const { data: warranty, error: warrantyError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'warranty_terms',
        field_type: 'composite',
        field_value_json: {
          period_years: 5,
          coverage_type: 'structural_defects',
          exclusions: ['normal_wear', 'misuse', 'modifications'],
          claim_process: 'Contact dealer with proof of purchase'
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.WARRANTY.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!warrantyError) {
      dynamicData.push(warranty)
      console.log('  ✅ Added warranty terms')
    }
    
    console.log(`  📊 Total fields added: ${dynamicData.length}`)
    return dynamicData
    
  } catch (error) {
    console.error('❌ Error adding dynamic data:', error)
    return dynamicData
  }
}

async function addSupplierData(entityId) {
  console.log('\n🔧 Adding Dynamic Data to Supplier...')
  
  const dynamicData = []
  
  try {
    // Quality Rating
    const { data: quality, error: qualityError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'quality_rating',
        field_type: 'number',
        field_value_number: 4.8,
        smart_code: 'HERA.IND.FURN.DYNAMIC.QUALITY.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!qualityError) {
      dynamicData.push(quality)
      console.log('  ✅ Added quality rating')
    }
    
    // Lead Time
    const { data: leadTime, error: leadError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'lead_time_average',
        field_type: 'number',
        field_value_number: 14,
        smart_code: 'HERA.IND.FURN.DYNAMIC.LEADTIME.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!leadError) {
      dynamicData.push(leadTime)
      console.log('  ✅ Added lead time')
    }
    
    // Payment Terms
    const { data: payment, error: paymentError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'payment_terms',
        field_type: 'text',
        field_value_text: 'NET30',
        smart_code: 'HERA.IND.FURN.DYNAMIC.PAYMENT.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!paymentError) {
      dynamicData.push(payment)
      console.log('  ✅ Added payment terms')
    }
    
    console.log(`  📊 Total fields added: ${dynamicData.length}`)
    return dynamicData
    
  } catch (error) {
    console.error('❌ Error adding supplier data:', error)
    return dynamicData
  }
}

async function addCustomerData(entityId) {
  console.log('\n🔧 Adding Dynamic Data to Customer...')
  
  const dynamicData = []
  
  try {
    // Credit Terms
    const { data: credit, error: creditError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'credit_terms',
        field_type: 'composite',
        field_value_json: {
          credit_limit: 50000,
          payment_days: 30,
          currency: 'AED',
          credit_check_required: true
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.CREDIT.V1',
        is_required: true
      })
      .select()
      .single()
    
    if (!creditError) {
      dynamicData.push(credit)
      console.log('  ✅ Added credit terms')
    }
    
    // Delivery Preferences
    const { data: delivery, error: deliveryError } = await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: ORG_ID,
        entity_id: entityId,
        field_name: 'delivery_preferences',
        field_type: 'composite',
        field_value_json: {
          preferred_days: ['Monday', 'Wednesday', 'Friday'],
          delivery_window: '9AM-5PM',
          special_instructions: 'Call before delivery'
        },
        smart_code: 'HERA.IND.FURN.DYNAMIC.DELIVERY.V1',
        is_required: false
      })
      .select()
      .single()
    
    if (!deliveryError) {
      dynamicData.push(delivery)
      console.log('  ✅ Added delivery preferences')
    }
    
    console.log(`  📊 Total fields added: ${dynamicData.length}`)
    return dynamicData
    
  } catch (error) {
    console.error('❌ Error adding customer data:', error)
    return dynamicData
  }
}

async function main() {
  console.log('\n🧬 PHASE 4: Adding Dynamic Data to Furniture Entities')
  console.log('='.repeat(60))
  console.log(`Organization ID: ${ORG_ID}`)
  
  let totalFields = 0
  
  // Add data to products
  const diningTableFields = await addDynamicDataToProduct(ENTITIES.dining_table, 'Executive Oak Dining Table')
  totalFields += diningTableFields.length
  
  const officeChairFields = await addDynamicDataToProduct(ENTITIES.office_chair, 'Ergonomic Office Chair')
  totalFields += officeChairFields.length
  
  const bedroomSetFields = await addDynamicDataToProduct(ENTITIES.bedroom_set, 'Modern Bedroom Set')
  totalFields += bedroomSetFields.length
  
  // Add data to supplier
  const supplierFields = await addSupplierData(ENTITIES.wood_supplier)
  totalFields += supplierFields.length
  
  // Add data to customer
  const customerFields = await addCustomerData(ENTITIES.b2b_customer)
  totalFields += customerFields.length
  
  console.log('\n\n🎉 PHASE 4 COMPLETE!')
  console.log('='.repeat(60))
  console.log(`✅ Total dynamic fields added: ${totalFields}`)
  console.log('✅ All furniture entities now have complete specifications')
  console.log('\n🚀 Ready for:')
  console.log('  - Testing in the sales order modal')
  console.log('  - Phase 5: Relationship Graph implementation')
  console.log('  - UCR rule validation')
}

// Run the script
main()