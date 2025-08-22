# HERA MCP Agent Guide - Building AI Agents for Supabase-Hosted HERA

## 🚀 YES! MCP Works Perfectly with Supabase

HERA already includes a complete MCP (Model Context Protocol) server that provides direct access to your Supabase-hosted database through AI agents. This enables revolutionary capabilities:

### What You Can Do:
1. **Natural Language Database Control** - "Create a new customer named John Smith"
2. **Automated Business Workflows** - "Process all pending appointments for today"
3. **Intelligent Data Analysis** - "Show me top performing services this month"
4. **Universal Operations** - Works across ALL modules (salon, restaurant, healthcare, etc.)

## 📋 Current MCP Implementation

### Existing MCP Server Files:
```
mcp-server/
├── hera-mcp-server-v2.js      # Main MCP server with SACRED rules
├── hera-mcp-server-sacred.js  # Sacred rules enforcement
├── test-sacred-rules.js       # Rule validation tests
├── package.json               # Dependencies and scripts
└── claude_mcp_config.json     # Claude Desktop configuration
```

### Available MCP Tools:
```javascript
// Universal Data Operations
"query-universal"          // Query any of the 6 sacred tables
"create-entity"           // Create any business object
"create-transaction"      // Create business transactions
"set-dynamic-field"       // Add custom fields without schema
"create-relationship"     // Link entities together

// Authorization & Security  
"create-hera-user"        // User management
"setup-organization-security" // Configure permissions
"check-user-authorization"   // Verify access
"generate-test-jwt"          // Create auth tokens
```

## 🔧 Setting Up MCP with Supabase

### 1. Configure Environment Variables
```bash
# In your .env file
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DEFAULT_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
```

### 2. Update Claude Desktop Config
```json
// claude_desktop_config.json (for Claude Desktop app)
{
  "mcpServers": {
    "hera-production": {
      "command": "node",
      "args": ["/path/to/heraerp-prd/mcp-server/hera-mcp-server-v2.js"],
      "env": {
        "SUPABASE_URL": "https://your-project.supabase.co",
        "SUPABASE_SERVICE_KEY": "your-service-role-key",
        "DEFAULT_ORGANIZATION_ID": "your-org-id"
      }
    }
  }
}
```

### 3. Start MCP Server
```bash
cd mcp-server
npm install
npm start  # Starts the v2 server with sacred rules
```

## 🤖 Building Custom HERA Agents

### Example 1: Salon Management Agent
```javascript
// salon-agent.js
const { createClient } = require('@supabase/supabase-js');

class SalonAgent {
  constructor(supabase, organizationId) {
    this.supabase = supabase;
    this.organizationId = organizationId;
  }

  // Natural language appointment booking
  async bookAppointment(customerName, serviceName, dateTime, staffName) {
    // 1. Find or create customer
    const customer = await this.findOrCreateCustomer(customerName);
    
    // 2. Find service
    const service = await this.findService(serviceName);
    
    // 3. Find staff member
    const staff = await this.findStaff(staffName);
    
    // 4. Create appointment transaction
    const appointment = await this.supabase
      .from('universal_transactions')
      .insert({
        organization_id: this.organizationId,
        transaction_type: 'appointment',
        transaction_date: dateTime,
        from_entity_id: customer.id,
        to_entity_id: staff.id,
        total_amount: service.price,
        smart_code: 'HERA.SALON.APPOINTMENT.BOOK.v1',
        metadata: {
          service_id: service.id,
          duration_minutes: service.duration,
          status: 'confirmed'
        }
      });
    
    return appointment;
  }

  // Smart daily operations
  async processDailyOperations() {
    // Check appointments
    const todayAppointments = await this.getTodayAppointments();
    
    // Send reminders
    for (const apt of todayAppointments) {
      await this.sendReminder(apt);
    }
    
    // Check inventory levels
    const lowStock = await this.checkInventoryLevels();
    if (lowStock.length > 0) {
      await this.createRestockOrder(lowStock);
    }
    
    // Calculate commissions
    await this.calculateDailyCommissions();
  }
}
```

### Example 2: Universal Business Intelligence Agent
```javascript
// business-intelligence-agent.js
class HERAIntelligenceAgent {
  constructor(supabase, organizationId) {
    this.supabase = supabase;
    this.organizationId = organizationId;
  }

  // Analyze business performance
  async analyzePerformance(dateRange) {
    // Get all transactions
    const { data: transactions } = await this.supabase
      .from('universal_transactions')
      .select('*')
      .eq('organization_id', this.organizationId)
      .gte('transaction_date', dateRange.start)
      .lte('transaction_date', dateRange.end);
    
    // Analyze by type
    const analysis = {
      revenue: this.calculateRevenue(transactions),
      topServices: this.findTopServices(transactions),
      customerInsights: await this.analyzeCustomers(),
      trends: this.identifyTrends(transactions)
    };
    
    return analysis;
  }

  // Predictive analytics
  async predictNextMonth() {
    // Use historical data to predict
    const historicalData = await this.getHistoricalData(6); // 6 months
    
    return {
      expectedRevenue: this.predictRevenue(historicalData),
      expectedAppointments: this.predictAppointments(historicalData),
      inventoryNeeds: this.predictInventory(historicalData),
      staffingRequirements: this.predictStaffing(historicalData)
    };
  }

  // Automated recommendations
  async generateRecommendations() {
    const performance = await this.analyzePerformance({ 
      start: new Date(Date.now() - 30*24*60*60*1000),
      end: new Date() 
    });
    
    const recommendations = [];
    
    // Revenue optimization
    if (performance.revenue.growth < 5) {
      recommendations.push({
        type: 'revenue',
        action: 'Implement promotional campaign',
        impact: 'Expected 15% revenue increase',
        implementation: await this.createPromotionCampaign()
      });
    }
    
    // Service optimization
    const underperforming = performance.topServices.filter(s => s.utilization < 30);
    for (const service of underperforming) {
      recommendations.push({
        type: 'service',
        action: `Optimize ${service.name}`,
        impact: 'Improve utilization by 20%',
        implementation: await this.optimizeService(service)
      });
    }
    
    return recommendations;
  }
}
```

### Example 3: Natural Language Interface Agent
```javascript
// nl-interface-agent.js
class HERANaturalLanguageAgent {
  constructor(supabase, organizationId) {
    this.supabase = supabase;
    this.organizationId = organizationId;
  }

  // Process natural language commands
  async processCommand(command) {
    const intent = this.detectIntent(command);
    
    switch (intent.action) {
      case 'create':
        return await this.handleCreate(intent);
      
      case 'query':
        return await this.handleQuery(intent);
      
      case 'update':
        return await this.handleUpdate(intent);
      
      case 'analyze':
        return await this.handleAnalyze(intent);
      
      default:
        return { error: 'Unknown command' };
    }
  }

  detectIntent(command) {
    const lowerCommand = command.toLowerCase();
    
    // Creation patterns
    if (lowerCommand.includes('create') || lowerCommand.includes('add')) {
      if (lowerCommand.includes('customer')) {
        return { action: 'create', type: 'customer', command };
      }
      if (lowerCommand.includes('appointment')) {
        return { action: 'create', type: 'appointment', command };
      }
    }
    
    // Query patterns
    if (lowerCommand.includes('show') || lowerCommand.includes('list')) {
      return { action: 'query', command };
    }
    
    // Analysis patterns
    if (lowerCommand.includes('analyze') || lowerCommand.includes('report')) {
      return { action: 'analyze', command };
    }
  }

  async handleCreate(intent) {
    switch (intent.type) {
      case 'customer':
        // Extract name from command
        const nameMatch = intent.command.match(/customer\s+(?:named\s+)?(.+)/i);
        const name = nameMatch ? nameMatch[1].trim() : 'New Customer';
        
        return await this.supabase
          .from('core_entities')
          .insert({
            organization_id: this.organizationId,
            entity_type: 'customer',
            entity_name: name,
            entity_code: `CUST-${Date.now()}`,
            smart_code: 'HERA.CRM.CUSTOMER.CREATE.v1',
            metadata: {
              created_via: 'natural_language',
              original_command: intent.command
            }
          });
      
      // Add more creation handlers
    }
  }
}
```

## 🚀 Advanced MCP Capabilities

### 1. Workflow Automation
```javascript
// Automated workflow processing
async function processWorkflows() {
  // Find pending workflows
  const { data: pending } = await supabase
    .from('core_relationships')
    .select('*')
    .eq('relationship_type', 'has_status')
    .eq('to_entity_id', pendingStatusId);
  
  for (const item of pending) {
    await processWorkflowItem(item);
  }
}
```

### 2. Smart Code Intelligence
```javascript
// Use smart codes for intelligent routing
async function processSmartCode(entity) {
  const smartCode = entity.smart_code;
  const [system, industry, domain, operation, version] = smartCode.split('.');
  
  // Route based on smart code
  if (industry === 'SALON' && domain === 'APPOINTMENT') {
    await processSalonAppointment(entity);
  } else if (industry === 'REST' && domain === 'ORDER') {
    await processRestaurantOrder(entity);
  }
  // ... automatic routing for any business type
}
```

### 3. Universal Pattern Recognition
```javascript
// Learn from patterns across all organizations
async function learnPatterns() {
  // Analyze successful transactions
  const patterns = await analyzeSuccessfulTransactions();
  
  // Apply learnings to improve operations
  await applyLearnings(patterns);
}
```

## 🔒 Security Considerations

### 1. Always Enforce Organization Isolation
```javascript
// SACRED RULE: Always include organization_id
const query = supabase
  .from('core_entities')
  .select('*')
  .eq('organization_id', organizationId); // MANDATORY
```

### 2. Use Row Level Security
```sql
-- Supabase RLS policies
CREATE POLICY "Users can only see their organization's data"
ON core_entities
FOR ALL
USING (organization_id = current_setting('app.current_organization_id'));
```

### 3. Validate All Operations
```javascript
// Validate before any operation
if (!organizationId) {
  throw new Error('SACRED VIOLATION: organization_id required');
}
```

## 📊 Monitoring Your MCP Agent

### 1. Track Operations
```javascript
// Log all MCP operations
async function logOperation(operation, result) {
  await supabase
    .from('core_entities')
    .insert({
      organization_id: 'system',
      entity_type: 'mcp_log',
      entity_name: operation,
      metadata: {
        timestamp: new Date(),
        result,
        agent_version: '1.0.0'
      }
    });
}
```

### 2. Performance Metrics
```javascript
// Monitor agent performance
const metrics = {
  operations_per_minute: 0,
  success_rate: 0,
  average_response_time: 0,
  error_count: 0
};
```

## 🎯 Getting Started

1. **Install Dependencies**:
   ```bash
   cd mcp-server
   npm install
   ```

2. **Configure Supabase**:
   - Add your Supabase URL and service key to .env
   - Ensure RLS policies are configured

3. **Start MCP Server**:
   ```bash
   npm start
   ```

4. **Test with Claude Desktop**:
   - Configure claude_desktop_config.json
   - Restart Claude Desktop
   - Try: "Create a new customer named Tesla Inc"

5. **Build Custom Agents**:
   - Use the examples above as templates
   - Always follow SACRED rules
   - Test with multiple organizations

## 🚀 The Future

With MCP + Supabase + HERA's universal architecture, you can:
- Build agents that work across ANY business type
- Process natural language commands
- Automate complex workflows
- Learn and improve from patterns
- Scale to millions of operations

All while maintaining perfect multi-tenant isolation and using just 6 sacred tables!

---

**Remember**: The power of MCP with HERA is that the same agent can manage a salon, restaurant, hospital, or factory - all through the universal 6-table architecture!