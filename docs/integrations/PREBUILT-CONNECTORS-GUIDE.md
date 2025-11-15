# HERA Pre-Built Connector Definitions Guide

## Overview

HERA Integration Runtime now includes pre-built connector definitions for major platforms, making it immediately capable of integrating with:

- **WhatsApp Business Cloud API** - Customer messaging and support
- **LinkedIn Marketing API** - Professional networking and lead generation  
- **Meta (Facebook) Graph API** - Social media management and advertising
- **Zapier Webhooks** - Connect with 5000+ business tools
- **HubSpot CRM API** - Customer relationship management

## Quick Start

### 1. Setup Pre-Built Connectors

Run the setup script to initialize all pre-built connector definitions:

```bash
# Apply the connector definitions to your database
supabase db reset --linked
psql -h localhost -p 54322 -U postgres -d postgres -f scripts/setup-prebuilt-connectors.sql
```

### 2. Install a Connector

Use the Integration Hub to install connectors in your organization:

```typescript
// Example: Install WhatsApp Business Cloud connector
const response = await fetch('/api/v2/integrations/connectors', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    operation: 'INSTALL',
    connector_code: 'whatsapp-business-cloud',
    installation_config: {
      access_token: 'your_whatsapp_token',
      phone_number_id: 'your_phone_number_id',
      business_account_id: 'your_business_account_id',
      webhook_verify_token: 'your_webhook_token'
    }
  })
})
```

## Connector Configurations

### WhatsApp Business Cloud API

**Purpose:** Send and receive WhatsApp messages using the official Meta API.

**Authentication:** API Key
- `access_token` - WhatsApp Business API access token
- `phone_number_id` - WhatsApp Business phone number ID  
- `business_account_id` - WhatsApp Business Account ID
- `webhook_verify_token` - Webhook verification token

**Supported Events:**
- `message_received` - Incoming WhatsApp messages
- `message_sent` - Outgoing WhatsApp messages
- `message_delivered` - Message delivery confirmations
- `message_read` - Message read receipts
- `status_update` - General status updates

**Example Usage:**
```typescript
// Process incoming WhatsApp message
const messageEvent = await fetch('/api/v2/integrations/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_source: 'whatsapp-business-cloud',
    event_type: 'message_received',
    connector_code: 'whatsapp-business-cloud',
    event_data: {
      from: '+1234567890',
      message: 'Hello, I need help with my order',
      timestamp: '2024-11-15T10:30:00Z',
      message_id: 'wamid.xxx'
    },
    smart_code: 'HERA.WHATSAPP.EVENT.MESSAGE.RECEIVED.v1'
  })
})
```

### LinkedIn Marketing API

**Purpose:** Access LinkedIn data, manage company pages, and run advertising campaigns.

**Authentication:** OAuth 2.0
- `client_id` - LinkedIn App Client ID
- `client_secret` - LinkedIn App Client Secret
- Required scopes: `r_liteprofile`, `r_emailaddress`, `w_member_social`, `r_ads_reporting`

**Supported Events:**
- `lead_generated` - New leads from LinkedIn campaigns
- `campaign_updated` - Campaign status changes
- `post_engagement` - User interactions with posts
- `connection_made` - New professional connections

**Example Usage:**
```typescript
// Process LinkedIn lead generation
const leadEvent = await fetch('/api/v2/integrations/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_source: 'linkedin-api',
    event_type: 'lead_generated',
    connector_code: 'linkedin-api',
    event_data: {
      lead_id: 'urn:li:leadgenForm:123456',
      campaign_id: 'urn:li:sponsoredCampaign:789012',
      firstName: 'John',
      lastName: 'Doe',
      emailAddress: 'john.doe@example.com',
      company: 'ACME Corp',
      submittedAt: '2024-11-15T14:22:00Z'
    },
    smart_code: 'HERA.LINKEDIN.EVENT.LEAD.GENERATED.v1'
  })
})
```

### Meta (Facebook) Graph API

**Purpose:** Manage Facebook and Instagram business accounts, pages, and advertising.

**Authentication:** OAuth 2.0
- `app_id` - Facebook App ID
- `app_secret` - Facebook App Secret
- Required scopes: `pages_messaging`, `pages_manage_posts`, `ads_management`, `instagram_basic`

**Supported Events:**
- `page_message_received` - Messages to Facebook pages
- `post_published` - New posts on Facebook/Instagram
- `lead_generated` - Leads from Facebook lead ads
- `instagram_mention` - Business mentions on Instagram

**Example Usage:**
```typescript
// Process Facebook page message
const messageEvent = await fetch('/api/v2/integrations/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_source: 'meta-graph-api',
    event_type: 'page_message_received',
    connector_code: 'meta-graph-api',
    event_data: {
      page_id: '12345678901234567',
      sender_id: '98765432109876543',
      message: 'Hi, I saw your Facebook ad and I\'m interested',
      timestamp: '2024-11-15T16:45:00Z',
      thread_id: 't_mid.xxx'
    },
    smart_code: 'HERA.META.EVENT.PAGE.MESSAGE.RECEIVED.v1'
  })
})
```

### Zapier Webhooks

**Purpose:** Connect HERA with 5000+ business tools through Zapier automation.

**Authentication:** Webhook URL
- `webhook_url` - Zapier webhook URL
- `auth_header` - Optional authentication header

**Supported Events:**
- `webhook_received` - Incoming triggers from Zapier
- `trigger_sent` - Events sent to trigger Zapier workflows
- `workflow_triggered` - Zapier automation executed

**Example Usage:**
```typescript
// Send trigger to Zapier workflow
const zapierTrigger = await fetch('/api/v2/integrations/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_source: 'zapier-webhook',
    event_type: 'trigger_sent',
    connector_code: 'zapier-webhook',
    event_data: {
      trigger_type: 'customer_created',
      customer: {
        id: 'cust_12345',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-555-0123',
        created_at: '2024-11-15T12:00:00Z'
      },
      organization_name: 'Beauty Salon Pro'
    },
    smart_code: 'HERA.ZAPIER.EVENT.TRIGGER.SENT.v1'
  })
})
```

### HubSpot CRM API

**Purpose:** Synchronize contacts, deals, companies, and activities with HubSpot CRM.

**Authentication:** OAuth 2.0
- `client_id` - HubSpot App Client ID
- `client_secret` - HubSpot App Client Secret
- Required scopes: `contacts`, `automation`, `forms`, `integration-sync`

**Supported Events:**
- `contact_created` - New contacts added to HubSpot
- `deal_created` - New deals in the sales pipeline
- `form_submitted` - Form submissions from HubSpot
- `company_updated` - Company record changes

**Example Usage:**
```typescript
// Process HubSpot form submission
const formEvent = await fetch('/api/v2/integrations/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    event_source: 'hubspot-crm',
    event_type: 'form_submitted',
    connector_code: 'hubspot-crm',
    event_data: {
      form_id: '12345678-abcd-1234-5678-90abcdef1234',
      portal_id: 987654321,
      contact_email: 'prospect@example.com',
      contact_firstname: 'Alex',
      contact_lastname: 'Johnson',
      form_fields: {
        company: 'TechStart Inc',
        phone: '+1-555-0199',
        message: 'Interested in your salon management software'
      },
      submitted_at: '2024-11-15T09:15:00Z'
    },
    smart_code: 'HERA.HUBSPOT.EVENT.FORM.SUBMITTED.v1'
  })
})
```

## Integration Patterns

### 1. Webhook Processing Pattern

Most connectors support webhook-based real-time events:

```typescript
// Webhook endpoint handler (example for Next.js API route)
export async function POST(request: Request) {
  const payload = await request.json()
  
  // Verify webhook signature (connector-specific)
  const isValid = verifyWebhookSignature(payload, request.headers)
  if (!isValid) {
    return Response.json({ error: 'Invalid signature' }, { status: 401 })
  }
  
  // Process event through HERA Integration Runtime
  const result = await fetch('/api/v2/integrations/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Organization-Id': orgId,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_source: 'whatsapp-business-cloud',
      event_type: payload.entry?.[0]?.changes?.[0]?.value?.messages ? 'message_received' : 'status_update',
      connector_code: 'whatsapp-business-cloud',
      event_data: payload,
      idempotency_key: `webhook_${payload.entry?.[0]?.id}_${Date.now()}`
    })
  })
  
  return Response.json({ success: true })
}
```

### 2. Bi-Directional Sync Pattern

For CRM and social platforms:

```typescript
// Sync customer from HERA to HubSpot
async function syncCustomerToHubSpot(customer: Customer) {
  // Create contact in HubSpot via their API
  const hubspotContact = await createHubSpotContact(customer)
  
  // Record the sync event in HERA
  await fetch('/api/v2/integrations/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Organization-Id': customer.organization_id,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_source: 'hubspot-crm',
      event_type: 'contact_created',
      connector_code: 'hubspot-crm',
      event_data: {
        hera_customer_id: customer.id,
        hubspot_contact_id: hubspotContact.id,
        sync_direction: 'hera_to_hubspot',
        synced_fields: ['name', 'email', 'phone', 'company']
      },
      smart_code: 'HERA.HUBSPOT.EVENT.CONTACT.CREATED.v1'
    })
  })
}
```

### 3. Automation Trigger Pattern

For Zapier and workflow automation:

```typescript
// Trigger Zapier workflow when appointment is completed
async function triggerAppointmentCompleted(appointment: Appointment) {
  await fetch('/api/v2/integrations/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'X-Organization-Id': appointment.organization_id,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      event_source: 'zapier-webhook',
      event_type: 'trigger_sent',
      connector_code: 'zapier-webhook',
      event_data: {
        trigger_type: 'appointment_completed',
        appointment: {
          id: appointment.id,
          customer_name: appointment.customer_name,
          service: appointment.service,
          total_amount: appointment.total_amount,
          completed_at: appointment.completed_at
        }
      },
      smart_code: 'HERA.ZAPIER.EVENT.TRIGGER.SENT.v1'
    })
  })
}
```

## Monitoring & Troubleshooting

### Integration Logs

Monitor integration events through the Integration Hub:

```typescript
// Get recent integration logs
const logs = await fetch('/api/v2/integrations/logs', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'X-Organization-Id': orgId,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    limit: 50,
    connector_code: 'whatsapp-business-cloud',
    status: 'error' // or 'success', 'pending'
  })
})
```

### Common Issues

1. **Webhook Verification Failed**
   - Check webhook verify token configuration
   - Ensure webhook URL is publicly accessible
   - Verify signature calculation

2. **Rate Limit Exceeded** 
   - Review connector rate limits in configuration
   - Implement exponential backoff in webhook processing
   - Consider queuing high-volume events

3. **Authentication Expired**
   - Refresh OAuth tokens automatically
   - Monitor token expiration times
   - Implement token refresh workflows

## Security Best Practices

1. **Webhook Security**
   - Always verify webhook signatures
   - Use HTTPS endpoints only
   - Implement rate limiting on webhook endpoints

2. **Token Management**
   - Store access tokens securely (encrypted)
   - Implement token rotation
   - Monitor for suspicious activity

3. **Data Privacy** 
   - Follow connector-specific data privacy guidelines
   - Implement data retention policies
   - Respect user consent preferences

## Support & Documentation

- **HERA Integration Runtime**: See main integration documentation
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **LinkedIn Marketing API**: https://docs.microsoft.com/en-us/linkedin/marketing/
- **Meta Graph API**: https://developers.facebook.com/docs/graph-api/
- **Zapier Webhooks**: https://zapier.com/help/doc/how-get-started-webhooks-zapier
- **HubSpot API**: https://developers.hubspot.com/docs/api/overview

---

🎉 **With these pre-built connectors, HERA can now integrate with WhatsApp, LinkedIn, Meta, Zapier, and HubSpot out of the box!**