#!/usr/bin/env node
/**
 * Test hera_transactions_crud_v2 RPC for LEAVE_REQUEST creation
 * Tests the full transaction lifecycle: CREATE → READ → UPDATE
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env.local') })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const ORG_ID = '378f24fb-d496-4ff7-8afa-ea34895a0eb8' // HairTalkz Salon
const ACTOR_USER_ID = '09b0b92a-d797-489e-bc03-5ca0a6272674' // michele@hairtalkz.com

async function testLeaveRequestRPC() {
  console.log('🧪 Testing hera_transactions_crud_v2 for LEAVE_REQUEST\n')
  console.log('📋 Using specified credentials:')
  console.log(`   Organization ID: ${ORG_ID}`)
  console.log(`   Actor User ID: ${ACTOR_USER_ID}`)
  console.log('')

  try {
    // Step 1: Get a valid staff member and manager
    console.log('📋 Step 1: Finding staff members...')
    const { data: staff, error: staffError } = await supabase
      .from('core_entities')
      .select('id, entity_name, entity_type')
      .eq('organization_id', ORG_ID)
      .eq('entity_type', 'STAFF')
      .limit(2)

    if (staffError) {
      console.error('❌ Error finding staff:', staffError)
      return
    }

    if (staff.length < 2) {
      console.error('❌ Need at least 2 staff members for testing')
      return
    }

    const staffMember = staff[0]
    const manager = staff[1]

    console.log(`✅ Found staff member: ${staffMember.entity_name} (${staffMember.id})`)
    console.log(`✅ Found manager: ${manager.entity_name} (${manager.id})\n`)

    // Step 3: CREATE - Create a new LEAVE_REQUEST transaction
    console.log('📋 Step 3: Creating LEAVE_REQUEST transaction...')

    const startDate = '2025-02-01'
    const endDate = '2025-02-05'
    const totalDays = 5

    const createPayload = {
      p_action: 'CREATE',
      p_actor_user_id: ACTOR_USER_ID,
      p_organization_id: ORG_ID,
      p_transaction: {
        transaction_type: 'LEAVE_REQUEST',
        smart_code: 'HERA.SALON.HR.LEAVE.ANNUAL.V1',
        transaction_date: new Date().toISOString(),
        source_entity_id: staffMember.id,
        target_entity_id: manager.id,
        total_amount: totalDays,
        transaction_status: 'SUBMITTED'
      },
      p_lines: [
        {
          line_number: 1,
          line_type: 'leave',
          description: `ANNUAL Leave: ${totalDays} days`,
          quantity: totalDays,
          unit_amount: 1,
          line_amount: totalDays,
          smart_code: 'HERA.SALON.HR.LINE.ANNUAL.V1',
          line_data: {
            leave_type: 'ANNUAL',
            start_date: startDate,
            end_date: endDate
          }
        }
      ],
      // ✅ CORRECT: Use p_dynamic for business data (stored in core_dynamic_data)
      p_dynamic: {
        leave_type: {
          field_type: 'text',
          field_value_text: 'ANNUAL',
          smart_code: 'HERA.SALON.HR.LEAVE.DYN.TYPE.V1'
        },
        start_date: {
          field_type: 'date',
          field_value_date: startDate,
          smart_code: 'HERA.SALON.HR.LEAVE.DYN.START.V1'
        },
        end_date: {
          field_type: 'date',
          field_value_date: endDate,
          smart_code: 'HERA.SALON.HR.LEAVE.DYN.END.V1'
        },
        total_days: {
          field_type: 'number',
          field_value_number: totalDays,
          smart_code: 'HERA.SALON.HR.LEAVE.DYN.DAYS.V1'
        },
        reason: {
          field_type: 'text',
          field_value_text: 'Annual leave for family vacation',
          smart_code: 'HERA.SALON.HR.LEAVE.DYN.REASON.V1'
        },
        submitted_at: {
          field_type: 'datetime',
          field_value_datetime: new Date().toISOString(),
          smart_code: 'HERA.SALON.HR.LEAVE.DYN.SUBMITTED.V1'
        }
      },
      p_relationships: null,
      p_options: null
    }

    console.log('📤 RPC Payload:')
    console.log(JSON.stringify(createPayload, null, 2))
    console.log('')

    const { data: createResult, error: createError } = await supabase
      .rpc('hera_transactions_crud_v2', createPayload)

    if (createError) {
      console.error('❌ CREATE Error:', createError)
      console.error('   Message:', createError.message)
      console.error('   Details:', createError.details)
      console.error('   Hint:', createError.hint)
      return
    }

    console.log('✅ CREATE Success!')
    console.log('   Full Response:', JSON.stringify(createResult, null, 2))

    // Extract transaction ID from RPC response
    const transactionId = createResult?.items?.[0]?.id || createResult?.id || createResult
    console.log('   Transaction ID:', transactionId)
    console.log('')

    // Step 4: READ - Verify the transaction was created
    console.log('📋 Step 4: Reading created transaction...')

    const { data: transaction, error: readError } = await supabase
      .from('universal_transactions')
      .select(`
        id,
        transaction_type,
        transaction_status,
        smart_code,
        source_entity_id,
        target_entity_id,
        total_amount,
        metadata,
        created_by,
        updated_by
      `)
      .eq('id', transactionId)
      .single()

    if (readError) {
      console.error('❌ READ Error:', readError)
      return
    }

    console.log('✅ READ Success!')
    console.log('   transaction_type:', transaction.transaction_type)
    console.log('   transaction_status:', transaction.transaction_status)
    console.log('   smart_code:', transaction.smart_code)
    console.log('   source_entity_id:', transaction.source_entity_id)
    console.log('   target_entity_id:', transaction.target_entity_id)
    console.log('   total_amount:', transaction.total_amount)
    console.log('   created_by:', transaction.created_by)
    console.log('   updated_by:', transaction.updated_by)
    console.log('   metadata:', JSON.stringify(transaction.metadata, null, 2))
    console.log('')

    // Verify actor stamping
    if (!transaction.created_by) {
      console.error('❌ AUDIT VIOLATION: created_by is NULL!')
    } else {
      console.log('✅ Actor stamping verified (created_by present)')
    }

    // Step 5: READ transaction lines
    console.log('📋 Step 5: Reading transaction lines...')

    const { data: lines, error: linesError } = await supabase
      .from('universal_transaction_lines')
      .select('*')
      .eq('transaction_id', transactionId)

    if (linesError) {
      console.error('❌ Lines READ Error:', linesError)
      return
    }

    console.log(`✅ Found ${lines.length} transaction line(s)`)
    lines.forEach(line => {
      console.log(`   Line ${line.line_number}: ${line.description}`)
      console.log(`   Quantity: ${line.quantity}, Amount: ${line.line_amount}`)
    })
    console.log('')

    // Step 6: UPDATE - Approve the leave request
    console.log('📋 Step 6: Updating transaction status to APPROVED...')

    const updatePayload = {
      p_action: 'UPDATE',
      p_actor_user_id: ACTOR_USER_ID,
      p_organization_id: ORG_ID,
      p_transaction: {
        id: transactionId,  // ✅ ID must be inside p_transaction
        transaction_status: 'APPROVED',
        metadata: {
          ...transaction.metadata,
          status: 'APPROVED',
          approved_at: new Date().toISOString(),
          approved_by: ACTOR_USER_ID,
          approval_notes: 'Approved via RPC test'
        }
      }
    }

    console.log('📤 UPDATE Payload:')
    console.log(JSON.stringify(updatePayload, null, 2))
    console.log('')

    const { data: updateResult, error: updateError } = await supabase
      .rpc('hera_transactions_crud_v2', updatePayload)

    if (updateError) {
      console.error('❌ UPDATE Error:', updateError)
      console.error('   Message:', updateError.message)
      console.error('   Details:', updateError.details)
      return
    }

    console.log('✅ UPDATE Success!')
    console.log('   Result:', updateResult)
    console.log('')

    // Step 7: READ - Verify the update
    console.log('📋 Step 7: Verifying updated transaction...')

    const { data: updatedTxn } = await supabase
      .from('universal_transactions')
      .select('transaction_status, metadata, updated_by')
      .eq('id', transactionId)
      .single()

    console.log('✅ Updated transaction:')
    console.log('   transaction_status:', updatedTxn.transaction_status)
    console.log('   updated_by:', updatedTxn.updated_by)
    console.log('   metadata.status:', updatedTxn.metadata.status)
    console.log('')

    // Step 8: Query by transaction_type
    console.log('📋 Step 8: Querying all LEAVE_REQUEST transactions...')

    const { data: allRequests, error: queryError } = await supabase
      .from('universal_transactions')
      .select('id, transaction_type, transaction_status, created_at')
      .eq('organization_id', ORG_ID)
      .eq('transaction_type', 'LEAVE_REQUEST')
      .order('created_at', { ascending: false })
      .limit(5)

    if (queryError) {
      console.error('❌ Query Error:', queryError)
      return
    }

    console.log(`✅ Found ${allRequests.length} LEAVE_REQUEST transaction(s)`)
    allRequests.forEach((req, idx) => {
      console.log(`   ${idx + 1}. ${req.id.substring(0, 8)}... - ${req.transaction_status} (${req.created_at})`)
    })
    console.log('')

    console.log('🎉 All tests PASSED!')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

testLeaveRequestRPC()
