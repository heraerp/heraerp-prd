#!/usr/bin/env node

/**
 * HERA DNA Setup for Kochi Ice Cream Manufacturing
 * Organization ID: 3712cf80-99c8-4ee2-a5fb-98b69715d191
 * 
 * This script sets up complete ice cream manufacturing with:
 * - Two retail outlets
 * - Manufacturing facility
 * - Global COA with Indian GST
 * - Complete relationships structure
 * - Digital Accountant integration
 */

require('dotenv').config({ path: '../.env' })
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Organization details
const ORG_ID = '1471e87b-b27e-42ef-8192-343cc5e0d656'
const ORG_CODE = 'ORG.COCHIN.ICECREAM'

// We'll work directly with Supabase for now

async function setupKochiIceCream() {
  console.log('🍦 Setting up Kochi Ice Cream Manufacturing with HERA DNA...')
  
  try {
    // Step 1: Update organization with complete metadata
    console.log('\n📋 Step 1: Configuring organization...')
    await updateOrganization()
    
    // Step 2: Create relationship types for ice cream industry
    console.log('\n🔗 Step 2: Setting up relationship types...')
    await createRelationshipTypes()
    
    // Step 3: Setup Global COA with Indian accounting standards
    console.log('\n📊 Step 3: Setting up Chart of Accounts...')
    await setupChartOfAccounts()
    
    // Step 4: Create master entities (locations, products, suppliers)
    console.log('\n🏭 Step 4: Creating master entities...')
    await createMasterEntities()
    
    // Step 5: Setup product relationships (BOM, quality standards)
    console.log('\n🧬 Step 5: Creating product relationships...')
    await setupProductRelationships()
    
    // Step 6: Configure Digital Accountant for ice cream
    console.log('\n🤖 Step 6: Configuring Digital Accountant...')
    await configureDigitalAccountant()
    
    console.log('\n✅ Kochi Ice Cream setup complete!')
    console.log('\n📈 Next steps:')
    console.log('1. Review the created entities and relationships')
    console.log('2. Test transaction creation (production batch, sales)')
    console.log('3. Verify Digital Accountant journal automation')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

async function updateOrganization() {
  const { error } = await supabase
    .from('core_organizations')
    .update({
      organization_code: ORG_CODE,
      organization_name: 'Kochi Ice Cream Manufacturing',
      organization_type: 'food_manufacturing',
      industry_classification: 'dairy_ice_cream',
      settings: {
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        fiscal_year_start: 'April',
        gst_registered: true,
        gstin: '32AABCK1234L1Z5',
        food_license: 'FSSAI-10014051000123'
      },
      ai_insights: {
        business_model: 'manufacturing_retail',
        outlets_count: 2,
        product_categories: ['ice_cream', 'frozen_desserts'],
        compliance_requirements: ['FSSAI', 'GST', 'ISO22000']
      }
    })
    .eq('id', ORG_ID)
    
  if (error) throw error
  console.log('✓ Organization configured')
}

async function createRelationshipTypes() {
  const relationshipTypes = [
    // Manufacturing relationships
    { code: 'RECIPE_COMPONENT', name: 'Recipe Component', category: 'manufacturing' },
    { code: 'BATCH_PRODUCED_FROM', name: 'Batch Produced From Recipe', category: 'manufacturing' },
    { code: 'LOT_CONSUMED_IN', name: 'Lot Consumed in Batch', category: 'traceability' },
    { code: 'LOT_PRODUCED_AS', name: 'Lot Produced as Output', category: 'traceability' },
    
    // Quality relationships
    { code: 'QC_TEST_FOR', name: 'QC Test for Product/Lot', category: 'quality' },
    { code: 'QC_STANDARD_FOR', name: 'QC Standard for Product', category: 'quality' },
    
    // Location relationships
    { code: 'STORED_AT', name: 'Inventory Stored at Location', category: 'inventory' },
    { code: 'TRANSFERRED_FROM_TO', name: 'Stock Transfer Between Locations', category: 'inventory' },
    
    // Supply chain relationships
    { code: 'SUPPLIED_BY', name: 'Material Supplied by Vendor', category: 'procurement' },
    { code: 'OUTLET_OF', name: 'Retail Outlet of Organization', category: 'organization' }
  ]
  
  for (const relType of relationshipTypes) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'relationship_type',
        entity_code: relType.code,
        entity_name: relType.name,
        smart_code: `HERA.FOODDAIRY.REL.${relType.code}.V1`,
        metadata: {
          category: relType.category,
          bi_directional: false,
          cardinality: 'many_to_many'
        },
        status: 'active'
      })
      
    if (error && !error.message.includes('duplicate')) {
      console.error(`Failed to create relationship type ${relType.code}:`, error)
    }
  }
  
  console.log('✓ Relationship types created')
}

async function setupChartOfAccounts() {
  // Use HERA's universal COA with Indian localization
  const coaSetup = {
    organizationId: ORG_ID,
    industry: 'manufacturing',
    country: 'IN',
    features: {
      gst_enabled: true,
      multi_location: true,
      cost_centers: ['PLANT', 'OUTLET_MGROAD', 'OUTLET_FORTKOCHI'],
      inventory_valuation: 'FIFO'
    }
  }
  
  // Create base COA structure
  const accountGroups = [
    // Assets
    { code: '1000', name: 'Current Assets', type: 'asset', parent: null },
    { code: '1100', name: 'Cash and Bank', type: 'asset', parent: '1000' },
    { code: '1200', name: 'Accounts Receivable', type: 'asset', parent: '1000' },
    { code: '1300', name: 'Inventory', type: 'asset', parent: '1000' },
    { code: '1310', name: 'Raw Material Inventory', type: 'asset', parent: '1300' },
    { code: '1320', name: 'WIP Inventory', type: 'asset', parent: '1300' },
    { code: '1330', name: 'Finished Goods Inventory', type: 'asset', parent: '1300' },
    { code: '1400', name: 'GST Input Credit', type: 'asset', parent: '1000' },
    
    // Fixed Assets
    { code: '1500', name: 'Fixed Assets', type: 'asset', parent: null },
    { code: '1510', name: 'Plant and Machinery', type: 'asset', parent: '1500' },
    { code: '1520', name: 'Furniture and Fixtures', type: 'asset', parent: '1500' },
    
    // Liabilities
    { code: '2000', name: 'Current Liabilities', type: 'liability', parent: null },
    { code: '2100', name: 'Accounts Payable', type: 'liability', parent: '2000' },
    { code: '2200', name: 'GST Payable', type: 'liability', parent: '2000' },
    { code: '2210', name: 'GST Output', type: 'liability', parent: '2200' },
    
    // Equity
    { code: '3000', name: 'Equity', type: 'equity', parent: null },
    { code: '3100', name: 'Share Capital', type: 'equity', parent: '3000' },
    { code: '3200', name: 'Retained Earnings', type: 'equity', parent: '3000' },
    
    // Revenue
    { code: '4000', name: 'Revenue', type: 'revenue', parent: null },
    { code: '4100', name: 'Sales Revenue', type: 'revenue', parent: '4000' },
    { code: '4110', name: 'Ice Cream Sales - Retail', type: 'revenue', parent: '4100' },
    { code: '4120', name: 'Ice Cream Sales - Wholesale', type: 'revenue', parent: '4100' },
    
    // COGS
    { code: '5000', name: 'Cost of Goods Sold', type: 'expense', parent: null },
    { code: '5100', name: 'Material Cost', type: 'expense', parent: '5000' },
    { code: '5200', name: 'Production Labor', type: 'expense', parent: '5000' },
    { code: '5300', name: 'Manufacturing Overhead', type: 'expense', parent: '5000' },
    
    // Operating Expenses
    { code: '6000', name: 'Operating Expenses', type: 'expense', parent: null },
    { code: '6100', name: 'Selling Expenses', type: 'expense', parent: '6000' },
    { code: '6200', name: 'Administrative Expenses', type: 'expense', parent: '6000' },
    { code: '6300', name: 'Cold Storage Expenses', type: 'expense', parent: '6000' },
    
    // Variance Accounts
    { code: '5800', name: 'Manufacturing Variances', type: 'expense', parent: '5000' },
    { code: '5810', name: 'Material Price Variance', type: 'expense', parent: '5800' },
    { code: '5820', name: 'Yield Variance', type: 'expense', parent: '5800' },
    { code: '5830', name: 'Wastage and Spoilage', type: 'expense', parent: '5800' }
  ]
  
  for (const account of accountGroups) {
    const { error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'gl_account',
        entity_code: account.code,
        entity_name: account.name,
        smart_code: `HERA.FIN.GL.${account.type.toUpperCase()}.${account.code}.V1`,
        metadata: {
          account_type: account.type,
          parent_code: account.parent,
          currency: 'INR',
          normal_balance: ['asset', 'expense'].includes(account.type) ? 'debit' : 'credit',
          financial_statement: getFinancialStatement(account.type),
          gst_applicable: ['4110', '4120'].includes(account.code)
        },
        status: 'active'
      })
      
    if (error && !error.message.includes('duplicate')) {
      console.error(`Failed to create GL account ${account.code}:`, error)
    }
  }
  
  console.log('✓ Chart of Accounts created with GST structure')
}

async function createMasterEntities() {
  // 1. Create Locations
  const locations = [
    {
      code: 'PLANT-KOCHI',
      name: 'Kochi Manufacturing Plant',
      type: 'manufacturing_plant',
      smart_code: 'HERA.FOODDAIRY.LOC.PLANT.KOCHI.V1',
      metadata: {
        address: 'Industrial Area, Kalamassery, Kochi 683104',
        capacity: '5000L/day',
        storage_temp: '-25°C',
        departments: ['production', 'quality', 'warehouse']
      }
    },
    {
      code: 'OUTLET-MGROAD',
      name: 'MG Road Ice Cream Outlet',
      type: 'retail_outlet',
      smart_code: 'HERA.FOODDAIRY.LOC.OUTLET.MGROAD.V1',
      metadata: {
        address: 'MG Road, Ernakulam, Kochi 682011',
        storage_capacity: '500L',
        pos_terminals: 2,
        seating_capacity: 20
      }
    },
    {
      code: 'OUTLET-FORTKOCHI',
      name: 'Fort Kochi Ice Cream Outlet',
      type: 'retail_outlet',
      smart_code: 'HERA.FOODDAIRY.LOC.OUTLET.FORTKOCHI.V1',
      metadata: {
        address: 'Princess Street, Fort Kochi 682001',
        storage_capacity: '300L',
        pos_terminals: 1,
        tourist_area: true
      }
    }
  ]
  
  const locationIds = {}
  
  for (const location of locations) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'location',
        entity_code: location.code,
        entity_name: location.name,
        smart_code: location.smart_code,
        metadata: location.metadata,
        status: 'active'
      })
      .select()
      .single()
      
    if (error) {
      console.error(`Failed to create location ${location.code}:`, error)
    } else {
      locationIds[location.code] = data.id
      
      // Create relationship to organization
      await createRelationship(
        data.id,
        ORG_ID,
        'OUTLET_OF',
        `HERA.FOODDAIRY.REL.LOCATION.${location.type.toUpperCase()}.V1`
      )
    }
  }
  
  // 2. Create Products/SKUs
  const products = [
    {
      code: 'SKU-VAN-500ML',
      name: 'Vanilla Ice Cream 500ml Tub',
      category: 'ice_cream',
      smart_code: 'HERA.FOODDAIRY.PROD.ICE.VANILLA.500ML.V1',
      metadata: {
        flavor: 'vanilla',
        size: '500ml',
        unit: 'TUB',
        shelf_life_days: 180,
        storage_temp: '-18°C to -20°C',
        mrp: 150.00,
        gst_rate: 18,
        hsn_code: '2105'
      }
    },
    {
      code: 'SKU-MANGO-100ML',
      name: 'Alphonso Mango Cup 100ml',
      category: 'ice_cream',
      smart_code: 'HERA.FOODDAIRY.PROD.ICE.MANGO.100ML.V1',
      metadata: {
        flavor: 'mango',
        size: '100ml',
        unit: 'CUP',
        shelf_life_days: 180,
        seasonal: true,
        mrp: 50.00,
        gst_rate: 18
      }
    },
    {
      code: 'SKU-CHOCO-CONE',
      name: 'Chocolate Cone',
      category: 'ice_cream',
      smart_code: 'HERA.FOODDAIRY.PROD.ICE.CHOCOLATE.CONE.V1',
      metadata: {
        flavor: 'chocolate',
        type: 'cone',
        unit: 'PIECE',
        shelf_life_days: 90,
        mrp: 40.00,
        gst_rate: 18
      }
    }
  ]
  
  for (const product of products) {
    const { data, error } = await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'product',
        entity_code: product.code,
        entity_name: product.name,
        smart_code: product.smart_code,
        metadata: product.metadata,
        status: 'active'
      })
      .select()
      .single()
      
    if (!error && data) {
      // Add dynamic fields for costing
      await addDynamicField(data.id, 'STD_MAT_COST', Math.round(product.metadata.mrp * 0.3), 'number')
      await addDynamicField(data.id, 'STD_LABOR_COST', Math.round(product.metadata.mrp * 0.1), 'number')
      await addDynamicField(data.id, 'STD_OVERHEAD_COST', Math.round(product.metadata.mrp * 0.15), 'number')
    }
  }
  
  // 3. Create Raw Materials
  const rawMaterials = [
    {
      code: 'RM-MILK',
      name: 'Fresh Milk',
      smart_code: 'HERA.FOODDAIRY.RM.DAIRY.MILK.V1',
      metadata: {
        unit: 'LITER',
        min_fat_content: 3.5,
        supplier_category: 'dairy_farm'
      }
    },
    {
      code: 'RM-CREAM',
      name: 'Fresh Cream',
      smart_code: 'HERA.FOODDAIRY.RM.DAIRY.CREAM.V1',
      metadata: {
        unit: 'LITER',
        fat_content: 35,
        storage_temp: '2-5°C'
      }
    },
    {
      code: 'RM-SUGAR',
      name: 'Sugar',
      smart_code: 'HERA.FOODDAIRY.RM.INGREDIENT.SUGAR.V1',
      metadata: {
        unit: 'KG',
        grade: 'food_grade'
      }
    },
    {
      code: 'RM-MANGO-PULP',
      name: 'Alphonso Mango Pulp',
      smart_code: 'HERA.FOODDAIRY.RM.FRUIT.MANGO.V1',
      metadata: {
        unit: 'KG',
        brix_min: 16,
        seasonal: true,
        origin: 'Ratnagiri'
      }
    }
  ]
  
  for (const rm of rawMaterials) {
    await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'raw_material',
        entity_code: rm.code,
        entity_name: rm.name,
        smart_code: rm.smart_code,
        metadata: rm.metadata,
        status: 'active'
      })
  }
  
  // 4. Create Key Suppliers
  const suppliers = [
    {
      code: 'SUPP-DAIRY-001',
      name: 'Kerala Dairy Farms',
      smart_code: 'HERA.FOODDAIRY.SUPP.DAIRY.KDF.V1',
      metadata: {
        supplier_type: 'dairy',
        gst_no: '32AABCK5678M1Z5',
        payment_terms: 'NET15',
        quality_rating: 4.5
      }
    },
    {
      code: 'SUPP-FRUIT-001',
      name: 'Konkan Fruit Processors',
      smart_code: 'HERA.FOODDAIRY.SUPP.FRUIT.KFP.V1',
      metadata: {
        supplier_type: 'fruit_processor',
        speciality: 'mango_pulp',
        seasonal_supplier: true
      }
    }
  ]
  
  for (const supplier of suppliers) {
    await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'supplier',
        entity_code: supplier.code,
        entity_name: supplier.name,
        smart_code: supplier.smart_code,
        metadata: supplier.metadata,
        status: 'active'
      })
  }
  
  console.log('✓ Master entities created (locations, products, materials, suppliers)')
}

async function setupProductRelationships() {
  // Create recipes (BOM) for Vanilla Ice Cream
  const vanillaRecipe = await supabase
    .from('core_entities')
    .insert({
      organization_id: ORG_ID,
      entity_type: 'recipe',
      entity_code: 'RCP-VANILLA-V1',
      entity_name: 'Vanilla Ice Cream Recipe V1',
      smart_code: 'HERA.FOODDAIRY.MFG.RECIPE.VANILLA.V1',
      metadata: {
        batch_size: 100,
        batch_unit: 'LITER',
        yield_expected: 145, // With overrun
        version: 1
      },
      status: 'active'
    })
    .select()
    .single()
  
  if (vanillaRecipe.data) {
    // Get entity IDs for ingredients
    const { data: milk } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'RM-MILK')
      .single()
      
    const { data: cream } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'RM-CREAM')
      .single()
      
    const { data: sugar } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', ORG_ID)
      .eq('entity_code', 'RM-SUGAR')
      .single()
    
    // Create recipe component relationships
    if (milk) {
      await createRelationship(
        milk.id,
        vanillaRecipe.data.id,
        'RECIPE_COMPONENT',
        'HERA.FOODDAIRY.BOM.COMPONENT.MILK.V1',
        { quantity: 60, unit: 'LITER', percentage: 60 }
      )
    }
    
    if (cream) {
      await createRelationship(
        cream.id,
        vanillaRecipe.data.id,
        'RECIPE_COMPONENT',
        'HERA.FOODDAIRY.BOM.COMPONENT.CREAM.V1',
        { quantity: 25, unit: 'LITER', percentage: 25 }
      )
    }
    
    if (sugar) {
      await createRelationship(
        sugar.id,
        vanillaRecipe.data.id,
        'RECIPE_COMPONENT',
        'HERA.FOODDAIRY.BOM.COMPONENT.SUGAR.V1',
        { quantity: 15, unit: 'KG', percentage: 15 }
      )
    }
  }
  
  // Create Quality Standards
  const qualityStandard = await supabase
    .from('core_entities')
    .insert({
      organization_id: ORG_ID,
      entity_type: 'quality_standard',
      entity_code: 'QC-STD-ICECREAM',
      entity_name: 'Ice Cream Quality Standards FSSAI',
      smart_code: 'HERA.FOODDAIRY.QC.STANDARD.FSSAI.V1',
      metadata: {
        standard_type: 'finished_product',
        regulatory_body: 'FSSAI',
        parameters: {
          fat_content_min: 10,
          total_solids_min: 36,
          coliform_max: 10,
          tpc_max: 25000
        }
      },
      status: 'active'
    })
    .select()
    .single()
  
  console.log('✓ Product relationships and recipes configured')
}

async function configureDigitalAccountant() {
  // Configure auto-journal rules for ice cream industry
  const journalRules = [
    {
      transaction_type: 'goods_receipt',
      smart_code_pattern: 'HERA.FOODDAIRY.PROC.GRN.*',
      posting_rules: {
        debit: '1310', // Raw Material Inventory
        credit: '2100' // Accounts Payable
      }
    },
    {
      transaction_type: 'production_consumption',
      smart_code_pattern: 'HERA.FOODDAIRY.MFG.BATCH.*',
      posting_rules: {
        debit: '1320', // WIP Inventory
        credit: '1310' // Raw Material Inventory
      }
    },
    {
      transaction_type: 'production_completion',
      smart_code_pattern: 'HERA.FOODDAIRY.MFG.COMPLETE.*',
      posting_rules: {
        debit: '1330', // Finished Goods
        credit: '1320' // WIP Inventory
      }
    },
    {
      transaction_type: 'pos_sale',
      smart_code_pattern: 'HERA.FOODDAIRY.POS.SALE.*',
      posting_rules: {
        debit: ['1100', '5100'], // Cash, COGS
        credit: ['4110', '2210', '1330'] // Sales, GST Output, FG Inventory
      }
    }
  ]
  
  // Store rules as entities
  for (const rule of journalRules) {
    await supabase
      .from('core_entities')
      .insert({
        organization_id: ORG_ID,
        entity_type: 'journal_rule',
        entity_code: `JRULE-${rule.transaction_type.toUpperCase()}`,
        entity_name: `Auto Journal Rule - ${rule.transaction_type}`,
        smart_code: 'HERA.FIN.JOURNAL.RULE.V1',
        metadata: rule,
        status: 'active'
      })
  }
  
  console.log('✓ Digital Accountant configured for ice cream industry')
}

// Helper functions
async function createRelationship(fromEntityId, toEntityId, relationshipType, smartCode, metadata = {}) {
  const { error } = await supabase
    .from('core_relationships')
    .insert({
      organization_id: ORG_ID,
      from_entity_id: fromEntityId,
      to_entity_id: toEntityId,
      relationship_type: relationshipType,
      relationship_direction: 'forward',
      relationship_strength: 1.0,
      relationship_data: metadata,
      smart_code: smartCode,
      is_active: true,
      effective_date: new Date().toISOString()
    })
    
  if (error && !error.message.includes('duplicate')) {
    console.error('Relationship creation error:', error)
  }
}

async function addDynamicField(entityId, fieldName, value, fieldType = 'number') {
  const fieldData = {
    organization_id: ORG_ID,
    entity_id: entityId,
    field_name: fieldName,
    field_type: fieldType,
    smart_code: `HERA.FOODDAIRY.DYN.${fieldName}.V1`,
    is_searchable: true,
    is_required: false
  }
  
  // Set the appropriate value field
  switch (fieldType) {
    case 'number':
      fieldData.field_value_number = value
      break
    case 'text':
      fieldData.field_value_text = value
      break
    case 'boolean':
      fieldData.field_value_boolean = value
      break
    case 'date':
      fieldData.field_value_date = value
      break
    case 'json':
      fieldData.field_value_json = value
      break
  }
  
  const { error } = await supabase
    .from('core_dynamic_data')
    .insert(fieldData)
    
  if (error && !error.message.includes('duplicate')) {
    console.error(`Dynamic field error for ${fieldCode}:`, error)
  }
}

function getFinancialStatement(accountType) {
  switch (accountType) {
    case 'asset':
    case 'liability':
    case 'equity':
      return 'balance_sheet'
    case 'revenue':
    case 'expense':
      return 'income_statement'
    default:
      return 'other'
  }
}

// Run the setup
if (require.main === module) {
  setupKochiIceCream()
}

module.exports = { setupKochiIceCream }