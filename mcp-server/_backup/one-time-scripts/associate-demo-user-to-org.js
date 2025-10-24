#!/usr/bin/env node

/**
 * Associate demo user with salon organization
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

async function associateDemoUser() {
  console.log('🎯 Associating demo user with salon organization...\n')
  
  const DEMO_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  const DEMO_USER_EMAIL = 'demo@herasalon.com'
  
  try {
    // Get the demo user
    console.log('1️⃣ Finding demo user...')
    const { data: users } = await supabase.auth.admin.listUsers()
    const demoUser = users?.users.find(u => u.email === DEMO_USER_EMAIL)
    
    if (!demoUser) {
      console.error('❌ Demo user not found')
      return
    }
    
    console.log('   ✅ Found demo user:', demoUser.id)
    
    // Check if user entity exists
    console.log('\n2️⃣ Checking user entity...')
    const { data: userEntity, error: entityError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'user')
      .eq('entity_code', `USR-${demoUser.id}`)
      .eq('organization_id', DEMO_ORG_ID)
      .single()
    
    if (!userEntity) {
      console.log('   Creating user entity...')
      
      const { error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: DEMO_ORG_ID,
          entity_type: 'user',
          entity_name: 'Demo User',
          entity_code: `USR-${demoUser.id}`,
          smart_code: 'HERA.SALON.USER.ENT.DEMO.v1',
          metadata: {
            email: DEMO_USER_EMAIL,
            role: 'owner',
            full_name: 'Demo User',
            auth_user_id: demoUser.id
          }
        })
      
      if (createError) {
        console.error('❌ Error creating user entity:', createError)
        return
      }
      
      console.log('   ✅ User entity created')
    } else {
      console.log('   ✅ User entity already exists')
    }
    
    // Update user metadata to include organization
    console.log('\n3️⃣ Updating user metadata...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      demoUser.id,
      {
        user_metadata: {
          ...demoUser.user_metadata,
          organization_id: DEMO_ORG_ID,
          default_organization_id: DEMO_ORG_ID
        }
      }
    )
    
    if (updateError) {
      console.error('❌ Error updating user metadata:', updateError)
      return
    }
    
    console.log('   ✅ User metadata updated')
    
    console.log('\n✨ Demo user association complete!')
    console.log('\nDemo User Details:')
    console.log('Email:', DEMO_USER_EMAIL)
    console.log('User ID:', demoUser.id)
    console.log('Organization ID:', DEMO_ORG_ID)
    console.log('Organization:', 'Hair Talkz Salon - DNA Testing')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run
associateDemoUser()