/**
 * HERA V2 API Client
 * Unified client for all v2 API operations
 */

export * from './base-client'
export * from './entity-client'
export * from './relationship-client'
export * from './txn-client'
export * from './dynamic-client'

// Re-export clients with v2 prefix for clarity
export { entityClientV2 } from './entity-client'
export { relationshipClientV2, relationshipHelpers } from './relationship-client'
export { txnClientV2, txnHelpers } from './txn-client'
export { dynamicClientV2 } from './dynamic-client'

// Create unified v2 client (using async imports to avoid require issues)
export const heraV2Client = {
  async entity() {
    const { entityClientV2 } = await import('./entity-client')
    return entityClientV2
  },
  
  async relationship() {
    const { relationshipClientV2 } = await import('./relationship-client')
    return relationshipClientV2
  },
  
  async transaction() {
    const { txnClientV2 } = await import('./txn-client')
    return txnClientV2
  },
  
  async dynamic() {
    const { dynamicClientV2 } = await import('./dynamic-client')
    return dynamicClientV2
  },
  
  async helpers() {
    const [
      { relationshipHelpers },
      { txnHelpers }
    ] = await Promise.all([
      import('./relationship-client'),
      import('./txn-client')
    ])
    
    return {
      relationship: relationshipHelpers,
      transaction: txnHelpers
    }
  }
}
