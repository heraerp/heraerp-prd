const axios = require('axios');

// WhatsApp configuration
const PHONE_NUMBER_ID = '712631301940690';
const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN_HERE';
const RECIPIENT_NUMBER = '919945896033'; // Your WhatsApp number without +

async function sendTestMessage() {
  console.log('🚀 Testing WhatsApp message sending...\n');
  
  try {
    // Send a test message
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: RECIPIENT_NUMBER,
        type: 'text',
        text: {
          body: '🧪 Test message from HERA WhatsApp Integration!\n\nIf you receive this, your integration is working correctly.'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
    console.log('\nNote: The recipient must have messaged your business first within the last 24 hours.');
    
  } catch (error) {
    console.error('❌ Error sending message:');
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
      
      if (error.response.status === 401) {
        console.error('\n⚠️  Access token is invalid or expired. Please update your token.');
      } else if (error.response.data.error?.message?.includes('recipient is not a valid whatsapp user')) {
        console.error('\n⚠️  The recipient has not messaged your business yet. They must initiate contact first.');
      }
    } else {
      console.error(error.message);
    }
  }
}

// Check webhook health
async function checkWebhookHealth() {
  console.log('\n📡 Checking webhook health...\n');
  
  const webhookUrls = [
    'https://heraerp.com/api/v1/whatsapp/webhook',
    'https://www.heraerp.com/api/v1/whatsapp/webhook',
    'https://api.heraerp.com/api/v1/whatsapp/webhook'
  ];
  
  for (const url of webhookUrls) {
    try {
      const response = await axios.get(url, {
        params: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'hera-whatsapp-webhook-2024-secure-token',
          'hub.challenge': 'test_challenge'
        }
      });
      
      if (response.data === 'test_challenge') {
        console.log(`✅ ${url} - Working correctly`);
      } else {
        console.log(`❌ ${url} - Invalid response`);
      }
    } catch (error) {
      console.log(`❌ ${url} - Error: ${error.response?.status || error.message}`);
    }
  }
}

// Check if we can receive the webhook subscription
async function checkWebhookSubscription() {
  console.log('\n🔔 Checking webhook subscription...\n');
  
  try {
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/subscribed_apps`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('✅ Webhook is subscribed to receive messages');
      console.log('Subscribed fields:', response.data.data[0].subscribed_fields);
    } else {
      console.log('❌ Webhook is NOT subscribed. Please subscribe in Meta Business Manager.');
    }
  } catch (error) {
    console.error('❌ Error checking subscription:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🧪 HERA WhatsApp Integration Test\n');
  console.log('Business Number: +91 99458 96033');
  console.log('Phone Number ID:', PHONE_NUMBER_ID);
  console.log('================================\n');
  
  // Check webhook health
  await checkWebhookHealth();
  
  // Check webhook subscription
  await checkWebhookSubscription();
  
  // Try to send a message
  console.log('\n📤 Attempting to send test message...');
  await sendTestMessage();
  
  console.log('\n✅ Test complete!');
  console.log('\nIf the webhook is working but you\'re not receiving messages:');
  console.log('1. Make sure the webhook is subscribed to "messages" field in Meta Business Manager');
  console.log('2. Check Railway logs for incoming webhooks: railway logs');
  console.log('3. Ensure all environment variables are set correctly');
}

// Run the tests
runTests();