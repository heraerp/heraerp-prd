const axios = require('axios');

async function testAPI() {
  try {
    console.log('📡 Testing WhatsApp Messages API...\n');
    
    // First check if server is running
    try {
      await axios.get('http://localhost:3000', { timeout: 2000 });
      console.log('✅ Dev server is running\n');
    } catch (err) {
      console.log('⚠️  Dev server might not be running, continuing anyway...\n');
    }
    
    // Test the simple API
    console.log('Testing /api/v1/whatsapp/messages-simple...');
    const response = await axios.get('http://localhost:3000/api/v1/whatsapp/messages-simple');
    
    if (response.data.status === 'success') {
      const { data } = response.data;
      console.log('✅ API Response:');
      console.log(`- Total Conversations: ${data.totalConversations}`);
      console.log(`- Total Messages: ${data.totalMessages}`);
      
      if (data.allMessages.length > 0) {
        console.log('\n📱 Recent Messages:');
        data.allMessages.slice(0, 5).forEach((msg, i) => {
          console.log(`\n${i + 1}. ${msg.direction.toUpperCase()} - ${msg.phone}`);
          console.log(`   Text: ${msg.text}`);
          console.log(`   Time: ${new Date(msg.created_at).toLocaleString()}`);
        });
      }
      
      if (data.conversationsWithMessages.length > 0) {
        console.log('\n💬 Conversations:');
        data.conversationsWithMessages.forEach(conv => {
          console.log(`- ${conv.conversation.entity_name}: ${conv.messageCount} messages`);
        });
      }
    }
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.error('❌ Error: Dev server is not running!');
      console.error('Please start with: npm run dev');
    } else {
      console.error('❌ Error:', error.response?.data || error.message);
    }
  }
}

testAPI();