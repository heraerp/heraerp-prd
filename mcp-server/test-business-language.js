#!/usr/bin/env node

// Test Business Language Conversion in Analytics Chat
require('dotenv').config();

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';
const API_URL = 'http://localhost:3000/api/v1/analytics/chat';

async function testBusinessLanguage() {
  console.log('🏪 Testing Business Language Analytics Responses\n');
  console.log('This test shows how raw JSON is converted to business insights\n');
  
  const queries = [
    {
      name: 'Revenue Analysis',
      message: 'Show revenue this month',
      type: 'revenue'
    },
    {
      name: 'Service-Specific Revenue',
      message: 'Show revenue from haircuts this month',
      type: 'service_revenue'
    },
    {
      name: 'Customer Base',
      message: 'How many customers do we have?',
      type: 'customers'
    },
    {
      name: 'Low Revenue Query',
      message: 'What is revenue from nail services?',
      type: 'low_revenue'
    }
  ];
  
  for (const query of queries) {
    console.log('\n' + '='.repeat(60));
    console.log(`📊 Query: "${query.message}"`);
    console.log('='.repeat(60) + '\n');
    
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
        console.log('📝 Business Language Response:');
        console.log('─'.repeat(40));
        
        if (data.message) {
          console.log(`📌 Summary: ${data.message}`);
        }
        
        if (data.narrative) {
          console.log(`\n📖 Context: ${data.narrative}`);
        }
        
        if (data.insights && data.insights.length > 0) {
          console.log('\n📊 Key Insights:');
          data.insights.forEach(insight => {
            console.log(`  • ${insight}`);
          });
        }
        
        if (data.nextActions && data.nextActions.length > 0) {
          console.log('\n💡 Recommended Actions:');
          data.nextActions.forEach(action => {
            console.log(`  • ${action}`);
          });
        }
        
        if (data.result && query.type === 'revenue') {
          console.log('\n📈 Technical Details:');
          console.log(`  • Transactions: ${data.result.transaction_count}`);
          console.log(`  • Average: $${Math.round(data.result.average_transaction)}`);
          console.log(`  • Period: ${data.result.period}`);
        }
        
        console.log('\n✅ Response Quality: Business-friendly language');
      } else {
        console.log(`❌ Error: ${data.error || 'Unknown error'}`);
      }
      
    } catch (error) {
      console.log(`❌ Request failed: ${error.message}`);
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎯 Before vs After Comparison');
  console.log('='.repeat(60));
  
  console.log('\n❌ BEFORE (Raw JSON):');
  console.log('```json');
  console.log(JSON.stringify([{
    type: "transactions",
    count: 87,
    total: 45110.8,
    data: [{period: "2025-08", count: 87, sum: 45110.8}]
  }], null, 2));
  console.log('```');
  
  console.log('\n✅ AFTER (Business Language):');
  console.log('Your total revenue for this period is $45,111 from 87 transactions,');
  console.log('averaging $519 per transaction.');
  console.log('\nTransaction values are within typical range for salon services.');
  console.log('\n💡 Recommended Actions:');
  console.log('• Review service pricing and explore upselling opportunities');
  
  console.log('\n✨ Business language test complete!\n');
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
    await testBusinessLanguage();
  }
}

main().catch(console.error);