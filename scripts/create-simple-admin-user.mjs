#!/usr/bin/env node

/**
 * SIMPLE HERA ADMIN USER CREATION SCRIPT
 * 
 * Creates a Supabase user with admin privileges and updates their metadata
 * to grant admin access to the performance dashboard and other admin features.
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

// Environment configuration
const isDev = process.env.NODE_ENV === 'development'
const supabaseUrl = isDev 
  ? process.env.NEXT_PUBLIC_SUPABASE_URL
  : process.env.NEXT_PUBLIC_SUPABASE_PRODUCTION_URL
const supabaseServiceKey = isDev
  ? process.env.SUPABASE_SERVICE_ROLE_KEY
  : process.env.SUPABASE_PRODUCTION_SERVICE_ROLE_KEY

console.log('🛡️  SIMPLE HERA ADMIN USER CREATION')
console.log('==================================')
console.log(`Environment: ${isDev ? 'Development' : 'Production'}`)

// Validate environment
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  process.exit(1)
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Admin user configuration
const ADMIN_USER = {
  email: process.argv[2] || 'admin@heraerp.com',
  password: process.argv[3] || 'AdminPass123!',
  name: process.argv[4] || 'HERA Administrator'
}

console.log(`\n📧 Creating admin user: ${ADMIN_USER.email}`)

async function main() {
  try {
    // Step 1: Check if user exists
    console.log('\n🔍 Checking if user exists...')
    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    const existingUser = existingUsers?.users?.find(u => u.email === ADMIN_USER.email)

    let user
    if (existingUser) {
      console.log('✅ User already exists, updating permissions...')
      user = existingUser
    } else {
      console.log('🔧 Creating new user...')
      const { data: userData, error: userError } = await supabase.auth.admin.createUser({
        email: ADMIN_USER.email,
        password: ADMIN_USER.password,
        email_confirm: true,
        user_metadata: {
          name: ADMIN_USER.name,
          role: 'admin'
        }
      })

      if (userError) {
        throw new Error(`Failed to create user: ${userError.message}`)
      }
      
      user = userData.user
      console.log(`✅ User created: ${user.id}`)
    }

    // Step 2: Update user with admin metadata
    console.log('\n👑 Granting admin permissions...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      user_metadata: {
        ...user.user_metadata,
        name: ADMIN_USER.name,
        role: 'admin',
        is_admin: true,
        permissions: [
          'admin',
          'full_access',
          'performance_dashboard',
          'user_management',
          'system_configuration',
          'monitoring_access'
        ],
        organization_access: 'all',
        created_by_script: true,
        admin_level: 'system'
      }
    })

    if (updateError) {
      throw new Error(`Failed to update user permissions: ${updateError.message}`)
    }

    // Step 3: Verify admin access by checking user metadata
    console.log('\n✅ Verifying admin setup...')
    const { data: verifyUser } = await supabase.auth.admin.getUserById(user.id)
    
    console.log('✅ SUCCESS: Admin user ready!')
    console.log('============================')
    console.log(`\n📧 EMAIL: ${ADMIN_USER.email}`)
    console.log(`🔑 PASSWORD: ${ADMIN_USER.password}`)
    console.log(`👤 USER ID: ${user.id}`)
    console.log(`👑 ROLE: ${verifyUser?.user?.user_metadata?.role || 'admin'}`)

    console.log('\n🎯 ADMIN FEATURES ENABLED:')
    const permissions = verifyUser?.user?.user_metadata?.permissions || []
    permissions.forEach(perm => {
      console.log(`   ✅ ${perm}`)
    })

    console.log('\n🔗 ACCESS LINKS:')
    console.log('   🏠 Login: http://localhost:3000/auth/login')
    console.log('   📊 Performance Dashboard: http://localhost:3000/admin/performance') 
    console.log('   👥 User Management: http://localhost:3000/admin/users')
    console.log('   ⚙️  Admin Panel: http://localhost:3000/admin')

    console.log('\n📝 NEXT STEPS:')
    console.log('   1. Open http://localhost:3000/auth/login')
    console.log(`   2. Login with ${ADMIN_USER.email}`)
    console.log('   3. Navigate to the performance dashboard')
    console.log('   4. Verify admin access is working')

    console.log('\n🎉 Admin user is ready to use!')

  } catch (error) {
    console.error('\n❌ FAILED:', error.message)
    process.exit(1)
  }
}

// Handle help
if (process.argv.includes('--help')) {
  console.log('\nUsage: node scripts/create-simple-admin-user.mjs [email] [password] [name]')
  console.log('\nDefaults:')
  console.log('  email: admin@heraerp.com')
  console.log('  password: AdminPass123!')
  console.log('  name: HERA Administrator')
  process.exit(0)
}

main().catch(console.error)