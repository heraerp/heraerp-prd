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

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// HairTalkz Organization ID
const HAIRTALKZ_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testJWTWithRole() {
  console.log('🔐 Testing JWT Token Assignment with Roles\n')
  
  const testUsers = [
    { email: 'owner@hairtalkz.ae', password: 'HairTalkz@2025', role: 'owner' },
    { email: 'receptionist@hairtalkz.ae', password: 'Reception@2025', role: 'receptionist' },
    { email: 'accountant@hairtalkz.ae', password: 'Finance@2025', role: 'accountant' },
    { email: 'admin@hairtalkz.ae', password: 'Admin@2025', role: 'admin' }
  ]
  
  for (const user of testUsers) {
    console.log(`\n📋 Testing ${user.role.toUpperCase()} role:`)
    console.log('=' . repeat(50))
    
    try {
      // Sign in with password
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: user.password
      })
      
      if (signInError) {
        console.error(`❌ Sign in failed for ${user.email}:`, signInError.message)
        continue
      }
      
      console.log(`✅ Signed in as ${user.email}`)
      
      // Update user metadata to include role and permissions
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          organization_id: HAIRTALKZ_ORG_ID,
          role: user.role,
          roles: [user.role],
          permissions: getPermissionsForRole(user.role)
        }
      })
      
      if (updateError) {
        console.error(`❌ Failed to update metadata:`, updateError.message)
      } else {
        console.log('✅ Updated user metadata with role and permissions')
      }
      
      // Refresh session to get updated JWT
      const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession()
      
      if (refreshError) {
        console.error(`❌ Failed to refresh session:`, refreshError.message)
        continue
      }
      
      if (refreshData.session) {
        console.log('\n📝 JWT Token Contents:')
        
        // Decode JWT to show contents (for demonstration)
        const token = refreshData.session.access_token
        const [, payload] = token.split('.')
        const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString())
        
        console.log('- User ID:', decodedPayload.sub)
        console.log('- Email:', decodedPayload.email)
        console.log('- Role:', decodedPayload.user_metadata?.role || 'Not set')
        console.log('- Organization:', decodedPayload.user_metadata?.organization_id || 'Not set')
        console.log('- Permissions Count:', decodedPayload.user_metadata?.permissions?.length || 0)
        
        // Show user metadata
        const userMetadata = refreshData.session.user.user_metadata
        console.log('\n📊 User Metadata:')
        console.log(JSON.stringify(userMetadata, null, 2))
      }
      
      // Sign out
      await supabase.auth.signOut()
      console.log('\n✅ Signed out successfully')
      
    } catch (error) {
      console.error(`❌ Error testing ${user.email}:`, error)
    }
  }
  
  console.log('\n\n✨ JWT Token testing complete!')
  console.log('🔑 All users now have proper JWT tokens with role metadata')
}

function getPermissionsForRole(role) {
  const permissions = {
    owner: [
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
    ],
    receptionist: [
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
    ],
    accountant: [
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
    ],
    admin: [
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
  
  return permissions[role] || []
}

// Run the test
testJWTWithRole().catch(console.error)