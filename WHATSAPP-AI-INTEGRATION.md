# HERA WhatsApp AI Integration - Multi-Provider System

## Overview

HERA WhatsApp integration now features a multi-provider AI system with automatic fallback capabilities. The system uses Claude AI as the primary provider and OpenAI GPT-4 as an automatic fallback.

## Architecture

### AI Provider Hierarchy

1. **Primary**: Claude AI (Anthropic)
2. **Fallback**: OpenAI GPT-4
3. **Final Fallback**: Rule-based extraction

### How It Works

```
WhatsApp Message
    ↓
Universal AI Service
    ↓
Try Claude AI
    ↓ (if failed)
Try OpenAI GPT-4
    ↓ (if failed)
Rule-based Processing
    ↓
Response to Customer
```

## Configuration

### Environment Variables

```bash
# Claude AI (Primary)
CLAUDE_API_KEY=your_claude_api_key_here

# OpenAI (Fallback)
OPENAI_API_KEY=your_openai_api_key_here

# WhatsApp Configuration
WHATSAPP_ACCESS_TOKEN=your_whatsapp_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
DEFAULT_ORGANIZATION_ID=your_org_id
```

### Provider Status Check

Test AI providers availability:
```bash
curl https://heraerp.com/api/v1/whatsapp/test-ai
```

Response:
```json
{
  "status": "WhatsApp AI Provider Test",
  "providers": [
    { "name": "claude", "available": true, "priority": 1 },
    { "name": "openai", "available": true, "priority": 2 }
  ],
  "provider_tests": {
    "claude": true,
    "openai": true
  },
  "test_results": {
    "claude_extraction": {
      "intent": "book_appointment",
      "entities": { "services": ["cut"], "date_hint": "tomorrow" },
      "confidence": 0.85
    },
    "openai_extraction": {
      "intent": "book_appointment",
      "entities": { "services": ["haircut"], "date_hint": "tomorrow" },
      "confidence": 0.7
    }
  }
}
```

## Features

### Intent Extraction

Both providers can extract:
- **Intents**: book_appointment, cancel_appointment, reschedule, check_availability
- **Services**: haircut, color, treatment, nails, makeup
- **Time Hints**: today, tomorrow, this_week, specific times
- **Stylist Preferences**: preferred stylist names

### Template Selection

AI selects appropriate WhatsApp templates based on:
- Customer intent
- Conversation context
- 24-hour window state
- Marketing consent

### Response Generation

AI crafts optimal responses to:
- Minimize conversation turns
- Provide specific options
- Guide booking completion
- Maintain friendly tone

## Usage Examples

### Test Specific Provider

```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/test-ai \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I want to book a haircut with Emma tomorrow",
    "provider": "openai"
  }'
```

### Automatic Fallback Example

When Claude fails:
```
[2024-12-09 10:15:23] 🧠 Attempting intent extraction with Claude...
[2024-12-09 10:15:24] ❌ Claude intent extraction failed: Rate limit exceeded
[2024-12-09 10:15:24] 🧠 Attempting intent extraction with OpenAI...
[2024-12-09 10:15:25] ✅ OpenAI intent extraction successful
```

## Benefits

### Reliability
- **99.9% Uptime**: Automatic fallback ensures continuous service
- **No Single Point of Failure**: Multiple AI providers
- **Graceful Degradation**: Rule-based fallback always available

### Performance
- **Parallel Processing**: Providers can be queried simultaneously
- **Smart Routing**: Use best provider for specific tasks
- **Cost Optimization**: Route to most cost-effective provider

### Flexibility
- **Provider Agnostic**: Easy to add new AI providers
- **A/B Testing**: Compare provider performance
- **Custom Routing**: Route based on message type

## Cost Management

### Provider Costs
- **Claude**: $0.003 per 1K tokens (input), $0.015 per 1K tokens (output)
- **OpenAI GPT-4**: $0.03 per 1K tokens (input), $0.06 per 1K tokens (output)
- **Rule-based**: Free (no API costs)

### Optimization Strategies
1. Use Claude for complex intent extraction
2. Use OpenAI for simple responses
3. Cache common responses
4. Batch similar requests

## Advanced Configuration

### Custom Provider Priority

```typescript
// In universal-whatsapp-ai.ts
this.providers = [
  { name: 'openai', available: true, priority: 1 },  // Make OpenAI primary
  { name: 'claude', available: true, priority: 2 }
]
```

### Task-Specific Routing

```typescript
// Route booking intents to Claude
if (intent.intent === 'book_appointment') {
  return await this.extractIntentWithClaude(message)
}

// Route general queries to OpenAI
return await this.extractIntentWithOpenAI(message)
```

### Add New Provider (e.g., Gemini)

```typescript
// Initialize Gemini
if (process.env.GEMINI_API_KEY) {
  this.geminiClient = new GeminiClient(process.env.GEMINI_API_KEY)
  this.providers.push({
    name: 'gemini',
    available: true,
    priority: 3
  })
}
```

## Monitoring & Analytics

### Track Provider Usage

```sql
-- Provider performance metrics
SELECT 
  metadata->>'ai_provider' as provider,
  COUNT(*) as requests,
  AVG(CAST(metadata->>'response_time' AS FLOAT)) as avg_response_time,
  SUM(CASE WHEN metadata->>'success' = 'true' THEN 1 ELSE 0 END)::FLOAT / COUNT(*) as success_rate
FROM universal_transactions
WHERE transaction_type = 'whatsapp_ai_request'
  AND created_at >= NOW() - INTERVAL '24 hours'
GROUP BY metadata->>'ai_provider';
```

### Provider Health Dashboard

```typescript
// Real-time provider status
const providerHealth = {
  claude: {
    status: 'healthy',
    latency: '245ms',
    success_rate: '98.5%',
    last_error: null
  },
  openai: {
    status: 'healthy',
    latency: '389ms', 
    success_rate: '96.2%',
    last_error: '2 hours ago'
  }
}
```

## Troubleshooting

### Common Issues

1. **Both Providers Failing**
   - Check API keys are set correctly
   - Verify network connectivity
   - Check provider service status
   - Rule-based fallback will activate

2. **Slow Response Times**
   - Monitor provider latency
   - Consider caching frequent queries
   - Implement timeout controls

3. **Inconsistent Results**
   - Compare provider outputs
   - Adjust confidence thresholds
   - Fine-tune prompts per provider

### Debug Mode

```bash
# Enable detailed AI logging
export AI_DEBUG=true
export LOG_PROVIDER_DECISIONS=true
```

## Future Enhancements

1. **Smart Provider Selection**
   - ML model to predict best provider per message
   - Historical performance analysis
   - Cost/quality optimization

2. **Multi-Modal Support**
   - Voice message transcription
   - Image analysis for style references
   - Document parsing for forms

3. **Conversation Memory**
   - Context preservation across sessions
   - Customer preference learning
   - Personalized responses

## Security Considerations

- **API Key Rotation**: Rotate keys monthly
- **Request Validation**: Validate all inputs
- **PII Handling**: Never log sensitive data
- **Rate Limiting**: Implement per-provider limits
- **Audit Trail**: Log all AI decisions

---

**Last Updated**: December 2024
**Version**: 2.0
**Smart Code**: HERA.DOCS.WHATSAPP.AI.MULTI.v2