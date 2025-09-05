# HERA WhatsApp Business Integration Guide

## 🔧 Quick Reference

### Production WhatsApp Details
- **Business Phone**: +91 99458 96033 (Hanaset Business India)
- **Phone Number ID**: 712631301940690
- **Business Account ID**: 1112225330318984
- **Quality Rating**: GREEN
- **Platform**: CLOUD_API
- **Webhook URL**: https://heraerp.com/api/v1/whatsapp/webhook
- **Verify Token**: hera-whatsapp-webhook-2024-secure-token

### Environment Variables Required
```bash
# WhatsApp Business API
WHATSAPP_PHONE_NUMBER_ID=712631301940690
WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984
WHATSAPP_ACCESS_TOKEN=<your-access-token>
WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token

# Supabase (for message storage)
NEXT_PUBLIC_SUPABASE_URL=https://awfcrncxngqwbhqapffb.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# Organization
DEFAULT_ORGANIZATION_ID=e3a9ff9e-bb83-43a8-b062-b85e7a2b4258
```

## 📱 How It Works

### 1. **Incoming Message Flow**
```
Customer sends WhatsApp message
    ↓
Meta delivers to webhook: POST /api/v1/whatsapp/webhook
    ↓
Webhook handler processes message
    ↓
Stores in universal_transactions table
    ↓
Routes to AI/booking handler
    ↓
Sends response back via WhatsApp API
```

### 2. **Key Components**

#### Webhook Endpoint (`/api/v1/whatsapp/webhook/route.ts`)
- Receives messages from Meta
- Verifies webhook token
- Routes to appropriate handlers

#### Webhook Handler (`/lib/whatsapp/webhook-handler.ts`)
- Creates/finds customer entities
- Stores messages in database
- Manages conversation state

#### Message Router (`/lib/whatsapp/message-router.ts`)
- AI-powered intent detection
- Routes to booking system
- Handles 24-hour window rules

#### WhatsApp Client (`/lib/whatsapp/whatsapp-client.ts`)
- Sends messages via Meta API
- Manages templates
- Tracks costs

## 🚨 Common Issues & Solutions

### 1. **"fetch failed" Error on Railway**
**Problem**: Supabase client initialization fails
**Solution**: Create Supabase client inside methods, not at module level
```typescript
// ❌ BAD - Fails on Railway
const supabase = createClient(url, key)

// ✅ GOOD - Works everywhere
const getSupabaseClient = () => {
  return createClient(url, key)
}
```

### 2. **"Invalid parameter" When Sending Messages**
**Problem**: No active conversation window
**Reasons**:
- Customer hasn't messaged in last 24 hours
- Trying to send to new number without template
- Phone number format incorrect

**Solution**: 
- Use template messages for first contact
- Ensure customer has messaged first
- Use E.164 format: +447515668004

### 3. **Messages Not Appearing in System**
**Check**:
1. Webhook is receiving POSTs (check Railway logs)
2. Organization ID matches: `e3a9ff9e-bb83-43a8-b062-b85e7a2b4258`
3. Database connection working
4. Phone number mapping exists in webhook

## 🧪 Testing Tools

### 1. **Test Webhook Locally**
```bash
# Send test message to webhook
curl -X POST http://localhost:3000/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "id": "1112225330318984",
      "changes": [{
        "value": {
          "messaging_product": "whatsapp",
          "metadata": {
            "display_phone_number": "+919945896033",
            "phone_number_id": "712631301940690"
          },
          "messages": [{
            "from": "447515668004",
            "id": "wamid.test123",
            "timestamp": "1756996800",
            "text": {"body": "BOOK"},
            "type": "text"
          }]
        },
        "field": "messages"
      }]
    }]
  }'
```

### 2. **Send Test Message**
```bash
# Via our API
curl -X POST http://localhost:3000/api/v1/whatsapp/test-direct \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+447515668004",
    "message": "Test message from HERA"
  }'

# Direct to Meta API
curl -X POST https://graph.facebook.com/v18.0/712631301940690/messages \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "447515668004",
    "type": "text",
    "text": {"body": "Hello from HERA"}
  }'
```

### 3. **Check System Status**
```bash
# Webhook status
curl https://heraerp.com/api/v1/whatsapp/webhook-status

# Recent messages
curl https://heraerp.com/api/v1/whatsapp/latest?limit=10 \
  -H "x-organization-id: e3a9ff9e-bb83-43a8-b062-b85e7a2b4258"

# Diagnostic info
curl https://heraerp.com/api/v1/whatsapp/diagnose
```

## 🔍 Debugging Checklist

When WhatsApp isn't working:

1. **Verify Webhook**
   - [ ] Webhook URL correct in Meta Business Manager
   - [ ] Verify token matches
   - [ ] Subscribed to "messages" field
   - [ ] Webhook verification working

2. **Check Environment**
   - [ ] All env vars set on Railway
   - [ ] Supabase URL and key valid
   - [ ] Organization ID correct
   - [ ] Access token not expired

3. **Test Components**
   - [ ] Can send messages to known numbers
   - [ ] Webhook receives test POSTs
   - [ ] Database queries work
   - [ ] Logs show message reception

4. **Common Fixes**
   - [ ] Restart Railway deployment
   - [ ] Clear and re-add env vars
   - [ ] Check Railway logs for errors
   - [ ] Verify phone has messaged first

## 📊 Message Storage

Messages are stored in the universal 6-table architecture:

### Customer Entity (`core_entities`)
```sql
entity_type: 'customer'
entity_code: 'WHATSAPP-447515668004'
metadata: {
  wa_id: '447515668004',
  phone: '447515668004',
  source: 'whatsapp'
}
```

### Conversation Entity (`core_entities`)
```sql
entity_type: 'whatsapp_conversation'
metadata: {
  customer_id: '<customer-entity-id>',
  wa_id: '447515668004',
  status: 'active',
  last_message_at: '2025-09-05T...'
}
```

### Message Transaction (`universal_transactions`)
```sql
transaction_type: 'whatsapp_message'
transaction_code: 'MSG-<whatsapp-message-id>'
metadata: {
  wa_id: '447515668004',
  direction: 'inbound',
  content: 'BOOK',
  message_type: 'text'
}
```

## 🎯 Quick Actions

### Send Reply to Customer
```typescript
// From local development
const response = await fetch('/api/v1/whatsapp/test-direct', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    to: '+447515668004',
    message: 'Your appointment is confirmed!'
  })
})
```

### Check if Customer Messaged
```typescript
// Check recent messages from specific number
const messages = await fetch('/api/v1/whatsapp/latest?limit=50')
  .then(r => r.json())
  .then(data => data.messages.filter(m => m.phone === '447515668004'))
```

### Force Webhook Processing
```typescript
// Manually trigger webhook with test message
await fetch('/api/v1/whatsapp/webhook', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(testWebhookPayload)
})
```

## 🚀 Deployment Notes

### Railway Specific
- Environment variables must be set before deployment
- Supabase client should be created on-demand, not at module level
- Check logs: Railway dashboard → Your app → Logs tab
- Restart may be needed after env var changes

### Meta Business Manager
- Webhook must be HTTPS (not HTTP)
- Verify token must match exactly
- Subscribe to correct webhook fields
- Test with "Test" button in webhook config

## 📞 Support Contacts

- **WhatsApp Business Support**: Via Meta Business Manager
- **Railway Support**: support.railway.app
- **Supabase Support**: support.supabase.com

## Last Updated: September 5, 2025
- Fixed Supabase initialization issue on Railway
- Confirmed working with UK number: +44 7515 668004
- All systems operational