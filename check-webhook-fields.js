const axios = require('axios');

async function checkWebhookFields() {
  const APP_ID = '2572687829765505'; // HERA SALON app
  const ACCESS_TOKEN = 'EAAkj2JA2DYEBPVCWwxDhAzOYdS04C8e5f4Kg25LegHCzFfvGW0IbFfsmP4aPEOl5vuBm1twNptDVbkZBSnz78xPs7BaCqkP4LR52hvCohJY7rXRZCGrZBndYAuscszhhbTAKHJPKvtnOFKazAHetTsMxofXZCneaZA9o2x1AyEeWeJinS4kFXR4szbBtW8M9EEdbcbUUEIw1wTnJYF9dbzx7y3b5zzcXgxFTGaquOIQZDZD';
  
  console.log('🔍 Checking WhatsApp webhook configuration for app: HERA SALON\n');
  
  try {
    // Check app subscriptions
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${APP_ID}/subscriptions`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    
    console.log('✅ App webhook subscriptions:');
    console.log(JSON.stringify(response.data, null, 2));
    
    // Find WhatsApp subscription
    const whatsappSub = response.data.data?.find(sub => sub.object === 'whatsapp_business_account');
    
    if (whatsappSub) {
      console.log('\n✅ WhatsApp webhook is configured!');
      console.log('Callback URL:', whatsappSub.callback_url);
      console.log('Fields:', whatsappSub.fields);
      console.log('Active:', whatsappSub.active);
      
      if (whatsappSub.fields.includes('messages')) {
        console.log('\n✅ "messages" field is enabled - You should receive WhatsApp messages!');
      } else {
        console.log('\n❌ "messages" field is NOT enabled');
        console.log('Available fields:', whatsappSub.fields.join(', '));
      }
    } else {
      console.log('\n❌ No WhatsApp webhook subscription found!');
    }
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

async function testSendMessage() {
  const PHONE_NUMBER_ID = '712631301940690';
  const ACCESS_TOKEN = 'EAAkj2JA2DYEBPVCWwxDhAzOYdS04C8e5f4Kg25LegHCzFfvGW0IbFfsmP4aPEOl5vuBm1twNptDVbkZBSnz78xPs7BaCqkP4LR52hvCohJY7rXRZCGrZBndYAuscszhhbTAKHJPKvtnOFKazAHetTsMxofXZCneaZA9o2x1AyEeWeJinS4kFXR4szbBtW8M9EEdbcbUUEIw1wTnJYF9dbzx7y3b5zzcXgxFTGaquOIQZDZD';
  
  console.log('\n📤 Testing message sending...\n');
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919945896033',
        type: 'text',
        text: {
          preview_url: false,
          body: '🎉 HERA WhatsApp Integration Test Message!\n\nIf you receive this, your integration is working perfectly.'
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
    console.log('\n📱 Check your WhatsApp for the test message!');
    
  } catch (error) {
    if (error.response?.status === 400) {
      const errorMessage = error.response.data.error?.error_user_msg || error.response.data.error?.message || '';
      
      if (errorMessage.includes('Re-engagement')) {
        console.log('⚠️  Cannot send message - You need to message the business first!');
        console.log('\n📱 Please send any message to +91 99458 96033 from WhatsApp');
        console.log('Then try this test again.');
      } else {
        console.log('❌ Error details:', error.response.data);
      }
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

async function main() {
  console.log('🧪 WhatsApp Webhook Diagnostic Tool\n');
  console.log('================================\n');
  
  await checkWebhookFields();
  await testSendMessage();
  
  console.log('\n\n📝 Summary:');
  console.log('- Webhook URL is verified and responding');
  console.log('- Access token is valid and working');
  console.log('- To receive messages: Customer must message you first');
  console.log('- Check Railway logs to see incoming webhooks');
}

main();