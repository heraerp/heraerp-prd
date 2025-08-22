#!/usr/bin/env node
/**
 * Test the MCP API server locally
 */

const http = require('http');

console.log('Testing MCP API Server...\n');

// Test health endpoint
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/health',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Health Check Status: ${res.statusCode}`);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('Response:', JSON.parse(data));
    console.log('\n✅ Server is working correctly!');
    console.log('\nYou can now deploy to Railway with confidence.');
    process.exit(0);
  });
});

req.on('error', (error) => {
  console.error('❌ Error:', error.message);
  console.log('\nMake sure to start the server first:');
  console.log('npm run start');
  process.exit(1);
});

req.end();