const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hair Talkz organization ID
const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function testWebhookLive() {
  console.log('🔍 Testing WhatsApp Webhook Integration\n');

  // 1. Check webhook environment
  console.log('📋 Environment Configuration:');
  console.log(`- Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
  console.log(`- Business Number: ${process.env.WHATSAPP_BUSINESS_NUMBER}`);
  console.log(`- Access Token: ${process.env.WHATSAPP_ACCESS_TOKEN ? 'Configured' : 'Missing'}`);
  console.log(`- Webhook Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}`);
  console.log(`- Default Org ID: ${process.env.DEFAULT_ORGANIZATION_ID}`);

  // 2. Monitor real-time messages
  console.log('\n📱 Monitoring WhatsApp Messages...\n');
  
  let lastMessageTime = new Date();
  let messageCount = 0;
  
  const checkInterval = setInterval(async () => {
    try {
      // Check for new messages
      const { data: newMessages, error } = await supabase
        .from('universal_transactions')
        .select('*')
        .eq('transaction_type', 'whatsapp_message')
        .eq('organization_id', organizationId)
        .gte('created_at', lastMessageTime.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error checking messages:', error);
        return;
      }

      if (newMessages && newMessages.length > 0) {
        console.log(`\n✅ Found ${newMessages.length} new messages!`);
        
        newMessages.forEach(msg => {
          messageCount++;
          console.log(`\nMessage #${messageCount}:`);
          console.log(`- Created: ${new Date(msg.created_at).toLocaleString()}`);
          console.log(`- From: ${msg.metadata?.wa_id || 'Unknown'}`);
          console.log(`- Text: ${msg.metadata?.text || '[No text]'}`);
          console.log(`- Direction: ${msg.metadata?.direction || 'Unknown'}`);
          console.log(`- Transaction ID: ${msg.id}`);
        });
        
        lastMessageTime = new Date();
      }
    } catch (error) {
      console.error('Check error:', error);
    }
  }, 5000); // Check every 5 seconds

  console.log('Checking for new messages every 5 seconds...');
  console.log('Send a WhatsApp message to test the integration.');
  console.log('\nPress Ctrl+C to stop monitoring.\n');

  // Also check recent conversations
  const { data: conversations, error: convError } = await supabase
    .from('core_entities')
    .select('*')
    .eq('entity_type', 'whatsapp_conversation')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (conversations && conversations.length > 0) {
    console.log('\n📞 Recent Conversations:');
    conversations.forEach(conv => {
      console.log(`- ${conv.entity_name} (${conv.metadata?.wa_id})`);
      console.log(`  Last message: ${conv.metadata?.last_message_at ? new Date(conv.metadata.last_message_at).toLocaleString() : 'N/A'}`);
    });
  }

  // Keep process running
  process.on('SIGINT', () => {
    clearInterval(checkInterval);
    console.log('\n\nStopped monitoring.');
    process.exit(0);
  });
}

testWebhookLive().catch(console.error);