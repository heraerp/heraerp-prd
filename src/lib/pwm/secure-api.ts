/**
 * Secure PWM API Service with Encryption
 * 
 * Extends the PWM API with encryption capabilities for sensitive data
 */

import { 
  WealthEntity, 
  WealthTransaction, 
  WealthDynamicData,
  WealthEntityType,
  WealthTransactionType
} from './types'
import { 
  encryptData, 
  decryptData, 
  encryptSensitiveFields, 
  decryptSensitiveFields,
  withEncryption,
  withDecryption,
  EncryptedData,
  SensitiveWealthFields
} from './encryption'

const API_BASE = '/api/v1'

// Define which fields should be encrypted
const SENSITIVE_ENTITY_FIELDS = [
  'account_number',
  'ssn', 
  'tax_id',
  'routing_number',
  'beneficiary_info',
  'private_notes',
  'advisor_contact',
  'bank_details'
]

const SENSITIVE_TRANSACTION_FIELDS = [
  'confirmation_number',
  'account_reference',
  'counterparty_details',
  'regulatory_notes'
]

/**
 * Enhanced wealth entity with encryption support
 */
export interface SecureWealthEntity extends WealthEntity {
  encrypted_fields?: Record<string, EncryptedData>
  sensitive_data?: SensitiveWealthFields
}

/**
 * Enhanced transaction with encryption support  
 */
export interface SecureWealthTransaction extends WealthTransaction {
  encrypted_fields?: Record<string, EncryptedData>
}

/**
 * Create a new secure wealth entity with encryption
 */
export async function createSecureWealthEntity(
  entity: Omit<SecureWealthEntity, 'entity_id' | 'created_at' | 'updated_at'>,
  organizationId: string
): Promise<SecureWealthEntity> {
  try {
    // Extract sensitive data
    const sensitiveData: SensitiveWealthFields = {}
    const entityData = { ...entity }
    
    SENSITIVE_ENTITY_FIELDS.forEach(field => {
      if (entityData[field as keyof typeof entityData]) {
        sensitiveData[field as keyof SensitiveWealthFields] = 
          entityData[field as keyof typeof entityData] as string
        delete entityData[field as keyof typeof entityData]
      }
    })
    
    // Encrypt sensitive fields
    const encryptedFields = encryptSensitiveFields(sensitiveData, organizationId)
    
    // Store encrypted data in HERA's dynamic_data table
    const entityWithEncryption = {
      ...entityData,
      encrypted_fields: encryptedFields
    }
    
    // Call HERA API to create entity
    const response = await fetch(`${API_BASE}/entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Organization-ID': organizationId
      },
      body: JSON.stringify({
        entity_type: entity.entity_type,
        entity_name: entity.entity_name,
        entity_code: entity.entity_code,
        from_entity_id: entity.from_entity_id,
        is_active: entity.is_active,
        dynamic_data: Object.entries(encryptedFields).map(([field, encryptedData]) => ({
          field_name: `encrypted_${field}`,
          field_value: JSON.stringify(encryptedData),
          data_type: 'json'
        }))
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create secure entity: ${response.statusText}`)
    }
    
    const createdEntity = await response.json()
    return {
      ...createdEntity,
      encrypted_fields: encryptedFields,
      sensitive_data: sensitiveData
    }
  } catch (error) {
    throw new Error(`Secure entity creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Retrieve and decrypt wealth entity
 */
export async function getSecureWealthEntity(
  entityId: string,
  organizationId: string
): Promise<SecureWealthEntity | null> {
  try {
    // Get entity from HERA API
    const response = await fetch(`${API_BASE}/entities/${entityId}`, {
      headers: {
        'Organization-ID': organizationId
      }
    })
    
    if (!response.ok) {
      if (response.status === 404) return null
      throw new Error(`Failed to fetch entity: ${response.statusText}`)
    }
    
    const entity = await response.json()
    
    // Get encrypted dynamic data
    const dynamicDataResponse = await fetch(`${API_BASE}/entities/${entityId}/dynamic-data`, {
      headers: {
        'Organization-ID': organizationId
      }
    })
    
    let encryptedFields: Record<string, EncryptedData> = {}
    if (dynamicDataResponse.ok) {
      const dynamicData = await dynamicDataResponse.json()
      
      // Extract encrypted fields
      dynamicData.forEach((data: WealthDynamicData) => {
        if (data.field_name.startsWith('encrypted_') && data.data_type === 'json') {
          const fieldName = data.field_name.replace('encrypted_', '')
          encryptedFields[fieldName] = JSON.parse(data.field_value)
        }
      })
    }
    
    // Decrypt sensitive fields
    let sensitiveData: SensitiveWealthFields = {}
    if (Object.keys(encryptedFields).length > 0) {
      sensitiveData = decryptSensitiveFields(encryptedFields, organizationId)
    }
    
    return {
      ...entity,
      encrypted_fields: encryptedFields,
      sensitive_data: sensitiveData
    }
  } catch (error) {
    throw new Error(`Secure entity retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Update secure wealth entity with encryption
 */
export async function updateSecureWealthEntity(
  entityId: string,
  updates: Partial<SecureWealthEntity>,
  organizationId: string
): Promise<SecureWealthEntity> {
  try {
    // Separate sensitive from non-sensitive updates
    const sensitiveUpdates: SensitiveWealthFields = {}
    const regularUpdates = { ...updates }
    
    SENSITIVE_ENTITY_FIELDS.forEach(field => {
      if (regularUpdates[field as keyof typeof regularUpdates]) {
        sensitiveUpdates[field as keyof SensitiveWealthFields] = 
          regularUpdates[field as keyof typeof regularUpdates] as string
        delete regularUpdates[field as keyof typeof regularUpdates]
      }
    })
    
    // Update regular fields
    if (Object.keys(regularUpdates).length > 0) {
      const response = await fetch(`${API_BASE}/entities/${entityId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Organization-ID': organizationId
        },
        body: JSON.stringify(regularUpdates)
      })
      
      if (!response.ok) {
        throw new Error(`Failed to update entity: ${response.statusText}`)
      }
    }
    
    // Update encrypted fields
    if (Object.keys(sensitiveUpdates).length > 0) {
      const encryptedUpdates = encryptSensitiveFields(sensitiveUpdates, organizationId)
      
      // Update dynamic data with new encrypted values
      for (const [field, encryptedData] of Object.entries(encryptedUpdates)) {
        await fetch(`${API_BASE}/entities/${entityId}/dynamic-data`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Organization-ID': organizationId
          },
          body: JSON.stringify({
            field_name: `encrypted_${field}`,
            field_value: JSON.stringify(encryptedData),
            data_type: 'json'
          })
        })
      }
    }
    
    // Return updated entity
    return await getSecureWealthEntity(entityId, organizationId) as SecureWealthEntity
  } catch (error) {
    throw new Error(`Secure entity update failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * List secure wealth entities with decryption
 */
export async function listSecureWealthEntities(
  organizationId: string,
  entityType?: WealthEntityType
): Promise<SecureWealthEntity[]> {
  try {
    const params = new URLSearchParams()
    if (entityType) params.append('entity_type', entityType)
    
    const response = await fetch(`${API_BASE}/entities?${params}`, {
      headers: {
        'Organization-ID': organizationId
      }
    })
    
    if (!response.ok) {
      throw new Error(`Failed to list entities: ${response.statusText}`)
    }
    
    const entities = await response.json()
    
    // Decrypt each entity
    const secureEntities = await Promise.all(
      entities.map(async (entity: WealthEntity) => {
        return await getSecureWealthEntity(entity.entity_id, organizationId)
      })
    )
    
    return secureEntities.filter(Boolean) as SecureWealthEntity[]
  } catch (error) {
    throw new Error(`Secure entity listing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Create secure wealth transaction with encryption
 */
export async function createSecureWealthTransaction(
  transaction: Omit<SecureWealthTransaction, 'transaction_id' | 'created_at'>,
  organizationId: string
): Promise<SecureWealthTransaction> {
  try {
    // Extract and encrypt sensitive transaction data
    const sensitiveData: Record<string, string> = {}
    const transactionData = { ...transaction }
    
    SENSITIVE_TRANSACTION_FIELDS.forEach(field => {
      if (transactionData[field as keyof typeof transactionData]) {
        sensitiveData[field] = transactionData[field as keyof typeof transactionData] as string
        delete transactionData[field as keyof typeof transactionData]
      }
    })
    
    // Encrypt sensitive fields
    const encryptedFields: Record<string, EncryptedData> = {}
    Object.entries(sensitiveData).forEach(([field, value]) => {
      encryptedFields[field] = encryptData(value, organizationId)
    })
    
    // Create transaction via HERA API
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Organization-ID': organizationId
      },
      body: JSON.stringify({
        ...transactionData,
        encrypted_data: encryptedFields
      })
    })
    
    if (!response.ok) {
      throw new Error(`Failed to create secure transaction: ${response.statusText}`)
    }
    
    const createdTransaction = await response.json()
    return {
      ...createdTransaction,
      encrypted_fields: encryptedFields
    }
  } catch (error) {
    throw new Error(`Secure transaction creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Search encrypted data (using hashed search terms)
 */
export async function searchSecureWealthData(
  searchTerm: string,
  organizationId: string,
  entityType?: WealthEntityType
): Promise<SecureWealthEntity[]> {
  // For demo purposes, return filtered results
  // In production, implement hashed search indexing
  const entities = await listSecureWealthEntities(organizationId, entityType)
  
  return entities.filter(entity => {
    // Search in non-sensitive fields
    const searchableText = [
      entity.entity_name,
      entity.entity_code,
      entity.entity_type
    ].join(' ').toLowerCase()
    
    return searchableText.includes(searchTerm.toLowerCase())
  })
}

/**
 * Audit log for encrypted data access
 */
export interface EncryptionAuditLog {
  timestamp: string
  action: 'encrypt' | 'decrypt' | 'access' | 'update'
  entity_id: string
  user_id: string
  organization_id: string
  field_names: string[]
  success: boolean
  error?: string
}

export async function logEncryptionAccess(log: EncryptionAuditLog): Promise<void> {
  try {
    // In production, send to secure audit log service
    console.log('PWM Encryption Audit:', log)
    
    // Could store in HERA's universal transaction log
    await fetch(`${API_BASE}/audit-log`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Organization-ID': log.organization_id
      },
      body: JSON.stringify({
        event_type: 'pwm_encryption_access',
        event_data: log
      })
    })
  } catch (error) {
    console.error('Failed to log encryption access:', error)
  }
}