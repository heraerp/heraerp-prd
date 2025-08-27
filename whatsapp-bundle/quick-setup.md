# ⚡ WhatsApp Integration Quick Setup (10 Minutes)

## Your Details
- **Business**: Hanaset Business India
- **Phone**: +91 99458 96033
- **Phone ID**: 712631301940690
- **WABA ID**: 1112225330318984
- **Webhook URL**: https://heraerp.com/api/v1/whatsapp/webhook

## Step 1: Set Railway Variables (2 min)
```bash
railway variables --set "WHATSAPP_ACCESS_TOKEN=YOUR_NEW_TOKEN_HERE"
```

## Step 2: Meta Webhook Setup (3 min)
1. Go to: https://business.facebook.com
2. WhatsApp Manager → Configuration → Webhook
3. Set:
   - URL: `https://heraerp.com/api/v1/whatsapp/webhook`
   - Token: `hera-whatsapp-webhook-2024-secure-token`
4. Subscribe to: ✅ messages

## Step 3: Test (2 min)
1. Send WhatsApp to +91 99458 96033: "Hi"
2. Check dashboard: https://heraerp.com/salon/whatsapp

## Step 4: Verify (3 min)
```bash
# Run test suite
./whatsapp-bundle/scripts/test-integration.sh

# Check status
curl https://heraerp.com/api/v1/whatsapp/test
```

## ✅ Success Checklist
- [ ] Access token set in Railway
- [ ] Webhook verified in Meta
- [ ] Messages field subscribed
- [ ] Test message received
- [ ] Dashboard shows conversation

## 🚀 You're Live!
Your WhatsApp integration is ready. Customers can now message +91 99458 96033 for instant service!

## Need Help?
- Logs: `railway logs`
- Status: https://heraerp.com/api/v1/whatsapp/test
- Guide: See troubleshooting.md