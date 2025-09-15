import { ISAPConnector, SAPConfig } from './base'
import { S4HANACloudConnector } from './s4hana-cloud'
import { supabaseClient } from '@/lib/supabase-client'

// Connector Factory
export class SAPConnectorFactory {
  private static connectorCache = new Map<string, ISAPConnector>()

  static async create(organizationId: string): Promise<ISAPConnector> {
    // Check cache first
    if (this.connectorCache.has(organizationId)) {
      return this.connectorCache.get(organizationId)!
    }

    // Get SAP configuration from database
    const config = await this.getSAPConfig(organizationId)

    // Create appropriate connector
    let connector: ISAPConnector

    switch (config.systemType) {
      case 'S4HANA_CLOUD':
        connector = new S4HANACloudConnector(config)
        break

      case 'S4HANA_ONPREM':
        // TODO: Implement S4HANAOnPremConnector
        throw new Error('S/4HANA On-Premise connector not yet implemented')

      case 'ECC':
        // TODO: Implement ECCConnector
        throw new Error('ECC connector not yet implemented')

      case 'B1':
        // TODO: Implement B1Connector
        throw new Error('Business One connector not yet implemented')

      default:
        throw new Error(`Unsupported SAP system type: ${config.systemType}`)
    }

    // Validate connection
    const isValid = await connector.validateConnection()
    if (!isValid) {
      throw new Error('Failed to connect to SAP system')
    }

    // Cache the connector
    this.connectorCache.set(organizationId, connector)

    return connector
  }

  static clearCache(organizationId?: string) {
    if (organizationId) {
      this.connectorCache.delete(organizationId)
    } else {
      this.connectorCache.clear()
    }
  }

  private static async getSAPConfig(organizationId: string): Promise<SAPConfig> {
    // Fetch SAP configuration from core_dynamic_data
    const { data: configData, error } = await supabaseClient
      .from('core_dynamic_data')
      .select('field_name, field_value_text, field_value_json')
      .eq('organization_id', organizationId)
      .eq('smart_code', 'HERA.ERP.FI.CONFIG.v1')

    if (error || !configData || configData.length === 0) {
      throw new Error('SAP configuration not found for organization')
    }

    // Build configuration object
    const config: any = {
      organizationId,
      systemType: '',
      credentials: {}
    }

    configData.forEach(field => {
      switch (field.field_name) {
        case 'sap_system_type':
          config.systemType = field.field_value_text
          break
        case 'sap_url':
          config.baseUrl = field.field_value_text
          break
        case 'sap_host':
          config.host = field.field_value_text
          break
        case 'sap_client':
          config.client = field.field_value_text
          break
        case 'company_code':
          config.companyCode = field.field_value_text
          break
        case 'chart_of_accounts':
          config.chartOfAccounts = field.field_value_text
          break
        case 'credentials':
          config.credentials = field.field_value_json
          break
      }
    })

    // Validate required fields
    if (!config.systemType || !config.companyCode) {
      throw new Error('Incomplete SAP configuration')
    }

    return config as SAPConfig
  }

  // Utility method to test connection
  static async testConnection(organizationId: string): Promise<{
    success: boolean
    systemInfo?: any
    error?: string
  }> {
    try {
      const connector = await this.create(organizationId)
      const systemInfo = await connector.getSystemInfo()

      return {
        success: true,
        systemInfo
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message
      }
    }
  }
}
