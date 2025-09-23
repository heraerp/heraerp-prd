#!/usr/bin/env node
/**
 * Update existing HairTalkz users with proper metadata
 */

require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function updateExistingUsers() {
  console.log('🔄 Updating HairTalkz Users Metadata')
  console.log('=====================================\n')
  
  try {
    // List all users
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError
    
    // Find HairTalkz users
    const hairtalkzEmails = [
      'owner@hairtalkz.ae',
      'receptionist@hairtalkz.ae', 
      'accountant@hairtalkz.ae',
      'admin@hairtalkz.ae',
      'stylist1@hairtalkz.ae',
      'stylist2@hairtalkz.ae'
    ]
    
    const rolePermissions = {
      owner: {
        full_name: 'Michele (Owner)',
        permissions: [
          'view_dashboard', 'view_financial_reports', 'manage_appointments',
          'manage_customers', 'manage_staff', 'manage_inventory',
          'manage_services', 'manage_settings', 'export_data',
          'view_analytics', 'manage_organization'
        ]
      },
      receptionist: {
        full_name: 'Sarah (Receptionist)',
        permissions: [
          'view_appointments', 'create_appointments', 'update_appointments',
          'cancel_appointments', 'view_customers', 'create_customers',
          'update_customers', 'process_payments', 'view_services',
          'view_staff_availability'
        ]
      },
      accountant: {
        full_name: 'John (Accountant)',
        permissions: [
          'view_financial_reports', 'export_financial_data', 'view_transactions',
          'manage_invoices', 'view_expenses', 'manage_expenses',
          'view_payroll', 'generate_reports', 'view_tax_reports',
          'manage_reconciliation'
        ]
      },
      admin: {
        full_name: 'Emma (Admin)',
        permissions: [
          'manage_users', 'manage_roles', 'manage_permissions',
          'view_system_logs', 'manage_integrations', 'manage_backups',
          'manage_security', 'view_audit_logs', 'manage_organization_settings',
          'manage_api_keys'
        ]
      },
      stylist: {
        full_name: 'Stylist',
        permissions: [
          'view_appointments', 'view_customers', 'update_appointment_status',
          'view_services', 'view_own_schedule', 'view_own_commissions'
        ]
      }
    }
    
    for (const user of users) {
      if (hairtalkzEmails.includes(user.email)) {
        console.log(`📧 Updating user: ${user.email}`)
        
        // Extract role from email
        let role = user.email.split('@')[0]
        if (role.startsWith('stylist')) role = 'stylist'
        
        const roleData = rolePermissions[role] || rolePermissions.owner
        let fullName = roleData.full_name
        
        // Special handling for stylists
        if (user.email === 'stylist1@hairtalkz.ae') fullName = 'Lisa (Senior Stylist)'
        if (user.email === 'stylist2@hairtalkz.ae') fullName = 'Maria (Stylist)'
        
        const metadata = {
          full_name: fullName,
          organization_id: HAIRTALKZ_ORG_ID,
          organization_name: 'HairTalkz',
          role: role,
          roles: [role],
          permissions: roleData.permissions
        }
        
        const { error: updateError } = await supabase.auth.admin.updateUserById(
          user.id,
          { user_metadata: metadata }
        )
        
        if (updateError) {
          console.log(`   ❌ Error: ${updateError.message}`)
        } else {
          console.log(`   ✅ Updated successfully`)
          console.log(`      Role: ${role}`)
          console.log(`      Name: ${fullName}`)
        }
      }
    }
    
    console.log('\n✅ All users updated!')
    console.log('\n🔑 Test Credentials:')
    console.log('=====================================')
    console.log('Email: owner@hairtalkz.ae')
    console.log('Password: (use your existing password)')
    console.log('\n📱 Access the salon at:')
    console.log('http://hairtalkz.localhost:3000/salon/auth')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

updateExistingUsers()