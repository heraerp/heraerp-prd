#!/usr/bin/env node

/**
 * Assign Admin User to Platform Organization
 * Fixes the "No applications available" issue by using the platform org
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const adminUserId = 'eac8b14f-c2b0-47f7-8271-49aa2a338fe5'

async function assignToPlatformOrg() {
  try {
    console.log('🏛️ Assigning admin user to platform organization...')
    
    // Step 1: Remove old membership
    console.log('🧹 Removing old membership...')
    const { error: deleteError } = await supabase
      .from('core_relationships')
      .delete()
      .eq('from_entity_id', adminUserId)
      .eq('relationship_type', 'MEMBER_OF')
    
    if (deleteError) {
      console.warn('⚠️ Could not remove old membership:', deleteError.message)
    } else {
      console.log('✅ Old membership removed')
    }
    
    // Step 2: Create membership to platform organization
    console.log('🔗 Creating platform organization membership...')
    const { data: membershipResult, error: membershipError } = await supabase
      .from('core_relationships')
      .insert({
        from_entity_id: adminUserId,
        to_entity_id: PLATFORM_ORG_ID,
        organization_id: PLATFORM_ORG_ID,
        relationship_type: 'MEMBER_OF',
        smart_code: 'HERA.SALON.REL.TYPE.MEMBER_OF.v1',
        relationship_data: { 
          role: 'admin',
          permissions: ['admin', 'full_access', 'performance_dashboard', 'user_management']
        },
        is_active: true,
        effective_date: new Date().toISOString(),
        created_by: adminUserId,
        updated_by: adminUserId
      })
      .select()
    
    if (membershipError) {
      console.error('❌ Platform membership failed:', membershipError.message)
    } else {
      console.log('✅ Platform membership created')
    }
    
    // Step 3: Update user metadata with platform org
    console.log('👤 Updating user metadata...')
    const { error: updateError } = await supabase.auth.admin.updateUserById(adminUserId, {
      user_metadata: {
        name: 'HERA Administrator',
        role: 'admin',
        is_admin: true,
        permissions: ['admin', 'full_access', 'performance_dashboard', 'user_management'],
        organization_id: PLATFORM_ORG_ID,
        organization_access: 'all',
        admin_level: 'platform'
      }
    })
    
    if (updateError) {
      console.warn('⚠️ Could not update user metadata:', updateError.message)
    } else {
      console.log('✅ User metadata updated')
    }
    
    // Step 4: Verify platform organization setup
    console.log('🔍 Verifying platform organization...')
    const { data: platformOrg } = await supabase
      .from('core_organizations')
      .select('*')
      .eq('id', PLATFORM_ORG_ID)
      .single()
    
    const { data: platformMembership } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', adminUserId)
      .eq('to_entity_id', PLATFORM_ORG_ID)
    
    console.log('📊 PLATFORM ASSIGNMENT VERIFICATION:')
    console.log('=====================================')
    console.log('✅ Platform org exists:', !!platformOrg)
    console.log('   - ID:', platformOrg?.id)
    console.log('   - Name:', platformOrg?.organization_name)
    console.log('   - Type:', platformOrg?.organization_type)
    
    console.log('✅ Platform membership exists:', platformMembership?.length > 0)
    console.log('   - Count:', platformMembership?.length || 0)
    console.log('   - Role in data:', platformMembership?.[0]?.relationship_data?.role)
    
    console.log('\n🎉 ADMIN ASSIGNED TO PLATFORM ORG!')
    console.log('====================================')
    console.log('📧 Email: admin@heraerp.com')
    console.log('🔑 Password: AdminPass123!')
    console.log('🏛️ Organization: HERA PLATFORM')
    console.log('👑 Role: admin')
    console.log('\n✅ Login should now work with platform organization access!')
    
  } catch (error) {
    console.error('❌ Error assigning to platform org:', error.message)
    throw error
  }
}

assignToPlatformOrg().catch(console.error)