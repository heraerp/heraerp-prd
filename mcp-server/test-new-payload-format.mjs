/**
 * Test with NEW hera_txn_crud_v1 payload format
 * The deployed orchestrator expects p_payload with transaction_id at root level
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const TEST_TRANSACTION_ID = '47e2b010-ff0e-406a-b5a2-4b395f0a522d'
const TEST_USER_ID = 'f0f4ced2-877a-4a0c-8860-f5bc574652f6'
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testNewPayloadFormat() {
  console.log('\n🧪 Testing NEW Payload Format for hera_txn_crud_v1')
  console.log('=' .repeat(60))

  try {
    // Test READ with new format
    console.log('\n📖 STEP 1: READ with new payload format...')

    const readPayload = {
      transaction_id: TEST_TRANSACTION_ID,
      include_lines: true,
      include_deleted: false
    }

    console.log('📤 READ Payload:', JSON.stringify({
      p_action: 'READ',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: readPayload
    }, null, 2))

    const { data: readData, error: readError } = await supabase.rpc(
      'hera_txn_crud_v1',
      {
        p_action: 'READ',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_payload: readPayload
      }
    )

    if (readError) {
      console.error('❌ READ Error:', readError)
    }

    console.log('\n✅ READ Response:')
    console.log(JSON.stringify(readData, null, 2))

    if (readData?.success) {
      console.log('\n✅ READ SUCCESS!')
      console.log('Transaction data:', readData.data?.data || readData.data)
    } else {
      console.log('\n❌ READ FAILED:', readData?.error)
      return
    }

    // Test UPDATE with new format
    console.log('\n\n📝 STEP 2: UPDATE with new payload format...')

    const newStartTime = '2025-01-15T14:00:00Z'
    const newEndTime = '2025-01-15T15:30:00Z'

    const updatePayload = {
      transaction_id: TEST_TRANSACTION_ID,
      header: {
        smart_code: 'HERA.SALON.TXN.APPOINTMENT.BOOKED.v1',
        organization_id: TEST_ORG_ID  // ✅ Required for guardrail
      },
      patch: {
        transaction_date: newStartTime,
        metadata: {
          start_time: newStartTime,
          end_time: newEndTime,
          duration_minutes: 90,
          status: 'booked'
        }
      }
    }

    console.log('📤 UPDATE Payload:', JSON.stringify({
      p_action: 'UPDATE',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: TEST_ORG_ID,
      p_payload: updatePayload
    }, null, 2))

    const { data: updateData, error: updateError } = await supabase.rpc(
      'hera_txn_crud_v1',
      {
        p_action: 'UPDATE',
        p_actor_user_id: TEST_USER_ID,
        p_organization_id: TEST_ORG_ID,
        p_payload: updatePayload
      }
    )

    if (updateError) {
      console.error('❌ UPDATE Error:', updateError)
    }

    console.log('\n✅ UPDATE Response:')
    console.log(JSON.stringify(updateData, null, 2))

    if (updateData?.success) {
      console.log('\n✅ UPDATE SUCCESS!')

      // Read again to verify
      console.log('\n🔍 STEP 3: READ again to verify update...')

      const { data: verifyData } = await supabase.rpc(
        'hera_txn_crud_v1',
        {
          p_action: 'READ',
          p_actor_user_id: TEST_USER_ID,
          p_organization_id: TEST_ORG_ID,
          p_payload: readPayload
        }
      )

      console.log('\n📦 Verified data:')
      console.log(JSON.stringify(verifyData, null, 2))

      if (verifyData?.data?.data) {
        const txn = verifyData.data.data
        console.log('\n✅ VERIFICATION:')
        console.log('  - Transaction Date:', txn.transaction_date)
        console.log('  - Metadata:', txn.metadata)
        console.log('  - Updated At:', txn.updated_at)
      }
    } else {
      console.log('\n❌ UPDATE FAILED:', updateData?.error)
    }

    console.log('\n\n✅ Test Complete!')

  } catch (error) {
    console.error('\n❌ Test Failed:', error)
    console.error('Stack:', error.stack)
  }
}

testNewPayloadFormat()
