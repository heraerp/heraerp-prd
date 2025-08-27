# 🔧 WhatsApp Integration Troubleshooting Guide

## Quick Diagnostics

### 1. Check System Status
```bash
# Health check
curl https://api.heraerp.com/api/health

# Webhook verification
curl "https://api.heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"

# Railway logs
railway logs --tail 50
```

## Common Issues & Solutions

### 🔴 Webhook Not Verifying

**Symptoms:**
- "Webhook callback verification failed" in Meta
- Can't save webhook URL

**Solutions:**
1. **Check Token Match**
   ```
   Railway env var: WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token
   Meta verify token: hera-whatsapp-webhook-2024-secure-token
   ```
   Must match EXACTLY (no spaces!)

2. **Verify URL Format**
   - ✅ Correct: `https://api.heraerp.com/api/v1/whatsapp/webhook`
   - ❌ Wrong: `http://...` (must be HTTPS)
   - ❌ Wrong: `.../webhook/` (no trailing slash)

3. **Check Deployment**
   ```bash
   railway status
   railway logs | grep "webhook"
   ```

### 🔴 Not Receiving Messages

**Symptoms:**
- Messages sent but not appearing in logs
- No webhook activity

**Solutions:**
1. **Check Webhook Subscriptions**
   - Go to Meta Business Manager
   - WhatsApp → Configuration → Webhooks
   - Ensure "messages" is checked

2. **Verify in Meta Webhook Logs**
   - Click "View Details" under webhook
   - Check "Recent Entries"
   - Look for delivery failures

3. **24-Hour Window**
   - Recipients must message YOUR number first
   - You have 24 hours to reply
   - After 24 hours, they must message again

### 🔴 Can't Send Messages

**Symptoms:**
- API returns errors when sending
- Messages not delivered

**Error: "(#131030) Recipient not opted in"**
```
Solution: Recipient must message your business first
```

**Error: "(#100) Invalid parameter"**
```
Solutions:
- Check phone number format (just digits: 919945896033)
- Verify template name exists and is approved
- Check all required fields are present
```

**Error: "Access token invalid"**
```
Solutions:
- Token expired (yours expires Aug 27, 2025)
- Token was revoked
- Generate new token in Meta App Dashboard
```

### 🔴 Database Issues

**Symptoms:**
- Messages not saving
- Dashboard empty

**Check Database Connection:**
```javascript
// In Railway console
railway run node -e "
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('core_entities').select('count').then(console.log);
"
```

**Verify Organization ID:**
```sql
-- Check if organization exists
SELECT * FROM core_organizations 
WHERE id = '44d2d8f8-167d-46a7-a704-c0e5435863d6';
```

### 🔴 Performance Issues

**Symptoms:**
- Slow responses
- Timeouts
- Memory errors

**Solutions:**
1. **Check Railway Metrics**
   - Go to Railway dashboard
   - View Memory/CPU usage
   - Scale up if needed

2. **Optimize Database Queries**
   ```sql
   -- Add indexes if missing
   CREATE INDEX idx_whatsapp_messages ON universal_transactions(transaction_type, created_at)
   WHERE transaction_type = 'whatsapp_message';
   ```

3. **Enable Caching**
   - Implement Redis for frequently accessed data
   - Cache conversation history

## Error Code Reference

### WhatsApp API Errors

| Code | Error | Solution |
|------|-------|----------|
| 100 | Invalid parameter | Check request format and required fields |
| 131030 | Recipient not opted in | User must message first |
| 131026 | Message template not found | Create/approve template |
| 131047 | Re-engagement message | Outside 24hr window |
| 368 | Temporarily blocked | Rate limit hit, wait |
| 130429 | Rate limit hit | Slow down message sending |
| 131000 | Something went wrong | Check access token and permissions |

### HTTP Status Codes

| Code | Meaning | Action |
|------|---------|--------|
| 200 | Success | All good! |
| 400 | Bad request | Check payload format |
| 401 | Unauthorized | Verify access token |
| 403 | Forbidden | Check permissions |
| 404 | Not found | Verify endpoint URL |
| 429 | Too many requests | Implement rate limiting |
| 500 | Server error | Check Railway logs |

## Debugging Tools

### 1. Railway CLI Commands
```bash
# View recent logs
railway logs --tail 100

# Search for errors
railway logs | grep -i error

# Monitor real-time
railway logs -f

# Run diagnostics
railway run node mcp-server/verify-whatsapp-setup.js
```

### 2. Test Webhook Manually
```bash
# Test webhook reception
curl -X POST https://api.heraerp.com/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "entry": [{
      "changes": [{
        "value": {
          "messages": [{
            "from": "919876543210",
            "text": {"body": "Test message"}
          }]
        }
      }]
    }]
  }'
```

### 3. Database Queries
```sql
-- Recent conversations
SELECT * FROM core_entities 
WHERE entity_type = 'whatsapp_conversation' 
ORDER BY created_at DESC LIMIT 10;

-- Recent messages
SELECT * FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message' 
ORDER BY created_at DESC LIMIT 10;

-- Check for errors
SELECT * FROM core_entities 
WHERE entity_type = 'error_log' 
AND created_at > NOW() - INTERVAL '1 hour';
```

## Prevention Strategies

### 1. Monitoring Setup
```javascript
// Add to your code
console.log('Webhook received:', {
  timestamp: new Date().toISOString(),
  from: message.from,
  type: message.type,
  messageId: message.id
});
```

### 2. Error Handling
```javascript
try {
  // Process message
} catch (error) {
  console.error('WhatsApp processing error:', {
    error: error.message,
    stack: error.stack,
    messageId: message.id,
    from: message.from
  });
  // Save error to database for analysis
}
```

### 3. Health Checks
```javascript
// Add health check endpoint
app.get('/api/whatsapp/health', async (req, res) => {
  const checks = {
    webhook: 'ok',
    database: await checkDatabase(),
    whatsappApi: await checkWhatsAppAPI()
  };
  res.json(checks);
});
```

## Emergency Recovery

### If Everything Breaks:

1. **Revert Webhook**
   - Temporarily disable in Meta
   - Fix issues
   - Re-enable when ready

2. **Restart Service**
   ```bash
   railway restart
   ```

3. **Check Access Token**
   - Verify not revoked
   - Generate new if needed
   - Update in Railway

4. **Database Recovery**
   - Check Supabase status
   - Verify connection strings
   - Test with direct queries

## Getting Help

### Log Collection for Support
```bash
# Collect logs
railway logs --tail 1000 > whatsapp-debug.log

# Include:
# - Error messages
# - Timestamps
# - Message IDs
# - Screenshots
```

### Support Channels
- Railway: https://railway.app/help
- Meta/WhatsApp: https://developers.facebook.com/support
- Supabase: https://supabase.com/support

## Maintenance Tasks

### Daily
- Check error logs
- Monitor delivery rates
- Verify webhook health

### Weekly
- Review message analytics
- Update greeting messages
- Check API rate limits

### Monthly
- Rotate access tokens
- Archive old conversations
- Performance optimization

Remember: Most issues are configuration-related. Double-check your settings before diving deep into debugging! 🔍