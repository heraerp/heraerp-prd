#!/usr/bin/env node
/**
 * WhatsApp API Test - Debug Version
 */

const axios = require('axios')
require('dotenv').config({ path: '../.env.local' })

async function testAPI() {
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  
  console.log('🔍 WhatsApp API Debug Test\n')
  
  // Test 1: Get phone number details
  console.log('1️⃣ Testing Phone Number Details...')
  try {
    const phoneResponse = await axios.get(
      `https://graph.facebook.com/v18.0/${phoneNumberId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        },
        params: {
          fields: 'id,display_phone_number,verified_name'
        }
      }
    )
    
    console.log('✅ Phone details:', phoneResponse.data)
    
  } catch (error) {
    console.log('❌ Phone details error:', error.response?.data?.error?.message)
  }
  
  // Test 2: Try different message formats
  console.log('\n2️⃣ Testing Message Formats...\n')
  
  const messageVariations = [
    {
      name: 'With full number',
      to: '+919945896033'
    },
    {
      name: 'Without plus',
      to: '919945896033'
    },
    {
      name: 'Just number',
      to: '9945896033'
    }
  ]
  
  for (const variation of messageVariations) {
    console.log(`Testing: ${variation.name} (${variation.to})`)
    
    try {
      const response = await axios.post(
        `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: variation.to,
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
      
      console.log(`✅ SUCCESS with format: ${variation.to}`)
      console.log(`   Message ID: ${response.data.messages?.[0]?.id}`)
      console.log('\n🎉 Your WhatsApp integration is working!')
      console.log('\nNEXT STEPS:')
      console.log('1. Configure webhook URL in Meta Business Manager')
      console.log('2. Test receiving messages')
      console.log('3. Set up automation flows')
      
      break // Stop after first success
      
    } catch (error) {
      console.log(`❌ Failed with: ${variation.to}`)
      if (error.response?.data?.error?.error_user_msg) {
        console.log(`   User message: ${error.response.data.error.error_user_msg}`)
      }
    }
  }
  
  // Test 3: Check if it's a recipient issue
  console.log('\n3️⃣ Important Notes:')
  console.log('- Template messages can only be sent to numbers that have opted in')
  console.log('- For testing, the recipient should message your business first')
  console.log('- Or use the Test button in Meta Business Manager')
  
  console.log('\n📱 To complete testing:')
  console.log('1. Send a message from your phone to your WhatsApp Business number')
  console.log('2. Then try sending a response back')
  console.log('3. Or add test numbers in Meta Business Manager > WhatsApp > Phone numbers > Add test number')
}

testAPI()