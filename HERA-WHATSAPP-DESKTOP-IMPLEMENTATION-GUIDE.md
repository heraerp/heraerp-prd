# HERA WhatsApp Desktop Implementation Guide

## 🎯 Overview

A cost-smart WhatsApp Business desktop application that minimizes paid message sends while providing efficient salon booking capabilities. Built with MCP (Model Context Protocol) tools, Claude AI integration, and HERA's sacred six tables architecture.

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     WhatsApp Desktop UI                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Chat List   │  │ Message Area │  │ Cost Metrics Panel   │  │
│  │ • Contacts  │  │ • Real-time  │  │ • Daily spend        │  │
│  │ • Windows   │  │ • Templates  │  │ • Budget tracking    │  │
│  │ • Costs     │  │ • Status     │  │ • Optimization tips  │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                            │
┌────────────────────────────┴────────────────────────────────────┐
│                    Message Router Service                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐ │
│  │ Window Check │  │ Cost Calc    │  │ Budget Guards        │ │
│  │ • 24h state  │  │ • Template   │  │ • Daily limits       │ │
│  │ • Expiry     │  │ • Free-form  │  │ • Marketing caps     │ │
│  └──────────────┘  └──────────────┘  └──────────────────────┘ │
└────────────────────────────┬────────────────────────────────────┘
                            │
┌────────────────────────────┴────────────────────────────────────┐
│                         MCP Tools Layer                          │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Calendar    │  │ WhatsApp     │  │ HERA Integration     │  │
│  │ • Find slots│  │ • Send msg   │  │ • Write txn          │  │
│  │ • Book apt  │  │ • Window     │  │ • Upsert entity      │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                            │
┌────────────────────────────┴────────────────────────────────────┐
│                      Claude AI Service                           │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Intent      │  │ Template     │  │ Response Gen         │  │
│  │ Detection   │  │ Selection    │  │ • Minimal turns      │  │
│  │ • Book/Cancel│ │ • Utility    │  │ • Clear messaging    │  │
│  └─────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────────┬────────────────────────────────────┘
                            │
┌────────────────────────────┴────────────────────────────────────┐
│                    HERA Sacred Six Tables                        │
│  core_entities │ universal_transactions │ core_dynamic_data     │
│  core_relationships │ universal_transaction_lines │             │
└─────────────────────────────────────────────────────────────────┘
```

## 💰 Cost Optimization Strategy

### 24-Hour Window Management
- **Within Window**: Free-form messages allowed (no cost)
- **Outside Window**: Template messages required (paid)
- **Window Tracking**: Real-time expiry monitoring

### Smart Message Routing
```typescript
if (window.state === 'open') {
  // Free message - optimize for conversion
  return craftLowestTurnMessage(slots, intent)
} else {
  // Paid template - ensure business value
  return selectOptimalTemplate(intent, context)
}
```

### Budget Guards
- Daily spend limits by category
- Marketing message throttling
- Real-time cost tracking
- Automatic budget resets

## 🛠️ Key Components

### 1. WhatsApp Desktop UI (`/src/app/salon-whatsapp-desktop/page.tsx`)

**Features**:
- WhatsApp-style chat interface
- Real-time window state indicators
- Cost metrics dashboard
- MCP tools status panel
- Message status tracking

**Key Functions**:
```typescript
// Window status calculation
const getWindowStatus = (contact: Contact) => {
  if (contact.windowState === 'open') {
    const hoursLeft = calculateHoursRemaining(contact.windowExpiresAt)
    return {
      text: `${hoursLeft}h left`,
      color: getColorByUrgency(hoursLeft)
    }
  }
  return { text: 'Closed', color: 'text-gray-600' }
}
```

### 2. MCP Tools Service (`/src/lib/mcp/whatsapp-mcp-tools.ts`)

**Available Tools**:
- `calendar.find_slots` - Find available appointment slots
- `calendar.book` - Book appointment slot
- `wa.send` - Send WhatsApp message (free-form or template)
- `wa.window_state` - Check 24h window state
- `hera.txn.write` - Write transaction to HERA
- `hera.entity.upsert` - Create/update entities
- `consent.get` - Check marketing consent
- `budget.check` - Verify budget allowance
- `pricing.estimate` - Estimate message cost
- `ics.generate` - Generate calendar file

**Tool Contract Example**:
```typescript
interface MCPToolResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  metadata?: Record<string, any>
}
```

### 3. Claude AI Service (`/src/lib/ai/claude-whatsapp-service.ts`)

**Core Functions**:
- `extractIntent()` - Natural language understanding
- `selectTemplate()` - Optimal template selection
- `craftLowestTurnMessage()` - Minimize conversation turns
- `validateSmartCode()` - Ensure smart code compliance

**Intent Detection**:
```typescript
const intent = await claude.extractIntent(message, customerData)
// Returns: { intent: 'book_appointment', entities: {...}, confidence: 0.85 }
```

### 4. Message Router (`/src/lib/whatsapp/message-router.ts`)

**Routing Logic**:
1. Check window state
2. Extract intent with Claude
3. Route based on window:
   - Open: Free-form response
   - Closed: Template selection
4. Apply budget guards
5. Log to HERA

## 📊 Sacred Table Integration

### Entity Storage
```sql
-- Customer
INSERT INTO core_entities (entity_type, entity_name, smart_code)
VALUES ('customer', 'Sarah Johnson', 'HERA.SALON.CUSTOMER.PERSON.v1');

-- WhatsApp Contact
INSERT INTO core_dynamic_data (entity_id, field_name, field_value_text)
VALUES (customer_id, 'wa_contact_id', 'wa_447700900123');
```

### Transaction Logging
```sql
-- Message Send
INSERT INTO universal_transactions (
  transaction_type, 
  smart_code,
  metadata
) VALUES (
  'WHATSAPP_MESSAGE_SEND',
  'HERA.SALON.WHATSAPP.MESSAGE.TEMPLATE.v1',
  '{"template_id": "BOOKING_CONFIRM_v1", "cost": 0.05}'
);
```

### Relationship Tracking
```sql
-- Customer → Message
INSERT INTO core_relationships (
  from_entity_id,
  to_entity_id,
  relationship_type,
  smart_code
) VALUES (
  customer_id,
  message_txn_id,
  'sent_message',
  'HERA.SALON.REL.CUSTOMER.MESSAGE.v1'
);
```

## 🚀 Implementation Steps

### 1. Environment Setup
```bash
# WhatsApp Configuration
WHATSAPP_BUSINESS_ID=your_business_id
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_ACCESS_TOKEN=your_access_token

# Claude AI
CLAUDE_API_KEY=your_claude_api_key

# HERA Configuration
DEFAULT_ORGANIZATION_ID=salon_org_uuid
```

### 2. Deploy Components
1. Deploy WhatsApp webhook endpoint
2. Configure MCP server with tools
3. Set up Claude AI integration
4. Initialize message router
5. Launch desktop UI

### 3. Configure Templates
```typescript
const templates = [
  {
    id: 'APPOINTMENT_CONFIRM_v1',
    category: 'utility',
    cost: 0.05,
    variables: ['name', 'service', 'date', 'time']
  },
  {
    id: 'WINBACK_30D_v1',
    category: 'marketing',
    cost: 0.08,
    variables: ['name', 'discount']
  }
]
```

### 4. Set Budget Limits
```typescript
const budgetConfig = {
  daily: {
    utility: 50.00,    // Higher for transactional
    marketing: 20.00   // Lower for promotional
  },
  reset_time: '00:00 UTC'
}
```

## 📈 Monitoring & Analytics

### Key Metrics
- **Window Utilization Rate**: % of messages sent within free window
- **Cost per Appointment**: Total WhatsApp spend / bookings
- **Template Performance**: CTR by template type
- **Response Times**: Average time to first response
- **Conversion Rates**: Inquiries → Confirmed bookings

### Cost Dashboard
```typescript
const metrics = {
  dailySpend: 12.45,
  budgetUsed: 24.9%, // $12.45 / $50.00
  paidSendRate: 0.23, // 23% require templates
  costPerAppointment: 0.85,
  windowUtilization: 0.78 // 78% sent free
}
```

## 🔒 Security & Compliance

### Data Protection
- End-to-end encryption for messages
- Organization-based isolation
- No cross-tenant data access
- Audit trails for all operations

### GDPR Compliance
- Explicit consent tracking
- Data retention policies
- Right to erasure support
- Export capabilities

## 🎯 Best Practices

### 1. Window Optimization
- Proactively engage within window
- Use templates only when necessary
- Track window expiry times
- Batch non-urgent messages

### 2. Template Management
- Keep template catalog minimal
- A/B test template performance
- Monitor approval status
- Version control templates

### 3. Cost Control
- Set conservative daily budgets
- Prioritize utility over marketing
- Monitor cost per outcome
- Regular spend analysis

### 4. User Experience
- Clear, concise messaging
- Minimal conversation turns
- Quick slot suggestions
- Instant confirmations

## 🔧 Troubleshooting

### Common Issues

1. **Window State Incorrect**
   - Verify webhook configuration
   - Check message timestamps
   - Validate window calculation

2. **Template Not Approved**
   - Review template content
   - Check Facebook Business Manager
   - Ensure compliance with policies

3. **Budget Exceeded**
   - Review daily limits
   - Check reset timing
   - Analyze spend patterns

4. **Message Delivery Failures**
   - Verify phone number format
   - Check WhatsApp Business status
   - Review error logs

## 📚 Resources

- [WhatsApp Business API Docs](https://developers.facebook.com/docs/whatsapp)
- [MCP Protocol Specification](https://modelcontextprotocol.io)
- [Claude API Reference](https://docs.anthropic.com)
- [HERA Sacred Tables Guide](./CLAUDE.md)

## 🚀 Next Steps

1. **Enhanced AI Capabilities**
   - Multi-language support
   - Voice message processing
   - Sentiment analysis

2. **Advanced Cost Optimization**
   - Predictive window management
   - Smart batching algorithms
   - Dynamic budget allocation

3. **Business Intelligence**
   - Customer lifetime value tracking
   - Service recommendation engine
   - Churn prediction models

## Conclusion

This WhatsApp desktop implementation provides a production-ready solution that balances customer experience with cost efficiency. By leveraging the 24-hour window, intelligent routing, and HERA's universal architecture, salons can offer seamless booking experiences while maintaining profitable unit economics.