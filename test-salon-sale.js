#!/usr/bin/env node

// Test salon sale integration
const http = require('http')

function testSalonSale() {
  console.log('Testing salon sale with Finance DNA...')
  
  const data = JSON.stringify({
    message: 'Maya paid 450 for coloring and treatment',
    organizationId: 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
    context: {
      mode: 'salon',
      businessType: 'salon',
      simplifiedMode: true
    }
  })
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/v1/digital-accountant/chat',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  }
  
  const req = http.request(options, (res) => {
    let body = ''
    
    res.on('data', (chunk) => {
      body += chunk
    })
    
    res.on('end', () => {
      try {
        const response = JSON.parse(body)
        console.log('\nResponse:', JSON.stringify(response, null, 2))
      } catch (e) {
        console.error('Failed to parse response:', body)
      }
    })
  })
  
  req.on('error', (error) => {
    console.error('Error:', error.message)
  })
  
  req.write(data)
  req.end()
}

testSalonSale()