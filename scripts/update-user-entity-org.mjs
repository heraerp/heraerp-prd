#!/usr/bin/env node

/**
 * Update user entity to have correct organization_id
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const USER_ID = '3ced4979-4c09-4e1e-8667-6707cfe6ec77'
const CORRECT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function updateUserEntityOrg() {
  try {
    console.log('🔧 Updating user entity organization_id')
    console.log('=' .repeat(50))

    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
      console.error('❌ Missing Supabase credentials')
      return
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    console.log('Updating user entity organization_id to:', CORRECT_ORG_ID)

    const { data, error } = await supabase
      .from('core_entities')
      .update({ 
        organization_id: CORRECT_ORG_ID,
        updated_by: USER_ID,
        updated_at: new Date().toISOString()
      })
      .eq('id', USER_ID)
      .eq('entity_type', 'USER')
      .select()

    if (error) {
      console.error('❌ Failed to update user entity:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ User entity updated successfully')
      console.log('  - ID:', data[0].id)
      console.log('  - Name:', data[0].entity_name)
      console.log('  - Organization ID:', data[0].organization_id)
      console.log('  - Type:', data[0].entity_type)
    } else {
      console.log('⚠️  No user entity found to update')
    }

  } catch (error) {
    console.error('❌ Update failed:', error)
  }
}

updateUserEntityOrg()