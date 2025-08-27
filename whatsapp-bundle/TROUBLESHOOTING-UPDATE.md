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

### 4. Organization Not Found Error

**Problem**: Webhook returns "Organization not found".

**Solution**:
1. Ensure DEFAULT_ORGANIZATION_ID is set in environment variables
2. Check the organization exists:
   ```sql
   SELECT * FROM core_organizations WHERE id = 'your-org-id';
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

## Debugging Tools

### 1. Test Message Storage
```bash
curl https://heraerp.com/api/v1/whatsapp/test-store
```

### 2. Debug Dashboard Data
```bash
curl https://heraerp.com/api/v1/whatsapp/debug-dashboard
```

### 3. Check Railway Logs
```bash
railway logs | grep -i whatsapp | tail -50
railway logs | grep -A 5 -B 5 -i 'whatsapp.*error'
```

### 4. Direct Database Test
```sql
-- Check conversations
SELECT * FROM core_entities 
WHERE entity_type = 'whatsapp_conversation' 
AND organization_id = 'your-org-id';

-- Check messages
SELECT * FROM universal_transactions 
WHERE transaction_type = 'whatsapp_message' 
AND organization_id = 'your-org-id'
ORDER BY created_at DESC;
```

## Environment Variables

Ensure all required variables are set:
```env
# WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN=your-access-token
WHATSAPP_PHONE_NUMBER_ID=your-phone-id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=hera-whatsapp-webhook-2024-secure-token
WHATSAPP_BUSINESS_ACCOUNT_ID=your-waba-id

# Organization
DEFAULT_ORGANIZATION_ID=44d2d8f8-167d-46a7-a704-c0e5435863d6

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Contact Support

If issues persist:
1. Check the [documentation](https://docs.anthropic.com/en/docs/claude-code)
2. Report issues at https://github.com/anthropics/claude-code/issues
3. Include debug endpoint output and error logs