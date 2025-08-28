# WhatsApp Integration Quick Start Guide

## 🚀 2-Minute Setup

### Step 1: Access Your Dashboard

Choose the viewer that works best for you:

1. **Live Message Viewer** (Recommended)
   ```
   https://heraerp.com/salon/whatsapp-live
   ```
   - Real-time updates every 5 seconds
   - Shows messages chronologically
   - No login required

2. **Conversation Viewer**
   ```
   https://heraerp.com/salon/whatsapp-viewer
   ```
   - Groups messages by conversation
   - No login required

### Step 2: Verify Integration

#### Check Message Count
```bash
curl https://heraerp.com/api/v1/whatsapp/latest | jq '.total'
```

Expected output: A number showing total messages (20+ means it's working!)

#### View Latest Messages
```bash
curl https://heraerp.com/api/v1/whatsapp/latest | jq '.messages[0]'
```

### Step 3: Send a Test Message

1. **Via WhatsApp**: Send any message to +91 99458 96033
2. **Via API**: 
   ```bash
   curl -X POST https://heraerp.com/api/v1/whatsapp/webhook \
     -H "Content-Type: application/json" \
     -d '{
       "object": "whatsapp_business_account",
       "entry": [{"changes": [{"value": {
         "messages": [{
           "from": "919945896033",
           "text": {"body": "Quick test"},
           "type": "text",
           "id": "test_'$(date +%s)'",
           "timestamp": "'$(date +%s)'"
         }]
       }}]}]
     }'
   ```

### Step 4: Monitor Messages

1. Open https://heraerp.com/salon/whatsapp-live
2. Watch messages appear in real-time
3. Latest message is highlighted with green border

## ✅ Success Indicators

- **Message Counter**: Shows 20+ messages
- **Live Updates**: New messages appear within 5 seconds
- **API Response**: Returns success status
- **Dashboard**: Shows conversations and messages

## 🎯 Common Use Cases

### Appointment Booking Detection
Messages containing keywords like "book", "appointment", "schedule" are automatically detected.

### Customer Inquiries
Messages with "?", "help", "info" are marked as inquiries.

### Quick Replies
Use the API to send automated responses for common queries.

## 📱 Mobile Access

All viewers are mobile-responsive. Access from any device:
- Phone: Full functionality
- Tablet: Optimized layout
- Desktop: Complete view

## 🔥 Pro Tips

1. **Bookmark the Live Viewer**: `https://heraerp.com/salon/whatsapp-live`
2. **Use API for Automation**: Direct API calls bypass any UI issues
3. **Check Railway Logs**: `railway logs | grep -i whatsapp`
4. **Monitor in Real-time**: Keep live viewer open on second screen

---

**Need help?** Check TROUBLESHOOTING.md or use the API endpoints directly!