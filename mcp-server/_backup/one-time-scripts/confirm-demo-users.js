// ================================================================================
// CONFIRM DEMO USER EMAILS
// Confirms demo user emails so they can login
// ================================================================================

require('dotenv').config({ path: '../.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Use service role for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const demoEmails = [
  'demo.salon@heraerp.com',
  'demo.restaurant@heraerp.com', 
  'demo.manufacturing@heraerp.com',
  'demo.retail@heraerp.com'
]

async function confirmDemoUsers() {
  console.log('📧 Confirming Demo User Emails...\n')
  
  for (const email of demoEmails) {
    try {
      // Get user by email using admin API
      const { data: userData, error: getUserError } = await supabase.auth.admin.listUsers()
      
      if (getUserError) {
        console.error(`  ❌ Failed to get users: ${getUserError.message}`)
        continue
      }
      
      const user = userData.users.find(u => u.email === email)
      
      if (!user) {
        console.log(`  ❌ User ${email} not found`)
        continue
      }
      
      if (user.email_confirmed_at) {
        console.log(`  ✅ ${email} already confirmed`)
        continue
      }
      
      // Confirm user email
      const { error: confirmError } = await supabase.auth.admin.updateUserById(user.id, {
        email_confirm: true
      })
      
      if (confirmError) {
        console.log(`  ❌ Failed to confirm ${email}: ${confirmError.message}`)
      } else {
        console.log(`  ✅ Confirmed ${email}`)
      }
      
    } catch (err) {
      console.log(`  ❌ Error processing ${email}: ${err.message}`)
    }
  }
  
  console.log('\n✨ Email confirmation complete!')
  console.log('🔗 Test the demo system at: http://localhost:3000/demo')
}

confirmDemoUsers()
  .then(() => process.exit(0))
  .catch(err => {
    console.error('❌ Failed:', err)
    process.exit(1)
  })