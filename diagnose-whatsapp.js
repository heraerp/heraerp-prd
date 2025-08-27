const axios = require('axios');

// Configuration
const PHONE_NUMBER_ID = '712631301940690';
const WABA_ID = '1112225330318984';
const TEST_ENDPOINT = 'https://heraerp.com/api/v1/whatsapp/test';
const WEBHOOK_URL = 'https://heraerp.com/api/v1/whatsapp/webhook';

async function checkWebhookStatus() {
  console.log('🔍 Checking WhatsApp Integration Status...\n');
  
  // 1. Test webhook verification
  try {
    const verifyResponse = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'hera-whatsapp-webhook-2024-secure-token',
        'hub.challenge': 'test_challenge'
      }
    });
    
    if (verifyResponse.data === 'test_challenge') {
      console.log('✅ Webhook verification: WORKING');
    } else {
      console.log('❌ Webhook verification: FAILED');
    }
  } catch (error) {
    console.log('❌ Webhook error:', error.message);
  }
  
  // 2. Check test endpoint (if deployed)
  try {
    const testResponse = await axios.get(TEST_ENDPOINT);
    console.log('\n📊 WhatsApp Status from Test Endpoint:');
    console.log('Configuration:', testResponse.data.config);
    console.log('Recent messages:', testResponse.data.recent_messages?.length || 0);
    console.log('Recent conversations:', testResponse.data.recent_conversations?.length || 0);
    
    if (testResponse.data.recent_messages?.length === 0) {
      console.log('\n⚠️  No messages found in database');
    }
  } catch (error) {
    console.log('\n⚠️  Test endpoint not yet deployed or not accessible');
  }
}

async function sendDebugMessage(accessToken) {
  if (!accessToken) {
    console.log('\n⚠️  No access token provided for sending test message');
    return;
  }
  
  console.log('\n📤 Attempting to send a test message...\n');
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919945896033',
        type: 'text',
        text: {
          body: '🔍 Debug: If you receive this, outbound messaging is working. Please reply to test inbound webhooks.'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Test message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
  } catch (error) {
    console.log('❌ Failed to send message:', error.response?.data?.error?.message || error.message);
  }
}

async function simulateWebhook() {
  console.log('\n🧪 Simulating a webhook call to test processing...\n');
  
  const testWebhookPayload = {
    entry: [{
      id: WABA_ID,
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '+919945896033',
            phone_number_id: PHONE_NUMBER_ID
          },
          messages: [{
            from: '919945896033',
            id: 'test_message_' + Date.now(),
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { body: 'Test: I want to book an appointment' },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  try {
    const response = await axios.post(WEBHOOK_URL, testWebhookPayload, {
      headers: {
        'Content-Type': 'application/json',
        'X-Hub-Signature-256': 'test_signature' // In production, this would be validated
      }
    });
    
    console.log('✅ Webhook simulation response:', response.data);
  } catch (error) {
    console.log('❌ Webhook simulation failed:', error.response?.data || error.message);
  }
}

async function main() {
  console.log('🔍 HERA WhatsApp Diagnostic Tool\n');
  console.log('=================================\n');
  
  // Check webhook status
  await checkWebhookStatus();
  
  // Get access token from environment or command line
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN || process.argv[2];
  
  // Try sending a message if token provided
  if (accessToken) {
    await sendDebugMessage(accessToken);
  }
  
  // Simulate a webhook call
  await simulateWebhook();
  
  console.log('\n\n📋 Troubleshooting Steps:');
  console.log('1. ✅ Webhook is subscribed to "messages" field');
  console.log('2. ❓ Check if Railway has all environment variables set');
  console.log('3. ❓ Check Railway logs for any errors');
  console.log('4. ❓ Ensure the webhook processor is correctly handling messages');
  
  console.log('\n💡 If no response when sending messages:');
  console.log('- The webhook may not be processing messages correctly');
  console.log('- Check Railway logs: railway logs');
  console.log('- Visit test endpoint: https://heraerp.com/api/v1/whatsapp/test');
}

// Run with: node diagnose-whatsapp.js [optional-access-token]
main();