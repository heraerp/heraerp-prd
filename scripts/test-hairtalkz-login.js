const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Test users
const testUsers = [
  { email: 'owner@hairtalkz.ae', password: 'HairTalkz@2025', role: 'owner' },
  { email: 'receptionist@hairtalkz.ae', password: 'Reception@2025', role: 'receptionist' },
  { email: 'accountant@hairtalkz.ae', password: 'Finance@2025', role: 'accountant' },
  { email: 'admin@hairtalkz.ae', password: 'Admin@2025', role: 'admin' }
]

async function testLogin(email, password, expectedRole) {
  console.log(`\n🔐 Testing login for ${expectedRole}...`)
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      console.error(`❌ Login failed: ${error.message}`)
      return false
    }

    if (data.session) {
      const metadata = data.session.user.user_metadata
      console.log(`✅ Login successful!`)
      console.log(`   Name: ${metadata.full_name}`)
      console.log(`   Role: ${metadata.role}`)
      console.log(`   Organization: ${metadata.organization_id}`)
      
      // Sign out after test
      await supabase.auth.signOut()
      return true
    }
  } catch (err) {
    console.error(`❌ Error: ${err.message}`)
    return false
  }
}

async function runTests() {
  console.log('🧪 Testing HairTalkz user logins...')
  console.log('==================================')
  
  let successCount = 0
  
  for (const user of testUsers) {
    const success = await testLogin(user.email, user.password, user.role)
    if (success) successCount++
  }
  
  console.log('\n📊 Test Results:')
  console.log(`   Successful logins: ${successCount}/${testUsers.length}`)
  
  if (successCount === testUsers.length) {
    console.log('✨ All users can log in successfully!')
  } else {
    console.log('⚠️  Some users failed to log in. Please run create-hairtalkz-users.js first.')
  }
}

// Run the tests
runTests().catch(console.error)