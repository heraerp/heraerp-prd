#!/usr/bin/env node

// Test service-specific filtering in Analytics Chat
require('dotenv').config();

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';
const API_URL = 'http://localhost:3000/api/v1/analytics/chat';

async function testServiceFiltering() {
  console.log('🧪 Testing Analytics Service Filtering\n');
  
  const queries = [
    {
      name: 'All revenue',
      message: 'Show revenue this month',
      expectedFilter: 'none'
    },
    {
      name: 'Haircut revenue',
      message: 'Show revenue from haircuts this month',
      expectedFilter: 'haircut'
    },
    {
      name: 'Color revenue',
      message: 'What is the revenue from hair coloring services?',
      expectedFilter: 'color'
    },
    {
      name: 'Treatment revenue',
      message: 'Calculate revenue from treatments',
      expectedFilter: 'treatment'
    }
  ];
  
  for (const query of queries) {
    console.log(`\n📊 Query: "${query.message}"`);
    console.log(`Expected filter: ${query.expectedFilter}`);
    
    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: query.message,
          organizationId: TEST_ORG_ID,
          useAnalyticsBrain: false // Use pattern-based for predictable testing
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        console.log(`✅ Success: ${data.message}`);
        
        if (data.result) {
          console.log(`   Service filter applied: ${data.result.service_filter || 'none'}`);
          console.log(`   Total revenue: $${data.result.total_revenue.toLocaleString()}`);
          console.log(`   Transaction count: ${data.result.transaction_count}`);
          
          if (data.result.breakdown) {
            console.log(`   Revenue breakdown by service:`);
            data.result.breakdown.forEach(service => {
              console.log(`     - ${service.service}: $${service.total.toLocaleString()} (${service.count} transactions)`);
            });
          }
        }
      } else {
        console.log(`❌ Error: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n✨ Service filtering test complete!\n');
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000/api/health', {
      method: 'GET'
    });
    if (!response.ok) {
      throw new Error('Server not responding');
    }
    return true;
  } catch (error) {
    console.log('⚠️  Please ensure the Next.js server is running on http://localhost:3000');
    console.log('   Run: npm run dev');
    return false;
  }
}

// Run tests
async function main() {
  const serverReady = await checkServer();
  if (serverReady) {
    await testServiceFiltering();
  }
}

main().catch(console.error);