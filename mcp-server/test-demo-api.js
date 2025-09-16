// ================================================================================
// TEST DEMO LOGIN API DIRECTLY
// ================================================================================

require('dotenv').config({ path: '../.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Demo account credentials (matching the API)
const DEMO_ACCOUNTS = {
  'demo.salon@heraerp.com': {
    password: 'DemoSalon2024!',
    organizationId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    defaultRoute: '/salon'
  },
  'demo.restaurant@heraerp.com': {
    password: 'DemoRestaurant2024!',
    organizationId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    defaultRoute: '/restaurant'
  }
}

async function testDemoLoginLogic() {
  const email = 'demo.salon@heraerp.com'
  const password = 'DemoSalon2024!'
  const organizationId = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'

  console.log('🧪 Testing Demo Login Logic...\n')

  try {
    // Step 1: Validate demo account
    console.log('1. Validating demo account...')
    const demoAccount = DEMO_ACCOUNTS[email]
    if (!demoAccount || demoAccount.password !== password || demoAccount.organizationId !== organizationId) {
      throw new Error('Invalid demo credentials')
    }
    console.log('   ✅ Demo account validation passed')

    // Step 2: Sign in with Supabase
    console.log('2. Signing in with Supabase...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (authError || !authData.user) {
      throw new Error(`Auth failed: ${authError?.message}`)
    }
    console.log('   ✅ Supabase authentication successful')
    console.log(`   User ID: ${authData.user.id}`)

    // Step 3: Verify organization access
    console.log('3. Verifying organization access...')
    const { data: orgData, error: orgError } = await supabase
      .from('core_organizations')
      .select('id, organization_name')
      .eq('id', organizationId)
      .single()

    if (orgError || !orgData) {
      throw new Error(`Organization access failed: ${orgError?.message}`)
    }
    console.log('   ✅ Organization access verified')
    console.log(`   Organization: ${orgData.organization_name}`)

    // Step 4: Success response
    console.log('4. Creating success response...')
    const response = {
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        organizationId: organizationId
      },
      organization: {
        id: orgData.id,
        name: orgData.organization_name
      },
      redirectTo: demoAccount.defaultRoute
    }

    console.log('   ✅ Success response created')
    console.log('   Response:', JSON.stringify(response, null, 2))

    // Clean up
    await supabase.auth.signOut()

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testDemoLoginLogic()
  .then(() => {
    console.log('\n✨ Test complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Test exception:', err)
    process.exit(1)
  })