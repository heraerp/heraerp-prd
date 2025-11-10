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

async function analyzeHairtalkzUser() {
  console.log('🔍 Analyzing hairtalkz01@gmail.com in detail...\n')

  const email = 'hairtalkz01@gmail.com'

  try {
    // Step 1: Get auth user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()
    if (listError) throw listError

    const authUser = users.users.find(u => u.email === email)
    if (!authUser) {
      throw new Error(`Auth user ${email} not found`)
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 AUTH USER')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log(`ID: ${authUser.id}`)
    console.log(`Email: ${authUser.email}`)
    console.log(`Created: ${authUser.created_at}`)
    console.log(`User Metadata:`, JSON.stringify(authUser.user_metadata, null, 2))
    console.log(`App Metadata:`, JSON.stringify(authUser.app_metadata, null, 2))
    console.log()

    // Step 2: Get USER entity with EXACT match on ID
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 USER ENTITY (ID = Auth User ID)')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const { data: exactMatch, error: exactError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('id', authUser.id)
      .eq('entity_type', 'USER')
      .single()

    if (exactError) {
      console.log('❌ No USER entity with exact ID match:', exactError.message)
    } else {
      console.log('✅ USER entity DOES match auth user ID!')
      console.log(`   ID: ${exactMatch.id}`)
      console.log(`   Entity Type: ${exactMatch.entity_type}`)
      console.log(`   Entity Name: ${exactMatch.entity_name}`)
      console.log(`   Entity Code: ${exactMatch.entity_code}`)
      console.log(`   Smart Code: ${exactMatch.smart_code}`)
      console.log(`   Organization ID: ${exactMatch.organization_id}`)
      console.log(`   Created By: ${exactMatch.created_by}`)
      console.log(`   Updated By: ${exactMatch.updated_by}`)
      console.log(`   Created At: ${exactMatch.created_at}`)
      console.log(`   Updated At: ${exactMatch.updated_at}`)
      console.log(`   Metadata:`, JSON.stringify(exactMatch.metadata, null, 2))
      console.log(`   Business Rules:`, JSON.stringify(exactMatch.business_rules, null, 2))
    }
    console.log()

    // Step 3: Check if there's ANOTHER USER entity with metadata mapping
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 CHECKING FOR METADATA MAPPING')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const { data: metadataMatch, error: metadataError } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'USER')
      .contains('metadata', { supabase_user_id: authUser.id })

    if (metadataError) {
      console.log('Error checking metadata:', metadataError.message)
    } else if (!metadataMatch || metadataMatch.length === 0) {
      console.log('✅ No separate USER entity with metadata mapping')
      console.log('   This means: Auth ID = USER Entity ID (legacy pattern)')
    } else {
      console.log(`⚠️ Found ${metadataMatch.length} USER entity(ies) with metadata mapping:`)
      metadataMatch.forEach((entity, idx) => {
        console.log(`   ${idx + 1}. USER Entity ID: ${entity.id}`)
        console.log(`      Auth User ID in metadata: ${entity.metadata?.supabase_user_id}`)
        console.log(`      IDs Match: ${entity.id === authUser.id ? 'YES' : 'NO'}`)
        console.log(`      Metadata:`, JSON.stringify(entity.metadata, null, 2))
        console.log()
      })
    }
    console.log()

    // Step 4: Get ALL relationships for this user
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('📋 ALL RELATIONSHIPS')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    const { data: allRelationships, error: relError } = await supabase
      .from('core_relationships')
      .select('*')
      .eq('from_entity_id', authUser.id)
      .order('created_at', { ascending: false })

    if (relError) {
      console.log('Error:', relError.message)
    } else if (!allRelationships || allRelationships.length === 0) {
      console.log('❌ No relationships found!')
    } else {
      console.log(`✅ Found ${allRelationships.length} relationship(s):\n`)

      allRelationships.forEach((rel, idx) => {
        console.log(`${idx + 1}. ${rel.relationship_type}`)
        console.log(`   ID: ${rel.id}`)
        console.log(`   From: ${rel.from_entity_id}`)
        console.log(`   To: ${rel.to_entity_id}`)
        console.log(`   Organization: ${rel.organization_id}`)
        console.log(`   Relationship Data:`, JSON.stringify(rel.relationship_data, null, 2))
        console.log(`   Created At: ${rel.created_at}`)
        console.log(`   Created By: ${rel.created_by}`)
        console.log()
      })
    }

    // Step 5: CRITICAL - How was this user created?
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
    console.log('🎯 KEY INSIGHT')
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')

    if (exactMatch) {
      if (exactMatch.metadata?.source === 'hera_onboard_user_v1') {
        console.log('⚠️ This user WAS created via hera_onboard_user_v1')
        console.log('   BUT: User entity ID matches auth user ID')
        console.log('   This means hera_onboard_user_v1 behavior was DIFFERENT')
        console.log('   when this user was created!')
      } else if (!exactMatch.metadata?.source) {
        console.log('✅ This user was created BEFORE hera_onboard_user_v1 existed')
        console.log('   Pattern: LEGACY user creation')
        console.log('   USER entity ID = Auth user ID (by design)')
      } else {
        console.log(`ℹ️ User created via: ${exactMatch.metadata.source}`)
      }
    }

  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

analyzeHairtalkzUser()
