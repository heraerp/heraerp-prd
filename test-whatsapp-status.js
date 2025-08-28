const axios = require('axios')

// Configuration
const API_BASE_URL = 'http://localhost:3000/api/v1/whatsapp'
const TEST_MESSAGE_ID = 'wamid.HBgMOTcxNTU2MTM4MjkVAgASGCA3NkI4RDMyRkY5MUQ0MjI4MDYwQzc2RTY3MkZFQzg1MAA='

async function testStatusUpdate() {
  console.log('Testing WhatsApp Status Update Webhook...\n')
  
  // Test webhook payload simulating WhatsApp status update
  const statusUpdatePayload = {
    entry: [{
      id: 'ENTRY_ID',
      changes: [{
        value: {
          messaging_product: 'whatsapp',
          metadata: {
            display_phone_number: '1555123456',
            phone_number_id: 'PHONE_NUMBER_ID'
          },
          statuses: [
            {
              id: TEST_MESSAGE_ID,
              status: 'delivered',
              timestamp: Math.floor(Date.now() / 1000).toString(),
              recipient_id: '971551234567'
            }
          ]
        },
        field: 'messages'
      }]
    }]
  }
  
  try {
    // Send status update
    console.log('1. Sending DELIVERED status update...')
    const deliveredResponse = await axios.post(`${API_BASE_URL}/webhook`, statusUpdatePayload, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('✅ Delivered status response:', deliveredResponse.status)
    
    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Send READ status update
    console.log('\n2. Sending READ status update...')
    statusUpdatePayload.entry[0].changes[0].value.statuses[0].status = 'read'
    statusUpdatePayload.entry[0].changes[0].value.statuses[0].timestamp = Math.floor(Date.now() / 1000).toString()
    
    const readResponse = await axios.post(`${API_BASE_URL}/webhook`, statusUpdatePayload, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('✅ Read status response:', readResponse.status)
    
    // Test FAILED status
    console.log('\n3. Sending FAILED status update...')
    statusUpdatePayload.entry[0].changes[0].value.statuses[0].status = 'failed'
    statusUpdatePayload.entry[0].changes[0].value.statuses[0].timestamp = Math.floor(Date.now() / 1000).toString()
    statusUpdatePayload.entry[0].changes[0].value.statuses[0].errors = [{
      code: 131053,
      title: 'Message expired',
      message: 'Message failed to send because more than 24 hours have passed since the customer last replied to this number'
    }]
    
    const failedResponse = await axios.post(`${API_BASE_URL}/webhook`, statusUpdatePayload, {
      headers: { 'Content-Type': 'application/json' }
    })
    console.log('✅ Failed status response:', failedResponse.status)
    
    console.log('\n✨ All status updates sent successfully!')
    console.log('\nTo verify in the UI:')
    console.log('1. Open http://localhost:3000/enterprise/whatsapp')
    console.log('2. Select a conversation with outbound messages')
    console.log('3. Click on the status indicator of any outbound message')
    console.log('4. You should see the status history timeline')
    
  } catch (error) {
    console.error('❌ Error:', error.response ? error.response.data : error.message)
  }
}

// Run the test
testStatusUpdate()