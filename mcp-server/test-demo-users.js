// ================================================================================
// TEST DEMO USERS
// Check if demo users exist and can authenticate
// ================================================================================

require('dotenv').config({ path: '../.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const demoAccounts = [
  { email: 'demo.salon@heraerp.com', password: 'DemoSalon2024!', orgId: '0fd09e31-d257-4329-97eb-7d7f522ed6f0' },
  { email: 'demo.restaurant@heraerp.com', password: 'DemoRestaurant2024!', orgId: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890' },
  { email: 'demo.manufacturing@heraerp.com', password: 'DemoManufacturing2024!', orgId: 'b2c3d4e5-f6a7-8901-bcde-f12345678901' },
  { email: 'demo.retail@heraerp.com', password: 'DemoRetail2024!', orgId: 'c3d4e5f6-a7b8-9012-cdef-123456789012' }
]

async function testDemoUsers() {
  console.log('🧪 Testing Demo User Authentication...\n')

  for (const demo of demoAccounts) {
    console.log(`Testing ${demo.email}...`)
    
    try {
      // Try to sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email: demo.email,
        password: demo.password
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          console.log(`  ❌ User doesn't exist or wrong password`)
        } else {
          console.log(`  ❌ Error: ${error.message}`)
        }
      } else if (data.user) {
        console.log(`  ✅ User exists and can authenticate`)
        console.log(`     User ID: ${data.user.id}`)
        console.log(`     Email confirmed: ${data.user.email_confirmed_at ? 'Yes' : 'No'}`)
        
        // Check organization access
        const { data: orgData } = await supabase
          .from('core_organizations')
          .select('organization_name')
          .eq('id', demo.orgId)
          .single()
        
        if (orgData) {
          console.log(`     Can access: ${orgData.organization_name}`)
        } else {
          console.log(`     ❌ Cannot access organization`)
        }
        
        // Sign out to test next user
        await supabase.auth.signOut()
      }
    } catch (err) {
      console.log(`  ❌ Exception: ${err.message}`)
    }
    
    console.log()
  }
}

testDemoUsers()
  .then(() => {
    console.log('✨ Demo user testing complete')
    process.exit(0)
  })
  .catch(err => {
    console.error('❌ Test failed:', err)
    process.exit(1)
  })