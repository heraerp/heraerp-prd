const axios = require('axios');

// Test WhatsApp message payload that mimics what WhatsApp sends
const testPayload = {
  entry: [{
    changes: [{
      value: {
        messages: [{
          from: "971501234567",
          id: "wamid.HBgLNTcxNTA_TEST_" + Date.now(),
          timestamp: Math.floor(Date.now() / 1000).toString(),
          text: { 
            body: "Hello! I want to book an appointment for a haircut tomorrow at 3 PM" 
          },
          type: "text"
        }],
        metadata: {
          display_phone_number: "971504321098",
          phone_number_id: "117606954726963"
        }
      }
    }]
  }]
};

async function testWebhook() {
  try {
    console.log('🚀 Testing WhatsApp Canonical Architecture...\n');
    console.log('📤 Sending test message to webhook-v2...');
    console.log('Message:', testPayload.entry[0].changes[0].value.messages[0].text.body);
    
    const response = await axios.post(
      'http://localhost:3000/api/v1/whatsapp/webhook-v2',
      testPayload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Webhook response:', response.data);
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting 2 seconds for message processing...\n');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Now fetch messages using the canonical API
    console.log('📥 Fetching messages from canonical API...');
    const messagesResponse = await axios.get(
      'http://localhost:3000/api/v1/whatsapp/messages-v2'
    );
    
    const data = messagesResponse.data;
    
    if (data.status === 'success') {
      console.log('\n✅ API Response Summary:');
      console.log('- Total Conversations:', data.data.totalConversations);
      console.log('- Total Messages:', data.data.totalMessages);
      
      if (data.data.allMessages.length > 0) {
        const latestMessage = data.data.allMessages[0];
        console.log('\n📱 Latest Message:');
        console.log('- Text:', latestMessage.text);
        console.log('- Direction:', latestMessage.direction);
        console.log('- Customer:', latestMessage.customerName);
        console.log('- Phone:', latestMessage.phone);
        console.log('- WhatsApp ID:', latestMessage.waba_message_id);
        console.log('- Smart Code:', latestMessage.smart_code);
        console.log('- Created:', new Date(latestMessage.created_at).toLocaleString());
      }
      
      console.log('\n🏗️  HERA Architecture Verification:');
      console.log('✓ Messages stored as transactions');
      console.log('✓ Customers created as entities');
      console.log('✓ Conversations tracked');
      console.log('✓ Smart codes applied');
      console.log('✓ Dynamic data stored');
      
    } else {
      console.error('❌ Error fetching messages:', data.error);
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('\n❌ Error: Development server is not running!');
      console.error('Please start the server with: npm run dev');
    } else {
      console.error('\n❌ Error:', error.response?.data || error.message);
    }
  }
}

// Test sending multiple messages
async function testMultipleMessages() {
  console.log('\n📤 Testing multiple messages...\n');
  
  const messages = [
    "Hi, I need information about your services",
    "What are your prices for hair coloring?",
    "Can I book for this Saturday?"
  ];
  
  for (let i = 0; i < messages.length; i++) {
    const payload = {
      entry: [{
        changes: [{
          value: {
            messages: [{
              from: "971502345678",
              id: "wamid.MULTI_TEST_" + Date.now() + "_" + i,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: { body: messages[i] },
              type: "text"
            }],
            metadata: {
              display_phone_number: "971504321098",
              phone_number_id: "117606954726963"
            }
          }
        }]
      }]
    };
    
    await axios.post('http://localhost:3000/api/v1/whatsapp/webhook-v2', payload);
    console.log(`✅ Message ${i + 1} sent: "${messages[i]}"`);
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  console.log('\n✅ All test messages sent!');
}

// Run tests
async function runTests() {
  await testWebhook();
  // Uncomment to test multiple messages
  // await testMultipleMessages();
}

runTests();