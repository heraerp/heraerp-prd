import { createClient } from '@supabase/supabase-js'
import { createCipheriv, createDecipheriv, randomBytes, pbkdf2Sync } from 'crypto'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32
const IV_LENGTH = 16
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const ITERATIONS = 100000

interface EncryptedConfig {
  organizationId: string
  configKey: string
  encryptedValue: string
  iv: string
  salt: string
  tag: string
  createdAt: Date
  updatedAt: Date
}

export class EncryptedConfigService {
  private static instance: EncryptedConfigService
  private masterKey: string

  private constructor() {
    // Use a master key from environment - in production, this should be from KMS
    this.masterKey = process.env.CONFIG_ENCRYPTION_KEY || this.generateMasterKey()
  }

  public static getInstance(): EncryptedConfigService {
    if (!EncryptedConfigService.instance) {
      EncryptedConfigService.instance = new EncryptedConfigService()
    }
    return EncryptedConfigService.instance
  }

  private generateMasterKey(): string {
    // In production, this should come from AWS KMS, Azure Key Vault, etc.
    if (!process.env.CONFIG_ENCRYPTION_KEY) {
      console.warn(
        '⚠️ CONFIG_ENCRYPTION_KEY not set, using generated key (not suitable for production)'
      )
    }
    return process.env.CONFIG_ENCRYPTION_KEY || randomBytes(32).toString('hex')
  }

  private deriveKey(password: string, salt: Buffer): Buffer {
    return pbkdf2Sync(password, salt, ITERATIONS, KEY_LENGTH, 'sha256')
  }

  private encrypt(
    text: string,
    organizationId: string
  ): {
    encrypted: string
    iv: string
    salt: string
    tag: string
  } {
    const salt = randomBytes(SALT_LENGTH)
    const iv = randomBytes(IV_LENGTH)
    const key = this.deriveKey(this.masterKey + organizationId, salt)

    const cipher = createCipheriv(ALGORITHM, key, iv)
    let encrypted = cipher.update(text, 'utf8', 'hex')
    encrypted += cipher.final('hex')

    const tag = cipher.getAuthTag()

    return {
      encrypted,
      iv: iv.toString('hex'),
      salt: salt.toString('hex'),
      tag: tag.toString('hex')
    }
  }

  private decrypt(
    encryptedData: {
      encrypted: string
      iv: string
      salt: string
      tag: string
    },
    organizationId: string
  ): string {
    const key = this.deriveKey(
      this.masterKey + organizationId,
      Buffer.from(encryptedData.salt, 'hex')
    )
    const decipher = createDecipheriv(ALGORITHM, key, Buffer.from(encryptedData.iv, 'hex'))

    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'))

    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8')
    decrypted += decipher.final('utf8')

    return decrypted
  }

  async storeEncryptedConfig(
    organizationId: string,
    configKey: string,
    value: string,
    metadata?: any,
    entityId?: string
  ): Promise<void> {
    const encryptionResult = this.encrypt(value, organizationId)

    // If no entity ID provided, create a config entity
    let configEntityId = entityId
    if (!configEntityId) {
      // Get or create a config entity for this organization
      const { data: existingEntity } = await supabase
        .from('core_entities')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('entity_type', 'config_store')
        .eq('entity_code', `CONFIG-${organizationId.slice(0, 8).toUpperCase()}`)
        .single()

      if (existingEntity) {
        configEntityId = existingEntity.id
      } else {
        // Create config entity
        const { data: newEntity, error: entityError } = await supabase
          .from('core_entities')
          .insert({
            organization_id: organizationId,
            entity_type: 'config_store',
            entity_name: 'Organization Configuration Store',
            entity_code: `CONFIG-${organizationId.slice(0, 8).toUpperCase()}`,
            smart_code: 'HERA.SECURITY.CONFIG.ENTITY.STORE.V1',
            status: 'active'
          })
          .select('id')
          .single()

        if (entityError) {
          throw new Error(`Failed to create config entity: ${entityError.message}`)
        }
        configEntityId = newEntity.id
      }
    }

    // Store in core_dynamic_data with encryption metadata
    const { error } = await supabase.from('core_dynamic_data').upsert({
      organization_id: organizationId,
      entity_id: configEntityId,
      field_name: configKey,
      field_value_text: encryptionResult.encrypted, // Store encrypted data in text field
      smart_code: `HERA.SECURITY.CONFIG.ENCRYPTED.${configKey.toUpperCase()}.V1`,
      field_value_json: {
        ...metadata,
        encrypted: true,
        iv: encryptionResult.iv,
        salt: encryptionResult.salt,
        tag: encryptionResult.tag,
        algorithm: ALGORITHM,
        key_derivation: 'pbkdf2',
        iterations: ITERATIONS
      }
    })

    if (error) {
      throw new Error(`Failed to store encrypted config: ${error.message}`)
    }

    // Log the configuration event
    await this.logConfigurationEvent(organizationId, configKey, 'stored')
  }

  async getDecryptedConfig(organizationId: string, configKey: string): Promise<string | null> {
    // Get the config entity
    const { data: configEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'config_store')
      .single()

    if (!configEntity) {
      return null // No config entity exists yet
    }

    const { data, error } = await supabase
      .from('core_dynamic_data')
      .select('field_value_text, field_value_json')
      .eq('organization_id', organizationId)
      .eq('entity_id', configEntity.id)
      .eq('field_name', configKey)
      .single()

    if (error || !data) {
      return null
    }

    const metadata = data.field_value_json
    if (!metadata?.encrypted) {
      throw new Error('Configuration is not encrypted')
    }

    try {
      const decrypted = this.decrypt(
        {
          encrypted: data.field_value_text,
          iv: metadata.iv,
          salt: metadata.salt,
          tag: metadata.tag
        },
        organizationId
      )

      // Log access event
      await this.logConfigurationEvent(organizationId, configKey, 'accessed')

      return decrypted
    } catch (error) {
      console.error('Decryption failed:', error)
      throw new Error('Failed to decrypt configuration')
    }
  }

  async rotateEncryptionKey(organizationId: string, configKey: string): Promise<void> {
    // Get current config
    const currentValue = await this.getDecryptedConfig(organizationId, configKey)

    if (!currentValue) {
      throw new Error('Configuration not found')
    }

    // Re-encrypt with new salt/iv
    await this.storeEncryptedConfig(organizationId, configKey, currentValue, {
      rotated_at: new Date().toISOString(),
      rotation_reason: 'manual_rotation'
    })

    await this.logConfigurationEvent(organizationId, configKey, 'rotated')
  }

  async deleteConfig(organizationId: string, configKey: string): Promise<void> {
    // Get the config entity
    const { data: configEntity } = await supabase
      .from('core_entities')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('entity_type', 'config_store')
      .single()

    if (!configEntity) {
      return // No config entity exists
    }

    const { error } = await supabase
      .from('core_dynamic_data')
      .delete()
      .eq('organization_id', organizationId)
      .eq('entity_id', configEntity.id)
      .eq('field_name', configKey)

    if (error) {
      throw new Error(`Failed to delete config: ${error.message}`)
    }

    await this.logConfigurationEvent(organizationId, configKey, 'deleted')
  }

  private async logConfigurationEvent(
    organizationId: string,
    configKey: string,
    action: string
  ): Promise<void> {
    await supabase.from('universal_transactions').insert({
      organization_id: organizationId,
      transaction_type: 'security_event',
      transaction_code: `SEC-${Date.now()}`,
      smart_code: 'HERA.SECURITY.CONFIG.EVENT.V1',
      total_amount: 0,
      metadata: {
        event_type: 'configuration_access',
        config_key: configKey,
        action,
        timestamp: new Date().toISOString(),
        encrypted: true
      }
    })
  }

  // Specific methods for common configurations
  async storeResendApiKey(organizationId: string, apiKey: string): Promise<void> {
    await this.storeEncryptedConfig(organizationId, 'RESEND_API_KEY', apiKey, {
      service: 'resend',
      config_type: 'api_key'
    })
  }

  async getResendApiKey(organizationId: string): Promise<string | null> {
    return await this.getDecryptedConfig(organizationId, 'RESEND_API_KEY')
  }

  async storeMailchimpApiKey(organizationId: string, apiKey: string): Promise<void> {
    await this.storeEncryptedConfig(organizationId, 'MAILCHIMP_API_KEY', apiKey, {
      service: 'mailchimp',
      config_type: 'api_key'
    })
  }

  async getMailchimpApiKey(organizationId: string): Promise<string | null> {
    return await this.getDecryptedConfig(organizationId, 'MAILCHIMP_API_KEY')
  }

  // Health check for encryption service
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: any
  }> {
    try {
      // Test encryption/decryption
      const testOrgId = 'test-org-id'
      const testValue = 'test-encryption-value'
      const encrypted = this.encrypt(testValue, testOrgId)
      const decrypted = this.decrypt(encrypted, testOrgId)

      if (decrypted !== testValue) {
        throw new Error('Encryption/decryption test failed')
      }

      return {
        status: 'healthy',
        details: {
          encryption: 'working',
          algorithm: ALGORITHM,
          key_derivation: 'pbkdf2',
          iterations: ITERATIONS
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        details: {
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }
}

// Export singleton instance
export const encryptedConfigService = EncryptedConfigService.getInstance()
