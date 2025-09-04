const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Use the salon demo organization ID (Hair Talkz • Park Regis)
const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function createSampleWhatsAppData() {
  console.log('🔧 Creating sample WhatsApp data...');
  console.log('📍 Using organization ID:', organizationId);
  
  try {
    // 1. Create a customer
    const { data: customer, error: customerError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'customer',
        entity_name: 'Sarah Johnson',
        entity_code: 'WA-CUST-001',
        smart_code: 'HERA.SALON.CUSTOMER.PROFILE.v1',
        metadata: {
          phone: '+971501234567',
          wa_id: '971501234567',
          email: 'sarah@example.com'
        }
      })
      .select()
      .single();
    
    if (customerError) throw customerError;
    console.log('✅ Created customer:', customer.entity_name);
    
    // 2. Create a WhatsApp conversation
    const { data: conversation, error: convError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: 'Chat with Sarah Johnson',
        entity_code: `WA-CONV-${Date.now()}`,
        smart_code: 'HERA.WHATSAPP.CONVERSATION.v1',
        metadata: {
          wa_id: '971501234567',
          phone: '+971501234567',
          customer_name: 'Sarah Johnson',
          window_state: 'open',
          window_expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          unread_count: 2,
          conversation_cost: 0.25
        }
      })
      .select()
      .single();
    
    if (convError) throw convError;
    console.log('✅ Created conversation:', conversation.entity_name);
    
    // 3. Create WhatsApp messages (transactions)
    const messages = [
      {
        content: "Hi! I'd like to book an appointment for a haircut",
        direction: 'inbound',
        timestamp: new Date(Date.now() - 60 * 60 * 1000), // 1 hour ago
        waba_message_id: `wamid.${Date.now()}_1`
      },
      {
        content: "Hello Sarah! 👋 I'd be happy to help you book an appointment. We have availability today and tomorrow. When would you prefer?",
        direction: 'outbound',
        timestamp: new Date(Date.now() - 55 * 60 * 1000), // 55 minutes ago
        waba_message_id: `wamid.${Date.now()}_2`
      },
      {
        content: "Tomorrow afternoon would be perfect!",
        direction: 'inbound',
        timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
        waba_message_id: `wamid.${Date.now()}_3`
      },
      {
        content: "Great! I have these slots available tomorrow afternoon:\n• 2:00 PM with Emma\n• 3:30 PM with Sarah\n• 4:00 PM with Maria\n\nWhich would you prefer?",
        direction: 'outbound',
        timestamp: new Date(Date.now() - 25 * 60 * 1000), // 25 minutes ago
        waba_message_id: `wamid.${Date.now()}_4`
      }
    ];
    
    for (const msg of messages) {
      // Create transaction for each message
      const { data: transaction, error: txnError } = await supabase
        .from('universal_transactions')
        .insert({
          organization_id: organizationId,
          transaction_type: 'whatsapp_message',
          transaction_code: `WA-MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          transaction_date: msg.timestamp.toISOString(),
          total_amount: 0,
          transaction_status: 'completed',
          smart_code: msg.direction === 'inbound' ? 
            'HERA.WHATSAPP.MESSAGE.RECEIVED.v1' : 
            'HERA.WHATSAPP.MESSAGE.SENT.v1',
          external_reference: msg.waba_message_id,
          metadata: {
            direction: msg.direction,
            wa_id: '971501234567',
            message_type: 'text',
            text: msg.content,
            waba_message_id: msg.waba_message_id
          }
        })
        .select()
        .single();
      
      if (txnError) throw txnError;
      
      // Message text is now stored in transaction metadata
      // No relationships needed - we use wa_id to match messages to conversations
      
      console.log(`✅ Created ${msg.direction} message: "${msg.content.substring(0, 50)}..."`);
    }
    
    // Add one more conversation
    const { data: customer2 } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'customer',
        entity_name: 'Ahmed Ali',
        entity_code: 'WA-CUST-002',
        smart_code: 'HERA.SALON.CUSTOMER.PROFILE.v1',
        metadata: {
          phone: '+971502345678',
          wa_id: '971502345678',
          email: 'ahmed@example.com'
        }
      })
      .select()
      .single();
    
    const { data: conversation2 } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: 'Chat with Ahmed Ali',
        entity_code: `WA-CONV-${Date.now()}-2`,
        smart_code: 'HERA.WHATSAPP.CONVERSATION.v1',
        metadata: {
          wa_id: '971502345678',
          phone: '+971502345678',
          customer_name: 'Ahmed Ali',
          window_state: 'closed',
          unread_count: 0,
          conversation_cost: 0.15
        }
      })
      .select()
      .single();
    
    // Add a simple message
    const { data: transaction2 } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `WA-MSG-${Date.now()}-xyz`,
        transaction_date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        total_amount: 0,
        transaction_status: 'completed',
        smart_code: 'HERA.WHATSAPP.MESSAGE.RECEIVED.v1',
        metadata: {
          direction: 'inbound',
          wa_id: '971502345678',
          text: 'Hi, what are your opening hours?',
          message_type: 'text'
        }
      })
      .select()
      .single();
    
    // Message text is stored in transaction metadata
    // No relationships needed - we use wa_id to match messages to conversations
    
    console.log('\n✨ Sample WhatsApp data created successfully!');
    console.log(`📱 Created 2 conversations with ${messages.length + 1} total messages`);
    
  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  }
}

createSampleWhatsAppData();