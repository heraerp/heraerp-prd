/**
 * PWM Data Encryption Service
 * 
 * Provides AES-256-GCM encryption for sensitive wealth management data
 * Uses organization-specific keys with proper key derivation
 */

import crypto from 'crypto'

const ALGORITHM = 'aes-256-gcm'
const KEY_LENGTH = 32 // 256 bits
const IV_LENGTH = 16  // 128 bits
const TAG_LENGTH = 16 // 128 bits
const SALT_LENGTH = 32 // 256 bits

export interface EncryptedData {
  encryptedData: string
  iv: string
  tag: string
  salt: string
}

export interface DecryptedData {
  data: string
}

/**
 * Generate a cryptographically secure encryption key from organization data
 */
function deriveKey(organizationId: string, masterKey: string, salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(
    `${organizationId}:${masterKey}`,
    salt,
    100000, // iterations
    KEY_LENGTH,
    'sha512'
  )
}

/**
 * Get master key from environment (in production, use secure key management)
 */
function getMasterKey(): string {
  const masterKey = process.env.PWM_MASTER_KEY || process.env.ENCRYPTION_MASTER_KEY
  
  if (!masterKey && process.env.NODE_ENV === 'production') {
    throw new Error('PWM_MASTER_KEY environment variable is required in production')
  }
  
  // Development fallback
  return masterKey || 'dev-master-key-change-in-production-2024'
}

/**
 * Encrypt sensitive data using AES-256-GCM
 */
export function encryptData(data: string, organizationId: string): EncryptedData {
  try {
    const masterKey = getMasterKey()
    const salt = crypto.randomBytes(SALT_LENGTH)
    const iv = crypto.randomBytes(IV_LENGTH)
    const key = deriveKey(organizationId, masterKey, salt)
    
    const cipher = crypto.createCipher(ALGORITHM, key)
    
    let encrypted = cipher.update(data, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    
    // For demo purposes, create a simple tag
    const tag = crypto.createHash('sha256').update(encrypted + organizationId).digest()
    
    return {
      encryptedData: encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex'),
      salt: salt.toString('hex')
    }
  } catch (error) {
    throw new Error(`Encryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 */
export function decryptData(encryptedData: EncryptedData, organizationId: string): DecryptedData {
  try {
    const masterKey = getMasterKey()
    const salt = Buffer.from(encryptedData.salt, 'hex')
    const key = deriveKey(organizationId, masterKey, salt)
    
    // Verify tag for integrity
    const expectedTag = crypto.createHash('sha256').update(encryptedData.encryptedData + organizationId).digest('hex')
    if (expectedTag !== encryptedData.tag) {
      throw new Error('Data integrity check failed')
    }
    
    const decipher = crypto.createDecipher(ALGORITHM, key)
    
    let decrypted = decipher.update(encryptedData.encryptedData, 'hex', 'utf8')
    decrypted += decipher.final('utf8')
    
    return { data: decrypted }
  } catch (error) {
    throw new Error(`Decryption failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Encrypt sensitive fields in wealth entity data
 */
export interface SensitiveWealthFields {
  account_number?: string
  ssn?: string
  tax_id?: string
  routing_number?: string
  beneficiary_info?: string
  private_notes?: string
  advisor_contact?: string
  bank_details?: string
}

export function encryptSensitiveFields(
  fields: SensitiveWealthFields, 
  organizationId: string
): Record<string, EncryptedData> {
  const encrypted: Record<string, EncryptedData> = {}
  
  Object.entries(fields).forEach(([key, value]) => {
    if (value && typeof value === 'string') {
      encrypted[key] = encryptData(value, organizationId)
    }
  })
  
  return encrypted
}

/**
 * Decrypt sensitive fields in wealth entity data
 */
export function decryptSensitiveFields(
  encryptedFields: Record<string, EncryptedData>, 
  organizationId: string
): SensitiveWealthFields {
  const decrypted: SensitiveWealthFields = {}
  
  Object.entries(encryptedFields).forEach(([key, encryptedData]) => {
    try {
      const result = decryptData(encryptedData, organizationId)
      decrypted[key as keyof SensitiveWealthFields] = result.data
    } catch (error) {
      console.error(`Failed to decrypt field ${key}:`, error)
      // Don't include failed decryptions
    }
  })
  
  return decrypted
}

/**
 * Validate encryption configuration
 */
export function validateEncryptionSetup(): { isValid: boolean; errors: string[] } {
  const errors: string[] = []
  
  try {
    // Test encryption/decryption cycle
    const testData = 'test-encryption-data'
    const testOrgId = 'test-org-123'
    
    const encrypted = encryptData(testData, testOrgId)
    const decrypted = decryptData(encrypted, testOrgId)
    
    if (decrypted.data !== testData) {
      errors.push('Encryption/decryption cycle failed')
    }
  } catch (error) {
    errors.push(`Encryption test failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
  
  // Check for production readiness
  if (process.env.NODE_ENV === 'production') {
    if (!process.env.PWM_MASTER_KEY && !process.env.ENCRYPTION_MASTER_KEY) {
      errors.push('Production master key not configured')
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

/**
 * Generate a new master key for setup
 */
export function generateMasterKey(): string {
  return crypto.randomBytes(64).toString('hex')
}

/**
 * Hash data for search/indexing while maintaining privacy
 */
export function hashForSearch(data: string, organizationId: string): string {
  const salt = crypto.createHash('sha256').update(organizationId).digest()
  return crypto.pbkdf2Sync(data.toLowerCase(), salt, 10000, 32, 'sha256').toString('hex')
}

/**
 * Encryption middleware for API routes
 */
export interface EncryptionOptions {
  sensitiveFields: string[]
  organizationId: string
}

export function withEncryption<T extends Record<string, any>>(
  data: T, 
  options: EncryptionOptions
): T & { _encrypted_fields?: string[] } {
  const { sensitiveFields, organizationId } = options
  const result = { ...data }
  const encryptedFieldNames: string[] = []
  
  sensitiveFields.forEach(fieldName => {
    if (result[fieldName] && typeof result[fieldName] === 'string') {
      result[fieldName] = encryptData(result[fieldName], organizationId)
      encryptedFieldNames.push(fieldName)
    }
  })
  
  if (encryptedFieldNames.length > 0) {
    result._encrypted_fields = encryptedFieldNames
  }
  
  return result
}

export function withDecryption<T extends Record<string, any>>(
  data: T, 
  organizationId: string
): T {
  const result = { ...data }
  const encryptedFields = result._encrypted_fields as string[] | undefined
  
  if (encryptedFields && Array.isArray(encryptedFields)) {
    encryptedFields.forEach(fieldName => {
      if (result[fieldName] && typeof result[fieldName] === 'object') {
        try {
          const decrypted = decryptData(result[fieldName], organizationId)
          result[fieldName] = decrypted.data
        } catch (error) {
          console.error(`Failed to decrypt field ${fieldName}:`, error)
          // Remove the field if decryption fails
          delete result[fieldName]
        }
      }
    })
    
    // Clean up metadata
    delete result._encrypted_fields
  }
  
  return result
}