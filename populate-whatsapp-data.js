/**
 * Populate WhatsApp Test Data
 * Creates sample conversations and messages in HERA database
 */

const { createClient } = require('@supabase/supabase-js')

// Initialize Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://awfcrncxngqwbhqapffb.supabase.co'
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'
const supabase = createClient(supabaseUrl, supabaseKey)

const organizationId = '44d2d8f8-167d-46a7-a704-c0e5435863d6'

// Sample conversations data
const sampleConversations = [
  {
    name: 'Sarah Johnson',
    phone: '+971501234567',
    messages: [
      { text: 'Hi! I would like to book a hair appointment', direction: 'inbound', time: -120 },
      { text: 'Hello Sarah! I\'d be happy to help you book an appointment. What service are you looking for?', direction: 'outbound', time: -115 },
      { text: 'I need a haircut and color', direction: 'inbound', time: -110 },
      { text: 'Great! We have availability tomorrow at 2 PM with Maya. Would that work for you?', direction: 'outbound', time: -105 },
      { text: 'Perfect! Please book it', direction: 'inbound', time: -100 },
      { text: '✅ Your appointment is confirmed for tomorrow at 2 PM with Maya. Total: AED 280. See you then!', direction: 'outbound', time: -95, status: 'read' }
    ]
  },
  {
    name: 'Emma Davis',
    phone: '+971507654321',
    messages: [
      { text: 'What are your prices for Brazilian Blowout?', direction: 'inbound', time: -180 },
      { text: 'Hi Emma! Our Brazilian Blowout service starts at AED 500. The treatment takes about 3-4 hours and lasts up to 3 months.', direction: 'outbound', time: -175 },
      { text: 'Do you have any availability this week?', direction: 'inbound', time: -170 },
      { text: 'Yes! We have slots available on Thursday at 10 AM or Friday at 3 PM with our specialist Rocky.', direction: 'outbound', time: -165, status: 'delivered' }
    ]
  },
  {
    name: 'Aisha Khan',
    phone: '+971509876543',
    messages: [
      { text: 'Can I reschedule my appointment?', direction: 'inbound', time: -60 },
      { text: 'Of course! When would you like to reschedule to?', direction: 'outbound', time: -55 },
      { text: 'Next Monday at the same time?', direction: 'inbound', time: -50 },
      { text: 'Let me check... Yes, Monday at 4 PM is available. I\'ve rescheduled your appointment.', direction: 'outbound', time: -45, status: 'sent' },
      { text: 'Thank you so much!', direction: 'inbound', time: -40 }
    ]
  },
  {
    name: 'Fatima Al Rashid',
    phone: '+971502345678',
    messages: [
      { text: 'Do you offer bridal packages?', direction: 'inbound', time: -240 },
      { text: 'Yes! We have comprehensive bridal packages starting from AED 1,500. This includes hair styling, makeup, manicure, and pedicure.', direction: 'outbound', time: -235 },
      { text: 'Can you send me more details?', direction: 'inbound', time: -230 },
      { text: 'I\'ll email you our complete bridal package brochure. What\'s your email address?', direction: 'outbound', time: -225, status: 'read' }
    ]
  },
  {
    name: 'Maya Patel',
    phone: '+971503456789',
    messages: [
      { text: 'Hi, are you open today?', direction: 'inbound', time: -30 },
      { text: 'Yes! We\'re open until 9 PM today. How can we help you?', direction: 'outbound', time: -25, status: 'delivered' }
    ]
  }
]

async function populateWhatsAppData() {
  console.log('🚀 Populating WhatsApp test data...\n')
  
  try {
    // Create conversations and messages
    for (const conv of sampleConversations) {
      console.log(`📱 Creating conversation with ${conv.name}...`)
      
      // Create conversation entity
      const { data: conversation, error: convError } = await supabase
        .from('core_entities')
        .insert({
          organization_id: organizationId,
          entity_type: 'whatsapp_conversation',
          entity_name: conv.name,
          entity_code: `WA-${conv.phone.replace(/\+/g, '')}`,
          smart_code: 'HERA.WHATSAPP.CONVERSATION.v1',
          metadata: {
            phone_number: conv.phone,
            display_number: conv.phone,
            is_online: Math.random() > 0.5,
            last_seen: new Date(Date.now() - Math.random() * 86400000).toISOString(),
            about: 'Hey there! I am using WhatsApp.'
          }
        })
        .select()
        .single()
      
      if (convError) {
        console.error('❌ Error creating conversation:', convError)
        continue
      }
      
      console.log(`✅ Created conversation: ${conversation.id}`)
      
      // Create messages
      for (const msg of conv.messages) {
        const messageTime = new Date(Date.now() + (msg.time * 60 * 1000))
        
        const messageData = {
          organization_id: organizationId,
          transaction_type: 'whatsapp_message',
          transaction_code: `WA-MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transaction_date: messageTime.toISOString(),
          total_amount: 0,
          metadata: {
            type: 'text',
            text: msg.text,
            timestamp: Math.floor(messageTime.getTime() / 1000).toString(),
            whatsapp_message_id: `wamid.${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            latest_status: msg.status || (msg.direction === 'outbound' ? 'sent' : null)
          }
        }
        
        if (msg.direction === 'inbound') {
          // Inbound message: from conversation to business
          messageData.smart_code = 'HERA.WHATSAPP.MESSAGE.INBOUND.v1'
          messageData.source_entity_id = conversation.id
          messageData.target_entity_id = null
        } else {
          // Outbound message: from business to conversation
          messageData.smart_code = 'HERA.WHATSAPP.MESSAGE.OUTBOUND.v1'
          messageData.source_entity_id = null
          messageData.target_entity_id = conversation.id
        }
        
        const { data: message, error: msgError } = await supabase
          .from('universal_transactions')
          .insert(messageData)
          .select()
          .single()
        
        if (msgError) {
          console.error('❌ Error creating message:', msgError)
        } else {
          console.log(`  📨 Created ${msg.direction} message: "${msg.text.substring(0, 30)}..."`)
        }
      }
      
      console.log('')
    }
    
    // Create some additional metadata
    console.log('📊 Creating additional metadata...')
    
    // Pin first conversation
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .limit(1)
    
    if (conversations && conversations.length > 0) {
      await supabase
        .from('core_relationships')
        .insert({
          organization_id: organizationId,
          from_entity_id: conversations[0].id,
          to_entity_id: conversations[0].id,
          relationship_type: 'pinned_conversation',
          smart_code: 'HERA.WHATSAPP.CONV.PINNED.v1',
          metadata: { pinned_at: new Date().toISOString() }
        })
      
      console.log('📌 Pinned first conversation')
    }
    
    console.log('\n✅ WhatsApp test data populated successfully!')
    console.log('\n📋 Summary:')
    console.log(`- Created ${sampleConversations.length} conversations`)
    console.log(`- Created ${sampleConversations.reduce((sum, conv) => sum + conv.messages.length, 0)} messages`)
    console.log('\n🌐 View at: http://localhost:3002/whatsapp-messages')
    
  } catch (error) {
    console.error('❌ Error:', error)
  }
}

// Run the population
populateWhatsAppData()