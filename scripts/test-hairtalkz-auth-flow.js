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

async function testAuthFlow() {
  console.log('🔐 Testing HairTalkz Authentication Flow\n')
  
  // Test credentials
  const testUser = {
    email: 'owner@hairtalkz.ae',
    password: 'HairTalkz@2025',
    role: 'owner'
  }
  
  console.log('1️⃣ Clearing any existing session...')
  await supabase.auth.signOut()
  
  console.log('2️⃣ Attempting login...')
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: testUser.email,
    password: testUser.password
  })
  
  if (signInError) {
    console.error('❌ Login failed:', signInError.message)
    return
  }
  
  console.log('✅ Login successful!')
  console.log('   User ID:', signInData.session?.user.id)
  console.log('   Email:', signInData.session?.user.email)
  
  console.log('\n3️⃣ Checking user metadata...')
  const metadata = signInData.session?.user.user_metadata
  console.log('   Role:', metadata?.role || 'Not set')
  console.log('   Organization:', metadata?.organization_id || 'Not set')
  console.log('   Permissions:', metadata?.permissions?.length || 0)
  
  console.log('\n4️⃣ Simulating role-based redirect...')
  const roleRedirects = {
    owner: '/salon/dashboard',
    receptionist: '/salon/pos',
    accountant: '/salon/finance',
    admin: '/salon/settings'
  }
  
  const redirectPath = roleRedirects[testUser.role] || '/salon/auth'
  console.log('   Would redirect to:', redirectPath)
  
  console.log('\n5️⃣ Signing out...')
  await supabase.auth.signOut()
  console.log('✅ Sign out successful!')
  
  console.log('\n✨ Authentication flow test complete!')
  console.log('\n📝 Instructions:')
  console.log('1. Go to http://localhost:3001/salon/auth')
  console.log('2. Login with test credentials')
  console.log('3. Select your role')
  console.log('4. You should be redirected to the correct dashboard')
  console.log('5. No redirect loops should occur')
}

testAuthFlow().catch(console.error)