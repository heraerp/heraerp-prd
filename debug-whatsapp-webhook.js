const { config } = require('dotenv');
const { createClient } = require('@supabase/supabase-js');

config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Hair Talkz organization ID
const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258';

async function debugWhatsAppWebhook() {
  console.log('🔍 WhatsApp Webhook Debugging\n');

  // 1. Check recent WhatsApp messages in database
  console.log('📱 Checking recent WhatsApp messages in database...');
  
  const { data: recentMessages, error: msgError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'whatsapp_message')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(10);

  if (msgError) {
    console.error('❌ Error fetching messages:', msgError);
  } else {
    console.log(`Found ${recentMessages.length} WhatsApp messages`);
    
    if (recentMessages.length > 0) {
      console.log('\nMost recent message:');
      const latest = recentMessages[0];
      console.log(`- Created: ${new Date(latest.created_at).toLocaleString()}`);
      console.log(`- Direction: ${latest.metadata?.direction}`);
      console.log(`- Text: ${latest.metadata?.text?.substring(0, 50)}...`);
      console.log(`- From: ${latest.metadata?.wa_id}`);
    }
  }

  // 2. Check if there are any webhook logs
  console.log('\n🔗 Checking for webhook activity...');
  
  const { data: webhookLogs, error: logError } = await supabase
    .from('universal_transactions')
    .select('*')
    .eq('transaction_type', 'whatsapp_webhook')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(5);

  if (!logError && webhookLogs) {
    console.log(`Found ${webhookLogs.length} webhook logs`);
  }

  // 3. Test webhook endpoint locally
  console.log('\n🌐 Testing webhook endpoint...');
  
  try {
    // Test GET (verification)
    const verifyResponse = await fetch('http://localhost:3000/api/v1/whatsapp/webhook?' + new URLSearchParams({
      'hub.mode': 'subscribe',
      'hub.verify_token': process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hera-whatsapp-webhook-token-2024',
      'hub.challenge': 'test_challenge_123'
    }));

    if (verifyResponse.ok) {
      const challenge = await verifyResponse.text();
      console.log('✅ Webhook verification working! Response:', challenge);
    } else {
      console.log('❌ Webhook verification failed:', verifyResponse.status);
    }

    // Test POST (message reception)
    const testMessage = {
      entry: [{
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '15550559999',
              phone_number_id: '712631301940690'
            },
            contacts: [{
              profile: {
                name: 'Test User'
              },
              wa_id: '919945896033'
            }],
            messages: [{
              from: '919945896033',
              id: 'wamid.test_' + Date.now(),
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: 'Test message from debugging script'
              },
              type: 'text'
            }]
          }
        }]
      }]
    };

    console.log('\n📤 Sending test message to webhook...');
    const messageResponse = await fetch('http://localhost:3000/api/v1/whatsapp/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testMessage)
    });

    if (messageResponse.ok) {
      const result = await messageResponse.json();
      console.log('✅ Test message processed:', result);
    } else {
      console.log('❌ Test message failed:', messageResponse.status);
      const error = await messageResponse.text();
      console.log('Error:', error);
    }

  } catch (error) {
    console.log('❌ Error testing webhook:', error.message);
    console.log('\n⚠️  Make sure the development server is running on port 3000');
  }

  // 4. Check webhook configuration
  console.log('\n📋 Webhook Configuration:');
  console.log(`- Webhook URL: https://your-ngrok-url.ngrok.io/api/v1/whatsapp/webhook`);
  console.log(`- Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN || 'hera-whatsapp-webhook-token-2024'}`);
  console.log(`- Phone Number ID: ${process.env.WHATSAPP_PHONE_NUMBER_ID}`);
  console.log(`- Business Number: ${process.env.WHATSAPP_BUSINESS_NUMBER}`);

  console.log('\n🔧 Troubleshooting Steps:');
  console.log('1. Make sure ngrok is running: ngrok http 3000');
  console.log('2. Copy the HTTPS URL from ngrok');
  console.log('3. In Meta Business Manager:');
  console.log('   - Go to WhatsApp > Configuration > Webhooks');
  console.log('   - Update the webhook URL with your ngrok URL');
  console.log('   - Make sure webhook is verified (green checkmark)');
  console.log('   - Subscribe to "messages" and "message_status" fields');
  console.log('4. Send a message to your WhatsApp Business number');
  console.log('5. Check the server console for webhook logs');
  console.log('6. If no logs appear, check ngrok web interface at http://127.0.0.1:4040');
}

debugWhatsAppWebhook().catch(console.error);