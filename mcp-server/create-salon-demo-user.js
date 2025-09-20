#!/usr/bin/env node

/**
 * Create salon demo user for automatic authentication
 */

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

dotenv.config({ path: '../.env.local' })

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

async function createDemoUser() {
  console.log('🎯 Creating salon demo user...\n')
  
  const DEMO_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  
  try {
    // Create the user
    console.log('1️⃣ Creating demo user account...')
    const { data: user, error: createError } = await supabase.auth.admin.createUser({
      email: 'demo@herasalon.com',
      password: 'HeraSalonDemo2024!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Demo User',
        role: 'owner'
      }
    })
    
    if (createError) {
      if (createError.message.includes('already exists')) {
        console.log('   ℹ️  Demo user already exists')
        
        // Get existing user
        const { data: existingUsers } = await supabase.auth.admin.listUsers()
        const existingUser = existingUsers?.users.find(u => u.email === 'demo@herasalon.com')
        
        if (existingUser) {
          console.log('   User ID:', existingUser.id)
          return existingUser.id
        }
      } else {
        throw createError
      }
    } else {
      console.log('   ✅ Demo user created successfully')
      console.log('   User ID:', user.user.id)
      return user.user.id
    }
    
  } catch (error) {
    console.error('❌ Error creating demo user:', error)
    process.exit(1)
  }
}

// Run the creation
createDemoUser().then(userId => {
  console.log('\n✨ Demo user setup complete!')
  console.log('\nDemo Credentials:')
  console.log('Email: demo@herasalon.com')
  console.log('Password: HeraSalonDemo2024!')
  console.log('Organization ID: 0fd09e31-d257-4329-97eb-7d7f522ed6f0')
  process.exit(0)
})