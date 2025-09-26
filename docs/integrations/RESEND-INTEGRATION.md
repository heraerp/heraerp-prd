# HERA Resend Integration - Universal Email Connector

## Overview

The HERA Resend Integration provides a universal email connector following HERA's Sacred Six table architecture. It enables sending transactional and marketing emails through Resend's API while maintaining complete audit trails and multi-tenant isolation.

## Architecture

### Universal Pattern Implementation

The Resend connector follows HERA's universal patterns:

1. **Connector Entity** in `core_entities`:
   - `entity_type`: 'connector'
   - `smart_code`: 'HERA.INTEGRATION.CONNECTOR.RESEND.V1'
   - Configuration stored in `core_dynamic_data`

2. **Transaction Logging** in `universal_transactions`:
   - Every email operation creates transactions with smart codes
   - Complete audit trail with metadata
   - Status tracking: queued → sent → delivered

3. **Smart Code Pattern**:
   - `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.QUEUED.V1` - Email queued for sending
   - `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.SENT.V1` - Email successfully sent
   - `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.FAILED.V1` - Email send failed
   - `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.DELIVERED.V1` - Email delivered (via webhook)

## Setup Instructions

### 1. Add Resend API Key

Add your Resend API key to the `.env` file:
```bash
RESEND_API_KEY=re_1234567890abcdef
```

### 2. Create Connector Entity

Run the setup script to create the connector entity in HERA:
```bash
node scripts/setup-resend-connector.js
```

This will:
- Create a connector entity with smart code `HERA.INTEGRATION.CONNECTOR.RESEND.V1`
- Store configuration in `core_dynamic_data`
- Set the connector status based on API key availability

### 3. Configure Webhook (Optional)

In your Resend dashboard:
1. Go to Webhooks section
2. Add webhook URL: `https://yourdomain.com/api/webhooks/resend`
3. Select events to track (sent, delivered, opened, clicked, bounced)

## API Usage

### Send Email Endpoint

**POST** `/api/integrations/resend/send`

```bash
curl -X POST http://localhost:3000/api/integrations/resend/send \
  -H "Content-Type: application/json" \
  -H "X-Organization-Id: your-org-id" \
  -d '{
    "to": "user@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello</h1><p>This is a test email from HERA.</p>"
  }'
```

### Request Body Options

```typescript
{
  to: string | string[],           // Required: Recipient email(s)
  subject: string,                 // Required: Email subject
  html?: string,                   // HTML content (required if no text)
  text?: string,                   // Plain text content (required if no html)
  template?: string,               // Template name (WELCOME, NOTIFICATION, REPORT)
  templateData?: object,           // Data for template variables
  from?: string,                   // From email (defaults to noreply@heraerp.com)
  replyTo?: string,                // Reply-to email
  cc?: string | string[],          // CC recipients
  bcc?: string | string[],         // BCC recipients
  attachments?: Array<{            // File attachments
    filename: string,
    content: Buffer | string
  }>,
  tags?: Array<{                   // Resend tags for analytics
    name: string,
    value: string
  }>
}
```

### Email Templates

The integration includes pre-built templates:

1. **WELCOME Template**
   ```javascript
   {
     template: 'WELCOME',
     templateData: {
       name: 'John Doe',
       organization_name: 'HERA Corp'
     }
   }
   ```

2. **NOTIFICATION Template**
   ```javascript
   {
     template: 'NOTIFICATION',
     templateData: {
       notification_type: 'Alert',
       title: 'System Update',
       message: 'Your system has been updated.',
       action_url: 'https://example.com',
       action_text: 'View Details'
     }
   }
   ```

3. **REPORT Template**
   ```javascript
   {
     template: 'REPORT',
     templateData: {
       report_type: 'Monthly',
       date: '2024-01-01',
       content: '<p>Report content here</p>'
     }
   }
   ```

## CLI Usage

The integration includes a comprehensive CLI tool:

### Check Status
```bash
cd mcp-server
node hera-resend-cli.js status
```

### Send Simple Email
```bash
node hera-resend-cli.js send \
  --to user@example.com \
  --subject "Test Email" \
  --content "This is a test email from HERA"
```

### Send HTML Email
```bash
node hera-resend-cli.js send \
  --to user@example.com \
  --subject "Welcome" \
  --html "<h1>Welcome to HERA!</h1><p>We are glad to have you.</p>"
```

### Send Template Email
```bash
node hera-resend-cli.js send-template \
  --to user@example.com \
  --template WELCOME \
  --data '{"name":"John Doe","organization_name":"HERA Corp"}'
```

### Send with CC/BCC
```bash
node hera-resend-cli.js send \
  --to primary@example.com \
  --subject "Meeting Notes" \
  --content "Please find the meeting notes attached" \
  --cc "manager@example.com,team@example.com" \
  --bcc admin@example.com
```

### View Examples
```bash
node hera-resend-cli.js examples
```

## Demo Mode

When `RESEND_API_KEY` is not set, the integration runs in demo mode:
- Emails are not actually sent
- Transactions are still logged with simulated IDs
- Perfect for testing and development

## Transaction Logging

Every email operation creates entries in `universal_transactions`:

### Queued Transaction
```json
{
  "transaction_type": "communication",
  "smart_code": "HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.QUEUED.V1",
  "status": "pending",
  "metadata": {
    "channel": "email",
    "provider": "resend",
    "to": ["user@example.com"],
    "subject": "Test Email"
  }
}
```

### Sent Transaction
```json
{
  "transaction_type": "communication",
  "smart_code": "HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.SENT.V1",
  "status": "completed",
  "metadata": {
    "channel": "email",
    "provider": "resend",
    "resend_email_id": "email_abc123",
    "sent_at": "2024-01-01T12:00:00Z"
  }
}
```

## Multi-Tenant Support

The integration supports organization-specific email configuration:

1. Store organization-specific settings in `core_dynamic_data`:
   - `resend_from_email`: Default from address for the organization
   - `resend_reply_to`: Default reply-to address

2. Pass organization ID in headers:
   ```bash
   -H "X-Organization-Id: your-org-id"
   ```

## Integration with Playbooks

In HERA playbooks, you can send emails as part of workflows:

```yaml
- name: send_welcome_email
  type: api_call
  config:
    endpoint: /api/integrations/resend/send
    method: POST
    headers:
      X-Organization-Id: "{{org_id}}"
    body:
      to: "{{customer_email}}"
      template: WELCOME
      templateData:
        name: "{{customer_name}}"
        organization_name: "{{org_name}}"
```

## Monitoring and Analytics

### Query Email History
```sql
-- View all email transactions
SELECT * FROM universal_transactions 
WHERE smart_code LIKE 'HERA.PUBLICSECTOR.CRM.COMM.MESSAGE%' 
ORDER BY created_at DESC;

-- Count emails by status
SELECT 
  status,
  COUNT(*) as count 
FROM universal_transactions 
WHERE smart_code LIKE '%COMM.MESSAGE%' 
GROUP BY status;
```

### Using HERA CLI
```bash
# View recent email transactions
node hera-query.js transactions --filter "smart_code:HERA.PUBLICSECTOR.CRM.COMM.MESSAGE"

# Check failed emails
node hera-query.js transactions --filter "smart_code:MESSAGE.FAILED"
```

## Error Handling

The integration includes comprehensive error handling:

1. **Network Errors**: Automatically logged as failed transactions
2. **Invalid Recipients**: Validation before sending
3. **Missing API Key**: Falls back to demo mode
4. **Template Errors**: Clear error messages for missing variables

## Security Considerations

1. **API Key Storage**: Store API key in environment variables only
2. **Organization Isolation**: Emails are scoped to organization context
3. **Audit Trail**: Complete transaction logging for compliance
4. **Webhook Security**: Optional webhook signature validation

## Troubleshooting

### Email Not Sending
1. Check API key is correctly set in `.env`
2. Verify connector status: `node hera-resend-cli.js status`
3. Check transaction logs for error messages

### Demo Mode Active
- Ensure `RESEND_API_KEY` is set and server is restarted
- Check connector configuration in `core_dynamic_data`

### Webhook Not Working
1. Verify webhook URL is publicly accessible
2. Check webhook endpoint logs for errors
3. Ensure proper headers are set in Resend dashboard

## Benefits of Universal Pattern

1. **Audit Perfect**: Every email operation is logged as a transaction
2. **Replay Capability**: Failed emails can be replayed from transactions
3. **Multi-Tenant Ready**: Organization-level isolation built-in
4. **Smart Code Intelligence**: Automatic classification and routing
5. **Zero Schema Changes**: Uses existing universal tables
6. **Demo Safe**: Works without external dependencies in demo mode

## Next Steps

1. Configure production Resend API key
2. Set up webhook for delivery tracking
3. Create custom email templates as needed
4. Integrate with your playbooks and workflows
5. Monitor email performance through transactions

This integration demonstrates HERA's universal pattern: any external service can be integrated using the Sacred Six tables while maintaining complete audit trails and multi-tenant isolation.