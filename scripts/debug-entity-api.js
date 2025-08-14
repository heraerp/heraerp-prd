// Debug the Entity API to see what's happening
async function debugEntityAPI() {
  const baseUrl = 'http://localhost:3002'
  
  console.log('🔍 Debugging HERA Entity API...\n')

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

    // Step 2: Test Entity Creation with detailed error reporting
    console.log('\n2️⃣ Testing Entity Creation with debug...')
    const createResponse = await fetch(`${baseUrl}/api/v1/entities`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_type: 'customer',
        entity_name: 'Debug Test Customer',
        entity_code: 'DEBUG001',
        status: 'active'
      })
    })

    console.log(`Response Status: ${createResponse.status}`)
    console.log(`Response Status Text: ${createResponse.statusText}`)
    
    const responseText = await createResponse.text()
    console.log('Raw Response:', responseText)
    
    if (responseText) {
      try {
        const responseData = JSON.parse(responseText)
        console.log('Parsed Response:', JSON.stringify(responseData, null, 2))
      } catch (e) {
        console.log('Failed to parse response as JSON')
      }
    }

  } catch (error) {
    console.error('❌ Debug failed:', error.message)
  }
}

if (require.main === module) {
  debugEntityAPI()
}