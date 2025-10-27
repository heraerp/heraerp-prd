#!/usr/bin/env node

/**
 * 🔍 DEBUG CUSTOMER CREATION
 * 
 * This script debugs the exact issue with customer creation
 * by showing the complete response structure from the RPC function.
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
import { join } from 'path'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Load environment from parent directory
config({ path: join(__dirname, '..', '.env.local') })

// Configuration from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const salonOrgId = process.env.NEXT_PUBLIC_SALON_ORG_ID || '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const actorUserId = '5ac911a5-aedd-48dc-8d0a-0009f9d22f9a'

console.log('🔍 DEBUG CUSTOMER CREATION')
console.log('===========================')
console.log('')
console.log(`🏢 Organization: ${salonOrgId}`)
console.log(`👤 Actor: ${actorUserId}`)
console.log('')

const supabase = createClient(supabaseUrl, supabaseKey)

async function debugCustomerCreation() {
  console.log('🧪 Testing customer creation with full response logging...')
  console.log('')
  
  try {
    const customerName = `Debug Customer ${Date.now()}`
    
    console.log('📡 Calling hera_entities_crud_v1 with payload:')
    const payload = {
      p_action: 'CREATE',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_entity: {
        entity_type: 'CUSTOMER',
        entity_name: customerName,
        smart_code: 'HERA.SALON.CUSTOMER.ENTITY.DEBUG.v1',
        organization_id: salonOrgId
      },
      p_dynamic: {
        phone: {
          field_name: 'phone',
          field_type: 'text',
          field_value_text: '+971-50-DEBUG-001',
          smart_code: 'HERA.SALON.CUSTOMER.FIELD.PHONE.v1'
        }
      },
      p_relationships: [],
      p_options: {}
    }
    
    console.log(JSON.stringify(payload, null, 2))
    console.log('')
    
    const { data, error } = await supabase.rpc('hera_entities_crud_v1', payload)
    
    console.log('📨 RPC Response:')
    console.log('================')
    console.log('')
    
    if (error) {
      console.log('❌ ERROR:')
      console.log(JSON.stringify(error, null, 2))
    } else {
      console.log('✅ SUCCESS - Full response data:')
      console.log(JSON.stringify(data, null, 2))
      console.log('')
      
      // Try different paths to find the customer ID
      console.log('🔍 Checking possible ID locations:')
      console.log(`data?.id: ${data?.id}`)
      console.log(`data?.data?.id: ${data?.data?.id}`)
      console.log(`data?.data?.items?.[0]?.id: ${data?.data?.items?.[0]?.id}`)
      console.log(`data?.items?.[0]?.id: ${data?.items?.[0]?.id}`)
      console.log(`data?.entity_id: ${data?.entity_id}`)
      console.log(`data?.result?.id: ${data?.result?.id}`)
      console.log('')
      
      // Check if it's successful
      console.log('🔍 Checking success indicators:')
      console.log(`data?.success: ${data?.success}`)
      console.log(`data?.data?.success: ${data?.data?.success}`)
      console.log(`data?.status: ${data?.status}`)
      console.log('')
      
      // Show data structure
      console.log('🔍 Response structure analysis:')
      console.log(`Type: ${typeof data}`)
      console.log(`Keys: ${Object.keys(data || {})}`)
      
      if (data?.data) {
        console.log(`data.data type: ${typeof data.data}`)
        console.log(`data.data keys: ${Object.keys(data.data || {})}`)
      }
      
      if (data?.data?.items) {
        console.log(`data.data.items length: ${data.data.items.length}`)
        if (data.data.items.length > 0) {
          console.log(`First item keys: ${Object.keys(data.data.items[0] || {})}`)
        }
      }
    }
    
  } catch (error) {
    console.log('💥 EXCEPTION:')
    console.log(error.message)
    console.log('')
    console.log('Stack trace:')
    console.log(error.stack)
  }
}

// Also test if we can read existing customers
async function testReadCustomers() {
  console.log('')
  console.log('🔍 Testing customer read to verify function works...')
  console.log('')
  
  try {
    const { data, error } = await supabase.rpc('hera_entities_crud_v1', {
      p_action: 'READ',
      p_actor_user_id: actorUserId,
      p_organization_id: salonOrgId,
      p_entity: {
        entity_type: 'CUSTOMER'
      },
      p_dynamic: {},
      p_relationships: [],
      p_options: { limit: 3 }
    })
    
    console.log('📨 READ Response:')
    if (error) {
      console.log('❌ READ ERROR:')
      console.log(JSON.stringify(error, null, 2))
    } else {
      console.log('✅ READ SUCCESS:')
      console.log(JSON.stringify(data, null, 2))
    }
    
  } catch (error) {
    console.log('💥 READ EXCEPTION:', error.message)
  }
}

// Run debug tests
async function runDebug() {
  await debugCustomerCreation()
  await testReadCustomers()
  
  console.log('')
  console.log('🏁 Debug completed. Check the response structures above.')
}

runDebug().catch(error => {
  console.error('💥 Debug script failed:', error.message)
})