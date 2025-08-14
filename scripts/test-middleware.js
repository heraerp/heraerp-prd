// Test if middleware is working
async function testMiddleware() {
  const baseUrl = 'http://localhost:3002'
  
  console.log('🔍 Testing Middleware Functionality...\n')

  try {
    // Step 1: Login to get authentication token
    console.log('1️⃣ Getting authentication token...')
    const loginResponse = await fetch(`${baseUrl}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mario@restaurant.com',
        password: 'demo123'
      })
    })

    const loginData = await loginResponse.json()
    const token = loginData.token
    console.log('✅ Token obtained')

    // Step 2: Test a protected API route to see if middleware runs
    console.log('\n2️⃣ Testing protected API route...')
    const testResponse = await fetch(`${baseUrl}/api/v1/entities?entity_type=customer`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Response Status: ${testResponse.status}`)
    console.log(`Response Status Text: ${testResponse.statusText}`)
    
    const responseText = await testResponse.text()
    console.log('Raw Response:', responseText)
    
    if (responseText) {
      try {
        const responseData = JSON.parse(responseText)
        console.log('Parsed Response:', JSON.stringify(responseData, null, 2))
      } catch (e) {
        console.log('Failed to parse response as JSON')
      }
    }

    // Step 3: Test universal API endpoint
    console.log('\n3️⃣ Testing Universal API endpoint...')
    const universalResponse = await fetch(`${baseUrl}/api/v1/universal?action=read&table=core_entities&organization_id=${loginData.user.organization_id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    })

    console.log(`Universal API Status: ${universalResponse.status}`)
    if (universalResponse.ok) {
      const universalData = await universalResponse.json()
      console.log(`Universal API Success: ${universalData.success}`)
      console.log(`Universal API Count: ${universalData.count || 0}`)
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

if (require.main === module) {
  testMiddleware()
}