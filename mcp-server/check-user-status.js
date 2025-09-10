#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkUserStatus(email) {
  console.log(`\n🔍 Checking status for user: ${email}\n`)

  try {
    // Get all users and filter by email (more reliable)
    const { data: { users }, error } = await supabase.auth.admin.listUsers()
    
    if (error) {
      console.error('❌ Error fetching users:', error)
      return
    }
    
    // Filter to find exact email match
    const filteredUsers = users.filter(u => u.email === email)

    if (!filteredUsers || filteredUsers.length === 0) {
      console.log('❌ User not found')
      return
    }

    console.log(`Found ${filteredUsers.length} user(s) with this email`)
    
    // If multiple users, show all
    if (filteredUsers.length > 1) {
      console.log('\n⚠️  MULTIPLE USERS FOUND WITH SAME EMAIL!')
      filteredUsers.forEach((user, index) => {
        console.log(`\nUser ${index + 1}:`)
        console.log(`ID: ${user.id}`)
        console.log(`Created: ${user.created_at}`)
        console.log(`Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
      })
      console.log('\n')
    }

    const user = filteredUsers[0]
    
    console.log('✅ User found!')
    console.log('─'.repeat(50))
    console.log(`ID: ${user.id}`)
    console.log(`Email: ${user.email}`)
    console.log(`Email Confirmed: ${user.email_confirmed_at ? '✅ Yes' : '❌ No'}`)
    console.log(`Confirmed At: ${user.email_confirmed_at || 'Not confirmed'}`)
    console.log(`Created At: ${user.created_at}`)
    console.log(`Last Sign In: ${user.last_sign_in_at || 'Never'}`)
    console.log(`Phone: ${user.phone || 'Not provided'}`)
    console.log(`Phone Confirmed: ${user.phone_confirmed_at ? 'Yes' : 'No'}`)
    console.log('─'.repeat(50))

    if (!user.email_confirmed_at) {
      console.log('\n⚠️  Email not confirmed!')
      console.log('Options:')
      console.log('1. Resend confirmation email')
      console.log('2. Manually confirm email (admin action)')
      console.log('3. Sign in with magic link')
      console.log('\nRun with --resend or --confirm flag to take action')
    }

    // Check if user exists in core_entities
    const { data: entities, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('metadata->email', email)
      .limit(1)

    if (entities && entities.length > 0) {
      console.log('\n✅ User entity found in core_entities')
      console.log(`Entity ID: ${entities[0].id}`)
      console.log(`Organization ID: ${entities[0].organization_id}`)
    } else {
      console.log('\n⚠️  No user entity found in core_entities')
    }

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

async function resendConfirmationEmail(email) {
  console.log(`\n📧 Resending confirmation email to: ${email}\n`)

  try {
    const { data, error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
    })

    if (error) {
      console.error('❌ Error resending email:', error)
      return
    }

    console.log('✅ Confirmation email sent successfully!')
    console.log('Please check your email inbox (and spam folder)')

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

async function confirmEmailManually(email) {
  console.log(`\n🔧 Manually confirming email for: ${email}\n`)

  try {
    // Get all users and filter by email
    const { data: { users }, error: fetchError } = await supabase.auth.admin.listUsers()

    if (fetchError) {
      console.error('❌ Error fetching users:', fetchError)
      return
    }
    
    // Filter to find exact email match
    const filteredUsers = users.filter(u => u.email === email)
    
    if (!filteredUsers || filteredUsers.length === 0) {
      console.error('❌ User not found')
      return
    }

    const user = filteredUsers[0]

    // Update user to confirm email
    const { data, error } = await supabase.auth.admin.updateUserById(
      user.id,
      { email_confirmed_at: new Date().toISOString() }
    )

    if (error) {
      console.error('❌ Error confirming email:', error)
      return
    }

    console.log('✅ Email confirmed successfully!')
    console.log('User can now sign in normally')

  } catch (err) {
    console.error('❌ Error:', err)
  }
}

// Main execution
const email = process.argv[2]
const action = process.argv[3]

if (!email) {
  console.log('Usage: node check-user-status.js <email> [--resend|--confirm]')
  console.log('Example: node check-user-status.js minnunandy@gmail.com')
  console.log('         node check-user-status.js minnunandy@gmail.com --resend')
  console.log('         node check-user-status.js minnunandy@gmail.com --confirm')
  process.exit(1)
}

// Execute based on action
if (action === '--resend') {
  resendConfirmationEmail(email)
} else if (action === '--confirm') {
  confirmEmailManually(email)
} else {
  checkUserStatus(email)
}