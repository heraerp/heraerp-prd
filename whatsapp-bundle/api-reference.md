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

### 2. Test Endpoints

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
    "total_messages": 5,
    "recent_messages": [...]
  }
}
```

#### GET /debug-dashboard
Provides detailed debugging information

**Response:**
```json
{
  "status": "success",
  "data": {
    "totalConversations": 2,
    "totalMessages": 10,
    "conversationsWithMessages": [...],
    "rawData": {
      "conversations": [...],
      "messages": [...]
    }
  }
}
```

## Message Processing Flow

### 1. Incoming Message Structure
```typescript
interface WhatsAppMessage {
  from: string           // Phone number
  text: string          // Message content
  message_id: string    // Unique message ID
  type: 'text' | 'interactive' | 'image' | 'document'
  timestamp: string     // Unix timestamp
}
```

### 2. Intent Recognition
The system recognizes these intents:

**Customer Intents:**
- `book_appointment` - Book salon appointment
- `cancel_appointment` - Cancel existing booking
- `reschedule_appointment` - Change appointment time
- `view_services` - See service menu
- `check_loyalty` - View loyalty points

**Staff Intents:**
- `staff_schedule` - View daily schedule
- `staff_checkin` - Check in client
- `complete_service` - Mark service complete
- `staff_break` - Take a break

### 3. Response Types

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

## Error Handling

All endpoints return consistent error responses:

```json
{
  "status": "error",
  "error": "Error message",
  "details": {
    "code": "ERROR_CODE",
    "context": {}
  }
}
```

Common error codes:
- `MISSING_ENV_VARS` - Required environment variables not set
- `INVALID_TOKEN` - Webhook verification failed
- `DB_ERROR` - Database operation failed
- `PROCESSING_ERROR` - Message processing failed

## Rate Limits

- Webhook: 100 requests per minute
- Test endpoints: 10 requests per minute
- Message sending: Follow WhatsApp limits (1000 messages/second)

## Security

1. **Webhook Verification**: All webhook calls verified with token
2. **Organization Isolation**: Multi-tenant security via organization_id
3. **Service Role**: Uses Supabase service role for database operations
4. **HTTPS Only**: All endpoints require HTTPS

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