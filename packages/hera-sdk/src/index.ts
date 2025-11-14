/**
 * @hera/sdk - HERA ERP Platform SDK
 * 
 * ENFORCES API v2 Gateway Security
 * - All operations go through Enhanced Gateway
 * - No direct RPC access allowed
 * - Complete actor stamping and audit trail
 * - Organization isolation enforced
 * 
 * Smart Code: HERA.SDK.CLIENT.GATEWAY_ENFORCED.v1
 */

export { HeraClient } from './client/HeraClient'
export { HeraMCPClient } from './client/HeraMCPClient'
export { HeraAIClient } from './client/HeraAIClient'

// Type exports
export type {
  HeraClientOptions,
  HeraEntity,
  HeraTransaction,
  HeraRelationship,
  HeraDynamicField,
  HeraResponse,
  HeraErrorResponse,
  HeraSuccessResponse
} from './types'

// Validation exports
export {
  HeraEntitySchema,
  HeraTransactionSchema,
  HeraDynamicFieldSchema,
  validateSmartCode,
  validateOrganizationId
} from './validation'

// Utility exports
export {
  createHeraClient,
  createHeraMCPClient,
  createHeraAIClient,
  isHeraError,
  formatHeraError,
  HERA_SMART_CODE_REGEX
} from './utils'

// Constants
export const HERA_SDK_VERSION = '2.5.0'
export const HERA_API_VERSION = 'v2'
export const HERA_GATEWAY_PATH = '/functions/v1/api-v2'