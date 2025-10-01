# CivicFlow Email Integration - Resend Setup Guide

## Phase 1: Complete Resend Integration ✅

This guide documents how the HERA-native Resend integration works with the universal 6-table architecture.

## Architecture Overview

### Data Mapping (No New Tables!)

1. **Email Sends → `universal_transactions`**
   - `transaction_type`: 'email_communication'
   - `smart_code`: 'HERA.COMMS.EMAIL.SEND.V1'
   - `status`: queued → sent → delivered → opened → clicked → bounced → complained → failed
   - `metadata`: Stores provider info, message_id, timestamps

2. **Recipients → `universal_transaction_lines`**
   - TO recipients: `line_type: 'TO'`
   - CC recipients: `line_type: 'CC'`
   - BCC recipients: `line_type: 'BCC'`
   - Attachments: `line_type: 'ATTACHMENT'`

3. **Email Content → `core_dynamic_data`**
   - `field_name`: 'email_content'
   - `smart_code`: 'HERA.COMMS.EMAIL.CONTENT.V1'
   - Stores: subject, html, text, tags, template_id, context

4. **Delivery Events → `core_dynamic_data`**
   - `field_name`: 'email*event*{type}'
   - `smart_code`: 'HERA.COMMS.EMAIL.EVENT.V1'
   - Complete audit trail of all Resend webhook events

## API Endpoints

### 1. Send Email

```
POST /api/v1/communications/emails/send
```

- Creates universal_transaction with status='queued'
- Sends via Resend API
- Updates status to 'sent' or 'failed'

### 2. Webhook Handler

```
POST /api/v1/communications/webhooks/resend
```

- Verifies Resend signature (HMAC)
- Maps provider events to HERA statuses
- Updates transaction by message_id

### 3. Email List

```
GET /api/v1/communications/emails
```

- Fetches emails from universal_transactions
- Supports folder filtering (inbox, sent, drafts, etc.)
- Returns formatted email objects

## Environment Variables Required

```bash
# Resend API Configuration
RESEND_API_KEY=re_xxx              # Your Resend API key
RESEND_WEBHOOK_SECRET=whsec_xxx    # Webhook signing secret

# Supabase Service Key (for API routes)
SUPABASE_SERVICE_KEY=xxx           # Service role key for backend operations
```

## Setting Up Webhooks in Resend

1. Go to Resend Dashboard → Webhooks
2. Add endpoint URL: `https://your-domain.com/api/v1/communications/webhooks/resend`
3. Select events:
   - email.sent
   - email.delivered
   - email.delivery_delayed
   - email.complained
   - email.bounced
   - email.opened
   - email.clicked
4. Copy the webhook signing secret to RESEND_WEBHOOK_SECRET

## Status Flow

```
queued (initial) → sent (Resend accepted) → delivered (inbox reached)
                                         ↘ bounced (permanent failure)
                                         ↘ complained (spam report)
                                         ↘ delayed (temporary issue)
                 ↘ failed (Resend rejected)
```

## Usage Example

```typescript
// Send email using the updated hook
const { mutateAsync: sendEmail } = useSendEmail()

await sendEmail({
  organizationId: 'civicflow-org-id',
  to: ['citizen@example.com'],
  subject: 'Your Service Request Update',
  body_text: 'Your request has been processed...',
  body_html: '<p>Your request has been processed...</p>',
  tags: ['service-request', 'update']
})

// Email is now tracked in universal_transactions with full status updates
```

## Testing the Integration

1. **Send Test Email**:

```bash
curl -X POST http://localhost:3000/api/v1/communications/emails/send \
  -H "Content-Type: application/json" \
  -d '{
    "organizationId": "8f1d2b33-5a60-4a4b-9c0c-6a2f35e3df77",
    "from": "test@civicflow.app",
    "to": ["test@example.com"],
    "subject": "Test Email",
    "text": "This is a test email"
  }'
```

2. **Check Transaction**:

```sql
SELECT * FROM universal_transactions
WHERE smart_code = 'HERA.COMMS.EMAIL.SEND.V1'
ORDER BY transaction_date DESC;
```

3. **View Recipients**:

```sql
SELECT * FROM universal_transaction_lines
WHERE transaction_id = 'your-tx-id';
```

4. **View Content**:

```sql
SELECT * FROM core_dynamic_data
WHERE entity_id = 'your-tx-id'
AND field_name = 'email_content';
```

## Benefits of HERA-Native Approach

1. **No Schema Changes**: Uses existing 6 sacred tables
2. **Complete Audit Trail**: Every event tracked as transactions
3. **Multi-Tenant Ready**: organization_id isolation built-in
4. **Smart Code Intelligence**: Business context on every email
5. **Universal Patterns**: Same approach works for SMS, push notifications, etc.
6. **Cost Tracking**: Can add cost per email to transaction_lines
7. **Analytics Ready**: Query patterns like any other business data

## Next Phases

- **Phase 2**: Email templates with dynamic content
- **Phase 3**: Bulk email campaigns
- **Phase 4**: Email analytics dashboard
- **Phase 5**: Multi-channel communications (SMS, push)
- **Phase 6**: AI-powered email composition
