const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function clearSessions() {
  console.log('🧹 Clearing all HairTalkz sessions...\n')
  
  try {
    // Sign out any active sessions
    await supabase.auth.signOut()
    
    console.log('✅ Sessions cleared successfully')
    console.log('\n📝 Next steps:')
    console.log('1. Clear browser localStorage')
    console.log('2. Navigate to http://localhost:3001/salon/auth')
    console.log('3. Login with one of the test accounts')
    console.log('\n🔗 Test accounts:')
    console.log('- owner@hairtalkz.ae / HairTalkz@2025')
    console.log('- receptionist@hairtalkz.ae / Reception@2025')
    console.log('- accountant@hairtalkz.ae / Finance@2025')
    console.log('- admin@hairtalkz.ae / Admin@2025')
  } catch (error) {
    console.error('Error clearing sessions:', error)
  }
}

clearSessions().catch(console.error)