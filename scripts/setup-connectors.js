// Setup Pre-Built Connectors via Supabase Client
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

const PLATFORM_ORG_ID = '00000000-0000-0000-0000-000000000000'
const SYSTEM_ACTOR_ID = '00000000-0000-0000-0000-000000000001'

async function createConnectorDefinition(code, name, smartCode, config) {
  console.log(`📱 Creating ${name}...`)
  
  try {
    // Create connector entity
    const { data: entity, error: entityError } = await supabase
      .from('core_entities')
      .insert({
        organization_id: PLATFORM_ORG_ID,
        entity_type: 'INTEGRATION_CONNECTOR_DEF',
        entity_code: code,
        entity_name: name,
        smart_code: smartCode,
        created_by: SYSTEM_ACTOR_ID,
        updated_by: SYSTEM_ACTOR_ID
      })
      .select()
      .single()

    if (entityError) {
      console.log(`   ❌ Failed to create entity: ${entityError.message}`)
      return false
    }

    // Create connector configuration
    const { error: configError } = await supabase
      .from('core_dynamic_data')
      .insert({
        entity_id: entity.id,
        organization_id: PLATFORM_ORG_ID,
        field_name: 'connector_config',
        field_type: 'json',
        field_value_json: config,
        smart_code: smartCode + '.CONFIG',
        created_by: SYSTEM_ACTOR_ID,
        updated_by: SYSTEM_ACTOR_ID
      })

    if (configError) {
      console.log(`   ❌ Failed to create config: ${configError.message}`)
      return false
    }

    console.log(`   ✅ ${name} created successfully`)
    return true

  } catch (error) {
    console.log(`   ❌ Error creating ${name}: ${error.message}`)
    return false
  }
}

async function setupPreBuiltConnectors() {
  console.log('🚀 Setting up HERA Pre-Built Connectors...')
  console.log('===========================================')

  // WhatsApp Business Cloud API
  const whatsappConfig = {
    display_name: "WhatsApp Business Cloud API",
    description: "Send and receive WhatsApp messages using the official WhatsApp Business Cloud API. Perfect for customer support, notifications, and two-way communication.",
    category: "messaging",
    auth_type: "api_key",
    version: "1.0.0",
    status: "active",
    icon: "message-square",
    vendor: "Meta",
    supported_events: [
      "message_received",
      "message_sent", 
      "message_delivered",
      "message_read",
      "message_failed",
      "status_update",
      "webhook_verification"
    ],
    authentication: {
      type: "api_key",
      fields: [
        {
          name: "access_token",
          label: "Access Token",
          type: "password",
          required: true,
          description: "WhatsApp Business API access token from Meta Developer Console"
        },
        {
          name: "phone_number_id",
          label: "Phone Number ID", 
          type: "text",
          required: true,
          description: "WhatsApp Business phone number ID"
        }
      ]
    },
    api_endpoints: {
      base_url: "https://graph.facebook.com/v18.0"
    }
  }

  // LinkedIn Marketing API
  const linkedinConfig = {
    display_name: "LinkedIn Marketing API",
    description: "Access LinkedIn data, manage company pages, run advertising campaigns, and generate leads through the LinkedIn Marketing API.",
    category: "social",
    auth_type: "oauth2",
    version: "1.0.0", 
    status: "active",
    icon: "linkedin",
    vendor: "LinkedIn",
    supported_events: [
      "lead_generated",
      "campaign_updated",
      "ad_performance",
      "company_page_update", 
      "connection_made",
      "post_engagement"
    ],
    authentication: {
      type: "oauth2",
      fields: [
        {
          name: "client_id",
          label: "Client ID",
          type: "text",
          required: true
        },
        {
          name: "client_secret",
          label: "Client Secret",
          type: "password", 
          required: true
        }
      ]
    }
  }

  // Meta Graph API
  const metaConfig = {
    display_name: "Meta (Facebook) Graph API",
    description: "Integrate with Facebook and Instagram to manage pages, posts, advertising campaigns, and customer interactions across Meta platforms.",
    category: "social",
    auth_type: "oauth2",
    version: "1.0.0",
    status: "active",
    icon: "share-2",
    vendor: "Meta",
    supported_events: [
      "page_message_received",
      "post_published", 
      "comment_added",
      "lead_generated",
      "ad_campaign_updated",
      "page_liked",
      "instagram_mention"
    ],
    authentication: {
      type: "oauth2",
      fields: [
        {
          name: "app_id",
          label: "App ID",
          type: "text",
          required: true
        },
        {
          name: "app_secret",
          label: "App Secret",
          type: "password",
          required: true
        }
      ]
    }
  }

  // Zapier Webhook
  const zapierConfig = {
    display_name: "Zapier Webhook Integration",
    description: "Connect HERA with 5000+ apps through Zapier webhooks. Automate workflows between HERA and your favorite business tools.",
    category: "automation",
    auth_type: "webhook",
    version: "1.0.0",
    status: "active",
    icon: "zap",
    vendor: "Zapier",
    supported_events: [
      "webhook_received",
      "trigger_sent",
      "action_completed",
      "workflow_triggered"
    ],
    authentication: {
      type: "webhook",
      fields: [
        {
          name: "webhook_url",
          label: "Zapier Webhook URL",
          type: "url",
          required: true
        }
      ]
    }
  }

  // HubSpot CRM
  const hubspotConfig = {
    display_name: "HubSpot CRM API",
    description: "Synchronize contacts, deals, companies, and activities between HERA and HubSpot CRM. Perfect for sales pipeline management and marketing automation.",
    category: "crm",
    auth_type: "oauth2",
    version: "1.0.0",
    status: "active",
    icon: "users",
    vendor: "HubSpot",
    supported_events: [
      "contact_created",
      "contact_updated",
      "deal_created", 
      "deal_updated",
      "company_created",
      "form_submitted"
    ],
    authentication: {
      type: "oauth2",
      fields: [
        {
          name: "client_id",
          label: "Client ID",
          type: "text", 
          required: true
        },
        {
          name: "client_secret",
          label: "Client Secret",
          type: "password",
          required: true
        }
      ]
    }
  }

  // Create all connectors
  let successCount = 0
  
  const results = await Promise.all([
    createConnectorDefinition(
      'whatsapp-business-cloud',
      'WhatsApp Business Cloud API',
      'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.WHATSAPP_BUSINESS_CLOUD.v1',
      whatsappConfig
    ),
    createConnectorDefinition(
      'linkedin-api',
      'LinkedIn Marketing API', 
      'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.LINKEDIN_API.v1',
      linkedinConfig
    ),
    createConnectorDefinition(
      'meta-graph-api',
      'Meta (Facebook) Graph API',
      'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.META_GRAPH_API.v1',
      metaConfig
    ),
    createConnectorDefinition(
      'zapier-webhook',
      'Zapier Webhook Integration',
      'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.ZAPIER_WEBHOOK.v1',
      zapierConfig
    ),
    createConnectorDefinition(
      'hubspot-crm',
      'HubSpot CRM API',
      'HERA.PLATFORM.INTEGRATION.CONNECTOR_DEF.HUBSPOT_CRM.v1',
      hubspotConfig
    )
  ])

  successCount = results.filter(r => r).length

  console.log('\n🎉 Setup Complete!')
  console.log('================')
  console.log(`✅ Successfully created ${successCount} of 5 connector definitions`)
  
  if (successCount === 5) {
    console.log('\n🚀 HERA can now integrate with:')
    console.log('• WhatsApp Business - Customer messaging')
    console.log('• LinkedIn Marketing - Lead generation') 
    console.log('• Meta/Facebook - Social media management')
    console.log('• Zapier - Connect with 5000+ tools')
    console.log('• HubSpot CRM - Customer relationship management')
  }

  // Verify connectors
  console.log('\n📊 Verifying connector setup...')
  const { data: connectors, error } = await supabase
    .from('core_entities')
    .select('entity_code, entity_name, created_at')
    .eq('entity_type', 'INTEGRATION_CONNECTOR_DEF')
    .order('entity_code')

  if (!error && connectors) {
    console.log(`✅ Found ${connectors.length} connector definitions in database`)
    connectors.forEach(conn => {
      console.log(`   • ${conn.entity_code}: ${conn.entity_name}`)
    })
  }
}

setupPreBuiltConnectors().catch(console.error)