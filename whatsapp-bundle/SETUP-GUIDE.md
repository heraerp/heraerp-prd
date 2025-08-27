# WhatsApp Business API Setup Guide

## Prerequisites

1. **WhatsApp Business Account**
2. **Facebook Developer Account**
3. **Meta Business Verification**
4. **Railway Account** (for deployment)
5. **Supabase Project** (database)

## Step 1: Create Facebook App

1. Go to [Facebook Developers](https://developers.facebook.com)
2. Create New App → Business → Continue
3. Add WhatsApp product to your app
4. Note your App ID: `2572687829765505`

## Step 2: Configure WhatsApp Business

1. **Add Phone Number**:
   - Go to WhatsApp → API Setup
   - Add phone number: `+91 99458 96033`
   - Verify via SMS/Voice

2. **Get Permanent Token**:
   - Go to WhatsApp → API Setup → Access Tokens
   - Generate permanent token for System User
   - Save token securely

3. **Note Account Details**:
   - WABA ID: `1112225330318984`
   - Phone Number ID: (from API Setup page)

## Step 3: Configure Webhook

1. **In Facebook App Dashboard**:
   - Go to WhatsApp → Configuration → Webhook
   - Callback URL: `https://heraerp.com/api/v1/whatsapp/webhook`
   - Verify Token: `hera-whatsapp-webhook-2024-secure-token`
   - Subscribe to fields: `messages`

2. **Test Webhook**:
   ```bash
   curl -X GET "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"
   ```

## Step 4: Environment Configuration

1. **Local Development** (`.env.local`):
   ```env
   # WhatsApp Cloud API
   WHATSAPP_ACCESS_TOKEN=your-access-token
   WHATSAPP_PHONE_NUMBER_ID=your-phone-id
   WHATSAPP_WEBHOOK_VERIFY_TOKEN=hera-whatsapp-webhook-2024-secure-token
   WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984
   
   # Organization
   DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   
   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-key
   ```

2. **Railway Production**:
   ```bash
   railway variables set WHATSAPP_ACCESS_TOKEN=your-token
   railway variables set WHATSAPP_PHONE_NUMBER_ID=your-phone-id
   railway variables set WHATSAPP_WEBHOOK_VERIFY_TOKEN=hera-whatsapp-webhook-2024-secure-token
   railway variables set WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984
   railway variables set DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   ```

## Step 5: Deploy Application

1. **Build and Deploy**:
   ```bash
   npm install
   npm run build
   railway up
   ```

2. **Verify Deployment**:
   ```bash
   # Check webhook
   curl https://heraerp.com/api/v1/whatsapp/webhook
   
   # Test message storage
   curl https://heraerp.com/api/v1/whatsapp/test-store
   ```

## Step 6: Test Integration

1. **Send Test Message**:
   - Send "Hello" to your WhatsApp Business number
   - Check Railway logs: `railway logs | grep -i whatsapp`

2. **Check Dashboard**:
   - Navigate to: `https://heraerp.com/salon/whatsapp`
   - Should see conversation with test message

3. **Debug if Needed**:
   ```bash
   # Check all data
   curl https://heraerp.com/api/v1/whatsapp/debug-dashboard
   ```

## Step 7: Configure Business Features

### Greeting Message
Default: "Welcome to Glamour Salon! What would you like to do today?"

### Quick Replies
- 📅 Book Appointment
- 💅 Our Services  
- 📞 Contact Us

### Service Menu
Automatically generated from your service catalog

### Appointment Booking
Integrated with salon calendar and staff schedules

## Security Best Practices

1. **Never commit tokens** to repository
2. **Use environment variables** for all secrets
3. **Rotate access tokens** regularly
4. **Implement rate limiting** for webhook
5. **Log all webhook activity** for audit

## Monitoring

1. **Railway Logs**:
   ```bash
   railway logs --tail
   ```

2. **Database Queries**:
   ```sql
   -- Check conversations
   SELECT * FROM core_entities 
   WHERE entity_type = 'whatsapp_conversation'
   ORDER BY created_at DESC;
   
   -- Check messages
   SELECT * FROM universal_transactions
   WHERE transaction_type = 'whatsapp_message'
   ORDER BY created_at DESC;
   ```

3. **Health Check**:
   ```bash
   curl https://heraerp.com/api/health
   ```

## Next Steps

1. **Customize Responses**: Edit `/lib/whatsapp/processor.ts`
2. **Add Languages**: Extend intent recognition
3. **Integrate Calendar**: Connect to booking system
4. **Add Analytics**: Track conversation metrics
5. **Setup Templates**: Create message templates in Meta Business

## Support Resources

- WhatsApp Business API Docs: https://developers.facebook.com/docs/whatsapp
- Railway Docs: https://docs.railway.app
- HERA Universal Architecture: See `/docs/universal-architecture.md`