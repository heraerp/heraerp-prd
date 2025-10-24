/**
 * Entity & Transaction Normalization Utilities
 *
 * Enforces HERA uppercase standards for entity types, transaction types, and relationship types
 */

/**
 * Normalizes relationship keys to UPPERCASE standard
 * Ensures all relationship types follow HERA DNA naming conventions
 */
export function normalizeRelationships(relationships: any): any {
  if (!relationships || typeof relationships !== 'object') {
    return relationships
  }

  const normalized: any = {}

  for (const [key, value] of Object.entries(relationships)) {
    // Convert relationship type to UPPERCASE
    const normalizedKey = key.toUpperCase()
    normalized[normalizedKey] = value
  }

  return normalized
}

/**
 * Normalizes a complete entity object
 * Ensures entity_type and all relationship types are UPPERCASE
 */
export function normalizeEntity(entity: any): any {
  if (!entity || typeof entity !== 'object') {
    return entity
  }

  return {
    ...entity,
    // Ensure entity_type is UPPERCASE
    ...(entity.entity_type && { entity_type: entity.entity_type.toUpperCase() }),
    // Normalize all relationship keys to UPPERCASE
    ...(entity.relationships && { relationships: normalizeRelationships(entity.relationships) })
  }
}

/**
 * Normalizes an array of entities
 */
export function normalizeEntities(entities: any[]): any[] {
  if (!Array.isArray(entities)) {
    return entities
  }

  return entities.map(normalizeEntity)
}

/**
 * Gets a relationship from an entity using UPPERCASE standard
 * Always returns normalized relationship data
 */
export function getRelationship(
  entity: any,
  relationshipType: string
): any | any[] | null {
  if (!entity?.relationships) {
    return null
  }

  // Normalize the relationship type to UPPERCASE
  const normalizedType = relationshipType.toUpperCase()

  // Access using normalized key
  return entity.relationships[normalizedType] || null
}

/**
 * Extracts entity IDs from a relationship
 * Handles both array and single relationship formats
 */
export function extractRelationshipIds(
  relationship: any,
  idField: 'to_entity_id' | 'from_entity_id' | 'source_entity_id' | 'target_entity_id' = 'to_entity_id'
): string[] {
  if (!relationship) {
    return []
  }

  // Handle array of relationships
  if (Array.isArray(relationship)) {
    return relationship
      .filter((rel: any) => rel?.[idField] || rel?.to_entity?.id)
      .map((rel: any) => rel[idField] || rel.to_entity?.id)
      .filter(Boolean)
  }

  // Handle single relationship
  const id = relationship[idField] || relationship?.to_entity?.id
  return id ? [id] : []
}

// ================================================================================
// TRANSACTION NORMALIZATION UTILITIES
// ================================================================================

/**
 * Normalizes transaction_type to UPPERCASE standard
 * Ensures all transaction types follow HERA DNA standard (SALE, APPOINTMENT, PAYMENT, etc.)
 *
 * @param transactionType - Raw transaction type (may be lowercase/mixed case)
 * @returns Normalized UPPERCASE transaction type or undefined
 *
 * @example
 * normalizeTransactionType('sale') // Returns 'SALE'
 * normalizeTransactionType('APPOINTMENT') // Returns 'APPOINTMENT'
 * normalizeTransactionType('Payment') // Returns 'PAYMENT'
 * normalizeTransactionType(null) // Returns undefined
 */
export function normalizeTransactionType(transactionType?: string | null): string | undefined {
  if (!transactionType) return undefined
  return transactionType.toUpperCase()
}

/**
 * Normalizes a complete transaction object
 * Ensures transaction_type is UPPERCASE
 *
 * @param transaction - Transaction object to normalize
 * @returns Normalized transaction object
 *
 * @example
 * normalizeTransaction({ transaction_type: 'sale', total_amount: 100 })
 * // Returns { transaction_type: 'SALE', total_amount: 100 }
 */
export function normalizeTransaction(transaction: any): any {
  if (!transaction || typeof transaction !== 'object') {
    return transaction
  }

  return {
    ...transaction,
    // Ensure transaction_type is UPPERCASE
    ...(transaction.transaction_type && {
      transaction_type: normalizeTransactionType(transaction.transaction_type)
    })
  }
}

/**
 * Normalizes an array of transactions
 *
 * @param transactions - Array of transactions to normalize
 * @returns Array of normalized transactions
 */
export function normalizeTransactions(transactions: any[]): any[] {
  if (!Array.isArray(transactions)) {
    return transactions
  }

  return transactions.map(normalizeTransaction)
}
