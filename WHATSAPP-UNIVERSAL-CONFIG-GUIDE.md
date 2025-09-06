# HERA Universal Configuration: WhatsApp + MCP + AI

## 🎯 Revolutionary Self-Service Configuration System

HERA's Universal Configuration system gives organizations **complete control** over their WhatsApp + MCP + AI integration through the Sacred Six tables. **Zero hardcoding** - everything is configuration-driven and self-serviceable.

## 🧬 Architecture: Sacred Six Implementation

All configuration lives in HERA's universal architecture:

### Smart Code Namespaces
```typescript
const ConfigSmartCodes = {
  WHATSAPP_CHANNEL: 'HERA.COMMS.WHATSAPP.CONFIG.V1',      // WhatsApp connection
  AI_ROUTING: 'HERA.AI.ROUTING.CONFIG.V1',                // AI provider routing
  MCP_TOOLMAP: 'HERA.MCP.TOOLMAP.CONFIG.V1',             // Intent → Tool mapping
  AI_PROMPTS: 'HERA.AI.PROMPT.CONFIG.V1',                // Provider-specific prompts
  KEYWORDS: 'HERA.COMMS.WHATSAPP.KEYWORDS.V1',           // Rule-based fallback
  CONFIG_USES: 'HERA.CONFIG.USES.V1'                     // Configuration relationships
}
```

### Universal Storage Pattern

#### core_entities (WHAT)
- **WhatsApp Channel**: Phone number, webhook settings, rate limits
- **AI Routing Policy**: Provider priority, fallback rules, cost caps
- **MCP Tool Map**: Intent-to-tool mappings, routing strategies
- **Prompt Pack**: Provider-specific templates and guardrails
- **Keyword Rules**: Rule-based fallback patterns

#### core_dynamic_data (HOW)
All configuration parameters stored as JSON in dynamic fields:

```json
{
  "smart_code": "HERA.AI.ROUTING.CONFIG.V1",
  "providers": [
    {
      "name": "anthropic_claude",
      "priority": 1,
      "enabled": true,
      "timeout_ms": 8000,
      "cost_tier": "complex",
      "fallback_on": ["timeout", "5xx", "rate_limit"]
    },
    {
      "name": "openai_gpt4", 
      "priority": 2,
      "enabled": true,
      "timeout_ms": 6000,
      "cost_tier": "standard"
    }
  ],
  "cost_guardrails": {
    "daily_usd_cap": 50,
    "per_msg_usd_cap": 0.05
  }
}
```

#### core_relationships (WHY)
Link configurations together:
```
WhatsApp Channel → USES → AI Routing Policy
AI Routing Policy → USES → Prompt Pack
AI Routing Policy → USES → Keyword Rules
AI Routing Policy → USES → MCP Tool Map
```

#### universal_transactions (WHEN)
Every message interaction recorded:
```json
{
  "transaction_type": "whatsapp_message",
  "transaction_code": "WA-MSG-12345",
  "smart_code": "HERA.COMMS.WHATSAPP.MESSAGE.V1",
  "metadata": {
    "direction": "INBOUND",
    "provider_selected": "anthropic_claude",
    "ai_confidence": 0.85,
    "cost_usd": 0.012,
    "fallback_triggered": false
  }
}
```

#### universal_transaction_lines (DETAILS)
Complete audit trail:
```json
[
  { "line_type": "RAW_MESSAGE", "metadata": {"text": "book haircut"} },
  { "line_type": "PARSED_INTENT", "metadata": {"intent": "BOOK", "confidence": 0.85} },
  { "line_type": "MCP_CALL", "metadata": {"tool": "ucr.availability.getSlots"} },
  { "line_type": "MCP_RESULT", "metadata": {"slots": 3} },
  { "line_type": "OUTBOUND_TEXT", "metadata": {"message": "Available times..."} }
]
```

## 🚀 Customer Self-Service APIs

### Get All Configurations
```bash
curl "https://heraerp.com/api/v1/whatsapp/config?organization_id=your-org-id"
```

Response:
```json
{
  "success": true,
  "configurations": {
    "channel": { "phone_number": "+1234567890", "provider": "meta_cloud_api" },
    "routing": { "providers": [...], "cost_guardrails": {...} },
    "toolmap": { "intents": [...] },
    "prompts": { "templates": [...] },
    "keywords": { "rules": [...] }
  },
  "provider_tests": {
    "anthropic_claude": { "success": true, "latency": 245 },
    "openai_gpt4": { "success": true, "latency": 389 }
  }
}
```

### Setup Default Configuration
```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/config \
  -H "Content-Type: application/json" \
  -d '{
    "action": "setup_defaults",
    "organization_id": "your-org-id",
    "phone_number": "+1234567890"
  }'
```

### Update AI Provider Priority
```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/config \
  -H "Content-Type: application/json" \
  -d '{
    "action": "upsert_routing",
    "organization_id": "your-org-id",
    "config_data": {
      "providers": [
        {
          "name": "openai_gpt4",
          "priority": 1,
          "enabled": true,
          "timeout_ms": 5000
        },
        {
          "name": "anthropic_claude", 
          "priority": 2,
          "enabled": true,
          "timeout_ms": 8000
        }
      ]
    }
  }'
```

### Toggle Provider On/Off
```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/config \
  -H "Content-Type: application/json" \
  -d '{
    "action": "toggle_provider",
    "organization_id": "your-org-id",
    "provider_name": "anthropic_claude",
    "enabled": false
  }'
```

### Test Specific Provider
```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/config \
  -H "Content-Type: application/json" \
  -d '{
    "action": "test_provider",
    "organization_id": "your-org-id",
    "provider_name": "openai_gpt4"
  }'
```

## 📋 Configuration Examples

### WhatsApp Channel Config
```json
{
  "smart_code": "HERA.COMMS.WHATSAPP.CONFIG.V1",
  "phone_number": "+1234567890",
  "provider": "meta_cloud_api",
  "webhook_secret": "your-secure-token",
  "outbound_policy": {
    "typing_indicator": true,
    "delivery_receipts": "log_only",
    "template_namespace": "hera_default"
  },
  "rate_limits": {"rpm": 60, "burst": 10},
  "retry_policy": {"max_retries": 3, "backoff": "exponential"}
}
```

### AI Routing Policy
```json
{
  "smart_code": "HERA.AI.ROUTING.CONFIG.V1",
  "providers": [
    {
      "name": "anthropic_claude",
      "priority": 1,
      "enabled": true,
      "timeout_ms": 8000,
      "max_tokens": 2048,
      "cost_tier": "complex",
      "match": {
        "intent": ["BOOK", "RESCHEDULE", "CANCEL"],
        "complexity": ">=medium"
      },
      "fallback_on": ["timeout", "5xx", "rate_limit"]
    }
  ],
  "cost_guardrails": {
    "daily_usd_cap": 50,
    "per_msg_usd_cap": 0.05
  },
  "observability": {
    "log_prompts": "redact_pii",
    "trace_level": "basic"
  }
}
```

### MCP Tool Map
```json
{
  "smart_code": "HERA.MCP.TOOLMAP.CONFIG.V1",
  "intents": [
    {
      "intent": "BOOK",
      "tools": [
        "ucr.calendar.createBooking",
        "ucr.availability.getSlots"
      ]
    },
    {
      "intent": "CANCEL",
      "tools": ["ucr.calendar.cancelBooking"]
    }
  ],
  "routing": {
    "resolver": "intent_first_then_tool",
    "unknown_intent_strategy": "ask_clarifying_or_rule_based"
  }
}
```

### Prompt Pack
```json
{
  "smart_code": "HERA.AI.PROMPT.CONFIG.V1",
  "pack_name": "booking_default",
  "templates": [
    {
      "provider": "anthropic_claude",
      "intent": "BOOK",
      "system": "You are UniversalWhatsAppAI for a salon. Extract booking details.",
      "user_template": "User said: {{message}}. Extract: service, date, time.",
      "tool_contract": {
        "required_fields": ["service", "date", "time"],
        "on_missing": "ask_one_question"
      }
    }
  ]
}
```

### Keyword Rules (Fallback)
```json
{
  "smart_code": "HERA.COMMS.WHATSAPP.KEYWORDS.V1",
  "rules": [
    {
      "match": "^\\s*book\\b|haircut|appointment",
      "intent": "BOOK",
      "confidence": 0.6
    },
    {
      "match": "\\b(cancel|stop)\\b",
      "intent": "CANCEL",
      "confidence": 0.7
    }
  ]
}
```

## 🎛️ Complete Customer Control

### What Customers Can Configure

#### 1. AI Provider Management
- **Add/Remove Providers**: Support for Claude, OpenAI, Gemini, local models
- **Priority Ordering**: Which AI to try first, second, third
- **Timeout Settings**: Custom timeouts per provider
- **Cost Controls**: Daily caps, per-message limits
- **Fallback Rules**: When to switch providers

#### 2. Intent & Tool Mapping
- **Custom Intents**: Define business-specific intents beyond BOOK/CANCEL
- **Tool Routing**: Map intents to specific MCP tools
- **Unknown Intent Handling**: Strategy for unrecognized messages

#### 3. Prompt Engineering
- **Provider-Specific Prompts**: Optimize for Claude vs OpenAI
- **System Messages**: Define AI personality and behavior
- **Output Schemas**: Enforce structured responses
- **Guardrails**: Prevent inappropriate responses

#### 4. Keyword Fallbacks
- **Regex Patterns**: Custom keyword matching
- **Confidence Scoring**: Reliability of matches
- **Multilingual Support**: Keywords in multiple languages

#### 5. Rate Limiting & Retries
- **Request Limits**: RPM and burst controls
- **Backoff Strategies**: Exponential or linear
- **Error Handling**: What to do when providers fail

### Self-Service Operations

#### Instant Provider Switching
```bash
# Switch from Claude to OpenAI as primary
curl -X POST https://heraerp.com/api/v1/whatsapp/config \
  -d '{"action": "toggle_provider", "provider_name": "anthropic_claude", "enabled": false}'

curl -X POST https://heraerp.com/api/v1/whatsapp/config \
  -d '{"action": "upsert_routing", "config_data": {"providers": [{"name": "openai_gpt4", "priority": 1}]}}'
```

#### A/B Test Prompts
```bash
# Deploy new prompt template
curl -X PUT https://heraerp.com/api/v1/whatsapp/config \
  -d '{
    "entity_id": "prompt-pack-id",
    "updates": {
      "templates": [{
        "provider": "anthropic_claude",
        "intent": "BOOK", 
        "system": "New optimized system prompt..."
      }]
    }
  }'
```

#### Cost Monitoring
```bash
# Check real-time costs
curl "https://heraerp.com/api/v1/whatsapp/analytics?metric=daily_costs"

# Update cost caps
curl -X PUT https://heraerp.com/api/v1/whatsapp/config \
  -d '{
    "entity_id": "routing-policy-id",
    "updates": {
      "cost_guardrails": {"daily_usd_cap": 25}
    }
  }'
```

## 🔍 Execution Flow (Zero Hardcoding)

### 1. Message Received
- WhatsApp webhook receives message
- UniversalWhatsAppHandler loads org configurations
- All processing rules come from database

### 2. Provider Selection
- Load AI Routing Policy from core_entities
- Check cost guardrails in real-time
- Select next available provider by priority

### 3. Intent Processing
- Use configured prompts for selected provider
- Apply provider-specific timeouts and token limits
- Log all attempts in universal_transactions

### 4. Fallback Handling
- Auto-fallback based on configured triggers
- Try next priority provider
- Final fallback to rule-based keywords

### 5. MCP Tool Execution
- Load tool mappings from configuration
- Execute mapped tools for detected intent
- Log all tool calls and results

### 6. Response Generation
- Use configured response templates
- Apply organization-specific tone/style
- Send via configured WhatsApp channel

### 7. Complete Audit Trail
- Every step logged in universal_transaction_lines
- Full cost tracking and provider performance
- Perfect debugging and optimization data

## 📊 Analytics & Monitoring

### Real-Time Dashboards
```sql
-- Provider success rates
SELECT 
  metadata->>'provider_selected' as provider,
  COUNT(*) as total_messages,
  SUM(CASE WHEN transaction_status = 'SUCCESS' THEN 1 ELSE 0 END)::FLOAT / COUNT(*) * 100 as success_rate,
  AVG(CAST(metadata->>'cost_usd' AS FLOAT)) as avg_cost
FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'provider_selected';

-- Fallback analysis
SELECT 
  DATE(created_at) as date,
  COUNT(CASE WHEN metadata->>'fallback_triggered' = 'true' THEN 1 END) as fallbacks,
  COUNT(*) as total_messages,
  ROUND(COUNT(CASE WHEN metadata->>'fallback_triggered' = 'true' THEN 1 END)::NUMERIC / COUNT(*) * 100, 2) as fallback_rate
FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- Cost tracking
SELECT 
  organization_id,
  DATE(created_at) as date,
  SUM(CAST(metadata->>'cost_usd' AS FLOAT)) as daily_cost,
  COUNT(*) as message_count
FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message'
  AND metadata->>'cost_usd' IS NOT NULL
GROUP BY organization_id, DATE(created_at);
```

## 🛠️ Implementation Checklist

### For New Organizations
1. **Setup Default Config**:
   ```bash
   curl -X POST /api/v1/whatsapp/config \
     -d '{"action": "setup_defaults", "phone_number": "+1234567890"}'
   ```

2. **Test All Providers**:
   ```bash
   curl /api/v1/whatsapp/config?organization_id=your-id
   ```

3. **Customize Settings**:
   - Adjust AI provider priorities
   - Set cost guardrails
   - Configure business-specific prompts
   - Add custom keywords

4. **Monitor Performance**:
   - Track provider success rates
   - Monitor costs vs budgets
   - Analyze fallback patterns

### For Existing Organizations
1. **Migration**: Existing configs automatically loaded
2. **Enhancement**: Add new providers or intents
3. **Optimization**: A/B test different configurations
4. **Scaling**: Adjust rate limits and cost caps

## 🎯 Business Benefits

### For HERA
- **Zero Support Tickets**: Customers self-configure everything
- **Rapid Deployment**: New orgs online in minutes
- **Easy Scaling**: Add new AI providers without code changes
- **Perfect Isolation**: Each org's config is independent

### for Organizations
- **Complete Control**: No waiting for HERA team
- **Real-time Changes**: Instant configuration updates
- **Cost Management**: Granular control over AI spending
- **Business Intelligence**: Complete audit trail of all interactions

## 🚀 Future Enhancements

### Planned Features
1. **Visual Config UI**: Drag-and-drop configuration builder
2. **ML Optimization**: Auto-optimize provider selection
3. **Template Marketplace**: Share successful configurations
4. **Advanced Analytics**: Predictive cost and performance models

---

**Last Updated**: December 2024  
**Version**: 1.0  
**Smart Code**: HERA.DOCS.WHATSAPP.UNIVERSAL.CONFIG.v1

**The Revolutionary Achievement**: 100% customer-controlled WhatsApp + MCP + AI integration with **zero hardcoding** using only HERA's Sacred Six tables.