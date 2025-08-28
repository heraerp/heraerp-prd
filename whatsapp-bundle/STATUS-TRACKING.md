# WhatsApp Message Status Tracking

## Overview

The HERA WhatsApp integration now includes comprehensive message status tracking that follows the WhatsApp Business API delivery lifecycle. This feature provides real-time visibility into message delivery states using HERA's universal 6-table architecture.

## Status Lifecycle

Messages go through the following status progression:

1. **Pending** - Message queued for sending
2. **Sent** - Message sent to WhatsApp servers
3. **Delivered** - Message delivered to recipient's device
4. **Read** - Recipient has read the message (if read receipts enabled)
5. **Failed** - Message delivery failed (with error details)

## Architecture

### Universal Table Usage

Following HERA's canonical architecture, status tracking uses only the 6 universal tables:

#### 1. Message Storage (`universal_transactions`)
- Original messages stored with `transaction_type = 'whatsapp_message'`
- Status tracked in `metadata.status` field
- Status history maintained in `metadata.status_history` array

#### 2. Status Updates (`universal_transactions`)
- Each status update creates a new transaction with `transaction_type = 'whatsapp_status'`
- Smart codes indicate status type:
  - `HERA.COMM.WHATSAPP.STATUS.SENT.v1`
  - `HERA.COMM.WHATSAPP.STATUS.DELIVERED.v1`
  - `HERA.COMM.WHATSAPP.STATUS.READ.v1`
  - `HERA.COMM.WHATSAPP.STATUS.FAILED.v1`

#### 3. Relationships (`core_relationships`)
- Links status updates to original messages
- `relationship_type = 'status_update'`
- Enables complete audit trail

## Implementation

### 1. Webhook Handler (`/api/v1/whatsapp/webhook`)

```typescript
// Process incoming status updates from WhatsApp
POST /api/v1/whatsapp/webhook

// Webhook payload structure
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",          // WhatsApp message ID
          "status": "delivered",       // Status type
          "timestamp": "1234567890",   // Unix timestamp
          "recipient_id": "1234567890", // Recipient phone
          "errors": [...]              // Optional error details
        }]
      }
    }]
  }]
}
```

### 2. Status Processing Flow

1. **Receive Webhook** - WhatsApp sends status update to webhook endpoint
2. **Find Original Message** - Locate message using `waba_message_id`
3. **Create Status Transaction** - New transaction records the status change
4. **Update Message Metadata** - Append to status history, update current status
5. **Create Relationship** - Link status update to original message

### 3. UI Components

#### Message Status Indicator
- Visual icons showing current status
- Clickable for detailed history
- Real-time updates via polling

#### Status History Dialog
- Timeline view of all status changes
- Timestamps for each transition
- Error details for failed messages
- Status definitions reference

## Testing

### Manual Testing
1. Send a WhatsApp message through the UI
2. Observe status changes in real-time
3. Click status indicator to see full history

### Automated Testing
```bash
# Run the test script
node test-whatsapp-status.js

# This simulates status webhooks for:
# - Delivered status
# - Read status  
# - Failed status with error details
```

## Configuration

### Environment Variables
```env
# WhatsApp webhook verification
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token

# Default organization for testing
DEFAULT_ORGANIZATION_ID=3df8cc52-3d81-42d5-b088-7736ae26cc7c
```

### WhatsApp Business API Setup
1. Configure webhook URL: `https://yourdomain.com/api/v1/whatsapp/webhook`
2. Subscribe to `messages` webhook field
3. Enable message status updates in WhatsApp settings

## Error Handling

### Common Status Errors

1. **Message Expired (131053)**
   - 24-hour window exceeded
   - Solution: Use template messages

2. **Invalid Phone Number (131008)**
   - Recipient not on WhatsApp
   - Solution: Verify phone number format

3. **Rate Limit (131048)**
   - Too many messages sent
   - Solution: Implement rate limiting

## Production Considerations

1. **Webhook Security**
   - Verify webhook signatures
   - Implement rate limiting
   - Use HTTPS only

2. **Performance**
   - Process status updates asynchronously
   - Batch database updates
   - Implement proper indexing

3. **Monitoring**
   - Track delivery rates
   - Alert on high failure rates
   - Monitor webhook latency

## Future Enhancements

1. **Analytics Dashboard**
   - Message delivery rates
   - Average read times
   - Failure analysis

2. **Bulk Status Updates**
   - Process multiple statuses efficiently
   - Reduce database writes

3. **Smart Retry Logic**
   - Automatic retry for failed messages
   - Exponential backoff
   - Template fallback

## Troubleshooting

### Status Not Updating
1. Check webhook configuration in WhatsApp Business Manager
2. Verify webhook endpoint is accessible
3. Check Supabase logs for database errors
4. Ensure `waba_message_id` is properly stored

### Missing Status History
1. Verify `metadata.status_history` array is initialized
2. Check webhook handler error logs
3. Ensure proper organization_id filtering

### UI Not Reflecting Updates
1. Check auto-refresh is enabled
2. Verify API endpoint returns status data
3. Inspect browser console for errors