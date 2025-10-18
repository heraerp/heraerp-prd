#!/usr/bin/env node
/**
 * Seed LEAVE_REQUEST transactions for DEMO organization
 * Creates sample leave requests so the /salon/leave page displays data
 */

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Demo salon organization (where the demo token queries)
const DEMO_ORG_ID = '0fd09e31-d257-4329-97eb-7d7f522ed6f0'
const DEMO_USER_ID = '00000000-0000-0000-0000-000000000001' // Demo receptionist

async function seedLeaveRequests() {
  try {
    console.log('🌱 Seeding LEAVE_REQUEST transactions for demo organization\n')
    console.log(`   Organization: ${DEMO_ORG_ID}`)
    console.log(`   Actor: ${DEMO_USER_ID}\n`)

    // Step 1: Find staff members in demo org
    const { data: staff, error: staffError } = await supabase
      .from('core_entities')
      .select('id, entity_name')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('entity_type', 'STAFF')
      .limit(5)

    if (staffError) {
      console.error('❌ Error finding staff:', staffError)
      return
    }

    if (staff.length < 2) {
      console.error('❌ Need at least 2 staff members in demo org')
      console.log('   Please create staff members first')
      return
    }

    console.log(`✅ Found ${staff.length} staff members\n`)

    // Step 2: Create 3 sample leave requests with different statuses
    const leaveRequests = [
      {
        staff: staff[0],
        manager: staff[1],
        start_date: '2025-02-15',
        end_date: '2025-02-20',
        total_days: 6,
        leave_type: 'ANNUAL',
        reason: 'Family vacation to Dubai',
        status: 'SUBMITTED'
      },
      {
        staff: staff[1],
        manager: staff[0],
        start_date: '2025-03-01',
        end_date: '2025-03-05',
        total_days: 5,
        leave_type: 'ANNUAL',
        reason: 'Wedding ceremony',
        status: 'APPROVED'
      },
      {
        staff: staff.length > 2 ? staff[2] : staff[0],
        manager: staff[1],
        start_date: '2025-02-25',
        end_date: '2025-02-27',
        total_days: 3,
        leave_type: 'SICK',
        reason: 'Medical appointment',
        status: 'PENDING_APPROVAL'
      }
    ]

    for (const [index, req] of leaveRequests.entries()) {
      console.log(`📝 Creating leave request ${index + 1}/${leaveRequests.length}`)
      console.log(`   Staff: ${req.staff.entity_name}`)
      console.log(`   Dates: ${req.start_date} to ${req.end_date} (${req.total_days} days)`)
      console.log(`   Status: ${req.status}`)

      const { data, error } = await supabase.rpc('hera_transactions_crud_v2', {
        p_action: 'CREATE',
        p_actor_user_id: DEMO_USER_ID,
        p_organization_id: DEMO_ORG_ID,
        p_transaction: {
          transaction_type: 'LEAVE_REQUEST',
          smart_code: `HERA.SALON.HR.LEAVE.${req.leave_type}.V1`,
          transaction_date: new Date().toISOString(),
          source_entity_id: req.staff.id,
          target_entity_id: req.manager.id,
          total_amount: req.total_days,
          transaction_status: req.status,
          metadata: {
            metadata_category: 'hr_leave',
            leave_type: req.leave_type,
            start_date: req.start_date,
            end_date: req.end_date,
            total_days: req.total_days,
            reason: req.reason,
            submitted_at: new Date().toISOString()
          }
        },
        p_lines: [
          {
            line_number: 1,
            line_type: 'leave',
            description: `${req.leave_type} Leave: ${req.total_days} days`,
            quantity: req.total_days,
            unit_amount: 1,
            line_amount: req.total_days,
            smart_code: `HERA.SALON.HR.LINE.${req.leave_type}.V1`,
            line_data: {
              leave_type: req.leave_type,
              start_date: req.start_date,
              end_date: req.end_date
            }
          }
        ]
      })

      if (error) {
        console.error(`   ❌ Error:`, error.message)
        continue
      }

      const transactionId = data?.items?.[0]?.id || data?.id
      console.log(`   ✅ Created: ${transactionId}\n`)
    }

    console.log('🎉 Seeding complete!')
    console.log('\n📋 Summary:')
    console.log(`   Organization: ${DEMO_ORG_ID}`)
    console.log(`   Created: ${leaveRequests.length} LEAVE_REQUEST transactions`)
    console.log('\n🔗 View at: http://localhost:3000/salon/leave')

  } catch (error) {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  }
}

seedLeaveRequests()
