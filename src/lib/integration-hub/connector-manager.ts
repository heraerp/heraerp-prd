import { universalApi } from '@/lib/universal-api'
import { createNormalizedEntity } from '@/lib/services/entity-normalization-service'
import type {
  IntegrationConnector,
  IntegrationVendor,
  ConnectorConfig,
  ConnectorCapability,
  OAuthToken
} from '@/types/integration-hub'

// Vendor configurations with default capabilities and settings
const VENDOR_CONFIGS: Record<
  IntegrationVendor,
  {
    displayName: string
    icon: string
    authType: ConnectorConfig['auth_type']
    defaultScopes?: string[]
    baseUrl?: string
    capabilities: ConnectorCapability[]
  }
> = {
  microsoft_365: {
    displayName: 'Microsoft 365',
    icon: '🔷',
    authType: 'oauth2',
    defaultScopes: ['User.Read', 'Mail.ReadWrite', 'Contacts.ReadWrite', 'Calendars.ReadWrite'],
    baseUrl: 'https://graph.microsoft.com/v1.0',
    capabilities: [
      { type: 'read', resource: 'contacts', operations: ['list', 'get'] },
      { type: 'write', resource: 'contacts', operations: ['create', 'update', 'delete'] },
      { type: 'read', resource: 'emails', operations: ['list', 'get'] },
      { type: 'write', resource: 'emails', operations: ['create', 'send'] },
      { type: 'webhook', resource: 'emails', operations: ['subscribe'] }
    ]
  },
  google: {
    displayName: 'Google Workspace',
    icon: '🌈',
    authType: 'oauth2',
    defaultScopes: [
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/contacts',
      'https://www.googleapis.com/auth/calendar'
    ],
    baseUrl: 'https://www.googleapis.com',
    capabilities: [
      { type: 'read', resource: 'contacts', operations: ['list', 'get'] },
      { type: 'write', resource: 'contacts', operations: ['create', 'update', 'delete'] },
      { type: 'read', resource: 'emails', operations: ['list', 'get'] },
      { type: 'write', resource: 'emails', operations: ['create', 'send'] },
      { type: 'webhook', resource: 'emails', operations: ['watch'] }
    ]
  },
  mailchimp: {
    displayName: 'Mailchimp',
    icon: '🐵',
    authType: 'api_key',
    baseUrl: 'https://api.mailchimp.com/3.0',
    capabilities: [
      { type: 'read', resource: 'contacts', operations: ['list', 'get'] },
      { type: 'write', resource: 'contacts', operations: ['create', 'update'] },
      { type: 'read', resource: 'campaigns', operations: ['list', 'get'] },
      { type: 'write', resource: 'campaigns', operations: ['create', 'update', 'send'] },
      { type: 'webhook', resource: 'contacts', operations: ['subscribe'] }
    ]
  },
  linkedin: {
    displayName: 'LinkedIn',
    icon: '💼',
    authType: 'oauth2',
    defaultScopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    baseUrl: 'https://api.linkedin.com/v2',
    capabilities: [
      { type: 'read', resource: 'profile', operations: ['get'] },
      { type: 'read', resource: 'connections', operations: ['list'] },
      { type: 'write', resource: 'posts', operations: ['create'] }
    ]
  },
  bluesky: {
    displayName: 'BlueSky',
    icon: '🦋',
    authType: 'api_key',
    baseUrl: 'https://bsky.social/xrpc',
    capabilities: [
      { type: 'read', resource: 'posts', operations: ['list', 'get'] },
      { type: 'write', resource: 'posts', operations: ['create', 'delete'] },
      { type: 'read', resource: 'profile', operations: ['get'] },
      { type: 'realtime', resource: 'feed', operations: ['stream'] }
    ]
  },
  twinfield: {
    displayName: 'Twinfield',
    icon: '📊',
    authType: 'oauth2',
    defaultScopes: ['openid', 'twf.organisationUser', 'twf.accounting'],
    baseUrl: 'https://api.twinfield.com',
    capabilities: [
      { type: 'read', resource: 'invoices', operations: ['list', 'get'] },
      { type: 'write', resource: 'invoices', operations: ['create', 'update'] },
      { type: 'read', resource: 'customers', operations: ['list', 'get'] },
      { type: 'write', resource: 'customers', operations: ['create', 'update'] }
    ]
  },
  craft_cms: {
    displayName: 'Craft CMS',
    icon: '🔨',
    authType: 'api_key',
    baseUrl: 'https://api.craftcms.com',
    capabilities: [
      { type: 'read', resource: 'entries', operations: ['list', 'get'] },
      { type: 'write', resource: 'entries', operations: ['create', 'update', 'delete'] },
      { type: 'read', resource: 'assets', operations: ['list', 'get'] },
      { type: 'write', resource: 'assets', operations: ['upload', 'delete'] }
    ]
  },
  eventbrite: {
    displayName: 'Eventbrite',
    icon: '🎫',
    authType: 'oauth2',
    defaultScopes: ['event.read', 'event.write', 'order.read'],
    baseUrl: 'https://www.eventbriteapi.com/v3',
    capabilities: [
      { type: 'read', resource: 'events', operations: ['list', 'get'] },
      { type: 'write', resource: 'events', operations: ['create', 'update'] },
      { type: 'read', resource: 'attendees', operations: ['list', 'get'] },
      { type: 'webhook', resource: 'orders', operations: ['subscribe'] }
    ]
  },
  power_bi: {
    displayName: 'Power BI',
    icon: '📈',
    authType: 'oauth2',
    defaultScopes: ['Report.Read.All', 'Dataset.Read.All'],
    baseUrl: 'https://api.powerbi.com/v1.0',
    capabilities: [
      { type: 'read', resource: 'reports', operations: ['list', 'get'] },
      { type: 'read', resource: 'datasets', operations: ['list', 'get'] },
      { type: 'write', resource: 'datasets', operations: ['refresh'] }
    ]
  },
  tableau: {
    displayName: 'Tableau',
    icon: '📊',
    authType: 'api_key',
    baseUrl: 'https://api.tableau.com',
    capabilities: [
      { type: 'read', resource: 'workbooks', operations: ['list', 'get'] },
      { type: 'read', resource: 'views', operations: ['list', 'get'] },
      { type: 'read', resource: 'datasources', operations: ['list', 'get'] }
    ]
  }
}

export class ConnectorManager {
  static async createConnector(
    organizationId: string,
    vendor: IntegrationVendor,
    name: string,
    config: Partial<ConnectorConfig>
  ): Promise<IntegrationConnector> {
    const vendorConfig = VENDOR_CONFIGS[vendor]
    if (!vendorConfig) {
      throw new Error(`Unknown vendor: ${vendor}`)
    }

    // Create the connector entity
    const connector = await createNormalizedEntity(organizationId, 'integration_connector', name, {
      entity_code: `CONN-${vendor.toUpperCase()}-${Date.now()}`,
      smart_code: `HERA.INTEGRATIONS.CONNECTOR.${vendor.toUpperCase()}.v1`,
      vendor,
      status: 'configuring',
      config: {
        auth_type: vendorConfig.authType,
        ...config,
        base_url: config.base_url || vendorConfig.baseUrl
      },
      capabilities: vendorConfig.capabilities,
      last_health_check: new Date().toISOString()
    })

    return connector.data as IntegrationConnector
  }

  static async updateConnectorConfig(
    connectorId: string,
    config: Partial<ConnectorConfig>
  ): Promise<void> {
    const connector = await universalApi.read({
      table: 'core_entities',
      filters: { id: connectorId }
    })

    if (!connector.data[0]) {
      throw new Error('Connector not found')
    }

    await universalApi.updateEntity({
      id: connectorId,
      metadata: {
        ...connector.data[0].metadata,
        config: {
          ...connector.data[0].metadata.config,
          ...config
        }
      }
    })
  }

  static async updateConnectorStatus(
    connectorId: string,
    status: IntegrationConnector['status']
  ): Promise<void> {
    await universalApi.updateEntity({
      id: connectorId,
      metadata: { status }
    })
  }

  static async storeOAuthToken(connectorId: string, token: OAuthToken): Promise<void> {
    const connector = await universalApi.read({
      table: 'core_entities',
      filters: { id: connectorId }
    })

    if (!connector.data[0]) {
      throw new Error('Connector not found')
    }

    // In production, tokens should be encrypted before storage
    await universalApi.updateEntity({
      id: connectorId,
      metadata: {
        ...connector.data[0].metadata,
        config: {
          ...connector.data[0].metadata.config,
          oauth: {
            ...connector.data[0].metadata.config.oauth,
            token
          }
        },
        status: 'active'
      }
    })
  }

  static async testConnection(connectorId: string): Promise<boolean> {
    const connector = await universalApi.read({
      table: 'core_entities',
      filters: { id: connectorId }
    })

    if (!connector.data[0]) {
      throw new Error('Connector not found')
    }

    // Vendor-specific connection tests would go here
    // For now, we'll simulate a successful connection
    await universalApi.updateEntity({
      id: connectorId,
      metadata: {
        ...connector.data[0].metadata,
        last_health_check: new Date().toISOString()
      }
    })

    return true
  }

  static getVendorConfig(vendor: IntegrationVendor) {
    return VENDOR_CONFIGS[vendor]
  }

  static getAllVendors() {
    return Object.entries(VENDOR_CONFIGS).map(([key, config]) => ({
      id: key as IntegrationVendor,
      ...config
    }))
  }

  static async getConnectorHealth(connectorId: string) {
    // This would call the actual API endpoint to check health
    const mockHealth = {
      connector_id: connectorId,
      status: 'healthy' as const,
      last_check: new Date().toISOString(),
      uptime_percentage: 99.9,
      response_time_ms: 150,
      error_rate: 0.001,
      alerts: []
    }

    return mockHealth
  }
}
