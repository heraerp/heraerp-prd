'use client'

import { useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query'
import { useHERAAuth } from '@/components/auth/HERAAuthProvider'
import { supabase } from '@/lib/supabase/client'

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

// Helper to get authentication headers
async function getAuthHeaders(): Promise<Record<string, string>> {
  // For the entity config demo, always use the demo token
  // This ensures we have the correct organization_id and permissions
  console.log('🚀 Using demo token for entity config demo')
  return {
    'Content-Type': 'application/json',
    Authorization: 'Bearer demo-token-salon-receptionist'
  }
}

/**
 * Universal hook for ANY entity type
 * Works with products, services, customers, vendors, employees, etc.
 * Now with dynamic fields and relationship management!
 */
// Config type for the hook
export interface UseUniversalEntityConfig {
  entity_type: string
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
  const organizationId = organization?.id
  const { entity_type, filters = {} } = config

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

  // Fetch entities
  const {
    data: apiRaw,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams({
        entity_type,
        limit: String(filters.limit ?? 100),
        offset: String(filters.offset ?? 0),
        include_dynamic: String(filters.include_dynamic !== false),
        include_relationships: String(!!filters.include_relationships)
      })
      if (filters.status) params.set('status', filters.status)
      if (filters.priority) params.set('priority', filters.priority)
      if (filters.q) params.set('q', filters.q)

      const headers = await getAuthHeaders()
      const res = await fetch(`/api/v2/entities?${params}`, { headers })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.error || 'Failed to fetch entities')
      }
      return res.json()
    },
    // Important bits to avoid UI thrash:
    staleTime: 10_000,
    refetchOnWindowFocus: false,
    placeholderData: keepPreviousData,
    select: (payload: any) => {
      const rawArr: any[] = Array.isArray(payload?.data) ? payload.data : []
      // 1) Normalize shapes
      const normalized = rawArr.map(normalizeEntity)
      // 2) Reuse previous refs for unchanged items
      const shared = shareWithPrevious(lastStableRef.current, normalized)
      // 3) Update the ref and freeze to catch accidental mutations
      lastStableRef.current = shared
      return {
        data: process.env.NODE_ENV === 'development' ? Object.freeze(shared) : shared,
        pagination: payload?.pagination ?? null
      }
    }
  })

  // Create entity mutation with dynamic fields and relationships
  const createMutation = useMutation({
    mutationFn: async (entity: UniversalEntity) => {
      const headers = await getAuthHeaders()

      // 1) Create entity
      const r = await fetch('/api/v2/entities', {
        method: 'POST',
        headers,
        body: JSON.stringify(entity)
      })
      if (!r.ok) throw new Error((await r.json())?.error || 'Create entity failed')
      const created = await r.json() // {data:{id:...}} or {id:...}
      const entity_id = created?.data?.id ?? created?.id

      // 2) Dynamic fields batch (if provided)
      const inline = entity.dynamic_fields ?? {}
      const batchItems = toBatchItems(
        config.dynamicFields,
        Object.fromEntries(Object.entries(inline).map(([k, v]: any) => [k, v.value]))
      )
      if (batchItems.length) {
        await fetch('/api/v2/dynamic/batch', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            p_organization_id: organizationId,
            p_entity_id: entity_id,
            p_items: batchItems
          })
        })
      }

      // 3) Relationships (optional)
      // Expect caller to pass metadata.relationships = { TYPE: [toId, ...] }
      const relPayload = (entity as any)?.metadata?.relationships
      if (relPayload && config.relationships?.length) {
        const rows: any[] = []
        for (const def of config.relationships) {
          const toIds: string[] = relPayload[def.type] ?? []
          for (const to of toIds) {
            rows.push({
              from_entity_id: entity_id,
              to_entity_id: to,
              relationship_type: def.type,
              smart_code: def.smart_code,
              relationship_direction: 'forward',
              is_active: true
            })
          }
        }
        if (rows.length) {
          await fetch('/api/v2/relationships/upsert-batch', {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_organization_id: organizationId, p_rows: rows })
          })
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
      const headers = await getAuthHeaders()

      // 1) Patch entity
      const r = await fetch('/api/v2/entities', {
        method: 'PUT',
        headers,
        body: JSON.stringify({ entity_id, ...updates })
      })
      if (!r.ok) throw new Error((await r.json())?.error || 'Update entity failed')

      // 2) Dynamic fields batch (only changed fields)
      if (dynamic_patch && config.dynamicFields?.length) {
        const items = toBatchItems(config.dynamicFields, dynamic_patch)
        if (items.length) {
          await fetch('/api/v2/dynamic/batch', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              p_organization_id: organizationId,
              p_entity_id: entity_id,
              p_items: items
            })
          })
        }
      }

      // 3) Relationships upsert (idempotent)
      if (relationships_patch && config.relationships?.length) {
        const rows: any[] = []
        for (const def of config.relationships) {
          const toIds = relationships_patch[def.type]
          if (!toIds) continue
          for (const to of toIds) {
            rows.push({
              from_entity_id: entity_id,
              to_entity_id: to,
              relationship_type: def.type,
              smart_code: def.smart_code,
              relationship_direction: 'forward',
              is_active: true
            })
          }
        }
        if (rows.length) {
          await fetch('/api/v2/relationships/upsert-batch', {
            method: 'POST',
            headers,
            body: JSON.stringify({ p_organization_id: organizationId, p_rows: rows })
          })
        }
      }

      return { id: entity_id }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
    }
  })

  // Get entity by ID with dynamic fields and relationships
  const getById = async (entity_id: string) => {
    const headers = await getAuthHeaders()

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

  // Delete entity mutation
  const deleteMutation = useMutation({
    mutationFn: async ({
      entity_id,
      hard_delete = false
    }: {
      entity_id: string
      hard_delete?: boolean
    }) => {
      const params = new URLSearchParams({
        hard_delete: hard_delete.toString()
      })

      const headers = await getAuthHeaders()
      const response = await fetch(`/api/v2/entities/${entity_id}?${params}`, {
        method: 'DELETE',
        headers
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete entity')
      }

      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['entities', entity_type] })
    }
  })

  return {
    // Data
    entities: apiRaw?.data || [],
    pagination: apiRaw?.pagination,
    isLoading,
    error: (error as any)?.message,
    refetch,

    // Reads
    getById,

    // Mutations
    create: createMutation.mutateAsync,
    update: updateMutation.mutateAsync,
    delete: deleteMutation.mutateAsync,
    archive: (entity_id: string) => deleteMutation.mutateAsync({ entity_id, hard_delete: false }),

    // Direct helpers (optional external use)
    setDynamicFields: async (entity_id: string, values: Record<string, any>) => {
      const headers = await getAuthHeaders()
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
      const headers = await getAuthHeaders()
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

      const headers = await getAuthHeaders()

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
