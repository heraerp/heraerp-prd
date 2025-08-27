# WhatsApp Integration Troubleshooting

## Dashboard Not Showing Messages?

### Quick Fix
The dashboard no longer requires authentication! Just go to:
```
https://heraerp.com/salon/whatsapp
```

### Still Not Working?
1. **Wait for deployment** (2-3 minutes after push)
2. **Clear browser cache** (Ctrl+Shift+R)
3. **Check data exists**:
   ```bash
   curl https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq
   ```

## Common Issues

### Messages Not Appearing
**Check if messages are stored:**
```bash
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.totalMessages'
```

If count > 0, messages ARE stored. Dashboard just needs to refresh.

### Webhook Not Working
**Test webhook:**
```bash
cd test-scripts
./test-webhook.sh
```

### Environment Variables
Ensure these are set in Railway:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `DEFAULT_ORGANIZATION_ID` (44d2d8f8-167d-46a7-a704-c0e5435863d6)

## Quick Commands

```bash
# Check message count
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.totalMessages'

# View latest message
curl -s https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq '.data.conversationsWithMessages[0].messages[0]'

# Test webhook
curl https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test

# Railway logs
railway logs | grep -i whatsapp | tail -20
```

## Still Having Issues?

Your integration is working if:
- Debug endpoint shows messages
- Webhook verification returns challenge
- Railway logs show incoming messages

The dashboard now works without login, same as other salon pages!