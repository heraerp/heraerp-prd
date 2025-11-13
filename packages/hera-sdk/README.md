# @hera/sdk

The official HERA Platform SDK for TypeScript/JavaScript applications.

## 🛡️ Security-First Design

This SDK **enforces** Enhanced Gateway security by routing all operations through the HERA API v2 Gateway. Direct RPC access is intentionally NOT provided to ensure:

- ✅ Complete actor stamping and audit trails
- ✅ Organization isolation and multi-tenant security
- ✅ Guardrails v2.0 validation (Smart Codes, GL balance, payload validation)
- ✅ Request tracing and performance monitoring

## 🚀 Quick Start

### Installation

```bash
npm install @hera/sdk
# or
yarn add @hera/sdk
```

### Basic Usage

```typescript
import { createHeraClient } from '@hera/sdk'

const client = createHeraClient({
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseAnonKey: 'your-anon-key',
  organizationId: 'your-org-uuid',
  authToken: 'your-jwt-token' // Optional, can be set later
})

// Create an entity
const customer = await client.createEntity({
  entity_type: 'CUSTOMER',
  entity_name: 'ACME Corporation',
  smart_code: 'HERA.CRM.CUSTOMER.ENTITY.v1'
})

// Search entities
const results = await client.searchEntities({
  entity_type: 'CUSTOMER',
  search_text: 'ACME'
})
```

## 🤖 AI Digital Accountant

```typescript
import { createHeraAIClient } from '@hera/sdk'

const aiClient = createHeraAIClient(options)

// Ask intelligent accounting questions
const response = await aiClient.query({
  query: 'What are our top 5 expenses this quarter?',
  context: { entity_type: 'organization' }
})

// AI-powered financial analysis
const analysis = await aiClient.analyzeFinancialStatements({
  statement_type: 'income_statement',
  period: '2024-Q4'
})

// Generate reports with AI
const report = await aiClient.callTool({
  tool_name: 'generate-report',
  parameters: {
    report_type: 'executive_summary',
    timeframe: '1y'
  }
})

// Track AI costs
const usage = await aiClient.getUsage('30d')
console.log(`AI costs: $${usage.data.total_cost}`)
```

## 📊 Advanced Context Management (MCP)

```typescript
import { createHeraMCPClient } from '@hera/sdk'

const mcpClient = createHeraMCPClient(options)

// Start intelligent session with context
const session = await mcpClient.startSession({
  financial_context: {
    currency: 'USD',
    fiscal_year: 2024,
    accounting_method: 'accrual'
  },
  date_range: {
    start: '2024-01-01',
    end: '2024-12-31'
  }
})

// Contextual conversations
const response = await mcpClient.sendMessage(
  session.data.session_id,
  'Analyze our cash flow trends'
)

// Advanced forecasting
const forecast = await mcpClient.generateForecast(session.data.session_id, {
  metrics: ['revenue', 'expenses', 'profit'],
  timeframe: '6m',
  confidence_level: 0.95
})
```

## 📋 Entity Management

### CRUD Operations

```typescript
// Create
const entity = await client.createEntity({
  entity_type: 'PRODUCT',
  entity_name: 'Premium Service Package',
  smart_code: 'HERA.CATALOG.PRODUCT.ENTITY.v1'
})

// Read
const retrieved = await client.readEntity(entity.data.id)

// Update
const updated = await client.updateEntity(entity.data.id, {
  entity_name: 'Premium Service Package - Updated'
})

// Delete
await client.deleteEntity(entity.data.id)
```

### Dynamic Fields

```typescript
// Set dynamic field values
await client.setDynamicField(entityId, {
  field_name: 'price',
  field_type: 'number',
  field_value_number: 99.99,
  smart_code: 'HERA.CATALOG.PRODUCT.FIELD.PRICE.v1',
  organization_id: 'your-org-id'
})
```

### Relationships

```typescript
// Create relationships between entities
await client.createRelationship({
  source_entity_id: 'customer-id',
  target_entity_id: 'account-manager-id',
  relationship_type: 'ASSIGNED_TO',
  smart_code: 'HERA.CRM.RELATIONSHIP.ASSIGNMENT.v1',
  organization_id: 'your-org-id'
})
```

## 💰 Transaction Management

```typescript
// Create financial transaction
const transaction = await client.createTransaction({
  transaction_type: 'sale',
  transaction_date: '2024-11-11',
  total_amount: 1500.00,
  transaction_currency_code: 'USD',
  smart_code: 'HERA.FINANCE.TXN.SALE.v1',
  lines: [
    {
      line_number: 1,
      line_type: 'SERVICE',
      description: 'Consulting Services',
      quantity: 1,
      unit_amount: 1500.00,
      line_amount: 1500.00,
      smart_code: 'HERA.FINANCE.LINE.SERVICE.v1'
    }
  ]
})
```

## 🔍 Error Handling

```typescript
import { isHeraError, formatHeraError } from '@hera/sdk'

const result = await client.createEntity(entityData)

if (isHeraError(result)) {
  console.error('Entity creation failed:')
  console.error(formatHeraError(result))
  
  // Handle specific errors
  if (result.error.includes('guardrail_violation')) {
    console.log('Guardrail validation failed')
  }
} else {
  console.log('Entity created successfully:', result.data)
}
```

## ⚡ Performance & Monitoring

```typescript
import { PerformanceTracker } from '@hera/sdk'

const tracker = new PerformanceTracker()

tracker.mark('start_operation')
await client.createEntity(entityData)
tracker.mark('end_operation')

console.log(`Operation took: ${tracker.measure('end_operation')}ms`)
```

## 🔧 Configuration

### Environment-based Configuration

```typescript
const client = createHeraClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  organizationId: process.env.NEXT_PUBLIC_ORGANIZATION_ID,
  environment: process.env.NODE_ENV, // 'development' | 'staging' | 'production'
  timeout: 30000, // 30 second timeout
  retryAttempts: 3 // Retry failed requests 3 times
})
```

### Authentication

```typescript
// Set auth token after login
client.setAuthToken(jwtToken)

// Check authentication status
const { data: session } = await client.getAuth()
```

## 📊 Health Monitoring

```typescript
// Check Enhanced Gateway health
const health = await client.healthCheck()
console.log('Gateway status:', health.data.status)

// Get performance metrics
const metrics = await client.getMetrics()
console.log('Middleware chain:', metrics.data.middleware_chain)
```

## 🚫 Security Features

### Guardrails Enforcement

The SDK automatically enforces HERA guardrails:

- **Smart Code Validation**: All entities require valid HERA Smart Codes
- **Organization Isolation**: All operations filtered by organization ID
- **GL Balance Checking**: Financial transactions validated for balance
- **Actor Stamping**: All changes tracked to specific users

### Forbidden Operations

These operations are **intentionally NOT implemented** to prevent security bypass:

- `supabase.rpc()` - Direct RPC calls
- `supabase.from().select()` - Direct table access
- `supabase.from().insert()` - Direct data insertion
- Any operation that bypasses the Enhanced Gateway

## 📚 TypeScript Support

Full TypeScript support with comprehensive type definitions:

```typescript
import type { 
  HeraEntity, 
  HeraTransaction, 
  HeraResponse, 
  HeraClientOptions 
} from '@hera/sdk'

// Type-safe entity creation
const entityData: Partial<HeraEntity> = {
  entity_type: 'CUSTOMER',
  entity_name: 'ACME Corp',
  smart_code: 'HERA.CRM.CUSTOMER.ENTITY.v1'
}

const response: HeraResponse<HeraEntity> = await client.createEntity(entityData)
```

## 🧪 Testing

```typescript
import { createHeraClient } from '@hera/sdk'

// Mock client for testing
const mockClient = createHeraClient({
  supabaseUrl: 'http://localhost:54321',
  supabaseAnonKey: 'test-key',
  organizationId: 'test-org-id',
  environment: 'development'
})
```

## 📖 API Reference

### HeraClient

- `createEntity(data)` - Create a new entity
- `readEntity(id)` - Read an entity by ID  
- `updateEntity(id, data)` - Update an entity
- `deleteEntity(id)` - Delete an entity
- `searchEntities(params)` - Search entities
- `createTransaction(data)` - Create a transaction
- `setDynamicField(entityId, field)` - Set dynamic field value
- `createRelationship(relationship)` - Create entity relationship

### HeraAIClient

- `query(request)` - Ask AI assistant
- `startChat(query)` - Start chat session
- `continueChat(sessionId, query)` - Continue chat
- `callTool(toolCall)` - Execute AI tool
- `getUsage(timeframe)` - Get AI usage statistics
- `analyzeFinancialStatements(params)` - AI financial analysis
- `generateChartOfAccounts(industry)` - AI chart generation
- `categorizeTransaction(id)` - AI transaction categorization

### HeraMCPClient

- `startSession(context)` - Start MCP session
- `sendMessage(sessionId, message)` - Send contextual message
- `executeTool(sessionId, tool)` - Execute tool with context
- `getBusinessInsights(sessionId, type)` - Get AI insights
- `generateForecast(sessionId, params)` - Generate forecasts
- `generateDocument(sessionId, type, specs)` - Generate documents

## 🆘 Support

- **Documentation**: [HERA Platform Docs](https://docs.heraplatform.com)
- **Issues**: [GitHub Issues](https://github.com/hera-platform/sdk/issues)
- **Discord**: [HERA Community](https://discord.gg/hera-platform)

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

**⚡ Powered by HERA Platform v2.5 - The Future of Enterprise ERP**