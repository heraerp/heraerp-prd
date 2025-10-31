/**
 * Test Appointment UPDATE RPC - Direct Supabase RPC Testing
 * Investigate why UPDATE returns undefined data
 */

import { createClient } from '@supabase/supabase-js'
import 'dotenv/config'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Test data from the conversation logs
const TEST_TRANSACTION_ID = '47e2b010-ff0e-406a-b5a2-4b395f0a522d'
const TEST_USER_ID = 'f0f4ced2-877a-4a0c-8860-f5bc574652f6'
const TEST_ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8'

async function testAppointmentUpdate() {
  console.log('\n🧪 Testing Appointment UPDATE RPC Call')
  console.log('=' .repeat(60))

  try {
    // First, READ the existing appointment to see its current state
    console.log('\n📖 STEP 1: Reading existing appointment...')
    const readPayload = {
      p_action: 'READ',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: TEST_ORG_ID,
      p_transaction: {
        transaction_id: TEST_TRANSACTION_ID
      },
      p_lines: [],
      p_options: {
        include_lines: true
      }
    }

    console.log('📤 READ Payload:', JSON.stringify(readPayload, null, 2))

    const { data: readData, error: readError } = await supabase.rpc(
      'hera_txn_crud_v1',
      readPayload
    )

    if (readError) {
      console.error('❌ READ Error:', readError)
      throw readError
    }

    console.log('\n✅ READ Response Structure:')
    console.log('  - Type:', typeof readData)
    console.log('  - Keys:', readData ? Object.keys(readData) : null)
    console.log('  - Has success:', !!readData?.success)
    console.log('  - Has data:', !!readData?.data)
    console.log('\n📦 READ Full Response:')
    console.log(JSON.stringify(readData, null, 2))

    // Now UPDATE the appointment
    console.log('\n\n📝 STEP 2: Updating appointment with new time...')

    const newStartTime = '2025-01-15T14:00:00Z'
    const newEndTime = '2025-01-15T15:30:00Z'

    const updatePayload = {
      p_action: 'UPDATE',
      p_actor_user_id: TEST_USER_ID,
      p_organization_id: TEST_ORG_ID,
      p_transaction: {
        transaction_id: TEST_TRANSACTION_ID,
        header: {
          smart_code: 'HERA.SALON.TXN.APPOINTMENT.BOOKED.v1',
          transaction_date: newStartTime,
          metadata: {
            start_time: newStartTime,
            end_time: newEndTime,
            duration_minutes: 90,
            status: 'booked'
          }
        }
      },
      p_lines: [],
      p_options: {}
    }

    console.log('📤 UPDATE Payload:', JSON.stringify(updatePayload, null, 2))

    const { data: updateData, error: updateError } = await supabase.rpc(
      'hera_txn_crud_v1',
      updatePayload
    )

    if (updateError) {
      console.error('❌ UPDATE Error:', updateError)
      throw updateError
    }

    console.log('\n✅ UPDATE Response Structure:')
    console.log('  - Type:', typeof updateData)
    console.log('  - Keys:', updateData ? Object.keys(updateData) : null)
    console.log('  - Has success:', !!updateData?.success)
    console.log('  - Has data:', !!updateData?.data)
    console.log('  - Has violations:', !!updateData?.violations)

    if (updateData?.success) {
      console.log('  - Success value:', updateData.success)
    }

    if (updateData?.data) {
      console.log('  - Data type:', typeof updateData.data)
      console.log('  - Data keys:', Object.keys(updateData.data))

      if (updateData.data.data) {
        console.log('  - data.data type:', typeof updateData.data.data)
        console.log('  - data.data keys:', updateData.data.data ? Object.keys(updateData.data.data) : null)
      }
    }

    console.log('\n📦 UPDATE Full Response:')
    console.log(JSON.stringify(updateData, null, 2))

    // Read again to verify the update persisted
    console.log('\n\n🔍 STEP 3: Reading again to verify update persisted...')

    const { data: verifyData, error: verifyError } = await supabase.rpc(
      'hera_txn_crud_v1',
      readPayload
    )

    if (verifyError) {
      console.error('❌ VERIFY Error:', verifyError)
      throw verifyError
    }

    console.log('\n✅ VERIFY Response Structure:')
    console.log('  - Has success:', !!verifyData?.success)
    console.log('  - Has data:', !!verifyData?.data)

    if (verifyData?.data?.data) {
      const txn = verifyData.data.data
      console.log('\n📊 Transaction after UPDATE:')
      console.log('  - ID:', txn.id)
      console.log('  - Smart Code:', txn.smart_code)
      console.log('  - Transaction Date:', txn.transaction_date)
      console.log('  - Metadata:', txn.metadata)
      console.log('  - Updated At:', txn.updated_at)
    }

    console.log('\n📦 VERIFY Full Response:')
    console.log(JSON.stringify(verifyData, null, 2))

    console.log('\n\n✅ Test Complete!')
    console.log('=' .repeat(60))

  } catch (error) {
    console.error('\n❌ Test Failed:', error)
    console.error('\nStack:', error.stack)
  }
}

// Run the test
testAppointmentUpdate()
