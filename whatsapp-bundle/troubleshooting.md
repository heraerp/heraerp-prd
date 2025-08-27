# 🔧 WhatsApp Integration Troubleshooting Guide

## Common Issues & Solutions

### 1. Webhook Not Verifying

**Symptoms**:
- "The callback URL or verify token couldn't be validated"
- Webhook verification fails in Meta Business Manager

**Solutions**:
```bash
# 1. Test webhook manually
curl "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"

# Should return: test
```

**Check**:
- ✅ Verify token matches exactly: `hera-whatsapp-webhook-2024-secure-token`
- ✅ URL is correct: `https://heraerp.com/api/v1/whatsapp/webhook`
- ✅ WHATSAPP_WEBHOOK_TOKEN is set in Railway

### 2. Messages Not Being Received

**Symptoms**:
- Send message but no response
- Dashboard shows no messages

**Solutions**:

**A. Check webhook subscription**:
1. Go to Meta Business Manager
2. WhatsApp Manager → Configuration → Webhook
3. Ensure "messages" field is subscribed ✅

**B. Check environment variables**:
```bash
railway variables | grep WHATSAPP
```

Should show:
- WHATSAPP_WEBHOOK_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID
- WHATSAPP_ACCESS_TOKEN
- DEFAULT_ORGANIZATION_ID

**C. Check logs**:
```bash
railway logs | grep -i whatsapp
```

### 3. Can't Send Messages

**Symptoms**:
- Error: "Re-engagement required"
- Messages fail to send

**Solutions**:

**24-Hour Rule**: Customer must message your business first
- Have customer send "Hi" to +91 99458 96033
- Then you can reply within 24 hours

**Access Token Issues**:
```bash
# Test if token is valid
curl -X GET "https://graph.facebook.com/v23.0/me?access_token=YOUR_TOKEN"
```

If expired, generate new token in Meta Business Manager.

### 4. Dashboard Not Loading

**Symptoms**:
- Blank dashboard at /salon/whatsapp
- No conversations showing

**Check**:
1. You're logged in to HERA
2. Have correct organization context
3. Browser console for errors (F12)

### 5. Messages Not Storing

**Symptoms**:
- Webhook processes but no messages in database

**Debug**:
```bash
# Check test endpoint
curl https://heraerp.com/api/v1/whatsapp/test
```

**Common Fixes**:
- Ensure organization_id is set correctly
- Check transaction date format
- Verify required fields (total_amount, transaction_date)

### 6. Access Token Expired

**Symptoms**:
- Error code 190
- "Session has expired"

**Solution**:
1. Go to Meta Business Manager
2. System Users → Generate New Token
3. Update Railway:
```bash
railway variables --set "WHATSAPP_ACCESS_TOKEN=new_token_here"
```

### 7. Organization Not Found

**Symptoms**:
- Error: "Organization not found"
- Webhook returns error

**Fix**:
```bash
# Find your organization ID
node hera-cli.js query core_organizations

# Update Railway
railway variables --set "DEFAULT_ORGANIZATION_ID=your-org-id"
```

### 8. Rate Limiting

**Symptoms**:
- Some messages not sent
- Error code 4 or 80

**Solutions**:
- Implement message queue
- Add delay between messages
- Monitor rate limit headers

## Debug Commands

### Test Complete Integration
```bash
./whatsapp-bundle/scripts/test-integration.sh
```

### Check Current Status
```bash
curl https://heraerp.com/api/v1/whatsapp/test | python3 -m json.tool
```

### Monitor Real-time Logs
```bash
railway logs --tail
```

### Send Test Message
```bash
./whatsapp-bundle/scripts/send-test-message.sh "Test message"
```

## Error Codes Reference

| Code | Meaning | Fix |
|------|---------|-----|
| 190 | Invalid/expired token | Generate new access token |
| 100 | Invalid parameter | Check API payload format |
| 130 | Re-engagement required | Customer must message first |
| 4 | Rate limit | Slow down requests |
| 403 | Invalid verify token | Check webhook configuration |

## Performance Issues

### Slow Response Times
- Check Railway server region
- Optimize message processing logic
- Implement caching for common queries

### High Message Volume
- Implement queue system
- Use batch processing
- Scale Railway dynos

## Getting Help

### 1. Check Logs
```bash
railway logs | grep -i error
```

### 2. Test Endpoint
Visit: https://heraerp.com/api/v1/whatsapp/test

### 3. Community Support
- GitHub Issues: https://github.com/heraerp/heraerp-prd/issues
- Discord: https://discord.gg/heraerp

### 4. Meta Support
- WhatsApp Business API: https://business.whatsapp.com/contact-us
- Developer Support: https://developers.facebook.com/support

## Prevention Tips

1. **Monitor Daily**:
   - Check access token expiry
   - Review error logs
   - Track message volume

2. **Test Regularly**:
   - Send test messages weekly
   - Verify webhook monthly
   - Check dashboard access

3. **Document Changes**:
   - Note configuration updates
   - Track token renewals
   - Log any issues

---

**Last Updated**: January 2025
**Version**: 1.0.0