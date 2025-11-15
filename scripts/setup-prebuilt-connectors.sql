-- HERA Pre-Built Connector Definitions Setup
-- Smart Code: HERA.PLATFORM.INTEGRATION.CONNECTORS.PREBUILT.v1
-- 
-- Creates connector definitions for WhatsApp, LinkedIn, Meta, and other major platforms
-- Making HERA immediately capable of integrating with these external systems

-- ============================================================================
-- WHATSAPP BUSINESS CLOUD API CONNECTOR
-- ============================================================================

-- WhatsApp Business Cloud API Connector Definition
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  created_by,
  updated_by,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000', -- Platform org
  'INTEGRATION_CONNECTOR_DEF',
  'whatsapp-business-cloud',
  'WhatsApp Business Cloud API',
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.WHATSAPP_BUSINESS_CLOUD.v1',
  '00000000-0000-0000-0000-000000000001', -- System actor
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'
    AND entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND entity_code = 'whatsapp-business-cloud'
);

-- WhatsApp Business Cloud API Configuration
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,
  field_name,
  field_type,
  field_value_json,
  smart_code,
  created_by,
  updated_by
) 
SELECT 
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'connector_config',
  'json',
  '{
    "display_name": "WhatsApp Business Cloud API",
    "description": "Send and receive WhatsApp messages using the official WhatsApp Business Cloud API. Perfect for customer support, notifications, and two-way communication.",
    "category": "messaging",
    "auth_type": "api_key",
    "version": "1.0.0",
    "status": "active",
    "icon": "message-square",
    "vendor": "Meta",
    "documentation_url": "https://developers.facebook.com/docs/whatsapp/cloud-api",
    "supported_events": [
      "message_received",
      "message_sent",
      "message_delivered", 
      "message_read",
      "message_failed",
      "status_update",
      "webhook_verification"
    ],
    "event_mappings": {
      "message_received": {
        "hera_smart_code": "HERA.WHATSAPP.EVENT.MESSAGE.RECEIVED.v1",
        "description": "Incoming WhatsApp message from customer"
      },
      "message_sent": {
        "hera_smart_code": "HERA.WHATSAPP.EVENT.MESSAGE.SENT.v1", 
        "description": "Outgoing WhatsApp message sent to customer"
      },
      "status_update": {
        "hera_smart_code": "HERA.WHATSAPP.EVENT.STATUS.UPDATE.v1",
        "description": "Message delivery status update"
      }
    },
    "authentication": {
      "type": "api_key",
      "fields": [
        {
          "name": "access_token",
          "label": "Access Token",
          "type": "password",
          "required": true,
          "description": "WhatsApp Business API access token from Meta Developer Console"
        },
        {
          "name": "phone_number_id",
          "label": "Phone Number ID",
          "type": "text",
          "required": true,
          "description": "WhatsApp Business phone number ID"
        },
        {
          "name": "business_account_id",
          "label": "Business Account ID", 
          "type": "text",
          "required": true,
          "description": "WhatsApp Business Account ID"
        },
        {
          "name": "webhook_verify_token",
          "label": "Webhook Verify Token",
          "type": "password",
          "required": true,
          "description": "Token for webhook verification"
        }
      ]
    },
    "api_endpoints": {
      "base_url": "https://graph.facebook.com/v18.0",
      "send_message": "/{{phone_number_id}}/messages",
      "get_media": "/{{media_id}}",
      "upload_media": "/{{phone_number_id}}/media"
    },
    "webhook_config": {
      "required": true,
      "events": ["messages", "message_status"],
      "verification_required": true
    },
    "rate_limits": {
      "messages_per_second": 20,
      "messages_per_day": 1000,
      "burst_limit": 100
    },
    "message_types": [
      "text",
      "image", 
      "document",
      "audio",
      "video",
      "template",
      "interactive"
    ]
  }'::jsonb,
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.WHATSAPP_BUSINESS_CLOUD.CONFIG.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
FROM core_entities e
WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
  AND e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.entity_code = 'whatsapp-business-cloud'
;

-- ============================================================================
-- LINKEDIN API CONNECTOR
-- ============================================================================

-- LinkedIn API Connector Definition  
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  created_by,
  updated_by,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'INTEGRATION_CONNECTOR_DEF',
  'linkedin-api',
  'LinkedIn Marketing API',
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.LINKEDIN_API.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'
    AND entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND entity_code = 'linkedin-api'
);

-- LinkedIn API Configuration
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,
  field_name,
  field_type,
  field_value_json,
  smart_code,
  created_by,
  updated_by
)
SELECT
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'connector_config',
  'json',
  '{
    "display_name": "LinkedIn Marketing API",
    "description": "Access LinkedIn data, manage company pages, run advertising campaigns, and generate leads through the LinkedIn Marketing API.",
    "category": "social",
    "auth_type": "oauth2", 
    "version": "1.0.0",
    "status": "active",
    "icon": "linkedin",
    "vendor": "LinkedIn",
    "documentation_url": "https://docs.microsoft.com/en-us/linkedin/marketing/",
    "supported_events": [
      "lead_generated",
      "campaign_updated",
      "ad_performance",
      "company_page_update",
      "connection_made",
      "post_engagement",
      "message_received"
    ],
    "event_mappings": {
      "lead_generated": {
        "hera_smart_code": "HERA.LINKEDIN.EVENT.LEAD.GENERATED.v1",
        "description": "New lead captured through LinkedIn campaign"
      },
      "campaign_updated": {
        "hera_smart_code": "HERA.LINKEDIN.EVENT.CAMPAIGN.UPDATED.v1",
        "description": "LinkedIn advertising campaign status change"
      },
      "post_engagement": {
        "hera_smart_code": "HERA.LINKEDIN.EVENT.POST.ENGAGEMENT.v1",
        "description": "User engagement with LinkedIn post (like, comment, share)"
      }
    },
    "authentication": {
      "type": "oauth2",
      "authorization_url": "https://www.linkedin.com/oauth/v2/authorization",
      "token_url": "https://www.linkedin.com/oauth/v2/accessToken",
      "scopes": [
        "r_liteprofile",
        "r_emailaddress", 
        "w_member_social",
        "r_organization_social",
        "w_organization_social",
        "r_1st_connections_size",
        "r_ads_reporting"
      ],
      "fields": [
        {
          "name": "client_id",
          "label": "Client ID",
          "type": "text",
          "required": true,
          "description": "LinkedIn App Client ID"
        },
        {
          "name": "client_secret", 
          "label": "Client Secret",
          "type": "password",
          "required": true,
          "description": "LinkedIn App Client Secret"
        }
      ]
    },
    "api_endpoints": {
      "base_url": "https://api.linkedin.com/v2",
      "people": "/people",
      "companies": "/companies",
      "shares": "/shares",
      "adCampaigns": "/adCampaignsV2",
      "leadForms": "/leadForms"
    },
    "rate_limits": {
      "requests_per_day": 500000,
      "requests_per_second": 100,
      "burst_limit": 1000
    },
    "data_types": [
      "profile_data",
      "company_data",
      "lead_data",
      "campaign_data", 
      "engagement_data",
      "connection_data"
    ]
  }'::jsonb,
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.LINKEDIN_API.CONFIG.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
FROM core_entities e
WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
  AND e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.entity_code = 'linkedin-api'
;

-- ============================================================================
-- META (FACEBOOK) GRAPH API CONNECTOR
-- ============================================================================

-- Meta Graph API Connector Definition
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  created_by,
  updated_by,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'INTEGRATION_CONNECTOR_DEF', 
  'meta-graph-api',
  'Meta (Facebook) Graph API',
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.META_GRAPH_API.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'
    AND entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND entity_code = 'meta-graph-api'
);

-- Meta Graph API Configuration
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,
  field_name,
  field_type,
  field_value_json,
  smart_code,
  created_by,
  updated_by
)
SELECT
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'connector_config',
  'json',
  '{
    "display_name": "Meta (Facebook) Graph API",
    "description": "Integrate with Facebook and Instagram to manage pages, posts, advertising campaigns, and customer interactions across Meta platforms.",
    "category": "social",
    "auth_type": "oauth2",
    "version": "1.0.0", 
    "status": "active",
    "icon": "share-2",
    "vendor": "Meta",
    "documentation_url": "https://developers.facebook.com/docs/graph-api/",
    "supported_events": [
      "page_message_received",
      "post_published",
      "comment_added",
      "lead_generated",
      "ad_campaign_updated",
      "page_liked",
      "instagram_mention",
      "story_published"
    ],
    "event_mappings": {
      "page_message_received": {
        "hera_smart_code": "HERA.META.EVENT.PAGE.MESSAGE.RECEIVED.v1",
        "description": "Message received on Facebook page"
      },
      "post_published": {
        "hera_smart_code": "HERA.META.EVENT.POST.PUBLISHED.v1", 
        "description": "New post published to Facebook or Instagram"
      },
      "lead_generated": {
        "hera_smart_code": "HERA.META.EVENT.LEAD.GENERATED.v1",
        "description": "Lead captured through Facebook lead ads"
      },
      "instagram_mention": {
        "hera_smart_code": "HERA.META.EVENT.INSTAGRAM.MENTION.v1",
        "description": "Business mentioned in Instagram post or story"
      }
    },
    "authentication": {
      "type": "oauth2",
      "authorization_url": "https://www.facebook.com/v18.0/dialog/oauth",
      "token_url": "https://graph.facebook.com/v18.0/oauth/access_token",
      "scopes": [
        "pages_messaging",
        "pages_read_engagement",
        "pages_manage_posts",
        "pages_read_user_content",
        "pages_show_list",
        "business_management",
        "ads_management",
        "instagram_basic",
        "instagram_content_publish",
        "leads_retrieval"
      ],
      "fields": [
        {
          "name": "app_id",
          "label": "App ID",
          "type": "text",
          "required": true,
          "description": "Facebook App ID"
        },
        {
          "name": "app_secret",
          "label": "App Secret", 
          "type": "password",
          "required": true,
          "description": "Facebook App Secret"
        },
        {
          "name": "page_access_token",
          "label": "Page Access Token",
          "type": "password",
          "required": false,
          "description": "Long-lived page access token (generated during OAuth flow)"
        }
      ]
    },
    "api_endpoints": {
      "base_url": "https://graph.facebook.com/v18.0",
      "pages": "/me/accounts",
      "page_messages": "/{{page_id}}/conversations",
      "page_posts": "/{{page_id}}/posts",
      "ad_accounts": "/me/adaccounts",
      "instagram_accounts": "/{{page_id}}?fields=instagram_business_account",
      "leadgen_forms": "/{{page_id}}/leadgen_forms"
    },
    "webhook_config": {
      "required": true,
      "events": ["messages", "messaging_postbacks", "feed", "leadgen"],
      "verification_required": true,
      "app_secret_proof_required": true
    },
    "rate_limits": {
      "api_calls_per_hour": 200,
      "api_calls_per_user_per_hour": 600,
      "burst_limit": 50,
      "messaging_rate": "1000 per day per page"
    },
    "platforms": [
      "facebook_pages",
      "facebook_ads",
      "instagram_business", 
      "messenger",
      "facebook_shops"
    ]
  }'::jsonb,
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.META_GRAPH_API.CONFIG.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
FROM core_entities e
WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
  AND e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.entity_code = 'meta-graph-api'
;

-- ============================================================================
-- ZAPIER WEBHOOK CONNECTOR  
-- ============================================================================

-- Zapier Webhook Connector Definition
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  created_by,
  updated_by,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'INTEGRATION_CONNECTOR_DEF',
  'zapier-webhook',
  'Zapier Webhook Integration',
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.ZAPIER_WEBHOOK.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'
    AND entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND entity_code = 'zapier-webhook'
);

-- Zapier Webhook Configuration
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,
  field_name,
  field_type,
  field_value_json,
  smart_code,
  created_by,
  updated_by
)
SELECT
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'connector_config',
  'json',
  '{
    "display_name": "Zapier Webhook Integration",
    "description": "Connect HERA with 5000+ apps through Zapier webhooks. Automate workflows between HERA and your favorite business tools.",
    "category": "automation",
    "auth_type": "webhook",
    "version": "1.0.0",
    "status": "active",
    "icon": "zap",
    "vendor": "Zapier",
    "documentation_url": "https://zapier.com/help/doc/how-get-started-webhooks-zapier",
    "supported_events": [
      "webhook_received",
      "trigger_sent", 
      "action_completed",
      "zap_enabled",
      "zap_disabled",
      "workflow_triggered",
      "data_synced"
    ],
    "event_mappings": {
      "webhook_received": {
        "hera_smart_code": "HERA.ZAPIER.EVENT.WEBHOOK.RECEIVED.v1",
        "description": "Incoming webhook trigger from Zapier"
      },
      "trigger_sent": {
        "hera_smart_code": "HERA.ZAPIER.EVENT.TRIGGER.SENT.v1",
        "description": "HERA event sent to trigger Zapier workflow"
      },
      "workflow_triggered": {
        "hera_smart_code": "HERA.ZAPIER.EVENT.WORKFLOW.TRIGGERED.v1",
        "description": "Zapier workflow triggered by HERA event"
      }
    },
    "authentication": {
      "type": "webhook",
      "fields": [
        {
          "name": "webhook_url",
          "label": "Zapier Webhook URL",
          "type": "url",
          "required": true,
          "description": "Webhook URL provided by Zapier when setting up the trigger"
        },
        {
          "name": "auth_header",
          "label": "Authentication Header (Optional)",
          "type": "password", 
          "required": false,
          "description": "Optional authentication header for webhook security"
        }
      ]
    },
    "api_endpoints": {
      "base_url": "https://hooks.zapier.com",
      "webhook_endpoint": "/hooks/catch/{{hook_id}}/{{catch_id}}/"
    },
    "webhook_config": {
      "required": false,
      "bidirectional": true,
      "supported_methods": ["POST", "PUT"],
      "content_types": ["application/json", "application/x-www-form-urlencoded"]
    },
    "rate_limits": {
      "requests_per_minute": 300,
      "burst_limit": 100
    },
    "supported_triggers": [
      "customer_created",
      "order_completed",
      "appointment_scheduled", 
      "payment_received",
      "invoice_sent",
      "user_registered",
      "custom_event"
    ],
    "supported_actions": [
      "create_lead",
      "send_email", 
      "add_to_spreadsheet",
      "create_task",
      "post_to_slack",
      "update_crm_record",
      "send_sms"
    ]
  }'::jsonb,
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.ZAPIER_WEBHOOK.CONFIG.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
FROM core_entities e
WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
  AND e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.entity_code = 'zapier-webhook'
;

-- ============================================================================
-- HUBSPOT CRM API CONNECTOR
-- ============================================================================

-- HubSpot CRM API Connector Definition
INSERT INTO core_entities (
  id,
  organization_id,
  entity_type,
  entity_code,
  entity_name,
  smart_code,
  created_by,
  updated_by,
  created_at,
  updated_at
) 
SELECT 
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'INTEGRATION_CONNECTOR_DEF',
  'hubspot-crm',
  'HubSpot CRM API',
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.HUBSPOT_CRM.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM core_entities 
  WHERE organization_id = '00000000-0000-0000-0000-000000000000'
    AND entity_type = 'INTEGRATION_CONNECTOR_DEF'
    AND entity_code = 'hubspot-crm'
);

-- HubSpot CRM Configuration
INSERT INTO core_dynamic_data (
  entity_id,
  organization_id,
  field_name,
  field_type,
  field_value_json,
  smart_code,
  created_by,
  updated_by
)
SELECT
  e.id,
  '00000000-0000-0000-0000-000000000000',
  'connector_config',
  'json',
  '{
    "display_name": "HubSpot CRM API",
    "description": "Synchronize contacts, deals, companies, and activities between HERA and HubSpot CRM. Perfect for sales pipeline management and marketing automation.",
    "category": "crm",
    "auth_type": "oauth2",
    "version": "1.0.0",
    "status": "active",
    "icon": "users",
    "vendor": "HubSpot",
    "documentation_url": "https://developers.hubspot.com/docs/api/overview",
    "supported_events": [
      "contact_created",
      "contact_updated",
      "deal_created",
      "deal_updated", 
      "company_created",
      "company_updated",
      "task_created",
      "email_sent",
      "form_submitted"
    ],
    "event_mappings": {
      "contact_created": {
        "hera_smart_code": "HERA.HUBSPOT.EVENT.CONTACT.CREATED.v1",
        "description": "New contact added to HubSpot CRM"
      },
      "deal_created": {
        "hera_smart_code": "HERA.HUBSPOT.EVENT.DEAL.CREATED.v1",
        "description": "New deal created in HubSpot pipeline"
      },
      "form_submitted": {
        "hera_smart_code": "HERA.HUBSPOT.EVENT.FORM.SUBMITTED.v1",
        "description": "Form submission received through HubSpot"
      }
    },
    "authentication": {
      "type": "oauth2",
      "authorization_url": "https://app.hubspot.com/oauth/authorize",
      "token_url": "https://api.hubapi.com/oauth/v1/token",
      "scopes": [
        "contacts",
        "content",
        "reports",
        "social",
        "automation", 
        "timeline",
        "forms",
        "files",
        "hubdb",
        "integration-sync",
        "tickets",
        "e-commerce"
      ],
      "fields": [
        {
          "name": "client_id",
          "label": "Client ID",
          "type": "text",
          "required": true,
          "description": "HubSpot App Client ID"
        },
        {
          "name": "client_secret",
          "label": "Client Secret",
          "type": "password",
          "required": true,
          "description": "HubSpot App Client Secret"
        }
      ]
    },
    "api_endpoints": {
      "base_url": "https://api.hubapi.com",
      "contacts": "/crm/v3/objects/contacts",
      "companies": "/crm/v3/objects/companies", 
      "deals": "/crm/v3/objects/deals",
      "tickets": "/crm/v3/objects/tickets",
      "notes": "/crm/v3/objects/notes",
      "tasks": "/crm/v3/objects/tasks",
      "emails": "/crm/v3/objects/emails",
      "forms": "/forms/v2/forms"
    },
    "webhook_config": {
      "required": true,
      "events": ["contact.creation", "contact.propertyChange", "deal.creation", "deal.propertyChange", "company.creation"],
      "verification_required": false
    },
    "rate_limits": {
      "requests_per_second": 10,
      "daily_limit": 40000,
      "burst_limit": 100
    },
    "sync_objects": [
      "contacts",
      "companies",
      "deals",
      "tickets",
      "products",
      "line_items",
      "quotes",
      "tasks",
      "notes",
      "emails",
      "calls",
      "meetings"
    ]
  }'::jsonb,
  'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.HUBSPOT_CRM.CONFIG.v1',
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001'
FROM core_entities e
WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
  AND e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.entity_code = 'hubspot-crm'
;

-- ============================================================================
-- VERIFICATION & SUMMARY
-- ============================================================================

-- Verify all connectors were created successfully
SELECT 
  entity_code as connector_code,
  entity_name as connector_name,
  created_at,
  (SELECT jsonb_extract_path_text(field_value_json, 'category') 
   FROM core_dynamic_data d 
   WHERE d.entity_id = e.id 
   AND d.field_name = 'connector_config') as category,
  (SELECT jsonb_extract_path_text(field_value_json, 'auth_type')
   FROM core_dynamic_data d
   WHERE d.entity_id = e.id
   AND d.field_name = 'connector_config') as auth_type,
  (SELECT jsonb_array_length(jsonb_extract_path(field_value_json, 'supported_events'))
   FROM core_dynamic_data d
   WHERE d.entity_id = e.id
   AND d.field_name = 'connector_config') as supported_events_count
FROM core_entities e
WHERE e.organization_id = '00000000-0000-0000-0000-000000000000'
  AND e.entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND e.entity_code IN ('whatsapp-business-cloud', 'linkedin-api', 'meta-graph-api', 'zapier-webhook', 'hubspot-crm')
ORDER BY e.created_at;

-- Summary report
SELECT 
  '🎉 HERA Integration Runtime Pre-Built Connectors Setup Complete!' as status,
  count(*) as total_connectors_created,
  string_agg(entity_code, ', ' ORDER BY entity_code) as connector_codes
FROM core_entities
WHERE organization_id = '00000000-0000-0000-0000-000000000000'
  AND entity_type = 'INTEGRATION_CONNECTOR_DEF'
  AND entity_code IN ('whatsapp-business-cloud', 'linkedin-api', 'meta-graph-api', 'zapier-webhook', 'hubspot-crm');