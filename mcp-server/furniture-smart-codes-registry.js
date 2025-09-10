#!/usr/bin/env node

/**
 * HERA Furniture Industry: Smart Code Registry
 * Phase 1 Implementation - Industry Scope & Smart-Code Registry
 * 
 * REVOLUTIONARY UCR INTEGRATION:
 * This registry defines the complete smart code namespace for furniture industry
 * with built-in Universal Configuration Rules (UCR) support.
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

// 🧬 PHASE 1.1: Domain Coverage Definition
const FURNITURE_DOMAIN_COVERAGE = {
  mto: {
    name: 'Make-to-Order',
    description: 'Custom furniture manufacturing based on customer specifications',
    scope: ['custom_designs', 'made_to_measure', 'bespoke_furniture', 'client_specifications'],
    smart_code_family: 'HERA.IND.FURN.MTO'
  },
  mts: {
    name: 'Make-to-Stock', 
    description: 'Standard furniture production for inventory',
    scope: ['catalog_items', 'standard_designs', 'inventory_production', 'bulk_manufacturing'],
    smart_code_family: 'HERA.IND.FURN.MTS'
  },
  wholesale: {
    name: 'Wholesale Operations',
    description: 'B2B sales to retailers and distributors', 
    scope: ['bulk_orders', 'trade_pricing', 'distributor_sales', 'retailer_supply'],
    smart_code_family: 'HERA.IND.FURN.B2B'
  },
  retail: {
    name: 'Retail Operations',
    description: 'Direct-to-consumer sales and showroom operations',
    scope: ['showroom_sales', 'direct_consumer', 'individual_orders', 'retail_pricing'],
    smart_code_family: 'HERA.IND.FURN.B2C'
  },
  after_sales: {
    name: 'After-Sales Service',
    description: 'Service, warranty, returns, and spare parts',
    scope: ['warranty_claims', 'repairs', 'spare_parts', 'returns', 'maintenance'],
    smart_code_family: 'HERA.IND.FURN.AFTERSALES'
  }
}

// 🧬 PHASE 1.2: Smart Code Namespace Registry
const FURNITURE_SMART_CODE_REGISTRY = {
  // Entity Smart Codes - HERA.IND.FURN.ENTITY.*.V1
  entities: {
    'HERA.IND.FURN.ENTITY.PRODUCT.V1': {
      description: 'Furniture product/SKU with variants',
      use_case: 'Dining table, office chair, bedroom set',
      data_requirements: ['dimensions', 'materials', 'finish_options', 'weight', 'assembly_required'],
      ucr_rules: ['validation', 'defaulting', 'pricing']
    },
    'HERA.IND.FURN.ENTITY.CATEGORY.V1': {
      description: 'Furniture catalog categories and subcategories', 
      use_case: 'Living room, bedroom, office, outdoor furniture',
      data_requirements: ['hierarchy_level', 'display_order', 'category_image', 'seo_keywords'],
      ucr_rules: ['validation', 'defaulting']
    },
    'HERA.IND.FURN.ENTITY.UOM.V1': {
      description: 'Units of measure for furniture',
      use_case: 'Each, set, linear meter, square meter, cubic meter',
      data_requirements: ['base_unit', 'conversion_factor', 'rounding_rules', 'decimal_places'],
      ucr_rules: ['uom_conversion', 'validation']
    },
    'HERA.IND.FURN.ENTITY.FINISH.V1': {
      description: 'Furniture finishes and surface treatments',
      use_case: 'Oak stain, white lacquer, antique brass, leather upholstery',
      data_requirements: ['finish_type', 'color_code', 'texture', 'durability_rating', 'maintenance_instructions'],
      ucr_rules: ['validation', 'compatibility_check']
    },
    'HERA.IND.FURN.ENTITY.MATERIAL.V1': {
      description: 'Raw materials and fabric specifications',
      use_case: 'Solid oak, MDF, steel tubing, leather, fabric',
      data_requirements: ['material_type', 'grade', 'sustainability_rating', 'fire_rating', 'source_country'],
      ucr_rules: ['validation', 'substitution', 'compliance_check']
    },
    'HERA.IND.FURN.ENTITY.HARDWARE.V1': {
      description: 'Hardware components (screws, hinges, handles)',
      use_case: 'Cabinet hinges, drawer slides, handles, screws, brackets',
      data_requirements: ['hardware_type', 'material', 'finish', 'load_rating', 'installation_method'],
      ucr_rules: ['validation', 'compatibility_check']
    },
    'HERA.IND.FURN.ENTITY.BOM.V1': {
      description: 'Bill of Materials for furniture products',
      use_case: 'Recipe for manufacturing dining table with all components',
      data_requirements: ['component_list', 'quantities', 'assembly_sequence', 'waste_allowance'],
      ucr_rules: ['validation', 'calculation', 'cost_rollup']
    },
    'HERA.IND.FURN.ENTITY.ROUTING.V1': {
      description: 'Manufacturing routing and operations',
      use_case: 'Cut → Sand → Assemble → Finish → Pack → Ship',
      data_requirements: ['operation_sequence', 'setup_time', 'cycle_time', 'labor_requirements'],
      ucr_rules: ['validation', 'routing', 'capacity_check']
    },
    'HERA.IND.FURN.ENTITY.WORKCENTER.V1': {
      description: 'Manufacturing work centers and stations',
      use_case: 'Cut station, assembly line, finishing booth, packaging area',
      data_requirements: ['capacity_per_hour', 'setup_time', 'efficiency_rating', 'shift_schedule'],
      ucr_rules: ['validation', 'capacity_calculation', 'scheduling']
    },
    'HERA.IND.FURN.ENTITY.MACHINE.V1': {
      description: 'Manufacturing machines and tools',
      use_case: 'CNC router, table saw, spray booth, packaging equipment',
      data_requirements: ['machine_type', 'capacity', 'maintenance_schedule', 'safety_requirements'],
      ucr_rules: ['validation', 'maintenance_planning']
    },
    'HERA.IND.FURN.ENTITY.SUPPLIER.V1': {
      description: 'Furniture material and component suppliers',
      use_case: 'Hardwood supplier, hardware vendor, fabric distributor',
      data_requirements: ['supplier_type', 'quality_rating', 'lead_times', 'payment_terms', 'certifications'],
      ucr_rules: ['validation', 'approval', 'evaluation']
    },
    'HERA.IND.FURN.ENTITY.CUSTOMER.V1': {
      description: 'Furniture customers (B2B and B2C)',
      use_case: 'Interior designer, furniture retailer, end consumer',
      data_requirements: ['customer_type', 'credit_limit', 'delivery_preferences', 'special_requirements'],
      ucr_rules: ['validation', 'pricing', 'credit_check']
    },
    'HERA.IND.FURN.ENTITY.WAREHOUSE.V1': {
      description: 'Furniture storage locations',
      use_case: 'Raw material warehouse, finished goods, showroom',
      data_requirements: ['storage_type', 'capacity', 'climate_control', 'security_level'],
      ucr_rules: ['validation', 'capacity_check']
    },
    'HERA.IND.FURN.ENTITY.EMPLOYEE.V1': {
      description: 'Furniture manufacturing and sales staff',
      use_case: 'Craftsman, designer, sales consultant, quality inspector',
      data_requirements: ['skill_certifications', 'experience_level', 'hourly_rate', 'department'],
      ucr_rules: ['validation', 'approval', 'skill_matching']
    },
    'HERA.IND.FURN.ENTITY.PRICELIST.V1': {
      description: 'Furniture pricing and discount structures',
      use_case: 'Retail prices, trade discounts, volume pricing, seasonal promotions',
      data_requirements: ['price_type', 'customer_segments', 'effective_dates', 'discount_tiers'],
      ucr_rules: ['validation', 'pricing', 'approval']
    }
  },

  // Transaction Smart Codes - HERA.IND.FURN.TXN.*.V1
  transactions: {
    'HERA.IND.FURN.TXN.SALESORDER.V1': {
      description: 'Furniture sales order transaction',
      use_case: 'Customer orders dining room set with custom finish',
      gl_impact: 'DR: AR, CR: Sales Revenue, CR: Sales Tax',
      ucr_rules: ['validation', 'pricing', 'credit_check', 'approval']
    },
    'HERA.IND.FURN.TXN.PURCHASEORDER.V1': {
      description: 'Furniture purchase order for materials',
      use_case: 'Order hardwood lumber and hardware from suppliers',
      gl_impact: 'DR: Inventory, CR: AP',
      ucr_rules: ['validation', 'approval', 'supplier_check']
    },
    'HERA.IND.FURN.TXN.MANUFACTUREORDER.V1': {
      description: 'Furniture manufacturing order',
      use_case: 'Produce 10 dining tables per customer specifications',
      gl_impact: 'DR: WIP, CR: Raw Materials, CR: Labor, CR: Overhead',
      ucr_rules: ['validation', 'routing', 'capacity_check', 'cost_calculation']
    },
    'HERA.IND.FURN.TXN.INVENTORYMOVE.V1': {
      description: 'Furniture inventory movements',
      use_case: 'Transfer finished goods from production to warehouse',
      gl_impact: 'DR: Finished Goods, CR: WIP',
      ucr_rules: ['validation', 'location_check', 'quality_verification']
    },
    'HERA.IND.FURN.TXN.QUALITYCHECK.V1': {
      description: 'Furniture quality inspection transaction',
      use_case: 'QC inspection of completed dining table for defects',
      gl_impact: 'Conditional: If defects found → DR: Scrap, CR: WIP',
      ucr_rules: ['validation', 'quality_standards', 'defect_handling']
    },
    'HERA.IND.FURN.TXN.SHIPMENT.V1': {
      description: 'Furniture shipment transaction',
      use_case: 'Ship completed order to customer with delivery tracking',
      gl_impact: 'DR: COGS, CR: Finished Goods Inventory',
      ucr_rules: ['validation', 'shipping_rules', 'insurance_check']
    },
    'HERA.IND.FURN.TXN.RETURNRMA.V1': {
      description: 'Furniture return merchandise authorization',
      use_case: 'Customer returns damaged dining chair for replacement',
      gl_impact: 'DR: Returns, CR: Sales Revenue; DR: Inventory, CR: COGS (if resalable)',
      ucr_rules: ['validation', 'return_policy_check', 'condition_assessment']
    },
    'HERA.IND.FURN.TXN.GLPOSTING.V1': {
      description: 'Furniture GL posting transaction',
      use_case: 'Monthly accruals, depreciation, inventory valuation adjustments',
      gl_impact: 'Various depending on posting type',
      ucr_rules: ['validation', 'posting_templates', 'period_controls']
    }
  },

  // UCR Rules Smart Codes - HERA.IND.FURN.UCR.*.V1
  ucr_rules: {
    'HERA.IND.FURN.UCR.VALIDATION.V1': {
      description: 'Furniture validation rules',
      examples: ['dimension_checks', 'material_compatibility', 'weight_limits', 'safety_standards'],
      trigger_points: ['pre_validate', 'on_save', 'before_submit']
    },
    'HERA.IND.FURN.UCR.DEFAULTING.V1': {
      description: 'Furniture field defaulting rules',
      examples: ['default_finish', 'standard_dimensions', 'preferred_supplier', 'delivery_terms'],
      trigger_points: ['on_create', 'field_change', 'context_switch']
    },
    'HERA.IND.FURN.UCR.CALCULATION.V1': {
      description: 'Furniture calculation rules',
      examples: ['cost_rollup', 'pricing_formulas', 'shipping_weight', 'lead_time_calculation'],
      trigger_points: ['on_change', 'before_save', 'scheduled_batch']
    },
    'HERA.IND.FURN.UCR.ROUTING.V1': {
      description: 'Furniture routing and workflow rules',
      examples: ['workcenter_selection', 'operation_sequencing', 'resource_allocation'],
      trigger_points: ['order_release', 'capacity_planning', 'schedule_generation']
    },
    'HERA.IND.FURN.UCR.ELIGIBILITY.V1': {
      description: 'Furniture eligibility and availability rules',
      examples: ['product_availability', 'customer_eligibility', 'promotion_qualification'],
      trigger_points: ['order_entry', 'pricing', 'promotion_check']
    },
    'HERA.IND.FURN.UCR.APPROVAL.V1': {
      description: 'Furniture approval workflow rules',
      examples: ['discount_approval', 'rush_order_approval', 'credit_limit_override'],
      trigger_points: ['threshold_exceeded', 'exception_conditions', 'manager_review']
    },
    'HERA.IND.FURN.UCR.PRICING.V1': {
      description: 'Furniture pricing determination rules',
      examples: ['list_price_plus_markup', 'volume_discounts', 'customer_specific_pricing'],
      trigger_points: ['order_entry', 'quote_generation', 'contract_pricing']
    },
    'HERA.IND.FURN.UCR.TAX.V1': {
      description: 'Furniture tax calculation rules',
      examples: ['vat_rates', 'luxury_tax', 'environmental_fees', 'import_duties'],
      trigger_points: ['order_total_calculation', 'invoice_generation', 'compliance_check']
    },
    'HERA.IND.FURN.UCR.SUBSTITUTION.V1': {
      description: 'Furniture material substitution rules',
      examples: ['equivalent_materials', 'alternative_finishes', 'supplier_substitutes'],
      trigger_points: ['shortage_detected', 'cost_optimization', 'customer_request']
    },
    'HERA.IND.FURN.UCR.UOMCONVERSION.V1': {
      description: 'Furniture unit conversion rules',
      examples: ['linear_meter_to_pieces', 'board_feet_to_cubic_meter', 'fabric_yard_to_meter'],
      trigger_points: ['quantity_calculations', 'inventory_movements', 'purchase_conversions']
    },
    'HERA.IND.FURN.UCR.SLA.V1': {
      description: 'Furniture service level agreement rules',
      examples: ['delivery_promises', 'quality_guarantees', 'response_times', 'warranty_terms'],
      trigger_points: ['order_confirmation', 'milestone_tracking', 'exception_handling']
    }
  }
}

// 🧬 PHASE 1.3: Lifecycle Management
const FURNITURE_LIFECYCLE_CODES = {
  status_workflow: {
    sales_order: ['draft', 'submitted', 'approved', 'in_production', 'ready_to_ship', 'shipped', 'delivered', 'closed'],
    manufacture_order: ['planned', 'released', 'in_progress', 'quality_check', 'completed', 'closed'],
    quality_check: ['scheduled', 'in_progress', 'passed', 'failed', 'rework_required', 'approved'],
    shipment: ['planned', 'picked', 'packed', 'shipped', 'in_transit', 'delivered', 'confirmed']
  },
  
  failure_codes: {
    material_shortage: 'FAIL.FURN.MATERIAL.SHORTAGE.V1',
    quality_defect: 'FAIL.FURN.QUALITY.DEFECT.V1', 
    equipment_failure: 'FAIL.FURN.EQUIPMENT.FAILURE.V1',
    delivery_delay: 'FAIL.FURN.DELIVERY.DELAY.V1',
    customer_cancellation: 'FAIL.FURN.CUSTOMER.CANCEL.V1',
    supplier_delay: 'FAIL.FURN.SUPPLIER.DELAY.V1'
  }
}

// Registry Management Functions
async function initializeFurnitureSmartCodeRegistry(organizationId) {
  console.log('\n🧬 PHASE 1: Initializing Furniture Smart Code Registry')
  console.log('='.repeat(60))
  
  if (!organizationId) {
    console.error('❌ Organization ID required')
    return false
  }

  try {
    // Create registry tracking entity
    const registryEntity = await createRegistryEntity(organizationId)
    
    if (registryEntity) {
      console.log('✅ Smart Code Registry entity created')
      
      // Store domain coverage
      await storeDomainCoverage(organizationId, registryEntity.id)
      console.log('✅ Domain coverage definitions stored')
      
      // Store entity smart codes
      await storeEntitySmartCodes(organizationId, registryEntity.id)
      console.log('✅ Entity smart codes registered')
      
      // Store transaction smart codes  
      await storeTransactionSmartCodes(organizationId, registryEntity.id)
      console.log('✅ Transaction smart codes registered')
      
      // Store UCR rule smart codes
      await storeUCRSmartCodes(organizationId, registryEntity.id)
      console.log('✅ UCR rule smart codes registered')
      
      // Store lifecycle codes
      await storeLifecycleCodes(organizationId, registryEntity.id)
      console.log('✅ Lifecycle management codes stored')
      
      console.log('\n🎉 Furniture Smart Code Registry initialization complete!')
      console.log(`Registry ID: ${registryEntity.id}`)
      
      return registryEntity.id
    }
    
  } catch (error) {
    console.error('❌ Registry initialization failed:', error.message)
    return false
  }
}

async function createRegistryEntity(organizationId) {
  const { data, error } = await supabase
    .from('core_entities')
    .insert({
      organization_id: organizationId,
      entity_type: 'smart_code_registry',
      entity_name: 'Furniture Industry Smart Code Registry',
      entity_code: 'FURN-SMART-CODE-REGISTRY',
      smart_code: 'HERA.IND.FURN.REGISTRY.MASTER.V1',
      status: 'active',
      metadata: {
        registry_type: 'furniture_industry',
        version: '1.0',
        created_by: 'phase_1_implementation',
        domain_coverage: Object.keys(FURNITURE_DOMAIN_COVERAGE),
        total_smart_codes: Object.keys(FURNITURE_SMART_CODE_REGISTRY.entities).length + 
                          Object.keys(FURNITURE_SMART_CODE_REGISTRY.transactions).length +
                          Object.keys(FURNITURE_SMART_CODE_REGISTRY.ucr_rules).length
      }
    })
    .select()
    .single()

  if (error) {
    console.error('Failed to create registry entity:', error)
    return null
  }

  return data
}

async function storeDomainCoverage(organizationId, registryId) {
  for (const [key, domain] of Object.entries(FURNITURE_DOMAIN_COVERAGE)) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: organizationId,
        entity_id: registryId,
        field_name: `domain_${key}`,
        field_value_json: JSON.stringify(domain),
        smart_code: `${domain.smart_code_family}.DEFINITION.V1`,
        field_category: 'domain_coverage'
      })
  }
}

async function storeEntitySmartCodes(organizationId, registryId) {
  for (const [smartCode, definition] of Object.entries(FURNITURE_SMART_CODE_REGISTRY.entities)) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: organizationId,
        entity_id: registryId,
        field_name: smartCode,
        field_value_json: JSON.stringify(definition),
        smart_code: 'HERA.IND.FURN.REGISTRY.ENTITY.V1',
        field_category: 'entity_smart_codes'
      })
  }
}

async function storeTransactionSmartCodes(organizationId, registryId) {
  for (const [smartCode, definition] of Object.entries(FURNITURE_SMART_CODE_REGISTRY.transactions)) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: organizationId,
        entity_id: registryId,
        field_name: smartCode,
        field_value_json: JSON.stringify(definition),
        smart_code: 'HERA.IND.FURN.REGISTRY.TRANSACTION.V1',
        field_category: 'transaction_smart_codes'
      })
  }
}

async function storeUCRSmartCodes(organizationId, registryId) {
  for (const [smartCode, definition] of Object.entries(FURNITURE_SMART_CODE_REGISTRY.ucr_rules)) {
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: organizationId,
        entity_id: registryId,
        field_name: smartCode,
        field_value_json: JSON.stringify(definition),
        smart_code: 'HERA.IND.FURN.REGISTRY.UCR.V1',
        field_category: 'ucr_smart_codes'
      })
  }
}

async function storeLifecycleCodes(organizationId, registryId) {
  await supabase
    .from('core_dynamic_data')
    .insert({
      organization_id: organizationId,
      entity_id: registryId,
      field_name: 'lifecycle_management',
      field_value_json: JSON.stringify(FURNITURE_LIFECYCLE_CODES),
      smart_code: 'HERA.IND.FURN.REGISTRY.LIFECYCLE.V1',
      field_category: 'lifecycle_codes'
    })
}

// Command line interface
const commands = {
  async init(args) {
    const orgId = args.org || process.env.DEFAULT_ORGANIZATION_ID
    
    if (!orgId) {
      console.error('❌ Organization ID required')
      console.log('Usage: node furniture-smart-codes-registry.js init --org <org-id>')
      return
    }

    const registryId = await initializeFurnitureSmartCodeRegistry(orgId)
    
    if (registryId) {
      console.log('\n📊 Registry Statistics:')
      console.log(`  Entity Smart Codes: ${Object.keys(FURNITURE_SMART_CODE_REGISTRY.entities).length}`)
      console.log(`  Transaction Smart Codes: ${Object.keys(FURNITURE_SMART_CODE_REGISTRY.transactions).length}`)
      console.log(`  UCR Rule Smart Codes: ${Object.keys(FURNITURE_SMART_CODE_REGISTRY.ucr_rules).length}`)
      console.log(`  Domain Coverage: ${Object.keys(FURNITURE_DOMAIN_COVERAGE).length} business areas`)
      
      console.log('\n🚀 Next Steps:')
      console.log('  1. Run Phase 3: Entity Catalog implementation')
      console.log('  2. Define UCR rules for each smart code')
      console.log('  3. Create seed data packs for furniture entities')
    }
  },

  async list(args) {
    console.log('\n🧬 HERA Furniture Smart Code Registry')
    console.log('='.repeat(60))
    
    if (args.entities || args.all) {
      console.log('\n📦 ENTITY SMART CODES:')
      Object.entries(FURNITURE_SMART_CODE_REGISTRY.entities).forEach(([code, def]) => {
        console.log(`  ${code}`)
        console.log(`    ${def.description}`)
        console.log(`    Example: ${def.use_case}`)
        console.log('')
      })
    }
    
    if (args.transactions || args.all) {
      console.log('\n📋 TRANSACTION SMART CODES:')
      Object.entries(FURNITURE_SMART_CODE_REGISTRY.transactions).forEach(([code, def]) => {
        console.log(`  ${code}`)
        console.log(`    ${def.description}`)
        console.log(`    GL Impact: ${def.gl_impact}`)
        console.log('')
      })
    }
    
    if (args.ucr || args.all) {
      console.log('\n⚡ UCR RULE SMART CODES:')
      Object.entries(FURNITURE_SMART_CODE_REGISTRY.ucr_rules).forEach(([code, def]) => {
        console.log(`  ${code}`)
        console.log(`    ${def.description}`)
        console.log(`    Examples: ${def.examples.join(', ')}`)
        console.log('')
      })
    }
  },

  help() {
    console.log('\n🧬 HERA Furniture Smart Code Registry CLI')
    console.log('='.repeat(50))
    console.log('\nCommands:')
    console.log('  init --org <org-id>     Initialize furniture smart code registry')
    console.log('  list [--entities] [--transactions] [--ucr] [--all]')
    console.log('                          List registered smart codes')
    console.log('  help                    Show this help')
    console.log('')
    console.log('Examples:')
    console.log('  node furniture-smart-codes-registry.js init --org your-org-uuid')
    console.log('  node furniture-smart-codes-registry.js list --all')
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