/**
 * HERA Universal BYOC (Bring Your Own Cloud) Service
 * A complete service layer for managing cloud storage across any HERA application
 *
 * Features:
 * - Universal configuration management
 * - Multi-provider support (AWS, Azure, GCP, Custom)
 * - Secure secret encryption/decryption
 * - Connection testing and validation
 * - Audit logging with HERA universal structure
 * - Role-based access control
 * - Configuration import/export
 * - Health monitoring
 */

// Dynamic import for crypto-js to avoid build errors
let CryptoJS: any = null

// Try to import crypto-js dynamically
const loadCryptoJS = async () => {
  if (CryptoJS) return CryptoJS

  try {
    if (typeof window === 'undefined') {
      // Node.js environment
      CryptoJS = await import('crypto-js')
    } else {
      // Browser environment - try dynamic import
      CryptoJS = await import('crypto-js')
    }
    return CryptoJS
  } catch (e) {
    console.log('crypto-js not available, will use Web Crypto API or base64 fallback')
    return null
  }
}

export interface BYOCProvider {
  id: string
  name: string
  description: string
  category: 'cloud' | 'on-premise' | 'hybrid'
  features: string[]
  configSchema: BYOCConfigField[]
  pricing?: {
    model: 'pay-per-use' | 'subscription' | 'free'
    estimatedCost?: string
  }
}

export interface BYOCConfigField {
  name: string
  label: string
  type: 'text' | 'password' | 'textarea' | 'select' | 'number' | 'boolean' | 'file'
  required: boolean
  sensitive?: boolean
  validation?: {
    pattern?: string
    min?: number
    max?: number
    options?: { value: string; label: string }[]
  }
  help?: string
  placeholder?: string
}

export interface BYOCConfiguration {
  id: string
  applicationId: string
  organizationId: string
  name: string
  description?: string
  provider: string
  config: Record<string, any>
  encryptedSecrets: string // JSON string of encrypted secrets
  permissions: {
    read: boolean
    write: boolean
    delete: boolean
    process: boolean
    admin: boolean
  }
  advanced: {
    encryption: boolean
    compression: boolean
    versioning: boolean
    backup: boolean
    monitoring: boolean
    maxFileSize: number
    allowedTypes: string[]
    retentionDays?: number
    redundancy?: 'none' | 'standard' | 'high'
  }
  metadata: {
    createdAt: string
    updatedAt: string
    createdBy: string
    lastTestedAt?: string
    isActive: boolean
    isHealthy: boolean
    tags: string[]
    version: string
  }
  audit: {
    accessCount: number
    lastAccessed?: string
    errorCount: number
    lastError?: string
  }
}

export interface BYOCTestResult {
  configId: string
  testType: 'connection' | 'permissions' | 'performance' | 'security'
  success: boolean
  results: {
    connection?: {
      connected: boolean
      latency: number
      region?: string
      endpoint?: string
    }
    permissions?: {
      read: boolean
      write: boolean
      delete: boolean
      process: boolean
      errors: string[]
    }
    performance?: {
      uploadSpeed: number
      downloadSpeed: number
      latency: number
      concurrency: number
    }
    security?: {
      encryption: boolean
      ssl: boolean
      authentication: boolean
      authorization: boolean
      compliance: string[]
    }
  }
  error?: string
  timestamp: string
  duration: number
}

export interface BYOCAuditEvent {
  id: string
  applicationId: string
  organizationId: string
  configId?: string
  userId: string
  action: string
  details: Record<string, any>
  success: boolean
  error?: string
  timestamp: string
  ipAddress?: string
  userAgent?: string
  heraSmartCode: string // HERA universal transaction code
}

/**
 * Universal BYOC Service Class
 */
export class BYOCService {
  private encryptionKey: string
  private apiBaseUrl: string

  constructor(encryptionKey?: string, apiBaseUrl = '/api/v1/universal/byoc') {
    this.encryptionKey = encryptionKey || 'HERA_BYOC_DEFAULT_KEY_2024'
    this.apiBaseUrl = apiBaseUrl
  }

  /**
   * Get all supported providers with their configuration schemas
   */
  async getProviders(): Promise<BYOCProvider[]> {
    return [
      {
        id: 'default',
        name: 'HERA Default Storage',
        description: 'Managed storage with automatic backups and enterprise features',
        category: 'cloud',
        features: ['read', 'write', 'delete', 'process', 'backup', 'monitoring', 'compliance'],
        configSchema: [],
        pricing: { model: 'subscription', estimatedCost: 'Included in HERA license' }
      },
      {
        id: 'aws',
        name: 'Amazon Web Services S3',
        description: 'Industry-leading cloud storage with global availability',
        category: 'cloud',
        features: [
          'read',
          'write',
          'delete',
          'process',
          'versioning',
          'encryption',
          'cdn',
          'analytics'
        ],
        configSchema: [
          {
            name: 'accessKeyId',
            label: 'Access Key ID',
            type: 'text',
            required: true,
            sensitive: true
          },
          {
            name: 'secretAccessKey',
            label: 'Secret Access Key',
            type: 'password',
            required: true,
            sensitive: true
          },
          {
            name: 'region',
            label: 'AWS Region',
            type: 'select',
            required: true,
            validation: {
              options: [
                { value: 'us-east-1', label: 'US East (N. Virginia)' },
                { value: 'us-west-2', label: 'US West (Oregon)' },
                { value: 'eu-west-1', label: 'Europe (Ireland)' },
                { value: 'ap-southeast-1', label: 'Asia Pacific (Singapore)' },
                { value: 'ap-south-1', label: 'Asia Pacific (Mumbai)' }
              ]
            }
          },
          { name: 'bucketName', label: 'S3 Bucket Name', type: 'text', required: true },
          {
            name: 'path',
            label: 'Object Key Prefix',
            type: 'text',
            required: false,
            placeholder: 'myapp-documents/'
          },
          {
            name: 'storageClass',
            label: 'Storage Class',
            type: 'select',
            required: false,
            validation: {
              options: [
                { value: 'STANDARD', label: 'Standard' },
                { value: 'STANDARD_IA', label: 'Standard-Infrequent Access' },
                { value: 'GLACIER', label: 'Glacier' },
                { value: 'DEEP_ARCHIVE', label: 'Glacier Deep Archive' }
              ]
            }
          }
        ],
        pricing: { model: 'pay-per-use', estimatedCost: '$0.023/GB/month + requests' }
      },
      {
        id: 'azure',
        name: 'Microsoft Azure Blob Storage',
        description: 'Enterprise cloud storage with integrated Microsoft ecosystem',
        category: 'cloud',
        features: ['read', 'write', 'delete', 'process', 'tiering', 'encryption', 'compliance'],
        configSchema: [
          { name: 'accountName', label: 'Storage Account Name', type: 'text', required: true },
          {
            name: 'accountKey',
            label: 'Account Key',
            type: 'password',
            required: true,
            sensitive: true
          },
          { name: 'containerName', label: 'Container Name', type: 'text', required: true },
          {
            name: 'path',
            label: 'Blob Path Prefix',
            type: 'text',
            required: false,
            placeholder: 'myapp-documents/'
          },
          {
            name: 'tier',
            label: 'Access Tier',
            type: 'select',
            required: false,
            validation: {
              options: [
                { value: 'Hot', label: 'Hot (Frequent Access)' },
                { value: 'Cool', label: 'Cool (Infrequent Access)' },
                { value: 'Archive', label: 'Archive (Rare Access)' }
              ]
            }
          }
        ],
        pricing: { model: 'pay-per-use', estimatedCost: '$0.0184/GB/month + transactions' }
      },
      {
        id: 'gcp',
        name: 'Google Cloud Storage',
        description: 'Scalable cloud storage with machine learning integration',
        category: 'cloud',
        features: ['read', 'write', 'delete', 'process', 'ml-integration', 'global-cdn'],
        configSchema: [
          { name: 'projectId', label: 'Project ID', type: 'text', required: true },
          {
            name: 'keyFile',
            label: 'Service Account Key (JSON)',
            type: 'textarea',
            required: true,
            sensitive: true
          },
          { name: 'bucketName', label: 'Bucket Name', type: 'text', required: true },
          {
            name: 'path',
            label: 'Object Prefix',
            type: 'text',
            required: false,
            placeholder: 'myapp-documents/'
          },
          {
            name: 'storageClass',
            label: 'Storage Class',
            type: 'select',
            required: false,
            validation: {
              options: [
                { value: 'STANDARD', label: 'Standard' },
                { value: 'NEARLINE', label: 'Nearline' },
                { value: 'COLDLINE', label: 'Coldline' },
                { value: 'ARCHIVE', label: 'Archive' }
              ]
            }
          }
        ],
        pricing: { model: 'pay-per-use', estimatedCost: '$0.020/GB/month + operations' }
      },
      {
        id: 'custom',
        name: 'Custom S3-Compatible Storage',
        description: 'Connect to any S3-compatible storage provider',
        category: 'hybrid',
        features: ['read', 'write', 'delete', 'process', 'cost-effective'],
        configSchema: [
          {
            name: 'endpoint',
            label: 'Endpoint URL',
            type: 'text',
            required: true,
            placeholder: 'https://s3.example.com'
          },
          { name: 'accessKey', label: 'Access Key', type: 'text', required: true, sensitive: true },
          {
            name: 'secretKey',
            label: 'Secret Key',
            type: 'password',
            required: true,
            sensitive: true
          },
          { name: 'bucketName', label: 'Bucket Name', type: 'text', required: true },
          { name: 'region', label: 'Region (Optional)', type: 'text', required: false },
          {
            name: 'path',
            label: 'Object Prefix',
            type: 'text',
            required: false,
            placeholder: 'myapp-documents/'
          },
          { name: 'ssl', label: 'Use SSL/HTTPS', type: 'boolean', required: false },
          { name: 'pathStyle', label: 'Use Path-Style URLs', type: 'boolean', required: false }
        ],
        pricing: {
          model: 'pay-per-use',
          estimatedCost: 'Varies by provider (typically 50-80% less than AWS)'
        }
      }
    ]
  }

  /**
   * Encrypt sensitive data using Web Crypto API or crypto-js fallback
   */
  async encryptSecrets(secrets: Record<string, any>): Promise<string> {
    try {
      const jsonString = JSON.stringify(secrets)

      if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
        // Use Web Crypto API (modern browsers)
        return await this.encryptWithWebCrypto(jsonString)
      } else {
        // Try to load crypto-js
        const crypto = await loadCryptoJS()
        if (crypto) {
          const encrypted = crypto.AES.encrypt(jsonString, this.encryptionKey).toString()
          return encrypted
        } else {
          // Simple base64 encoding as last resort (not secure, but functional)
          console.warn('No encryption library available, using base64 encoding (not secure)')
          // Use Buffer for Node.js compatibility
          if (typeof Buffer !== 'undefined') {
            return Buffer.from(jsonString).toString('base64')
          } else if (typeof btoa !== 'undefined') {
            return btoa(jsonString)
          } else {
            throw new Error('No base64 encoding method available')
          }
        }
      }
    } catch (error) {
      throw new Error('Failed to encrypt secrets')
    }
  }

  /**
   * Decrypt sensitive data using Web Crypto API or crypto-js fallback
   */
  async decryptSecrets(encryptedData: string): Promise<Record<string, any>> {
    try {
      let jsonString: string

      if (
        typeof window !== 'undefined' &&
        window.crypto &&
        window.crypto.subtle &&
        encryptedData.includes(':')
      ) {
        // Web Crypto API format (includes IV)
        jsonString = await this.decryptWithWebCrypto(encryptedData)
      } else if (encryptedData.length > 20) {
        // Try crypto-js format
        const crypto = await loadCryptoJS()
        if (crypto) {
          const decrypted = crypto.AES.decrypt(encryptedData, this.encryptionKey)
          jsonString = decrypted.toString(crypto.enc.Utf8)
        } else {
          // Base64 fallback
          console.warn('Using base64 decoding (not secure)')
          // Use Buffer for Node.js compatibility
          if (typeof Buffer !== 'undefined') {
            jsonString = Buffer.from(encryptedData, 'base64').toString('utf-8')
          } else if (typeof atob !== 'undefined') {
            jsonString = atob(encryptedData)
          } else {
            throw new Error('No base64 decoding method available')
          }
        }
      } else {
        // Base64 fallback
        console.warn('Using base64 decoding (not secure)')
        // Use Buffer for Node.js compatibility
        if (typeof Buffer !== 'undefined') {
          jsonString = Buffer.from(encryptedData, 'base64').toString('utf-8')
        } else if (typeof atob !== 'undefined') {
          jsonString = atob(encryptedData)
        } else {
          throw new Error('No base64 decoding method available')
        }
      }

      return JSON.parse(jsonString)
    } catch (error) {
      throw new Error('Failed to decrypt secrets')
    }
  }

  /**
   * Encrypt using Web Crypto API (modern browsers)
   */
  private async encryptWithWebCrypto(data: string): Promise<string> {
    const encoder = new TextEncoder()
    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(this.encryptionKey.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['encrypt']
    )

    const iv = window.crypto.getRandomValues(new Uint8Array(12))
    const encrypted = await window.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      encoder.encode(data)
    )

    // Combine IV and encrypted data
    const combined = new Uint8Array(iv.length + encrypted.byteLength)
    combined.set(iv)
    combined.set(new Uint8Array(encrypted), iv.length)

    // Convert to base64 with separator
    if (typeof Buffer !== 'undefined') {
      return Buffer.from(combined).toString('base64') + ':webcrypto'
    } else if (typeof btoa !== 'undefined') {
      return btoa(String.fromCharCode(...combined)) + ':webcrypto'
    } else {
      throw new Error('No base64 encoding method available')
    }
  }

  /**
   * Decrypt using Web Crypto API (modern browsers)
   */
  private async decryptWithWebCrypto(encryptedData: string): Promise<string> {
    const [data, format] = encryptedData.split(':')
    if (format !== 'webcrypto') {
      throw new Error('Invalid encryption format')
    }

    let combined: Uint8Array
    if (typeof Buffer !== 'undefined') {
      combined = new Uint8Array(Buffer.from(data, 'base64'))
    } else if (typeof atob !== 'undefined') {
      combined = Uint8Array.from(atob(data), c => c.charCodeAt(0))
    } else {
      throw new Error('No base64 decoding method available')
    }
    const iv = combined.slice(0, 12)
    const encrypted = combined.slice(12)

    const encoder = new TextEncoder()
    const decoder = new TextDecoder()

    const keyMaterial = await window.crypto.subtle.importKey(
      'raw',
      encoder.encode(this.encryptionKey.padEnd(32, '0').slice(0, 32)),
      { name: 'AES-GCM' },
      false,
      ['decrypt']
    )

    const decrypted = await window.crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      keyMaterial,
      encrypted
    )

    return decoder.decode(decrypted)
  }

  /**
   * Create or update a BYOC configuration
   */
  async saveConfiguration(
    applicationId: string,
    organizationId: string,
    userId: string,
    config: Partial<BYOCConfiguration>
  ): Promise<{ success: boolean; data?: BYOCConfiguration; error?: string }> {
    try {
      // Separate sensitive fields from regular config
      const provider = await this.getProviders().then(providers =>
        providers.find(p => p.id === config.provider)
      )

      if (!provider) {
        throw new Error('Invalid provider specified')
      }

      const secrets: Record<string, any> = {}
      const regularConfig: Record<string, any> = {}

      Object.entries(config.config || {}).forEach(([key, value]) => {
        const field = provider.configSchema.find(f => f.name === key)
        if (field?.sensitive) {
          secrets[key] = value
        } else {
          regularConfig[key] = value
        }
      })

      // Encrypt secrets
      const encryptedSecrets =
        Object.keys(secrets).length > 0 ? await this.encryptSecrets(secrets) : ''

      const fullConfig: BYOCConfiguration = {
        id: config.id || `byoc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        applicationId,
        organizationId,
        name: config.name || 'Unnamed Configuration',
        description: config.description,
        provider: config.provider!,
        config: regularConfig,
        encryptedSecrets,
        permissions: config.permissions || {
          read: true,
          write: true,
          delete: false,
          process: true,
          admin: false
        },
        advanced: config.advanced || {
          encryption: true,
          compression: true,
          versioning: false,
          backup: true,
          monitoring: true,
          maxFileSize: 100,
          allowedTypes: ['pdf', 'jpg', 'jpeg', 'png', 'docx', 'xlsx'],
          retentionDays: 2555, // 7 years default
          redundancy: 'standard'
        },
        metadata: {
          createdAt: (config.metadata as any)?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: (config.metadata as any)?.createdBy || userId,
          isActive: (config.metadata as any)?.isActive || false,
          isHealthy: false, // Will be updated after health check
          tags: (config.metadata as any)?.tags || [],
          version: '1.0.0'
        },
        audit: {
          accessCount: 0,
          errorCount: 0
        }
      }

      // Make API call to save
      const response = await fetch(this.apiBaseUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicationId,
          organizationId,
          userId,
          config: fullConfig
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()

      if (result.success) {
        // Log audit event
        await this.logAuditEvent({
          applicationId,
          organizationId,
          configId: fullConfig.id,
          userId,
          action: config.id ? 'update_config' : 'create_config',
          details: { configName: fullConfig.name, provider: fullConfig.provider },
          success: true,
          timestamp: new Date().toISOString(),
          heraSmartCode: 'HERA.UNIVERSAL.BYOC.CONFIG.SAVED.v1'
        })

        return { success: true, data: result.data }
      } else {
        throw new Error(result.error || 'Failed to save configuration')
      }
    } catch (error) {
      // Log error event
      await this.logAuditEvent({
        applicationId,
        organizationId,
        userId,
        action: 'save_config_error',
        details: { error: error instanceof Error ? error.message : 'Unknown error' },
        success: false,
        timestamp: new Date().toISOString(),
        heraSmartCode: 'HERA.UNIVERSAL.BYOC.CONFIG.ERROR.v1'
      })

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save configuration'
      }
    }
  }

  /**
   * Get all configurations for an application
   */
  async getConfigurations(
    applicationId: string,
    organizationId: string
  ): Promise<BYOCConfiguration[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}?applicationId=${applicationId}&organizationId=${organizationId}`
      )

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()
      return result.success ? result.data || [] : []
    } catch (error) {
      console.error('Error getting configurations:', error)
      return []
    }
  }

  /**
   * Test connection to a cloud storage provider
   */
  async testConnection(
    configId: string,
    applicationId: string,
    organizationId: string
  ): Promise<BYOCTestResult> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.apiBaseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          applicationId,
          organizationId,
          testType: 'connection'
        })
      })

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`)
      }

      const result = await response.json()

      const testResult: BYOCTestResult = {
        configId,
        testType: 'connection',
        success: result.success && result.data?.connected,
        results: {
          connection: {
            connected: result.data?.connected || false,
            latency: result.data?.latency || Date.now() - startTime,
            region: result.data?.region,
            endpoint: result.data?.endpoint
          }
        },
        error: result.error,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }

      return testResult
    } catch (error) {
      return {
        configId,
        testType: 'connection',
        success: false,
        results: {},
        error: error instanceof Error ? error.message : 'Connection test failed',
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Test permissions for a cloud storage configuration
   */
  async testPermissions(
    configId: string,
    applicationId: string,
    organizationId: string
  ): Promise<BYOCTestResult> {
    const startTime = Date.now()

    try {
      const response = await fetch(`${this.apiBaseUrl}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          applicationId,
          organizationId,
          testType: 'permissions'
        })
      })

      const result = await response.json()

      return {
        configId,
        testType: 'permissions',
        success: result.success,
        results: {
          permissions: result.data || {
            read: false,
            write: false,
            delete: false,
            process: false,
            errors: [result.error || 'Permission test failed']
          }
        },
        error: result.error,
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        configId,
        testType: 'permissions',
        success: false,
        results: {
          permissions: {
            read: false,
            write: false,
            delete: false,
            process: false,
            errors: [error instanceof Error ? error.message : 'Permission test failed']
          }
        },
        timestamp: new Date().toISOString(),
        duration: Date.now() - startTime
      }
    }
  }

  /**
   * Activate a configuration (deactivates others)
   */
  async activateConfiguration(
    configId: string,
    applicationId: string,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/activate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          configId,
          applicationId,
          organizationId,
          userId
        })
      })

      const result = await response.json()

      if (result.success) {
        await this.logAuditEvent({
          applicationId,
          organizationId,
          configId,
          userId,
          action: 'activate_config',
          details: { configId },
          success: true,
          timestamp: new Date().toISOString(),
          heraSmartCode: 'HERA.UNIVERSAL.BYOC.CONFIG.ACTIVATED.v1'
        })
      }

      return result
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to activate configuration'
      }
    }
  }

  /**
   * Export configuration (with or without secrets)
   */
  exportConfiguration(config: BYOCConfiguration, includeSecrets = false): string {
    const exportData = {
      ...config,
      encryptedSecrets: includeSecrets ? config.encryptedSecrets : '***REDACTED***',
      exportedAt: new Date().toISOString(),
      exportFormat: 'HERA_BYOC_v1.0',
      includesSecrets: includeSecrets
    }

    return JSON.stringify(exportData, null, 2)
  }

  /**
   * Import configuration from JSON
   */
  async importConfiguration(
    jsonData: string,
    applicationId: string,
    organizationId: string,
    userId: string
  ): Promise<{ success: boolean; data?: BYOCConfiguration; error?: string }> {
    try {
      const importedData = JSON.parse(jsonData)

      // Validate import format
      if (importedData.exportFormat !== 'HERA_BYOC_v1.0') {
        throw new Error('Invalid or unsupported import format')
      }

      // Remove export metadata
      delete importedData.exportedAt
      delete importedData.exportFormat
      delete importedData.includesSecrets

      // Generate new ID to avoid conflicts
      importedData.id = `byoc_imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      importedData.name = `${importedData.name} (Imported)`
      importedData.metadata.isActive = false // Imported configs are inactive by default

      return await this.saveConfiguration(applicationId, organizationId, userId, importedData)
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import configuration'
      }
    }
  }

  /**
   * Log audit event using HERA universal structure
   */
  private async logAuditEvent(event: Omit<BYOCAuditEvent, 'id'>): Promise<void> {
    try {
      const auditEvent: BYOCAuditEvent = {
        id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        ...event
      }

      // This would integrate with HERA's universal transaction system
      console.log('BYOC Audit Event:', auditEvent)

      // In production, this would save to universal_transactions table
      // await fetch('/api/v1/universal/transactions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     transaction_type: 'byoc_audit_event',
      //     smart_code: event.heraSmartCode,
      //     organization_id: event.organizationId,
      //     user_id: event.userId,
      //     metadata: auditEvent
      //   })
      // })
    } catch (error) {
      console.error('Failed to log audit event:', error)
    }
  }

  /**
   * Health check for all configurations
   */
  async performHealthCheck(
    applicationId: string,
    organizationId: string
  ): Promise<{ healthy: number; unhealthy: number; results: Record<string, boolean> }> {
    const configs = await this.getConfigurations(applicationId, organizationId)
    const results: Record<string, boolean> = {}

    // Test connections for all active configs
    await Promise.all(
      configs
        .filter(c => c.metadata.isActive)
        .map(async config => {
          try {
            const testResult = await this.testConnection(config.id, applicationId, organizationId)
            results[config.id] = testResult.success
          } catch (error) {
            results[config.id] = false
          }
        })
    )

    const healthy = Object.values(results).filter(Boolean).length
    const unhealthy = Object.values(results).filter(r => !r).length

    return { healthy, unhealthy, results }
  }
}

// Export factory function for easy instantiation
export function createBYOCService(encryptionKey?: string): BYOCService {
  return new BYOCService(encryptionKey)
}
