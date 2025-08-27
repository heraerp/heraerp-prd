#!/usr/bin/env node
/**
 * WhatsApp Webhook Testing Tool
 * Tests your webhook configuration and sends test messages
 */

const axios = require('axios')
const readline = require('readline')
require('dotenv').config({ path: '../.env.local' })

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = (query) => new Promise((resolve) => rl.question(query, resolve))

class WhatsAppWebhookTester {
  constructor() {
    this.whatsapp = {
      phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
      accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
      apiUrl: 'https://graph.facebook.com/v18.0'
    }
    
    this.webhookUrl = process.env.NEXT_PUBLIC_SITE_URL 
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/api/v1/whatsapp/webhook`
      : 'http://localhost:3000/api/v1/whatsapp/webhook'
  }
  
  async runTests() {
    console.log('🧪 WhatsApp Webhook Testing Tool')
    console.log('=' .repeat(50))
    
    try {
      // 1. Check environment
      console.log('\n1️⃣ Checking Environment Variables...')
      this.checkEnvironment()
      
      // 2. Test webhook verification
      console.log('\n2️⃣ Testing Webhook Verification...')
      await this.testWebhookVerification()
      
      // 3. Test API connection
      console.log('\n3️⃣ Testing WhatsApp API Connection...')
      await this.testAPIConnection()
      
      // 4. Send test message
      console.log('\n4️⃣ Sending Test Message...')
      await this.sendTestMessage()
      
      // 5. Simulate incoming webhook
      console.log('\n5️⃣ Simulating Incoming Webhook...')
      await this.simulateIncomingWebhook()
      
      console.log('\n✅ All tests completed!')
      
    } catch (error) {
      console.error('\n❌ Test failed:', error.message)
    } finally {
      rl.close()
    }
  }
  
  checkEnvironment() {
    const required = [
      'WHATSAPP_PHONE_NUMBER_ID',
      'WHATSAPP_ACCESS_TOKEN',
      'WHATSAPP_WEBHOOK_TOKEN'
    ]
    
    const missing = required.filter(key => !process.env[key])
    
    if (missing.length > 0) {
      throw new Error(`Missing environment variables: ${missing.join(', ')}`)
    }
    
    console.log('✅ All required environment variables found')
    console.log(`   Webhook URL: ${this.webhookUrl}`)
  }
  
  async testWebhookVerification() {
    try {
      // Simulate Meta's webhook verification
      const params = new URLSearchParams({
        'hub.mode': 'subscribe',
        'hub.verify_token': process.env.WHATSAPP_WEBHOOK_TOKEN,
        'hub.challenge': '123456789'
      })
      
      const response = await axios.get(`${this.webhookUrl}?${params}`)
      
      if (response.data === '123456789') {
        console.log('✅ Webhook verification successful')
      } else {
        console.log('❌ Webhook verification failed - incorrect response')
      }
      
    } catch (error) {
      if (error.response?.status === 403) {
        console.log('❌ Webhook verification failed - token mismatch')
      } else {
        console.log('❌ Webhook unreachable:', error.message)
        console.log('   Make sure your server is running!')
      }
    }
  }
  
  async testAPIConnection() {
    try {
      const response = await axios.get(
        `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}`,
        {
          headers: {
            'Authorization': `Bearer ${this.whatsapp.accessToken}`
          }
        }
      )
      
      console.log('✅ WhatsApp API connection successful')
      console.log(`   Phone: ${response.data.display_phone_number}`)
      console.log(`   Status: ${response.data.quality_rating || 'Active'}`)
      
    } catch (error) {
      console.log('❌ WhatsApp API connection failed')
      console.log('   Check your access token and phone number ID')
      throw new Error(error.response?.data?.error?.message || error.message)
    }
  }
  
  async sendTestMessage() {
    const sendTest = await question('Send a test message to yourself? (y/n): ')
    
    if (sendTest.toLowerCase() !== 'y') {
      console.log('Skipping test message')
      return
    }
    
    const phone = await question('Enter your WhatsApp number (with country code): ')
    
    try {
      const response = await axios.post(
        `${this.whatsapp.apiUrl}/${this.whatsapp.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          to: phone,
          type: 'template',
          template: {
            name: 'hello_world',
            language: { code: 'en_US' }
          }
        },
        {
          headers: {
            'Authorization': `Bearer ${this.whatsapp.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      
      console.log('✅ Test message sent successfully')
      console.log(`   Message ID: ${response.data.messages[0].id}`)
      console.log('   Check your WhatsApp!')
      
    } catch (error) {
      console.log('❌ Failed to send test message')
      console.log('   Error:', error.response?.data?.error?.message || error.message)
    }
  }
  
  async simulateIncomingWebhook() {
    console.log('\nSimulating customer message webhook...')
    
    const webhookPayload = {
      entry: [{
        id: 'ENTRY_ID',
        changes: [{
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: process.env.WHATSAPP_BUSINESS_NUMBER || '15550555555',
              phone_number_id: this.whatsapp.phoneNumberId
            },
            messages: [{
              from: '971501234567',
              id: `wamid.TEST_${Date.now()}`,
              timestamp: Math.floor(Date.now() / 1000).toString(),
              text: {
                body: 'Hi, I want to book an appointment'
              },
              type: 'text'
            }]
          }
        }]
      }]
    }
    
    try {
      const response = await axios.post(
        this.webhookUrl,
        webhookPayload,
        {
          headers: {
            'Content-Type': 'application/json',
            'X-Hub-Signature-256': 'test_signature' // In production, this would be validated
          }
        }
      )
      
      if (response.data.status === 'ok') {
        console.log('✅ Webhook processed successfully')
        console.log('   Check your server logs for processing details')
      } else {
        console.log('❌ Webhook processing failed')
      }
      
    } catch (error) {
      console.log('❌ Failed to simulate webhook:', error.message)
    }
  }
}

// Additional test utilities
async function testSpecificScenario() {
  console.log('\n📱 Test Specific Scenarios:')
  console.log('1. New customer booking')
  console.log('2. Existing customer quick book')
  console.log('3. Staff schedule check')
  console.log('4. Appointment reminder')
  console.log('5. Cancel appointment')
  
  const choice = await question('\nSelect scenario (1-5): ')
  
  const scenarios = {
    '1': {
      message: 'Hi, I want to book a haircut tomorrow at 3pm',
      from: '971501234567'
    },
    '2': {
      message: 'Book my usual with Emma',
      from: '971507654321'
    },
    '3': {
      message: 'Show my schedule',
      from: '971509999999'
    },
    '4': {
      message: 'reminder',
      type: 'status_update'
    },
    '5': {
      message: 'Cancel my appointment',
      from: '971501234567'
    }
  }
  
  const scenario = scenarios[choice]
  if (scenario) {
    console.log(`\nSimulating: ${scenario.message}`)
    // Would send the appropriate webhook payload
  }
}

// Main execution
async function main() {
  const tester = new WhatsAppWebhookTester()
  
  console.log('What would you like to test?')
  console.log('1. Run all tests')
  console.log('2. Test specific scenario')
  console.log('3. Check webhook logs')
  
  const choice = await question('\nSelect option (1-3): ')
  
  switch (choice) {
    case '1':
      await tester.runTests()
      break
    case '2':
      await testSpecificScenario()
      break
    case '3':
      console.log('\n📋 To check webhook logs:')
      console.log('1. Go to Meta App Dashboard')
      console.log('2. Navigate to WhatsApp > Webhooks')
      console.log('3. Click on "View Recent Events"')
      console.log('4. Check delivery status and payloads')
      break
    default:
      console.log('Invalid choice')
  }
  
  rl.close()
}

main()