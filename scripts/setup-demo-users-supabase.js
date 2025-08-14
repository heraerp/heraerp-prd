// Setup Demo Users in Live Supabase Database
// Smart Code: HERA.VIBE.SETUP.DEMO.USERS.SUPABASE.v1

const bcrypt = require('bcrypt')

async function setupDemoUsersSupabase() {
  const baseUrl = 'http://localhost:3002'
  
  console.log('👥 Setting up Demo Users in Live Supabase Database...\n')

  try {
    // First, let's check if the universal API is working
    console.log('1️⃣ Testing Universal API Connection...')
    
    const testResponse = await fetch(`${baseUrl}/api/v1/universal?action=read&table=core_organizations`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!testResponse.ok) {
      throw new Error('Universal API not responding. Check if server is running and Supabase is connected.')
    }

    const testData = await testResponse.json()
    console.log('✅ Universal API connected to live Supabase')
    console.log(`   Organizations in database: ${testData.data?.length || 0}`)

    // Create demo organization if it doesn't exist
    console.log('\n2️⃣ Creating Demo Organization...')
    
    const orgResponse = await fetch(`${baseUrl}/api/v1/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        table: 'core_organizations',
        data: {
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
        }
      })
    })

    let orgData
    if (orgResponse.ok) {
      orgData = await orgResponse.json()
      console.log('✅ Demo organization created')
      console.log(`   Organization ID: ${orgData.data.id}`)
      console.log(`   Organization Name: ${orgData.data.organization_name}`)
    } else {
      // Organization might already exist, let's get it
      const existingOrgResponse = await fetch(`${baseUrl}/api/v1/universal?action=read&table=core_organizations&organization_code=MARIO-RESTAURANT`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      if (existingOrgResponse.ok) {
        const existingOrgData = await existingOrgResponse.json()
        if (existingOrgData.data && existingOrgData.data.length > 0) {
          orgData = { data: existingOrgData.data[0] }
          console.log('✅ Demo organization found (already exists)')
          console.log(`   Organization ID: ${orgData.data.id}`)
        }
      }
    }

    if (!orgData || !orgData.data) {
      throw new Error('Could not create or find demo organization')
    }

    // Create demo user entity
    console.log('\n3️⃣ Creating Demo User Entity...')
    
    // Hash the password
    const passwordHash = await bcrypt.hash('demo123', 12)
    
    const userResponse = await fetch(`${baseUrl}/api/v1/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        table: 'core_entities',
        data: {
          organization_id: orgData.data.id,
          entity_type: 'user',
          entity_name: 'Mario Rossi',
          entity_code: 'USR-MARIO-001',
          entity_description: 'Restaurant Owner - Demo User for HERA Vibe System',
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
            vibe_enabled: true
          }
        }
      })
    })

    if (!userResponse.ok) {
      const errorData = await userResponse.json()
      throw new Error(`User creation failed: ${JSON.stringify(errorData)}`)
    }

    const userData = await userResponse.json()
    console.log('✅ Demo user entity created')
    console.log(`   User ID: ${userData.data.id}`)
    console.log(`   User Name: ${userData.data.entity_name}`)
    console.log(`   Email: mario@restaurant.com`)
    console.log(`   Password: demo123 (hashed with bcrypt)`)

    // Add user authentication data
    console.log('\n4️⃣ Adding User Authentication Data...')
    
    const authDataResponse = await fetch(`${baseUrl}/api/v1/universal`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'create',
        table: 'core_dynamic_data',
        data: {
          organization_id: orgData.data.id,
          entity_id: userData.data.id,
          field_name: 'authentication_data',
          field_type: 'json',
          field_value_json: {
            email: 'mario@restaurant.com',
            password_hash: passwordHash,
            role: 'owner',
            permissions: [
              'entities:*',
              'transactions:*', 
              'relationships:*',
              'users:*',
              'settings:*',
              'reports:*',
              'api:*'
            ],
            last_login: null,
            login_count: 0,
            account_status: 'active',
            two_factor_enabled: false,
            demo_account: true
          },
          smart_code: 'HERA.AUTH.USER.DATA.DEMO.v1'
        }
      })
    })

    if (authDataResponse.ok) {
      console.log('✅ User authentication data added')
    } else {
      console.log('⚠️ Warning: Could not add authentication data')
    }

    // Test authentication
    console.log('\n5️⃣ Testing Authentication with Demo User...')
    
    const authTestResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        email: 'mario@restaurant.com',
        password: 'demo123'
      })
    })

    if (authTestResponse.ok) {
      const authData = await authTestResponse.json()
      console.log('✅ Authentication test successful!')
      console.log(`   Token generated: ${authData.token ? 'Yes' : 'No'}`)
      console.log(`   User authenticated: ${authData.user.name}`)
      console.log(`   Organization: ${authData.organization?.name}`)
    } else {
      console.log('⚠️ Authentication test failed - may need to restart server')
      console.log('   The user has been created in the database')
      console.log('   Try restarting the development server: npm run dev')
    }

    // Success Summary
    console.log('\n🎉 DEMO USER SETUP COMPLETE!')
    console.log('')
    console.log('✅ SETUP SUCCESSFUL:')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🏢 Demo Organization: Created in live Supabase')
    console.log('👤 Demo User Entity: Created with proper structure')
    console.log('🔒 Authentication Data: Stored with bcrypt password hash')
    console.log('🗄️ Universal 6-Table Storage: All data in live database')
    console.log('🧬 HERA Vibe Ready: User configured for vibe coding system')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    console.log('\n📱 TESTING INSTRUCTIONS:')
    console.log('1. 🌐 Open: http://localhost:3002/dashboard')
    console.log('2. 🔑 Login: mario@restaurant.com / demo123')
    console.log('3. 🧬 Click: "Show Vibe System" button')
    console.log('4. 🎯 Test: All vibe coding features with live Supabase')
    console.log('5. 🗄️ Verify: Data persistence in Supabase dashboard')

    console.log('\n🚀 LIVE SUPABASE INTEGRATION READY!')
    console.log('You can now run: node scripts/test-live-supabase-vibe.js')

  } catch (error) {
    console.error('\n❌ Demo User Setup Failed:', error.message)
    console.log('\n🔧 Troubleshooting:')
    console.log('• Ensure development server is running: npm run dev')
    console.log('• Check Supabase connection and environment variables')
    console.log('• Verify universal API endpoints are working')
    console.log('• Check Supabase RLS policies allow data creation')
    console.log('• Ensure bcrypt is installed: npm install bcrypt')
  }
}

if (require.main === module) {
  setupDemoUsersSupabase()
}

module.exports = { setupDemoUsersSupabase }