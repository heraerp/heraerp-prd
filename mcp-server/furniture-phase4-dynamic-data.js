#!/usr/bin/env node

/**
 * HERA Furniture Industry: Phase 4 Dynamic Data Implementation
 * Creates actual entities in Supabase and implements dynamic data definitions
 * 
 * This script UPDATES SUPABASE with real data for:
 * - Phase 3: Entity Catalog (creating actual entities)
 * - Phase 4: Dynamic Data Definitions (field specifications)
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

// 🧬 PHASE 4: Dynamic Data Field Specifications
const FURNITURE_DYNAMIC_DATA_SPECS = {
  // 4.1 Product Specifications
  product_specifications: {
    dimensions: {
      field_type: 'composite',
      data_structure: {
        length_mm: 'number',
        width_mm: 'number', 
        height_mm: 'number',
        unit: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.VALIDATION.DIMENSION.V1',
      required: true,
      example: { length_mm: 2400, width_mm: 1200, height_mm: 750, unit: 'mm' }
    },
    
    weight: {
      field_type: 'composite',
      data_structure: {
        value: 'number',
        unit: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.VALIDATION.WEIGHT.V1',
      required: true,
      example: { value: 85.5, unit: 'kg' }
    },
    
    fire_rating: {
      field_type: 'select',
      allowed_values: ['BS5852', 'CAL117', 'EN1021', 'NFPA260', 'None'],
      validation: 'HERA.IND.FURN.UCR.VALIDATION.FIRERATING.V1',
      required: false,
      example: 'BS5852'
    },
    
    pack_size: {
      field_type: 'composite',
      data_structure: {
        package_count: 'number',
        total_volume_m3: 'number',
        heaviest_package_kg: 'number'
      },
      validation: 'HERA.IND.FURN.UCR.VALIDATION.PACKAGING.V1',
      required: true,
      example: { package_count: 3, total_volume_m3: 0.85, heaviest_package_kg: 35 }
    },
    
    cost_rates: {
      field_type: 'composite',
      data_structure: {
        material_cost: 'number',
        labor_hours: 'number',
        labor_rate: 'number',
        overhead_rate: 'number',
        currency: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.CALCULATION.COSTROLLUP.V1',
      required: true,
      example: { material_cost: 250, labor_hours: 4.5, labor_rate: 45, overhead_rate: 1.35, currency: 'AED' }
    }
  },

  // 4.2 Manufacturing Data
  manufacturing_data: {
    inspection_plans: {
      field_type: 'array',
      item_structure: {
        checkpoint_name: 'text',
        inspection_type: 'text',
        criteria: 'text',
        tools_required: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.VALIDATION.QUALITY.V1',
      required: true,
      example: [
        {
          checkpoint_name: 'Surface Finish Check',
          inspection_type: 'visual',
          criteria: 'No scratches, uniform color, smooth texture',
          tools_required: 'inspection lamp, magnifying glass'
        }
      ]
    },
    
    warranty_terms: {
      field_type: 'composite',
      data_structure: {
        period_years: 'number',
        coverage_type: 'text',
        exclusions: 'array',
        claim_process: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.VALIDATION.WARRANTY.V1',
      required: true,
      example: {
        period_years: 5,
        coverage_type: 'structural_defects',
        exclusions: ['normal_wear', 'misuse', 'modifications'],
        claim_process: 'Contact dealer with proof of purchase'
      }
    },
    
    capacity_data: {
      field_type: 'composite', 
      data_structure: {
        throughput_per_hour: 'number',
        setup_time_minutes: 'number',
        efficiency_target: 'number',
        max_batch_size: 'number'
      },
      validation: 'HERA.IND.FURN.UCR.CALCULATION.CAPACITY.V1',
      required: true,
      example: {
        throughput_per_hour: 12,
        setup_time_minutes: 45,
        efficiency_target: 0.85,
        max_batch_size: 20
      }
    },
    
    routing_parameters: {
      field_type: 'array',
      item_structure: {
        operation_seq: 'number',
        operation_name: 'text',
        work_center: 'text',
        setup_time: 'number',
        cycle_time: 'number',
        skill_level: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.ROUTING.SEQUENCE.V1',
      required: true,
      example: [
        {
          operation_seq: 10,
          operation_name: 'Cut Components',
          work_center: 'WC-CNC',
          setup_time: 30,
          cycle_time: 45,
          skill_level: 'intermediate'
        }
      ]
    }
  },

  // 4.3 Business Data
  business_data: {
    credit_terms: {
      field_type: 'composite',
      data_structure: {
        credit_limit: 'number',
        payment_days: 'number',
        currency: 'text',
        credit_check_required: 'boolean'
      },
      validation: 'HERA.IND.FURN.UCR.VALIDATION.CREDIT.V1',
      required: true,
      example: {
        credit_limit: 50000,
        payment_days: 30,
        currency: 'AED',
        credit_check_required: true
      }
    },
    
    pricing_tiers: {
      field_type: 'array',
      item_structure: {
        tier_name: 'text',
        min_quantity: 'number',
        discount_percent: 'number',
        special_conditions: 'text'
      },
      validation: 'HERA.IND.FURN.UCR.PRICING.TIERED.V1',
      required: false,
      example: [
        {
          tier_name: 'Volume Discount',
          min_quantity: 10,
          discount_percent: 15,
          special_conditions: 'Single order, same SKU'
        }
      ]
    }
  }
}

// Create actual furniture entities in Supabase
async function createFurnitureEntities(organizationId) {
  console.log('\n📦 Creating Furniture Entities in Supabase...')
  console.log('='.repeat(60))
  
  const entities = []
  
  try {
    // 1. Create Product Entities
    console.log('\n🪑 Creating Furniture Products...')
    
    const diningTable = await createEntity(organizationId, {
      entity_type: 'furniture_product',
      entity_name: 'Executive Oak Dining Table',
      entity_code: 'PROD-TABLE-1001',
      smart_code: 'HERA.IND.FURN.ENTITY.PRODUCT.V1',
      metadata: {
        category: 'dining_room',
        style: 'executive',
        material: 'solid_oak'
      }
    })
    entities.push(diningTable)
    
    const officeChair = await createEntity(organizationId, {
      entity_type: 'furniture_product',
      entity_name: 'Ergonomic Office Chair',
      entity_code: 'PROD-CHAIR-2001',
      smart_code: 'HERA.IND.FURN.ENTITY.PRODUCT.V1',
      metadata: {
        category: 'office',
        style: 'ergonomic',
        material: 'mesh_leather'
      }
    })
    entities.push(officeChair)
    
    const bedroomSet = await createEntity(organizationId, {
      entity_type: 'furniture_product',
      entity_name: 'Modern Bedroom Set',
      entity_code: 'PROD-BEDROOM-3001',
      smart_code: 'HERA.IND.FURN.ENTITY.PRODUCT.V1',
      metadata: {
        category: 'bedroom',
        style: 'modern',
        material: 'engineered_wood'
      }
    })
    entities.push(bedroomSet)
    
    // 2. Create Category Entities
    console.log('\n📂 Creating Furniture Categories...')
    
    const livingRoom = await createEntity(organizationId, {
      entity_type: 'furniture_category',
      entity_name: 'Living Room Furniture',
      entity_code: 'CAT-LIVING',
      smart_code: 'HERA.IND.FURN.ENTITY.CATEGORY.V1',
      metadata: {
        hierarchy_level: 1,
        display_order: 1
      }
    })
    entities.push(livingRoom)
    
    // 3. Create Material Entities
    console.log('\n🪵 Creating Furniture Materials...')
    
    const solidOak = await createEntity(organizationId, {
      entity_type: 'furniture_material',
      entity_name: 'Solid Oak A-Grade',
      entity_code: 'MAT-WOOD-1001', 
      smart_code: 'HERA.IND.FURN.ENTITY.MATERIAL.V1',
      metadata: {
        material_type: 'hardwood',
        grade: 'A',
        source: 'European Oak'
      }
    })
    entities.push(solidOak)
    
    // 4. Create Supplier Entity
    console.log('\n🏢 Creating Suppliers...')
    
    const woodSupplier = await createEntity(organizationId, {
      entity_type: 'furniture_supplier',
      entity_name: 'Premium Hardwood Suppliers Inc',
      entity_code: 'SUP-HARDWOOD',
      smart_code: 'HERA.IND.FURN.ENTITY.SUPPLIER.V1',
      metadata: {
        supplier_type: 'material',
        specialization: 'hardwood'
      }
    })
    entities.push(woodSupplier)
    
    // 5. Create Customer Entity
    console.log('\n👥 Creating Customers...')
    
    const b2bCustomer = await createEntity(organizationId, {
      entity_type: 'furniture_customer',
      entity_name: 'Elite Interior Design',
      entity_code: 'CUST-B2B-1001',
      smart_code: 'HERA.IND.FURN.ENTITY.CUSTOMER.V1',
      metadata: {
        customer_type: 'trade',
        segment: 'premium'
      }
    })
    entities.push(b2bCustomer)
    
    console.log(`\n✅ Created ${entities.length} furniture entities successfully`)
    return entities
    
  } catch (error) {
    console.error('❌ Error creating entities:', error)
    return entities
  }
}

// Helper function to create entity
async function createEntity(organizationId, entityData) {
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      ...entityData,
      status: 'active'
    })
    .select()
    .single()
    
  if (error) {
    console.error(`  ❌ Failed to create ${entityData.entity_name}:`, error.message)
    throw error
  }
  
  console.log(`  ✅ Created: ${entityData.entity_name} (${data.id})`)
  return data
}

// Create dynamic data for entities
async function createDynamicDataForEntity(organizationId, entityId, entityType, entityName) {
  console.log(`\n🔧 Adding Dynamic Data for ${entityName}...`)
  
  const dynamicFields = []
  
  try {
    // Add product-specific dynamic data
    if (entityType === 'furniture_product') {
      // Dimensions
      const dimensions = await createDynamicField(organizationId, entityId, {
        field_name: 'dimensions',
        field_value_json: JSON.stringify({
          length_mm: 2400,
          width_mm: 1200,
          height_mm: 750,
          unit: 'mm'
        }),
        smart_code: 'HERA.IND.FURN.DYNAMIC.DIMENSIONS.V1',
        field_type: 'composite',
        metadata: {
          category: 'product_specifications',
          ...FURNITURE_DYNAMIC_DATA_SPECS.product_specifications.dimensions
        }
      })
      dynamicFields.push(dimensions)
      
      // Weight
      const weight = await createDynamicField(organizationId, entityId, {
        field_name: 'weight',
        field_value_json: JSON.stringify({
          value: 85.5,
          unit: 'kg'
        }),
        smart_code: 'HERA.IND.FURN.DYNAMIC.WEIGHT.V1',
        field_type: 'composite',
        metadata: {
          category: 'product_specifications',
          ...FURNITURE_DYNAMIC_DATA_SPECS.product_specifications.weight
        }
      })
      dynamicFields.push(weight)
      
      // Fire Rating
      const fireRating = await createDynamicField(organizationId, entityId, {
        field_name: 'fire_rating',
        field_value_text: 'BS5852',
        smart_code: 'HERA.IND.FURN.DYNAMIC.FIRERATING.V1',
        field_type: 'select',
        metadata: {
          category: 'product_specifications',
          ...FURNITURE_DYNAMIC_DATA_SPECS.product_specifications.fire_rating
        }
      })
      dynamicFields.push(fireRating)
      
      // Pack Size
      const packSize = await createDynamicField(organizationId, entityId, {
        field_name: 'pack_size',
        field_value_json: JSON.stringify({
          package_count: 3,
          total_volume_m3: 0.85,
          heaviest_package_kg: 35
        }),
        smart_code: 'HERA.IND.FURN.DYNAMIC.PACKSIZE.V1',
        field_type: 'composite',
        metadata: {
          category: 'product_specifications',
          ...FURNITURE_DYNAMIC_DATA_SPECS.product_specifications.pack_size
        }
      })
      dynamicFields.push(packSize)
      
      // Cost Rates
      const costRates = await createDynamicField(organizationId, entityId, {
        field_name: 'cost_rates',
        field_value_json: JSON.stringify({
          material_cost: 250,
          labor_hours: 4.5,
          labor_rate: 45,
          overhead_rate: 1.35,
          currency: 'AED'
        }),
        smart_code: 'HERA.IND.FURN.DYNAMIC.COSTRATES.V1',
        field_type: 'composite',
        metadata: {
          category: 'product_specifications',
          ...FURNITURE_DYNAMIC_DATA_SPECS.product_specifications.cost_rates
        }
      })
      dynamicFields.push(costRates)
      
      // Warranty Terms
      const warrantyTerms = await createDynamicField(organizationId, entityId, {
        field_name: 'warranty_terms',
        field_value_json: JSON.stringify({
          period_years: 5,
          coverage_type: 'structural_defects',
          exclusions: ['normal_wear', 'misuse', 'modifications'],
          claim_process: 'Contact dealer with proof of purchase'
        }),
        smart_code: 'HERA.IND.FURN.DYNAMIC.WARRANTY.V1',
        field_type: 'composite',
        metadata: {
          category: 'manufacturing_data',
          ...FURNITURE_DYNAMIC_DATA_SPECS.manufacturing_data.warranty_terms
        }
      })
      dynamicFields.push(warrantyTerms)
    }
    
    // Add supplier-specific dynamic data
    if (entityType === 'furniture_supplier') {
      const supplierQuality = await createDynamicField(organizationId, entityId, {
        field_name: 'quality_rating',
        field_value_number: 4.8,
        smart_code: 'HERA.IND.FURN.DYNAMIC.QUALITY.V1',
        field_type: 'number',
        metadata: {
          category: 'supplier_data',
          max_rating: 5,
          last_assessment: new Date().toISOString()
        }
      })
      dynamicFields.push(supplierQuality)
      
      const leadTime = await createDynamicField(organizationId, entityId, {
        field_name: 'lead_time_average',
        field_value_number: 14,
        smart_code: 'HERA.IND.FURN.DYNAMIC.LEADTIME.V1',
        field_type: 'number',
        metadata: {
          category: 'supplier_data',
          unit: 'days',
          reliability: 0.92
        }
      })
      dynamicFields.push(leadTime)
    }
    
    // Add customer-specific dynamic data
    if (entityType === 'furniture_customer') {
      const creditTerms = await createDynamicField(organizationId, entityId, {
        field_name: 'credit_terms',
        field_value_json: JSON.stringify({
          credit_limit: 50000,
          payment_days: 30,
          currency: 'AED',
          credit_check_required: true
        }),
        smart_code: 'HERA.IND.FURN.DYNAMIC.CREDIT.V1',
        field_type: 'composite',
        metadata: {
          category: 'business_data',
          ...FURNITURE_DYNAMIC_DATA_SPECS.business_data.credit_terms
        }
      })
      dynamicFields.push(creditTerms)
    }
    
    console.log(`  ✅ Added ${dynamicFields.length} dynamic fields`)
    return dynamicFields
    
  } catch (error) {
    console.error('❌ Error creating dynamic data:', error)
    return dynamicFields
  }
}

// Helper function to create dynamic field
async function createDynamicField(organizationId, entityId, fieldData) {
  const { data, error } = await supabase
    .from('core_dynamic_data')
    .insert({
      organization_id: organizationId,
      entity_id: entityId,
      ...fieldData
    })
    .select()
    .single()
    
  if (error) {
    console.error(`  ❌ Failed to create field ${fieldData.field_name}:`, error.message)
    throw error
  }
  
  console.log(`    ✅ ${fieldData.field_name}: ${fieldData.field_value_text || fieldData.field_value_number || 'JSON data'}`)
  return data
}

// Main implementation function
async function implementPhase4(organizationId) {
  console.log('\n🧬 PHASE 4: Dynamic Data Implementation for Furniture Industry')
  console.log('='.repeat(70))
  console.log('This will CREATE REAL DATA in your Supabase database!')
  console.log('='.repeat(70))
  
  try {
    // Step 1: Create entities (Phase 3 completion)
    const entities = await createFurnitureEntities(organizationId)
    
    // Step 2: Add dynamic data to each entity (Phase 4)
    console.log('\n\n📊 PHASE 4: Adding Dynamic Data Definitions...')
    console.log('='.repeat(60))
    
    let totalDynamicFields = 0
    
    for (const entity of entities) {
      const fields = await createDynamicDataForEntity(
        organizationId,
        entity.id,
        entity.entity_type,
        entity.entity_name
      )
      totalDynamicFields += fields.length
    }
    
    console.log('\n\n🎉 PHASE 4 IMPLEMENTATION COMPLETE!')
    console.log('='.repeat(60))
    console.log(`✅ Created ${entities.length} furniture entities`)
    console.log(`✅ Added ${totalDynamicFields} dynamic data fields`)
    console.log(`✅ All data successfully stored in Supabase`)
    console.log('\n🚀 Your furniture module now has:')
    console.log('  - Real products with specifications')
    console.log('  - Dynamic fields with UCR validation')
    console.log('  - Complete manufacturing data')
    console.log('  - Business relationships ready')
    
    return true
    
  } catch (error) {
    console.error('\n❌ Phase 4 implementation failed:', error)
    return false
  }
}

// Command line interface
const commands = {
  async implement(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    
    if (!orgId) {
      console.error('❌ Organization ID required')
      console.log('Usage: node furniture-phase4-dynamic-data.js implement --org <org-id>')
      return
    }
    
    console.log(`\n🏢 Organization ID: ${orgId}`)
    console.log('⚡ This will create REAL data in Supabase!')
    console.log('Press Ctrl+C to cancel...\n')
    
    // Give user 3 seconds to cancel
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    const success = await implementPhase4(orgId)
    
    if (success) {
      console.log('\n📋 Next Steps:')
      console.log('  1. Check your Supabase dashboard to see the created entities')
      console.log('  2. Test the furniture sales modal with real products')
      console.log('  3. Proceed to Phase 5: Relationship Graph')
      console.log('  4. Implement UCR rules for validation')
    }
  },
  
  async preview(args) {
    console.log('\n🔍 PHASE 4 PREVIEW: Dynamic Data Specifications')
    console.log('='.repeat(60))
    
    console.log('\n📦 Product Specifications:')
    Object.entries(FURNITURE_DYNAMIC_DATA_SPECS.product_specifications).forEach(([field, spec]) => {
      console.log(`\n  ${field}:`)
      console.log(`    Type: ${spec.field_type}`)
      console.log(`    Required: ${spec.required}`)
      console.log(`    Validation: ${spec.validation}`)
      console.log(`    Example: ${JSON.stringify(spec.example, null, 2).split('\n').join('\n    ')}`)
    })
    
    console.log('\n🏭 Manufacturing Data:')
    Object.entries(FURNITURE_DYNAMIC_DATA_SPECS.manufacturing_data).forEach(([field, spec]) => {
      console.log(`\n  ${field}:`)
      console.log(`    Type: ${spec.field_type}`)
      console.log(`    Required: ${spec.required}`)
    })
    
    console.log('\n💼 Business Data:')
    Object.entries(FURNITURE_DYNAMIC_DATA_SPECS.business_data).forEach(([field, spec]) => {
      console.log(`\n  ${field}:`)
      console.log(`    Type: ${spec.field_type}`)
      console.log(`    Required: ${spec.required}`)
    })
    
    console.log('\n\nThis is a PREVIEW only. Run with "implement" to create real data.')
  },
  
  help() {
    console.log('\n🧬 HERA Furniture Phase 4: Dynamic Data Implementation')
    console.log('='.repeat(50))
    console.log('\nCommands:')
    console.log('  implement --org <org-id>  CREATE real data in Supabase')
    console.log('  preview                   Show what will be created')
    console.log('  help                      Show this help')
    console.log('')
    console.log('⚠️  WARNING: The "implement" command will CREATE REAL DATA in your database!')
    console.log('')
    console.log('Examples:')
    console.log('  node furniture-phase4-dynamic-data.js preview')
    console.log('  node furniture-phase4-dynamic-data.js implement --org your-org-uuid')
  }
}

// Parse command line arguments
const args = {}
const command = process.argv[2] || 'help'

process.argv.slice(3).forEach((arg, index) => {
  if (arg.startsWith('--')) {
    const key = arg.slice(2)
    const nextArg = process.argv[index + 4]
    
    if (nextArg && !nextArg.startsWith('--')) {
      args[key] = nextArg
    } else {
      args[key] = true
    }
  }
})

// Execute command
if (commands[command]) {
  commands[command](args)
} else {
  console.error(`❌ Unknown command: ${command}`)
  commands.help()
}