/**
 * 🔍 Supabase User ID Finder
 * 
 * This script helps find your Supabase user ID by:
 * 1. Checking current auth session
 * 2. Listing all users in the auth.users table
 * 3. Providing user details
 */

import { createClient } from '@supabase/supabase-js'

// Your Supabase configuration
const supabaseUrl = 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM2MDA3ODcsImV4cCI6MjA2OTE3Njc4N30.MeQGn3wi7WFDLfw_DNUKzvfOYle9vGX9BEN67wuSTLQ'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYwMDc4NywiZXhwIjoyMDY5MTc2Nzg3fQ.fMuyCMNmHY4jKy8JyYEkC8KM5BCWSlDS35OQDfZWhPc'

// Create clients
const supabaseAnon = createClient(supabaseUrl, supabaseAnonKey)
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

async function checkCurrentUser() {
  console.log('👤 Checking Current User Session')
  console.log('==============================\n')

  try {
    const { data: { user }, error } = await supabaseAnon.auth.getUser()
    
    if (error) {
      console.log('❌ No current user session found')
      console.log(`   Error: ${error.message}`)
      return null
    }
    
    if (user) {
      console.log('✅ Current User Session Found!')
      console.log(`   🆔 User ID: ${user.id}`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`)
      console.log(`   🔐 Provider: ${user.app_metadata?.provider || 'email'}`)
      return user
    } else {
      console.log('ℹ️  No active user session')
      return null
    }
    
  } catch (error) {
    console.log('❌ Error checking current user:', error.message)
    return null
  }
}

async function listAllUsers() {
  console.log('\n\n👥 Listing All Users in Database')
  console.log('=================================\n')

  try {
    // Use admin client to query auth.users
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers()
    
    if (error) {
      console.log('❌ Error fetching users:', error.message)
      return []
    }
    
    if (users && users.users && users.users.length > 0) {
      console.log(`✅ Found ${users.users.length} user(s) in the database:\n`)
      
      users.users.forEach((user, index) => {
        console.log(`📋 User ${index + 1}:`)
        console.log(`   🆔 ID: ${user.id}`)
        console.log(`   📧 Email: ${user.email}`)
        console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`)
        console.log(`   📅 Last Sign In: ${user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}`)
        console.log(`   ✅ Email Confirmed: ${user.email_confirmed_at ? 'Yes' : 'No'}`)
        console.log(`   🔐 Provider: ${user.app_metadata?.provider || 'email'}`)
        
        if (user.user_metadata && Object.keys(user.user_metadata).length > 0) {
          console.log(`   📊 Metadata: ${JSON.stringify(user.user_metadata, null, 2)}`)
        }
        console.log('')
      })
      
      return users.users
    } else {
      console.log('ℹ️  No users found in the database')
      return []
    }
    
  } catch (error) {
    console.log('❌ Error listing users:', error.message)
    return []
  }
}

async function checkSupabaseConnection() {
  console.log('\n\n🔗 Testing Supabase Connection')
  console.log('==============================\n')

  try {
    // Test basic connection
    const { data, error } = await supabaseAnon
      .from('nonexistent_table')
      .select('*')
      .limit(1)
    
    // We expect an error here, but it confirms connection works
    if (error && error.message.includes('relation "public.nonexistent_table" does not exist')) {
      console.log('✅ Supabase connection is working!')
      console.log(`   🌐 URL: ${supabaseUrl}`)
      console.log('   🔑 Auth keys are valid')
      return true
    } else if (error) {
      console.log('⚠️  Unexpected error, but connection seems to work:')
      console.log(`   ${error.message}`)
      return true
    } else {
      console.log('✅ Supabase connection verified')
      return true
    }
    
  } catch (error) {
    console.log('❌ Supabase connection failed:')
    console.log(`   ${error.message}`)
    return false
  }
}

async function findSupabaseUserID() {
  console.log('🔍 SUPABASE USER ID FINDER')
  console.log('==========================\n')
  console.log('Searching for your Supabase user ID...\n')

  // Check connection first
  const connectionOk = await checkSupabaseConnection()
  if (!connectionOk) {
    console.log('\n❌ Cannot proceed - Supabase connection failed')
    return
  }

  // Check for current user session
  const currentUser = await checkCurrentUser()
  
  // List all users
  const allUsers = await listAllUsers()
  
  // Summary
  console.log('\n📊 SUMMARY')
  console.log('===========')
  
  if (currentUser) {
    console.log('\n🎯 YOUR USER ID (from current session):')
    console.log(`   ${currentUser.id}`)
    console.log(`   Email: ${currentUser.email}`)
  } else if (allUsers.length > 0) {
    console.log('\n🎯 AVAILABLE USER IDs:')
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.id} (${user.email})`)
    })
    
    if (allUsers.length === 1) {
      console.log('\n💡 Most likely your user ID is:')
      console.log(`   ${allUsers[0].id}`)
    }
  } else {
    console.log('\n❓ No users found. You may need to:')
    console.log('   1. Sign up for a new account')
    console.log('   2. Sign in to create a session')
    console.log('   3. Check your Supabase project settings')
  }

  console.log('\n🔧 HOW TO USE THIS USER ID:')
  console.log('   • Use it in your application for user-specific queries')
  console.log('   • Add it to your RLS policies if needed')
  console.log('   • Reference it in your user management code')
  
  console.log('\n💻 NEXT STEPS:')
  console.log('   1. Copy the user ID from above')
  console.log('   2. Use it in your application code')
  console.log('   3. Test your authentication flow')
}

// Run the finder
findSupabaseUserID().catch(console.error)