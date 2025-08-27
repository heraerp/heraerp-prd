# WhatsApp Integration Troubleshooting Guide

## Common Issues and Solutions

### 1. Messages Not Appearing in Dashboard

**Problem**: WhatsApp messages are being stored in the database but not showing in the dashboard.

**Solution**:
1. Check the debug endpoint to verify data structure:
   ```bash
   curl https://heraerp.com/api/v1/whatsapp/debug-dashboard
   ```

2. Ensure organization_id is properly set in all queries:
   - Check that `currentOrganization.id` matches `DEFAULT_ORGANIZATION_ID`
   - Verify all queries include `.eq('organization_id', currentOrganization.id)`

3. Check console logs in the browser:
   - Look for "Found X conversations" messages
   - Check for "No messages found for conversation" errors

4. Common query issues:
   ```typescript
   // ❌ Wrong - missing organization filter
   .or(`source_entity_id.eq.${conv.id},target_entity_id.eq.${conv.id}`)
   
   // ✅ Correct - includes organization filter
   .eq('organization_id', currentOrganization.id)
   .or(`source_entity_id.eq.${conv.id},target_entity_id.eq.${conv.id}`)
   ```

### 2. Webhook Not Receiving Messages

**Problem**: WhatsApp messages not reaching the webhook.

**Solution**:
1. Verify webhook URL in Facebook App Dashboard
2. Check webhook verification token matches
3. Test webhook directly:
   ```bash
   curl -X GET "https://heraerp.com/api/v1/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=hera-whatsapp-webhook-2024-secure-token&hub.challenge=test"
   ```

4. Check Railway logs:
   ```bash
   railway logs | grep -i webhook
   ```

### 3. Messages Not Being Stored

**Problem**: Webhook receives messages but they're not stored in database.

**Solution**:
1. Check required fields are included:
   ```typescript
   {
     transaction_date: new Date().toISOString(), // Required
     total_amount: 0, // Required for universal_transactions
     organization_id: 'your-org-id' // Required for multi-tenancy
   }
   ```

2. Test storage directly:
   ```bash
   curl https://heraerp.com/api/v1/whatsapp/test-store
   ```

3. Check Railway logs for errors:
   ```bash
   railway logs | grep -A 5 -B 5 "Error storing"
   ```

### 4. Organization Not Found Error

**Problem**: Webhook returns "Organization not found".

**Solution**:
1. Ensure DEFAULT_ORGANIZATION_ID is set in environment variables:
   ```bash
   railway variables set DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6
   ```

2. Check the organization exists:
   ```sql
   SELECT * FROM core_organizations WHERE id = '44d2d8f8-167d-46a7-a704-c0e5435863d6';
   ```

### 5. Build Errors

**Problem**: Missing dependencies or type errors.

**Solution**:
1. Install missing packages:
   ```bash
   npm install axios
   npm install @supabase/supabase-js
   ```

2. Generate fresh types:
   ```bash
   npm run schema:types
   ```

3. Clear cache and rebuild:
   ```bash
   rm -rf .next node_modules
   npm install
   npm run build
   ```

### 6. Access Token Invalid

**Problem**: "Invalid access token" errors.

**Solution**:
1. Generate new permanent token in Facebook App Dashboard
2. Update Railway variable:
   ```bash
   railway variables set WHATSAPP_ACCESS_TOKEN=new-token
   ```
3. Redeploy: `railway up`

### 7. Phone Number Not Registered

**Problem**: "Phone number not registered" error.

**Solution**:
1. Verify phone number in WhatsApp Business API Setup
2. Check Phone Number ID matches environment variable
3. Ensure phone number is active and not suspended

## Debugging Tools

### 1. Test Message Storage
```bash
curl https://heraerp.com/api/v1/whatsapp/test-store | jq
```

Expected response:
```json
{
  "status": "success",
  "test_result": {
    "message_stored": true,
    "stored_id": "uuid",
    "total_messages": 5
  }
}
```

### 2. Debug Dashboard Data
```bash
curl https://heraerp.com/api/v1/whatsapp/debug-dashboard | jq
```

Expected response shows conversations and messages.

### 3. Check Railway Logs
```bash
# All WhatsApp activity
railway logs | grep -i whatsapp | tail -50

# Errors only
railway logs | grep -A 5 -B 5 -i 'whatsapp.*error'

# Webhook activity
railway logs | grep -i "webhook.*whatsapp"
```

### 4. Direct Database Test
```sql
-- Check conversations
SELECT * FROM core_entities 
WHERE entity_type = 'whatsapp_conversation' 
AND organization_id = '44d2d8f8-167d-46a7-a704-c0e5435863d6'
ORDER BY created_at DESC;

-- Check messages
SELECT * FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message' 
AND organization_id = '44d2d8f8-167d-46a7-a704-c0e5435863d6'
ORDER BY created_at DESC
LIMIT 10;

-- Check message count
SELECT COUNT(*) FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message' 
AND organization_id = '44d2d8f8-167d-46a7-a704-c0e5435863d6';
```

## Environment Variables Checklist

```bash
# Check all variables are set
railway variables

# Required variables:
WHATSAPP_ACCESS_TOKEN         # From Facebook App Dashboard
WHATSAPP_PHONE_NUMBER_ID      # From WhatsApp API Setup
WHATSAPP_WEBHOOK_VERIFY_TOKEN # hera-whatsapp-webhook-2024-secure-token
WHATSAPP_BUSINESS_ACCOUNT_ID  # Your WABA ID
DEFAULT_ORGANIZATION_ID       # 44d2d8f8-167d-46a7-a704-c0e5435863d6
```

## Performance Optimization

1. **Message Processing**: Currently synchronous, consider queue for high volume
2. **Database Queries**: Add indexes for conversation lookups
3. **Caching**: Consider Redis for frequent customer lookups
4. **Rate Limiting**: Implement to prevent abuse

## Security Checklist

- [ ] Never log access tokens
- [ ] Validate all webhook payloads
- [ ] Use HTTPS only
- [ ] Implement rate limiting
- [ ] Regular token rotation
- [ ] Monitor for suspicious activity

## Contact Support

If issues persist after trying these solutions:

1. **Check Documentation**: https://developers.facebook.com/docs/whatsapp
2. **HERA Support**: https://github.com/anthropics/claude-code/issues
3. **Include in Bug Report**:
   - Debug endpoint output
   - Railway logs
   - Environment configuration (without secrets)
   - Steps to reproduce