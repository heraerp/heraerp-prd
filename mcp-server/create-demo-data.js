// ================================================================================
// CREATE DEMO DATA FOR ORGANIZATIONS
// Creates sample entities for each demo organization
// ================================================================================

require('dotenv').config({ path: '../.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Demo data by industry
const demoData = {
  '0fd09e31-d257-4329-97eb-7d7f522ed6f0': { // Salon
    industry: 'beauty_services',
    entities: [
      { type: 'customer', name: 'Jane Smith', code: 'CUST-001', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'customer', name: 'Emily Johnson', code: 'CUST-002', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'customer', name: 'Sarah Williams', code: 'CUST-003', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'employee', name: 'Maria Rodriguez', code: 'STAFF-001', smart_code: 'HERA.UNIV.EMP.TEMPLATE.v1' },
      { type: 'employee', name: 'Lisa Chen', code: 'STAFF-002', smart_code: 'HERA.UNIV.EMP.TEMPLATE.v1' },
      { type: 'product', name: 'Shampoo - Professional', code: 'PROD-001', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Hair Color - Blonde', code: 'PROD-002', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' }
    ]
  },
  'a1b2c3d4-e5f6-7890-abcd-ef1234567890': { // Restaurant
    industry: 'food_service',
    entities: [
      { type: 'customer', name: 'Walk-in Customer', code: 'CUST-WALK', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'customer', name: 'Online Order', code: 'CUST-ONLINE', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'product', name: 'Margherita Pizza', code: 'MENU-001', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Caesar Salad', code: 'MENU-002', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Pasta Carbonara', code: 'MENU-003', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'employee', name: 'Chef Antonio', code: 'STAFF-001', smart_code: 'HERA.UNIV.EMP.TEMPLATE.v1' },
      { type: 'employee', name: 'Server Maria', code: 'STAFF-002', smart_code: 'HERA.UNIV.EMP.TEMPLATE.v1' }
    ]
  },
  'b2c3d4e5-f6a7-8901-bcde-f12345678901': { // Manufacturing
    industry: 'manufacturing',
    entities: [
      { type: 'product', name: 'Widget A - Standard', code: 'PROD-001', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Component B', code: 'COMP-001', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Assembly C', code: 'ASSY-001', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'vendor', name: 'Acme Supplies', code: 'VEND-001', smart_code: 'HERA.UNIV.VEND.TEMPLATE.v1' },
      { type: 'vendor', name: 'Global Parts Inc', code: 'VEND-002', smart_code: 'HERA.UNIV.VEND.TEMPLATE.v1' },
      { type: 'customer', name: 'Tech Solutions Inc', code: 'CUST-001', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'customer', name: 'Industrial Corp', code: 'CUST-002', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' }
    ]
  },
  'c3d4e5f6-a7b8-9012-cdef-123456789012': { // Retail
    industry: 'retail',
    entities: [
      { type: 'product', name: 'Designer Dress - Red', code: 'SKU-001', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Leather Handbag', code: 'SKU-002', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'product', name: 'Silk Scarf', code: 'SKU-003', smart_code: 'HERA.UNIV.PROD.TEMPLATE.v1' },
      { type: 'customer', name: 'VIP Customer - Gold', code: 'CUST-VIP-001', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'customer', name: 'Regular Customer', code: 'CUST-REG-001', smart_code: 'HERA.UNIV.CUST.TEMPLATE.v1' },
      { type: 'vendor', name: 'Fashion Wholesale Co', code: 'VEND-001', smart_code: 'HERA.UNIV.VEND.TEMPLATE.v1' },
      { type: 'employee', name: 'Store Manager', code: 'STAFF-001', smart_code: 'HERA.UNIV.EMP.TEMPLATE.v1' }
    ]
  }
}

async function createDemoData() {
  console.log('📦 Creating Demo Data...\n')

  for (const [orgId, orgData] of Object.entries(demoData)) {
    console.log(`\n🏢 Organization: ${orgData.industry}`)
    console.log('─'.repeat(40))

    for (const entity of orgData.entities) {
      // Check if entity already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_code', entity.code)
        .single()

      if (existing) {
        console.log(`  ✓ ${entity.type}: ${entity.name} (exists)`)
        continue
      }

      // Create entity
      const { error } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: entity.type,
          entity_name: entity.name,
          entity_code: entity.code,
          smart_code: entity.smart_code,
          status: 'active',
          metadata: {
            demo_data: true,
            created_by: 'demo_setup'
          },
          ai_insights: {},
          ai_confidence: 1.0
        })

      if (error) {
        console.error(`  ✗ ${entity.type}: ${entity.name} - ${error.message}`)
      } else {
        console.log(`  ✓ ${entity.type}: ${entity.name}`)
      }
    }
  }

  console.log('\n✨ Demo data creation complete!')
}

createDemoData()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })