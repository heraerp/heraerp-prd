#!/usr/bin/env node

/**
 * HERA Jewelry Demo Users Creation Script
 * 
 * This script creates demo users in Supabase for the jewelry module
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const JEWELRY_DEMO_ORG_ID = 'f8d2c5e7-9a4b-6c8d-0e1f-2a3b4c5d6e7f'
const DEMO_PASSWORD = 'JewelryDemo2024!'

const DEMO_USERS = [
  {
    id: 'j1a2b3c4-5d6e-7f8a-9b0c-1d2e3f4a5b6c',
    email: 'owner@jewelry-demo.com',
    fullName: 'Isabella Sterling',
    role: 'Owner',
    department: 'Executive',
    description: 'Full system access, financial oversight, strategic decisions'
  },
  {
    id: 'j2b3c4d5-6e7f-8a9b-0c1d-2e3f4a5b6c7d',
    email: 'manager@jewelry-demo.com',
    fullName: 'Alexander Gold',
    role: 'Manager',
    department: 'Operations',
    description: 'Inventory management, staff oversight, customer relations'
  },
  {
    id: 'j3c4d5e6-7f8a-9b0c-1d2e-3f4a5b6c7d8e',
    email: 'sales@jewelry-demo.com',
    fullName: 'Sophia Gemstone',
    role: 'Sales Associate',
    department: 'Sales',
    description: 'Customer service, transactions, product consultation'
  },
  {
    id: 'j4d5e6f7-8a9b-0c1d-2e3f-4a5b6c7d8e9f',
    email: 'appraiser@jewelry-demo.com',
    fullName: 'Marcus Brilliant',
    role: 'Certified Appraiser',
    department: 'Appraisal',
    description: 'Jewelry appraisals, certifications, quality assessments'
  },
  {
    id: 'j5e6f7a8-9b0c-1d2e-3f4a-5b6c7d8e9f0a',
    email: 'security@jewelry-demo.com',
    fullName: 'Victoria Noble',
    role: 'Security Manager',
    department: 'Security',
    description: 'Asset protection, vault management, insurance compliance'
  },
  {
    id: 'j6f7a8b9-0c1d-2e3f-4a5b-6c7d8e9f0a1b',
    email: 'staff@jewelry-demo.com',
    fullName: 'Emma Precious',
    role: 'Staff Member',
    department: 'General',
    description: 'Basic access, customer assistance, inventory support'
  }
]

async function createDemoUsers() {
  console.log('🏆 Creating HERA Jewelry Demo Users')
  console.log('===================================')
  console.log('')

  for (const user of DEMO_USERS) {
    try {
      console.log(`👤 Creating user: ${user.fullName} (${user.email})`)
      
      // Create the user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: DEMO_PASSWORD,
        email_confirm: true,
        user_metadata: {
          full_name: user.fullName,
          role: user.role,
          department: user.department,
          organization_id: JEWELRY_DEMO_ORG_ID,
          jewelry_demo: true
        }
      })

      if (authError) {
        if (authError.message.includes('User already registered')) {
          console.log(`   ⚠️  User already exists, updating metadata...`)
          
          // Update existing user metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            user.id,
            {
              user_metadata: {
                full_name: user.fullName,
                role: user.role,
                department: user.department,
                organization_id: JEWELRY_DEMO_ORG_ID,
                jewelry_demo: true
              }
            }
          )
          
          if (updateError) {
            console.log(`   ❌ Failed to update user: ${updateError.message}`)
          } else {
            console.log(`   ✅ User metadata updated successfully`)
          }
        } else {
          console.log(`   ❌ Failed to create user: ${authError.message}`)
        }
        continue
      }

      console.log(`   ✅ User created successfully`)
      console.log(`   📧 Email: ${user.email}`)
      console.log(`   🔑 Password: ${DEMO_PASSWORD}`)
      console.log(`   👑 Role: ${user.role}`)
      console.log('')
      
    } catch (error) {
      console.log(`   ❌ Error creating user ${user.email}: ${error.message}`)
      console.log('')
    }
  }

  console.log('🎯 Demo Organization Setup')
  console.log('==========================')
  console.log(`Organization ID: ${JEWELRY_DEMO_ORG_ID}`)
  console.log('Demo Password (all users): ' + DEMO_PASSWORD)
  console.log('')
  
  console.log('🔗 Quick Access:')
  console.log('================')
  console.log('Demo Selection: http://localhost:3000/jewelry/demo')
  console.log('Dashboard: http://localhost:3000/jewelry/dashboard')
  console.log('Search: http://localhost:3000/jewelry/search')
  console.log('')
  
  console.log('✨ Setup Complete!')
  console.log('You can now use any of the demo accounts to access the jewelry module.')
  console.log('')
}

// Run the script
createDemoUsers().catch(console.error)