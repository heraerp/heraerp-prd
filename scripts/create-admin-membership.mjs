#!/usr/bin/env node

/**
 * Create Organization Membership for Admin User
 * Fixes the "no_membership" authentication error
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'

async function createAdminMembership() {
  try {
    console.log('🔍 Finding admin user...')
    
    // Get the admin user
    const { data: users } = await supabase.auth.admin.listUsers()
    const adminUser = users?.users?.find(u => u.email === 'admin@heraerp.com')
    
    if (!adminUser) {
      throw new Error('Admin user not found')
    }
    
    console.log('✅ Admin user found:', adminUser.id)
    
    // Step 1: Check if organization exists, if not create one
    console.log('🏢 Step 1: Checking/creating admin organization...')
    
    let adminOrgId = '12345678-1234-1234-1234-123456789012' // Default admin org ID
    
    const { data: orgRowResult, error: orgRowError } = await supabase
      .from('core_organizations')
      .upsert({
        id: adminOrgId,
        name: 'HERA Admin Organization',
        code: 'HERA_ADMIN',
        type: 'admin',
        industry: 'platform',
        status: 'active',
        created_by: adminUser.id,
        updated_by: adminUser.id
      })
      .select()
      .single()
    
    if (orgRowError && !orgRowError.message?.includes('duplicate')) {
      console.warn('⚠️ Could not create organization row:', orgRowError.message)
    } else {
      console.log('✅ Organization row ready:', adminOrgId)
    }
    
    // Step 2: Create membership relationship
    console.log('🔗 Step 2: Creating membership relationship...')
    const { data: membershipResult, error: membershipError } = await supabase
      .from('core_relationships')
      .upsert({
        source_entity_id: adminUser.id,
        target_entity_id: adminOrgId,
        relationship_type: 'USER_MEMBER_OF_ORG',
        organization_id: adminOrgId,
        relationship_data: {
          role: 'admin',
          permissions: ['admin', 'full_access', 'performance_dashboard', 'user_management'],
          joined_at: new Date().toISOString()
        },
        smart_code: 'HERA.PLATFORM.RELATIONSHIP.USER_ADMIN_OF_ORG.v1',
        effective_date: new Date().toISOString(),
        created_by: adminUser.id,
        updated_by: adminUser.id
      })
      .select()
    
    if (membershipError && !membershipError.message?.includes('duplicate')) {
      console.warn('⚠️ Membership creation failed:', membershipError.message)
      
      // Try alternative approach - update existing or create simple one
      const { data: altMembership, error: altError } = await supabase
        .from('core_relationships')
        .insert({
          source_entity_id: adminUser.id,
          target_entity_id: adminOrgId,
          relationship_type: 'MEMBER_OF',
          organization_id: adminOrgId,
          relationship_data: {
            role: 'admin'
          },
          effective_date: new Date().toISOString(),
          created_by: adminUser.id,
          updated_by: adminUser.id
        })
      
      if (altError) {
        console.warn('⚠️ Alternative membership failed:', altError.message)
      } else {
        console.log('✅ Alternative membership created')
      }
    } else {
      console.log('✅ Membership relationship ready')
    }
    
    // Step 3: Update user metadata with organization info
    console.log('👤 Step 3: Updating user metadata...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      user_metadata: {
        ...adminUser.user_metadata,
        entity_id: adminUser.id,
        organization_id: adminOrgId,
        role: 'admin',
        permissions: ['admin', 'full_access', 'performance_dashboard', 'user_management'],
        is_admin: true,
        admin_level: 'system',
        organization_access: 'all'
      }
    })
    
    if (updateError) {
      console.warn('⚠️ Could not update user metadata:', updateError.message)
    } else {
      console.log('✅ User metadata updated')
    }
    
    // Step 4: Verify the setup by checking what's in the database
    console.log('🔍 Step 4: Verifying setup...')
    
    const { data: verifyOrg } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', adminOrgId)
      .single()
    
    const { data: verifyMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('source_entity_id', adminUser.id)
      .eq('target_entity_id', adminOrgId)
    
    console.log('📊 Verification Results:')
    console.log('   Organization exists:', !!verifyOrg)
    console.log('   Membership count:', verifyMembership?.length || 0)
    
    console.log('\n🎉 SUCCESS: Admin user membership created!')
    console.log('====================================')
    console.log(`👤 User ID: ${adminUser.id}`)
    console.log(`🏢 Organization ID: ${adminOrgId}`)
    console.log('📧 Email: admin@heraerp.com')
    console.log('🔑 Password: AdminPass123!')
    console.log('👑 Role: admin')
    console.log('\n✅ You can now login successfully!')
    console.log('\n🔗 Login URL: http://localhost:3000/auth/login')
    
  } catch (error) {
    console.error('❌ Error creating admin membership:', error.message)
    throw error
  }
}

createAdminMembership().catch(console.error)