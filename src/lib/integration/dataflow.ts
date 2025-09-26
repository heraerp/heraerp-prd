// DataFlow configuration for all supported integrations

export interface DataFlowConfig {
  vendor: string
  domain: string
  direction: 'pull' | 'push' | 'bidirectional'
  cadence: '15m' | 'hourly' | 'daily' | 'weekly' | 'manual' | 'realtime'
  payloads: Array<{
    entity_type: string
    smart_code_pattern: string
    description: string
  }>
  capabilities: string[]
}

export const dataFlows: DataFlowConfig[] = [
  // Eventbrite Events Integration
  {
    vendor: 'eventbrite',
    domain: 'events',
    direction: 'pull',
    cadence: '15m',
    payloads: [
      {
        entity_type: 'event',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.EVENT.{TYPE}.v1',
        description: 'Public events, workshops, conferences, and town halls'
      },
      {
        entity_type: 'event_invite',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.EVENT.INVITE.v1',
        description: 'Event registrations, attendees, and check-ins'
      }
    ],
    capabilities: [
      'event_sync',
      'attendee_sync',
      'checkin_tracking',
      'capacity_management'
    ]
  },
  
  // Salesforce Constituents Integration
  {
    vendor: 'salesforce',
    domain: 'constituents',
    direction: 'bidirectional',
    cadence: 'hourly',
    payloads: [
      {
        entity_type: 'constituent',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.CONSTITUENT.{TYPE}.v1',
        description: 'Citizens, residents, and community members'
      },
      {
        entity_type: 'organization',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.ORGANIZATION.{TYPE}.v1',
        description: 'Community organizations, NGOs, and partners'
      }
    ],
    capabilities: [
      'contact_sync',
      'organization_sync',
      'relationship_mapping',
      'custom_field_mapping'
    ]
  },
  
  // HubSpot Communications Integration
  {
    vendor: 'hubspot',
    domain: 'communications',
    direction: 'push',
    cadence: 'realtime',
    payloads: [
      {
        entity_type: 'communication_campaign',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.COMM.CAMPAIGN.{TYPE}.v1',
        description: 'Email campaigns and newsletters'
      },
      {
        entity_type: 'communication_template',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.COMM.TEMPLATE.{TYPE}.v1',
        description: 'Email templates for citizen communications'
      }
    ],
    capabilities: [
      'campaign_sync',
      'template_sync',
      'engagement_tracking',
      'unsubscribe_sync'
    ]
  },
  
  // QuickBooks Financial Integration
  {
    vendor: 'quickbooks',
    domain: 'financial',
    direction: 'bidirectional',
    cadence: 'daily',
    payloads: [
      {
        entity_type: 'grant',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.GRANT.{TYPE}.v1',
        description: 'Grant funding and allocations'
      },
      {
        entity_type: 'invoice',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.INVOICE.{TYPE}.v1',
        description: 'Invoices for services and fees'
      }
    ],
    capabilities: [
      'invoice_sync',
      'payment_sync',
      'grant_tracking',
      'budget_monitoring'
    ]
  },
  
  // Mailchimp Audience Integration
  {
    vendor: 'mailchimp',
    domain: 'audiences',
    direction: 'push',
    cadence: 'hourly',
    payloads: [
      {
        entity_type: 'audience_segment',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.AUDIENCE.SEGMENT.v1',
        description: 'Citizen segments for targeted communications'
      },
      {
        entity_type: 'constituent',
        smart_code_pattern: 'HERA.PUBLICSECTOR.CRM.CONSTITUENT.{TYPE}.v1',
        description: 'Subscriber list synchronization'
      }
    ],
    capabilities: [
      'list_sync',
      'segment_sync',
      'subscriber_updates',
      'engagement_metrics'
    ]
  }
]

// Get DataFlow configuration by vendor and domain
export function getDataFlow(vendor: string, domain: string): DataFlowConfig | undefined {
  return dataFlows.find(flow => 
    flow.vendor === vendor && flow.domain === domain
  )
}

// Get all DataFlows for a specific vendor
export function getVendorDataFlows(vendor: string): DataFlowConfig[] {
  return dataFlows.filter(flow => flow.vendor === vendor)
}

// Get all supported vendors
export function getSupportedVendors(): string[] {
  return [...new Set(dataFlows.map(flow => flow.vendor))]
}

// Get all supported domains
export function getSupportedDomains(): string[] {
  return [...new Set(dataFlows.map(flow => flow.domain))]
}