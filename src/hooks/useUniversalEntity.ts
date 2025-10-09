'use client'

import { useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { supabase } from '@/lib/supabase/client'
import {
  getEntities,
  getDynamicData,
  setDynamicDataBatch,
  upsertEntity,
  deleteEntity,
  DynamicFieldInput
} from '@/lib/universal-api-v2-client'

// Universal entity type definition
export interface UniversalEntity {
  entity_type: string
  entity_name: string
  entity_code?: string
  smart_code: string
  metadata?: Record<string, any>
  dynamic_fields?: Record<
    string,
    {
      value: any
      type: 'text' | 'number' | 'boolean' | 'date' | 'json'
      smart_code: string
    }
  >
}

// New types for enhanced functionality
export type DynType = 'text' | 'number' | 'boolean' | 'date' | 'json'

export type DynamicFieldDef = {
  name: string // core_dynamic_data.field_name
  type: DynType
  smart_code: string
  required?: boolean
  defaultValue?: any
}

export type RelationshipDef = {
  type: string // e.g. HAS_CATEGORY
  smart_code: string // e.g. HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1
  cardinality?: 'one' | 'many'
}

// Small helpers
const byId = (arr: any[] = []) => {
  const m = new Map<string, any>()
  for (const it of arr) if (it?.entity_id || it?.id) m.set(it.entity_id || it.id, it)
  return m
}

function shallowEqual(a: any, b: any) {
  if (a === b) return true
  if (!a || !b) return false
  const ak = Object.keys(a)
  const bk = Object.keys(b)
  if (ak.length !== bk.length) return false
  for (const k of ak) if (a[k] !== b[k]) return false
  return true
}

function normalizeEntity(e: any) {
  // Ensure deterministic shapes for dynamic_fields + relationships
  const out = { ...e }

  // dynamic_fields can be either raw or { value } shaped across sources — normalize to { value, type?, smart_code? }
  if (out.dynamic_fields && typeof out.dynamic_fields === 'object') {
    const dfNorm: Record<string, any> = {}
    const keys = Object.keys(out.dynamic_fields).sort()
    for (const k of keys) {
      const v = out.dynamic_fields[k]
      if (v && typeof v === 'object' && 'value' in v) {
        dfNorm[k] = { ...v }
      } else {
        dfNorm[k] = { value: v } // wrap primitives
      }
    }
    out.dynamic_fields = dfNorm
  }

  // relationships: sort each relation type by related entity_id to stabilize array order
  if (out.relationships && typeof out.relationships === 'object') {
    const relNorm: Record<string, any[]> = {}
    const rkeys = Object.keys(out.relationships).sort()
    for (const rk of rkeys) {
      const list = Array.isArray(out.relationships[rk]) ? out.relationships[rk] : []
      relNorm[rk] = [...list].sort((a, b) => {
        const A = a?.entity_id || a?.to_entity_id || ''
        const B = b?.entity_id || b?.to_entity_id || ''
        return A.localeCompare(B)
      })
    }
    out.relationships = relNorm
  }

  return out
}

// Reuse previous entities when identical (structural sharing)
function shareWithPrevious(prevArr: any[] | undefined, nextArr: any[]) {
  if (!prevArr || prevArr.length === 0) return nextArr
  const prevMap = byId(prevArr)
  const out = nextArr.map(n => {
    const id = n.entity_id || n.id
    const p = prevMap.get(id)
    if (!p) return n
    // Fast checks on common top-level fields
    if (
      p.entity_name === n.entity_name &&
      p.entity_code === n.entity_code &&
      p.status === n.status &&
      p.smart_code === n.smart_code &&
      shallowEqual(p.dynamic_fields, n.dynamic_fields) &&
      shallowEqual(p.relationships, n.relationships) &&
      shallowEqual(p.metadata, n.metadata)
    ) {
      return p // reuse previous ref
    }
    return n
  })
  return out
}

// Helper mappers for dynamic field conversion
function toBatchItems(
  defs: DynamicFieldDef[] | undefined,
  values: Record<string, any> | undefined
) {
  if (!defs?.length || !values) return []
  return defs
    .filter(d => d.name in values)
    .map(d => {
      const v = values[d.name]
      const item: any = {
        field_name: d.name,
        field_type: d.type,
        smart_code: d.smart_code
      }
      if (d.type === 'number') item.field_value_number = Number(v ?? 0)
      else if (d.type === 'boolean') item.field_value_boolean = !!v
      else if (d.type === 'date') item.field_value_date = v ?? null
      else if (d.type === 'json') item.field_value_json = v ?? null
      else item.field_value_text = v ?? ''
      return item
    })
}

function mergeDynamic(rows: any[]) {
  const out: Record<string, any> = {}
  for (const r of rows ?? []) {
    const name = r.field_name
    out[name] =
      r.field_value_number ??
      r.field_value_boolean ??
      r.field_value_text ??
      r.field_value_json ??
      null
  }
  return out
}

// ================================================================================
// ENTERPRISE PATTERN: Entity Type Normalization
// ================================================================================

/**
 * Normalizes entity_type to uppercase for consistency
 * HERA Standard: All entity types are UPPERCASE (CUSTOMER, STAFF, PRODUCT, etc.)
 */
function normalizeEntityType(entityType: string): string {
  if (!entityType) return entityType
  return entityType.toUpperCase()
}

// ================================================================================
// ENTERPRISE PATTERN: Enhanced Error with HTTP Status and Details
// ================================================================================

/**
 * Enhanced Error class that preserves HTTP status codes and error details
 * This ensures proper error handling throughout the application
 */
export class EnhancedError extends Error {
  status: number
  statusCode: number // Alias for compatibility
  code: string
  details?: any

  constructor(message: string, status: number, code: string, details?: any) {
    super(message)
    this.name = 'EnhancedError'
    this.status = status
    this.statusCode = status // Alias for compatibility with different error detection patterns
    this.code = code
    this.details = details

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EnhancedError)
    }
  }
}

// Helper to get authentication headers, including organization context
async function getAuthHeaders(organizationId?: string | null): Promise<Record<string, string>> {
  const {
    data: { session }
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    console.log('❌ No authentication available')
    throw new Error('Authentication required')
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${session.access_token}`,
    'x-hera-api-version': 'v2'
  }
  if (organizationId) headers['x-hera-org'] = organizationId // Must match verifyAuth

  return headers
}

/**
 * Universal hook for ANY entity type
 * Works with products, services, customers, vendors, employees, etc.
 * Now with dynamic fields and relationship management!
 */
// Config type for the hook
export interface UseUniversalEntityConfig {
  entity_type: string
  organizationId?: string // Optional: if not provided, will use useHERAAuth
  filters?: {
    status?: string
    priority?: string
    q?: string
    limit?: number
    offset?: number
    include_dynamic?: boolean
    include_relationships?: boolean
  }
  dynamicFields?: DynamicFieldDef[] // Define dynamic fields for this entity type
  relationships?: RelationshipDef[] // Define relationship types
}

export function useUniversalEntity(config: UseUniversalEntityConfig) {
  const { organization } = useHERAAuth()
  const queryClient = useQueryClient()
  // Use passed organizationId if provided, otherwise fall back to useHERAAuth
  const organizationId = config.organizationId || organization?.id

  // ✅ ENTERPRISE PATTERN: Normalize entity_type to uppercase
  const entity_type = normalizeEntityType(config.entity_type)
  const { filters = {} } = config

  // Build query key - only include primitives
  const queryKey = useMemo(
    () => [
      'entities',
      entity_type,
      organizationId,
      {
        // only include primitives in the key
        limit: filters.limit ?? 100,
        offset: filters.offset ?? 0,
        include_dynamic: filters.include_dynamic !== false,
        include_relationships: !!filters.include_relationships,
        status: filters.status ?? null,
        priority: filters.priority ?? null,
        q: filters.q ?? null
      }
    ],
    [
      entity_type,
      organizationId,
      filters.limit,
      filters.offset,
      filters.include_dynamic,
      filters.include_relationships,
      filters.status,
      filters.priority,
      filters.q
    ]
  )

  // A ref to keep the last stable array
  const lastStableRef = useRef<any[] | undefined>(undefined)

  // Fetch entities with dynamic data (following useHeraServices pattern)
  const {
    data: entities,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      if (!organizationId) throw new Error('Organization ID required')

      console.log('[useUniversalEntity] Fetching entities:', {
        entity_type,
        organizationId,
        status: filters.status
      })

      // Fetch entities using RPC
      const result = await getEntities('', {
        p_organization_id: organizationId,
        p_entity_type: entity_type,
        p_status: filters.status || null, // Pass null to get all statuses
        p_include_relationships: !!filters.include_relationships,
        p_include_dynamic: filters.include_dynamic !== false
      })

      const entitiesArray = Array.isArray(result) ? result : []

      console.log('[useUniversalEntity] Fetched entities:', {
        count: entitiesArray.length,
        isArray: Array.isArray(result),
        first_entity: entitiesArray[0],
        first_entity_has_relationships: entitiesArray[0] ? !!entitiesArray[0].relationships : false,
        first_entity_relationships: entitiesArray[0]?.relationships
      })

      // Check if entities already have dynamic_fields from RPC
      const hasDynamicFieldsInRpc = entitiesArray[0]?.dynamic_fields
      console.log('[useUniversalEntity] Dynamic fields check:', {
        hasDynamicFieldsInRpc: !!hasDynamicFieldsInRpc,
        firstEntityDynamicFields: entitiesArray[0]?.dynamic_fields
      })

      // Fetch dynamic data for ALL entities in ONE batch call (only if not already in RPC response)
      const headers = await getAuthHeaders(organizationId)
      const entityIds = entitiesArray.map(e => e.id)

      let allDynamicData: any[] = []

      // If RPC already returned dynamic_fields, use those
      if (hasDynamicFieldsInRpc) {
        entitiesArray.forEach(entity => {
          if (entity.dynamic_fields && Array.isArray(entity.dynamic_fields)) {
            entity.dynamic_fields.forEach((field: any) => {
              allDynamicData.push({
                ...field,
                entity_id: entity.id
              })
            })
          }
        })
        console.log('[useUniversalEntity] Using dynamic fields from RPC:', allDynamicData.length)
      } else if (entityIds.length > 0) {
        try {
          const response = await fetch(`/api/v2/dynamic-data?p_entity_ids=${entityIds.join(',')}`, {
            headers
          })
          if (response.ok) {
            const result = await response.json()
            allDynamicData = result.data || []
            console.log(
              '[useUniversalEntity] Fetched dynamic data from API:',
              allDynamicData.length
            )
          }
        } catch (error) {
          console.error('[useUniversalEntity] Failed to fetch dynamic data batch:', error)
        }
      }

      // Group dynamic data by entity_id
      const dynamicDataByEntity = new Map<string, any[]>()
      allDynamicData.forEach((field: any) => {
        if (!dynamicDataByEntity.has(field.entity_id)) {
          dynamicDataByEntity.set(field.entity_id, [])
        }
        dynamicDataByEntity.get(field.entity_id)!.push(field)
      })

      // Merge dynamic data into entities
      const entitiesWithDynamicData = entitiesArray.map((entity: any) => {
        const dynamicData = dynamicDataByEntity.get(entity.id) || []
        const mergedData = { ...entity }

        dynamicData.forEach((field: any) => {
          if (field.field_type === 'number') {
            mergedData[field.field_name] = field.field_value_number
          } else if (field.field_type === 'boolean') {
            mergedData[field.field_name] = field.field_value_boolean
          } else if (field.field_type === 'text') {
            mergedData[field.field_name] = field.field_value_text
          } else if (field.field_type === 'json') {
            mergedData[field.field_name] = field.field_value_json
          } else if (field.field_type === 'date') {
            mergedData[field.field_name] = field.field_value_date
          } else {
            // Fallback for unknown types
            mergedData[field.field_name] =
              field.field_value_text ||
              field.field_value_number ||
              field.field_value_boolean ||
              field.field_value_json ||
              field.field_value_date
          }
        })

        return mergedData
      })

      console.log('[useUniversalEntity] Entities with dynamic data:', {
        count: entitiesWithDynamicData.length,
        first_entity_merged: entitiesWithDynamicData[0],
        dynamicDataCount: allDynamicData.length
      })

      // Fetch relationships for all entities if requested
      if (filters.include_relationships && entitiesWithDynamicData.length > 0) {
        // Reuse headers from above to avoid extra auth calls

        // Get all relationship types from config
        const relationshipTypes = config.relationships?.map(r => r.type) || []

        if (relationshipTypes.length > 0) {
          // Fetch relationships for all entities in one call per type
          const entityIds = entitiesWithDynamicData.map(e => e.id)

          for (const relType of relationshipTypes) {
            try {
              const response = await fetch('/api/v2/relationships/list', {
                method: 'POST',
                headers,
                body: JSON.stringify({
                  filters: {
                    relationship_type: relType,
                    status: 'ACTIVE'
                  },
                  limit: 1000
                })
              })

              if (response.ok) {
                const { items } = await response.json()

                // Group relationships by from_entity_id
                const relsByEntity = new Map<string, any[]>()
                items.forEach((rel: any) => {
                  if (entityIds.includes(rel.from_entity_id)) {
                    if (!relsByEntity.has(rel.from_entity_id)) {
                      relsByEntity.set(rel.from_entity_id, [])
                    }
                    relsByEntity.get(rel.from_entity_id)!.push(rel)
                  }
                })

                // Merge relationships into entities
                entitiesWithDynamicData.forEach(entity => {
                  if (!entity.relationships) entity.relationships = {}
                  const rels = relsByEntity.get(entity.id) || []
                  // Store with both original casing and lowercase for compatibility
                  const relArray = rels.map(r => ({
                    ...r,
                    to_entity: r.to_entity || { id: r.to_entity_id }
                  }))
                  entity.relationships[relType.toLowerCase()] = relArray
                  entity.relationships[relType] = relArray // Keep original casing too
                })
              }
            } catch (error) {
              console.error(`[useUniversalEntity] Failed to fetch ${relType} relationships:`, error)
            }
          }
        }
      }

      return entitiesWithDynamicData
    },
    enabled: !!organizationId,
    staleTime: 10_000,
    refetchOnWindowFocus: false
  })

  // Create entity mutation with dynamic fields and relationships
  const createMutation = useMutation({
    mutationFn: async (entity: UniversalEntity & Record<string, any>) => {
      const headers = await getAuthHeaders(organizationId)

      // Prepare request body with organization context and entity type
      const baseBody: any = {
        p_organization_id: organizationId,
        entity_type,
        entity_name: entity.entity_name,
        smart_code: entity.smart_code,
        ...(entity.entity_code ? { entity_code: entity.entity_code } : {}),
        ...(entity.status ? { status: entity.status } : {}),
        ...(entity.metadata ? { metadata: entity.metadata } : {}),
        ...(entity.dynamic_fields ? { dynamic_fields: entity.dynamic_fields } : {})
      }

      // 1) Create entity
      const r = await fetch('/api/v2/entities', {
        method: 'POST',
        headers,
        body: JSON.stringify(baseBody)
      })
      if (!r.ok) {
        const errorData = await r.json().catch(() => ({ error: 'Create entity failed' }))
        throw new Error(errorData?.error || 'Create entity failed')
      }
      const created = await r.json()
      const entity_id = created?.data?.id || created?.data?.entity_id || created?.id

      if (!entity_id) {
        console.error('Unexpected response format:', created)
        throw new Error('Failed to get entity ID from creation response')
      }

      // 2) Dynamic fields batch (support both inline dynamic_fields and top-level values)
      const inline = (entity.dynamic_fields ?? {}) as Record<string, any>
      const inlineValues = Object.fromEntries(
        Object.entries(inline).map(([k, v]: any) => [k, v?.value])
      )
      const topLevelValues: Record<string, any> = {}
      for (const def of config.dynamicFields ?? []) {
        if (def.name in entity && (entity as any)[def.name] !== undefined) {
          topLevelValues[def.name] = (entity as any)[def.name]
        }
      }
      const mergedValues = { ...topLevelValues, ...inlineValues }
      const batchItems = toBatchItems(config.dynamicFields, mergedValues)
      if (batchItems.length) {
        await fetch('/api/v2/dynamic-data/batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            p_organization_id: organizationId,
            p_entity_id: entity_id,
            p_smart_code: entity.smart_code || 'HERA.ENTITY.DYNAMIC.FIELD.V1',
            p_fields: batchItems
          })
        })
      }

      // 3) Relationships (optional)
      // Accept either metadata.relationships or a top-level relationships map
      const relPayload = (entity as any)?.metadata?.relationships || (entity as any)?.relationships
      if (relPayload) {
        console.log('[useUniversalEntity] Relationship payload received:', {
          types: Object.keys(relPayload),
          values: relPayload
        })
      }
      if (relPayload && config.relationships?.length) {
        // Process each relationship type separately using bulk_upsert
        for (const def of config.relationships) {
          const toIds: string[] = relPayload[def.type] ?? []
          console.log(`[useUniversalEntity] Processing ${def.type}:`, {
            expectedType: def.type,
            receivedIds: toIds,
            isValid: toIds.length > 0 && toIds.every(id => id)
          })
          // Only create relationships if we have valid IDs
          if (toIds.length > 0 && toIds.every(id => id)) {
            console.log(`[useUniversalEntity] Creating ${def.type} relationships:`, {
              count: toIds.length,
              from: entity_id,
              to: toIds
            })

            const response = await fetch('/api/v2/relationships/bulk_upsert', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                relationship_type: def.type,
                smart_code: def.smart_code,
                pairs: toIds.map(to => ({
                  from_entity_id: entity_id,
                  to_entity_id: to
                })),
                status: 'ACTIVE'
              })
            })

            if (!response.ok) {
              const error = await response.json().catch(() => ({}))
              console.error(
                `[useUniversalEntity] Failed to create ${def.type} relationships:`,
                error
              )
              throw new Error(error.error || `Failed to create ${def.type} relationships`)
            }
          } else if (toIds.length > 0) {
            console.warn(`[useUniversalEntity] Skipping ${def.type} - contains invalid IDs:`, toIds)
          }
        }
      }

      return { id: entity_id }
    },
    onSuccess: () => {
      // Invalidate both specific entity type and all entities
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      console.log('✅ Invalidated queries after entity creation')
    }
  })

  // Update entity mutation with dynamic fields and relationships
  const updateMutation = useMutation({
    mutationFn: async ({
      entity_id,
      dynamic_patch,
      relationships_patch,
      ...updates
    }: Partial<UniversalEntity> & {
      entity_id: string
      dynamic_patch?: Record<string, any>
      relationships_patch?: Record<string, string[]> // TYPE -> [toIds]
    }) => {
      const headers = await getAuthHeaders(organizationId)

      // Convert dynamic_patch to the dynamic_fields format if provided
      let dynamic_fields_formatted: Record<string, any> | undefined
      if (dynamic_patch) {
        dynamic_fields_formatted = {}
        for (const [key, value] of Object.entries(dynamic_patch)) {
          // Find the field definition to get the type and smart_code
          const fieldDef = config.dynamicFields?.find(f => f.name === key)
          if (fieldDef) {
            dynamic_fields_formatted[key] = {
              value: value,
              type: fieldDef.type,
              smart_code: fieldDef.smart_code
            }
          }
        }
      }

      // Use the main PUT endpoint with dynamic_fields included
      const r = await fetch('/api/v2/entities', {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          p_organization_id: organizationId,
          entity_id,
          ...updates,
          ...(dynamic_fields_formatted && { dynamic_fields: dynamic_fields_formatted })
        })
      })

      if (!r.ok) {
        const error = await r.json().catch(() => ({}))
        throw new Error(error?.error || 'Update entity failed')
      }

      // Handle relationships if needed
      if (relationships_patch && config.relationships?.length) {
        // Process each relationship type separately using bulk_upsert
        for (const def of config.relationships) {
          const toIds = relationships_patch[def.type]
          if (!toIds) continue

          if (toIds.length > 0) {
            await fetch('/api/v2/relationships/bulk_upsert', {
              method: 'POST',
              headers,
              body: JSON.stringify({
                relationship_type: def.type,
                smart_code: def.smart_code,
                pairs: toIds.map(to => ({
                  from_entity_id: entity_id,
                  to_entity_id: to
                })),
                status: 'ACTIVE'
              })
            })
          } else {
            // Empty array means remove all relationships of this type
            // We could call a delete endpoint here if needed
            console.log(`Removing all ${def.type} relationships for entity ${entity_id}`)
          }
        }
      }

      return { id: entity_id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
    }
  })

  // Get entity by ID with dynamic fields and relationships
  const getById = async (entity_id: string) => {
    const headers = await getAuthHeaders(organizationId)

    const res = await fetch(`/api/v2/entities/${entity_id}`, { headers })
    if (!res.ok) throw new Error('Failed to fetch entity')
    const base = await res.json() // {data:{...}}

    // Fetch dynamic fields (optional)
    let dynamic: Record<string, any> = {}
    if (filters.include_dynamic !== false) {
      const q = new URLSearchParams({
        p_organization_id: organizationId ?? '',
        p_entity_id: entity_id,
        p_limit: '500'
      })
      const dd = await fetch(`/api/v2/dynamic/get?${q}`, { headers })
      const dj = await dd.json()
      dynamic = mergeDynamic(Array.isArray(dj?.data) ? dj.data : [])
    }

    // Fetch relationships (optional, only if config provided)
    let rels: any[] = []
    if (filters.include_relationships && config.relationships?.length) {
      const body = {
        p_organization_id: organizationId,
        p_entity_id: entity_id,
        p_side: 'either',
        p_relationship_type: null,
        p_active_only: true,
        p_limit: 200,
        p_offset: 0
      }
      const rq = await fetch('/api/v2/relationships/query', {
        method: 'POST',
        headers,
        body: JSON.stringify(body)
      })
      const rj = await rq.json()
      rels = Array.isArray(rj?.data) ? rj.data : []
    }

    return { entity: base?.data ?? base, dynamic, relationships: rels }
  }

  // Delete entity mutation - Enhanced RPC implementation
  // Supports both soft delete (archive) and hard delete with cascade
  const deleteMutation = useMutation({
    mutationFn: async ({
      entity_id,
      hard_delete = false,
      cascade = true,
      reason,
      smart_code = 'HERA.CORE.ENTITY.DELETE.V1'
    }: {
      entity_id: string
      hard_delete?: boolean
      cascade?: boolean
      reason?: string
      smart_code?: string
    }) => {
      const headers = await getAuthHeaders(organizationId)

      // Build query params following RPC contract
      const params = new URLSearchParams({
        hard_delete: hard_delete.toString(),
        cascade: cascade.toString(),
        smart_code
      })

      if (reason) {
        params.append('reason', reason)
      }

      console.log('[useUniversalEntity] Delete request:', {
        entity_id,
        mode: hard_delete ? 'HARD' : 'SOFT',
        cascade,
        entity_type
      })

      const response = await fetch(`/api/v2/entities/${entity_id}?${params}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({
          error: { code: 'UNKNOWN_ERROR', message: `HTTP ${response.status}` }
        }))

        const errorCode = error.error?.code || 'UNKNOWN_ERROR'
        const errorMessage = error.error?.message || error.error || 'Failed to delete entity'
        const errorDetails = error.error?.details

        // 🎯 ENTERPRISE PATTERN: Log 409 conflicts as info, not errors (expected behavior)
        const is409Conflict =
          response.status === 409 ||
          errorCode === 'TRANSACTION_INTEGRITY_VIOLATION' ||
          errorCode === 'FOREIGN_KEY_CONSTRAINT'

        if (is409Conflict) {
          console.log('[useUniversalEntity] Delete blocked (will fallback to archive):', {
            status: response.status,
            code: errorCode,
            details: errorDetails
          })
        } else {
          console.error('[useUniversalEntity] Delete error:', {
            status: response.status,
            code: errorCode,
            message: errorMessage,
            details: errorDetails
          })
        }

        // 🎯 ENTERPRISE ERROR HANDLING: Throw enhanced error with full context
        throw new EnhancedError(errorMessage, response.status, errorCode, errorDetails)
      }

      const result = await response.json()

      // Log delete result
      console.log('[useUniversalEntity] Delete completed:', {
        entity_id: result.entity_id,
        mode: result.mode,
        cascade_applied: result.cascade_applied,
        affected_relationships: result.affected_relationships,
        tombstone_id: result.tombstone_id
      })

      return result
    },
    onSuccess: result => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
      queryClient.invalidateQueries({ queryKey: ['entities'] })
      console.log(
        `✅ Deleted ${entity_type} (${result.mode} mode, ${result.affected_relationships} relationships affected)`
      )
    },
    onError: (error: any) => {
      // 🎯 ENTERPRISE PATTERN: Don't log 409 conflicts as errors
      // These are expected and handled gracefully by calling code (archive fallback)
      const is409Conflict =
        error.status === 409 ||
        error.statusCode === 409 ||
        error.code === 'TRANSACTION_INTEGRITY_VIOLATION' ||
        error.code === 'FOREIGN_KEY_CONSTRAINT'

      if (is409Conflict) {
        console.log('[useUniversalEntity] Delete blocked by references (will fallback to archive)')
      } else {
        console.error('[useUniversalEntity] Delete failed:', error.message)
      }
    }
  })

  return {
    // Data - now properly flattened with dynamic fields merged
    entities: entities || [],
    pagination: null, // Not used in current implementation
    isLoading,
    error: (error as any)?.message,
    refetch,

    // Reads
    getById,

    // Mutations
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    archive: async (entity_id: string) => {
      // Archive by updating status to 'archived'
      const entity = entities?.find((e: any) => e.id === entity_id)
      if (!entity) throw new Error('Entity not found')

      return updateMutation.mutateAsync({
        entity_id,
        entity_name: entity.entity_name,
        status: 'archived'
      })
    },
    restore: async (entity_id: string) => {
      // Restore by updating status to 'active'
      const entity = entities?.find((e: any) => e.id === entity_id)
      if (!entity) throw new Error('Entity not found')

      return updateMutation.mutateAsync({
        entity_id,
        entity_name: entity.entity_name,
        status: 'active'
      })
    },

    // Direct helpers (optional external use)
    setDynamicFields: async (entity_id: string, values: Record<string, any>) => {
      const headers = await getAuthHeaders(organizationId)
      const items = toBatchItems(config.dynamicFields, values)
      if (!items.length) return
      await fetch('/api/v2/dynamic/batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          p_organization_id: organizationId,
          p_entity_id: entity_id,
          p_items: items
        })
      })
      queryClient.invalidateQueries({ queryKey })
    },

    link: async (entity_id: string, type: string, toIds: string[]) => {
      const headers = await getAuthHeaders(organizationId)
      const def = config.relationships?.find(r => r.type === type)
      if (!def) throw new Error(`Unknown relationship type: ${type}`)
      const rows = toIds.map(to => ({
        from_entity_id: entity_id,
        to_entity_id: to,
        relationship_type: def.type,
        smart_code: def.smart_code,
        relationship_direction: 'forward',
        is_active: true
      }))
      await fetch('/api/v2/relationships/upsert-batch', {
        method: 'POST',
        headers,
        body: JSON.stringify({ p_organization_id: organizationId, p_rows: rows })
      })
      queryClient.invalidateQueries({ queryKey })
    },

    // Loading states
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending
  }
}

/**
 * Example Usage:
 *
 * // Define your entity configuration
 * const products = useUniversalEntity({
 *   entity_type: 'PRODUCT',
 *   dynamicFields: [
 *     { name: 'price_market', type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1' },
 *     { name: 'price_cost', type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1' },
 *     { name: 'stock_quantity', type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1' }
 *   ],
 *   relationships: [
 *     { type: 'HAS_CATEGORY', smart_code: 'HERA.SALON.PRODUCT.REL.HAS_CATEGORY.v1', cardinality: 'one' },
 *     { type: 'HAS_BRAND', smart_code: 'HERA.SALON.PRODUCT.REL.HAS_BRAND.v1', cardinality: 'one' }
 *   ],
 *   filters: { include_dynamic: true }
 * })
 *
 * // Create a product with dynamic fields and relationships
 * await products.create({
 *   entity_type: 'PRODUCT',
 *   entity_name: 'Professional Hair Conditioner',
 *   smart_code: 'HERA.SALON.PRODUCT.ENTITY.ITEM.v1',
 *   dynamic_fields: {
 *     price_market: { value: 25, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.MARKET.v1' },
 *     price_cost: { value: 12, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.PRICE.COST.v1' },
 *     stock_quantity: { value: 50, type: 'number', smart_code: 'HERA.SALON.PRODUCT.DYN.STOCK.QTY.v1' }
 *   },
 *   metadata: {
 *     relationships: {
 *       HAS_CATEGORY: ['<HAIR_CARE_CATEGORY_ID>'],
 *       HAS_BRAND: ['<LOREAL_BRAND_ID>']
 *     }
 *   }
 * })
 *
 * // Update only changed fields
 * await products.update({
 *   entity_id: '<PRODUCT_ID>',
 *   dynamic_patch: { price_cost: 13.5, stock_quantity: 45 },
 *   relationships_patch: { HAS_CATEGORY: ['<NEW_CATEGORY_ID>'] }
 * })
 *
 * // Get full entity with merged dynamic fields and relationships
 * const fullProduct = await products.getById('<PRODUCT_ID>')
 * // Returns: {
 * //   entity: {...},
 * //   dynamic: { price_market: 25, price_cost: 13.5, stock_quantity: 45 },
 * //   relationships: [{ type: 'HAS_CATEGORY', to_entity: {...} }, ...]
 * // }
 *
 * // Use helper functions
 * await products.setDynamicFields('<PRODUCT_ID>', { stock_quantity: 100 })
 * await products.link('<PRODUCT_ID>', 'HAS_CATEGORY', ['<CATEGORY_ID_1>', '<CATEGORY_ID_2>'])
 */

/**
 * Hook for fetching a single entity by ID with dynamic fields and relationships
 * Useful for detail views where you want stable references
 */
export function useUniversalEntityDetail(
  entityId: string | null | undefined,
  config: UseUniversalEntityConfig
) {
  const { organization } = useHERAAuth()
  const organizationId = organization?.id
  const { entity_type, filters = {} } = config

  // Query for the single entity
  const {
    data: entityData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [
      'entity-detail',
      entity_type,
      entityId,
      organizationId,
      {
        include_dynamic: filters.include_dynamic !== false,
        include_relationships: !!filters.include_relationships
      }
    ],
    queryFn: async () => {
      if (!entityId) return null

      const headers = await getAuthHeaders(organizationId)

      // 1) Get the base entity
      const res = await fetch(`/api/v2/entities/${entityId}`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch entity')
      }
      const entityPayload = await res.json()
      const entity = entityPayload?.data || entityPayload

      // 2) Fetch dynamic fields
      let dynamicFields: Record<string, any> = {}
      if (filters.include_dynamic !== false) {
        const params = new URLSearchParams({
          p_organization_id: organizationId || '',
          p_entity_id: entityId,
          p_limit: '500'
        })
        const dynRes = await fetch(`/api/v2/dynamic/get?${params}`, { headers })
        const dynData = await dynRes.json()
        dynamicFields = mergeDynamic(Array.isArray(dynData?.data) ? dynData.data : [])
      }

      // 3) Fetch relationships if requested
      let relationships: Record<string, any[]> = {}
      if (filters.include_relationships && config.relationships?.length) {
        const relRes = await fetch('/api/v2/relationships/query', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            p_organization_id: organizationId,
            p_entity_id: entityId,
            p_side: 'either',
            p_relationship_type: null,
            p_active_only: true,
            p_limit: 200,
            p_offset: 0
          })
        })
        const relData = await relRes.json()
        const rels = Array.isArray(relData?.data) ? relData.data : []

        // Group relationships by type
        for (const rel of rels) {
          const type = rel.relationship_type
          if (!relationships[type]) relationships[type] = []
          relationships[type].push(rel)
        }
      }

      // Merge everything into a normalized entity
      return normalizeEntity({
        ...entity,
        dynamic_fields: dynamicFields,
        relationships
      })
    },
    enabled: !!entityId && !!organizationId,
    staleTime: 10_000,
    refetchOnWindowFocus: false
  })

  return {
    entity: entityData,
    isLoading,
    error: (error as any)?.message,
    refetch
  }
}
