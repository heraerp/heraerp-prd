#!/usr/bin/env node

/**
 * Create CivicFlow demo users for automatic authentication
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase credentials not found')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const CIVICFLOW_ORG_ID = '8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77'

const DEMO_USERS = [
  {
    id: 'e1f4a2b1-7c8d-4e5f-9a6b-3c2d5e8f9a1b',
    email: 'admin@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'Sarah Johnson',
    role: 'Administrator',
    department: 'IT Services'
  },
  {
    id: 'a2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    email: 'case.manager@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'Michael Chen',
    role: 'Case Manager',
    department: 'Social Services'
  },
  {
    id: 'b3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
    email: 'grants.officer@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'Emily Rodriguez',
    role: 'Grants Officer',
    department: 'Grants Management'
  },
  {
    id: 'c4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    email: 'outreach@civicflow-demo.gov',
    password: 'CivicFlowDemo2024!',
    fullName: 'David Thompson',
    role: 'Outreach Coordinator',
    department: 'Community Outreach'
  }
]

async function createDemoUsers() {
  console.log('🏛️ Creating CivicFlow demo users...\n')
  
  const createdUsers = []
  
  for (const demoUser of DEMO_USERS) {
    try {
      console.log(`Creating ${demoUser.fullName} (${demoUser.email})...`)
      
      // Create the user with specific UUID
      const { data: user, error: createError } = await supabase.auth.admin.createUser({
        email: demoUser.email,
        password: demoUser.password,
        email_confirm: true,
        user_metadata: {
          full_name: demoUser.fullName,
          role: demoUser.role,
          department: demoUser.department,
          organization_id: CIVICFLOW_ORG_ID
        }
      })
      
      if (createError) {
        if (createError.message.includes('already exists')) {
          console.log(`   ℹ️  ${demoUser.fullName} already exists`)
          
          // Get existing user
          const { data: existingUsers } = await supabase.auth.admin.listUsers()
          const existingUser = existingUsers?.users.find(u => u.email === demoUser.email)
          
          if (existingUser) {
            console.log(`   User ID: ${existingUser.id}`)
            createdUsers.push({
              ...demoUser,
              id: existingUser.id,
              exists: true
            })
          }
        } else {
          throw createError
        }
      } else {
        console.log(`   ✅ ${demoUser.fullName} created successfully`)
        console.log(`   User ID: ${user.user.id}`)
        createdUsers.push({
          ...demoUser,
          id: user.user.id,
          exists: false
        })
      }
      
    } catch (error) {
      console.error(`❌ Error creating ${demoUser.fullName}:`, error)
    }
  }
  
  return createdUsers
}

// Run the creation
createDemoUsers().then(users => {
  console.log('\n✨ CivicFlow demo users setup complete!')
  console.log('\n🔑 Demo Credentials:')
  console.log('Organization ID:', CIVICFLOW_ORG_ID)
  console.log('Password (all users): CivicFlowDemo2024!')
  console.log('\n👥 Demo Users:')
  
  users.forEach(user => {
    console.log(`\n${user.fullName}`)
    console.log(`├─ Email: ${user.email}`)
    console.log(`├─ Role: ${user.role}`)
    console.log(`├─ Department: ${user.department}`)
    console.log(`└─ Status: ${user.exists ? 'Already existed' : 'Newly created'}`)
  })
  
  console.log('\n🚀 Ready to use CivicFlow demo!')
  process.exit(0)
}).catch(error => {
  console.error('❌ Setup failed:', error)
  process.exit(1)
})