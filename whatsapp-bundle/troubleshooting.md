# WhatsApp Integration Troubleshooting Guide

## Quick Status Check

```bash
# 1. Check if messages are stored (should show 14+)
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.totalMessages'

# 2. Check conversations (should show 2)
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.totalConversations'

# 3. View latest messages
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.conversationsWithMessages[0].messages[0]'
```

## Common Issues and Solutions

### 1. Dashboard Not Showing Messages

**Symptoms**: 
- Blank dashboard at `/salon/whatsapp`
- Loading spinner or empty conversation list
- BUT messages ARE in database (confirmed via debug endpoint)

**Root Cause**: Dashboard requires authentication

**Solutions**:

#### Solution A: Login First (Recommended)
```
1. Navigate to: https://heraerp.com/auth/login
2. Sign in with credentials
3. Select organization
4. Navigate to: https://heraerp.com/salon/whatsapp
```

#### Solution B: Check Browser Console
```javascript
// Open DevTools (F12) and look for:
WhatsApp Dashboard - Auth State: {
  isAuthenticated: false,    // Should be true
  hasOrganization: false,    // Should be true
  organizationId: undefined  // Should have UUID
}
```

#### Solution C: Use Debug Endpoint (No Auth)
```bash
curl https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq
```

### 2. Webhook Not Receiving Messages

**Symptoms**:
- Messages sent to WhatsApp number don't appear
- No new entries in database

**Solutions**:

1. **Verify Webhook Configuration**:
   ```bash
   # Test webhook verification
   curl "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"
   ```

2. **Check Facebook Dashboard**:
   - Go to Facebook App → WhatsApp → Configuration
   - Verify webhook URL: `https://heraerp.com/api/v1/whatsapp/webhook`
   - Ensure "messages" field is subscribed

3. **Check Railway Logs**:
   ```bash
   railway logs | grep -i "webhook" | tail -20
   ```

### 3. Messages Not Being Stored

**Symptoms**:
- Webhook receives messages (in logs)
- But messages don't appear in database

**Solutions**:

1. **Check Required Fields**:
   ```javascript
   // These fields are REQUIRED:
   {
     transaction_date: new Date().toISOString(),
     total_amount: 0,  // Required even for messages
     organization_id: '44d2d8f8-167d-46a7-a704-c0e5435863d6'
   }
   ```

2. **Test Storage Directly**:
   ```bash
   curl https://heraerp.com/api/v1/whatsapp/test-store
   ```

3. **Check for Errors**:
   ```bash
   railway logs | grep -A 5 "Error storing message"
   ```

### 4. Organization Not Found Error

**Symptoms**:
- "Organization not found" in webhook response
- 404 errors when accessing API

**Solutions**:

1. **Set Environment Variable**:
   ```bash
   railway variables set DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   railway up
   ```

2. **Verify in Database**:
   ```sql
   SELECT * FROM core_organizations 
   WHERE id = '44d2d8f8-167d-46a7-a704-c0e5435863d6';
   ```

### 5. Access Token Invalid

**Symptoms**:
- "Invalid access token" errors
- 401 Unauthorized responses

**Solutions**:

1. **Generate New Token**:
   - Go to Facebook App Dashboard
   - WhatsApp → API Setup → Access Tokens
   - Generate new permanent token

2. **Update Railway**:
   ```bash
   railway variables set WHATSAPP_ACCESS_TOKEN=new-token
   railway up
   ```

### 6. Build/Deployment Errors

**Symptoms**:
- Build fails with missing dependencies
- TypeScript errors

**Solutions**:

1. **Install Dependencies**:
   ```bash
   npm install axios @supabase/supabase-js
   ```

2. **Generate Types**:
   ```bash
   npm run schema:types
   ```

3. **Clear and Rebuild**:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

## Debugging Checklist

- [ ] Messages in database? Check: `curl https://heraerp.com/api/v1/whatsapp/debug-dashboard`
- [ ] Logged in? Navigate to `/auth/login` first
- [ ] Organization selected? Check after login
- [ ] Webhook verified? Test with curl command
- [ ] Access token valid? Check Facebook dashboard
- [ ] Environment variables set? Run `railway variables`
- [ ] Deployment successful? Check `railway logs`

## Advanced Debugging

### 1. Database Queries
```sql
-- Count messages by phone
SELECT 
  metadata->>'phone' as phone,
  COUNT(*) as message_count
FROM universal_transactions
WHERE transaction_type = 'whatsapp_message'
GROUP BY metadata->>'phone';

-- Recent messages
SELECT 
  metadata->>'text' as message,
  metadata->>'direction' as direction,
  created_at
FROM universal_transactions
WHERE transaction_type = 'whatsapp_message'
ORDER BY created_at DESC
LIMIT 10;
```

### 2. Railway Monitoring
```bash
# All WhatsApp activity
railway logs | grep -i whatsapp | tail -100

# Just errors
railway logs | grep -i "error" | grep -i "whatsapp"

# Webhook hits
railway logs | grep "POST /api/v1/whatsapp/webhook"
```

### 3. Browser Debugging
```javascript
// In browser console at dashboard
console.log('Organization:', currentOrganization)
console.log('Conversations:', conversations)
console.log('Auth state:', isAuthenticated)
```

## Performance Tips

1. **Message Processing**: Currently synchronous, consider queue for high volume
2. **Dashboard Loading**: Add pagination for conversations > 100
3. **Caching**: Use Redis for frequent lookups
4. **Rate Limiting**: Implement to prevent webhook abuse

## Still Having Issues?

1. **Collect Debug Info**:
   ```bash
   curl https://heraerp.com/api/v1/whatsapp/debug-dashboard > debug-output.json
   railway logs | tail -500 > railway-logs.txt
   ```

2. **Check Documentation**:
   - WhatsApp API: https://developers.facebook.com/docs/whatsapp
   - Railway: https://docs.railway.app

3. **Get Support**:
   - Include debug output
   - Describe expected vs actual behavior
   - List troubleshooting steps tried