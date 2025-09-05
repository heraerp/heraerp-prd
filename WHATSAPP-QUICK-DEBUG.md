# WhatsApp Quick Debug Guide

## 🚨 When "BOOK" Messages Don't Work

### 1. Quick Status Check
```bash
# Check if webhook is alive
curl https://heraerp.com/api/v1/whatsapp/webhook-status | jq '.'

# Check recent messages (last 10)
curl "https://heraerp.com/api/v1/whatsapp/latest?limit=10" \
  -H "x-organization-id: e3a9ff9e-bb83-43a8-b062-b85e7a2b4258" | jq '.'

# Run diagnostic
curl https://heraerp.com/api/v1/whatsapp/diagnose | jq '.'
```

### 2. Test Message Send (to verified number)
```bash
# Your UK number
curl -X POST http://localhost:3000/api/v1/whatsapp/test-direct \
  -H "Content-Type: application/json" \
  -d '{
    "to": "+447515668004",
    "message": "Test from HERA Salon System"
  }'

# Or any number that has messaged before
curl -X POST https://heraerp.com/api/v1/whatsapp/test-send \
  -H "Content-Type: application/json" \
  -H "x-organization-id: e3a9ff9e-bb83-43a8-b062-b85e7a2b4258" \
  -d '{
    "to": "+918883333144",
    "message": "Hello from HERA!"
  }'
```

### 3. Common Fixes

#### "fetch failed" Error
```javascript
// Change webhook-handler.ts from:
const supabase = createClient(url, key)

// To:
const getSupabaseClient = () => {
  return createClient(url, key)
}
// Then use: const supabase = getSupabaseClient()
```

#### Messages Not Stored
Check organization ID mapping in webhook:
```javascript
// Line ~53 in webhook/route.ts
const phoneToOrgMap: Record<string, string> = {
  '919945896033': 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258',
  '447515668004': 'e3a9ff9e-bb83-43a8-b062-b85e7a2b4258', // Add your number
}
```

#### Can't Send Messages
- Customer must message first (24-hour window rule)
- Use template for first contact
- Check phone format: +447515668004 (with country code)

### 4. Railway Debug Commands
```bash
# Trigger redeployment
git commit --allow-empty -m "chore: Trigger Railway deployment" && git push

# Check if endpoints exist (after deploy)
curl https://heraerp.com/api/v1/whatsapp/diagnose
curl https://heraerp.com/api/v1/whatsapp/test-db
curl https://heraerp.com/api/v1/whatsapp/check-logs
```

### 5. Test Webhook Manually
```bash
curl -X POST https://heraerp.com/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "object": "whatsapp_business_account",
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "447515668004",
            "text": {"body": "BOOK"},
            "timestamp": "1756996800"
          }]
        }
      }]
    }]
  }'
```

## 📱 Key Phone Numbers
- **Business**: +91 99458 96033
- **Your UK**: +44 7515 668004
- **Test Indian**: +91 8883333144

## 🔑 Key IDs
- **Organization**: e3a9ff9e-bb83-43a8-b062-b85e7a2b4258
- **Phone Number ID**: 712631301940690
- **Business Account**: 1112225330318984

## ⚡ Quick Fix Sequence
1. Send "BOOK" from WhatsApp
2. Wait 30 seconds
3. Check latest messages endpoint
4. If not there, check diagnostic endpoint
5. If "fetch failed", apply Supabase fix
6. Trigger Railway redeploy
7. Wait 3 minutes
8. Test again