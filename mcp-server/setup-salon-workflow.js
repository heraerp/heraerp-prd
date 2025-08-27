#!/usr/bin/env node
/**
 * Setup Salon Customer Workflow Statuses
 * Creates all workflow status entities using relationships
 */

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '../.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase configuration')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Workflow status definitions
const WORKFLOW_STATUSES = [
  // Awareness Stage
  { code: 'STATUS-PROSPECT', name: 'Prospect', stage: 'awareness', order: 1, color: '#6B7280' },
  { code: 'STATUS-INTERESTED', name: 'Interested', stage: 'awareness', order: 2, color: '#3B82F6' },
  { code: 'STATUS-CONTACTED', name: 'Contacted', stage: 'awareness', order: 3, color: '#2563EB' },
  
  // Booking Stage
  { code: 'STATUS-QUALIFIED', name: 'Qualified', stage: 'booking', order: 4, color: '#7C3AED' },
  { code: 'STATUS-BOOKED', name: 'Booked', stage: 'booking', order: 5, color: '#6D28D9' },
  { code: 'STATUS-CONFIRMED', name: 'Confirmed', stage: 'booking', order: 6, color: '#5B21B6' },
  
  // Pre-Service Stage
  { code: 'STATUS-REMINDED', name: 'Reminded', stage: 'pre_service', order: 7, color: '#6366F1' },
  { code: 'STATUS-ON-WAY', name: 'On Way', stage: 'pre_service', order: 8, color: '#4F46E5' },
  { code: 'STATUS-ARRIVED', name: 'Arrived', stage: 'pre_service', order: 9, color: '#4338CA' },
  
  // Check-In Stage
  { code: 'STATUS-CHECKED-IN', name: 'Checked In', stage: 'check_in', order: 10, color: '#06B6D4' },
  { code: 'STATUS-IN-CONSULTATION', name: 'In Consultation', stage: 'check_in', order: 11, color: '#0891B2' },
  { code: 'STATUS-SERVICE-SELECTED', name: 'Service Selected', stage: 'check_in', order: 12, color: '#0E7490' },
  
  // Service Stage
  { code: 'STATUS-IN-SERVICE', name: 'In Service', stage: 'service', order: 13, color: '#10B981' },
  { code: 'STATUS-SERVICE-COMPLETE', name: 'Service Complete', stage: 'service', order: 14, color: '#059669' },
  { code: 'STATUS-QUALITY-CHECKED', name: 'Quality Checked', stage: 'service', order: 15, color: '#047857' },
  
  // Payment Stage
  { code: 'STATUS-AT-CHECKOUT', name: 'At Checkout', stage: 'payment', order: 16, color: '#F59E0B' },
  { code: 'STATUS-PAYMENT-PROCESSING', name: 'Processing Payment', stage: 'payment', order: 17, color: '#D97706' },
  { code: 'STATUS-PAID', name: 'Paid', stage: 'payment', order: 18, color: '#B45309' },
  
  // Feedback Stage
  { code: 'STATUS-FOLLOWUP-SCHEDULED', name: 'Follow-up Scheduled', stage: 'feedback', order: 19, color: '#F97316' },
  { code: 'STATUS-FEEDBACK-REQUESTED', name: 'Feedback Requested', stage: 'feedback', order: 20, color: '#EA580C' },
  { code: 'STATUS-FEEDBACK-RECEIVED', name: 'Feedback Received', stage: 'feedback', order: 21, color: '#C2410C' },
  
  // Retention Stage
  { code: 'STATUS-ACTIVE-CLIENT', name: 'Active Client', stage: 'retention', order: 22, color: '#EC4899' },
  { code: 'STATUS-LOYAL-CLIENT', name: 'Loyal Client', stage: 'retention', order: 23, color: '#DB2777' },
  { code: 'STATUS-VIP-CLIENT', name: 'VIP Client', stage: 'retention', order: 24, color: '#BE185D' },
  
  // Exception Statuses
  { code: 'STATUS-CANCELLED', name: 'Cancelled', stage: 'exception', order: 25, color: '#EF4444' },
  { code: 'STATUS-NO-SHOW', name: 'No Show', stage: 'exception', order: 26, color: '#DC2626' },
  { code: 'STATUS-RESCHEDULED', name: 'Rescheduled', stage: 'exception', order: 27, color: '#F59E0B' },
  { code: 'STATUS-WALK-OUT', name: 'Walk Out', stage: 'exception', order: 28, color: '#B91C1C' },
  { code: 'STATUS-PAYMENT-FAILED', name: 'Payment Failed', stage: 'exception', order: 29, color: '#EF4444' },
  { code: 'STATUS-REBOOKED', name: 'Rebooked', stage: 'exception', order: 30, color: '#10B981' }
]

// Status transitions
const STATUS_TRANSITIONS = {
  'STATUS-PROSPECT': ['STATUS-INTERESTED', 'STATUS-CONTACTED'],
  'STATUS-INTERESTED': ['STATUS-CONTACTED', 'STATUS-QUALIFIED'],
  'STATUS-CONTACTED': ['STATUS-QUALIFIED', 'STATUS-BOOKED'],
  'STATUS-QUALIFIED': ['STATUS-BOOKED'],
  'STATUS-BOOKED': ['STATUS-CONFIRMED', 'STATUS-CANCELLED'],
  'STATUS-CONFIRMED': ['STATUS-REMINDED', 'STATUS-NO-SHOW'],
  'STATUS-REMINDED': ['STATUS-ON-WAY', 'STATUS-ARRIVED', 'STATUS-RESCHEDULED'],
  'STATUS-ON-WAY': ['STATUS-ARRIVED', 'STATUS-DELAYED'],
  'STATUS-ARRIVED': ['STATUS-CHECKED-IN', 'STATUS-WALK-OUT'],
  'STATUS-CHECKED-IN': ['STATUS-IN-CONSULTATION', 'STATUS-WAITING'],
  'STATUS-IN-CONSULTATION': ['STATUS-SERVICE-SELECTED'],
  'STATUS-SERVICE-SELECTED': ['STATUS-IN-SERVICE'],
  'STATUS-IN-SERVICE': ['STATUS-SERVICE-COMPLETE'],
  'STATUS-SERVICE-COMPLETE': ['STATUS-QUALITY-CHECKED'],
  'STATUS-QUALITY-CHECKED': ['STATUS-AT-CHECKOUT'],
  'STATUS-AT-CHECKOUT': ['STATUS-PAYMENT-PROCESSING'],
  'STATUS-PAYMENT-PROCESSING': ['STATUS-PAID', 'STATUS-PAYMENT-FAILED'],
  'STATUS-PAID': ['STATUS-FOLLOWUP-SCHEDULED'],
  'STATUS-FOLLOWUP-SCHEDULED': ['STATUS-FEEDBACK-REQUESTED'],
  'STATUS-FEEDBACK-REQUESTED': ['STATUS-FEEDBACK-RECEIVED'],
  'STATUS-FEEDBACK-RECEIVED': ['STATUS-ACTIVE-CLIENT'],
  'STATUS-ACTIVE-CLIENT': ['STATUS-LOYAL-CLIENT'],
  'STATUS-LOYAL-CLIENT': ['STATUS-VIP-CLIENT'],
  'STATUS-VIP-CLIENT': [],
  'STATUS-CANCELLED': ['STATUS-REBOOKED'],
  'STATUS-NO-SHOW': ['STATUS-CONTACTED'],
  'STATUS-RESCHEDULED': ['STATUS-CONFIRMED'],
  'STATUS-WALK-OUT': ['STATUS-CONTACTED'],
  'STATUS-PAYMENT-FAILED': ['STATUS-PAYMENT-PROCESSING'],
  'STATUS-REBOOKED': ['STATUS-CONFIRMED']
}

async function setupWorkflowStatuses() {
  console.log('🔄 Setting up Salon Customer Workflow...\n')

  try {
    const orgId = '550e8400-e29b-41d4-a716-446655440000'
    console.log(`Organization ID: ${orgId}\n`)

    // Create workflow status entities
    console.log('📋 Creating Workflow Statuses...')
    const statusMap = {}

    for (const status of WORKFLOW_STATUSES) {
      console.log(`  Creating: ${status.name}`)
      
      // Check if status already exists
      const { data: existing } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', orgId)
        .eq('entity_type', 'workflow_status')
        .eq('entity_code', status.code)
        .single()

      if (existing) {
        console.log(`    ✓ Already exists`)
        statusMap[status.code] = existing.id
        continue
      }

      // Create new status
      const { data: newStatus, error: createError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: orgId,
          entity_type: 'workflow_status',
          entity_name: status.name,
          entity_code: status.code,
          smart_code: `HERA.SALON.WORKFLOW.${status.code}.v1`,
          status: 'active',
          metadata: {
            stage: status.stage,
            order: status.order,
            color: status.color,
            transitions: STATUS_TRANSITIONS[status.code] || []
          }
        })
        .select()
        .single()

      if (createError) {
        console.error(`    ❌ Error:`, createError.message)
        continue
      }

      console.log(`    ✅ Created`)
      statusMap[status.code] = newStatus.id
    }

    // Create transition relationships
    console.log('\n🔗 Creating Status Transitions...')
    
    for (const [fromCode, toCodes] of Object.entries(STATUS_TRANSITIONS)) {
      const fromId = statusMap[fromCode]
      if (!fromId) continue

      for (const toCode of toCodes) {
        const toId = statusMap[toCode]
        if (!toId) continue

        console.log(`  ${fromCode} → ${toCode}`)
        
        // Check if transition already exists
        const { data: existing } = await supabase
          .from('core_relationships')
          .select('id')
          .eq('from_entity_id', fromId)
          .eq('to_entity_id', toId)
          .eq('relationship_type', 'can_transition_to')
          .single()

        if (existing) {
          console.log(`    ✓ Already exists`)
          continue
        }

        // Create transition relationship
        const { error: relError } = await supabase
          .from('core_relationships')
          .insert({
            organization_id: orgId,
            from_entity_id: fromId,
            to_entity_id: toId,
            relationship_type: 'can_transition_to',
            smart_code: `HERA.SALON.WORKFLOW.TRANSITION.${fromCode}.${toCode}.v1`,
            metadata: {
              from_status: fromCode,
              to_status: toCode,
              created_at: new Date().toISOString()
            }
          })

        if (relError) {
          console.error(`    ❌ Error:`, relError.message)
        } else {
          console.log(`    ✅ Created`)
        }
      }
    }

    console.log('\n✅ Workflow setup complete!')
    console.log('\n📊 Summary:')
    console.log(`  Total statuses: ${Object.keys(statusMap).length}`)
    console.log(`  Stages: awareness, booking, pre_service, check_in, service, payment, feedback, retention`)
    console.log('\n🚀 You can now track customers through their complete journey!')
    
  } catch (error) {
    console.error('\n❌ Error setting up workflow:', error.message)
    console.error(error)
  }
}

// Run the setup
setupWorkflowStatuses()