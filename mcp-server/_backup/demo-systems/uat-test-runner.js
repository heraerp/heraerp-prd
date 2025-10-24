#!/usr/bin/env node
/**
 * HERA MCP UAT Test Runner
 * Demonstrates comprehensive business scenario testing
 */

require('dotenv').config();

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// MCP Server URL
const MCP_URL = process.env.MCP_API_URL || 'http://localhost:3001';
const ORGANIZATION_ID = process.env.DEFAULT_ORGANIZATION_ID;

// Test scenarios
const UAT_SCENARIOS = {
  'salon-complete-visit': {
    name: 'Complete Salon Visit',
    description: 'Customer books appointment, receives service, purchases products',
    steps: [
      {
        name: 'Create customer profile',
        command: 'create a new customer named Sarah Johnson with phone 555-1234',
        validate: (result) => result.result && result.result.id
      },
      {
        name: 'Book appointment',
        command: 'book Sarah Johnson for a haircut tomorrow at 2pm with stylist Maria',
        validate: (result) => result.result && result.result.status === 'booked'
      },
      {
        name: 'Check in customer',
        command: 'check in Sarah Johnson for her appointment',
        validate: (result) => result.success
      },
      {
        name: 'Complete service and sell products',
        command: 'create a sale for 1 haircut and 2 shampoo bottles for Sarah Johnson, pay with card ending in 1234',
        validate: (result) => result.result && result.result.transaction
      },
      {
        name: 'Generate daily report',
        command: 'show today sales summary',
        validate: (result) => result.result && result.result.totalRevenue >= 0
      }
    ]
  },
  
  'restaurant-dinner-service': {
    name: 'Restaurant Dinner Service',
    description: 'Table service with multiple courses and payment',
    steps: [
      {
        name: 'Create table order',
        command: 'create order for table 5: 2 caesar salads, 2 steaks, 1 wine bottle',
        validate: (result) => result.result && result.result.transaction
      },
      {
        name: 'Add desserts to order',
        command: 'add 2 chocolate cakes to table 5 order',
        validate: (result) => result.success
      },
      {
        name: 'Process payment with tip',
        command: 'process payment for table 5 total $150 plus 20% tip, split between 2 cards',
        validate: (result) => result.result && result.result.payment
      },
      {
        name: 'Check inventory impact',
        command: 'show inventory report for food items',
        validate: (result) => result.result
      }
    ]
  },
  
  'retail-return-exchange': {
    name: 'Retail Return and Exchange',
    description: 'Customer returns item and exchanges for different size',
    steps: [
      {
        name: 'Original purchase',
        command: 'create sale: 1 blue shirt size M for $49.99, customer Jane Doe paying cash',
        validate: (result) => result.result && result.result.transaction
      },
      {
        name: 'Process return',
        command: 'return blue shirt size M from previous transaction, customer wants size L',
        validate: (result) => result.success
      },
      {
        name: 'Exchange for new size',
        command: 'exchange returned shirt for blue shirt size L, no price difference',
        validate: (result) => result.result && result.result.transaction
      },
      {
        name: 'Update inventory',
        command: 'check inventory levels for blue shirts all sizes',
        validate: (result) => result.result
      }
    ]
  },
  
  'appointment-rescheduling': {
    name: 'Appointment Rescheduling Flow',
    description: 'Customer needs to reschedule appointment',
    steps: [
      {
        name: 'Original booking',
        command: 'book John Smith for dental cleaning next Monday at 10am',
        validate: (result) => result.result && result.result.id
      },
      {
        name: 'Check availability',
        command: 'show available appointment slots for next week',
        validate: (result) => result.result
      },
      {
        name: 'Reschedule appointment',
        command: 'reschedule John Smith appointment to next Wednesday at 2pm',
        validate: (result) => result.success
      },
      {
        name: 'Send confirmation',
        command: 'send appointment confirmation to John Smith',
        validate: (result) => result.success
      }
    ]
  },
  
  'inventory-management': {
    name: 'Inventory Management Workflow',
    description: 'Stock receipt, adjustment, and transfer',
    steps: [
      {
        name: 'Receive new stock',
        command: 'add 100 units of hair conditioner to inventory',
        validate: (result) => result.success
      },
      {
        name: 'Damage adjustment',
        command: 'adjust inventory for damaged goods: 5 broken hair dryers',
        validate: (result) => result.success
      },
      {
        name: 'Transfer between locations',
        command: 'transfer 20 hair conditioners from main store to downtown location',
        validate: (result) => result.success
      },
      {
        name: 'Low stock alert',
        command: 'show inventory report for products below reorder point',
        validate: (result) => result.result
      },
      {
        name: 'Generate purchase order',
        command: 'create purchase order for low stock items',
        validate: (result) => result.success
      }
    ]
  }
};

// Test runner class
class UATTestRunner {
  constructor() {
    this.results = [];
    this.startTime = Date.now();
  }
  
  async runAllScenarios() {
    console.log(`${colors.bright}${colors.cyan}🧪 HERA MCP UAT Test Runner${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}\n`);
    console.log(`MCP Server: ${colors.yellow}${MCP_URL}${colors.reset}`);
    console.log(`Organization: ${colors.yellow}${ORGANIZATION_ID}${colors.reset}\n`);
    
    for (const [key, scenario] of Object.entries(UAT_SCENARIOS)) {
      await this.runScenario(key, scenario);
      console.log(''); // Empty line between scenarios
    }
    
    this.printSummary();
  }
  
  async runScenario(key, scenario) {
    console.log(`${colors.bright}${colors.blue}📋 Scenario: ${scenario.name}${colors.reset}`);
    console.log(`${colors.blue}   ${scenario.description}${colors.reset}`);
    console.log(`${colors.blue}   ────────────────────────────────────────────────────────────────────────────${colors.reset}`);
    
    const scenarioResult = {
      key,
      name: scenario.name,
      steps: [],
      success: true,
      duration: 0
    };
    
    const scenarioStart = Date.now();
    
    for (let i = 0; i < scenario.steps.length; i++) {
      const step = scenario.steps[i];
      const stepResult = await this.runStep(step, i + 1);
      scenarioResult.steps.push(stepResult);
      
      if (!stepResult.success) {
        scenarioResult.success = false;
        break;
      }
      
      // Small delay between steps
      await this.delay(500);
    }
    
    scenarioResult.duration = Date.now() - scenarioStart;
    this.results.push(scenarioResult);
    
    if (scenarioResult.success) {
      console.log(`${colors.green}   ✅ Scenario completed successfully in ${scenarioResult.duration}ms${colors.reset}`);
    } else {
      console.log(`${colors.red}   ❌ Scenario failed${colors.reset}`);
    }
  }
  
  async runStep(step, stepNumber) {
    process.stdout.write(`   ${stepNumber}. ${step.name}... `);
    
    const stepStart = Date.now();
    const result = {
      name: step.name,
      command: step.command,
      success: false,
      duration: 0,
      response: null,
      error: null
    };
    
    try {
      // Call MCP server
      const response = await fetch(`${MCP_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: step.command,
          organizationId: ORGANIZATION_ID
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      result.response = data;
      
      // Validate result
      if (step.validate) {
        result.success = step.validate(data);
      } else {
        result.success = data.success;
      }
      
      result.duration = Date.now() - stepStart;
      
      if (result.success) {
        console.log(`${colors.green}✓${colors.reset} (${result.duration}ms)`);
      } else {
        console.log(`${colors.red}✗${colors.reset} (validation failed)`);
        console.log(`${colors.red}      Response: ${JSON.stringify(data, null, 2)}${colors.reset}`);
      }
      
    } catch (error) {
      result.error = error.message;
      result.duration = Date.now() - stepStart;
      console.log(`${colors.red}✗${colors.reset} (${error.message})`);
    }
    
    return result;
  }
  
  printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter(r => r.success).length;
    const totalCount = this.results.length;
    const successRate = (successCount / totalCount * 100).toFixed(1);
    
    console.log(`\n${colors.bright}${colors.cyan}📊 Test Summary${colors.reset}`);
    console.log(`${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    console.log(`Total Scenarios: ${colors.yellow}${totalCount}${colors.reset}`);
    console.log(`Passed: ${colors.green}${successCount}${colors.reset}`);
    console.log(`Failed: ${colors.red}${totalCount - successCount}${colors.reset}`);
    console.log(`Success Rate: ${successRate >= 80 ? colors.green : colors.red}${successRate}%${colors.reset}`);
    console.log(`Total Duration: ${colors.yellow}${(totalDuration / 1000).toFixed(2)}s${colors.reset}`);
    
    console.log(`\n${colors.bright}Scenario Results:${colors.reset}`);
    this.results.forEach(result => {
      const icon = result.success ? `${colors.green}✅` : `${colors.red}❌`;
      const duration = `${colors.yellow}${(result.duration / 1000).toFixed(2)}s${colors.reset}`;
      console.log(`  ${icon} ${result.name} - ${duration}`);
      
      if (!result.success) {
        const failedStep = result.steps.find(s => !s.success);
        if (failedStep) {
          console.log(`     ${colors.red}Failed at: ${failedStep.name}${colors.reset}`);
          if (failedStep.error) {
            console.log(`     ${colors.red}Error: ${failedStep.error}${colors.reset}`);
          }
        }
      }
    });
    
    console.log(`\n${colors.cyan}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${colors.reset}`);
    
    if (successRate === '100.0') {
      console.log(`${colors.bright}${colors.green}🎉 All tests passed! HERA MCP is ready for production UAT.${colors.reset}`);
    } else if (successRate >= 80) {
      console.log(`${colors.bright}${colors.yellow}⚠️  Most tests passed, but some scenarios need attention.${colors.reset}`);
    } else {
      console.log(`${colors.bright}${colors.red}❌ Significant issues detected. MCP server needs improvements.${colors.reset}`);
    }
  }
  
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
async function main() {
  if (!ORGANIZATION_ID) {
    console.error(`${colors.red}ERROR: DEFAULT_ORGANIZATION_ID not set in environment${colors.reset}`);
    process.exit(1);
  }
  
  // Check MCP server health
  try {
    const health = await fetch(`${MCP_URL}/health`);
    if (!health.ok) {
      throw new Error('MCP server not responding');
    }
  } catch (error) {
    console.error(`${colors.red}ERROR: Cannot connect to MCP server at ${MCP_URL}${colors.reset}`);
    console.error(`${colors.red}Make sure the MCP server is running: node hera-mcp-server-api.js${colors.reset}`);
    process.exit(1);
  }
  
  const runner = new UATTestRunner();
  await runner.runAllScenarios();
}

// Run tests
main().catch(error => {
  console.error(`${colors.red}Fatal error: ${error.message}${colors.reset}`);
  process.exit(1);
});