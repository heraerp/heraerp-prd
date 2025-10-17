#!/usr/bin/env node
/**
 * Quick WhatsApp Test Message
 */

const axios = require('axios')
require('dotenv').config({ path: '../.env.local' })

async function sendTestMessage() {
  console.log('📱 Sending WhatsApp Test Message...\n')
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  try {
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        to: '+919945896033', // Sending to your own number
        type: 'text',
        text: {
          body: `🎉 Congratulations! Your HERA WhatsApp integration is working!

This is a test message from your WhatsApp Business API setup.

✅ Phone Number ID: ${phoneNumberId}
✅ Business Number: +91 99458 96033
✅ Integration: Active

You can now:
• Receive customer messages
• Send automated responses
• Handle appointment bookings
• Send reminders

Next steps:
1. Configure webhook URL
2. Test customer flows
3. Enable automation`
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('✅ Test message sent successfully!')
    console.log(`Message ID: ${response.data.messages[0].id}`)
    console.log('\nCheck WhatsApp on +91 99458 96033')
    console.log('\n🎯 Your WhatsApp Business API is configured correctly!')
    
  } catch (error) {
    console.error('❌ Failed to send test message')
    
    if (error.response?.data) {
      console.error('\nError details:', error.response.data.error)
      
      if (error.response.data.error.code === 131030) {
        console.log('\n💡 This error means the recipient hasn\'t messaged your business first.')
        console.log('For testing, you need to:')
        console.log('1. Send a message from +91 99458 96033 to your WhatsApp Business number')
        console.log('2. Then run this test again')
      }
    } else {
      console.error(error.message)
    }
  }
}

sendTestMessage()