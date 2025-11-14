/**
 * Seed AGRO Demo Data
 * Creates sample farmers, raw materials, products, batches, quality tests, and equipment
 * for the HERA Cashew Demo organization
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const CASHEW_DEMO_ORG_ID = '699453c2-950e-4456-9fc0-c0c71efa78fb'
const ACTOR_USER_ID = 'bc6ab506-a09c-445a-9374-f31a7de6e399' // demo@heraerp.com

// Helper function to create entity with dynamic data
async function createEntity(entityType, entityName, smartCode, dynamicFields) {
  const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: CASHEW_DEMO_ORG_ID,
    p_entity: {
      entity_type: entityType,
      entity_name: entityName,
      smart_code: smartCode
    },
    p_dynamic: dynamicFields,
    p_relationships: [],
    p_options: {}
  })

  if (error) {
    console.error(`❌ Error creating ${entityType}:`, error)
    throw error
  }

  console.log(`✅ Created ${entityType}: ${entityName}`)
  return data.items[0]
}

// 1. Create Farmers/Suppliers
async function seedFarmers() {
  console.log('\n👨‍🌾 Creating Farmers/Suppliers...')

  const farmers = [
    {
      name: 'Rajesh Kumar Farms',
      code: 'FMR001',
      phone: '+91 98765 43210',
      location: 'Kollam, Kerala',
      farmSize: 25,
      status: 'Active'
    },
    {
      name: 'Nambiar Plantations',
      code: 'FMR002',
      phone: '+91 98765 43211',
      location: 'Thrissur, Kerala',
      farmSize: 40,
      status: 'Active'
    },
    {
      name: 'Menon Agro Cooperative',
      code: 'FMR003',
      phone: '+91 98765 43212',
      location: 'Palakkad, Kerala',
      farmSize: 60,
      status: 'Active'
    },
    {
      name: 'Gopal Trading Company',
      code: 'FMR004',
      phone: '+91 98765 43213',
      location: 'Kasaragod, Kerala',
      farmSize: 30,
      status: 'Active'
    },
    {
      name: 'Sundaram Cashew Estate',
      code: 'FMR005',
      phone: '+91 98765 43214',
      location: 'Kannur, Kerala',
      farmSize: 50,
      status: 'Active'
    }
  ]

  const createdFarmers = []

  for (const farmer of farmers) {
    const entity = await createEntity(
      'farmer',
      farmer.name,
      'HERA.AGRO.FARMER.ENTITY.SUPPLIER.v1',
      {
        farmer_code: {
          field_type: 'text',
          field_value_text: farmer.code,
          smart_code: 'HERA.AGRO.FARMER.FIELD.CODE.v1'
        },
        phone: {
          field_type: 'phone',
          field_value_text: farmer.phone,
          smart_code: 'HERA.AGRO.FARMER.FIELD.PHONE.v1'
        },
        location: {
          field_type: 'text',
          field_value_text: farmer.location,
          smart_code: 'HERA.AGRO.FARMER.FIELD.LOCATION.v1'
        },
        farm_size: {
          field_type: 'number',
          field_value_number: farmer.farmSize,
          smart_code: 'HERA.AGRO.FARMER.FIELD.FARM_SIZE.v1'
        },
        status: {
          field_type: 'text',
          field_value_text: farmer.status,
          smart_code: 'HERA.AGRO.FARMER.FIELD.STATUS.v1'
        }
      }
    )
    createdFarmers.push(entity)
  }

  return createdFarmers
}

// 2. Create Raw Materials
async function seedRawMaterials(farmers) {
  console.log('\n🥜 Creating Raw Materials...')

  const rawMaterials = [
    {
      name: 'Raw Cashew Nuts - Grade A',
      type: 'Cashew',
      grade: 'A',
      quantity: 5000,
      unit: 'kg',
      costPerUnit: 45,
      supplier: farmers[0]
    },
    {
      name: 'Raw Cashew Nuts - Grade B',
      type: 'Cashew',
      grade: 'B',
      quantity: 3000,
      unit: 'kg',
      costPerUnit: 38,
      supplier: farmers[1]
    },
    {
      name: 'Raw Cashew Nuts - Premium',
      type: 'Cashew',
      grade: 'Premium',
      quantity: 2000,
      unit: 'kg',
      costPerUnit: 55,
      supplier: farmers[2]
    },
    {
      name: 'Raw Cashew Nuts - Grade C',
      type: 'Cashew',
      grade: 'C',
      quantity: 4000,
      unit: 'kg',
      costPerUnit: 30,
      supplier: farmers[3]
    },
    {
      name: 'Raw Cashew Nuts - Standard',
      type: 'Cashew',
      grade: 'Standard',
      quantity: 3500,
      unit: 'kg',
      costPerUnit: 40,
      supplier: farmers[4]
    }
  ]

  const createdMaterials = []

  for (const material of rawMaterials) {
    const entity = await createEntity(
      'raw_material',
      material.name,
      'HERA.AGRO.RAW_MATERIAL.ENTITY.CASHEW.v1',
      {
        material_type: {
          field_type: 'text',
          field_value_text: material.type,
          smart_code: 'HERA.AGRO.RAW_MATERIAL.FIELD.TYPE.v1'
        },
        grade: {
          field_type: 'text',
          field_value_text: material.grade,
          smart_code: 'HERA.AGRO.RAW_MATERIAL.FIELD.GRADE.v1'
        },
        quantity: {
          field_type: 'number',
          field_value_number: material.quantity,
          smart_code: 'HERA.AGRO.RAW_MATERIAL.FIELD.QUANTITY.v1'
        },
        unit: {
          field_type: 'text',
          field_value_text: material.unit,
          smart_code: 'HERA.AGRO.RAW_MATERIAL.FIELD.UNIT.v1'
        },
        cost_per_unit: {
          field_type: 'number',
          field_value_number: material.costPerUnit,
          smart_code: 'HERA.AGRO.RAW_MATERIAL.FIELD.COST_PER_UNIT.v1'
        },
        receipt_date: {
          field_type: 'date',
          field_value_text: new Date().toISOString().split('T')[0],
          smart_code: 'HERA.AGRO.RAW_MATERIAL.FIELD.RECEIPT_DATE.v1'
        }
      }
    )
    createdMaterials.push({ ...entity, supplier: material.supplier })
  }

  return createdMaterials
}

// 3. Create Processed Products
async function seedProcessedProducts() {
  console.log('\n📦 Creating Processed Products...')

  const products = [
    {
      name: 'Roasted Cashews - Salted',
      type: 'Roasted',
      grade: 'Premium',
      quantity: 500,
      unit: 'kg',
      price: 180
    },
    {
      name: 'Raw Cashews - Natural',
      type: 'Plain',
      grade: 'Premium',
      quantity: 800,
      unit: 'kg',
      price: 160
    },
    {
      name: 'Roasted Cashews - Unsalted',
      type: 'Roasted',
      grade: 'Standard',
      quantity: 600,
      unit: 'kg',
      price: 150
    },
    {
      name: 'Honey Roasted Cashews',
      type: 'Flavored',
      grade: 'Premium',
      quantity: 300,
      unit: 'kg',
      price: 200
    },
    {
      name: 'Mixed Cashew Pieces',
      type: 'Mixed',
      grade: 'Economy',
      quantity: 1000,
      unit: 'kg',
      price: 120
    }
  ]

  const createdProducts = []

  for (const product of products) {
    const entity = await createEntity(
      'processed_product',
      product.name,
      'HERA.AGRO.PRODUCT.ENTITY.CASHEW.v1',
      {
        product_type: {
          field_type: 'text',
          field_value_text: product.type,
          smart_code: 'HERA.AGRO.PRODUCT.FIELD.TYPE.v1'
        },
        grade: {
          field_type: 'text',
          field_value_text: product.grade,
          smart_code: 'HERA.AGRO.PRODUCT.FIELD.GRADE.v1'
        },
        quantity: {
          field_type: 'number',
          field_value_number: product.quantity,
          smart_code: 'HERA.AGRO.PRODUCT.FIELD.QUANTITY.v1'
        },
        unit: {
          field_type: 'text',
          field_value_text: product.unit,
          smart_code: 'HERA.AGRO.PRODUCT.FIELD.UNIT.v1'
        },
        price: {
          field_type: 'number',
          field_value_number: product.price,
          smart_code: 'HERA.AGRO.PRODUCT.FIELD.PRICE.v1'
        },
        production_date: {
          field_type: 'date',
          field_value_text: new Date().toISOString().split('T')[0],
          smart_code: 'HERA.AGRO.PRODUCT.FIELD.PRODUCTION_DATE.v1'
        }
      }
    )
    createdProducts.push(entity)
  }

  return createdProducts
}

// 4. Create Equipment
async function seedEquipment() {
  console.log('\n⚙️ Creating Equipment...')

  const equipment = [
    {
      name: 'Cashew Roasting Machine A',
      code: 'EQP001',
      type: 'Processing',
      status: 'Operational'
    },
    {
      name: 'Cashew Roasting Machine B',
      code: 'EQP002',
      type: 'Processing',
      status: 'Operational'
    },
    {
      name: 'Packaging Unit 1',
      code: 'EQP003',
      type: 'Packaging',
      status: 'Operational'
    },
    {
      name: 'Quality Testing Lab Equipment',
      code: 'EQP004',
      type: 'Testing',
      status: 'Operational'
    },
    {
      name: 'Storage Conveyor System',
      code: 'EQP005',
      type: 'Storage',
      status: 'Under Maintenance'
    }
  ]

  const createdEquipment = []

  for (const equip of equipment) {
    const entity = await createEntity(
      'equipment',
      equip.name,
      'HERA.AGRO.EQUIPMENT.ENTITY.MACHINERY.v1',
      {
        equipment_code: {
          field_type: 'text',
          field_value_text: equip.code,
          smart_code: 'HERA.AGRO.EQUIPMENT.FIELD.CODE.v1'
        },
        equipment_type: {
          field_type: 'text',
          field_value_text: equip.type,
          smart_code: 'HERA.AGRO.EQUIPMENT.FIELD.TYPE.v1'
        },
        status: {
          field_type: 'text',
          field_value_text: equip.status,
          smart_code: 'HERA.AGRO.EQUIPMENT.FIELD.STATUS.v1'
        }
      }
    )
    createdEquipment.push(entity)
  }

  return createdEquipment
}

// Main seed function
async function seedAgroData() {
  console.log('🌾 Starting AGRO Demo Data Seed...')
  console.log('🏢 Organization: HERA Cashew Demo')
  console.log('📦 Organization ID:', CASHEW_DEMO_ORG_ID)
  console.log('👤 Actor User ID:', ACTOR_USER_ID)

  try {
    // Seed all data
    const farmers = await seedFarmers()
    const rawMaterials = await seedRawMaterials(farmers)
    const products = await seedProcessedProducts()
    const equipment = await seedEquipment()

    console.log('\n✅ AGRO Demo Data Seed Complete!')
    console.log('📊 Summary:')
    console.log(`   - ${farmers.length} Farmers/Suppliers created`)
    console.log(`   - ${rawMaterials.length} Raw Materials created`)
    console.log(`   - ${products.length} Processed Products created`)
    console.log(`   - ${equipment.length} Equipment records created`)
    console.log('\n🎉 Ready for testing!')

  } catch (error) {
    console.error('❌ Seed failed:', error)
    throw error
  }
}

// Run the seed
seedAgroData()
  .then(() => {
    console.log('✨ Seed completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 Seed failed:', error)
    process.exit(1)
  })
