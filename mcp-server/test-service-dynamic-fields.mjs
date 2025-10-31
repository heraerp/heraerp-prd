#!/usr/bin/env node
/**
 * Test SERVICE entity with dynamic fields
 * Verify hera_entities_crud_v1 handles service creation with dynamic data
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const TENANT_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testServiceCreate() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST: Create SERVICE with Dynamic Fields')
  console.log('='.repeat(80))

  const payload = {
    p_action: 'CREATE',
    p_actor_user_id: ACTOR_USER_ID,
    p_organization_id: TENANT_ORG_ID,
    p_entity: {
      entity_type: 'SERVICE',
      entity_name: 'Test Hair Cut Service',
      smart_code: 'HERA.SALON.SERVICE.ENTITY.SERVICE.v1',
      status: 'active'
    },
    p_dynamic: {
      price_market: {
        value: '150',
        type: 'number',
        smart_code: 'HERA.SALON.SERVICE.DYN.PRICE.MARKET.v1'
      },
      duration_min: {
        value: '45',
        type: 'number',
        smart_code: 'HERA.SALON.SERVICE.DYN.DURATION.MIN.v1'
      },
      commission_rate: {
        value: '0.5',
        type: 'number',
        smart_code: 'HERA.SALON.SERVICE.DYN.COMMISSION.v1'
      },
      description: {
        value: 'Professional haircut service',
        type: 'text',
        smart_code: 'HERA.SALON.SERVICE.DYN.DESCRIPTION.v1'
      },
      active: {
        value: 'true',
        type: 'boolean',
        smart_code: 'HERA.SALON.SERVICE.DYN.ACTIVE.v1'
      },
      requires_booking: {
        value: 'false',
        type: 'boolean',
        smart_code: 'HERA.SALON.SERVICE.DYN.REQUIRES_BOOKING.v1'
      }
    },
    p_relationships: {},
    p_options: {
      include_dynamic: true,
      include_relationships: true,
      relationships_mode: 'UPSERT'
    }
  }

  console.log('\n📤 Payload:')
  console.log(JSON.stringify(payload, null, 2))

  const start = Date.now()
  const result = await supabase.rpc('hera_entities_crud_v1', payload)
  const duration = Date.now() - start

  console.log(`\n⏱️  Duration: ${duration}ms`)

  console.log('\n📥 Response:')
  if (result.error) {
    console.log('❌ RPC Error:', result.error.message)
    console.log('Error details:', result.error)
    return null
  }

  console.log('✅ Success:', result.data?.success)
  console.log('📊 Full Response:')
  console.log(JSON.stringify(result.data, null, 2))

  // Extract entity ID
  const entityId = result.data?.entity_id || result.data?.data?.entity?.id

  if (entityId) {
    console.log(`\n🆔 Created Service ID: ${entityId}`)

    // Now read it back to verify dynamic fields were saved
    console.log('\n' + '='.repeat(80))
    console.log('TEST: Read Created Service to Verify Dynamic Fields')
    console.log('='.repeat(80))

    const readPayload = {
      p_action: 'READ',
      p_actor_user_id: ACTOR_USER_ID,
      p_organization_id: TENANT_ORG_ID,
      p_entity: {
        entity_id: entityId
      },
      p_dynamic: {},
      p_relationships: {},
      p_options: {
        include_dynamic: true,
        include_relationships: true
      }
    }

    const readResult = await supabase.rpc('hera_entities_crud_v1', readPayload)

    if (readResult.error) {
      console.log('❌ Read Error:', readResult.error.message)
      return null
    }

    console.log('\n📦 Read Response:')
    console.log(JSON.stringify(readResult.data, null, 2))

    // Check dynamic_data in response
    const dynamicData = readResult.data?.data?.dynamic_data || []
    console.log(`\n📊 Dynamic Data Count: ${dynamicData.length}`)

    if (dynamicData.length > 0) {
      console.log('\n✅ DYNAMIC FIELDS FOUND:')
      dynamicData.forEach(field => {
        const value = field.field_value_number !== null ? field.field_value_number :
                      field.field_value_text !== null ? field.field_value_text :
                      field.field_value_boolean !== null ? field.field_value_boolean : 'null'
        console.log(`  - ${field.field_name}: ${value} (${field.field_type})`)
      })

      // Verify all expected fields exist
      const fieldNames = dynamicData.map(f => f.field_name)
      const expectedFields = ['price_market', 'duration_min', 'commission_rate', 'description', 'active', 'requires_booking']
      const missingFields = expectedFields.filter(f => !fieldNames.includes(f))

      if (missingFields.length === 0) {
        console.log('\n🎉 SUCCESS: All dynamic fields saved correctly!')
      } else {
        console.log('\n⚠️  WARNING: Missing fields:', missingFields)
      }
    } else {
      console.log('\n❌ FAILURE: No dynamic fields found in created service!')
    }

    return entityId
  } else {
    console.log('\n❌ FAILURE: No entity ID in response!')
    return null
  }
}

// Run test
testServiceCreate().catch(error => {
  console.error('\n❌ Fatal error:')
  console.error(error)
  process.exit(1)
})
