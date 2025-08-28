require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSimpleMessage() {
  console.log('🚀 Testing WhatsApp Message Storage (Simplified)\n');
  
  try {
    // Create a simple WhatsApp message following the current working pattern
    const messageId = `wamid.TEST_${Date.now()}`;
    const messageText = "Hello! Testing the WhatsApp canonical API.";
    const waId = '971501234567';
    
    // 1. Create/find conversation entity
    const { data: conversation, error: convError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: organizationId,
        entity_type: 'whatsapp_conversation',
        entity_name: `Chat with ${waId}`,
        entity_code: `CONV-${waId}`,
        smart_code: 'HERA.BEAUTY.COMMS.CONVERSATION.WHATSAPP.V1',
        metadata: {
          phone: waId,
          channel: 'whatsapp',
          started_at: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (convError) throw convError;
    console.log('✅ Created Conversation:', conversation.entity_name);
    
    // 2. Create message transaction
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        source_entity_id: conversation.id, // Inbound message
        smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
        metadata: {
          message_id: messageId,
          text: messageText,
          direction: 'inbound',
          wa_id: waId,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (txnError) throw txnError;
    console.log('✅ Created Message Transaction:', transaction.transaction_code);
    console.log('  - Message ID:', messageId);
    console.log('  - Text:', messageText);
    
    // 3. Test the retrieval API
    console.log('\n📥 Testing retrieval...');
    
    // Get conversations
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .order('created_at', { ascending: false })
      .limit(5);
    
    console.log(`Found ${conversations?.length || 0} conversations`);
    
    // Get messages
    const { data: messages } = await supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('transaction_type', 'whatsapp_message')
      .order('created_at', { ascending: false })
      .limit(10);
    
    console.log(`Found ${messages?.length || 0} messages`);
    
    if (messages && messages.length > 0) {
      console.log('\nLatest messages:');
      messages.slice(0, 3).forEach(msg => {
        const direction = msg.source_entity_id ? 'inbound' : 'outbound';
        console.log(`  - ${msg.metadata?.text || 'No text'} [${direction}]`);
      });
    }
    
    console.log('\n✅ Test complete!');
    console.log('View messages at: http://localhost:3000/salon/whatsapp-canonical');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testSimpleMessage();