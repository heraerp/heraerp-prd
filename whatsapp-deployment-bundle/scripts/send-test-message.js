#!/usr/bin/env node
/**
 * Send Test WhatsApp Message
 * Tests your WhatsApp Business API configuration
 */

const axios = require('axios');

// Configuration
const config = {
  phoneNumberId: '712631301940690',
  accessToken: process.env.WHATSAPP_ACCESS_TOKEN || 'YOUR_ACCESS_TOKEN',
  recipientPhone: process.argv[2] || '919945896033',
  apiUrl: 'https://graph.facebook.com/v18.0'
};

async function sendTestMessage() {
  console.log('📱 WhatsApp Test Message Sender');
  console.log('===============================\n');
  
  if (config.accessToken === 'YOUR_ACCESS_TOKEN') {
    console.error('❌ Please set your WhatsApp access token');
    console.log('   Export it: export WHATSAPP_ACCESS_TOKEN="your-token"');
    console.log('   Or edit this file and replace YOUR_ACCESS_TOKEN');
    process.exit(1);
  }
  
  console.log(`Sending to: +${config.recipientPhone}`);
  console.log(`Using Phone Number ID: ${config.phoneNumberId}\n`);
  
  try {
    // Test 1: Send hello_world template
    console.log('1️⃣ Sending hello_world template...');
    
    const templateResponse = await axios.post(
      `${config.apiUrl}/${config.phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: config.recipientPhone,
        type: 'template',
        template: {
          name: 'hello_world',
          language: {
            code: 'en_US'
          }
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('✅ Template message sent successfully!');
    console.log(`   Message ID: ${templateResponse.data.messages[0].id}\n`);
    
    // Test 2: Try to send a text message (will fail if no 24hr window)
    console.log('2️⃣ Attempting text message...');
    
    try {
      const textResponse = await axios.post(
        `${config.apiUrl}/${config.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: config.recipientPhone,
          type: 'text',
          text: {
            body: '🎉 Your HERA WhatsApp integration is working!\n\nThis is a test message from your deployed application.'
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${config.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log('✅ Text message sent successfully!');
      console.log(`   Message ID: ${textResponse.data.messages[0].id}`);
      
    } catch (textError) {
      if (textError.response?.data?.error?.code === 131047) {
        console.log('⚠️  Text message failed - Outside 24hr window');
        console.log('   This is expected. User must message you first.');
      } else {
        console.log('❌ Text message failed:', textError.response?.data?.error?.message);
      }
    }
    
    console.log('\n✅ WhatsApp API is configured correctly!');
    console.log('\nNext steps:');
    console.log('1. Check WhatsApp on the recipient phone');
    console.log('2. Reply to establish 24hr window');
    console.log('3. Test your webhook by sending messages');
    
  } catch (error) {
    console.error('\n❌ Failed to send message');
    
    if (error.response?.data) {
      const err = error.response.data.error;
      console.error(`\nError Code: ${err.code}`);
      console.error(`Message: ${err.message}`);
      
      // Common error explanations
      if (err.code === 100) {
        console.log('\n💡 This usually means:');
        console.log('   - Invalid phone number format');
        console.log('   - Wrong Phone Number ID');
        console.log('   - Template not approved');
      } else if (err.code === 190) {
        console.log('\n💡 Access token issue:');
        console.log('   - Token may be invalid or expired');
        console.log('   - Generate new token in Meta App Dashboard');
      }
    } else {
      console.error(error.message);
    }
    
    process.exit(1);
  }
}

// Usage instructions
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log('Usage: node send-test-message.js [recipient_phone]');
  console.log('');
  console.log('Examples:');
  console.log('  node send-test-message.js               # Sends to +919945896033');
  console.log('  node send-test-message.js 919876543210  # Sends to +919876543210');
  console.log('');
  console.log('Environment:');
  console.log('  WHATSAPP_ACCESS_TOKEN    Your WhatsApp access token');
  process.exit(0);
}

// Run the test
sendTestMessage();