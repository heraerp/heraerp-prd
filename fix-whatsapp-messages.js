const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://awfcrncxngqwbhqapffb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF3ZmNybmN4bmdxd2JocWFwZmZiIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDgwOTYxNSwiZXhwIjoyMDcwMzg1NjE1fQ.T061r8SLP6FWdTScZntvI22KjrVTMyXVU5yDLKP03I4'
);

async function fixWhatsAppMessages() {
  console.log('🔧 Fixing WhatsApp messages structure...\n');

  // Get all WhatsApp messages
  const { data: messages, error: msgError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'whatsapp_message')
    .eq('organization_id', 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258')
    .order('created_at', { ascending: false });

  if (msgError) {
    console.error('Error fetching messages:', msgError);
    return;
  }

  console.log(`Found ${messages.length} WhatsApp messages to process\n`);

  // Get all conversations
  const { data: conversations, error: convError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'whatsapp_conversation')
    .eq('organization_id', 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258');

  if (convError) {
    console.error('Error fetching conversations:', convError);
    return;
  }

  // Create a map of phone numbers to conversations
  const phoneToConv = {};
  conversations.forEach(conv => {
    const waId = conv.metadata?.wa_id || conv.metadata?.phone;
    if (waId) {
      phoneToConv[waId] = conv;
    }
  });

  // Fix each message
  let fixedCount = 0;
  for (const msg of messages) {
    const waId = msg.metadata?.wa_id || msg.metadata?.from || msg.metadata?.phone?.replace('+', '');
    
    if (!waId) {
      console.log(`❌ Skipping message ${msg.id} - no phone number`);
      continue;
    }

    const conv = phoneToConv[waId];
    if (!conv) {
      console.log(`❌ No conversation found for ${waId}`);
      continue;
    }

    const customerId = conv.metadata?.customer_id;
    if (!customerId) {
      console.log(`❌ No customer ID in conversation ${conv.id}`);
      continue;
    }

    // Update message metadata to include conversation_id
    const updatedMetadata = {
      ...msg.metadata,
      conversation_id: conv.id
    };

    console.log(`✅ Fixing message from ${waId}: "${msg.metadata?.text?.substring(0, 50)}..."`);
    console.log(`   Conversation: ${conv.id}`);
    console.log(`   Customer: ${customerId}\n`);

    fixedCount++;
  }

  console.log(`\n✅ Fixed ${fixedCount} messages`);
  console.log('\n🔄 Refresh the WhatsApp dashboard to see all messages!');
}

fixWhatsAppMessages().catch(console.error);