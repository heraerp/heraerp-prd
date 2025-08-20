# 🧪 HERA Universal Testing Framework

**Revolutionary business process testing for HERA's universal ERP architecture**

Transform complex ERP testing from technical implementation details to natural business language. The world's first testing framework designed specifically for universal 6-table architecture.

## ✨ Key Features

- **🎯 Business Process Testing**: Write tests in business terminology, not technical jargon
- **🏗️ Universal Architecture**: Leverages HERA's 6-table schema for consistent testing patterns
- **🏭 Industry Templates**: Pre-built test patterns for restaurant, healthcare, salon, retail
- **🤖 Smart Code Integration**: Automatic business intelligence validation built-in
- **🔒 Multi-Tenant Safe**: Organization isolation built into every test
- **⚡ Multiple Test Types**: Unit, Integration, E2E, Agent/MCP, Database, Business Process
- **📊 Comprehensive Reporting**: Console, JSON, HTML reports with detailed insights

## 🚀 Quick Start

### Installation

```bash
cd packages/hera-testing
npm install
npm run build
```

### Initialize Your First Test Project

```bash
# Create a restaurant testing project
npx hera-test init my-restaurant-tests --industry restaurant

# Navigate to project
cd my-restaurant-tests

# Run the sample test
npx hera-test run tests/order-to-cash.yaml --org-id your-test-org-id
```

## 📋 Business Process Test Format

Tests are written in YAML using natural business language:

```yaml
id: restaurant-order-to-cash-basic
title: Restaurant Order-to-Cash Basic Flow
industry: restaurant

context:
  tenant: marios-restaurant-test
  organization_id: "{{test_org_id}}"
  currency: USD
  industry: restaurant

personas:
  server:
    role: sales
    permissions: ["orders:create", "orders:read", "menu:read"]
  
  cashier:
    role: manager
    permissions: ["payments:create", "cash:access"]

steps:
  - id: create_order
    description: Server takes customer order at table 12
    persona: server
    actions:
      - action_type: create_transaction
        data:
          transaction_type: sale
          smart_code: HERA.REST.SALE.ORDER.v1
          reference_entity_id: "{{customer.id}}"
          line_items:
            - line_number: 1
              line_entity_id: "{{pizza_product.id}}"
              quantity: 1
              unit_price: 18.99
              smart_code: HERA.REST.ORDER.LINE.MAIN.v1
        store_as: order

assertions:
  - type: database
    assertions:
      - table: universal_transactions
        condition: exists
        filters:
          transaction_type: sale
        expected: true
  
  - type: business
    assertions:
      - oracle: accounting_equation
        expected: true
        tolerance: 0.01
```

## 🎭 Available Action Types

### Entity Management
```yaml
- action_type: create_entity
  data:
    entity_type: customer
    entity_name: John Smith
    smart_code: HERA.CRM.CUST.ENT.PROF.v1
  store_as: customer
```

### Transaction Processing
```yaml
- action_type: create_transaction
  data:
    transaction_type: sale
    smart_code: HERA.CRM.SALE.TXN.ORDER.v1
    total_amount: 100.00
    line_items: [...]
  store_as: sale_transaction
```

### Dynamic Fields
```yaml
- action_type: set_dynamic_field
  entity_id: "{{customer.id}}"
  field_name: credit_limit
  field_value: 5000.00
  smart_code: HERA.CRM.CUST.DYN.CREDIT.v1
```

### Relationships
```yaml
- action_type: create_relationship
  data:
    from_entity_id: "{{order.id}}"
    to_entity_id: "{{status.id}}"
    relationship_type: has_status
    smart_code: HERA.WORKFLOW.STATUS.ASSIGN.v1
```

### UI Interactions
```yaml
- action_type: ui_interaction
  selector: "[data-testid='submit-order']"
  interaction: click
  timeout: 5000
```

### API Calls
```yaml
- action_type: api_call
  endpoint: /api/v1/universal
  method: POST
  data: { action: "create", table: "core_entities" }
  store_as: api_response
```

## 🔍 Assertion Types

### Database Assertions
```yaml
- type: database
  assertions:
    - table: core_entities
      condition: exists
      filters:
        entity_type: customer
      expected: true
    
    - table: universal_transactions
      condition: count
      filters:
        transaction_type: sale
      expected: 5
```

### Business Logic Assertions
```yaml
- type: business
  assertions:
    - oracle: accounting_equation
      expected: true
      tolerance: 0.01
    
    - oracle: inventory_balance
      expected: true
    
    - oracle: smart_code_validation
      expected: true
```

### UI Assertions
```yaml
- type: ui
  assertions:
    - selector: "[data-testid='order-status']"
      condition: contains
      value: "Completed"
      timeout: 5000
    
    - selector: ".success-message"
      condition: visible
      timeout: 3000
```

## 🏭 Industry Templates

### Restaurant Industry
```bash
npx hera-test init restaurant-pos --industry restaurant
```
**Includes**: Order-to-cash, Kitchen workflow, Inventory management, Financial reporting

### Healthcare Industry
```bash
npx hera-test init clinic-management --industry healthcare
```
**Includes**: Patient registration, Appointment scheduling, Treatment workflow, Insurance billing

### Salon Industry
```bash
npx hera-test init salon-booking --industry salon
```
**Includes**: Appointment booking, Service delivery, Commission tracking, Inventory management

### Retail Industry
```bash
npx hera-test init retail-pos --industry retail
```
**Includes**: Product sales, Inventory tracking, Customer management, Financial reporting

## 🛠️ CLI Commands

### Initialize Project
```bash
npx hera-test init <project-name> [options]
```

Options:
- `--industry <type>` - Industry template (restaurant, healthcare, retail, salon)
- `--template <template>` - Base template to use

### Run Tests
```bash
npx hera-test run <test-file> [options]
```

Options:
- `--org-id <id>` - Organization ID for test execution
- `--browser <browser>` - Browser for E2E tests (chromium, firefox, webkit)
- `--headless` - Run browser in headless mode
- `--debug` - Enable debug mode with detailed logging
- `--report <format>` - Report format (console, json, html)

### Generate Technical Tests
```bash
npx hera-test generate <test-file> <output-dir> [options]
```

Options:
- `--type <types>` - Test types to generate (playwright,jest,pgtap)
- `--overwrite` - Overwrite existing files

### Run Test Suite
```bash
npx hera-test suite <test-dir> [options]
```

Options:
- `--pattern <pattern>` - File pattern to match (*.yaml)
- `--parallel <count>` - Number of parallel executions
- `--report <format>` - Report format (console, json, html)
- `--output <file>` - Output file for report

### Validate Tests
```bash
npx hera-test validate <test-file> [options]
```

Options:
- `--strict` - Enable strict validation mode

## 🧬 Smart Code Integration

HERA's Smart Code system provides automatic business intelligence. Every test action includes smart codes that enable:

### Automatic GL Posting
```yaml
smart_code: HERA.REST.SALE.ORDER.v1
# Automatically posts to appropriate GL accounts
```

### Business Rule Validation
```yaml
smart_code: HERA.CRM.CUST.ENT.PROF.v1  
# Validates customer profile completeness
```

### Industry-Specific Logic
```yaml
smart_code: HERA.HLTH.PAT.MED.REC.v1
# Healthcare-specific patient record validation
```

## 🔒 Multi-Tenant Testing

Every test automatically includes organization isolation:

```yaml
context:
  organization_id: "{{test_org_id}}"  # Sacred boundary
  
# All created entities automatically include organization_id
# All queries filtered by organization_id
# Zero data leakage between organizations
```

## 🎯 Business Oracles

Built-in validation functions for common business rules:

### Accounting Equation
```typescript
oracle: accounting_equation
// Validates: Assets = Liabilities + Equity
```

### Inventory Balance
```typescript
oracle: inventory_balance
// Validates: Physical inventory matches system records
```

### Workflow Status
```typescript
oracle: workflow_status
// Validates: Status transitions follow business rules
```

### Tax Calculation
```typescript
oracle: tax_calculation
// Validates: Tax calculations are accurate
```

### Smart Code Patterns
```typescript
oracle: smart_code_validation
// Validates: All smart codes follow HERA patterns
```

## 📊 Reporting

### Console Report
```bash
📊 Test Results:
Status: ✅ PASSED
Duration: 2,345ms
Steps: 8/8 passed
Assertions: 12/12 passed
```

### HTML Report
```bash
npx hera-test run test.yaml --report html
```
Generates comprehensive HTML report with:
- Executive summary
- Step-by-step execution details
- Assertion results
- Performance metrics
- Screenshots (for UI tests)

### JSON Report
```bash
npx hera-test run test.yaml --report json
```
Machine-readable format for CI/CD integration.

## 🏗️ Architecture

### Universal 6-Table Integration
```
core_organizations     → Multi-tenant isolation
core_entities         → Business objects (customers, products, etc.)
core_dynamic_data     → Custom fields without schema changes
core_relationships    → Entity connections and workflows
universal_transactions → All business activities
universal_transaction_lines → Transaction details
```

### Test Execution Flow
1. **Parse** YAML test definition
2. **Validate** against schema
3. **Resolve** template variables
4. **Execute** setup actions
5. **Run** test steps with persona context
6. **Validate** assertions using business oracles
7. **Cleanup** test data
8. **Generate** comprehensive report

## 🚀 Advanced Features

### Template Variables
```yaml
customer_id: "{{customer.id}}"
timestamp: "{{timestamp}}"
future_date: "{{clock+3600}}"  # 1 hour from test clock
```

### Reference Resolution
```yaml
- action_type: create_entity
  store_as: customer
  
- action_type: create_transaction
  data:
    reference_entity_id: "{{customer.id}}"  # References previous step
```

### Conditional Logic
```yaml
preconditions:
  - customer_exists
  - inventory_available

postconditions:
  - order_created
  - inventory_reserved
```

### Parallel Execution
```bash
npx hera-test suite tests --parallel 4
# Runs up to 4 tests simultaneously
```

## 🤝 Contributing

### Adding Industry Templates
1. Create industry-specific personas
2. Define common workflows
3. Add business-specific assertions
4. Document smart code patterns

### Creating Custom Oracles
```typescript
// packages/hera-testing/src/oracles/custom-oracles.ts
export function validateCustomRule(data: any): boolean {
  // Custom business logic validation
  return true;
}
```

### Extending Action Types
```typescript
// Add new action type to schema
export const CustomActionSchema = z.object({
  action_type: z.literal('custom_action'),
  // Custom fields
});
```

## 📚 Examples

Complete working examples available in `/examples/`:

- `restaurant-order-to-cash.yaml` - Complete restaurant workflow
- `healthcare-patient-visit.yaml` - Healthcare patient management
- `salon-appointment-booking.yaml` - Salon service delivery
- `retail-product-sale.yaml` - Retail point of sale

## 🎓 Best Practices

### Test Structure
- One business process per test file
- Clear step descriptions in business language
- Appropriate persona assignment for each step
- Comprehensive assertions covering UI, database, and business logic

### Smart Code Usage
- Always include appropriate smart codes
- Follow HERA.INDUSTRY.MODULE.FUNCTION.TYPE.vX pattern
- Use industry-specific smart codes when available

### Data Management
- Use template variables for dynamic data
- Store intermediate results with meaningful names
- Clean up test data in cleanup phase

### Multi-Organization Testing
- Always specify organization_id in context
- Test cross-organization isolation
- Validate organization-specific business rules

## 🆘 Troubleshooting

### Common Issues

**Schema Validation Errors**
```bash
Error: context.organization_id: Required
Solution: Add organization_id to test context
```

**Template Resolution Errors**
```bash
Error: Template variable {{customer.id}} not found
Solution: Ensure previous step stores result with store_as: customer
```

**Database Connection Issues**
```bash
Error: Failed to connect to Supabase
Solution: Check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

**Smart Code Validation Errors**
```bash
Error: Invalid smart code pattern
Solution: Follow HERA.INDUSTRY.MODULE.FUNCTION.TYPE.vX format
```

## 📄 License

MIT License - see LICENSE file for details

## 🙏 Acknowledgments

Built for HERA Universal ERP Architecture - the revolutionary 6-table system that handles infinite business complexity without schema changes.

---

**Ready to revolutionize your ERP testing? Get started with HERA Testing Framework today!** 🚀