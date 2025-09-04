/**
 * WhatsApp Business API Setup Test V2
 * Updated approach to get Phone Number ID
 */

const accessToken = 'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD';

async function getWhatsAppInfo() {
  console.log('🔍 Getting WhatsApp Business Information...\n');
  
  try {
    // Method 1: Try getting user's WhatsApp Business Accounts directly
    console.log('📱 Method 1: Checking user WhatsApp Business Accounts...');
    const userWABAUrl = 'https://graph.facebook.com/v18.0/me/accounts';
    
    const accountsResponse = await fetch(userWABAUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const accountsData = await accountsResponse.json();
    
    if (accountsData.data) {
      console.log('Found accounts:', accountsData.data.length);
      
      // For each account, check if it has WhatsApp
      for (const account of accountsData.data) {
        console.log(`\nChecking account: ${account.name} (${account.id})`);
        
        // Try to get WhatsApp Business Account
        const wabaUrl = `https://graph.facebook.com/v18.0/${account.id}/whatsapp_business_accounts`;
        const wabaResponse = await fetch(wabaUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`
          }
        });
        
        const wabaData = await wabaResponse.json();
        if (!wabaData.error && wabaData.data) {
          console.log('  ✅ Has WhatsApp Business Account!');
          // Get details...
        }
      }
    }
    
    // Method 2: Try the debug_whatsapp_business_api_verbose endpoint
    console.log('\n📱 Method 2: Using debug endpoint...');
    const debugUrl = 'https://graph.facebook.com/v18.0/debug_whatsapp_business_api_verbose';
    
    const debugResponse = await fetch(debugUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const debugData = await debugResponse.json();
    console.log('Debug response:', JSON.stringify(debugData, null, 2));
    
    // Method 3: Try direct WABA ID if you have it
    console.log('\n📱 Method 3: Direct approach (requires WABA ID)...');
    console.log('\n🔧 Manual Setup Instructions:');
    console.log('1. Go to: https://business.facebook.com/settings/whatsapp-business-accounts');
    console.log('2. Find your WhatsApp Business Account');
    console.log('3. Click on it to see the WhatsApp Business Account ID');
    console.log('4. Then go to the "Phone Numbers" tab');
    console.log('5. You\'ll see your Phone Number ID there');
    console.log('\n📝 Example values to add to .env:');
    console.log('WHATSAPP_BUSINESS_ACCOUNT_ID=123456789012345  # From step 3');
    console.log('WHATSAPP_PHONE_NUMBER_ID=123456789012345      # From step 5');
    console.log('\n🌐 Alternative: Use WhatsApp Business API Portal');
    console.log('1. Go to: https://developers.facebook.com/apps/');
    console.log('2. Select your app (ID: 2572687829765505)');
    console.log('3. Go to WhatsApp > Getting Started');
    console.log('4. You\'ll see test phone number and Phone Number ID');
    console.log('5. For production, add your own number under "Phone Numbers"');
    
    // Try to decode the token to get more info
    console.log('\n🔍 Token Information:');
    const tokenParts = accessToken.split('.');
    if (tokenParts.length >= 2) {
      try {
        const payload = JSON.parse(Buffer.from(tokenParts[1], 'base64').toString());
        console.log('Token payload:', JSON.stringify(payload, null, 2));
      } catch (e) {
        console.log('Could not decode token');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    
    console.log('\n💡 Quick Test with Meta\'s Test Number:');
    console.log('If you want to test immediately, Meta provides a test number:');
    console.log('\n1. Go to: https://developers.facebook.com/apps/2572687829765505/whatsapp-business/wa-dev-console');
    console.log('2. You\'ll see:');
    console.log('   - Test phone number (usually like +1 555 xxx xxxx)');
    console.log('   - Phone number ID (a long number)');
    console.log('3. You can send test messages to up to 5 phone numbers you add there');
    console.log('\n⚠️  Note: Test numbers can only send to pre-registered recipients');
  }
}

// Test with a known Phone Number ID
async function testWithPhoneNumberId(phoneNumberId) {
  console.log(`\n📤 Testing with Phone Number ID: ${phoneNumberId}`);
  
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: '971501234567', // Test number without +
    type: 'text',
    text: {
      preview_url: false,
      body: 'Hello from HERA WhatsApp Integration! 🚀'
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
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (data.messages) {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', data.messages[0].id);
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Run the setup
getWhatsAppInfo().then(() => {
  // If you have a Phone Number ID, uncomment and test:
  // testWithPhoneNumberId('YOUR_PHONE_NUMBER_ID_HERE');
});