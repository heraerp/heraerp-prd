#!/usr/bin/env node
/**
 * Test with WhatsApp Template Message
 */

const axios = require('axios')
require('dotenv').config({ path: '../.env.local' })

async function sendTemplateMessage() {
  console.log('📱 Testing WhatsApp with Template Message...\n')
  
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const recipient = process.argv[2] || '+919945896033'
  
  console.log(`Sending to: ${recipient}`)
  console.log(`Phone Number ID: ${phoneNumberId}`)
  
  try {
    // First, let's check what templates are available
    console.log('\n1️⃣ Checking available message templates...')
    
    const templatesResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${process.env.WHATSAPP_BUSINESS_ACCOUNT_ID}/message_templates`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      }
    )
    
    console.log('\nAvailable templates:')
    templatesResponse.data.data.forEach(template => {
      console.log(`- ${template.name} (${template.status}) - ${template.language}`)
    })
    
    // Try sending with hello_world template (default template)
    console.log('\n2️⃣ Sending hello_world template message...')
    
    const response = await axios.post(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: recipient.replace(/\D/g, ''), // Remove all non-digits
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
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    )
    
    console.log('\n✅ Template message sent successfully!')
    console.log(`Message ID: ${response.data.messages[0].id}`)
    console.log(`\nCheck WhatsApp on ${recipient}`)
    
    console.log('\n📝 Note: For custom text messages, the recipient must message you first.')
    console.log('This is a WhatsApp policy to prevent spam.')
    
  } catch (error) {
    console.error('\n❌ Failed to send template message')
    
    if (error.response?.data) {
      console.error('\nError details:', JSON.stringify(error.response.data.error, null, 2))
      
      const errorCode = error.response.data.error.code
      const errorMessage = error.response.data.error.message
      
      console.log('\n💡 Troubleshooting:')
      
      if (errorCode === 100) {
        console.log('- Check that the phone number format is correct')
        console.log('- Make sure to use only digits (no + or spaces)')
        console.log('- Verify the template name exists')
      } else if (errorCode === 131026) {
        console.log('- The hello_world template might not be available')
        console.log('- Check available templates in Meta Business Manager')
      } else if (errorCode === 131030) {
        console.log('- The recipient hasn\'t opted in to receive messages')
        console.log('- They need to message your business first')
      }
      
      console.log('\n📌 Common fixes:')
      console.log('1. Go to Meta Business Manager > WhatsApp > Message Templates')
      console.log('2. Create or verify the hello_world template exists')
      console.log('3. Make sure the template is approved')
      console.log('4. Try with a phone number that has messaged you first')
    } else {
      console.error(error.message)
    }
  }
}

console.log('Usage: node test-template-message.js [recipient_phone_number]')
console.log('Example: node test-template-message.js +919876543210\n')

sendTemplateMessage()