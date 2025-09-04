/**
 * Quick WhatsApp API Test - Direct to Meta API
 */

const phoneNumberId = '712631301940690';
const accessToken = 'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD';

async function quickTest() {
  console.log('🚀 Quick WhatsApp Test\n');
  
  // Test 1: Verify Phone Number
  console.log('1️⃣ Verifying Phone Number ID...');
  try {
    const phoneResponse = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    );
    
    const phoneData = await phoneResponse.json();
    
    if (!phoneData.error) {
      console.log('✅ Phone Number Valid!');
      console.log('   Display:', phoneData.display_phone_number);
      console.log('   Name:', phoneData.verified_name);
      console.log('   ID:', phoneData.id);
    } else {
      console.log('❌ Error:', phoneData.error.message);
    }
  } catch (e) {
    console.log('❌ Network error:', e.message);
  }
  
  // Test 2: Send Message
  console.log('\n2️⃣ Sending test message...');
  console.log('   To: +919945896033 (your number)');
  
  try {
    const response = await fetch(
      `https://graph.facebook.com/v20.0/${phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: '919945896033',
          type: 'text',
          text: {
            preview_url: false,
            body: '✅ HERA WhatsApp Integration Working!\n\nYour salon management system is ready to send messages.\n\nTest successful! 🚀'
          }
        })
      }
    );
    
    const data = await response.json();
    
    if (data.messages) {
      console.log('✅ Message sent successfully!');
      console.log('   Message ID:', data.messages[0].id);
      console.log('\n🎉 WhatsApp API is working!');
      console.log('\nYou can now:');
      console.log('1. Visit http://localhost:3002/test-whatsapp-api');
      console.log('2. Click any test button');
      console.log('3. Messages will be sent via WhatsApp');
    } else if (data.error) {
      console.log('❌ Send error:', data.error.message);
      
      if (data.error.code === 131031) {
        console.log('\n📝 The recipient number is not on WhatsApp');
      } else if (data.error.error_subcode === 131030) {
        console.log('\n📝 Recipient needs to message you first');
        console.log('   OR use a pre-approved template message');
      } else if (data.error.code === 100) {
        console.log('\n📝 Check if the number is correct and has WhatsApp');
      }
    }
    
    console.log('\nFull response:', JSON.stringify(data, null, 2));
    
  } catch (e) {
    console.log('❌ Network error:', e.message);
  }
  
  console.log('\n📋 Summary:');
  console.log('===========');
  console.log('Phone Number ID:', phoneNumberId);
  console.log('Your WhatsApp:', '+919945896033');
  console.log('Test Page: http://localhost:3002/test-whatsapp-api');
  console.log('Salon App: http://localhost:3002/salon/whatsapp');
}

quickTest();