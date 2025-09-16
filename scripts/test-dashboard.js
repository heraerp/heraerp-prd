#!/usr/bin/env node

const http = require('http');

console.log('🧪 Testing dashboard endpoint...\n');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/dashboard',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode === 200) {
      console.log('\n✅ Dashboard is accessible!');
      
      // Check for key components
      const checks = [
        { name: 'KPI Cards', pattern: /KpiCards|Key Performance Indicators/ },
        { name: 'Dashboard Title', pattern: /Salon Dashboard/ },
        { name: 'Organization Context', pattern: /organizationId/ }
      ];
      
      checks.forEach(check => {
        if (check.pattern.test(data)) {
          console.log(`✓ ${check.name} found`);
        } else {
          console.log(`✗ ${check.name} not found`);
        }
      });
    } else {
      console.log('\n❌ Dashboard returned error:', res.statusCode);
      console.log('Response:', data.substring(0, 500));
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request failed:', error);
});

req.end();