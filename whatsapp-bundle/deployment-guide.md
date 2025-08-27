# 📋 WhatsApp Integration Deployment Guide

## Step 1: Meta Business Manager Setup

### 1.1 Create WhatsApp Business App
1. Go to https://developers.facebook.com
2. Create new app → Business → WhatsApp
3. Note your App ID: `2572687829765505`

### 1.2 Get Phone Number ID
1. WhatsApp Manager → Phone Numbers
2. Your Phone Number ID: `712631301940690`

### 1.3 Generate Access Token
1. Go to WhatsApp Manager → API Setup
2. Create System User (Admin role)
3. Generate token with permissions:
   - `whatsapp_business_messaging`
   - `whatsapp_business_management`

## Step 2: Railway Configuration

### 2.1 Set Environment Variables
```bash
railway variables \
  --set "WHATSAPP_WEBHOOK_TOKEN=hera-whatsapp-webhook-2024-secure-token" \
  --set "WHATSAPP_PHONE_NUMBER_ID=712631301940690" \
  --set "WHATSAPP_BUSINESS_ACCOUNT_ID=1112225330318984" \
  --set "WHATSAPP_BUSINESS_NUMBER=+919945896033" \
  --set "DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6" \
  --set "WHATSAPP_ACCESS_TOKEN=your_token_here"
```

### 2.2 Deploy Code
```bash
git push origin main
# Railway auto-deploys
```

## Step 3: Webhook Configuration

### 3.1 Configure in Meta Business Manager
1. Go to WhatsApp Manager → Configuration → Webhook
2. Set Callback URL: `https://heraerp.com/api/v1/whatsapp/webhook`
3. Set Verify Token: `hera-whatsapp-webhook-2024-secure-token`
4. Subscribe to "messages" field
5. Save configuration

### 3.2 Verify Webhook
```bash
curl "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"
# Should return: test
```

## Step 4: Test Integration

### 4.1 Send Test Message
1. Send WhatsApp message to `+91 99458 96033`
2. Type: "Hi" or "Hello"
3. You should receive automated response

### 4.2 Check Dashboard
Visit: https://heraerp.com/salon/whatsapp
- See your conversation
- View message history
- Send replies

### 4.3 Monitor Logs
```bash
railway logs
# Look for: "WhatsApp webhook received"
```

## Step 5: Production Checklist

### ✅ Technical Setup
- [ ] Environment variables set
- [ ] Webhook verified
- [ ] Messages subscribed
- [ ] Access token valid
- [ ] Organization ID correct

### ✅ Business Setup
- [ ] Welcome message configured
- [ ] Service list updated
- [ ] Staff trained on commands
- [ ] Business hours set
- [ ] Auto-reply messages ready

### ✅ Testing Complete
- [ ] Inbound messages work
- [ ] Outbound messages work
- [ ] Dashboard displays correctly
- [ ] Booking flow tested
- [ ] Staff commands tested

## Common Issues & Solutions

### Issue: Webhook not verifying
**Solution**: Check verify token matches exactly

### Issue: Messages not received
**Solution**: Ensure "messages" field is subscribed

### Issue: Can't send messages
**Solution**: Customer must message first (24hr rule)

### Issue: Access token expired
**Solution**: Generate new token in Meta Business Manager

## Monitoring & Maintenance

### Daily Checks
- Message volume
- Response times
- Failed messages
- Customer satisfaction

### Weekly Tasks
- Review conversation analytics
- Update quick replies
- Train staff on new features
- Check access token expiry

### Monthly Tasks
- Performance review
- Feature updates
- Customer feedback analysis
- Cost optimization

## Support Resources

- **Technical Support**: Railway logs
- **API Documentation**: https://developers.facebook.com/docs/whatsapp
- **Dashboard**: https://heraerp.com/salon/whatsapp
- **Test Endpoint**: https://heraerp.com/api/v1/whatsapp/test

---

**Deployment Time**: ~30 minutes
**Difficulty**: Medium
**Prerequisites**: WABA account, Railway access