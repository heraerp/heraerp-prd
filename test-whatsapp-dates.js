const axios = require('axios');

async function testDates() {
  try {
    console.log('🕐 Testing WhatsApp Message Dates...\n');
    
    // Test the API
    const response = await axios.get('http://localhost:3000/api/v1/whatsapp/messages-simple');
    
    if (response.data.status === 'success') {
      const { allMessages } = response.data.data;
      
      if (allMessages.length > 0) {
        console.log('📱 Messages with proper dates:');
        allMessages.forEach((msg, i) => {
          console.log(`\n${i + 1}. ${msg.direction.toUpperCase()}`);
          console.log(`   Text: ${msg.text}`);
          console.log(`   Phone: ${msg.phone}`);
          console.log(`   Customer: ${msg.customerName}`);
          console.log(`   WhatsApp ID: ${msg.waba_message_id}`);
          console.log(`   Created At: ${msg.created_at}`);
          console.log(`   Occurred At: ${msg.occurred_at}`);
          
          // Check if dates are valid
          const date = new Date(msg.occurred_at);
          if (isNaN(date.getTime())) {
            console.log('   ❌ INVALID DATE!');
          } else {
            console.log(`   ✅ Valid Date: ${date.toLocaleString()}`);
          }
        });
      } else {
        console.log('No messages found');
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.response?.data || error.message);
  }
}

testDates();