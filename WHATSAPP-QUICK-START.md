# 🚀 WhatsApp Integration - Quick Start Guide

## ✅ What's Already Built

You have a complete WhatsApp Business API integration ready to deploy:
- **MCP Tools** for message processing
- **Webhook API** for receiving messages
- **Natural language** appointment booking
- **Automated reminders** (24h and 2h)
- **Staff commands** via WhatsApp
- **Real-time dashboard** at `/salon/whatsapp`

## 🔧 Setup in 5 Minutes

### Step 1: Add Your Credentials

Edit `.env.local` and add your WhatsApp Business API credentials:

```bash
# From Meta Business Manager > WhatsApp > API Setup
WHATSAPP_PHONE_NUMBER_ID=123456789012345
WHATSAPP_ACCESS_TOKEN=EAAxxxxxx...your-long-token-here

# Your WhatsApp Business phone number
WHATSAPP_BUSINESS_NUMBER=+971501234567

# Choose a secure random string for webhook verification
WHATSAPP_WEBHOOK_TOKEN=my-secure-webhook-token-2024

# Your organization ID (from HERA)
DEFAULT_ORGANIZATION_ID=550e8400-e29b-41d4-a716-446655440000
```

### Step 2: Verify Your Setup

```bash
cd mcp-server
node verify-whatsapp-setup.js
```

You should see:
- ✅ Environment Variables: PASSED
- ✅ API Connection: PASSED  
- ✅ Phone Number: PASSED
- ✅ Database: PASSED

### Step 3: Configure Webhook

#### For Local Testing (Recommended First):
```bash
# Install ngrok
npm install -g ngrok

# Start your app
npm run dev

# In new terminal, expose local server
ngrok http 3000

# Copy the HTTPS URL (e.g., https://abc123.ngrok.io)
```

#### In Meta Business Manager:
1. Go to **WhatsApp > Configuration > Webhooks**
2. Click **Edit** next to Callback URL
3. Enter:
   - **Callback URL**: `https://abc123.ngrok.io/api/v1/whatsapp/webhook`
   - **Verify Token**: Your `WHATSAPP_WEBHOOK_TOKEN` value
4. Click **Verify and Save**

### Step 4: Subscribe to Events

In the same webhooks page, subscribe to:
- ✅ `messages`
- ✅ `messaging_postbacks`
- ✅ `message_template_status`

### Step 5: Run Setup & Test

```bash
# Initialize WhatsApp configuration
node setup-whatsapp.js

# Send yourself a test message
node verify-whatsapp-setup.js test
```

## 📱 Testing Your Integration

### Send Test Messages

Message your WhatsApp Business number:

1. **"Hi"** → Welcome message with quick replies
2. **"Book appointment"** → Booking flow starts
3. **"Services"** → Service menu
4. **"Tomorrow 3pm"** → Available slots

### Check Dashboard

Open `/salon/whatsapp` in your browser to see:
- Incoming messages
- Conversation history
- Booking requests
- System responses

## 🚨 Troubleshooting

### "Access token invalid"
- Regenerate token in Meta Business Manager
- Make sure it's a permanent token, not temporary

### "Phone number not found"
- Verify Phone Number ID is correct
- Check you're using the ID, not the phone number itself

### "Webhook not verifying"
- Token must match exactly (no spaces)
- URL must be HTTPS
- Server must be running

### "Messages not received"
- Check webhook subscriptions
- Verify ngrok is still running
- Look at server console for errors

## ⚡ Production Deployment

When ready for production:

1. **Update webhook URL** to your production domain:
   ```
   https://yourdomain.com/api/v1/whatsapp/webhook
   ```

2. **Set up automated reminders**:
   ```bash
   # Add to crontab
   */30 * * * * cd /app && node mcp-server/send-whatsapp-reminders.js
   ```

3. **Monitor performance** at `/salon/whatsapp/analytics`

## 📞 Need Help?

Common issues are covered in `/mcp-server/test-whatsapp-webhook.js` - run it to diagnose problems.

Your WhatsApp integration is feature-complete and production-ready. Just add your credentials and start receiving messages!