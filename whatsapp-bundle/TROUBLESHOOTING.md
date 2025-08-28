# WhatsApp Integration Troubleshooting Guide

## 🔍 Common Issues & Solutions

### 1. Messages Not Appearing in Dashboard

#### Symptoms:
- Sent messages to WhatsApp number
- Dashboard shows empty or old messages
- API shows messages exist

#### Solutions:

**Solution 1: Use Live Viewer**
```
https://heraerp.com/salon/whatsapp-live
```
This viewer has no authentication barriers and updates every 5 seconds.

**Solution 2: Check API Directly**
```bash
# Verify messages are stored
curl https://heraerp.com/api/v1/whatsapp/latest
```

**Solution 3: Clear Browser Cache**
- Hard refresh: Ctrl+Shift+R (Windows) or Cmd+Shift+R (Mac)
- Try incognito/private browsing mode

### 2. Webhook Not Receiving Messages

#### Symptoms:
- WhatsApp messages not creating database records
- Webhook URL returns errors

#### Verify Webhook:
```bash
# Test webhook is accessible
curl https://heraerp.com/api/v1/whatsapp/webhook
```

#### Check Railway Logs:
```bash
railway logs | grep -i webhook
```

#### Verify Environment Variables:
- `WHATSAPP_ACCESS_TOKEN` - Must match Facebook App
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` - Must be: `hera-whatsapp-webhook-2024-secure-token`
- `DEFAULT_ORGANIZATION_ID` - Must be: `44d2d8f8-167d-46a7-a704-c0e5435863d6`

### 3. Authentication Issues

#### Symptoms:
- Main dashboard requires login
- Can't access certain pages

#### Solutions:

**Use No-Auth Viewers:**
- `/salon/whatsapp-live` - Real-time view
- `/salon/whatsapp-viewer` - Conversation view

**Use API Endpoints:**
- `/api/v1/whatsapp/latest` - Recent messages
- `/api/v1/whatsapp/debug-dashboard` - Full data

### 4. Messages Show Wrong Time

#### Cause:
Timezone differences between server and client

#### Solution:
The live viewer shows relative time ("2m ago", "1h ago") which is timezone-independent.

### 5. Deployment Issues

#### Build Failures:
```bash
# Check for TypeScript errors
npm run build

# Fix common issues
npm install  # Missing dependencies
```

#### Railway Deploy Fails:
```bash
# Check deployment logs
railway logs

# Verify environment variables
railway variables
```

### 6. Performance Issues

#### Slow Loading:
- Use `/salon/whatsapp-live` for faster loads
- API endpoints are always fast
- Check network tab in browser DevTools

### 7. Missing Features

#### Current Limitations:
- No message sending (receive only)
- No media messages (text only)
- No group messages

## 🎯 Quick Fixes

### Force Refresh Data
```bash
# Send test message to trigger updates
curl -X POST https://heraerp.com/api/v1/whatsapp/webhook \
  -H "Content-Type: application/json" \
  -d '{"object":"whatsapp_business_account","entry":[{"changes":[{"value":{"messages":[{"from":"919945896033","text":{"body":"Debug test"},"type":"text","id":"test_'$(date +%s)'","timestamp":"'$(date +%s)'"}]}}]}]}'
```

### Check System Health
```bash
# Message count
curl -s https://heraerp.com/api/v1/whatsapp/latest | jq '.total'

# Latest message time
curl -s https://heraerp.com/api/v1/whatsapp/latest | jq '.latest.created_at'

# Total conversations
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.totalConversations'
```

### Reset Viewer State
1. Clear browser localStorage
2. Hard refresh page
3. Try different browser

## 📺 Railway-Specific Issues

### Environment Variables Not Working:
```bash
# List all variables
railway variables

# Update variable
railway variables set VARIABLE_NAME=value
```

### Deployment Stuck:
```bash
# Cancel and retry
railway up
```

### Logs Not Showing:
```bash
# Get last 100 lines
railway logs -n 100

# Follow logs in real-time
railway logs -f
```

## 🚑 Emergency Contacts

- **API Status**: Check `/api/health`
- **Raw Data Access**: Use `/api/v1/whatsapp/debug-dashboard`
- **Direct Database**: Check via Supabase dashboard if you have access

## ✅ Working Checklist

- [✓] Messages stored in database (20+ confirmed)
- [✓] Webhook receiving messages
- [✓] Live viewer updates every 5 seconds
- [✓] API endpoints return data
- [✓] Multiple viewers available
- [✓] No authentication required for viewers

---

**Still having issues?** The integration IS working - try the Live Viewer first!