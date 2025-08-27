# WhatsApp Integration API Reference

## Base URL
```
https://heraerp.com/api/v1/whatsapp
```

## Endpoints

### 1. Webhook Handler

#### GET /webhook
Handles WhatsApp webhook verification

**Query Parameters:**
- `hub.mode` (string): Should be "subscribe"
- `hub.verify_token` (string): Your verification token
- `hub.challenge` (string): Challenge to echo back

**Response:**
- Success: Returns the challenge string
- Error: 403 Forbidden

**Example:**
```bash
curl -X GET "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test123"
```

#### POST /webhook
Receives WhatsApp messages

**Request Body:**
```json
{
  "object": "whatsapp_business_account",
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "919945896033",
          "id": "MESSAGE_ID",
          "timestamp": "1693345678",
          "text": {
            "body": "Hello"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

**Response:**
```json
{
  "status": "received"
}
```

### 2. Debug & Testing Endpoints

#### GET /debug-dashboard
Provides complete system overview without authentication

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalConversations": 2,
    "totalMessages": 14,
    "conversationsWithMessages": [
      {
        "conversation": {
          "id": "uuid",
          "entity_code": "WA-919945896033",
          "entity_name": "WhatsApp: CustomerName",
          "metadata": {
            "phone": "919945896033",
            "sender_type": "customer"
          }
        },
        "messages": [
          {
            "id": "uuid",
            "text": "Hello",
            "direction": "inbound",
            "created_at": "2024-08-27T10:00:00Z"
          }
        ],
        "lastMessage": {...}
      }
    ]
  }
}
```

#### GET /test-store
Tests message storage functionality

**Response:**
```json
{
  "status": "success",
  "test_result": {
    "message_stored": true,
    "stored_id": "uuid",
    "conversation_used": "uuid",
    "total_messages": 14,
    "recent_messages": [...]
  }
}
```

#### GET /dashboard-test
Tests dashboard query logic

**Response:**
```json
{
  "status": "success",
  "organizationId": "44d2d8f8-167d-46a7-a704-c0e5435863d6",
  "totalConversations": 2,
  "conversations": [
    {
      "id": "uuid",
      "phone": "919945896033",
      "name": "Customer Name",
      "lastMessage": "Hello",
      "lastMessageTime": "2024-08-27T10:00:00Z",
      "hasLastMessage": true
    }
  ],
  "dashboardUrl": "https://heraerp.com/salon/whatsapp",
  "note": "If this shows data but dashboard doesn't, check authentication"
}
```

## Message Processing

### Intent Recognition
The system automatically recognizes these intents:

**Customer Intents:**
- `book_appointment` - "I want to book an appointment"
- `cancel_appointment` - "Cancel my appointment"
- `reschedule_appointment` - "Change my appointment time"
- `view_services` - "What services do you offer?"
- `check_loyalty` - "Check my points"
- `greeting` - General greetings

**Staff Intents:**
- `staff_schedule` - "Show my schedule"
- `staff_checkin` - "Check in Sarah Johnson"
- `complete_service` - "Complete service"
- `staff_break` - "Taking a break"

### Response Types

#### Text Response
```json
{
  "type": "text",
  "text": {
    "body": "Your message here"
  }
}
```

#### Interactive Button Response
```json
{
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "What would you like to do?"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "book_now",
            "title": "📅 Book Appointment"
          }
        }
      ]
    }
  }
}
```

#### List Response
```json
{
  "type": "list",
  "interactive": {
    "type": "list",
    "header": {
      "type": "text",
      "text": "Available Times"
    },
    "body": {
      "text": "Select your preferred slot:"
    },
    "action": {
      "button": "View Times",
      "sections": [
        {
          "title": "Morning Slots",
          "rows": [
            {
              "id": "slot_1",
              "title": "9:00 AM",
              "description": "Available"
            }
          ]
        }
      ]
    }
  }
}
```

## Database Schema

### Conversations (core_entities)
```typescript
{
  entity_type: 'whatsapp_conversation',
  entity_code: 'WA-919945896033',
  entity_name: 'WhatsApp: Customer Name',
  smart_code: 'HERA.WHATSAPP.CONV.CUSTOMER.v1',
  metadata: {
    phone: '+919945896033',
    sender_type: 'customer',
    sender_id: 'entity-uuid',
    created_at: '2024-08-27T10:00:00Z'
  }
}
```

### Messages (universal_transactions)
```typescript
{
  transaction_type: 'whatsapp_message',
  transaction_code: 'MSG-1693345678000',
  transaction_date: '2024-08-27T10:00:00Z',
  total_amount: 0,
  source_entity_id: 'conversation-uuid',  // For inbound
  target_entity_id: 'conversation-uuid',  // For outbound
  smart_code: 'HERA.WHATSAPP.MSG.INBOUND.v1',
  metadata: {
    message_id: 'wamid.xxx',
    text: 'Hello',
    direction: 'inbound',
    timestamp: '2024-08-27T10:00:00Z',
    intent: 'greeting'
  }
}
```

## Testing

### Send Test Message
```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919945896033",
            "text": {"body": "Test message"},
            "type": "text",
            "id": "test_123",
            "timestamp": "1693345678"
          }]
        }
      }]
    }]
  }'
```

### Check Storage
```bash
curl https://heraerp.com/api/v1/whatsapp/test-store | jq
```

### Debug Dashboard
```bash
curl https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq
```

## Error Codes

| Code | Description | Solution |
|------|-------------|----------|
| 403 | Invalid webhook token | Check WHATSAPP_WEBHOOK_VERIFY_TOKEN |
| 404 | Endpoint not found | Wait for deployment or check URL |
| 500 | Server error | Check Railway logs |
| NO_ORG | Organization not found | Set DEFAULT_ORGANIZATION_ID |
| STORE_ERROR | Message storage failed | Check required fields |

## Rate Limits

- Webhook: 100 requests per minute
- Debug endpoints: 10 requests per minute
- Message sending: Follow WhatsApp limits (1000/sec)

## Security

1. **Webhook Verification**: All webhook calls verified with token
2. **Organization Isolation**: Multi-tenant security via organization_id
3. **Service Role**: Uses Supabase service role for database operations
4. **HTTPS Only**: All endpoints require HTTPS
5. **Authentication**: Dashboard requires login for data access