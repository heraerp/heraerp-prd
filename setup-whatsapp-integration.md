# WhatsApp Business API Integration Setup Guide

## Current Configuration Status

You have the following WhatsApp credentials configured:
- ✅ WHATSAPP_PHONE_NUMBER_ID: 712631301940690
- ✅ WHATSAPP_BUSINESS_ACCOUNT_ID: 1112225330318984
- ✅ WHATSAPP_ACCESS_TOKEN: Configured
- ✅ WHATSAPP_BUSINESS_NUMBER: +919945896033
- ✅ WHATSAPP_WEBHOOK_TOKEN: hera-whatsapp-webhook-2024-secure-token

## Step 1: Configure WhatsApp Webhook

1. Go to Meta Business Manager > WhatsApp > Configuration
2. Set your webhook URL to:
   ```
   https://your-domain.com/api/v1/whatsapp/webhook
   ```
   For local testing with ngrok:
   ```
   https://your-ngrok-url.ngrok.io/api/v1/whatsapp/webhook
   ```

3. Set the Verify Token to: `hera-whatsapp-webhook-2024-secure-token`

4. Subscribe to these webhook fields:
   - messages
   - message_status
   - message_template_status_update

## Step 2: Test Webhook Verification

The webhook verification endpoint is already set up at `/api/v1/whatsapp/webhook`. It will respond to Meta's verification challenge.

## Step 3: Update Organization Mapping

Currently, the webhook uses the default organization ID from environment variables. You need to map WhatsApp phone numbers to organizations.

## Step 4: Test Message Flow

1. Send a WhatsApp message to your business number: +919945896033
2. The webhook will receive it at `/api/v1/whatsapp/webhook`
3. It will be processed and stored in the database
4. The message will appear in the WhatsApp UI

## API Endpoints Available

- **Webhook**: `/api/v1/whatsapp/webhook` - Receives messages from Meta
- **Send Message**: `/api/v1/whatsapp/send` - Send messages to customers
- **Fetch Messages**: `/api/v1/whatsapp/fetch-real-messages` - Fetch from Meta API
- **Get Messages**: `/api/v1/whatsapp/messages-v2` - Get from database

## Testing the Integration

1. Use ngrok for local testing:
   ```bash
   ngrok http 3000
   ```

2. Update your webhook URL in Meta Business Manager with the ngrok URL

3. Send a test message to your WhatsApp Business number

4. Check the logs to see if the webhook is receiving messages

## Troubleshooting

1. **Webhook not receiving messages**: 
   - Check if the webhook URL is correct in Meta Business Manager
   - Ensure the verify token matches
   - Check if webhook is subscribed to "messages" field

2. **Messages not appearing in UI**:
   - Check if organization ID mapping is correct
   - Verify messages are being saved to database
   - Check browser console for errors

3. **Authentication errors**:
   - Ensure your access token is valid and not expired
   - Check if the token has necessary permissions