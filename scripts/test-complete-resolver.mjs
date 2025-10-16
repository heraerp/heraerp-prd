#!/usr/bin/env node

/**
 * Test the complete resolveUserEntity function flow
 */

import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'

config()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

// Replicate the exact resolveUserEntity function
async function testResolveUserEntity(authUserId) {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
    
    console.log('🔍 Testing complete resolveUserEntity flow')
    console.log('User ID:', authUserId)
    console.log('='.repeat(50))
    
    // 1) Find organization via MEMBER_OF relationship
    console.log('\n1️⃣ Step 1: Finding MEMBER_OF relationship...')
    const { data: relationship, error: relError } = await supabase
      .from('core_relationships')
      .select('to_entity_id, organization_id')
      .eq('from_entity_id', authUserId)
      .eq('relationship_type', 'MEMBER_OF')
      .maybeSingle()

    if (relError || !relationship) {
      console.log('❌ Step 1 FAILED: No MEMBER_OF relationship found')
      console.log('Error:', relError)
      return {
        success: false,
        error: {
          type: 'not_found',
          message: 'User organization membership not found',
          authUserId
        }
      }
    }
    
    console.log('✅ Step 1 SUCCESS: MEMBER_OF relationship found')
    console.log('  - Organization ID:', relationship.organization_id)
    console.log('  - Target Entity ID:', relationship.to_entity_id)

    const organizationId = relationship.organization_id

    // 2) Get all dynamic data for this user entity in the tenant org
    console.log('\n2️⃣ Step 2: Getting dynamic data...')
    const { data: dynamicData, error: dynamicError } = await supabase
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json, field_type, smart_code')
      .eq('entity_id', authUserId)
      .eq('organization_id', organizationId)

    if (dynamicError) {
      console.log('❌ Step 2 FAILED: Dynamic data query error')
      console.log('Error:', dynamicError)
      return {
        success: false,
        error: {
          type: 'database_error',
          message: `Failed to query dynamic data: ${dynamicError.message}`,
          authUserId
        }
      }
    }
    
    console.log(`✅ Step 2 SUCCESS: Found ${dynamicData?.length || 0} dynamic data records`)

    // 3. Build dynamic data map
    console.log('\n3️⃣ Step 3: Building dynamic data map...')
    const dynamicDataMap = {}
    dynamicData?.forEach(field => {
      const value = field.field_type === 'json' ? field.field_value_json : field.field_value_text
      dynamicDataMap[field.field_name] = {
        value,
        type: field.field_type,
        smart_code: field.smart_code
      }
    })
    console.log('✅ Step 3 SUCCESS: Dynamic data map built')
    console.log('  - Map keys:', Object.keys(dynamicDataMap))

    // 4. Extract business information from dynamic data
    console.log('\n4️⃣ Step 4: Extracting business information...')
    const salonRole = dynamicDataMap.salon_role?.value || 'user'
    const permissions = dynamicDataMap.permissions?.value || []
    console.log('✅ Step 4 SUCCESS: Business info extracted')
    console.log('  - Salon Role:', salonRole)
    console.log('  - Permissions:', permissions)

    const result = {
      success: true,
      data: {
        userId: authUserId,
        organizationId,
        entityId: authUserId,
        salonRole,
        permissions: Array.isArray(permissions) ? permissions : [],
        userEntity: undefined,
        dynamicData: dynamicDataMap
      }
    }
    
    console.log('\n🎉 FINAL RESULT: SUCCESS')
    console.log('  - User ID:', result.data.userId)
    console.log('  - Organization ID:', result.data.organizationId)
    console.log('  - Salon Role:', result.data.salonRole)
    console.log('  - Permissions:', result.data.permissions)
    
    return result

  } catch (error) {
    console.log('\n💥 EXCEPTION CAUGHT')
    console.log('Error:', error.message)
    return {
      success: false,
      error: {
        type: 'database_error',
        message: `Unexpected error resolving user entity: ${error.message}`,
        authUserId
      }
    }
  }
}

testResolveUserEntity(USER_ID)