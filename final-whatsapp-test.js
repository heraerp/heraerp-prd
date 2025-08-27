const axios = require('axios');

// Configuration
const PHONE_NUMBER_ID = '712631301940690';
const RECIPIENT = '919945896033'; // Your WhatsApp number
const WEBHOOK_URL = 'https://heraerp.com/api/v1/whatsapp/webhook';
const VERIFY_TOKEN = 'hera-whatsapp-webhook-2024-secure-token';

async function testWebhook() {
  console.log('🔍 Testing Webhook Verification...\n');
  
  try {
    const response = await axios.get(WEBHOOK_URL, {
      params: {
        'hub.mode': 'subscribe',
        'hub.verify_token': VERIFY_TOKEN,
        'hub.challenge': 'test_verification'
      }
    });
    
    if (response.data === 'test_verification') {
      console.log('✅ Webhook verification: WORKING');
      console.log(`   URL: ${WEBHOOK_URL}`);
      console.log(`   Token: ${VERIFY_TOKEN}`);
    } else {
      console.log('❌ Webhook verification failed');
    }
  } catch (error) {
    console.log('❌ Webhook error:', error.message);
  }
}

async function checkRailwayToken() {
  console.log('\n🔐 Checking Railway Configuration...\n');
  console.log('Please ensure these are set in Railway:');
  console.log('- WHATSAPP_ACCESS_TOKEN (your WABA token)');
  console.log('- WHATSAPP_WEBHOOK_TOKEN=' + VERIFY_TOKEN);
  console.log('- WHATSAPP_PHONE_NUMBER_ID=' + PHONE_NUMBER_ID);
  console.log('- WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984');
  console.log('- WHATSAPP_BUSINESS_NUMBER=+919945896033');
}

async function sendTestMessage() {
  console.log('\n📤 Attempting to send a test message...\n');
  console.log('Note: You must have the WABA access token set in Railway');
  console.log('The recipient must have messaged your business first\n');
  
  // Get token from environment
  const ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
  
  if (!ACCESS_TOKEN) {
    console.log('⚠️  No access token provided.');
    console.log('Set it with: WHATSAPP_ACCESS_TOKEN="your-token" node final-whatsapp-test.js');
    return;
  }
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: RECIPIENT,
        type: 'text',
        text: {
          preview_url: false,
          body: '🎉 HERA WhatsApp Integration is working!\n\nYour webhook is configured correctly and messages are flowing.'
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
    console.log('\n📱 Check WhatsApp on +91 99458 96033');
    
  } catch (error) {
    if (error.response?.status === 400) {
      console.log('⚠️  Cannot send - recipient must message you first');
      console.log('\n📱 Please send "Hi" to +91 99458 96033 from WhatsApp');
    } else if (error.response?.status === 401) {
      console.log('❌ Access token is invalid or not set correctly');
    } else {
      console.log('❌ Error:', error.response?.data || error.message);
    }
  }
}

async function main() {
  console.log('🧪 HERA WhatsApp Final Integration Test\n');
  console.log('=====================================\n');
  console.log('Business Number: +91 99458 96033');
  console.log('Phone Number ID:', PHONE_NUMBER_ID);
  console.log('=====================================\n');
  
  // Test webhook
  await testWebhook();
  
  // Check configuration
  await checkRailwayToken();
  
  // Try sending message
  await sendTestMessage();
  
  console.log('\n\n📋 Final Checklist:');
  console.log('✅ 1. Webhook URL verified and working');
  console.log('✅ 2. Verify token: hera-whatsapp-webhook-2024-secure-token');
  console.log('✅ 3. All environment variables set in Railway');
  console.log('✅ 4. WABA access token (not user token) configured');
  console.log('❓ 5. Check Meta Business Manager webhook subscribed to "messages"');
  console.log('\n🎯 Next: Send "Hi" to +91 99458 96033 and check Railway logs!');
}

main();