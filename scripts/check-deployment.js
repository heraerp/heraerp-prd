#!/usr/bin/env node

/**
 * Check HERA deployment status
 * Usage: node scripts/check-deployment.js [url]
 */

const https = require('https');
const http = require('http');

const deploymentUrl = process.argv[2] || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

console.log('🔍 Checking HERA deployment status...');
console.log(`📍 URL: ${deploymentUrl}`);
console.log('');

// Function to make HTTP request
function checkEndpoint(url, name) {
  return new Promise((resolve) => {
    const protocol = url.startsWith('https') ? https : http;
    
    const startTime = Date.now();
    
    protocol.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        const success = res.statusCode >= 200 && res.statusCode < 400;
        
        resolve({
          name,
          url,
          status: res.statusCode,
          success,
          responseTime,
          data: data.length > 500 ? data.substring(0, 500) + '...' : data
        });
      });
    }).on('error', (err) => {
      resolve({
        name,
        url,
        status: 0,
        success: false,
        error: err.message,
        responseTime: Date.now() - startTime
      });
    });
  });
}

// Check multiple endpoints
async function checkDeployment() {
  const endpoints = [
    { name: 'Health Check', path: '/api/health' },
    { name: 'Home Page', path: '/' },
    { name: 'Universal API', path: '/api/v1/universal?action=schema' },
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    const url = deploymentUrl + endpoint.path;
    console.log(`Checking ${endpoint.name}...`);
    const result = await checkEndpoint(url, endpoint.name);
    results.push(result);
    
    if (result.success) {
      console.log(`✅ ${endpoint.name}: ${result.status} (${result.responseTime}ms)`);
      
      // Parse health check data if available
      if (endpoint.name === 'Health Check' && result.data) {
        try {
          const health = JSON.parse(result.data);
          console.log(`   Status: ${health.status}`);
          console.log(`   Version: ${health.version}`);
          console.log(`   Environment: ${health.environment}`);
          if (health.checks) {
            console.log('   Checks:');
            Object.entries(health.checks).forEach(([key, value]) => {
              const icon = value === 'ok' ? '✅' : value === 'warning' ? '⚠️' : '❌';
              console.log(`     ${icon} ${key}: ${value}`);
            });
          }
        } catch (e) {
          // Not JSON, ignore
        }
      }
    } else {
      console.log(`❌ ${endpoint.name}: ${result.error || `HTTP ${result.status}`}`);
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary:');
  console.log('===========');
  
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const avgResponseTime = Math.round(
    results.reduce((sum, r) => sum + r.responseTime, 0) / results.length
  );
  
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⏱️  Avg Response Time: ${avgResponseTime}ms`);
  
  if (failed === 0) {
    console.log('');
    console.log('🎉 Deployment is healthy!');
    process.exit(0);
  } else {
    console.log('');
    console.log('⚠️  Deployment has issues. Check the failed endpoints above.');
    process.exit(1);
  }
}

// Run the check
checkDeployment().catch(err => {
  console.error('❌ Error checking deployment:', err.message);
  process.exit(1);
});