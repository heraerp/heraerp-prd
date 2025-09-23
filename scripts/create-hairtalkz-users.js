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

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// HairTalkz Organization ID (Michele's salon)
// IMPORTANT: This must match the ID used in the application
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

// Define the users to create
const users = [
  {
    email: 'owner@hairtalkz.ae',
    password: 'HairTalkz@2025',
    metadata: {
      full_name: 'Michele Rodriguez',
      role: 'owner',
      roles: ['owner'],
      organization_id: HAIRTALKZ_ORG_ID,
      permissions: [
        'view_dashboard',
        'view_financial_reports',
        'manage_appointments',
        'manage_customers',
        'manage_staff',
        'manage_inventory',
        'manage_services',
        'manage_settings',
        'export_data',
        'view_analytics',
        'manage_organization'
      ]
    }
  },
  {
    email: 'receptionist@hairtalkz.ae',
    password: 'Reception@2025',
    metadata: {
      full_name: 'Sarah Johnson',
      role: 'receptionist',
      roles: ['receptionist'],
      organization_id: HAIRTALKZ_ORG_ID,
      permissions: [
        'view_appointments',
        'create_appointments',
        'update_appointments',
        'cancel_appointments',
        'view_customers',
        'create_customers',
        'update_customers',
        'process_payments',
        'view_services',
        'view_staff_availability'
      ]
    }
  },
  {
    email: 'accountant@hairtalkz.ae',
    password: 'Finance@2025',
    metadata: {
      full_name: 'Michael Chen',
      role: 'accountant',
      roles: ['accountant'],
      organization_id: HAIRTALKZ_ORG_ID,
      permissions: [
        'view_financial_reports',
        'export_financial_data',
        'view_transactions',
        'manage_invoices',
        'view_expenses',
        'manage_expenses',
        'view_payroll',
        'generate_reports',
        'view_tax_reports',
        'manage_reconciliation'
      ]
    }
  },
  {
    email: 'admin@hairtalkz.ae',
    password: 'Admin@2025',
    metadata: {
      full_name: 'David Thompson',
      role: 'admin',
      roles: ['admin'],
      organization_id: HAIRTALKZ_ORG_ID,
      permissions: [
        'manage_users',
        'manage_roles',
        'manage_permissions',
        'view_system_logs',
        'manage_integrations',
        'manage_backups',
        'manage_security',
        'view_audit_logs',
        'manage_organization_settings',
        'manage_api_keys'
      ]
    }
  }
]

async function createUsers() {
  console.log('🌟 Creating HairTalkz users...\n')
  
  for (const user of users) {
    try {
      // Create the user
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: user.metadata
      })

      if (error) {
        if (error.message.includes('already') || error.message.includes('registered')) {
          console.log(`⚠️  User ${user.email} already exists`)
          
          // Try to find the existing user
          const { data: { users: existingUsers } } = await supabase.auth.admin.listUsers()
          const existingUser = existingUsers?.find(u => u.email === user.email)
          
          if (existingUser) {
            // Update the existing user
            const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
              existingUser.id,
              {
                user_metadata: user.metadata
              }
            )
            
            if (updateError) {
              console.error(`❌ Failed to update ${user.email}:`, updateError.message)
            } else {
              console.log(`✅ Updated metadata for ${user.email}`)
            }
          }
        } else {
          console.error(`❌ Failed to create ${user.email}:`, error.message)
        }
      } else {
        console.log(`✅ Created user: ${user.email}`)
      }
    } catch (err) {
      console.error(`❌ Error with ${user.email}:`, err)
    }
  }

  console.log('\n📋 User Credentials Summary:')
  console.log('================================')
  users.forEach(user => {
    console.log(`\n${user.metadata.role.toUpperCase()}:`)
    console.log(`  Name: ${user.metadata.full_name}`)
    console.log(`  Email: ${user.email}`)
    console.log(`  Password: ${user.password}`)
  })
  
  console.log('\n✨ HairTalkz users setup complete!')
  console.log('🔗 Access the system at: http://localhost:3001/salon/auth')
}

// Run the script
createUsers().catch(console.error)