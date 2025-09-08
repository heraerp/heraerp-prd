// Test salon digital accountant chat API
const testSalonChat = async () => {
  const baseUrl = 'http://localhost:3001'
  const organizationId = 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258' // Hair Talkz Salon
  
  const testMessages = [
    'Maya paid 450 for coloring and treatment',
    'Bought hair color for 250',
    'Pay Sarah 40% commission on 2000',
    'Show me today\'s total sales'
  ]
  
  console.log('Testing Salon Digital Accountant API...\n')
  
  // First check if server is running
  try {
    const healthResponse = await fetch(`${baseUrl}/`)
    console.log('Server health check:', healthResponse.status)
  } catch (e) {
    console.log('Server not responding on port 3001')
    console.log('Make sure the dev server is running: npm run dev')
    return
  }
  
  for (const message of testMessages) {
    console.log(`\n🗣️  User: "${message}"`)
    
    try {
      const response = await fetch(`${baseUrl}/api/v1/digital-accountant/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message,
          organizationId,
          context: {
            mode: 'salon',
            businessType: 'salon',
            simplifiedMode: true
          }
        })
      })
      
      if (!response.ok) {
        console.log(`❌ HTTP Error: ${response.status} ${response.statusText}`)
        const text = await response.text()
        console.log('Response:', text.substring(0, 200))
        continue
      }
      
      const data = await response.json()
      
      if (data.success) {
        console.log(`✅ Success:`)
        console.log(`   Type: ${data.type || 'unknown'}`)
        console.log(`   Message: ${data.message?.split('\n')[0]}...`)
        if (data.amount) console.log(`   Amount: AED ${data.amount}`)
        if (data.vat_amount) console.log(`   VAT: AED ${data.vat_amount}`)
      } else {
        console.log(`❌ Failed: ${data.error || data.message}`)
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`)
      console.log('Stack:', error.stack)
    }
  }
}

// Run the test
testSalonChat()