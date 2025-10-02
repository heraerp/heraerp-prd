/**
 * HERA UI Binder - Neutral interface over Universal API v2
 * Simple hooks powered by generic v2 hooks
 */

import {
  useEntity,
  useEntities,
  useRelationships,
  useEmitTransaction,
  useUpsertEntity
} from '@/lib/universal/v2/hooks'
import { parseQuery } from './query-dsl'
import type { ListParams, RecordParams, RelListParams, ActionParams, UpsertParams } from './types'

/**
 * List entities with filtering, search, and pagination
 */
export function useList(orgId: string, params: ListParams = {}) {
  const {
    entityType,
    smartCodePrefix,
    search,
    limit = 50,
    offset = 0,
    orderBy = 'created_at desc'
  } = params

  // Build query parameters
  const queryParams: any = {
    organization_id: orgId,
    limit,
    offset,
    order_by: orderBy
  }

  if (entityType) {
    queryParams.entity_type = entityType
  }

  if (smartCodePrefix) {
    queryParams.smart_code_prefix = smartCodePrefix
  }

  if (search) {
    queryParams.search = search
  }

  return useEntities(queryParams)
}

/**
 * Get single record by ID
 */
export function useRecord(orgId: string, entity_id: string) {
  const params: RecordParams = {
    entity_id,
    organization_id: orgId
  }

  return useEntity(entity_id, orgId)
}

/**
 * List relationships for entity
 */
export function useRelList(orgId: string, params: RelListParams = {}) {
  const { from_entity_id, to_entity_id, smartCodePrefix, limit = 50, offset = 0 } = params

  const queryParams: any = {
    organization_id: orgId,
    limit,
    offset
  }

  if (from_entity_id) {
    queryParams.from_entity_id = from_entity_id
  }

  if (to_entity_id) {
    queryParams.to_entity_id = to_entity_id
  }

  if (smartCodePrefix) {
    queryParams.smart_code_prefix = smartCodePrefix
  }

  return useRelationships(queryParams)
}

/**
 * Emit transaction action
 */
export function useAction() {
  const { mutate: emitTransaction, ...rest } = useEmitTransaction()

  const executeAction = async (params: ActionParams) => {
    const { smart_code, payload } = params

    return emitTransaction({
      ...payload,
      smart_code
    })
  }

  return {
    executeAction,
    ...rest
  }
}

/**
 * Upsert entity (create or update)
 */
export function useUpsert() {
  const { mutate: upsertEntity, ...rest } = useUpsertEntity()

  const upsert = async (params: UpsertParams) => {
    return upsertEntity(params)
  }

  return {
    upsert,
    ...rest
  }
}

/**
 * Parse query parameters with DSL support
 */
export function useQueryParser() {
  return {
    parseQuery
  }
}

// Re-export types for convenience
export type { ListParams, RecordParams, RelListParams, ActionParams, UpsertParams } from './types'
