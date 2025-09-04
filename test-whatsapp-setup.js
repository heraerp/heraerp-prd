/**
 * WhatsApp Business API Setup Test
 * This script helps you get your Phone Number ID and test the API
 */

const accessToken = 'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD';

async function getBusinessPhoneNumbers() {
  console.log('🔍 Fetching WhatsApp Business Phone Numbers...\n');
  
  try {
    // First, let's get the business account ID from the token
    const debugTokenUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    
    const debugResponse = await fetch(debugTokenUrl);
    const debugData = await debugResponse.json();
    
    if (debugData.error) {
      console.error('❌ Token validation error:', debugData.error.message);
      return;
    }
    
    console.log('✅ Token is valid!');
    console.log('App ID:', debugData.data.app_id);
    console.log('Type:', debugData.data.type);
    console.log('Expires:', new Date(debugData.data.expires_at * 1000).toLocaleString());
    console.log('Scopes:', debugData.data.scopes?.join(', '));
    
    // Try to get WhatsApp Business Account ID
    const appId = debugData.data.app_id;
    
    // Get WhatsApp Business Account
    const wabAccountUrl = `https://graph.facebook.com/v18.0/${appId}/whatsapp_business_accounts`;
    const wabResponse = await fetch(wabAccountUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const wabData = await wabResponse.json();
    
    if (wabData.error) {
      console.error('\n❌ Error fetching WhatsApp Business Accounts:', wabData.error.message);
      console.log('\n📝 To fix this:');
      console.log('1. Make sure your app has WhatsApp Business API access');
      console.log('2. Add WhatsApp product to your app in Meta Developer Console');
      console.log('3. Generate a new token with whatsapp_business_management permission');
      return;
    }
    
    if (!wabData.data || wabData.data.length === 0) {
      console.log('\n⚠️  No WhatsApp Business Accounts found.');
      console.log('\n📝 To set up WhatsApp Business:');
      console.log('1. Go to https://business.facebook.com/wa/manage/home/');
      console.log('2. Create a WhatsApp Business Account');
      console.log('3. Add a phone number');
      console.log('4. Verify the phone number');
      return;
    }
    
    console.log('\n📱 WhatsApp Business Accounts:');
    for (const account of wabData.data) {
      console.log(`\n  Account ID: ${account.id}`);
      console.log(`  Name: ${account.name || 'Unnamed'}`);
      
      // Get phone numbers for this account
      const phonesUrl = `https://graph.facebook.com/v18.0/${account.id}/phone_numbers`;
      const phonesResponse = await fetch(phonesUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      
      const phonesData = await phonesResponse.json();
      
      if (phonesData.data && phonesData.data.length > 0) {
        console.log('  Phone Numbers:');
        for (const phone of phonesData.data) {
          console.log(`    - ID: ${phone.id}`);
          console.log(`      Number: ${phone.display_phone_number}`);
          console.log(`      Verified: ${phone.verified_name || 'Not verified'}`);
          console.log(`      Quality: ${phone.quality_rating || 'N/A'}`);
        }
      } else {
        console.log('  No phone numbers registered');
      }
    }
    
    console.log('\n✅ Setup Instructions:');
    console.log('1. Copy the Phone Number ID from above');
    console.log('2. Update your .env file:');
    console.log('   WHATSAPP_PHONE_NUMBER_ID=<your-phone-id>');
    console.log('   WHATSAPP_BUSINESS_ACCOUNT_ID=<your-account-id>');
    console.log('\n3. Then you can send messages!');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📝 Common issues:');
    console.log('- Token expired: Generate a new token');
    console.log('- Network error: Check your internet connection');
    console.log('- API version: Try changing v18.0 to v17.0 or v19.0');
  }
}

// Test sending a message (only works after setting up phone number ID)
async function testSendMessage(phoneNumberId, toNumber, message) {
  console.log('\n📤 Testing message send...');
  
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: toNumber.replace(/[^0-9]/g, ''), // Remove any non-numeric characters
    type: 'text',
    text: {
      preview_url: false,
      body: message
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });
    
    const data = await response.json();
    
    if (data.error) {
      console.error('❌ Send error:', data.error.message);
      if (data.error.error_subcode === 2388079) {
        console.log('📝 This error means the recipient has not initiated conversation with your business');
        console.log('   They need to message you first, or you need to use a template message');
      }
    } else {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', data.messages[0].id);
    }
  } catch (error) {
    console.error('❌ Error sending message:', error.message);
  }
}

// Run the setup
getBusinessPhoneNumbers().then(() => {
  console.log('\n🎯 Next steps:');
  console.log('1. Update your .env with the Phone Number ID');
  console.log('2. Restart your Next.js server');
  console.log('3. Visit http://localhost:3002/test-whatsapp-api');
  console.log('4. Click "Check Config" to verify setup');
  console.log('5. Try sending a test message!');
  
  // Uncomment this to test sending after you have the phone number ID
  // testSendMessage('YOUR_PHONE_NUMBER_ID', '+971501234567', 'Hello from HERA!');
});