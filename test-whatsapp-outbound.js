require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const organizationId = process.env.DEFAULT_ORGANIZATION_ID || '3df8cc52-3d81-42d5-b088-7736ae26cc7c';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testOutboundMessage() {
  console.log('🚀 Creating outbound WhatsApp message...\n');
  
  try {
    // Find an existing conversation
    const { data: conversations } = await supabase
      .from('core_entities')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'whatsapp_conversation')
      .order('created_at', { ascending: false })
      .limit(1);
    
    if (!conversations || conversations.length === 0) {
      console.error('No conversations found. Run test-whatsapp-simple.js first.');
      return;
    }
    
    const conversation = conversations[0];
    console.log('Using conversation:', conversation.entity_name);
    
    // Create outbound message
    const messageId = `wamid.OUTBOUND_${Date.now()}`;
    const messageText = "Thank you for your message! Our team will get back to you soon about your appointment request.";
    
    const { data: transaction, error: txnError } = await supabase
      .from('universal_transactions')
      .insert({
        organization_id: organizationId,
        transaction_type: 'whatsapp_message',
        transaction_code: `MSG-OUT-${Date.now()}`,
        transaction_date: new Date().toISOString(),
        total_amount: 0,
        target_entity_id: conversation.id, // Outbound message
        smart_code: 'HERA.WHATSAPP.MSG.OUTBOUND.v1',
        metadata: {
          message_id: messageId,
          text: messageText,
          direction: 'outbound',
          wa_id: conversation.metadata.phone,
          timestamp: new Date().toISOString()
        }
      })
      .select()
      .single();
    
    if (txnError) throw txnError;
    console.log('✅ Created Outbound Message:', transaction.transaction_code);
    console.log('  - Text:', messageText);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testOutboundMessage();