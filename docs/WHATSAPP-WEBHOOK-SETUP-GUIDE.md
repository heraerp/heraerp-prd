# WhatsApp Business API Webhook Setup Guide

This guide will help you receive real WhatsApp messages in your HERA application.

## Prerequisites

✅ WhatsApp Business Account configured  
✅ WhatsApp Business Number: +91 99458 96033  
✅ Access Token in `.env` file  
✅ Next.js development server running on port 3000  
✅ ngrok installed (for local testing)  

## Step 1: Start the Webhook Setup Script

```bash
# Run the automated setup script
./setup-whatsapp-webhook.sh
```

This script will:
- Start ngrok tunnel
- Display your webhook URL
- Show configuration instructions

## Step 2: Configure Webhook in Meta Business Manager

1. Go to [Meta Business Manager](https://business.facebook.com)
2. Navigate to: **WhatsApp > Configuration > Webhooks**
3. Click **Edit** on the webhook configuration
4. Enter the webhook details:
   - **Callback URL**: `https://YOUR-NGROK-URL.ngrok.io/api/v1/whatsapp/webhook`
   - **Verify Token**: `hera-whatsapp-webhook-token-2024` (or your custom token from .env)
5. Click **Verify and Save**
6. Subscribe to these webhook fields:
   - ✓ messages
   - ✓ message_status  
   - ✓ message_template_status_update

## Step 3: Test the Integration

### Option A: Monitor Live Messages
```bash
# Run the live monitoring script
node test-webhook-live.js
```

This will show new messages as they arrive in real-time.

### Option B: Send Test Message
1. Send a WhatsApp message to your business number: **+91 99458 96033**
2. Check the Next.js console for webhook logs
3. Check ngrok inspector at http://127.0.0.1:4040

### Option C: Manual Test
```bash
# Test webhook endpoint
node debug-whatsapp-webhook.js
```

## How Messages Flow

1. **Customer sends WhatsApp message** → Meta servers
2. **Meta sends webhook** → Your ngrok URL
3. **Webhook route receives** → `/api/v1/whatsapp/webhook`
4. **Message stored** → Supabase database
5. **UI updates** → `/salon-data/whatsapp` page

## Database Structure

Messages are stored using HERA's universal architecture:

- **Customer Entity**: `core_entities` (entity_type: 'customer')
- **Conversation Entity**: `core_entities` (entity_type: 'whatsapp_conversation')  
- **Message Transaction**: `universal_transactions` (transaction_type: 'whatsapp_message')
- **Message Content**: `universal_transaction_lines` (contains actual text)

## Troubleshooting

### Not Receiving Messages?

1. **Check ngrok is running**
   ```bash
   # Should see tunnel status
   curl http://localhost:4040/api/tunnels
   ```

2. **Verify webhook in Meta**
   - Green checkmark next to webhook URL
   - "messages" field is subscribed
   - Webhook URL matches your current ngrok URL

3. **Check environment variables**
   ```bash
   node test-whatsapp-integration.js
   ```

4. **Monitor server logs**
   - Look for "🔔 WhatsApp webhook received" in Next.js console
   - Check ngrok inspector: http://127.0.0.1:4040

5. **Test with curl**
   ```bash
   # Test webhook verification
   curl "http://localhost:3000/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-token-2024&hub.challenge=test123"
   ```

### Common Issues

- **403 Forbidden**: Verify token mismatch - check `.env` file
- **No logs**: Webhook URL not configured in Meta or ngrok not running
- **Messages not in UI**: Organization ID mismatch - check webhook handler

## Production Deployment

For production, replace ngrok URL with your actual domain:

1. Update webhook URL in Meta to: `https://yourdomain.com/api/v1/whatsapp/webhook`
2. Ensure SSL certificate is valid
3. Set production environment variables
4. Configure proper logging and monitoring

## Security Considerations

- Always validate webhook signatures in production
- Use environment variables for sensitive data
- Implement rate limiting on webhook endpoint
- Log webhook events for audit trail
- Use Row Level Security (RLS) in Supabase