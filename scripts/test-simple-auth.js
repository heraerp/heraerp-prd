/**
 * Test script for Simple Auth System
 * Creates test users to validate the authentication flow
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase client
const supabaseUrl = 'https://hsumtzuqzoqccpjiaikh.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzdW10enVxem9xY2NwamlhaWtoIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzYwMDc4NywiZXhwIjoyMDY5MTc2Nzg3fQ.fMuyCMNmHY4jKy8JyYEkC8KM5BCWSlDS35OQDfZWhPc'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Test users to create
const testUsers = [
  {
    email: 'john@techstartup.com',
    password: 'testpass123',
    businessName: 'TechStartup Inc',
    businessType: 'technology'
  },
  {
    email: 'sarah@retailstore.com',
    password: 'testpass123',
    businessName: 'Sarah\'s Boutique',
    businessType: 'retail'
  },
  {
    email: 'mike@consultingfirm.com',
    password: 'testpass123',
    businessName: 'MJ Consulting Group',
    businessType: 'services'
  },
  {
    email: 'lisa@healthclinic.com',
    password: 'testpass123',
    businessName: 'Wellness Health Clinic',
    businessType: 'healthcare'
  },
  {
    email: 'alex@manufacturer.com',
    password: 'testpass123',
    businessName: 'Industrial Solutions Ltd',
    businessType: 'manufacturing'
  }
]

async function createTestUser(userData) {
  console.log(`\n📝 Creating user: ${userData.email}`)
  
  try {
    // Create Supabase auth user
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email for testing
      user_metadata: {
        full_name: userData.businessName,
        business_name: userData.businessName,
        business_type: userData.businessType
      }
    })

    if (error) {
      console.error(`❌ Error creating ${userData.email}:`, error.message)
      return
    }

    console.log(`✅ Successfully created: ${userData.email}`)
    console.log(`   - User ID: ${data.user.id}`)
    console.log(`   - Business: ${userData.businessName}`)
    console.log(`   - Type: ${userData.businessType}`)
    
    // Test login
    console.log(`🔐 Testing login for ${userData.email}...`)
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: userData.email,
      password: userData.password
    })

    if (loginError) {
      console.error(`❌ Login failed for ${userData.email}:`, loginError.message)
    } else {
      console.log(`✅ Login successful for ${userData.email}`)
      
      // Sign out to test next user
      await supabase.auth.signOut()
    }

  } catch (err) {
    console.error(`❌ Unexpected error for ${userData.email}:`, err.message)
  }
}

async function cleanupTestUsers() {
  console.log('\n🧹 Cleaning up existing test users...')
  
  for (const user of testUsers) {
    try {
      // Get user by email
      const { data: users, error: searchError } = await supabase.auth.admin.listUsers()
      
      if (!searchError && users) {
        const existingUser = users.users.find(u => u.email === user.email)
        if (existingUser) {
          const { error: deleteError } = await supabase.auth.admin.deleteUser(existingUser.id)
          if (!deleteError) {
            console.log(`🗑️  Deleted existing user: ${user.email}`)
          }
        }
      }
    } catch (err) {
      console.log(`⚠️  Could not cleanup ${user.email}:`, err.message)
    }
  }
}

async function runTests() {
  console.log('🚀 HERA Simple Auth Test Script')
  console.log('================================')
  
  // Cleanup first
  await cleanupTestUsers()
  
  console.log('\n📋 Creating test users...')
  
  // Create users sequentially to avoid rate limits
  for (const userData of testUsers) {
    await createTestUser(userData)
    
    // Small delay between users
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  console.log('\n✨ Test Summary:')
  console.log('================')
  console.log('Created 5 test users with different business types:')
  testUsers.forEach((user, index) => {
    console.log(`${index + 1}. ${user.email} - ${user.businessName} (${user.businessType})`)
  })
  
  console.log('\n📱 Test the Simple Auth UI:')
  console.log('1. Navigate to: http://localhost:3002/auth/simple')
  console.log('2. Try logging in with any test user')
  console.log('3. Password for all users: testpass123')
  console.log('\n🎯 You can also test registration with new users!')
}

// Run the tests
runTests().catch(console.error)