/**
 * DNA SDK Stub - Temporary replacement for @hera/dna-sdk
 * This allows the build to complete while the actual SDK is being set up
 */

// Stub types
export type SmartCode = string
export type OrganizationId = string
export type EntityId = string
export type TransactionId = string

// Stub DNA object
export const DNA = {
  SACRED_TABLES: {
    ORGANIZATIONS: 'core_organizations',
    ENTITIES: 'core_entities',
    RELATIONSHIPS: 'core_relationships',
    TRANSACTIONS: 'universal_transactions',
    TRANSACTION_LINES: 'universal_transaction_lines',
    DYNAMIC_DATA: 'core_dynamic_data'
  }
}

// Stub functions
export const createOrganizationId = (id: string): OrganizationId => id
export const createSmartCode = (code: string): SmartCode => code
export const createEntityId = (id: string): EntityId => id
export const createTransactionId = (id: string): TransactionId => id

// Stub client
export class HeraDNAClient {
  constructor(config: any) {}

  async createEntity(data: any): Promise<any> {
    return { success: true, data }
  }

  async createTransaction(data: any): Promise<any> {
    return { success: true, data }
  }

  async query(table: string, filters: any): Promise<any> {
    return { success: true, data: [] }
  }
}

// Re-export everything needed
export default {
  DNA,
  HeraDNAClient,
  createOrganizationId,
  createSmartCode,
  createEntityId,
  createTransactionId
}
