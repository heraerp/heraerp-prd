# 🔗 WhatsApp Webhook Configuration Guide

## Your Webhook Details

### Production URL
```
https://api.heraerp.com/api/v1/whatsapp/webhook
```

### Verification Token
```
hera-whatsapp-webhook-2024-secure-token
```

## Step-by-Step Configuration

### 1. Access Meta Business Manager
- Go to: https://business.facebook.com
- Select your business account

### 2. Navigate to WhatsApp Settings
- Click **≡** (menu) → **WhatsApp Manager**
- Or direct link: https://business.facebook.com/wa/manage

### 3. Configure Webhook

1. Click on **"Hanaset Business India"** account
2. Go to **Configuration** → **Webhooks**
3. Click **Edit** next to "Callback URL"

### 4. Enter Webhook Details

```
Callback URL: https://api.heraerp.com/api/v1/whatsapp/webhook
Verify Token: hera-whatsapp-webhook-2024-secure-token
```

### 5. Subscribe to Webhook Fields

Check these boxes:
- ✅ **messages** (Required - incoming messages)
- ✅ **messaging_postbacks** (For button responses)
- ✅ **message_template_status** (Template updates)
- ✅ **messages_status** (Delivery receipts)

### 6. Verify and Save

1. Click **"Verify and Save"**
2. Meta will send a verification request
3. Your endpoint will respond with the challenge
4. If successful, you'll see "Webhook Verified"

## Testing Your Webhook

### Quick Verification Test
```bash
curl -X GET "https://api.heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test123"
```

Expected response: `test123`

### Send Test Message
1. Open WhatsApp on your phone
2. Send a message to `+91 99458 96033`
3. Check Railway logs for webhook activity

### Check Webhook Logs
```bash
# Using Railway CLI
railway logs --tail 100

# Or in Railway dashboard
# Service → Logs → Filter by "webhook"
```

## Webhook Payload Examples

### Incoming Text Message
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "messages": [{
          "from": "919876543210",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "text": {
            "body": "Hi, I want to book an appointment"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

### Message Status Update
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "919876543210"
        }]
      }
    }]
  }]
}
```

## Troubleshooting

### Webhook Not Verifying
- Check token matches exactly (no spaces)
- Ensure URL is HTTPS
- Verify Railway app is deployed and running
- Check Railway logs during verification

### Not Receiving Messages
- Confirm webhook is subscribed to "messages" field
- Check if sender has messaged your business first
- Verify in Meta webhook logs (Webhooks → View Details)
- Ensure Railway app has no errors

### Common Errors

#### Token Mismatch
```
Error: Webhook verification failed
Fix: Ensure WHATSAPP_WEBHOOK_TOKEN in Railway matches Meta config
```

#### SSL/HTTPS Issues
```
Error: Webhook callback verification failed
Fix: Confirm using https:// not http://
```

#### Timeout
```
Error: Webhook didn't respond in time
Fix: Check Railway app performance, ensure < 20s response
```

## Security Best Practices

1. **Never share your verification token**
2. **Use environment variables** (not hardcoded)
3. **Validate webhook signatures** (optional but recommended)
4. **Log webhook attempts** for security monitoring
5. **Rate limit** incoming requests

## Webhook Monitoring

### In Meta Business Manager
- Go to Webhooks → View Details
- Check "Recent Entries" for delivery status
- Monitor error rates

### In Railway
- Set up alerts for webhook errors
- Monitor response times
- Track message volume

## Next Steps

After webhook is configured:
1. Test with real messages
2. Implement message handling logic
3. Set up automated responses
4. Configure reminder system
5. Enable customer service flows

Your webhook is the gateway to WhatsApp automation! 🎉