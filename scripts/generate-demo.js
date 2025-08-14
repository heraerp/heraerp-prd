#!/usr/bin/env node

/**
 * HERA Demo Data Generator
 * 
 * Creates comprehensive demo data for any HERA module
 * Usage: npm run generate-demo --module=restaurant
 * 
 * "The best demos tell a story" - Steve Jobs
 */

const fs = require('fs')
const path = require('path')

// Get command line arguments
const args = process.argv.slice(2)
const getModule = () => args.find(arg => arg.startsWith('--module='))?.split('=')[1]

const moduleName = getModule()

if (!moduleName) {
  console.error('❌ Module name is required: --module=module_name')
  console.log('Example: npm run generate-demo --module=restaurant')
  process.exit(1)
}

console.log(`🎬 Generating Demo Data for: ${moduleName.toUpperCase()}`)
console.log('✨ "The best demos tell a story" - Steve Jobs')
console.log('')

// Demo data templates
const demoTemplates = {
  restaurant: {
    story: "Mario's Italian Restaurant - A family business embracing technology",
    entities: [
      // Menu Items
      {
        entity_type: 'restaurant_menu_item',
        entity_name: 'Margherita Pizza',
        entity_code: 'PIZZA-001',
        smart_code: 'HERA.REST.MNU.ENT.ITM.v1',
        properties: {
          category: 'Pizza',
          price: 18.99,
          cost: 6.50,
          prep_time: 15,
          description: 'Classic pizza with fresh mozzarella, tomatoes, and basil',
          allergens: ['gluten', 'dairy'],
          calories: 850,
          active: true
        }
      },
      {
        entity_type: 'restaurant_menu_item',
        entity_name: 'Chicken Parmigiana',
        entity_code: 'CHICKEN-001',
        smart_code: 'HERA.REST.MNU.ENT.ITM.v1',
        properties: {
          category: 'Main Course',
          price: 24.99,
          cost: 9.25,
          prep_time: 25,
          description: 'Breaded chicken breast with marinara sauce and mozzarella',
          allergens: ['gluten', 'dairy'],
          calories: 1200,
          active: true
        }
      },
      {
        entity_type: 'restaurant_menu_item',
        entity_name: 'Caesar Salad',
        entity_code: 'SALAD-001',
        smart_code: 'HERA.REST.MNU.ENT.ITM.v1',
        properties: {
          category: 'Salad',
          price: 14.99,
          cost: 4.20,
          prep_time: 8,
          description: 'Crisp romaine lettuce with Caesar dressing and parmesan',
          allergens: ['dairy', 'eggs'],
          calories: 420,
          active: true
        }
      },
      // Tables
      {
        entity_type: 'restaurant_table',
        entity_name: 'Table 1',
        entity_code: 'TBL-001',
        smart_code: 'HERA.REST.OPS.ENT.TAB.v1',
        properties: {
          capacity: 4,
          location: 'Main Dining',
          status: 'available',
          qr_code: 'QR-TBL-001'
        }
      },
      {
        entity_type: 'restaurant_table',
        entity_name: 'Table 2',
        entity_code: 'TBL-002',
        smart_code: 'HERA.REST.OPS.ENT.TAB.v1',
        properties: {
          capacity: 2,
          location: 'Window Side',
          status: 'occupied',
          qr_code: 'QR-TBL-002'
        }
      }
    ],
    transactions: [
      // Today's Orders
      {
        transaction_type: 'restaurant_order',
        transaction_number: 'ORD-20241231-001',
        smart_code: 'HERA.REST.OPS.TXN.ORD.v1',
        reference_number: 'TBL-002',
        total_amount: 58.97,
        status: 'completed',
        properties: {
          table_number: 'TBL-002',
          server: 'Maria Rodriguez',
          order_time: '2024-12-31T19:30:00Z',
          completion_time: '2024-12-31T20:15:00Z',
          customer_count: 2,
          payment_method: 'credit_card'
        },
        lines: [
          {
            line_type: 'item',
            entity_code: 'PIZZA-001',
            quantity: 1,
            unit_price: 18.99,
            line_total: 18.99
          },
          {
            line_type: 'item',
            entity_code: 'CHICKEN-001',
            quantity: 1,
            unit_price: 24.99,
            line_total: 24.99
          },
          {
            line_type: 'item',
            entity_code: 'SALAD-001',
            quantity: 1,
            unit_price: 14.99,
            line_total: 14.99
          }
        ]
      },
      {
        transaction_type: 'restaurant_order',
        transaction_number: 'ORD-20241231-002',
        smart_code: 'HERA.REST.OPS.TXN.ORD.v1',
        reference_number: 'TBL-001',
        total_amount: 43.98,
        status: 'in_progress',
        properties: {
          table_number: 'TBL-001',
          server: 'Giuseppe Mario',
          order_time: '2024-12-31T20:00:00Z',
          customer_count: 4,
          special_requests: 'Extra cheese on pizza, no tomatoes on salad'
        },
        lines: [
          {
            line_type: 'item',
            entity_code: 'PIZZA-001',
            quantity: 2,
            unit_price: 18.99,
            line_total: 37.98,
            modifications: ['extra_cheese']
          },
          {
            line_type: 'item',
            entity_code: 'SALAD-001',
            quantity: 1,
            unit_price: 14.99,
            line_total: 14.99,
            modifications: ['no_tomatoes']
          }
        ]
      }
    ],
    analytics: {
      daily_summary: {
        date: '2024-12-31',
        total_orders: 23,
        total_revenue: 1247.85,
        average_order_value: 54.25,
        busiest_hour: '19:00-20:00',
        top_items: [
          { item: 'Margherita Pizza', quantity: 15, revenue: 284.85 },
          { item: 'Chicken Parmigiana', quantity: 8, revenue: 199.92 },
          { item: 'Caesar Salad', quantity: 12, revenue: 179.88 }
        ]
      }
    }
  },
  
  inventory: {
    story: "TechCorp Inventory - Modern inventory management in action",
    entities: [
      {
        entity_type: 'inventory_item',
        entity_name: 'MacBook Pro 16-inch',
        entity_code: 'LAPTOP-001',
        smart_code: 'HERA.INV.ITM.ENT.PROD.v1',
        properties: {
          category: 'Electronics',
          sku: 'MBP-16-M3-512',
          cost: 2199.00,
          selling_price: 2499.00,
          stock_quantity: 25,
          reorder_point: 5,
          reorder_quantity: 10,
          supplier: 'Apple Inc.',
          warranty_months: 12
        }
      },
      {
        entity_type: 'inventory_item',
        entity_name: 'Office Chair Ergonomic',
        entity_code: 'CHAIR-001',
        smart_code: 'HERA.INV.ITM.ENT.PROD.v1',
        properties: {
          category: 'Furniture',
          sku: 'CHAIR-ERG-001',
          cost: 150.00,
          selling_price: 299.00,
          stock_quantity: 45,
          reorder_point: 10,
          reorder_quantity: 20,
          supplier: 'ErgoFurniture Co.',
          warranty_months: 24
        }
      }
    ],
    transactions: [
      {
        transaction_type: 'inventory_receipt',
        transaction_number: 'RCV-20241231-001',
        smart_code: 'HERA.INV.RCV.TXN.IN.v1',
        reference_number: 'PO-2024-1247',
        total_amount: 21990.00,
        properties: {
          supplier: 'Apple Inc.',
          received_by: 'John Smith',
          receiving_location: 'Warehouse A'
        },
        lines: [
          {
            line_type: 'item',
            entity_code: 'LAPTOP-001',
            quantity: 10,
            unit_cost: 2199.00,
            line_total: 21990.00
          }
        ]
      }
    ]
  },
  
  financial: {
    story: "ACME Corp Financials - Professional accounting made simple",
    entities: [
      {
        entity_type: 'gl_account',
        entity_name: 'Cash - Operating Account',
        entity_code: '1001',
        smart_code: 'HERA.FIN.GL.ENT.ACC.v1',
        properties: {
          account_type: 'asset',
          account_category: 'current_asset',
          normal_balance: 'debit',
          is_active: true,
          bank_account: '123456789',
          bank_name: 'First National Bank'
        }
      },
      {
        entity_type: 'customer',
        entity_name: 'Johnson & Associates',
        entity_code: 'CUST-001',
        smart_code: 'HERA.FIN.AR.ENT.CUS.v1',
        properties: {
          credit_limit: 50000.00,
          payment_terms: 'NET30',
          tax_id: '12-3456789',
          contact_person: 'Sarah Johnson',
          email: 'sarah@johnsonassoc.com',
          phone: '555-0123'
        }
      }
    ],
    transactions: [
      {
        transaction_type: 'journal_entry',
        transaction_number: 'JE-20241231-001',
        smart_code: 'HERA.FIN.GL.TXN.JE.v1',
        reference_number: 'INV-2024-001',
        total_amount: 5000.00,
        properties: {
          description: 'Sales invoice to Johnson & Associates',
          posted_by: 'Accounting Dept'
        },
        lines: [
          {
            line_type: 'debit',
            account_code: '1200',
            description: 'Accounts Receivable',
            amount: 5000.00
          },
          {
            line_type: 'credit',
            account_code: '4000',
            description: 'Sales Revenue',
            amount: 5000.00
          }
        ]
      }
    ]
  }
}

// Get the template for the module
const template = demoTemplates[moduleName.toLowerCase()]
if (!template) {
  console.error(`❌ No demo template found for module: ${moduleName}`)
  console.log('Available modules:', Object.keys(demoTemplates).join(', '))
  process.exit(1)
}

console.log(`📖 Story: ${template.story}`)
console.log('')

// Generate demo data structure
const organizationId = '719dfed1-09b4-4ca8-bfda-f682460de945'
const currentDate = new Date().toISOString()

const demoData = {
  module: moduleName,
  story: template.story,
  organization_id: organizationId,
  generated_at: currentDate,
  generated_by: 'HERA_DEMO_GENERATOR',
  entities: template.entities.map(entity => ({
    ...entity,
    id: `demo-${entity.entity_code.toLowerCase()}`,
    organization_id: organizationId,
    status: 'active',
    created_at: currentDate,
    updated_at: currentDate
  })),
  transactions: template.transactions.map(txn => ({
    ...txn,
    id: `demo-txn-${txn.transaction_number.toLowerCase()}`,
    organization_id: organizationId,
    transaction_date: currentDate,
    created_at: currentDate,
    updated_at: currentDate
  })),
  analytics: template.analytics || {}
}

// Create output directory
const outputDir = path.join(process.cwd(), 'generated', 'demo-data')
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true })
}

// Save demo data as JSON
const jsonFile = path.join(outputDir, `${moduleName}-demo-data.json`)
fs.writeFileSync(jsonFile, JSON.stringify(demoData, null, 2))

// Generate SQL insertion scripts
console.log('📝 Generating SQL insertion scripts...')

const sqlInserts = []

// Insert entities
demoData.entities.forEach(entity => {
  sqlInserts.push(`
-- Insert ${entity.entity_name}
INSERT INTO core_entities (
  id, organization_id, entity_type, entity_name, entity_code, 
  smart_code, status, created_at, updated_at
) VALUES (
  '${entity.id}',
  '${entity.organization_id}',
  '${entity.entity_type}',
  '${entity.entity_name}',
  '${entity.entity_code}',
  '${entity.smart_code}',
  '${entity.status}',
  '${entity.created_at}',
  '${entity.updated_at}'
);`)

  // Insert dynamic properties
  if (entity.properties) {
    Object.entries(entity.properties).forEach(([key, value]) => {
      sqlInserts.push(`
INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value, 
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '${entity.organization_id}',
  '${entity.id}',
  '${key}',
  '${typeof value === 'object' ? JSON.stringify(value) : value}',
  '${typeof value}',
  '${entity.created_at}',
  '${entity.updated_at}'
);`)
    })
  }
})

// Insert transactions
demoData.transactions.forEach(txn => {
  sqlInserts.push(`
-- Insert ${txn.transaction_number}
INSERT INTO universal_transactions (
  id, organization_id, transaction_type, transaction_number,
  reference_number, total_amount, status, transaction_date,
  created_at, updated_at
) VALUES (
  '${txn.id}',
  '${txn.organization_id}',
  '${txn.transaction_type}',
  '${txn.transaction_number}',
  '${txn.reference_number || ''}',
  ${txn.total_amount},
  '${txn.status}',
  '${txn.transaction_date}',
  '${txn.created_at}',
  '${txn.updated_at}'
);`)

  // Insert transaction properties
  if (txn.properties) {
    Object.entries(txn.properties).forEach(([key, value]) => {
      sqlInserts.push(`
INSERT INTO core_dynamic_data (
  id, organization_id, entity_id, field_name, field_value,
  field_type, created_at, updated_at
) VALUES (
  uuid_generate_v4(),
  '${txn.organization_id}',
  '${txn.id}',
  '${key}',
  '${typeof value === 'object' ? JSON.stringify(value) : value}',
  '${typeof value}',
  '${txn.created_at}',
  '${txn.updated_at}'
);`)
    })
  }

  // Insert transaction lines
  if (txn.lines) {
    txn.lines.forEach((line, index) => {
      const lineId = `${txn.id}-line-${index + 1}`
      sqlInserts.push(`
INSERT INTO universal_transaction_lines (
  id, organization_id, transaction_id, line_number, line_type,
  entity_id, quantity, unit_price, line_total, created_at, updated_at
) VALUES (
  '${lineId}',
  '${txn.organization_id}',
  '${txn.id}',
  ${index + 1},
  '${line.line_type}',
  '${line.entity_code ? `demo-${line.entity_code.toLowerCase()}` : ''}',
  ${line.quantity || 1},
  ${line.unit_price || line.amount || 0},
  ${line.line_total || line.amount || 0},
  '${txn.created_at}',
  '${txn.updated_at}'
);`)
    })
  }
})

const sqlFile = path.join(outputDir, `${moduleName}-demo-data.sql`)
fs.writeFileSync(sqlFile, sqlInserts.join('\n'))

// Generate TypeScript test data
console.log('📝 Generating TypeScript test data...')

const tsContent = `/**
 * ${moduleName.toUpperCase()} Demo Data
 * Generated by HERA Demo Generator
 * 
 * Story: ${template.story}
 */

export const ${moduleName.toUpperCase()}_DEMO_DATA = ${JSON.stringify(demoData, null, 2)} as const

export const ${moduleName.toUpperCase()}_TEST_SCENARIOS = {
  entities: ${JSON.stringify(demoData.entities.map(e => ({
    name: e.entity_name,
    code: e.entity_code,
    type: e.entity_type
  })), null, 2)},
  
  transactions: ${JSON.stringify(demoData.transactions.map(t => ({
    number: t.transaction_number,
    type: t.transaction_type,
    amount: t.total_amount
  })), null, 2)}
}

// Helper functions for testing
export function getDemoEntity(code: string) {
  return ${moduleName.toUpperCase()}_DEMO_DATA.entities.find(e => e.entity_code === code)
}

export function getDemoTransaction(number: string) {
  return ${moduleName.toUpperCase()}_DEMO_DATA.transactions.find(t => t.transaction_number === number)
}
`

const tsFile = path.join(outputDir, `${moduleName}-demo-data.ts`)
fs.writeFileSync(tsFile, tsContent)

// Generate demo API test script
console.log('📝 Generating API test script...')

const testScript = `#!/usr/bin/env node

/**
 * ${moduleName.toUpperCase()} Demo API Tests
 * Generated by HERA Demo Generator
 */

const { execSync } = require('child_process')

const API_BASE = 'http://localhost:3001/api/v1'
const ORG_ID = '719dfed1-09b4-4ca8-bfda-f682460de945'

console.log('🧪 Running ${moduleName.toUpperCase()} Demo API Tests')
console.log('📖 Story: ${template.story}')
console.log('')

// Test scenarios
const tests = [
${demoData.entities.map(entity => `  {
    name: 'Get ${entity.entity_name}',
    url: \`\${API_BASE}/${moduleName}/entities?organization_id=\${ORG_ID}&entity_code=${entity.entity_code}\`,
    expected: 200
  }`).join(',\n')}
]

// Run tests
tests.forEach((test, index) => {
  console.log(\`\${index + 1}. \${test.name}\`)
  try {
    const result = execSync(\`curl -s -o /dev/null -w "%{http_code}" "\${test.url}"\`, { encoding: 'utf8' })
    const status = parseInt(result.trim())
    
    if (status === test.expected) {
      console.log(\`   ✅ PASS (\${status})\`)
    } else {
      console.log(\`   ❌ FAIL (\${status}, expected \${test.expected})\`)
    }
  } catch (error) {
    console.log(\`   ❌ ERROR: \${error.message}\`)
  }
})

console.log('')
console.log('🎯 Demo test complete!')
`

const testFile = path.join(outputDir, `${moduleName}-demo-tests.js`)
fs.writeFileSync(testFile, testScript)
fs.chmodSync(testFile, '755') // Make executable

// Generate README for demo
const readmeContent = `# ${moduleName.toUpperCase()} Demo Data

${template.story}

## 📊 Demo Contents

- **Entities**: ${demoData.entities.length} sample records
- **Transactions**: ${demoData.transactions.length} sample transactions  
- **Analytics**: Performance metrics and insights

## 🚀 Quick Start

### 1. Load Demo Data
\`\`\`bash
# Import SQL data
psql -d hera_db -f ${moduleName}-demo-data.sql

# Or use the JSON API
curl -X POST http://localhost:3001/api/v1/demo/import \\
  -H "Content-Type: application/json" \\
  -d @${moduleName}-demo-data.json
\`\`\`

### 2. Run Demo Tests
\`\`\`bash
# Execute test scenarios
./${moduleName}-demo-tests.js
\`\`\`

### 3. Explore the Demo
\`\`\`bash
# Visit the module
http://localhost:3000/${moduleName}/dashboard

# Test APIs
curl "http://localhost:3001/api/v1/${moduleName}/entities?organization_id=${organizationId}"
\`\`\`

## 📋 Demo Entities

${demoData.entities.map(e => `- **${e.entity_name}** (${e.entity_code}) - ${e.smart_code}`).join('\n')}

## 💼 Demo Transactions

${demoData.transactions.map(t => `- **${t.transaction_number}** - ${t.transaction_type} ($${t.total_amount})`).join('\n')}

## 🎯 Business Story

${template.story}

This demo showcases how HERA's universal architecture handles real-world ${moduleName} scenarios with zero configuration changes.

---

*Generated by HERA Demo Generator - Making every demo tell a story*
`

const readmeFile = path.join(outputDir, `${moduleName}-demo-README.md`)
fs.writeFileSync(readmeFile, readmeContent)

// Summary
console.log('📁 Generated Demo Files:')
console.log(`  ✅ JSON Data: ${jsonFile}`)
console.log(`  ✅ SQL Script: ${sqlFile}`)
console.log(`  ✅ TypeScript: ${tsFile}`)
console.log(`  ✅ API Tests: ${testFile}`)
console.log(`  ✅ README: ${readmeFile}`)
console.log('')
console.log('📊 Demo Statistics:')
console.log(`  📋 Entities: ${demoData.entities.length}`)
console.log(`  💼 Transactions: ${demoData.transactions.length}`)
console.log(`  🎬 Story: ${template.story}`)
console.log('')
console.log('🚀 Next Steps:')
console.log(`1. Load demo data: psql -d hera_db -f ${moduleName}-demo-data.sql`)
console.log(`2. Run tests: ./${moduleName}-demo-tests.js`)
console.log(`3. Visit: http://localhost:3000/${moduleName}/dashboard`)
console.log('')
console.log('🎉 Demo Generation Complete!')
console.log('✨ "The best demos tell a story" - Steve Jobs')