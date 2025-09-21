#!/usr/bin/env node
/**
 * Setup Salon Demo Users Script
 * 
 * Creates demo users for Hair Talkz salon with different roles
 * 
 * Run with: node scripts/setup-salon-demo-users.js
 */

const { createClient } = require('@supabase/supabase-js')
const dotenv = require('dotenv')

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const SALON_ORG_ID = '48f96c62-4e45-42f1-8a50-d2f4b3a7f803'

const DEMO_USERS = [
  {
    email: 'owner@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'Sarah Martinez',
    role: 'Owner',
    department: 'Management'
  },
  {
    email: 'receptionist@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'Emily Johnson',
    role: 'Receptionist',
    department: 'Front Desk'
  },
  {
    email: 'accountant@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'Michael Chen',
    role: 'Accountant',
    department: 'Finance'
  },
  {
    email: 'admin@hairtalkz-demo.com',
    password: 'HairTalkzDemo2025!',
    fullName: 'David Thompson',
    role: 'Administrator',
    department: 'IT & Operations'
  }
]

async function createDemoUser(user) {
  try {
    console.log(`\n🔄 Creating ${user.role}: ${user.email}`)

    // Check if user already exists
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers()
    
    if (checkError) {
      console.error(`❌ Error checking users:`, checkError)
      return false
    }

    const existingUser = existingUsers?.users?.find(u => u.email === user.email)
    
    if (existingUser) {
      console.log(`⚠️  User already exists, updating metadata...`)
      
      // Update user metadata
      const { error: updateError } = await supabase.auth.admin.updateUserById(
        existingUser.id,
        {
          user_metadata: {
            full_name: user.fullName,
            organization_id: SALON_ORG_ID,
            role: user.role,
            department: user.department
          }
        }
      )

      if (updateError) {
        console.error(`❌ Error updating user:`, updateError)
        return false
      }

      console.log(`✅ Updated existing user: ${user.email}`)
      return true
    }

    // Create new user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true,
      user_metadata: {
        full_name: user.fullName,
        organization_id: SALON_ORG_ID,
        role: user.role,
        department: user.department
      }
    })

    if (createError) {
      console.error(`❌ Error creating user:`, createError)
      return false
    }

    console.log(`✅ Created user: ${user.email}`)
    return true
  } catch (error) {
    console.error(`❌ Unexpected error:`, error)
    return false
  }
}

async function main() {
  console.log('🚀 Hair Talkz Salon Demo User Setup')
  console.log('=====================================')
  console.log(`Organization ID: ${SALON_ORG_ID}`)
  console.log('=====================================')

  let successCount = 0
  let failureCount = 0

  for (const user of DEMO_USERS) {
    const success = await createDemoUser(user)
    if (success) {
      successCount++
    } else {
      failureCount++
    }
  }

  console.log('\n=====================================')
  console.log('📊 Setup Summary:')
  console.log(`✅ Successfully created/updated: ${successCount} users`)
  if (failureCount > 0) {
    console.log(`❌ Failed: ${failureCount} users`)
  }
  console.log('=====================================')

  if (successCount > 0) {
    console.log('\n🎉 Demo users are ready!')
    console.log('Navigate to: http://localhost:3000/salon/auth')
    console.log('\nDemo Credentials:')
    DEMO_USERS.forEach(user => {
      console.log(`\n${user.role}:`)
      console.log(`  Email: ${user.email}`)
      console.log(`  Password: ${user.password}`)
    })
  }
}

// Run the setup
main().catch(console.error)