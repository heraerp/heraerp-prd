#!/usr/bin/env node

/**
 * Create organization membership for demo user
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

async function createOrgMembership() {
  console.log('🎯 Creating organization membership for demo user...\n')
  
  const DEMO_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
  const DEMO_USER_EMAIL = 'demo@herasalon.com'
  const DEMO_USER_ID = '1414c640-69e9-4f17-8cd9-6b934308c7cf'
  
  try {
    // Check if organization exists
    console.log('1️⃣ Checking organization...')
    const { data: org, error: orgError } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', DEMO_ORG_ID)
      .single()
    
    if (orgError || !org) {
      console.error('❌ Organization not found:', orgError)
      return
    }
    
    console.log('   ✅ Found organization:', org.organization_name)
    
    // Create user membership using the organizations API
    console.log('\n2️⃣ Creating membership via API...')
    
    // First, let's check the current user memberships
    const { data: existingMemberships, error: checkError } = await supabase
      .rpc('get_user_organizations', { p_user_id: DEMO_USER_ID })
    
    if (!checkError) {
      console.log('   Existing memberships:', existingMemberships)
    }
    
    // Create membership directly in the junction table (if it exists)
    console.log('\n3️⃣ Checking for organization_users table...')
    
    // Try to insert into organization_users if it exists
    const { error: membershipError } = await supabase
      .from('organization_users')
      .insert({
        organization_id: DEMO_ORG_ID,
        user_id: DEMO_USER_ID,
        role: 'owner',
        is_active: true
      })
    
    if (membershipError) {
      if (membershipError.code === '42P01') {
        console.log('   ℹ️  No organization_users table found')
        
        // Try alternative approach - update organization metadata
        console.log('\n4️⃣ Adding user to organization metadata...')
        const updatedMetadata = {
          ...org.metadata,
          authorized_users: [
            ...(org.metadata?.authorized_users || []),
            {
              user_id: DEMO_USER_ID,
              email: DEMO_USER_EMAIL,
              role: 'owner',
              added_at: new Date().toISOString()
            }
          ]
        }
        
        const { error: updateError } = await supabase
          .from('core_organizations')
          .update({ metadata: updatedMetadata })
          .eq('id', DEMO_ORG_ID)
        
        if (updateError) {
          console.error('❌ Failed to update organization:', updateError)
        } else {
          console.log('   ✅ Added user to organization metadata')
        }
      } else if (membershipError.code === '23505') {
        console.log('   ℹ️  Membership already exists')
      } else {
        console.error('❌ Error creating membership:', membershipError)
      }
    } else {
      console.log('   ✅ Membership created successfully')
    }
    
    // Create demo settings data
    console.log('\n5️⃣ Creating demo settings data...')
    
    // Sales policy
    await supabase
      .from('core_dynamic_data')
      .upsert({
        organization_id: DEMO_ORG_ID,
        entity_id: DEMO_ORG_ID,
        field_name: 'SALES_POLICY.v1',
        field_value_json: {
          vatEnabled: true,
          vatRate: 5,
          vatInclusive: false,
          tipEnabled: true,
          defaultTipPercentage: 15,
          commissionEnabled: true,
          defaultCommissionPercentage: 30
        },
        smart_code: 'HERA.SALON.SETTINGS.SALES_POLICY.v1'
      })
    
    console.log('   ✅ Sales policy created')
    
    // System settings
    await supabase
      .from('core_dynamic_data')
      .upsert({
        organization_id: DEMO_ORG_ID,
        entity_id: DEMO_ORG_ID,
        field_name: 'SYSTEM_SETTINGS.v1',
        field_value_json: {
          timezone: 'Asia/Dubai',
          currency: 'AED',
          dateFormat: 'DD/MM/YYYY',
          language: 'en'
        },
        smart_code: 'HERA.SALON.SETTINGS.SYSTEM.v1'
      })
    
    console.log('   ✅ System settings created')
    
    console.log('\n✨ Demo organization setup complete!')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run
createOrgMembership()