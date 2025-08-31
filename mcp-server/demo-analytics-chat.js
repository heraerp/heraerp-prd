#!/usr/bin/env node

// Demo script for Analytics Chat API
// Shows how natural language queries are processed

const fetch = require('node-fetch');

const API_URL = 'http://localhost:3000/api/v1/analytics/chat';
const ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

// Demo queries to test
const demoQueries = [
  {
    title: '📊 Revenue Analysis',
    queries: [
      'Show revenue this month',
      'Why did sales spike last week?',
      'Compare revenue by service type'
    ]
  },
  {
    title: '👥 Customer Analytics',
    queries: [
      'Find top customers by total spend',
      'Show VIP customer distribution',
      'Which customers haven\'t visited in 30 days?'
    ]
  },
  {
    title: '📈 Performance Metrics',
    queries: [
      'Calculate average transaction value',
      'Show busiest days of the week',
      'What\'s our customer retention rate?'
    ]
  },
  {
    title: '💰 Financial Analysis',
    queries: [
      'Post inventory adjustment for $500',
      'Show expense breakdown by category',
      'Calculate profit margins by service'
    ]
  },
  {
    title: '🚨 Guardrail Tests',
    queries: [
      'Query without organization', // Should fail
      'Use invalid smart code XYZ', // Should suggest valid codes
      'Create unbalanced GL entry', // Should reject
      'Query custom_table', // Should reject - only 6 tables
    ]
  }
];

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

async function testQuery(query) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: query,
        organizationId: ORG_ID,
        useAnalyticsBrain: true
      })
    });
    
    const data = await response.json();
    return data;
  } catch (error) {
    return { error: error.message };
  }
}

async function runDemo() {
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║      HERA Analytics Chat API Demo            ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}\n`);
  
  console.log(`API Endpoint: ${API_URL}`);
  console.log(`Organization: ${ORG_ID}\n`);
  
  // Check if Next.js is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health');
    if (!healthCheck.ok) {
      console.log(`${colors.red}⚠️  Next.js server not running!${colors.reset}`);
      console.log(`Run: ${colors.yellow}npm run dev${colors.reset} in the main directory\n`);
      return;
    }
  } catch (error) {
    console.log(`${colors.red}⚠️  Cannot connect to localhost:3000${colors.reset}`);
    console.log(`Make sure Next.js is running with: ${colors.yellow}npm run dev${colors.reset}\n`);
    return;
  }
  
  // Run demo queries
  for (const section of demoQueries) {
    console.log(`\n${colors.blue}━━━ ${section.title} ━━━${colors.reset}\n`);
    
    for (const query of section.queries) {
      console.log(`${colors.magenta}Query:${colors.reset} "${query}"`);
      
      const startTime = Date.now();
      const result = await testQuery(query);
      const duration = Date.now() - startTime;
      
      if (result.error) {
        console.log(`${colors.red}Error:${colors.reset} ${result.error}`);
        if (result.guardrail) {
          console.log(`${colors.yellow}Guardrail:${colors.reset} ${result.guardrail}`);
        }
        if (result.details) {
          console.log(`${colors.yellow}Details:${colors.reset} ${result.details}`);
        }
      } else if (result.success) {
        console.log(`${colors.green}Response (${duration}ms):${colors.reset} ${result.message || 'Success'}`);
        
        if (result.result) {
          // Show summary of results
          if (result.result.data && Array.isArray(result.result.data)) {
            console.log(`  → Found ${result.result.data.length} results`);
          } else if (result.result.total_revenue !== undefined) {
            console.log(`  → Total: $${result.result.total_revenue.toLocaleString()}`);
          } else if (result.result.count !== undefined) {
            console.log(`  → Count: ${result.result.count}`);
          }
        }
        
        if (result.nextActions && result.nextActions.length > 0) {
          console.log(`${colors.cyan}Next Actions:${colors.reset}`);
          result.nextActions.forEach(action => {
            console.log(`  • ${action}`);
          });
        }
      } else {
        console.log(`${colors.yellow}Response:${colors.reset}`, JSON.stringify(result, null, 2));
      }
      
      console.log(''); // Empty line between queries
    }
  }
  
  console.log(`\n${colors.cyan}━━━ Demo Complete ━━━${colors.reset}\n`);
  
  // Instructions
  console.log(`${colors.green}Try the Analytics Chat UI:${colors.reset}`);
  console.log(`  http://localhost:3000/analytics-chat\n`);
  
  console.log(`${colors.green}Example queries to try:${colors.reset}`);
  console.log('  • "Why did revenue increase 42% last month?"');
  console.log('  • "Show top 10 customers by lifetime value"');
  console.log('  • "Post inventory write-off for damaged goods"');
  console.log('  • "Find correlations between weather and sales"\n');
}

// Run the demo
runDemo().catch(console.error);