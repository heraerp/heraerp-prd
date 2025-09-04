require('dotenv').config({ path: '.env.local' });
require('dotenv').config();

async function testRealWhatsApp() {
  console.log('🔧 Testing Real WhatsApp Configuration...\n');

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '712631301940690';
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || '1112225330318984';

  console.log('📱 Configuration:');
  console.log(`- Phone Number ID: ${phoneNumberId}`);
  console.log(`- Business Account ID: ${businessAccountId}`);
  console.log(`- Business Number: ${process.env.WHATSAPP_BUSINESS_NUMBER}`);
  console.log(`- Access Token: ${accessToken ? 'Configured' : 'Missing'}`);

  if (!accessToken) {
    console.log('\n❌ Access token is missing!');
    return;
  }

  try {
    // Test 1: Get phone number details
    console.log('\n🔍 Fetching phone number details...');
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}?fields=display_phone_number,verified_name,quality_rating,platform_type`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const phoneData = await phoneResponse.json();
    
    if (phoneData.error) {
      console.log('❌ Error:', phoneData.error.message);
      if (phoneData.error.code === 190) {
        console.log('\n⚠️  Access token appears to be invalid or expired.');
        console.log('Please get a new token from Meta Business Manager:');
        console.log('1. Go to https://business.facebook.com/');
        console.log('2. Navigate to WhatsApp > API Setup');
        console.log('3. Generate a new permanent token');
      }
    } else {
      console.log('✅ Phone number verified!');
      console.log(JSON.stringify(phoneData, null, 2));
    }

    // Test 2: Get message templates
    console.log('\n📋 Fetching message templates...');
    const templatesResponse = await fetch(
      `https://graph.facebook.com/v20.0/${businessAccountId}/message_templates?limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );

    const templatesData = await templatesResponse.json();
    
    if (templatesData.data) {
      console.log(`✅ Found ${templatesData.data.length} templates`);
      templatesData.data.forEach(template => {
        console.log(`- ${template.name} (${template.status}) - ${template.language}`);
      });
    }

    // Test 3: Webhook readiness
    console.log('\n🔗 Webhook Setup Instructions:');
    console.log('1. Start ngrok: ngrok http 3000');
    console.log('2. Copy the HTTPS URL (e.g., https://abc123.ngrok.io)');
    console.log('3. In Meta Business Manager, set webhook URL to:');
    console.log('   https://abc123.ngrok.io/api/v1/whatsapp/webhook');
    console.log(`4. Set verify token to: ${process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN}`);
    console.log('5. Subscribe to: messages, message_status');

  } catch (error) {
    console.log('\n❌ Error:', error.message);
  }
}

testRealWhatsApp().catch(console.error);