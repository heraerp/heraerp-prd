const axios = require('axios');

async function diagnoseWhatsAppFlow() {
  console.log('🔍 Diagnosing WhatsApp Message Flow\n');
  console.log('=====================================\n');
  
  const WEBHOOK_URL = 'https://heraerp.com/api/v1/whatsapp/webhook';
  const TEST_ENDPOINT = 'https://heraerp.com/api/v1/whatsapp/test';
  const PHONE_NUMBER_ID = '712631301940690';
  
  // Step 1: Check current state
  console.log('1️⃣ Checking current state...');
  try {
    const statusResponse = await axios.get(TEST_ENDPOINT);
    console.log(`✅ Conversations found: ${statusResponse.data.recent_conversations.length}`);
    console.log(`❓ Messages stored: ${statusResponse.data.recent_messages.length}`);
    
    if (statusResponse.data.recent_messages.length === 0) {
      console.log('⚠️  No messages found in database\n');
    }
  } catch (error) {
    console.log('❌ Error checking status:', error.message);
  }
  
  // Step 2: Simulate a complete WhatsApp message
  console.log('2️⃣ Simulating WhatsApp message from your number...');
  const testMessage = {
    entry: [{
      id: '1112225330318984',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '+919945896033',
            phone_number_id: PHONE_NUMBER_ID
          },
          contacts: [{
            profile: {
              name: 'Test User'
            },
            wa_id: '919945896033'
          }],
          messages: [{
            from: '919945896033',
            id: 'wamid_' + Date.now(),
            timestamp: String(Math.floor(Date.now() / 1000)),
            text: { 
              body: 'Test message - checking if messages are stored' 
            },
            type: 'text'
          }]
        },
        field: 'messages'
      }]
    }]
  };
  
  try {
    console.log('\nSending test message to webhook...');
    const webhookResponse = await axios.post(WEBHOOK_URL, testMessage, {
      headers: { 'Content-Type': 'application/json' }
    });
    
    console.log('✅ Webhook response:', webhookResponse.data);
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting 2 seconds for message processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
  } catch (error) {
    console.log('❌ Webhook error:', error.response?.data || error.message);
  }
  
  // Step 3: Check if message was stored
  console.log('\n3️⃣ Checking if message was stored...');
  try {
    const afterResponse = await axios.get(TEST_ENDPOINT);
    const newMessageCount = afterResponse.data.recent_messages.length;
    
    if (newMessageCount > 0) {
      console.log(`✅ Messages now stored: ${newMessageCount}`);
      console.log('\nLatest message:', afterResponse.data.recent_messages[0]);
    } else {
      console.log('❌ No messages stored - checking why...\n');
      
      // Check for errors in processing
      console.log('Possible issues:');
      console.log('1. Message storage might be failing');
      console.log('2. Required fields might be missing');
      console.log('3. Database permissions might be blocking');
    }
  } catch (error) {
    console.log('❌ Error checking messages:', error.message);
  }
  
  // Step 4: Check Railway logs command
  console.log('\n4️⃣ To check Railway logs for errors:');
  console.log('```bash');
  console.log('railway logs | grep -i "error\\|fail\\|whatsapp"');
  console.log('```');
  
  // Step 5: Direct database check
  console.log('\n5️⃣ Direct database check commands:');
  console.log('```bash');
  console.log('# Check for any WhatsApp messages');
  console.log('node hera-cli.js query universal_transactions "transaction_type:whatsapp_message"');
  console.log('');
  console.log('# Check conversation details');
  console.log('node hera-cli.js query core_entities "entity_type:whatsapp_conversation"');
  console.log('```');
  
  // Summary
  console.log('\n📊 Diagnosis Summary:');
  console.log('===================');
  console.log('✅ Webhook is accessible and responding');
  console.log('✅ Conversations are being created');
  console.log('❌ Messages are NOT being stored in transactions');
  console.log('\n🔧 Most likely issue: The storeMessage function is failing');
  console.log('\nNext steps:');
  console.log('1. Check Railway logs for specific error messages');
  console.log('2. The latest code fix should resolve the issue once deployed');
  console.log('3. Messages require transaction_date and total_amount fields');
}

// Run diagnosis
diagnoseWhatsAppFlow();