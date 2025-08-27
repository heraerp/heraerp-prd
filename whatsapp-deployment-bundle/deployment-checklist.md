# 📋 WhatsApp Integration Deployment Checklist

## Pre-Deployment ✅

- [x] WhatsApp Business API Access Token obtained
- [x] Phone Number ID: `712631301940690`
- [x] WABA ID: `1112225330318984`
- [x] Business Number: `+91 99458 96033`
- [x] Code implementation complete
- [x] Railway domain configured: `heraerp.com`

## Deployment Steps 🚀

### 1. Environment Variables
- [ ] Copy all variables from `.env.example`
- [ ] Add to Railway dashboard → Variables
- [ ] Verify all tokens are correct

### 2. Deploy to Railway
```bash
# If using CLI
railway up

# Or push to GitHub and auto-deploy
git push origin main
```

### 3. Configure WhatsApp Webhook

#### In Meta Business Manager:
1. [ ] Go to: https://business.facebook.com/wa/manage
2. [ ] Navigate to: WhatsApp → Configuration → Webhooks
3. [ ] Click "Edit" on Callback URL
4. [ ] Enter:
   - **Callback URL**: `https://api.heraerp.com/api/v1/whatsapp/webhook`
   - **Verify Token**: `hera-whatsapp-webhook-2024-secure-token`
5. [ ] Click "Verify and Save"

#### Subscribe to Events:
- [ ] messages
- [ ] messaging_postbacks
- [ ] message_template_status
- [ ] messages_status (optional)

### 4. Test Webhook
```bash
# Run from scripts folder
./test-webhook.sh

# Or manually
curl "https://api.heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"
```

### 5. Send Test Message
- [ ] Send a WhatsApp message TO your business number
- [ ] Check Railway logs for webhook receipt
- [ ] Verify message stored in database

### 6. Test Response Flow
- [ ] Send "Hi" → Should get welcome message
- [ unexpected error]
- [ ] Send "Services" → Should get service menu
- [ ] Send "Book appointment" → Should start booking flow

## Post-Deployment Verification ✅

### System Health
- [ ] Check `/api/health` endpoint
- [ ] Verify database connections
- [ ] Monitor Railway metrics

### WhatsApp Functionality
- [ ] Incoming messages received
- [ ] Outgoing messages sent
- [ ] Message history saved
- [ ] Dashboard displays conversations

### Performance
- [ ] Response time < 2 seconds
- [ ] No memory leaks
- [ ] Error rate < 1%

## Production Monitoring 📊

### Set Up Monitoring
- [ ] Enable Railway notifications
- [ ] Set up error alerts
- [ ] Configure uptime monitoring

### Regular Checks
- [ ] Daily: Check message delivery rate
- [ ] Weekly: Review conversation analytics  
- [ ] Monthly: Update greeting messages

## Emergency Contacts 🚨

- **Railway Issues**: Check Railway status page
- **WhatsApp API**: Meta Business Support
- **Access Token Issues**: Regenerate in Meta App Dashboard

## Success Criteria ✅

Your WhatsApp integration is successfully deployed when:
- ✅ Webhook verified in Meta Business Manager
- ✅ Test messages are received and processed
- ✅ Responses are sent successfully
- ✅ Dashboard shows real-time conversations
- ✅ No errors in Railway logs

## Notes
- Access token expires: **August 27, 2025**
- Webhook token: `hera-whatsapp-webhook-2024-secure-token`
- Support number: `+91 99458 96033`