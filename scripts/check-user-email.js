/**
 * Check if an email already exists in Supabase
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYwMDc4NywiZXhwIjoyMDY5MTc2Nzg3fQ.fMuyCMNmHY4jKy8JyYEkC8KM5BCWSlDS35OQDfZWhPc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkUserEmail(email) {
  console.log(`\n🔍 Checking if email exists: ${email}`)
  console.log('=====================================\n')

  try {
    // List all users (admin function)
    const { data: users, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error listing users:', error.message)
      return
    }

    // Find user with this email
    const existingUser = users.users.find(u => u.email === email)
    
    if (existingUser) {
      console.log('✅ Email already exists in the system')
      console.log(`   User ID: ${existingUser.id}`)
      console.log(`   Created: ${new Date(existingUser.created_at).toLocaleString()}`)
      console.log(`   Email Confirmed: ${existingUser.email_confirmed_at ? 'Yes' : 'No'}`)
      console.log(`   Last Sign In: ${existingUser.last_sign_in_at ? new Date(existingUser.last_sign_in_at).toLocaleString() : 'Never'}`)
      
      if (existingUser.user_metadata) {
        console.log('\n📋 User Metadata:')
        console.log(`   Business Name: ${existingUser.user_metadata.business_name || 'Not set'}`)
        console.log(`   Full Name: ${existingUser.user_metadata.full_name || 'Not set'}`)
        console.log(`   Business Type: ${existingUser.user_metadata.business_type || 'Not set'}`)
      }

      console.log('\n💡 Solution:')
      console.log('   1. Use the "Sign In" option instead of "Create Account"')
      console.log('   2. If you forgot your password, use password reset')
      console.log('   3. Or delete this user first if you want to recreate it')
      
      // Try to sign in with this email
      console.log('\n🔐 Testing login...')
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: email,
        password: 'testpass123' // Try common test password
      })
      
      if (signInData?.session) {
        console.log('✅ Login successful with password: testpass123')
        await supabase.auth.signOut()
      } else {
        console.log('❌ Cannot login with testpass123 - different password set')
      }
      
    } else {
      console.log('❌ Email does not exist in the system')
      console.log('   This email can be used for registration')
    }

    // Show total user count
    console.log(`\n📊 Total users in system: ${users.users.length}`)
    
  } catch (err) {
    console.error('❌ Unexpected error:', err.message)
  }
}

// Check the specific email
checkUserEmail('minnunandy@gmail.com').catch(console.error)