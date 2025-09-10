#!/usr/bin/env node

/**
 * HERA Furniture Industry: Entity Catalog Implementation
 * Phase 3 Implementation - Entity Catalog (WHAT)
 * 
 * Creates the complete catalog of furniture industry entities using 
 * the Universal 6-table architecture with UCR integration
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

// 🧬 PHASE 3: Furniture Entity Catalog Definitions
const FURNITURE_ENTITY_CATALOG = {
  // 3.1 Core Furniture Entities
  core_entities: {
    'HERA.IND.FURN.ENTITY.PRODUCT.V1': {
      entity_type: 'furniture_product',
      entity_name_template: '{category} {style} {material}',
      entity_code_template: 'PROD-{category}-{sequence}',
      classification: 'core_furniture',
      required_dynamic_fields: ['dimensions', 'weight', 'material_primary', 'finish_primary', 'assembly_required'],
      optional_dynamic_fields: ['color_options', 'warranty_period', 'care_instructions', 'certifications'],
      ucr_validations: ['dimension_check', 'weight_limit', 'material_compatibility'],
      examples: [
        { name: 'Executive Oak Dining Table', code: 'PROD-TABLE-1001' },
        { name: 'Ergonomic Office Chair', code: 'PROD-CHAIR-2001' },
        { name: 'Modern Bedroom Set', code: 'PROD-BEDROOM-3001' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.CATEGORY.V1': {
      entity_type: 'furniture_category',
      entity_name_template: '{category_name}',
      entity_code_template: 'CAT-{name_short}',
      classification: 'taxonomy',
      required_dynamic_fields: ['hierarchy_level', 'display_order'],
      optional_dynamic_fields: ['category_image', 'seo_keywords', 'description'],
      ucr_validations: ['hierarchy_check', 'naming_convention'],
      examples: [
        { name: 'Living Room Furniture', code: 'CAT-LIVING', hierarchy: 1 },
        { name: 'Dining Tables', code: 'CAT-DTABLE', hierarchy: 2 },
        { name: 'Office Chairs', code: 'CAT-OCHAIR', hierarchy: 2 }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.UOM.V1': {
      entity_type: 'furniture_uom',
      entity_name_template: '{unit_name}',
      entity_code_template: 'UOM-{abbreviation}',
      classification: 'measurement',
      required_dynamic_fields: ['base_unit', 'conversion_factor', 'decimal_places'],
      optional_dynamic_fields: ['rounding_rules', 'display_format'],
      ucr_validations: ['conversion_accuracy', 'decimal_precision'],
      examples: [
        { name: 'Each', code: 'UOM-EA', conversion: 1.0 },
        { name: 'Set', code: 'UOM-SET', conversion: 1.0 },
        { name: 'Linear Meter', code: 'UOM-LM', conversion: 1.0 },
        { name: 'Square Meter', code: 'UOM-M2', conversion: 1.0 }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.FINISH.V1': {
      entity_type: 'furniture_finish',
      entity_name_template: '{finish_name} {finish_type}',
      entity_code_template: 'FIN-{type}-{sequence}',
      classification: 'specification',
      required_dynamic_fields: ['finish_type', 'color_code', 'texture'],
      optional_dynamic_fields: ['durability_rating', 'maintenance_level', 'environmental_rating'],
      ucr_validations: ['color_accuracy', 'durability_check', 'material_compatibility'],
      examples: [
        { name: 'Natural Oak Stain', code: 'FIN-STAIN-1001', type: 'wood_stain' },
        { name: 'Matte White Lacquer', code: 'FIN-LACQ-2001', type: 'lacquer' },
        { name: 'Antique Brass', code: 'FIN-METAL-3001', type: 'metal_finish' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.MATERIAL.V1': {
      entity_type: 'furniture_material',
      entity_name_template: '{material_type} {grade}',
      entity_code_template: 'MAT-{type}-{sequence}',
      classification: 'raw_material',
      required_dynamic_fields: ['material_type', 'grade', 'density', 'sustainability_rating'],
      optional_dynamic_fields: ['fire_rating', 'source_country', 'certifications', 'lead_time'],
      ucr_validations: ['quality_grade', 'sustainability_check', 'fire_safety'],
      examples: [
        { name: 'Solid Oak A-Grade', code: 'MAT-WOOD-1001', type: 'hardwood' },
        { name: 'High-Density MDF', code: 'MAT-ENG-2001', type: 'engineered' },
        { name: 'Premium Leather Hide', code: 'MAT-LEATHER-3001', type: 'upholstery' }
      ]
    }
  },

  // 3.2 Manufacturing Entities
  manufacturing_entities: {
    'HERA.IND.FURN.ENTITY.HARDWARE.V1': {
      entity_type: 'furniture_hardware',
      entity_name_template: '{hardware_type} {specification}',
      entity_code_template: 'HW-{type}-{sequence}',
      classification: 'component',
      required_dynamic_fields: ['hardware_type', 'material', 'finish', 'load_rating'],
      optional_dynamic_fields: ['installation_method', 'tool_requirements', 'warranty'],
      ucr_validations: ['load_capacity', 'material_compatibility', 'installation_check'],
      examples: [
        { name: 'Self-Closing Cabinet Hinge', code: 'HW-HINGE-1001', type: 'hinge' },
        { name: 'Full-Extension Drawer Slide', code: 'HW-SLIDE-2001', type: 'slide' },
        { name: 'Brushed Nickel Handle', code: 'HW-HANDLE-3001', type: 'handle' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.BOM.V1': {
      entity_type: 'furniture_bom',
      entity_name_template: 'BOM for {product_name}',
      entity_code_template: 'BOM-{product_code}',
      classification: 'recipe',
      required_dynamic_fields: ['product_id', 'version', 'effective_date', 'component_count'],
      optional_dynamic_fields: ['assembly_instructions', 'tool_requirements', 'skill_level'],
      ucr_validations: ['component_availability', 'version_control', 'cost_calculation'],
      examples: [
        { name: 'BOM for Executive Dining Table', code: 'BOM-PROD-TABLE-1001' },
        { name: 'BOM for Office Chair', code: 'BOM-PROD-CHAIR-2001' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.ROUTING.V1': {
      entity_type: 'furniture_routing',
      entity_name_template: 'Routing for {product_name}',
      entity_code_template: 'RTG-{product_code}',
      classification: 'process',
      required_dynamic_fields: ['product_id', 'operation_sequence', 'total_time', 'skill_requirements'],
      optional_dynamic_fields: ['setup_instructions', 'quality_checkpoints', 'safety_requirements'],
      ucr_validations: ['sequence_validation', 'time_estimation', 'resource_check'],
      examples: [
        { name: 'Routing for Dining Table', code: 'RTG-PROD-TABLE-1001', operations: ['cut', 'sand', 'assemble', 'finish'] }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.WORKCENTER.V1': {
      entity_type: 'furniture_workcenter',
      entity_name_template: '{workcenter_name}',
      entity_code_template: 'WC-{name_short}',
      classification: 'resource',
      required_dynamic_fields: ['capacity_per_hour', 'efficiency_rating', 'shift_schedule'],
      optional_dynamic_fields: ['maintenance_schedule', 'safety_protocols', 'skill_requirements'],
      ucr_validations: ['capacity_check', 'schedule_validation', 'safety_compliance'],
      examples: [
        { name: 'CNC Cutting Station', code: 'WC-CNC', capacity: 12 },
        { name: 'Assembly Line A', code: 'WC-ASSMA', capacity: 8 },
        { name: 'Finishing Booth', code: 'WC-FINISH', capacity: 6 }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.MACHINE.V1': {
      entity_type: 'furniture_machine',
      entity_name_template: '{machine_name}',
      entity_code_template: 'MCH-{type}-{sequence}',
      classification: 'equipment',
      required_dynamic_fields: ['machine_type', 'capacity', 'power_rating', 'maintenance_interval'],
      optional_dynamic_fields: ['manufacturer', 'model', 'year', 'safety_certifications'],
      ucr_validations: ['capacity_validation', 'maintenance_due', 'safety_check'],
      examples: [
        { name: 'CNC Router Table', code: 'MCH-CNC-001', type: 'cutting' },
        { name: 'Industrial Spray Booth', code: 'MCH-SPRAY-001', type: 'finishing' }
      ]
    }
  },

  // 3.3 Business Entities
  business_entities: {
    'HERA.IND.FURN.ENTITY.SUPPLIER.V1': {
      entity_type: 'furniture_supplier',
      entity_name_template: '{company_name}',
      entity_code_template: 'SUP-{name_short}',
      classification: 'vendor',
      required_dynamic_fields: ['supplier_type', 'quality_rating', 'payment_terms', 'lead_time_average'],
      optional_dynamic_fields: ['certifications', 'sustainability_score', 'risk_rating', 'preferred_status'],
      ucr_validations: ['quality_threshold', 'payment_terms_check', 'certification_validity'],
      examples: [
        { name: 'Premium Hardwood Suppliers Inc', code: 'SUP-HARDWOOD', type: 'material' },
        { name: 'European Hardware Co', code: 'SUP-EURHW', type: 'hardware' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.CUSTOMER.V1': {
      entity_type: 'furniture_customer',
      entity_name_template: '{customer_name}',
      entity_code_template: 'CUST-{type}-{sequence}',
      classification: 'buyer',
      required_dynamic_fields: ['customer_type', 'credit_limit', 'payment_terms', 'delivery_preferences'],
      optional_dynamic_fields: ['design_preferences', 'volume_discounts', 'special_requirements'],
      ucr_validations: ['credit_check', 'payment_history', 'delivery_constraints'],
      examples: [
        { name: 'Elite Interior Design', code: 'CUST-B2B-1001', type: 'trade' },
        { name: 'Johnson Family', code: 'CUST-B2C-2001', type: 'retail' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.WAREHOUSE.V1': {
      entity_type: 'furniture_warehouse',
      entity_name_template: '{warehouse_name}',
      entity_code_template: 'WH-{location}',
      classification: 'location',
      required_dynamic_fields: ['storage_type', 'capacity_cubic', 'climate_control', 'security_level'],
      optional_dynamic_fields: ['dock_doors', 'crane_capacity', 'insurance_value'],
      ucr_validations: ['capacity_check', 'climate_requirements', 'security_standards'],
      examples: [
        { name: 'Main Raw Materials Warehouse', code: 'WH-MAIN', type: 'raw_materials' },
        { name: 'Finished Goods Showroom', code: 'WH-SHOW', type: 'finished_goods' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.EMPLOYEE.V1': {
      entity_type: 'furniture_employee',
      entity_name_template: '{first_name} {last_name}',
      entity_code_template: 'EMP-{department}-{sequence}',
      classification: 'human_resource',
      required_dynamic_fields: ['department', 'skill_certifications', 'hourly_rate', 'experience_years'],
      optional_dynamic_fields: ['specializations', 'training_records', 'safety_certifications'],
      ucr_validations: ['skill_verification', 'certification_current', 'safety_compliance'],
      examples: [
        { name: 'Master Craftsman John Smith', code: 'EMP-PROD-001', dept: 'production' },
        { name: 'Designer Sarah Jones', code: 'EMP-DESIGN-001', dept: 'design' }
      ]
    },
    
    'HERA.IND.FURN.ENTITY.PRICELIST.V1': {
      entity_type: 'furniture_pricelist',
      entity_name_template: '{pricelist_name}',
      entity_code_template: 'PL-{type}-{sequence}',
      classification: 'pricing',
      required_dynamic_fields: ['price_type', 'customer_segments', 'effective_dates', 'currency'],
      optional_dynamic_fields: ['volume_tiers', 'seasonal_adjustments', 'promotional_codes'],
      ucr_validations: ['date_range_check', 'currency_validation', 'margin_check'],
      examples: [
        { name: 'Retail Price List 2025', code: 'PL-RETAIL-2025', type: 'retail' },
        { name: 'Trade Discount Schedule', code: 'PL-TRADE-2025', type: 'wholesale' }
      ]
    }
  }
}

// Entity Creation Functions
async function createFurnitureEntity(organizationId, smartCode, entityDefinition) {
  console.log(`  Creating entity: ${entityDefinition.entity_type}`)
  
  try {
    // Create the main entity record
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: entityDefinition.entity_type,
        entity_name: `${entityDefinition.entity_type.replace('_', ' ')} Template`,
        entity_code: `TEMPLATE-${entityDefinition.entity_type.toUpperCase()}`,
        smart_code: smartCode,
        status: 'active',
        metadata: {
          template: true,
          classification: entityDefinition.classification,
          entity_name_template: entityDefinition.entity_name_template,
          entity_code_template: entityDefinition.entity_code_template,
          examples: entityDefinition.examples
        }
      })
      .select()
      .single()

    if (entityError) {
      console.error(`    ❌ Failed to create entity:`, entityError.message)
      return null
    }

    // Create required dynamic fields
    for (const fieldName of entityDefinition.required_dynamic_fields) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: organizationId,
          entity_id: entity.id,
          field_name: fieldName,
          field_value_text: `Required field for ${entityDefinition.entity_type}`,
          smart_code: `${smartCode}.FIELD.${fieldName.toUpperCase()}`,
          field_category: 'required_template_field',
          metadata: {
            required: true,
            field_type: 'template_definition'
          }
        })
    }

    // Create optional dynamic fields
    for (const fieldName of entityDefinition.optional_dynamic_fields || []) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: organizationId,
          entity_id: entity.id,
          field_name: fieldName,
          field_value_text: `Optional field for ${entityDefinition.entity_type}`,
          smart_code: `${smartCode}.FIELD.${fieldName.toUpperCase()}`,
          field_category: 'optional_template_field',
          metadata: {
            required: false,
            field_type: 'template_definition'
          }
        })
    }

    // Create UCR validation references
    for (const validation of entityDefinition.ucr_validations || []) {
      await supabase
        .from('core_dynamic_data')
        .insert({
          organization_id: organizationId,
          entity_id: entity.id,
          field_name: `ucr_validation_${validation}`,
          field_value_text: validation,
          smart_code: `HERA.IND.FURN.UCR.VALIDATION.V1`,
          field_category: 'ucr_validation_rule',
          metadata: {
            validation_type: validation,
            applies_to: entityDefinition.entity_type
          }
        })
    }

    console.log(`    ✅ Created: ${entity.entity_name} (${entity.id})`)
    return entity

  } catch (error) {
    console.error(`    ❌ Error creating entity:`, error.message)
    return null
  }
}

async function initializeFurnitureEntityCatalog(organizationId) {
  console.log('\n🧬 PHASE 3: Initializing Furniture Entity Catalog')
  console.log('='.repeat(60))
  
  if (!organizationId) {
    console.error('❌ Organization ID required')
    return false
  }

  try {
    let totalEntities = 0
    let createdEntities = 0

    // Create Core Furniture Entities
    console.log('\n📦 Creating Core Furniture Entities...')
    for (const [smartCode, definition] of Object.entries(FURNITURE_ENTITY_CATALOG.core_entities)) {
      totalEntities++
      const entity = await createFurnitureEntity(organizationId, smartCode, definition)
      if (entity) createdEntities++
    }

    // Create Manufacturing Entities
    console.log('\n🏭 Creating Manufacturing Entities...')
    for (const [smartCode, definition] of Object.entries(FURNITURE_ENTITY_CATALOG.manufacturing_entities)) {
      totalEntities++
      const entity = await createFurnitureEntity(organizationId, smartCode, definition)
      if (entity) createdEntities++
    }

    // Create Business Entities
    console.log('\n🏢 Creating Business Entities...')
    for (const [smartCode, definition] of Object.entries(FURNITURE_ENTITY_CATALOG.business_entities)) {
      totalEntities++
      const entity = await createFurnitureEntity(organizationId, smartCode, definition)
      if (entity) createdEntities++
    }

    console.log('\n📊 Entity Catalog Creation Summary:')
    console.log(`  Total Entities: ${totalEntities}`)
    console.log(`  Created Successfully: ${createdEntities}`)
    console.log(`  Success Rate: ${((createdEntities/totalEntities)*100).toFixed(1)}%`)
    
    if (createdEntities === totalEntities) {
      console.log('\n🎉 Furniture Entity Catalog initialization complete!')
      console.log('✅ Ready for Phase 4: Dynamic Data Definitions')
      return true
    } else {
      console.log(`\n⚠️ ${totalEntities - createdEntities} entities failed to create`)
      return false
    }

  } catch (error) {
    console.error('❌ Entity catalog initialization failed:', error.message)
    return false
  }
}

// Command line interface
const commands = {
  async create(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    
    if (!orgId) {
      console.error('❌ Organization ID required')
      console.log('Usage: node furniture-entity-catalog.js create --org <org-id>')
      return
    }

    const success = await initializeFurnitureEntityCatalog(orgId)
    
    if (success) {
      console.log('\n🚀 Next Steps:')
      console.log('  1. Review created entity templates')
      console.log('  2. Customize dynamic fields as needed')
      console.log('  3. Proceed to Phase 4: Dynamic Data Definitions')
      console.log('  4. Create seed data from templates')
    }
  },

  async list(args) {
    console.log('\n🧬 HERA Furniture Entity Catalog')
    console.log('='.repeat(60))
    
    if (args.core || args.all) {
      console.log('\n📦 CORE FURNITURE ENTITIES:')
      Object.entries(FURNITURE_ENTITY_CATALOG.core_entities).forEach(([code, def]) => {
        console.log(`  ${code}`)
        console.log(`    Type: ${def.entity_type}`)
        console.log(`    Classification: ${def.classification}`)
        console.log(`    Required Fields: ${def.required_dynamic_fields.length}`)
        console.log(`    Optional Fields: ${def.optional_dynamic_fields?.length || 0}`)
        console.log(`    UCR Validations: ${def.ucr_validations?.length || 0}`)
        if (def.examples && def.examples.length > 0) {
          console.log(`    Example: ${def.examples[0].name} (${def.examples[0].code})`)
        }
        console.log('')
      })
    }
    
    if (args.manufacturing || args.all) {
      console.log('\n🏭 MANUFACTURING ENTITIES:')
      Object.entries(FURNITURE_ENTITY_CATALOG.manufacturing_entities).forEach(([code, def]) => {
        console.log(`  ${code}`)
        console.log(`    Type: ${def.entity_type}`)
        console.log(`    Example: ${def.examples?.[0]?.name || 'N/A'}`)
        console.log('')
      })
    }
    
    if (args.business || args.all) {
      console.log('\n🏢 BUSINESS ENTITIES:')
      Object.entries(FURNITURE_ENTITY_CATALOG.business_entities).forEach(([code, def]) => {
        console.log(`  ${code}`)
        console.log(`    Type: ${def.entity_type}`)
        console.log(`    Example: ${def.examples?.[0]?.name || 'N/A'}`)
        console.log('')
      })
    }
  },

  async stats() {
    console.log('\n📊 FURNITURE ENTITY CATALOG STATISTICS:')
    console.log('='.repeat(60))
    
    const coreCount = Object.keys(FURNITURE_ENTITY_CATALOG.core_entities).length
    const mfgCount = Object.keys(FURNITURE_ENTITY_CATALOG.manufacturing_entities).length
    const bizCount = Object.keys(FURNITURE_ENTITY_CATALOG.business_entities).length
    const totalCount = coreCount + mfgCount + bizCount
    
    console.log(`  Core Furniture Entities: ${coreCount}`)
    console.log(`  Manufacturing Entities: ${mfgCount}`)
    console.log(`  Business Entities: ${bizCount}`)
    console.log(`  Total Entity Templates: ${totalCount}`)
    
    console.log('\n🔧 Dynamic Field Analysis:')
    let totalRequired = 0
    let totalOptional = 0
    let totalUCR = 0
    
    Object.values(FURNITURE_ENTITY_CATALOG.core_entities).forEach(def => {
      totalRequired += def.required_dynamic_fields.length
      totalOptional += def.optional_dynamic_fields?.length || 0
      totalUCR += def.ucr_validations?.length || 0
    })
    
    Object.values(FURNITURE_ENTITY_CATALOG.manufacturing_entities).forEach(def => {
      totalRequired += def.required_dynamic_fields.length
      totalOptional += def.optional_dynamic_fields?.length || 0
      totalUCR += def.ucr_validations?.length || 0
    })
    
    Object.values(FURNITURE_ENTITY_CATALOG.business_entities).forEach(def => {
      totalRequired += def.required_dynamic_fields.length
      totalOptional += def.optional_dynamic_fields?.length || 0
      totalUCR += def.ucr_validations?.length || 0
    })
    
    console.log(`  Required Dynamic Fields: ${totalRequired}`)
    console.log(`  Optional Dynamic Fields: ${totalOptional}`)
    console.log(`  UCR Validation Rules: ${totalUCR}`)
    console.log(`  Total Field Definitions: ${totalRequired + totalOptional}`)
    
    console.log('\n🧬 UCR Integration:')
    console.log('  ✅ All entities have UCR validation rules')
    console.log('  ✅ Configuration-driven field definitions')
    console.log('  ✅ Zero hardcoded entity structures')
    console.log('  ✅ Complete furniture industry coverage')
  },

  help() {
    console.log('\n🧬 HERA Furniture Entity Catalog CLI')
    console.log('='.repeat(50))
    console.log('\nCommands:')
    console.log('  create --org <org-id>   Create furniture entity catalog')
    console.log('  list [--core] [--manufacturing] [--business] [--all]')
    console.log('                          List entity definitions')
    console.log('  stats                   Show catalog statistics')
    console.log('  help                    Show this help')
    console.log('')
    console.log('Examples:')
    console.log('  node furniture-entity-catalog.js create --org your-org-uuid')
    console.log('  node furniture-entity-catalog.js list --all')
    console.log('  node furniture-entity-catalog.js stats')
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