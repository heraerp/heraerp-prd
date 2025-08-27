const axios = require('axios');

async function checkWebhookSubscription() {
  const WABA_ID = '1112225330318984';
  const ACCESS_TOKEN = 'EAAkj2JA2DYEBPVCWwxDhAzOYdS04C8e5f4Kg25LegHCzFfvGW0IbFfsmP4aPEOl5vuBm1twNptDVbkZBSnz78xPs7BaCqkP4LR52hvCohJY7rXRZCGrZBndYAuscszhhbTAKHJPKvtnOFKazAHetTsMxofXZCneaZA9o2x1AyEeWeJinS4kFXR4szbBtW8M9EEdbcbUUEIw1wTnJYF9dbzx7y3b5zzcXgxFTGaquOIQZDZD';
  
  console.log('🔍 Checking WhatsApp webhook configuration...\n');
  
  try {
    // Check subscribed fields for the WABA
    const response = await axios.get(
      `https://graph.facebook.com/v18.0/${WABA_ID}/subscribed_apps`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    
    console.log('✅ Webhook subscription status:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.data && response.data.data.length > 0) {
      console.log('\n✅ Webhook is properly subscribed!');
      console.log('Subscribed fields:', response.data.data[0].subscribed_fields);
      
      // Check if 'messages' field is subscribed
      if (response.data.data[0].subscribed_fields.includes('messages')) {
        console.log('✅ "messages" field is subscribed - you will receive WhatsApp messages');
      } else {
        console.log('❌ "messages" field is NOT subscribed - you need to enable it in Meta Business Manager');
      }
    } else {
      console.log('\n❌ No webhook subscription found!');
      console.log('\nTo fix this:');
      console.log('1. Go to Meta Business Manager');
      console.log('2. Navigate to WhatsApp Manager → Configuration');
      console.log('3. Click on "Configure webhooks"');
      console.log('4. Make sure "messages" field is selected');
      console.log('5. Save the configuration');
    }
    
  } catch (error) {
    console.error('❌ Error checking webhook:', error.response?.data || error.message);
  }
}

// Send a simple template message (works without 24-hour window)
async function sendTemplateMessage() {
  const PHONE_NUMBER_ID = '712631301940690';
  const ACCESS_TOKEN = 'EAAkj2JA2DYEBPVCWwxDhAzOYdS04C8e5f4Kg25LegHCzFfvGW0IbFfsmP4aPEOl5vuBm1twNptDVbkZBSnz78xPs7BaCqkP4LR52hvCohJY7rXRZCGrZBndYAuscszhhbTAKHJPKvtnOFKazAHetTsMxofXZCneaZA9o2x1AyEeWeJinS4kFXR4szbBtW8M9EEdbcbUUEIw1wTnJYF9dbzx7y3b5zzcXgxFTGaquOIQZDZD';
  
  console.log('\n📤 Attempting to send a message...\n');
  
  try {
    // First, let's check available templates
    const templatesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${WABA_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`
        }
      }
    );
    
    console.log('Available message templates:');
    templatesResponse.data.data?.forEach(template => {
      console.log(`- ${template.name} (${template.status})`);
    });
    
    // Try sending a basic text message to yourself
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: '919945896033',
        type: 'text',
        text: {
          preview_url: false,
          body: 'Hello! This is a test message from HERA WhatsApp Integration. Your webhook is configured correctly!'
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Message sent successfully!');
    console.log('Message ID:', response.data.messages[0].id);
    
  } catch (error) {
    if (error.response?.data?.error?.message?.includes('re-engagement message')) {
      console.log('\n⚠️  Cannot send message - the recipient needs to message you first!');
      console.log('\n📱 Please send a WhatsApp message to +91 99458 96033 saying "Hi"');
      console.log('Then run this test again.');
    } else {
      console.error('\n❌ Error:', error.response?.data || error.message);
    }
  }
}

async function main() {
  console.log('🧪 WhatsApp Integration Diagnostic\n');
  console.log('Business Number: +91 99458 96033');
  console.log('WABA ID: 1112225330318984');
  console.log('================================\n');
  
  await checkWebhookSubscription();
  await sendTemplateMessage();
  
  console.log('\n\n📱 Next Steps:');
  console.log('1. Send a WhatsApp message to +91 99458 96033');
  console.log('2. Check Railway logs: railway logs');
  console.log('3. Monitor the dashboard: https://heraerp.com/salon/whatsapp');
}

main();