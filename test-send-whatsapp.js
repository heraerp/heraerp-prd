/**
 * Quick WhatsApp Message Test
 * Update the PHONE_NUMBER_ID below and run this script
 */

const accessToken = 'EAAkj2JA2DYEBPYc6SZBr6H7NcjeWGvhRrif4tNHaux6l5GWuvpGkcwYdcnMlLIvZAfppuaGuJx17ZCqtGOZCJ8tr5hDQwja85ZBLrIpZCz1ZBEjDWAt2puJd7Sw1EAp3SUkcJ6VZAH8cVLy9br8HlrdDXyRP7YfYEZCvn8vEU5f0EbIX7HUtSust4QZAquWQjeBwZDZD';

// UPDATE THIS WITH YOUR PHONE NUMBER ID
const PHONE_NUMBER_ID = '712631301940690'; // Your actual Phone Number ID

// Test recipient number (must be added in Meta console for test numbers)
const TEST_RECIPIENT = '+919945896033'; // Your WhatsApp Business Number

async function sendTestMessage() {
  console.log('📤 Sending test message...\n');
  
  if (PHONE_NUMBER_ID === 'YOUR_PHONE_NUMBER_ID_HERE') {
    console.error('❌ Please update PHONE_NUMBER_ID in this script first!');
    console.log('\n📝 To get your Phone Number ID:');
    console.log('1. Go to: https://developers.facebook.com/apps/2572687829765505/whatsapp-business/wa-dev-console');
    console.log('2. Copy the Phone Number ID');
    console.log('3. Update this script');
    console.log('4. Run again');
    return;
  }
  
  const url = `https://graph.facebook.com/v18.0/${PHONE_NUMBER_ID}/messages`;
  
  const payload = {
    messaging_product: 'whatsapp',
    to: TEST_RECIPIENT.replace(/[^0-9]/g, ''), // Remove + and spaces
    type: 'text',
    text: {
      preview_url: false,
      body: '🚀 Hello from HERA WhatsApp Integration!\n\nThis is a test message from your salon management system.'
    }
  };
  
  console.log('Sending to:', TEST_RECIPIENT);
  console.log('Phone Number ID:', PHONE_NUMBER_ID);
  
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
      console.error('❌ Error:', data.error.message);
      
      if (data.error.code === 190) {
        console.log('\n📝 Token might be expired. Generate a new one.');
      } else if (data.error.code === 100) {
        console.log('\n📝 Invalid Phone Number ID. Double-check the ID.');
      } else if (data.error.error_subcode === 2388079) {
        console.log('\n📝 The recipient needs to message you first or accept messages.');
        console.log('For testing, make sure the number is added as a test recipient.');
      }
    } else if (data.messages) {
      console.log('✅ Message sent successfully!');
      console.log('Message ID:', data.messages[0].id);
      console.log('\n🎉 WhatsApp integration is working!');
      console.log('\nNext steps:');
      console.log('1. Update your .env file with:');
      console.log(`   WHATSAPP_PHONE_NUMBER_ID=${PHONE_NUMBER_ID}`);
      console.log('2. Restart your Next.js server');
      console.log('3. Visit http://localhost:3002/test-whatsapp-api');
    }
    
    console.log('\nFull response:', JSON.stringify(data, null, 2));
    
  } catch (error) {
    console.error('❌ Network error:', error.message);
  }
}

sendTestMessage();