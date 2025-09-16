/**
 * HERA KMS Provider
 * Key management, encryption, and rotation services
 */

import crypto from 'crypto'
import { getSupabase } from '@/src/lib/supabase/client'
import { v4 as uuidv4 } from 'uuid'

export interface EncryptionKey {
  key_id: string
  version: number
  algorithm: string
  created_at: string
  rotated_at?: string
  status: 'active' | 'rotating' | 'retired'
}

export interface EncryptedData {
  ciphertext: string
  key_id: string
  key_version: number
  algorithm: string
  iv: string
  auth_tag?: string
  metadata?: Record<string, any>
}

export class KMSProvider {
  private static instance: KMSProvider
  private keyCache = new Map<string, Buffer>()
  private masterKey: Buffer

  constructor() {
    // In production, fetch from secure key management service
    this.masterKey = this.getMasterKey()
  }

  static getInstance(): KMSProvider {
    if (!this.instance) {
      this.instance = new KMSProvider()
    }
    return this.instance
  }

  /**
   * Encrypt data with envelope encryption
   */
  async encrypt(
    plaintext: string | Buffer,
    context: {
      organization_id: string
      purpose: 'pii' | 'credentials' | 'tokens' | 'general'
      field_name?: string
    }
  ): Promise<EncryptedData> {
    // Get or create DEK for organization
    const dek = await this.getDataEncryptionKey(context.organization_id, context.purpose)

    // Generate IV
    const iv = crypto.randomBytes(16)

    // Encrypt data
    const cipher = crypto.createCipheriv('aes-256-gcm', dek.key, iv)

    const plaintextBuffer = Buffer.isBuffer(plaintext) ? plaintext : Buffer.from(plaintext, 'utf8')

    const encrypted = Buffer.concat([cipher.update(plaintextBuffer), cipher.final()])

    const authTag = cipher.getAuthTag()

    // Log encryption event
    await this.logEncryptionEvent(context.organization_id, 'encrypt', {
      key_id: dek.key_id,
      purpose: context.purpose,
      field_name: context.field_name
    })

    return {
      ciphertext: encrypted.toString('base64'),
      key_id: dek.key_id,
      key_version: dek.version,
      algorithm: 'aes-256-gcm',
      iv: iv.toString('base64'),
      auth_tag: authTag.toString('base64'),
      metadata: {
        purpose: context.purpose,
        encrypted_at: new Date().toISOString()
      }
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(encryptedData: EncryptedData, organizationId: string): Promise<Buffer> {
    // Get DEK (potentially older version for rotation support)
    const dek = await this.getDataEncryptionKey(
      organizationId,
      (encryptedData.metadata as any)?.purpose || 'general',
      encryptedData.key_version
    )

    // Decrypt
    const decipher = crypto.createDecipheriv(
      encryptedData.algorithm,
      dek.key,
      Buffer.from(encryptedData.iv, 'base64')
    )

    if (encryptedData.auth_tag) {
      decipher.setAuthTag(Buffer.from(encryptedData.auth_tag, 'base64'))
    }

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(encryptedData.ciphertext, 'base64')),
      decipher.final()
    ])

    // Log decryption event
    await this.logEncryptionEvent(organizationId, 'decrypt', {
      key_id: encryptedData.key_id,
      key_version: encryptedData.key_version
    })

    return decrypted
  }

  /**
   * Decrypt to string
   */
  async decryptString(encryptedData: EncryptedData, organizationId: string): Promise<string> {
    const decrypted = await this.decrypt(encryptedData, organizationId)
    return decrypted.toString('utf8')
  }

  /**
   * Rotate encryption keys
   */
  async rotateKeys(organizationId: string): Promise<void> {
    const supabase = getSupabase()

    // Get current keys
    const { data: currentKeys } = await supabase
      .from('core_entities')
      .select('*')
      .eq('entity_type', 'encryption_key')
      .eq('organization_id', organizationId)
      .eq('metadata->>status', 'active')

    for (const keyEntity of currentKeys || []) {
      // Mark as rotating
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...keyEntity.metadata,
            status: 'rotating'
          }
        })
        .eq('id', keyEntity.id)

      // Generate new version
      const newKey = await this.generateDataEncryptionKey()
      const newVersion = ((keyEntity.metadata as any)?.version || 1) + 1

      // Store new key version
      const { data: newKeyEntity } = await supabase
        .from('core_entities')
        .insert({
          id: uuidv4(),
          entity_type: 'encryption_key',
          entity_name: `DEK v${newVersion} - ${organizationId}`,
          entity_code: `${keyEntity.entity_code}-v${newVersion}`,
          smart_code: 'HERA.SECURITY.CRYPTO.DEK.v1',
          organization_id: organizationId,
          metadata: {
            version: newVersion,
            status: 'active',
            purpose: (keyEntity.metadata as any)?.purpose,
            algorithm: 'aes-256-gcm',
            rotated_from: keyEntity.id
          }
        })
        .select('id')
        .single()

      // Store encrypted key
      const encryptedKey = await this.encryptDEK(newKey)
      await supabase.from('core_dynamic_data').insert({
        id: uuidv4(),
        entity_id: newKeyEntity!.id,
        field_name: 'encrypted_key',
        field_value_text: encryptedKey,
        field_type: 'encrypted_binary',
        smart_code: 'HERA.SECURITY.CRYPTO.DEK.ENCRYPTED.v1',
        organization_id: organizationId
      })

      // Re-encrypt sensitive data in batches
      await this.reencryptData(organizationId, keyEntity.id, newKeyEntity!.id)

      // Mark old key as retired
      await supabase
        .from('core_entities')
        .update({
          metadata: {
            ...keyEntity.metadata,
            status: 'retired',
            retired_at: new Date().toISOString()
          }
        })
        .eq('id', keyEntity.id)
    }

    // Clear key cache
    this.keyCache.clear()

    // Log rotation
    await this.logEncryptionEvent(organizationId, 'key_rotation', {
      rotated_keys: currentKeys?.length || 0
    })
  }

  /**
   * Get or create data encryption key
   */
  private async getDataEncryptionKey(
    organizationId: string,
    purpose: string,
    version?: number
  ): Promise<{ key: Buffer; key_id: string; version: number }> {
    const cacheKey = `${organizationId}-${purpose}-${version || 'latest'}`

    // Check cache
    if (this.keyCache.has(cacheKey)) {
      const cached = this.keyCache.get(cacheKey)!
      return {
        key: cached,
        key_id: cacheKey,
        version: version || 1
      }
    }

    const supabase = getSupabase()

    // Query for key
    let query = supabase
      .from('core_entities')
      .select(
        `
        *,
        core_dynamic_data!inner(field_value_text)
      `
      )
      .eq('entity_type', 'encryption_key')
      .eq('organization_id', organizationId)
      .eq('metadata->>purpose', purpose)

    if (version) {
      query = query.eq('metadata->>version', version)
    } else {
      query = query.eq('metadata->>status', 'active')
    }

    const { data: keyEntity } = await query.single()

    if (keyEntity) {
      // Decrypt DEK
      const encryptedKey = keyEntity.core_dynamic_data[0]?.field_value_text
      const dek = await this.decryptDEK(encryptedKey)

      // Cache
      this.keyCache.set(cacheKey, dek)

      return {
        key: dek,
        key_id: keyEntity.id,
        version: (keyEntity.metadata as any)?.version || 1
      }
    }

    // Create new key if none exists
    const newKey = await this.generateDataEncryptionKey()
    const keyId = uuidv4()

    // Store key entity
    await supabase.from('core_entities').insert({
      id: keyId,
      entity_type: 'encryption_key',
      entity_name: `DEK - ${organizationId} - ${purpose}`,
      entity_code: `DEK-${organizationId}-${purpose}`,
      smart_code: 'HERA.SECURITY.CRYPTO.DEK.v1',
      organization_id: organizationId,
      metadata: {
        version: 1,
        status: 'active',
        purpose,
        algorithm: 'aes-256-gcm'
      }
    })

    // Store encrypted key
    const encryptedKey = await this.encryptDEK(newKey)
    await supabase.from('core_dynamic_data').insert({
      id: uuidv4(),
      entity_id: keyId,
      field_name: 'encrypted_key',
      field_value_text: encryptedKey,
      field_type: 'encrypted_binary',
      smart_code: 'HERA.SECURITY.CRYPTO.DEK.ENCRYPTED.v1',
      organization_id: organizationId
    })

    // Cache
    this.keyCache.set(cacheKey, newKey)

    return {
      key: newKey,
      key_id: keyId,
      version: 1
    }
  }

  /**
   * Generate new data encryption key
   */
  private async generateDataEncryptionKey(): Promise<Buffer> {
    return crypto.randomBytes(32) // 256 bits for AES-256
  }

  /**
   * Encrypt DEK with master key
   */
  private async encryptDEK(dek: Buffer): Promise<string> {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv('aes-256-gcm', this.masterKey, iv)

    const encrypted = Buffer.concat([cipher.update(dek), cipher.final()])

    const authTag = cipher.getAuthTag()

    // Combine IV + auth tag + ciphertext
    const combined = Buffer.concat([iv, authTag, encrypted])
    return combined.toString('base64')
  }

  /**
   * Decrypt DEK with master key
   */
  private async decryptDEK(encryptedDEK: string): Promise<Buffer> {
    const combined = Buffer.from(encryptedDEK, 'base64')

    // Extract components
    const iv = combined.subarray(0, 16)
    const authTag = combined.subarray(16, 32)
    const ciphertext = combined.subarray(32)

    const decipher = crypto.createDecipheriv('aes-256-gcm', this.masterKey, iv)
    decipher.setAuthTag(authTag)

    return Buffer.concat([decipher.update(ciphertext), decipher.final()])
  }

  /**
   * Get master key (in production, from secure storage)
   */
  private getMasterKey(): Buffer {
    // In production, this would come from HSM, KMS, or secure environment
    const envKey = process.env.HERA_MASTER_KEY
    if (!envKey) {
      throw new Error('Master key not configured')
    }
    return Buffer.from(envKey, 'base64')
  }

  /**
   * Re-encrypt data after key rotation
   */
  private async reencryptData(
    organizationId: string,
    oldKeyId: string,
    newKeyId: string
  ): Promise<void> {
    // This would be implemented as a background job
    // For now, log the requirement
    const supabase = getSupabase()

    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'reencryption_required',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: 'HERA.SECURITY.CRYPTO.REENCRYPT.PENDING.v1',
      organization_id: organizationId,
      metadata: {
        old_key_id: oldKeyId,
        new_key_id: newKeyId,
        status: 'pending'
      }
    })
  }

  /**
   * Log encryption events
   */
  private async logEncryptionEvent(
    organizationId: string,
    operation: string,
    details: any
  ): Promise<void> {
    const supabase = getSupabase()

    await supabase.from('universal_transactions').insert({
      id: uuidv4(),
      transaction_type: 'crypto_operation',
      transaction_date: new Date().toISOString(),
      total_amount: 0,
      smart_code: `HERA.SECURITY.CRYPTO.${operation.toUpperCase()}.v1`,
      organization_id: organizationId,
      metadata: {
        operation,
        details,
        timestamp: new Date().toISOString()
      }
    })
  }

  /**
   * Hash sensitive identifiers
   */
  hashIdentifier(identifier: string, salt: string = 'hera-default-salt'): string {
    return crypto
      .createHash('sha256')
      .update(identifier + salt)
      .digest('hex')
  }

  /**
   * Mask PII for display
   */
  maskPII(value: string, type: 'email' | 'phone' | 'ssn' | 'generic'): string {
    switch (type) {
      case 'email':
        const [local, domain] = value.split('@')
        return `${local.substring(0, 2)}***@${domain}`

      case 'phone':
        return value.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2')

      case 'ssn':
        return `***-**-${value.slice(-4)}`

      default:
        const len = value.length
        if (len <= 4) return '****'
        return value.substring(0, 2) + '*'.repeat(len - 4) + value.slice(-2)
    }
  }
}

export const kmsProvider = KMSProvider.getInstance()
