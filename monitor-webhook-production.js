const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hair Talkz organization ID
const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function monitorWebhookProduction() {
  console.log('🚀 WhatsApp Webhook Production Monitor\n');
  
  // Your production URL
  const productionUrl = process.env.RAILWAY_PUBLIC_DOMAIN 
    ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
    : 'https://your-app-name.railway.app';
  
  console.log('🌐 Production URL:', productionUrl);
  console.log('📱 WhatsApp Business Number:', process.env.WHATSAPP_BUSINESS_NUMBER || '+91 99458 96033');
  console.log('🏢 Organization:', 'Hair Talkz • Park Regis');
  
  // Test webhook endpoint
  console.log('\n🔍 Testing webhook endpoint...');
  try {
    const testUrl = `${productionUrl}/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hera-whatsapp-webhook-token-2024'}&hub.challenge=production_test`;
    
    const response = await fetch(testUrl);
    const result = await response.text();
    
    if (result === 'production_test') {
      console.log('✅ Webhook endpoint is working correctly!');
    } else {
      console.log('❌ Webhook verification failed. Response:', result);
    }
  } catch (error) {
    console.log('❌ Could not reach webhook endpoint:', error.message);
  }
  
  // Monitor recent messages
  console.log('\n📊 Recent WhatsApp Activity:\n');
  
  // Get last 10 messages
  const { data: messages, error: msgError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'whatsapp_message')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);
  
  if (msgError) {
    console.error('Error fetching messages:', msgError);
    return;
  }
  
  if (!messages || messages.length === 0) {
    console.log('No WhatsApp messages found yet.');
    console.log('\n💡 To receive messages:');
    console.log('1. Configure webhook in Meta Business Manager:');
    console.log(`   URL: ${productionUrl}/api/v1/whatsapp/webhook`);
    console.log('   Token: hera-whatsapp-webhook-token-2024');
    console.log('2. Subscribe to: messages, message_status');
    console.log('3. Send a message to +91 99458 96033');
    return;
  }
  
  // Group messages by conversation
  const conversations = {};
  messages.forEach(msg => {
    const waId = msg.metadata?.wa_id || 'Unknown';
    if (!conversations[waId]) {
      conversations[waId] = [];
    }
    conversations[waId].push(msg);
  });
  
  // Display conversations
  Object.entries(conversations).forEach(([waId, msgs]) => {
    console.log(`\n📱 Conversation with ${waId}:`);
    console.log(`   Messages: ${msgs.length}`);
    console.log(`   Latest: ${new Date(msgs[0].created_at).toLocaleString()}`);
    
    // Show last message
    const lastMsg = msgs[0];
    console.log(`   Last message: "${lastMsg.metadata?.text?.substring(0, 50)}${lastMsg.metadata?.text?.length > 50 ? '...' : ''}"`);
  });
  
  // Show webhook statistics
  console.log('\n📈 Webhook Statistics:');
  
  const { count: totalMessages } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_type', 'whatsapp_message')
    .eq('organization_id', organizationId);
  
  const { count: todayMessages } = await supabase
    .from('universal_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('transaction_type', 'whatsapp_message')
    .eq('organization_id', organizationId)
    .gte('created_at', new Date().toISOString().split('T')[0]);
  
  console.log(`- Total messages: ${totalMessages || 0}`);
  console.log(`- Messages today: ${todayMessages || 0}`);
  
  // Check webhook health
  console.log('\n🏥 Webhook Health Check:');
  console.log('- Endpoint URL:', `${productionUrl}/api/v1/whatsapp/webhook`);
  console.log('- Environment:', process.env.NODE_ENV || 'development');
  console.log('- Verify token:', process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN ? '✅ Configured' : '❌ Missing');
  console.log('- Access token:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Configured' : '❌ Missing');
  console.log('- Phone ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Configured' : '❌ Missing');
}

monitorWebhookProduction().catch(console.error);