import type { Connector, ConnectorConfig } from '@/types/integration-hub'
import { universalApi } from '@/lib/universal-api'

// Vendor-specific connector configurations
const VENDOR_CONFIGS = {
  salesforce: {
    name: 'Salesforce',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'instanceUrl'],
    defaultEndpoint: 'https://api.salesforce.com',
    capabilities: ['contacts', 'accounts', 'opportunities', 'leads']
  },
  hubspot: {
    name: 'HubSpot',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret'],
    defaultEndpoint: 'https://api.hubspot.com',
    capabilities: ['contacts', 'companies', 'deals', 'tickets']
  },
  quickbooks: {
    name: 'QuickBooks',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'realmId'],
    defaultEndpoint: 'https://api.intuit.com',
    capabilities: ['customers', 'invoices', 'payments', 'items']
  },
  shopify: {
    name: 'Shopify',
    authType: 'api_key',
    requiredFields: ['shopDomain', 'accessToken'],
    defaultEndpoint: 'https://{shopDomain}.myshopify.com',
    capabilities: ['products', 'orders', 'customers', 'inventory']
  },
  stripe: {
    name: 'Stripe',
    authType: 'api_key',
    requiredFields: ['secretKey'],
    defaultEndpoint: 'https://api.stripe.com',
    capabilities: ['customers', 'payments', 'subscriptions', 'invoices']
  },
  xero: {
    name: 'Xero',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret'],
    defaultEndpoint: 'https://api.xero.com',
    capabilities: ['contacts', 'invoices', 'bills', 'payments']
  },
  zoho: {
    name: 'Zoho CRM',
    authType: 'oauth2',
    requiredFields: ['clientId', 'clientSecret', 'refreshToken'],
    defaultEndpoint: 'https://www.zohoapis.com',
    capabilities: ['leads', 'contacts', 'accounts', 'deals']
  },
  mailchimp: {
    name: 'Mailchimp',
    authType: 'api_key',
    requiredFields: ['apiKey', 'dataCenter'],
    defaultEndpoint: 'https://{dataCenter}.api.mailchimp.com',
    capabilities: ['lists', 'campaigns', 'subscribers', 'templates']
  }
}

export type VendorType = keyof typeof VENDOR_CONFIGS

export class ConnectorFactory {
  static async createConnector(
    organizationId: string,
    vendor: VendorType,
    name: string,
    config: ConnectorConfig
  ): Promise<Connector> {
    const vendorConfig = VENDOR_CONFIGS[vendor]
    if (!vendorConfig) {
      throw new Error(`Unsupported vendor: ${vendor}`)
    }

    // Validate required fields
    for (const field of vendorConfig.requiredFields) {
      if (!config[field]) {
        throw new Error(`Missing required field: ${field}`)
      }
    }

    // Create connector entity
    universalApi.setOrganizationId(organizationId)
    const entityResult = await universalApi.createEntity({
      entity_type: 'integration_connector',
      entity_name: name,
      smart_code: `HERA.INTEGRATION.CONNECTOR.${vendor.toUpperCase()}.v1`,
      organization_id: organizationId
    })

    if (!entityResult.success) {
      throw new Error('Failed to create connector entity')
    }

    const connectorData: Connector = {
      id: entityResult.data.id,
      name,
      type: vendor,
      status: 'active',
      apiEndpoint: vendorConfig.defaultEndpoint,
      authType: vendorConfig.authType,
      configuration: config,
      createdAt: entityResult.data.created_at
    }

    // Store configuration in dynamic fields
    const fields = [
      { field_name: 'connector_type', field_value_text: vendor },
      { field_name: 'status', field_value_text: 'active' },
      { field_name: 'api_endpoint', field_value_text: vendorConfig.defaultEndpoint },
      { field_name: 'auth_type', field_value_text: vendorConfig.authType },
      { field_name: 'configuration', field_value_text: JSON.stringify(config) },
      { field_name: 'capabilities', field_value_text: JSON.stringify(vendorConfig.capabilities) }
    ]

    await Promise.all(
      fields.map(field =>
        universalApi.setDynamicField(
          entityResult.data.id,
          field.field_name,
          field.field_value_text,
          'text'
        )
      )
    )

    return connectorData
  }

  static getVendorConfig(vendor: VendorType) {
    return VENDOR_CONFIGS[vendor]
  }

  static getSupportedVendors(): VendorType[] {
    return Object.keys(VENDOR_CONFIGS) as VendorType[]
  }

  static validateConfig(vendor: VendorType, config: ConnectorConfig): string[] {
    const errors: string[] = []
    const vendorConfig = VENDOR_CONFIGS[vendor]

    if (!vendorConfig) {
      errors.push(`Unsupported vendor: ${vendor}`)
      return errors
    }

    for (const field of vendorConfig.requiredFields) {
      if (!config[field]) {
        errors.push(`Missing required field: ${field}`)
      }
    }

    return errors
  }
}
