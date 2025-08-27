# 🧪 WhatsApp Integration Testing Guide

## Pre-Testing Checklist

- [ ] Railway deployment successful
- [ ] Environment variables configured
- [ ] Webhook URL verified in Meta
- [ ] Access token valid (expires Aug 27, 2025)

## Testing Phases

### Phase 1: Infrastructure Testing

#### 1.1 Health Check
```bash
curl https://api.heraerp.com/api/health
```
Expected: `{"status":"healthy","timestamp":"..."}`

#### 1.2 Webhook Verification
```bash
curl "https://api.heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test123"
```
Expected: `test123`

### Phase 2: Message Flow Testing

#### 2.1 Send First Message
1. Open WhatsApp on your phone
2. Add business number: `+91 99458 96033`
3. Send: "Hi"
4. Wait for automated response

#### 2.2 Test Commands
Send these messages and verify responses:

| Message | Expected Response |
|---------|------------------|
| Hi | Welcome message with quick replies |
| Services | Service menu list |
| Book appointment | Booking flow starts |
| Hours | Business hours |
| Help | Command list |

#### 2.3 Appointment Booking Flow
```
You: Book appointment
Bot: What service would you like?
You: Haircut
Bot: When would you like to come?
You: Tomorrow 3pm
Bot: [Shows available slots]
```

### Phase 3: Dashboard Testing

#### 3.1 Access WhatsApp Dashboard
1. Go to: `https://heraerp.com/salon/whatsapp`
2. Login with your credentials
3. Verify you see conversations

#### 3.2 Dashboard Features
- [ ] Conversation list displays
- [ ] Messages show in real-time
- [ ] Can view message history
- [ ] Search works correctly
- [ ] Quick replies available

### Phase 4: Advanced Testing

#### 4.1 Multi-Language Test
```
You: नमस्ते
Bot: Should still respond appropriately
```

#### 4.2 Media Messages
- Send an image
- Send a voice note
- Verify handling

#### 4.3 Error Scenarios
- Send very long message (>4096 chars)
- Send special characters
- Rapid message sending

## Testing Scripts

### Send Test Message Script
```javascript
// Save as test-message.js in scripts folder
const axios = require('axios')

async function sendTestMessage() {
  const response = await axios.post(
    'https://graph.facebook.com/v18.0/712631301940690/messages',
    {
      messaging_product: 'whatsapp',
      to: '919945896033',
      type: 'template',
      template: {
        name: 'hello_world',
        language: { code: 'en_US' }
      }
    },
    {
      headers: {
        'Authorization': 'Bearer YOUR_ACCESS_TOKEN',
        'Content-Type': 'application/json'
      }
    }
  )
  console.log('Message sent:', response.data)
}

sendTestMessage()
```

### Monitor Webhook Script
```bash
# Save as monitor-webhook.sh
#!/bin/bash
echo "Monitoring WhatsApp webhooks..."
railway logs --tail -f | grep -i webhook
```

## Performance Testing

### Response Time Goals
- Webhook acknowledgment: < 200ms
- Message processing: < 2s
- Bot response: < 3s

### Load Testing
```bash
# Send multiple messages rapidly
for i in {1..10}; do
  echo "Test message $i" | send-to-whatsapp
  sleep 1
done
```

## Debugging Guide

### Check Railway Logs
```bash
railway logs --tail 100 | grep -E "(error|webhook|whatsapp)"
```

### Database Verification
```sql
-- Check conversations
SELECT * FROM core_entities 
WHERE entity_type = 'whatsapp_conversation'
ORDER BY created_at DESC;

-- Check messages
SELECT * FROM universal_transactions
WHERE transaction_type = 'whatsapp_message'
ORDER BY created_at DESC;
```

### Common Issues

#### No Response to Messages
1. Check webhook is receiving (Railway logs)
2. Verify bot logic is processing
3. Check for errors in message sending
4. Ensure 24-hour window hasn't expired

#### Delayed Responses
1. Check Railway performance metrics
2. Verify no rate limiting
3. Check database query performance

#### Message Not Delivered
1. Verify recipient has messaged first
2. Check access token is valid
3. Review Meta error logs

## Test Scenarios

### Customer Service Flow
```
1. Customer: "I have a complaint"
2. Bot: "We're sorry to hear that. How can we help?"
3. Customer: "My appointment was cancelled"
4. Bot: Creates support ticket and notifies staff
```

### Appointment Management
```
1. Customer: "Cancel my appointment"
2. Bot: "Please provide your booking reference"
3. Customer: "ABC123"
4. Bot: Cancels appointment and confirms
```

### Staff Commands
```
1. Staff: "schedule"
2. Bot: Shows today's appointments
3. Staff: "check in John Doe"
4. Bot: Marks client as arrived
```

## Testing Checklist Summary

### Basic Functionality ✅
- [ ] Webhook receives messages
- [ ] Bot sends responses
- [ ] Messages saved to database
- [ ] Dashboard displays data

### Business Logic ✅
- [ ] Appointment booking works
- [ ] Service menu displays
- [ ] Hours information correct
- [ ] Quick replies function

### Error Handling ✅
- [ ] Invalid commands handled
- [ ] Long messages truncated
- [ ] Rate limits respected
- [ ] Errors logged properly

### Performance ✅
- [ ] Response time acceptable
- [ ] No memory leaks
- [ ] Scales with load
- [ ] Database queries optimized

## Reporting Issues

When reporting issues, include:
1. Exact message sent
2. Expected vs actual response
3. Timestamp
4. Screenshot if relevant
5. Railway logs excerpt

## Success Metrics

Your integration is working when:
- 95%+ messages processed successfully
- Average response time < 2 seconds
- Zero critical errors in 24 hours
- Customer satisfaction positive

Happy Testing! 🎉