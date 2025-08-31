#!/usr/bin/env node

// Manual testing for Analytics MCP tools
// Simulates the MCP server tool calls

require('dotenv').config();

// Import the analytics server to test tool implementations
const HeraAnalyticsMCPServer = require('./hera-analytics-mcp-server');

const TEST_ORG_ID = '550e8400-e29b-41d4-a716-446655440000';

// Create server instance
const server = new HeraAnalyticsMCPServer();

// Test scenarios
const testScenarios = [
  {
    name: '1. Search Smart Codes - Find refund codes',
    tool: 'search_smart_codes',
    args: {
      organization_id: TEST_ORG_ID,
      search_text: 'sale',
      industry: 'SALON'
    }
  },
  {
    name: '2. Validate Smart Code - Check version',
    tool: 'validate_smart_code',
    args: {
      organization_id: TEST_ORG_ID,
      smart_code: 'HERA.SALON.CLIENT.PROFILE.v1'
    }
  },
  {
    name: '3. Query Entities - Find VIP customers',
    tool: 'query_entities',
    args: {
      organization_id: TEST_ORG_ID,
      entity_type: 'customer',
      filters: {
        vip_status: true
      },
      select: ['entity_name', 'total_spend', 'loyalty_tier'],
      limit: 10
    }
  },
  {
    name: '4. Query Transactions - Revenue by week',
    tool: 'query_transactions',
    args: {
      organization_id: TEST_ORG_ID,
      transaction_type: 'sale',
      time: {
        start: '2025-08-01T00:00:00Z',
        end: '2025-08-31T23:59:59Z',
        grain: 'week'
      },
      group_by: ['time'],
      metrics: ['count', 'sum'],
      limit: 100
    }
  },
  {
    name: '5. Search Relationships - Customer purchases',
    tool: 'search_relationships',
    args: {
      organization_id: TEST_ORG_ID,
      from_entity_id: 'ec32a0d4-af26-4ffd-9ccb-149112a2e485', // A VIP client
      direction: 'outgoing',
      depth: 1
    }
  },
  {
    name: '6. Post Transaction - Inventory adjustment (balanced)',
    tool: 'post_transaction',
    args: {
      organization_id: TEST_ORG_ID,
      transaction_code: 'HERA.SALON.INVENTORY.ADJUSTMENT.v1',
      header: {
        transaction_date: new Date().toISOString(),
        description: 'Monthly inventory adjustment'
      },
      lines: [
        {
          line_number: 1,
          line_type: 'debit',
          line_amount: 250,
          smart_code: 'HERA.ACCOUNTING.GL.LINE.v1'
        },
        {
          line_number: 2,
          line_type: 'credit',
          line_amount: 250,
          smart_code: 'HERA.ACCOUNTING.GL.LINE.v1'
        }
      ]
    }
  },
  // Error cases
  {
    name: '7. ERROR: Missing organization_id',
    tool: 'query_entities',
    args: {
      entity_type: 'customer'
    },
    expectError: true
  },
  {
    name: '8. ERROR: Invalid smart code',
    tool: 'validate_smart_code',
    args: {
      organization_id: TEST_ORG_ID,
      smart_code: 'CUSTOM.INVALID.CODE'
    },
    expectError: false // Validation should return invalid, not error
  },
  {
    name: '9. ERROR: Unbalanced GL transaction',
    tool: 'post_transaction',
    args: {
      organization_id: TEST_ORG_ID,
      transaction_code: 'HERA.ACCOUNTING.GL.ADJUSTMENT.v1',
      lines: [
        {
          line_type: 'debit',
          line_amount: 1000,
          smart_code: 'HERA.ACCOUNTING.GL.LINE.v1'
        },
        {
          line_type: 'credit',
          line_amount: 800, // Unbalanced!
          smart_code: 'HERA.ACCOUNTING.GL.LINE.v1'
        }
      ]
    },
    expectError: true
  },
  {
    name: '10. ERROR: Relationship depth too high',
    tool: 'search_relationships',
    args: {
      organization_id: TEST_ORG_ID,
      from_entity_id: 'test-entity',
      depth: 5 // Max is 2
    },
    expectError: true
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

// Execute tool based on name
async function executeTool(toolName, args) {
  switch (toolName) {
    case 'search_smart_codes':
      return await server.searchSmartCodes(args);
    case 'validate_smart_code':
      return await server.validateSmartCode(args);
    case 'query_entities':
      return await server.queryEntities(args);
    case 'query_transactions':
      return await server.queryTransactions(args);
    case 'search_relationships':
      return await server.searchRelationships(args);
    case 'post_transaction':
      return await server.postTransaction(args);
    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}

// Run all test scenarios
async function runTests() {
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║    Analytics MCP Tool Testing Suite          ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════╝${colors.reset}\n`);
  
  for (const scenario of testScenarios) {
    console.log(`\n${colors.blue}━━━ ${scenario.name} ━━━${colors.reset}`);
    console.log(`Tool: ${colors.magenta}${scenario.tool}${colors.reset}`);
    console.log('Args:', JSON.stringify(scenario.args, null, 2));
    
    try {
      const startTime = Date.now();
      const result = await executeTool(scenario.tool, scenario.args);
      const duration = Date.now() - startTime;
      
      if (scenario.expectError) {
        console.log(`${colors.red}✗ Expected error but succeeded!${colors.reset}`);
      } else {
        console.log(`${colors.green}✓ Success (${duration}ms)${colors.reset}`);
      }
      
      // Display results based on tool type
      if (result) {
        if (result.data && Array.isArray(result.data)) {
          console.log(`Results: ${result.data.length} items`);
          if (result.data.length > 0) {
            console.log('Sample:', JSON.stringify(result.data[0], null, 2));
          }
        } else if (result.valid !== undefined) {
          console.log('Validation:', result.valid ? 
            `${colors.green}Valid${colors.reset}` : 
            `${colors.red}Invalid${colors.reset}`);
          if (result.suggested_code) {
            console.log(`Suggestion: Upgrade to ${result.suggested_code}`);
          }
        } else if (result.codes) {
          console.log(`Found ${result.found} codes:`);
          result.codes.forEach(code => {
            console.log(`  - ${code.code} (v${code.version})`);
          });
        } else {
          console.log('Result:', JSON.stringify(result, null, 2));
        }
      }
      
    } catch (error) {
      if (scenario.expectError) {
        console.log(`${colors.green}✓ Expected error caught${colors.reset}`);
        console.log(`Error: ${error.message}`);
        
        // Check guardrail identification
        const guardrail = server.identifyGuardrail(error.message);
        if (guardrail) {
          console.log(`Guardrail: ${colors.yellow}${guardrail}${colors.reset}`);
        }
        
        const correction = server.suggestCorrection(error.message);
        if (correction) {
          console.log(`Correction: ${correction}`);
        }
      } else {
        console.log(`${colors.red}✗ Unexpected error${colors.reset}`);
        console.log(`Error: ${error.message}`);
      }
    }
  }
  
  console.log(`\n${colors.cyan}━━━ Testing Complete ━━━${colors.reset}\n`);
}

// Run the tests
runTests().catch(console.error);