#!/usr/bin/env node
/**
 * Send Simple WhatsApp Template
 */

const axios = require('axios')
require('dotenv').config({ path: '../.env.local' })

async function sendMessage() {
  const phoneNumberId = '712631301940690'
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN
  const recipient = '919945896033' // Without + or country code prefix
  
  console.log('📱 Sending WhatsApp Message...')
  console.log(`To: ${recipient}`)
  
  const data = {
    messaging_product: 'whatsapp',
    to: recipient,
    type: 'template',
    template: {
      name: 'hello_world',
      language: {
        code: 'en_US'
      }
    }
  }
  
  console.log('\nRequest data:', JSON.stringify(data, null, 2))
  
  try {
    const response = await axios({
      method: 'POST',
      url: `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      data: data
    })
    
    console.log('\n✅ Success!')
    console.log('Response:', response.data)
    
  } catch (error) {
    console.error('\n❌ Error:', error.response?.data || error.message)
  }
}

sendMessage()