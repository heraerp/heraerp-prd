/**
 * HERA POS Library - Barrel Export
 * Smart Code: HERA.RETAIL.POS.LIB.INDEX.v1
 * 
 * Complete POS system integration with HERA API v2
 */

// Universal Service Layer
export { 
  UniversalPOSService, 
  createUniversalPOSService,
  POS_SMART_CODES 
} from './universal-pos-service'

export type {
  POSEntity,
  POSDynamicField,
  POSCreateRequest,
  POSRelationship,
  POSServiceResponse
} from './universal-pos-service'

// Entity Hooks
export * from './hooks'