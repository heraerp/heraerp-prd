# 🔧 WhatsApp Webhook Setup Guide

## Prerequisites
✅ You have your WhatsApp access token
✅ You have a Meta developer account with a business app
✅ You have added WhatsApp product to your app

## Step 1: Deploy Your Webhook Endpoint

Your webhook endpoint is already created at:
```
/src/app/api/v1/whatsapp/webhook/route.ts
```

### For Local Testing (using ngrok):
```bash
# Install ngrok if you haven't
npm install -g ngrok

# Start your Next.js app
npm run dev

# In another terminal, expose your local server
ngrok http 3000

# You'll get a URL like: https://abc123.ngrok.io
# Your webhook URL will be: https://abc123.ngrok.io/api/v1/whatsapp/webhook
```

### For Production:
Your webhook URL will be:
```
https://yourdomain.com/api/v1/whatsapp/webhook
```

## Step 2: Configure Webhook in Meta App Dashboard

1. Go to your Meta App Dashboard
2. Navigate to **WhatsApp > Configuration** (or **Webhooks**)
3. Click **Edit** next to Callback URL

### Add these details:
- **Callback URL**: Your webhook URL from Step 1
- **Verify Token**: The value from your `WHATSAPP_WEBHOOK_TOKEN` in `.env.local`

### Subscribe to these fields:
- ✅ `messages` (Required - for receiving messages)
- ✅ `message_status` (For delivery/read receipts)
- ✅ `message_template_status` (For template updates)
- ✅ `business_capability_update` (For account updates)

Click **Verify and Save**

## Step 3: Update Your .env.local

```bash
# WhatsApp Business API Configuration
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_from_dashboard
WHATSAPP_BUSINESS_ACCOUNT_ID=your_waba_id
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_APP_SECRET=your_app_secret_here

# Webhook Configuration (choose a secure random string)
WHATSAPP_WEBHOOK_TOKEN=your_secure_webhook_verification_token

# Your WhatsApp Business Phone Number
WHATSAPP_BUSINESS_NUMBER=+1234567890

# For local development with ngrok
NEXT_PUBLIC_SITE_URL=https://your-ngrok-url.ngrok.io
```

## Step 4: Test Webhook Verification

The webhook endpoint handles verification automatically. When you click "Verify and Save" in Meta, it will:

1. Send a GET request to your webhook with:
   - `hub.mode=subscribe`
   - `hub.verify_token=your_token`
   - `hub.challenge=random_string`

2. Your endpoint responds with the challenge to verify

## Step 5: Test Message Flow

### Send a Test Message from Dashboard:
1. In WhatsApp > API Setup
2. Select your test phone number in "From"
3. Add a recipient number in "To"
4. Send the hello_world template

### Monitor Webhook Logs:
```bash
# Watch your Next.js console for incoming webhooks
npm run dev

# You should see:
# WhatsApp webhook received: { ... }
# Processing message from +1234567890: Hello
```

## Step 6: Test Customer Booking Flow

Send these messages to your WhatsApp number:

1. **"Hi"** - Should get welcome message
2. **"Book appointment"** - Should start booking flow
3. **"Tomorrow 3pm"** - Should show available slots
4. **Select a slot** - Should confirm booking

## Step 7: Verify Everything Works

Run the setup script to verify configuration:
```bash
cd mcp-server
node setup-whatsapp.js
```

This will:
- ✅ Test API connection
- ✅ Verify webhook is reachable
- ✅ Send a test message
- ✅ Create greeting templates

## Webhook Payload Examples

### Incoming Text Message:
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "messages": [{
          "from": "971501234567",
          "id": "wamid.xxx",
          "timestamp": "1234567890",
          "text": {
            "body": "Book appointment tomorrow"
          },
          "type": "text"
        }]
      }
    }]
  }]
}
```

### Message Status Update:
```json
{
  "entry": [{
    "changes": [{
      "value": {
        "statuses": [{
          "id": "wamid.xxx",
          "status": "delivered",
          "timestamp": "1234567890",
          "recipient_id": "971501234567"
        }]
      }
    }]
  }]
}
```

## Troubleshooting

### Webhook Not Verifying:
- Check verify token matches exactly
- Ensure webhook URL is HTTPS (not HTTP)
- Check server logs for errors
- Verify endpoint returns challenge string

### Messages Not Received:
- Check webhook subscriptions are active
- Verify phone number is in correct format
- Check Meta webhook logs for delivery
- Monitor server console for errors

### Common Errors:
- **Token Mismatch**: Verify token in .env matches Meta config
- **SSL Error**: Ensure HTTPS with valid certificate
- **Timeout**: Webhook must respond within 20 seconds
- **Invalid JSON**: Check payload parsing

## Production Checklist

Before going live:
- [ ] Use permanent access token (not temporary)
- [ ] Configure production webhook URL
- [ ] Set up error monitoring (Sentry, etc)
- [ ] Enable webhook retry handling
- [ ] Set up message queuing for high volume
- [ ] Configure rate limiting
- [ ] Test with real phone numbers
- [ ] Set up backup webhook URL

## Next Steps

1. **Monitor Dashboard**: Check `/salon/whatsapp` for conversations
2. **Test Flows**: Try all customer and staff commands
3. **Set Up Automation**: Configure reminder cron jobs
4. **Train Staff**: Share command reference guide
5. **Launch**: Announce to customers!

Your WhatsApp integration is now ready to handle real customer conversations!