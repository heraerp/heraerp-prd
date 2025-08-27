# 📚 WhatsApp Integration API Reference

## Endpoints

### 1. Webhook Endpoint
**URL**: `POST /api/v1/whatsapp/webhook`

Receives incoming WhatsApp messages and status updates.

**Webhook Verification (GET)**:
```http
GET /api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE
```

**Message Receipt (POST)**:
```json
{
  "entry": [{
    "id": "WABA_ID",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "PHONE",
          "phone_number_id": "PHONE_ID"
        },
        "messages": [{
          "from": "SENDER_NUMBER",
          "id": "MESSAGE_ID",
          "timestamp": "TIMESTAMP",
          "text": { "body": "MESSAGE_TEXT" },
          "type": "text"
        }]
      },
      "field": "messages"
    }]
  }]
}
```

### 2. Test Endpoint
**URL**: `GET /api/v1/whatsapp/test`

Returns current WhatsApp integration status.

**Response**:
```json
{
  "status": "WhatsApp Integration Test Endpoint",
  "config": {
    "webhook_token_set": true,
    "access_token_set": true,
    "phone_number_id_set": true,
    "business_account_id_set": true,
    "organization_id_set": true
  },
  "recent_messages": [...],
  "recent_conversations": [...],
  "webhook_url": "https://heraerp.com/api/v1/whatsapp/webhook",
  "verify_token": "hera-whatsapp-webhook-2024-secure-token"
}
```

### 3. Dashboard UI
**URL**: `GET /salon/whatsapp`

React-based dashboard for viewing and managing WhatsApp conversations.

## Message Processor Methods

### processMessage(message)
Main method that orchestrates message processing.

**Parameters**:
```typescript
interface WhatsAppMessage {
  from: string
  text: string
  message_id: string
  type: 'text' | 'interactive' | 'image' | 'document'
  interactive?: any
  timestamp: string
}
```

### Intent Recognition
Automatically detects customer intent:

**Customer Intents**:
- `book_appointment` - Booking request
- `cancel_appointment` - Cancellation
- `reschedule_appointment` - Change timing
- `view_services` - Service inquiry
- `check_loyalty` - Points balance

**Staff Intents**:
- `staff_schedule` - View appointments
- `staff_checkin` - Check in client
- `complete_service` - Mark done
- `staff_break` - Take break

## Database Schema

### Conversations (core_entities)
```sql
entity_type: 'whatsapp_conversation'
entity_code: 'WA-{PHONE_NUMBER}'
metadata: {
  phone: string
  sender_type: 'customer' | 'staff' | 'new_customer'
  last_message_at: timestamp
  unread_count: number
}
```

### Messages (universal_transactions)
```sql
transaction_type: 'whatsapp_message'
transaction_code: 'MSG-{TIMESTAMP}'
source_entity_id: conversation_id (for inbound)
target_entity_id: conversation_id (for outbound)
metadata: {
  message_id: string
  text: string
  direction: 'inbound' | 'outbound'
  timestamp: string
}
```

## WhatsApp Cloud API Methods

### Send Text Message
```javascript
POST https://graph.facebook.com/v23.0/{PHONE_NUMBER_ID}/messages
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "RECIPIENT_NUMBER",
  "type": "text",
  "text": {
    "preview_url": false,
    "body": "MESSAGE_TEXT"
  }
}
```

### Send Interactive Message
```javascript
{
  "messaging_product": "whatsapp",
  "recipient_type": "individual",
  "to": "RECIPIENT_NUMBER",
  "type": "interactive",
  "interactive": {
    "type": "button",
    "body": {
      "text": "MESSAGE_TEXT"
    },
    "action": {
      "buttons": [
        {
          "type": "reply",
          "reply": {
            "id": "BUTTON_ID",
            "title": "BUTTON_TEXT"
          }
        }
      ]
    }
  }
}
```

## Error Handling

### Common Errors
| Error Code | Description | Solution |
|------------|-------------|----------|
| 401 | Invalid access token | Generate new token |
| 403 | Invalid verify token | Check webhook config |
| 400 | Invalid message format | Check payload structure |
| 130 | Re-engagement required | Customer must message first |

### Retry Logic
- Automatic retry for network errors
- Exponential backoff for rate limits
- Dead letter queue for failed messages

## Rate Limits

### WhatsApp Cloud API
- **Messaging**: 80 messages/second
- **Webhooks**: No limit
- **API Calls**: 200K/hour

### Best Practices
1. Batch message sending
2. Implement queue for high volume
3. Monitor rate limit headers
4. Use webhooks for real-time updates

## Security

### Webhook Verification
All webhooks verified using:
- Verify token matching
- HTTPS only
- Request signature validation

### Data Protection
- Messages encrypted at rest
- Organization isolation enforced
- PII handled per GDPR
- Audit trail maintained

## Testing

### Unit Tests
```bash
npm test src/lib/whatsapp/processor.test.ts
```

### Integration Tests
```bash
./scripts/test-integration.sh
```

### Load Testing
```bash
npm run test:whatsapp:load
```

---

**API Version**: v23.0
**Last Updated**: January 2025
**Documentation**: https://developers.facebook.com/docs/whatsapp