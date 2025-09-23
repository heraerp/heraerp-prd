#!/usr/bin/env node
/**
 * Create HairTalkz salon users in Supabase Auth
 * This ensures proper authentication for the salon module
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:')
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✓' : '✗')
  console.error('\nMake sure your .env.local file contains these variables')
  process.exit(1)
}

// Create Supabase admin client
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// HairTalkz organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

// Users to create
const users = [
  {
    email: 'owner@hairtalkz.ae',
    password: 'HairTalkz2024!',
    full_name: 'Michele (Owner)',
    role: 'owner',
    permissions: [
      'view_dashboard', 'view_financial_reports', 'manage_appointments',
      'manage_customers', 'manage_staff', 'manage_inventory',
      'manage_services', 'manage_settings', 'export_data',
      'view_analytics', 'manage_organization'
    ]
  },
  {
    email: 'receptionist@hairtalkz.ae',
    password: 'HairTalkz2024!',
    full_name: 'Sarah (Receptionist)',
    role: 'receptionist',
    permissions: [
      'view_appointments', 'create_appointments', 'update_appointments',
      'cancel_appointments', 'view_customers', 'create_customers',
      'update_customers', 'process_payments', 'view_services',
      'view_staff_availability'
    ]
  },
  {
    email: 'accountant@hairtalkz.ae',
    password: 'HairTalkz2024!',
    full_name: 'John (Accountant)',
    role: 'accountant',
    permissions: [
      'view_financial_reports', 'export_financial_data', 'view_transactions',
      'manage_invoices', 'view_expenses', 'manage_expenses',
      'view_payroll', 'generate_reports', 'view_tax_reports',
      'manage_reconciliation'
    ]
  },
  {
    email: 'admin@hairtalkz.ae',
    password: 'HairTalkz2024!',
    full_name: 'Emma (Admin)',
    role: 'admin',
    permissions: [
      'manage_users', 'manage_roles', 'manage_permissions',
      'view_system_logs', 'manage_integrations', 'manage_backups',
      'manage_security', 'view_audit_logs', 'manage_organization_settings',
      'manage_api_keys'
    ]
  },
  {
    email: 'stylist1@hairtalkz.ae',
    password: 'HairTalkz2024!',
    full_name: 'Lisa (Senior Stylist)',
    role: 'stylist',
    permissions: [
      'view_appointments', 'view_customers', 'update_appointment_status',
      'view_services', 'view_own_schedule', 'view_own_commissions'
    ]
  },
  {
    email: 'stylist2@hairtalkz.ae',
    password: 'HairTalkz2024!',
    full_name: 'Maria (Stylist)',
    role: 'stylist',
    permissions: [
      'view_appointments', 'view_customers', 'update_appointment_status',
      'view_services', 'view_own_schedule', 'view_own_commissions'
    ]
  }
]

async function createUser(userData) {
  try {
    console.log(`\n🔄 Creating user: ${userData.email}...`)
    
    // First, try to sign up the user
    const { data: signUpData, error: signUpError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: userData.full_name,
        organization_id: HAIRTALKZ_ORG_ID,
        organization_name: 'HairTalkz',
        role: userData.role,
        roles: [userData.role],
        permissions: userData.permissions
      }
    })

    if (signUpError) {
      // Check if user already exists
      if (signUpError.message.includes('already registered') || 
          signUpError.message.includes('already exists')) {
        console.log(`   ⚠️  User already exists, updating metadata...`)
        
        // Get the existing user
        const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
        if (listError) throw listError
        
        const existingUser = users.find(u => u.email === userData.email)
        if (existingUser) {
          // Update user metadata
          const { error: updateError } = await supabase.auth.admin.updateUserById(
            existingUser.id,
            {
              user_metadata: {
                full_name: userData.full_name,
                organization_id: HAIRTALKZ_ORG_ID,
                organization_name: 'HairTalkz',
                role: userData.role,
                roles: [userData.role],
                permissions: userData.permissions
              }
            }
          )
          
          if (updateError) throw updateError
          console.log(`   ✅ User metadata updated successfully`)
          return existingUser
        }
      } else {
        throw signUpError
      }
    } else {
      console.log(`   ✅ User created successfully`)
      return signUpData.user
    }
  } catch (error) {
    console.error(`   ❌ Error creating user ${userData.email}:`, error.message)
    return null
  }
}

async function createHairTalkzUsers() {
  console.log('🏪 Creating HairTalkz Salon Users')
  console.log('=====================================')
  console.log(`Organization ID: ${HAIRTALKZ_ORG_ID}`)
  console.log(`Supabase URL: ${supabaseUrl}`)
  
  let successCount = 0
  let failureCount = 0
  
  for (const userData of users) {
    const result = await createUser(userData)
    if (result) {
      successCount++
    } else {
      failureCount++
    }
  }
  
  console.log('\n📊 Summary')
  console.log('=====================================')
  console.log(`✅ Successfully created/updated: ${successCount} users`)
  if (failureCount > 0) {
    console.log(`❌ Failed: ${failureCount} users`)
  }
  
  console.log('\n🔐 Login Credentials')
  console.log('=====================================')
  console.log('Password for all users: HairTalkz2024!')
  console.log('\nTest login URLs:')
  console.log('- Development: http://hairtalkz.localhost:3000/salon/auth')
  console.log('- Production: https://hairtalkz.heraerp.com/salon/auth')
  
  console.log('\n👥 Available Users:')
  users.forEach(user => {
    console.log(`- ${user.email} (${user.role}) - ${user.full_name}`)
  })
  
  console.log('\n✨ Done!')
}

// Run the script
createHairTalkzUsers().catch(console.error)