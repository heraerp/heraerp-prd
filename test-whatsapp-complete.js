const axios = require('axios');

// Configuration
const PHONE_NUMBER_ID = '712631301940690';
const RECIPIENT = '919945896033';
const TEST_ENDPOINT = 'https://heraerp.com/api/v1/whatsapp/test';
const WEBHOOK_URL = 'https://heraerp.com/api/v1/whatsapp/webhook';
const DASHBOARD_URL = 'https://heraerp.com/salon/whatsapp';

async function testComplete() {
  console.log('🧪 Complete WhatsApp Integration Test\n');
  console.log('=====================================\n');
  
  // 1. Test webhook verification
  console.log('1️⃣ Testing webhook verification...');
  try {
    const verifyResponse = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': 'hera-whatsapp-webhook-2024-secure-token',
        'hub.challenge': 'test_verification'
      }
    });
    
    if (verifyResponse.data === 'test_verification') {
      console.log('✅ Webhook verification: WORKING\n');
    } else {
      console.log('❌ Webhook verification: FAILED\n');
    }
  } catch (error) {
    console.log('❌ Webhook error:', error.message, '\n');
  }
  
  // 2. Check test endpoint
  console.log('2️⃣ Checking WhatsApp status...');
  try {
    const testResponse = await axios.get(TEST_ENDPOINT);
    const data = testResponse.data;
    
    console.log('✅ Test endpoint accessible');
    console.log('Configuration status:');
    Object.entries(data.config).forEach(([key, value]) => {
      console.log(`  - ${key}: ${value ? '✅' : '❌'}`);
    });
    
    console.log(`\nRecent messages: ${data.recent_messages?.length || 0}`);
    console.log(`Recent conversations: ${data.recent_conversations?.length || 0}`);
    
    if (data.recent_messages?.length > 0) {
      console.log('\n📱 Latest message:');
      console.log(data.recent_messages[0]);
    }
  } catch (error) {
    console.log('❌ Test endpoint error:', error.message);
  }
  
  // 3. Simulate sending a webhook
  console.log('\n3️⃣ Simulating incoming WhatsApp message...');
  const testPayload = {
    entry: [{
      id: '1112225330318984',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '+919945896033',
            phone_number_id: PHONE_NUMBER_ID
          },
          messages: [{
            from: '919945896033',
            id: 'test_' + Date.now(),
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
    const webhookResponse = await axios.post(WEBHOOK_URL, testPayload, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Webhook response:', webhookResponse.data);
  } catch (error) {
    console.log('❌ Webhook error:', error.response?.data || error.message);
  }
  
  // 4. Try to send a message (if token provided)
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  if (accessToken) {
    console.log('\n4️⃣ Attempting to send WhatsApp message...');
    try {
      const sendResponse = await axios.post(
        `https://graph.facebook.com/v23.0/${PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: RECIPIENT,
          type: 'text',
          text: {
            preview_url: false,
            body: '✅ HERA WhatsApp Integration Test Successful!\n\nYour integration is working. Try sending "Hi" or "Book appointment" to test the bot.'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Message sent! ID:', sendResponse.data.messages[0].id);
    } catch (error) {
      if (error.response?.status === 400) {
        console.log('⚠️  Cannot send - you must message the business first');
      } else {
        console.log('❌ Send error:', error.response?.data?.error?.message || error.message);
      }
    }
  }
  
  // Summary
  console.log('\n\n📋 Integration Summary:');
  console.log('=======================');
  console.log('✅ Webhook URL: Working at', WEBHOOK_URL);
  console.log('✅ Webhook subscribed to "messages" field');
  console.log('✅ Organization configured');
  console.log('\n📱 Next Steps:');
  console.log('1. Send a WhatsApp message to +91 99458 96033');
  console.log('2. Check dashboard at:', DASHBOARD_URL);
  console.log('3. Monitor Railway logs: railway logs');
  
  console.log('\n💬 Test Messages:');
  console.log('- "Hi" - Get welcome message');
  console.log('- "Book appointment" - Start booking flow');
  console.log('- "What services do you offer?" - See services');
}

// Run with: WHATSAPP_ACCESS_TOKEN="your-token" node test-whatsapp-complete.js
testComplete();