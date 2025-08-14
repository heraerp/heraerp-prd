// Create Demo User Directly in Supabase
// Smart Code: HERA.DEMO.USER.CREATE.DIRECT.v1

require('dotenv').config({ path: '.env.local' })
const bcrypt = require('bcrypt')
const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function createDemoUserDirect() {
  console.log('🚀 Creating Demo User Directly in Supabase...\n')

  try {
    // First, create the demo organization
    console.log('1️⃣ Creating Demo Organization...')
    
    const { data: existingOrg } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('organization_code', 'MARIO-RESTAURANT')
      .single()

    let organizationId
    if (existingOrg) {
      organizationId = existingOrg.id
      console.log('✅ Demo organization already exists')
      console.log(`   Organization ID: ${organizationId}`)
    } else {
      const { data: newOrg, error: orgError } = await supabase
        .from('core_organizations')
        .insert({
          organization_name: "Mario's Authentic Italian Restaurant",
          organization_code: 'MARIO-RESTAURANT',
          organization_type: 'business_unit',
          industry_classification: 'restaurant',
          ai_insights: {
            business_type: 'family_restaurant',
            cuisine_type: 'italian',
            target_market: 'casual_dining'
          },
          settings: {
            vibe_coding_enabled: true,
            auto_context_preservation: true,
            quality_standard: 'manufacturing_grade'
          },
          status: 'active'
        })
        .select()
        .single()

      if (orgError) {
        throw new Error(`Organization creation failed: ${orgError.message}`)
      }

      organizationId = newOrg.id
      console.log('✅ Demo organization created')
      console.log(`   Organization ID: ${organizationId}`)
    }

    // Hash the password
    console.log('\n2️⃣ Hashing Password...')
    const passwordHash = await bcrypt.hash('demo123', 12)
    console.log('✅ Password hashed successfully')

    // Create the demo user
    console.log('\n3️⃣ Creating Demo User...')
    
    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('organization_id', organizationId)
      .filter('metadata->email', 'eq', 'mario@restaurant.com')
      .single()

    if (existingUser) {
      console.log('⚠️ Demo user already exists, updating password...')
      
      const { error: updateError } = await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...existingUser.metadata,
            password_hash: passwordHash,
            last_updated: new Date().toISOString()
          }
        })
        .eq('id', existingUser.id)

      if (updateError) {
        throw new Error(`User update failed: ${updateError.message}`)
      }

      console.log('✅ Demo user password updated')
      console.log(`   User ID: ${existingUser.id}`)
      console.log(`   Email: mario@restaurant.com`)
      console.log(`   Password: demo123`)
    } else {
      const { data: newUser, error: userError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'user',
          entity_name: 'Mario Rossi',
          entity_code: 'USR-MARIO-001',
          entity_description: 'Restaurant Owner - Demo User for HERA System',
          smart_code: 'HERA.DEMO.USER.OWNER.MARIO.v1',
          status: 'active',
          metadata: {
            email: 'mario@restaurant.com',
            role: 'owner',
            password_hash: passwordHash,
            permissions: [
              'entities:*',
              'transactions:*', 
              'relationships:*',
              'users:*',
              'settings:*',
              'reports:*',
              'api:*'
            ],
            user_type: 'business_owner',
            department: 'Management',
            job_title: 'Restaurant Owner',
            hire_date: '2020-01-01',
            location: 'Main Restaurant',
            phone: '+1 (555) 123-4567',
            demo_account: true,
            vibe_enabled: true,
            created_at: new Date().toISOString(),
            email_verified: true,
            last_login: null
          }
        })
        .select()
        .single()

      if (userError) {
        throw new Error(`User creation failed: ${userError.message}`)
      }

      console.log('✅ Demo user created successfully')
      console.log(`   User ID: ${newUser.id}`)
      console.log(`   Email: mario@restaurant.com`)
      console.log(`   Password: demo123`)
    }

    // Test the login
    console.log('\n4️⃣ Testing Login...')
    const loginResponse = await fetch('http://localhost:3002/api/v1/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mario@restaurant.com',
        password: 'demo123'
      })
    })

    if (loginResponse.ok) {
      const loginData = await loginResponse.json()
      console.log('✅ Login test successful!')
      console.log(`   Token generated: ${loginData.token ? 'Yes' : 'No'}`)
      console.log(`   User authenticated: ${loginData.user.name}`)
      console.log(`   Organization: ${loginData.organization?.name}`)
    } else {
      const errorData = await loginResponse.json()
      console.log('❌ Login test failed:', errorData.error)
    }

    // Success Summary
    console.log('\n🎉 DEMO USER SETUP COMPLETE!')
    console.log('')
    console.log('✅ DEMO CREDENTIALS:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🌐 Login URL: http://localhost:3002/login')
    console.log('📧 Email: mario@restaurant.com')
    console.log('🔑 Password: demo123')
    console.log('👤 Role: Owner (Full Access)')
    console.log('🏢 Organization: Mario\'s Authentic Italian Restaurant')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n🚀 You can now login and explore all HERA features!')

  } catch (error) {
    console.error('\n❌ Demo User Creation Failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('• Check Supabase environment variables in .env.local')
    console.log('• Ensure Supabase service role key has proper permissions')
    console.log('• Verify the development server is running on port 3002')
    console.log('• Check Supabase RLS policies allow service role access')
  }
}

if (require.main === module) {
  createDemoUserDirect()
}

module.exports = { createDemoUserDirect }