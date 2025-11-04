#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function checkCashewUserRole() {
  console.log('🔍 Checking cashew@heraerp.com role...\n')

  const email = 'cashew@heraerp.com'

  try {
    // Step 1: Find auth user
    console.log('📋 Step 1: Finding auth user...')
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const authUser = users.users.find(u => u.email === email)
    if (!authUser) {
      throw new Error(`Auth user ${email} not found`)
    }

    console.log(`✅ Auth User ID: ${authUser.id}\n`)

    // Step 2: Find USER entity
    console.log('📋 Step 2: Finding USER entity...')
    const { data: userEntities, error: entityError } = await supabase
      .from('core_entities')
      .select('id, entity_type, entity_name, smart_code, metadata')
      .eq('entity_type', 'USER')

    if (entityError) throw entityError

    // Look for user entity by auth ID or metadata
    let userEntity = userEntities.find(e => e.id === authUser.id)
    if (!userEntity) {
      // Try to find by metadata
      userEntity = userEntities.find(e =>
        e.metadata?.supabase_user_id === authUser.id
      )
    }

    if (!userEntity) {
      throw new Error('USER entity not found')
    }

    console.log(`✅ USER Entity ID: ${userEntity.id}`)
    console.log(`   Entity Name: ${userEntity.entity_name}`)
    console.log(`   Smart Code: ${userEntity.smart_code}\n`)

    // Step 3: Find MEMBER_OF relationships
    console.log('📋 Step 3: Finding MEMBER_OF relationships...')
    const { data: memberships, error: memberError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, from_entity_id, to_entity_id, relationship_data')
      .eq('relationship_type', 'MEMBER_OF')
      .eq('from_entity_id', userEntity.id)

    if (memberError) throw memberError

    if (!memberships || memberships.length === 0) {
      console.log('❌ No MEMBER_OF relationships found\n')
    } else {
      console.log(`✅ Found ${memberships.length} MEMBER_OF relationship(s):\n`)

      for (const membership of memberships) {
        // Get organization details
        const { data: org, error: orgError } = await supabase
          .from('core_organizations')
          .select('id, organization_code, organization_name')
          .eq('id', membership.to_entity_id)
          .single()

        if (!orgError && org) {
          console.log(`   Organization: ${org.organization_name} (${org.organization_code})`)
          console.log(`   Organization ID: ${org.id}`)
          console.log(`   Membership ID: ${membership.id}`)
          console.log(`   Role from relationship_data: ${membership.relationship_data?.role || 'N/A'}`)
          console.log()
        }
      }
    }

    // Step 4: Find HAS_ROLE relationships
    console.log('📋 Step 4: Finding HAS_ROLE relationships...')
    const { data: roles, error: roleError } = await supabase
      .from('core_relationships')
      .select('id, relationship_type, from_entity_id, to_entity_id, relationship_data, organization_id')
      .eq('relationship_type', 'HAS_ROLE')
      .eq('from_entity_id', userEntity.id)

    if (roleError) throw roleError

    if (!roles || roles.length === 0) {
      console.log('❌ No HAS_ROLE relationships found\n')
    } else {
      console.log(`✅ Found ${roles.length} HAS_ROLE relationship(s):\n`)

      for (const roleRel of roles) {
        // Get role entity details
        const { data: roleEntity, error: roleEntityError } = await supabase
          .from('core_entities')
          .select('id, entity_type, entity_code, entity_name, metadata')
          .eq('id', roleRel.to_entity_id)
          .single()

        // Get organization for this role
        const { data: org, error: orgError } = await supabase
          .from('core_organizations')
          .select('id, organization_code, organization_name')
          .eq('id', roleRel.organization_id)
          .single()

        console.log(`   Role Relationship ID: ${roleRel.id}`)
        if (!orgError && org) {
          console.log(`   Organization: ${org.organization_name} (${org.organization_code})`)
        }
        if (!roleEntityError && roleEntity) {
          console.log(`   Role Entity: ${roleEntity.entity_name || roleEntity.entity_code}`)
          console.log(`   Role Code: ${roleEntity.entity_code}`)
        }
        console.log(`   Role from relationship_data: ${roleRel.relationship_data?.role_code || roleRel.relationship_data?.role || 'N/A'}`)
        console.log()
      }
    }

    // Summary
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📊 SUMMARY')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`Email: ${email}`)
    console.log(`Auth User ID: ${authUser.id}`)
    console.log(`USER Entity ID: ${userEntity.id}`)
    console.log(`Organizations: ${memberships?.length || 0}`)
    console.log(`Roles: ${roles?.length || 0}`)

    if (roles && roles.length > 0) {
      const roleCode = roles[0].relationship_data?.role_code || roles[0].relationship_data?.role
      console.log(`\n🎯 Current Role: ${roleCode}`)
      console.log(`   Expected: ORG_OWNER`)
      console.log(`   Match: ${roleCode === 'ORG_OWNER' ? '✅ YES' : '❌ NO'}`)
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

checkCashewUserRole()
