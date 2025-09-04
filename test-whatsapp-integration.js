const { config } = require('dotenv');
config();

// Test WhatsApp configuration
async function testWhatsAppIntegration() {
  console.log('🔧 Testing WhatsApp Business API Integration...\n');

  // 1. Check environment variables
  console.log('📋 Environment Variables Check:');
  const requiredVars = [
    'WHATSAPP_PHONE_NUMBER_ID',
    'WHATSAPP_BUSINESS_ACCOUNT_ID',
    'WHATSAPP_ACCESS_TOKEN',
    'WHATSAPP_BUSINESS_NUMBER',
    'WHATSAPP_WEBHOOK_VERIFY_TOKEN'
  ];

  const missingVars = [];
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Configured`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      missingVars.push(varName);
    }
  });

  if (missingVars.length > 0) {
    console.log('\n⚠️  Missing environment variables:', missingVars.join(', '));
    return;
  }

  console.log('\n✨ All required environment variables are configured!');

  // 2. Test WhatsApp API connection
  console.log('\n📱 Testing WhatsApp API Connection...');
  
  try {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    
    // Get phone number details
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const data = await response.json();

    if (data.error) {
      console.log('❌ API Error:', data.error.message);
      console.log('\nPossible issues:');
      console.log('- Access token may be expired');
      console.log('- Phone number ID may be incorrect');
      console.log('- Permissions may be insufficient');
    } else {
      console.log('✅ Successfully connected to WhatsApp API!');
      console.log('\nPhone Number Details:');
      console.log(`- Display Phone Number: ${data.display_phone_number || 'N/A'}`);
      console.log(`- Verified Name: ${data.verified_name || 'N/A'}`);
      console.log(`- Quality Rating: ${data.quality_rating || 'N/A'}`);
      console.log(`- Platform Type: ${data.platform_type || 'N/A'}`);
    }

    // 3. Test sending a template message (optional)
    console.log('\n💬 Testing Message Capabilities...');
    
    // Check message templates
    const templatesResponse = await fetch(
      `https://graph.facebook.com/v20.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const templatesData = await templatesResponse.json();
    
    if (templatesData.data) {
      console.log(`✅ Found ${templatesData.data.length} message templates`);
      if (templatesData.data.length > 0) {
        console.log('\nAvailable Templates:');
        templatesData.data.slice(0, 3).forEach(template => {
          console.log(`- ${template.name} (${template.status})`);
        });
      }
    }

  } catch (error) {
    console.log('❌ Error testing WhatsApp API:', error.message);
  }

  // 4. Webhook status
  console.log('\n🔗 Webhook Configuration:');
  console.log(`- Webhook URL: https://your-domain.com/api/v1/whatsapp/webhook`);
  console.log(`- Verify Token: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}`);
  console.log(`- Business Number: ${process.env.WHATSAPP_BUSINESS_NUMBER}`);

  console.log('\n📝 Next Steps:');
  console.log('1. Configure webhook URL in Meta Business Manager');
  console.log('2. Use ngrok for local testing: ngrok http 3000');
  console.log('3. Subscribe to webhook fields: messages, message_status');
  console.log('4. Send a test message to your business number');
  console.log('5. Check application logs for incoming webhooks');
}

// Run the test
testWhatsAppIntegration().catch(console.error);