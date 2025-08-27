# 🧪 Manual WhatsApp Testing Guide

## Current Status ✅
- ✅ Webhook URL is working: `https://heraerp.com/api/v1/whatsapp/webhook`
- ✅ Verification token is correct: `hera-whatsapp-webhook-2024-secure-token`
- ✅ Access token is valid (new token added)
- ✅ Phone Number ID: `712631301940690`

## Why Messages Might Not Be Received

### 1. Check Webhook Subscription in Meta Business Manager
1. Go to: https://business.facebook.com
2. Navigate to: **WhatsApp Manager** → **Configuration** → **Webhook**
3. Verify these settings:
   - Callback URL: `https://heraerp.com/api/v1/whatsapp/webhook`
   - Verify Token: `hera-whatsapp-webhook-2024-secure-token`
   - **Subscribe to fields**: Make sure "messages" is checked ✅

### 2. Test by Sending a Message
1. Open WhatsApp on your phone
2. Send a message to: **+91 99458 96033**
3. Type: "Hello" or "Hi"

### 3. Check Railway Logs
```bash
railway logs
```

Look for entries like:
- "WhatsApp webhook received:"
- "Processing message from"

### 4. Common Issues & Fixes

#### Issue: No webhook calls received
**Fix**: In Meta Business Manager, make sure:
- The webhook is subscribed to "messages" field
- The webhook status shows as "Active"
- The phone number is verified

#### Issue: Webhook receives calls but no response
**Fix**: Check Railway environment variables:
```bash
railway variables | grep WHATSAPP
```

Should show:
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_WEBHOOK_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID

## 📱 Quick Debug Steps

1. **Send a test message** from your personal WhatsApp to +91 99458 96033

2. **Check webhook activity**:
   ```bash
   curl "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"
   ```
   Should return: `test`

3. **Monitor Railway logs** in real-time:
   ```bash
   railway logs
   ```

4. **Check the dashboard**:
   https://heraerp.com/salon/whatsapp

## 🔧 If Still Not Working

The most common issue is that the webhook is not subscribed to the "messages" field in Meta Business Manager. Please verify:

1. Go to Meta Business Manager
2. WhatsApp Manager → Configuration
3. Click on Webhook
4. Ensure "messages" field is checked
5. Click "Subscribe"

Once subscribed, messages should start flowing immediately!