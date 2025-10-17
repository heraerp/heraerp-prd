#!/usr/bin/env node
/**
 * Demo: WhatsApp Integration with HERA
 * Shows how WhatsApp messages create entities, appointments, and trigger workflows
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

async function simulateWhatsAppConversation(orgId) {
  console.log('📱 DEMONSTRATING WHATSAPP INTEGRATION')
  console.log('=' .repeat(50))
  
  try {
    // 1. Simulate customer message
    console.log('\n💬 Customer: "Hi, I want to book an appointment for haircut tomorrow at 3pm"')
    
    // Create WhatsApp conversation entity
    const phoneNumber = '+971501234567'
    const { data: conversation } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'whatsapp_conversation',
        entity_name: `WhatsApp: ${phoneNumber}`,
        entity_code: `WA-${phoneNumber}`,
        smart_code: 'HERA.WHATSAPP.CONV.CUSTOMER.v1',
        metadata: {
          phone: phoneNumber,
          sender_type: 'new_customer',
          created_at: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    console.log('✅ Created WhatsApp conversation entity')
    
    // Store inbound message
    const { data: inboundMsg } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-IN-${Date.now()}`,
        source_entity_id: conversation.id,
        smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
        metadata: {
          message_id: `wamid.${Date.now()}`,
          text: 'Hi, I want to book an appointment for haircut tomorrow at 3pm',
          direction: 'inbound',
          intent: 'book_appointment',
          entities: {
            service: 'haircut',
            date: 'tomorrow',
            time: '3pm'
          }
        }
      })
      .select()
      .single()
    
    console.log('✅ Stored inbound message with parsed intent')
    
    // 2. System processes and responds
    console.log('\n🤖 System: Processing booking request...')
    
    // Check for existing customer
    console.log('   - Checking if customer exists...')
    console.log('   - Customer not found, initiating registration')
    
    // Store outbound message
    const { data: outboundMsg1 } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-OUT-${Date.now()}`,
        target_entity_id: conversation.id,
        smart_code: 'HERA.WHATSAPP.MSG.OUTBOUND.v1',
        metadata: {
          message_id: `wamid.${Date.now()}`,
          text: 'Welcome to Glamour Salon! To book your appointment, I\'ll need your name. What should I call you?',
          direction: 'outbound',
          message_type: 'text'
        }
      })
      .select()
      .single()
    
    console.log('\n💬 Bot: "Welcome! To book your appointment, I\'ll need your name. What should I call you?"')
    
    // 3. Customer provides name
    console.log('\n💬 Customer: "I\'m Sarah Johnson"')
    
    // Create customer entity
    const { data: customer } = await supabase
      .from('core_entities')
      .insert({
        organization_id: orgId,
        entity_type: 'customer',
        entity_name: 'Sarah Johnson',
        entity_code: `CUST-${Date.now()}`,
        smart_code: 'HERA.SALON.CLIENT.WHATSAPP.v1',
        metadata: {
          source: 'whatsapp',
          registration_date: new Date().toISOString()
        }
      })
      .select()
      .single()
    
    // Add phone number
    await supabase
      .from('core_dynamic_data')
      .insert({
        organization_id: orgId,
        entity_id: customer.id,
        field_name: 'phone',
        field_type: 'text',
        field_value_text: phoneNumber,
        smart_code: 'HERA.SALON.CLIENT.PHONE.v1'
      })
    
    console.log('✅ Created customer entity: Sarah Johnson')
    
    // 4. Show available slots
    console.log('\n🤖 System: Checking availability for tomorrow 3pm...')
    
    // Find stylist
    const { data: stylist } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', orgId)
      .eq('entity_type', 'employee')
      .eq('entity_name', 'Emma Davis')
      .single()
    
    // Simulate slot availability check
    console.log('\n💬 Bot: "Great Sarah! I have these slots available tomorrow:"')
    console.log('   📅 Tuesday, Jan 16')
    console.log('   • 2:00 PM with Lisa')
    console.log('   • 3:00 PM with Emma ✅')
    console.log('   • 4:30 PM with Nina')
    console.log('   [Tap to select]')
    
    // 5. Customer confirms
    console.log('\n💬 Customer: [Taps "3:00 PM with Emma"]')
    
    // Create appointment
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    
    const { data: appointment } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: orgId,
        transaction_type: 'appointment',
        transaction_code: `APT-WA-${Date.now()}`,
        transaction_date: tomorrow.toISOString().split('T')[0],
        source_entity_id: customer.id,
        target_entity_id: stylist?.id,
        total_amount: 150,
        smart_code: 'HERA.SALON.APPOINTMENT.WHATSAPP.v1',
        metadata: {
          service_name: 'Haircut & Style',
          appointment_time: '15:00',
          duration: 45,
          booking_source: 'whatsapp',
          conversation_id: conversation.id
        }
      })
      .select()
      .single()
    
    console.log('\n✅ Appointment created successfully!')
    
    // Assign workflow status
    const { data: scheduledStatus } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', orgId)
      .eq('entity_type', 'workflow_status')
      .eq('entity_code', 'STATUS-APPOINTMENT-SCHEDULED')
      .single()
    
    if (scheduledStatus) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: orgId,
          from_entity_id: appointment.id,
          to_entity_id: scheduledStatus.id,
          relationship_type: 'has_workflow_status',
          smart_code: 'HERA.WORKFLOW.APPOINTMENT.SCHEDULED.v1',
          relationship_data: {
            is_active: true,
            source: 'whatsapp_booking'
          }
        })
    }
    
    // 6. Send confirmation
    console.log('\n💬 Bot: "✅ Booking Confirmed!')
    console.log('   📅 Tomorrow (Jan 16) at 3:00 PM')
    console.log('   👤 With Emma')
    console.log('   💅 Service: Haircut & Style')
    console.log('   💰 Price: AED 150')
    console.log('   ')
    console.log('   We\'ll send you a reminder tomorrow morning."')
    
    // 7. Show integration results
    console.log('\n🎯 WHATSAPP INTEGRATION COMPLETE!')
    console.log('=' .repeat(50))
    console.log('\n📊 What Just Happened:')
    console.log('1. WhatsApp conversation tracked as entity')
    console.log('2. Messages stored as transactions')
    console.log('3. Customer automatically registered')
    console.log('4. Appointment created with proper relationships')
    console.log('5. Workflow status assigned')
    console.log('6. All via natural conversation!')
    
    // 8. Demonstrate staff side
    console.log('\n📱 STAFF WHATSAPP EXAMPLE:')
    console.log('=' .repeat(50))
    
    console.log('\n💬 Emma (Staff): "Show my schedule tomorrow"')
    
    console.log('\n💬 Bot: "📅 Your Schedule - Tuesday, Jan 16')
    console.log('   9:00 AM - Available')
    console.log('   10:30 AM - Maya Patel (Hair Color)')
    console.log('   12:00 PM - Lunch Break')
    console.log('   2:00 PM - Available')
    console.log('   3:00 PM - Sarah Johnson (Haircut) 🆕')
    console.log('   4:30 PM - Available"')
    
    console.log('\n💬 Emma: "Check in Sarah Johnson"')
    console.log('\n💬 Bot: "✅ Sarah Johnson checked in successfully!"')
    
    // Show data structure
    console.log('\n📄 DATA STRUCTURE CREATED:')
    console.log(`
    core_entities:
      - WhatsApp Conversation (${conversation.id})
      - Customer: Sarah Johnson (${customer.id})
      
    universal_transactions:
      - WhatsApp Messages (${inboundMsg.id}, ${outboundMsg1.id})
      - Appointment (${appointment.id})
      
    core_relationships:
      - Appointment → SCHEDULED status
      
    core_dynamic_data:
      - Customer phone: ${phoneNumber}
    `)
    
  } catch (error) {
    console.error('\n❌ Demo failed:', error)
  }
}

// Additional demo functions
async function demonstrateReminderSystem(orgId) {
  console.log('\n⏰ AUTOMATED REMINDER SYSTEM:')
  console.log('=' .repeat(50))
  
  console.log('\n📅 Day Before (6 PM):')
  console.log('💬 Bot: "Hi Sarah! Just a reminder about your appointment tomorrow:')
  console.log('   📅 Tuesday at 3:00 PM')
  console.log('   👤 With Emma')
  console.log('   💅 Haircut & Style')
  console.log('   📍 Glamour Salon, Dubai Mall')
  console.log('   ')
  console.log('   Reply CANCEL to cancel or CHANGE to reschedule"')
  
  console.log('\n📅 Day Of (12 PM):')
  console.log('💬 Bot: "Hi Sarah! See you at 3 PM today! 💅')
  console.log('   ')
  console.log('   📍 Get directions: https://maps.app/glamour-salon')
  console.log('   🚗 Parking available at P2 Level')
  console.log('   ')
  console.log('   Running late? Let us know!"')
}

async function demonstrateLoyaltyIntegration(orgId) {
  console.log('\n🌟 LOYALTY PROGRAM VIA WHATSAPP:')
  console.log('=' .repeat(50))
  
  console.log('\n💬 Customer: "Check my points"')
  console.log('\n💬 Bot: "🌟 Your Loyalty Status')
  console.log('   ')
  console.log('   Points Balance: 750 points')
  console.log('   Membership Tier: Gold ⭐')
  console.log('   ')
  console.log('   🎁 You have 1 reward available!')
  console.log('   • Free Hair Treatment (500 pts)')
  console.log('   ')
  console.log('   You\'re 250 points away from Platinum!"')
}

// Main execution
async function main() {
  const orgId = process.env.DEFAULT_ORGANIZATION_ID || '550e8400-e29b-41d4-a716-446655440000'
  console.log(`Organization ID: ${orgId}\n`)
  
  // Main conversation demo
  await simulateWhatsAppConversation(orgId)
  
  // Additional features
  await demonstrateReminderSystem(orgId)
  await demonstrateLoyaltyIntegration(orgId)
  
  console.log('\n✨ WhatsApp + HERA = Seamless Business Communication!')
}

main()