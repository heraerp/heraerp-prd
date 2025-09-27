# HERA Resend Email Integration CLI

A command-line tool for testing and managing email sending through HERA's Resend integration.

## Quick Start

```bash
cd mcp-server

# Check setup and find organization IDs
node setup-resend-env.js

# Check Resend connector status
node hera-resend-cli.js status --org <organization-id>

# Send a test email
node hera-resend-cli.js send --to your@email.com --subject "Test" --content "Hello from HERA!" --org <organization-id>
```

## Environment Setup

Add these to your `.env` file:

```env
# Required for selecting organization
DEFAULT_ORGANIZATION_ID=your-org-uuid

# Optional - for sending real emails (works in demo mode without it)
RESEND_API_KEY=re_xxxxxxxxxxxxx
```

## Available Commands

### Status Check
```bash
node hera-resend-cli.js status [options]

Options:
  --org <organizationId>  Organization ID (optional if DEFAULT_ORGANIZATION_ID is set)
```

### Send Email
```bash
node hera-resend-cli.js send [options]

Required:
  -t, --to <email>         Recipient email address
  -s, --subject <subject>  Email subject
  
Content (one required):
  -c, --content <content>  Plain text content
  -h, --html <html>       HTML content

Optional:
  -f, --from <from>       From email address
  --cc <cc>               CC recipients (comma-separated)
  --bcc <bcc>             BCC recipients (comma-separated)
  --reply-to <replyTo>    Reply-to email address
  --org <organizationId>  Organization ID
```

### Send Template
```bash
node hera-resend-cli.js send-template [options]

Required:
  -t, --to <email>         Recipient email
  --template <template>    Template ID (WELCOME, NOTIFICATION, REPORT)
  --data <data>           Template data as JSON string

Optional:
  --org <organizationId>  Organization ID
```

## Examples

### Send Simple Text Email
```bash
node hera-resend-cli.js send \
  --to customer@example.com \
  --subject "Welcome to HERA" \
  --content "Thank you for joining us!" \
  --org f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944
```

### Send HTML Email
```bash
node hera-resend-cli.js send \
  --to customer@example.com \
  --subject "Welcome" \
  --html "<h1>Welcome to HERA!</h1><p>We're excited to have you.</p>" \
  --org f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944
```

### Send with CC and BCC
```bash
node hera-resend-cli.js send \
  --to primary@example.com \
  --subject "Team Update" \
  --content "Important team announcement" \
  --cc "manager@example.com,lead@example.com" \
  --bcc admin@example.com \
  --org f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944
```

### Send Welcome Template
```bash
node hera-resend-cli.js send-template \
  --to newuser@example.com \
  --template WELCOME \
  --data '{"name":"John Doe","organization_name":"Acme Corp"}' \
  --org f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944
```

### List Recent Emails
```bash
node hera-resend-cli.js list \
  --limit 10 \
  --org f1ae3ae4-73b1-4f91-9fd5-a431cbb5b944
```

## Demo Mode vs Production

- **Demo Mode** (no RESEND_API_KEY): Emails are logged to the database but not actually sent
- **Production Mode** (with RESEND_API_KEY): Emails are sent via Resend API and logged

## Email Tracking

All emails are tracked in HERA's universal transactions system with smart codes:
- Queued: `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.QUEUED.V1`
- Sent: `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.SENT.V1`
- Failed: `HERA.PUBLICSECTOR.CRM.COMM.MESSAGE.FAILED.V1`

## Troubleshooting

1. **"DEFAULT_ORGANIZATION_ID is not set"**
   - Run `node setup-resend-env.js` to find available organizations
   - Add `DEFAULT_ORGANIZATION_ID=<org-id>` to your `.env` file

2. **"RESEND_API_KEY is not set"**
   - The tool works in demo mode without it
   - To send real emails, get an API key from https://resend.com
   - Add `RESEND_API_KEY=re_xxxxx` to your `.env` file

3. **"Failed to send email"**
   - Check that the API server is running on port 3001
   - Verify organization ID exists in the database
   - Check email format is valid

## Integration with HERA

The Resend integration is part of HERA's universal communication system:
- Emails are stored as `universal_transactions` with type `communication`
- Templates support dynamic data injection
- Full audit trail and tracking
- Multi-tenant support with organization isolation