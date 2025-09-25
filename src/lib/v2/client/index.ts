/**
 * HERA V2 API Client
 * Unified client for all v2 API operations
 */

export * from './base-client';
export * from './entity-client';
export * from './relationship-client';
export * from './txn-client';
export * from './dynamic-client';

// Re-export clients with v2 prefix for clarity
export { entityClientV2 } from './entity-client';
export { relationshipClientV2, relationshipHelpers } from './relationship-client';
export { txnClientV2, txnHelpers } from './txn-client';
// export { dynamicClientV2 } from './dynamic-client';

// Create unified v2 client
export const heraV2Client = {
  entity: require('./entity-client').entityClientV2,
  relationship: require('./relationship-client').relationshipClientV2,
  transaction: require('./txn-client').txnClientV2,
  // dynamic: require('./dynamic-client').dynamicClientV2,
  helpers: {
    relationship: require('./relationship-client').relationshipHelpers,
    transaction: require('./txn-client').txnHelpers
  }
};