// ================================================================================
// CREATE DEMO ORGANIZATIONS ONLY
// Sets up the 4 demo organizations in Supabase
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

// Demo organizations
const demoOrgs = [
  {
    id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    name: 'Hair Talkz Salon Demo',
    code: 'SALON-DEMO',
    industry: 'beauty_services',
    apps: ['salon']
  },
  {
    id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    name: "Mario's Restaurant Demo",
    code: 'RESTAURANT-DEMO',
    industry: 'food_service',
    apps: ['restaurant']
  },
  {
    id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
    name: 'TechCorp Manufacturing Demo',
    code: 'MANUFACTURING-DEMO',
    industry: 'manufacturing',
    apps: ['manufacturing']
  },
  {
    id: 'c3d4e5f6-a7b8-9012-cdef-123456789012',
    name: 'Fashion Boutique Demo',
    code: 'RETAIL-DEMO',
    industry: 'retail',
    apps: ['retail']
  }
]

async function createDemoOrganizations() {
  console.log('🏢 Creating Demo Organizations...\n')

  for (const org of demoOrgs) {
    // Check if already exists
    const { data: existing } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', org.id)
      .single()

    if (existing) {
      console.log(`✅ ${org.name} already exists`)
      continue
    }

    // Create organization
    const { error } = await supabase
      .from('core_organizations')
      .insert({
        id: org.id,
        organization_name: org.name,
        organization_code: org.code,
        organization_type: 'services',
        industry_classification: org.industry,
        status: 'active',
        settings: {
          demo_account: true,
          read_only: false,
          reset_daily: true,
          installed_apps: org.apps
        },
        ai_insights: {},
        ai_confidence: 1.0
      })

    if (error) {
      console.error(`❌ Failed to create ${org.name}: ${error.message}`)
    } else {
      console.log(`✅ Created ${org.name}`)
    }
  }

  console.log('\n✨ Organizations ready!')
  console.log('\n📋 Next Steps:')
  console.log('1. Create users in Supabase Dashboard > Authentication > Users')
  console.log('2. Use these emails and passwords:')
  console.log('   - demo.salon@heraerp.com (DemoSalon2024!)')
  console.log('   - demo.restaurant@heraerp.com (DemoRestaurant2024!)')
  console.log('   - demo.manufacturing@heraerp.com (DemoManufacturing2024!)')
  console.log('   - demo.retail@heraerp.com (DemoRetail2024!)')
  console.log('3. Set user metadata with organization_id for each user')
  console.log('4. Test demo login at http://localhost:3000/demo')
}

createDemoOrganizations()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('Error:', err)
    process.exit(1)
  })