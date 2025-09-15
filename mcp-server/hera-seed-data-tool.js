#!/usr/bin/env node

/**
 * HERA Universal Seed Data Tool
 * 
 * MCP-compatible tool for creating seed data across all HERA modules
 * 
 * Usage:
 * node hera-seed-data-tool.js list                    # List available seed templates
 * node hera-seed-data-tool.js create [template]       # Create seed data from template
 * node hera-seed-data-tool.js status                  # Check seed data status
 * 
 * Examples:
 * node hera-seed-data-tool.js create furniture-hr
 * node hera-seed-data-tool.js create salon-customers
 * node hera-seed-data-tool.js create restaurant-menu
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const { v4: uuidv4 } = require('uuid')

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Seed templates registry
const SEED_TEMPLATES = {
  'furniture-hr': {
    name: 'Furniture HR Data',
    description: 'Employee records with salaries, departments, and attendance',
    organization: 'f0af4ced-9d12-4a55-a649-b484368db249',
    module: 'furniture',
    entities: ['employee', 'department', 'position'],
    transactions: ['attendance', 'leave_request']
  },
  'furniture-inventory': {
    name: 'Furniture Inventory',
    description: 'Raw materials, finished goods, and stock movements',
    organization: 'f0af4ced-9d12-4a55-a649-b484368db249',
    module: 'furniture',
    entities: ['product', 'material', 'warehouse'],
    transactions: ['stock_movement', 'goods_receipt']
  },
  'furniture-production': {
    name: 'Furniture Production',
    description: 'Production orders, BOMs, and work-in-progress',
    organization: 'f0af4ced-9d12-4a55-a649-b484368db249',
    module: 'furniture',
    entities: ['bom', 'work_center'],
    transactions: ['production_order', 'material_consumption']
  },
  'salon-customers': {
    name: 'Salon Customers',
    description: 'Customer profiles with preferences and history',
    organization: '3c9e3f3f-9b1f-4f4f-8f4f-9f3f3f3f3f3f', // Update with actual salon org
    module: 'salon',
    entities: ['customer'],
    transactions: ['appointment', 'service']
  },
  'restaurant-menu': {
    name: 'Restaurant Menu',
    description: 'Menu items, categories, and pricing',
    organization: '123e4567-e89b-12d3-a456-426614174000', // Update with actual restaurant org
    module: 'restaurant',
    entities: ['menu_item', 'category'],
    transactions: ['order', 'payment']
  }
}

/**
 * List available seed templates
 */
async function listTemplates() {
  console.log('\n📋 Available Seed Templates:\n')
  
  for (const [key, template] of Object.entries(SEED_TEMPLATES)) {
    console.log(`${key}`)
    console.log(`  Name: ${template.name}`)
    console.log(`  Description: ${template.description}`)
    console.log(`  Module: ${template.module}`)
    console.log(`  Entities: ${template.entities.join(', ')}`)
    console.log(`  Transactions: ${template.transactions.join(', ')}\n`)
  }
}

/**
 * Check seed data status
 */
async function checkStatus() {
  console.log('\n📊 Seed Data Status:\n')
  
  for (const [key, template] of Object.entries(SEED_TEMPLATES)) {
    console.log(`Checking ${key}...`)
    
    // Count entities
    const entityCounts = {}
    for (const entityType of template.entities) {
      const { count } = await supabase
        .from('core_entities')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', template.organization)
        .eq('entity_type', entityType)
      
      entityCounts[entityType] = count || 0
    }
    
    // Count transactions
    const transactionCounts = {}
    for (const txnType of template.transactions) {
      const { count } = await supabase
        .from('universal_transactions')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', template.organization)
        .eq('transaction_type', txnType)
      
      transactionCounts[txnType] = count || 0
    }
    
    console.log(`  Entities: ${JSON.stringify(entityCounts)}`)
    console.log(`  Transactions: ${JSON.stringify(transactionCounts)}\n`)
  }
}

/**
 * Create seed data from template
 */
async function createFromTemplate(templateKey) {
  const template = SEED_TEMPLATES[templateKey]
  
  if (!template) {
    console.error(`❌ Template '${templateKey}' not found`)
    console.log('Use "node hera-seed-data-tool.js list" to see available templates')
    return
  }
  
  console.log(`\n🌱 Creating seed data: ${template.name}`)
  console.log(`📍 Organization: ${template.organization}`)
  console.log(`🔧 Module: ${template.module}\n`)
  
  switch (templateKey) {
    case 'furniture-hr':
      await createFurnitureHR(template)
      break
    case 'furniture-inventory':
      await createFurnitureInventory(template)
      break
    case 'furniture-production':
      await createFurnitureProduction(template)
      break
    default:
      console.log(`❌ Template '${templateKey}' not yet implemented`)
  }
}

/**
 * Create Furniture HR seed data
 */
async function createFurnitureHR(template) {
  console.log('👥 Creating HR seed data...')
  
  // Get existing employees
  const { data: employees } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', template.organization)
    .eq('entity_type', 'employee')
  
  console.log(`Found ${employees?.length || 0} existing employees`)
  
  if (employees && employees.length > 0) {
    // Create dynamic fields for employees
    const dynamicFields = []
    const employeeData = {
      salary: [25000, 30000, 35000, 40000, 50000, 60000, 75000],
      departments: ['Production', 'Management', 'Quality Control', 'Sales', 'Administration']
    }
    
    for (const employee of employees.slice(0, 10)) {
      // Salary
      dynamicFields.push({
        id: uuidv4(),
        organization_id: template.organization,
        entity_id: employee.id,
        field_name: 'salary',
        field_value_number: employeeData.salary[Math.floor(Math.random() * employeeData.salary.length)],
        smart_code: 'HERA.FURNITURE.HR.FIELD.SALARY.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Phone
      dynamicFields.push({
        id: uuidv4(),
        organization_id: template.organization,
        entity_id: employee.id,
        field_name: 'phone',
        field_value_text: `+91 ${Math.floor(Math.random() * 9000000000) + 1000000000}`,
        smart_code: 'HERA.FURNITURE.HR.FIELD.PHONE.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      
      // Email
      dynamicFields.push({
        id: uuidv4(),
        organization_id: template.organization,
        entity_id: employee.id,
        field_name: 'email',
        field_value_text: employee.entity_name.toLowerCase().replace(/\s+/g, '.') + '@keralafurniture.com',
        smart_code: 'HERA.FURNITURE.HR.FIELD.EMAIL.v1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    if (dynamicFields.length > 0) {
      const { error } = await supabase
        .from('core_dynamic_data')
        .insert(dynamicFields)
      
      if (!error) {
        console.log(`✅ Created ${dynamicFields.length} dynamic fields`)
      }
    }
    
    // Create attendance records
    const attendanceRecords = []
    const today = new Date()
    
    for (let i = 0; i < 5; i++) {
      const employee = employees[i]
      if (!employee) break
      
      attendanceRecords.push({
        id: uuidv4(),
        organization_id: template.organization,
        transaction_type: 'attendance',
        transaction_code: `ATT-${today.toISOString().split('T')[0]}-${employee.entity_code}-${Date.now()}`,
        transaction_date: today.toISOString(),
        source_entity_id: employee.id,
        smart_code: 'HERA.FURNITURE.HR.TXN.ATTENDANCE.v1',
        metadata: {
          check_in: '09:00',
          check_out: '18:00',
          status: 'present',
          hours_worked: 9
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
    }
    
    if (attendanceRecords.length > 0) {
      const { error } = await supabase
        .from('universal_transactions')
        .insert(attendanceRecords)
      
      if (!error) {
        console.log(`✅ Created ${attendanceRecords.length} attendance records`)
      }
    }
  }
  
  console.log('✅ Furniture HR seed data created!')
}

/**
 * Create Furniture Inventory seed data
 */
async function createFurnitureInventory(template) {
  console.log('📦 Creating inventory seed data...')
  
  const materials = [
    { code: 'MAT-TEAK-001', name: 'Teak Wood Plank', unit: 'sqft', price: 250, stock: 500 },
    { code: 'MAT-ROSE-001', name: 'Rosewood Plank', unit: 'sqft', price: 300, stock: 300 },
    { code: 'MAT-PLY-001', name: 'Plywood Sheet', unit: 'sheet', price: 1500, stock: 100 },
    { code: 'MAT-FOAM-001', name: 'Foam Cushion', unit: 'piece', price: 500, stock: 200 },
    { code: 'MAT-FABRIC-001', name: 'Upholstery Fabric', unit: 'meter', price: 400, stock: 150 },
    { code: 'MAT-SCREW-001', name: 'Wood Screws', unit: 'box', price: 50, stock: 1000 },
    { code: 'MAT-GLUE-001', name: 'Wood Glue', unit: 'liter', price: 200, stock: 50 },
    { code: 'MAT-POLISH-001', name: 'Wood Polish', unit: 'liter', price: 300, stock: 75 }
  ]
  
  const materialEntities = materials.map(mat => ({
    id: uuidv4(),
    organization_id: template.organization,
    entity_type: 'material',
    entity_name: mat.name,
    entity_code: mat.code,
    smart_code: 'HERA.FURNITURE.INVENTORY.MATERIAL.RAW.v1',
    metadata: {
      unit_of_measure: mat.unit,
      unit_price: mat.price,
      material_type: 'raw_material'
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
  
  // Insert materials
  const { error: matError } = await supabase
    .from('core_entities')
    .insert(materialEntities)
  
  if (matError) {
    console.error('Error creating materials:', matError)
    return
  }
  
  console.log(`✅ Created ${materialEntities.length} material entities`)
  
  // Create stock levels as dynamic data
  const stockData = []
  materialEntities.forEach((mat, index) => {
    stockData.push({
      id: uuidv4(),
      organization_id: template.organization,
      entity_id: mat.id,
      field_name: 'current_stock',
      field_value_number: materials[index].stock,
      smart_code: 'HERA.FURNITURE.INVENTORY.FIELD.STOCK.v1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  })
  
  const { error: stockError } = await supabase
    .from('core_dynamic_data')
    .insert(stockData)
  
  if (stockError) {
    console.error('Error creating stock data:', stockError)
  } else {
    console.log(`✅ Created ${stockData.length} stock level records`)
  }
  
  // Create sample goods receipts
  const receipts = []
  for (let i = 0; i < 3; i++) {
    const material = materialEntities[i]
    receipts.push({
      id: uuidv4(),
      organization_id: template.organization,
      transaction_type: 'goods_receipt',
      transaction_code: `GR-2024-${1000 + i}`,
      transaction_date: new Date().toISOString(),
      target_entity_id: material.id,
      total_amount: materials[i].price * 50, // Receiving 50 units
      smart_code: 'HERA.FURNITURE.INVENTORY.TXN.GOODS_RECEIPT.v1',
      metadata: {
        quantity: 50,
        unit_price: materials[i].price,
        supplier: 'Kerala Timber Suppliers'
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    })
  }
  
  const { error: grError } = await supabase
    .from('universal_transactions')
    .insert(receipts)
  
  if (grError) {
    console.error('Error creating goods receipts:', grError)
  } else {
    console.log(`✅ Created ${receipts.length} goods receipt transactions`)
  }
  
  console.log('\n✅ Furniture inventory seed data created!')
}

/**
 * Create Furniture Production seed data
 */
async function createFurnitureProduction(template) {
  console.log('🏭 Creating production seed data...')
  
  // Get existing products
  const { data: products } = await supabase
    .from('core_entities')
    .select('*')
    .eq('organization_id', template.organization)
    .eq('entity_type', 'product')
    .limit(3)
  
  if (!products || products.length === 0) {
    console.log('❌ No products found. Please create products first.')
    return
  }
  
  // Create production orders
  const productionOrders = products.map((product, index) => ({
    id: uuidv4(),
    organization_id: template.organization,
    transaction_type: 'production_order',
    transaction_code: `PROD-2024-${2000 + index}`,
    transaction_date: new Date().toISOString(),
    target_entity_id: product.id,
    total_amount: 10, // Quantity to produce
    smart_code: 'HERA.FURNITURE.PRODUCTION.TXN.ORDER.v1',
    metadata: {
      status: index === 0 ? 'in_progress' : 'pending',
      planned_quantity: 10,
      completed_quantity: index === 0 ? 3 : 0,
      start_date: new Date().toISOString(),
      due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }))
  
  const { error } = await supabase
    .from('universal_transactions')
    .insert(productionOrders)
  
  if (error) {
    console.error('Error creating production orders:', error)
  } else {
    console.log(`✅ Created ${productionOrders.length} production orders`)
  }
  
  console.log('\n✅ Furniture production seed data created!')
}

/**
 * Main execution
 */
async function main() {
  const command = process.argv[2]
  const arg = process.argv[3]
  
  if (!command) {
    console.log(`
🌱 HERA Universal Seed Data Tool

Usage:
  node hera-seed-data-tool.js list              # List available seed templates
  node hera-seed-data-tool.js create [template] # Create seed data from template
  node hera-seed-data-tool.js status            # Check seed data status

Examples:
  node hera-seed-data-tool.js create furniture-hr
  node hera-seed-data-tool.js create furniture-inventory
  node hera-seed-data-tool.js list
    `)
    return
  }
  
  switch (command) {
    case 'list':
      await listTemplates()
      break
    case 'status':
      await checkStatus()
      break
    case 'create':
      if (!arg) {
        console.error('❌ Please specify a template to create')
        console.log('Use "node hera-seed-data-tool.js list" to see available templates')
        return
      }
      await createFromTemplate(arg)
      break
    default:
      console.error(`❌ Unknown command: ${command}`)
  }
}

// Run the tool
main().catch(console.error)