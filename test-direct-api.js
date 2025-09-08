#!/usr/bin/env node

// Direct test of salon digital accountant
const http = require('http')

console.log('Testing direct API call...')

const data = JSON.stringify({
  message: 'Client paid 200 cash',
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
  },
  timeout: 5000 // 5 second timeout
}

const req = http.request(options, (res) => {
  console.log('Status:', res.statusCode)
  console.log('Headers:', res.headers)
  
  let body = ''
  
  res.on('data', (chunk) => {
    body += chunk
  })
  
  res.on('end', () => {
    console.log('Response body:', body)
    try {
      const response = JSON.parse(body)
      console.log('\nParsed response:', JSON.stringify(response, null, 2))
    } catch (e) {
      console.error('Failed to parse JSON:', e.message)
    }
  })
})

req.on('error', (error) => {
  console.error('Request error:', error.message)
})

req.on('timeout', () => {
  console.error('Request timed out!')
  req.destroy()
})

req.write(data)
req.end()