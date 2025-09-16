// ================================================================================
// HERA DEMO ACCOUNTS SETUP - MCP VERSION
// Creates demo organizations and users with proper RLS
// ================================================================================

require('dotenv').config({ path: '../.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Demo configurations
const demoConfigs = [
  {
    orgId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    orgName: 'Hair Talkz Salon Demo',
    orgCode: 'SALON-DEMO',
    email: 'demo.salon@heraerp.com',
    password: 'DemoSalon2024!',
    userName: 'Salon Demo User',
    industry: 'beauty_services'
  },
  {
    orgId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    orgName: "Mario's Restaurant Demo",
    orgCode: 'RESTAURANT-DEMO',
    email: 'demo.restaurant@heraerp.com',
    password: 'DemoRestaurant2024!',
    userName: 'Restaurant Demo User',
    industry: 'food_service'
  },
  {
    orgId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    orgName: 'TechCorp Manufacturing Demo',
    orgCode: 'MANUFACTURING-DEMO',
    email: 'demo.manufacturing@heraerp.com',
    password: 'DemoManufacturing2024!',
    userName: 'Manufacturing Demo User',
    industry: 'manufacturing'
  },
  {
    orgId: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    orgName: 'Fashion Boutique Demo',
    orgCode: 'RETAIL-DEMO',
    email: 'demo.retail@heraerp.com',
    password: 'DemoRetail2024!',
    userName: 'Retail Demo User',
    industry: 'retail'
  }
]

async function setupDemoAccounts() {
  console.log('🚀 Setting up HERA demo accounts...\n')

  for (const config of demoConfigs) {
    console.log(`\n📋 Processing ${config.orgName}...`)

    try {
      // 1. Check/Create Organization
      const { data: existingOrg } = await supabase
        .from('core_organizations')
        .select('id')
        .eq('id', config.orgId)
        .single()

      if (!existingOrg) {
        console.log('  ➕ Creating organization...')
        const { error: orgError } = await supabase
          .from('core_organizations')
          .insert({
            id: config.orgId,
            organization_name: config.orgName,
            organization_code: config.orgCode,
            organization_type: 'services',
            industry_classification: config.industry,
            status: 'active',
            settings: {
              demo_account: true,
              read_only: false, // Allow demo users to interact
              reset_daily: true,
              installed_apps: config.industry === 'beauty_services' ? ['salon'] : 
                            config.industry === 'food_service' ? ['restaurant'] :
                            config.industry === 'manufacturing' ? ['manufacturing'] :
                            ['retail']
            },
            ai_insights: {},
            ai_confidence: 1.0
          })

        if (orgError) {
          console.error('  ❌ Failed to create organization:', orgError.message)
          continue
        }
        console.log('  ✅ Organization created')
      } else {
        console.log('  ℹ️  Organization already exists')
      }

      // 2. Check/Create User
      // First check if user exists in core_entities
      const { data: existingUserEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', config.orgId)
        .eq('entity_type', 'user')
        .eq('metadata->>email', config.email)
        .single()

      let userId = null
      
      if (!existingUserEntity) {
        console.log('  ➕ Creating user account...')
        
        // Try to sign up the user first
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: config.email,
          password: config.password,
          options: {
            data: {
              name: config.userName,
              role: 'admin',
              demo: true,
              organization_id: config.orgId
            }
          }
        })

        if (signUpError) {
          console.error('  ❌ Failed to create user:', signUpError.message)
          continue
        }

        userId = signUpData?.user?.id

        // 3. Create User Entity
        if (userId) {
          console.log('  ➕ Creating user entity...')
          const { error: entityError } = await supabase
            .from('core_entities')
            .insert({
              entity_type: 'user',
              entity_name: config.userName,
              entity_code: `USER-${config.email.split('@')[0].toUpperCase()}`,
              organization_id: config.orgId,
              smart_code: 'HERA.UNIV.USER.TEMPLATE.v1',
              status: 'active',
              metadata: {
                user_id: userId,
                email: config.email,
                role: 'admin',
                demo: true
              },
              ai_insights: {},
              ai_confidence: 1.0
            })

          if (entityError) {
            console.error('  ❌ Failed to create user entity:', entityError.message)
          } else {
            console.log('  ✅ User entity created')
          }
        }

        console.log('  ✅ Demo user setup complete')
      } else {
        console.log('  ℹ️  User entity already exists')
      }

      // 4. Create some demo data for each organization
      console.log('  ➕ Creating demo data...')
      
      // Create a few sample entities based on industry
      const sampleEntities = {
        beauty_services: [
          { type: 'customer', name: 'Jane Smith', code: 'CUST-JS-001' },
          { type: 'customer', name: 'Emily Johnson', code: 'CUST-EJ-002' },
          { type: 'service', name: 'Haircut & Style', code: 'SVC-001' },
          { type: 'service', name: 'Hair Color', code: 'SVC-002' }
        ],
        food_service: [
          { type: 'customer', name: 'Walk-in Customer', code: 'CUST-WALK' },
          { type: 'product', name: 'Margherita Pizza', code: 'MENU-001' },
          { type: 'product', name: 'Caesar Salad', code: 'MENU-002' },
          { type: 'table', name: 'Table 1', code: 'TABLE-001' }
        ],
        manufacturing: [
          { type: 'product', name: 'Widget A', code: 'PROD-001' },
          { type: 'product', name: 'Component B', code: 'COMP-001' },
          { type: 'vendor', name: 'Acme Supplies', code: 'VEND-001' },
          { type: 'customer', name: 'Tech Solutions Inc', code: 'CUST-001' }
        ],
        retail: [
          { type: 'product', name: 'Designer Dress', code: 'SKU-001' },
          { type: 'product', name: 'Leather Handbag', code: 'SKU-002' },
          { type: 'customer', name: 'VIP Customer', code: 'CUST-VIP-001' },
          { type: 'vendor', name: 'Fashion Wholesale Co', code: 'VEND-001' }
        ]
      }

      const entities = sampleEntities[config.industry] || []
      for (const entity of entities) {
        const { error } = await supabase
          .from('core_entities')
          .insert({
            entity_type: entity.type,
            entity_name: entity.name,
            entity_code: entity.code,
            organization_id: config.orgId,
            smart_code: entity.type === 'customer' ? 'HERA.UNIV.CUST.TEMPLATE.v1' :
                       entity.type === 'product' ? 'HERA.UNIV.PROD.TEMPLATE.v1' :
                       entity.type === 'vendor' ? 'HERA.UNIV.VEND.TEMPLATE.v1' :
                       entity.type === 'service' ? 'HERA.UNIV.SVC.TEMPLATE.v1' :
                       entity.type === 'table' ? 'HERA.UNIV.ENT.TEMPLATE.v1' :
                       'HERA.UNIV.ENT.TEMPLATE.v1',
            status: 'active',
            metadata: { demo_data: true },
            ai_insights: {},
            ai_confidence: 1.0
          })

        if (!error) {
          console.log(`    ✓ Created ${entity.type}: ${entity.name}`)
        }
      }

    } catch (error) {
      console.error(`  ❌ Error processing ${config.orgName}:`, error.message)
    }
  }

  console.log('\n✨ Demo account setup complete!\n')
  console.log('📋 Demo Credentials:')
  console.log('─'.repeat(60))
  demoConfigs.forEach(config => {
    console.log(`${config.industry.padEnd(20)} | ${config.email}`)
  })
  console.log('─'.repeat(60))
  console.log('Password for all: DemoIndustry2024! (e.g., DemoSalon2024!)')
  console.log('\n🔒 RLS Note: Each demo user can only access their organization\'s data')
}

// Run setup
setupDemoAccounts()
  .then(() => {
    console.log('\n✅ Setup completed successfully')
    process.exit(0)
  })
  .catch(error => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })