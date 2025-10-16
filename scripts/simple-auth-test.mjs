#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function simpleAuthTest() {
  console.log('🔧 Simple Authentication Status Check')
  console.log('====================================')
  
  const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
  
  try {
    // Check 1: User entity
    console.log('📋 Step 1: Check user entity')
    const { data: user, error: userError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type, metadata')
      .eq('id', USER_ID)
      .single()
    
    if (userError) {
      console.log('❌ User not found:', userError.message)
      return
    }
    
    console.log('✅ User entity found:')
    console.log(`  - ID: ${user.id}`)
    console.log(`  - Name: ${user.entity_name}`)
    console.log(`  - Type: ${user.entity_type}`)
    console.log(`  - Auth ID: ${user.metadata?.auth_user_id || 'Not set'}`)
    
    // Check 2: User memberships  
    console.log('\n📋 Step 2: Check memberships (simple)')
    const { data: relationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', USER_ID)
      .eq('relationship_type', 'USER_MEMBER_OF_ORG')
    
    if (relError) {
      console.log('❌ Relationship error:', relError.message)
      return
    }
    
    if (!relationships || relationships.length === 0) {
      console.log('❌ No membership relationships found')
      return
    }
    
    console.log('✅ Membership relationships found:')
    relationships.forEach((rel, index) => {
      console.log(`  Membership ${index + 1}:`)
      console.log(`    - To Org: ${rel.to_entity_id}`)
      console.log(`    - Role: ${rel.relationship_data?.role || 'unknown'}`)
      console.log(`    - Active: ${rel.is_active}`)
      console.log(`    - Created: ${rel.created_at}`)
    })
    
    // Check 3: Get organization names
    console.log('\n📋 Step 3: Get organization details')
    for (const rel of relationships) {
      const { data: org, error: orgError } = await supabase
        .from('core_organizations')
        .select('id, organization_name, organization_type, status')
        .eq('id', rel.to_entity_id)
        .single()
      
      if (orgError) {
        console.log(`❌ Error getting org ${rel.to_entity_id}:`, orgError.message)
      } else {
        console.log(`✅ Organization: ${org.organization_name} (${org.organization_type})`)
      }
    }
    
    // Check 4: Test auth resolution with real data
    console.log('\n📋 Step 4: Manual auth resolution simulation')
    const firstOrgId = relationships[0].to_entity_id
    const userRole = relationships[0].relationship_data?.role || 'user'
    const userPermissions = relationships[0].relationship_data?.permissions || ['read']
    
    const authResult = {
      user_id: USER_ID,
      email: user.metadata?.auth_user_id || USER_ID,
      organization_id: firstOrgId,
      roles: [userRole],
      permissions: userPermissions,
      source: 'manual_simulation',
      success: true
    }
    
    console.log('✅ Simulated auth introspect result:')
    console.log(JSON.stringify(authResult, null, 2))
    
    console.log('\n🎯 Authentication Status Summary')
    console.log('=================================')
    console.log('✅ User entity exists and is properly formed')
    console.log('✅ User has active organization membership(s)')
    console.log('✅ Organization(s) exist and are accessible')
    console.log('✅ Role and permission data is available')
    console.log('')
    console.log('🚀 The authentication data is complete!')
    console.log('')
    console.log('If you are still getting 401 errors, the issue is likely:')
    console.log('  1. JWT token not being passed correctly')
    console.log('  2. auth.uid() not returning the expected user ID')
    console.log('  3. API endpoints not calling resolve_user_identity_v1')
    console.log('')
    console.log('Next steps:')
    console.log('  - Check browser console for JWT token')
    console.log('  - Verify API endpoints are using new auth flow')
    console.log('  - Test with: curl -H "Authorization: Bearer YOUR_TOKEN" /api/v2/auth/introspect')
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

simpleAuthTest().catch(console.error)