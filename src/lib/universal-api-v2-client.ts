// Universal API v2 Client - RPC-first architecture with Smart Code Engine
// All calls go through Next routes that already invoke SmartCodeEngine/guardrails.

/**
 * Get the base URL for API calls
 * - In browser: uses window.location.origin (works on any port)
 * - In Node.js/SSR: uses NEXT_PUBLIC_APP_URL or defaults to localhost:3000
 */
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    // Browser: use current origin (works on 3000, 3001, 3002, etc.)
    return window.location.origin
  }
  // Server-side: use env variable or default
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
}

/**
 * Get auth headers with Supabase token
 */
async function getAuthHeaders(): Promise<HeadersInit> {
  // Only in browser
  if (typeof window === 'undefined') return {}

  try {
    // Dynamically import supabase to avoid SSR issues
    const { supabase } = await import('@/lib/supabase/client')
    const {
      data: { session }
    } = await supabase.auth.getSession()

    if (session?.access_token) {
      return {
        Authorization: `Bearer ${session.access_token}`
      }
    } else {
      console.warn('[getAuthHeaders] No access token found in session')
    }
  } catch (error) {
    console.warn('[getAuthHeaders] Failed to get auth token:', error)
  }

  return {}
}

export type Json = Record<string, any>

// Dynamic field input types for batch operations (flexible version)
export type DynamicFieldInput =
  | { field_name: string; field_type: 'number'; field_value_number: number | null }
  | { field_name: string; field_type: 'text'; field_value: string | null }
  | { field_name: string; field_type: 'boolean'; field_value_boolean: boolean | null }
  | { field_name: string; field_type: 'json'; field_value_json: Json | null }

function ok(res: Response) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res
}

const h = (orgId: string): HeadersInit => ({ 'x-hera-org': orgId })

export async function getEntities(
  baseUrl: string = '',
  params: {
    p_organization_id: string
    p_entity_type?: string
    p_smart_code?: string
    p_parent_entity_id?: string
    p_status?: string | null
    p_include_relationships?: boolean
    p_include_dynamic?: boolean
  }
) {
  const url = baseUrl || getBaseUrl()
  const qs = new URLSearchParams({
    p_organization_id: params.p_organization_id
  })
  if (params.p_entity_type) qs.set('p_entity_type', params.p_entity_type)
  if (params.p_smart_code) qs.set('p_smart_code', params.p_smart_code)
  if (params.p_parent_entity_id) qs.set('p_parent_entity_id', params.p_parent_entity_id)
  // Explicitly handle status: undefined means not provided (use default), null or '' means show all
  if (params.p_status !== undefined) {
    qs.set('p_status', params.p_status || '')
  }
  // Include relationships and dynamic data flags
  if (params.p_include_relationships !== undefined) {
    qs.set('p_include_relationships', params.p_include_relationships.toString())
  }
  if (params.p_include_dynamic !== undefined) {
    qs.set('p_include_dynamic', params.p_include_dynamic.toString())
  }

  const authHeaders = await getAuthHeaders()
  const res = await fetch(`${url}/api/v2/entities?${qs.toString()}`, {
    headers: { ...h(params.p_organization_id), ...authHeaders },
    credentials: 'include'
  }).then(ok)

  // Your entities route returns either array or {data:[]}; support both.
  const body = await res.json()
  return Array.isArray(body) ? body : (body.data ?? [])
}

export async function readEntity(orgId: string, entityId: string) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`/api/v2/entities/${entityId}?p_organization_id=${orgId}`, {
    headers: { ...h(orgId), ...authHeaders },
    credentials: 'include'
  }).then(ok)
  return await res.json()
}

export async function deleteEntity(
  baseUrl: string = '',
  params: {
    p_organization_id: string
    p_entity_id: string
    hard_delete?: boolean
    cascade?: boolean
    reason?: string
    smart_code?: string
  }
) {
  const url = baseUrl || getBaseUrl()
  const authHeaders = await getAuthHeaders()

  // Build query params with RPC contract defaults
  const queryParams = new URLSearchParams({
    hard_delete: (params.hard_delete ?? false).toString(),
    cascade: (params.cascade ?? true).toString(),
    smart_code: params.smart_code ?? 'HERA.CORE.ENTITY.DELETE.V1'
  })

  if (params.reason) {
    queryParams.append('reason', params.reason)
  }

  console.log('[deleteEntity] Request:', {
    url: `${url}/api/v2/entities/${params.p_entity_id}`,
    organizationId: params.p_organization_id,
    entityId: params.p_entity_id,
    mode: params.hard_delete ? 'HARD' : 'SOFT',
    cascade: params.cascade ?? true
  })

  const res = await fetch(`${url}/api/v2/entities/${params.p_entity_id}?${queryParams}`, {
    method: 'DELETE',
    headers: {
      'x-hera-org': params.p_organization_id,
      ...authHeaders
    },
    credentials: 'include'
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    console.error('[deleteEntity] Error Response:', {
      status: res.status,
      statusText: res.statusText,
      error: err,
      fullError: JSON.stringify(err, null, 2)
    })
    throw new Error(`entity delete failed: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

export async function upsertEntity(
  baseUrl: string = '',
  body: {
    p_organization_id: string
    p_entity_type: string
    p_entity_name: string
    p_smart_code: string
    p_entity_code?: string | null
    p_entity_description?: string | null
    p_parent_entity_id?: string | null
    p_entity_id?: string | null // when updating
    p_status?: string | null
  }
) {
  const url = baseUrl || getBaseUrl()
  const authHeaders = await getAuthHeaders()

  // Transform RPC-style parameters (p_*) to API v2 format (without p_ prefix)
  const apiBody: any = {
    entity_type: body.p_entity_type,
    entity_name: body.p_entity_name,
    smart_code: body.p_smart_code
  }

  if (body.p_entity_code) apiBody.entity_code = body.p_entity_code
  if (body.p_entity_description) apiBody.entity_description = body.p_entity_description
  if (body.p_entity_id) apiBody.entity_id = body.p_entity_id
  if (body.p_parent_entity_id) apiBody.parent_entity_id = body.p_parent_entity_id
  if (body.p_status) apiBody.status = body.p_status

  // Use PUT for updates, POST for creates
  const method = body.p_entity_id ? 'PUT' : 'POST'

  const res = await fetch(`${url}/api/v2/entities`, {
    method: method,
    headers: {
      'content-type': 'application/json',
      'x-hera-org': body.p_organization_id,
      ...authHeaders
    },
    credentials: 'include',
    body: JSON.stringify(apiBody)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(`entity upsert failed: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json() // expect { success, data: { id, ... } }
}

// Dynamic data operations
export async function getDynamicData(
  baseUrl: string = '',
  params: {
    p_organization_id: string
    p_entity_id: string
    p_field_name?: string // optional filter
  }
) {
  const url = baseUrl || getBaseUrl()
  const authHeaders = await getAuthHeaders()
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
  ).toString()

  const res = await fetch(`${url}/api/v2/dynamic-data?${qs}`, {
    headers: {
      'x-hera-org': params.p_organization_id,
      ...authHeaders
    },
    credentials: 'include'
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(`dynamic-data get failed: ${res.status} ${JSON.stringify(err)}`)
  }
  const payload = await res.json()
  return payload.data ?? []
}

export async function setDynamicData(
  orgId: string,
  body: {
    p_entity_id: string
    p_field_name: string
    p_field_value_text?: string | null
    p_field_value_number?: number | null
    p_field_value_boolean?: boolean | null
    p_field_value_json?: Json | null
    p_smart_code: string
  }
) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`/api/v2/dynamic-data`, {
    method: 'POST',
    headers: {
      ...h(orgId),
      'Content-Type': 'application/json',
      ...authHeaders
    },
    credentials: 'include',
    body: JSON.stringify({ p_organization_id: orgId, ...body })
  }).then(ok)
  return await res.json()
}

export async function setDynamicDataBatch(
  baseUrl: string = '',
  params: {
    p_organization_id: string
    p_entity_id: string
    p_smart_code: string // e.g., 'HERA.SALON.PROD.DYN.v1'
    p_fields: DynamicFieldInput[]
  }
) {
  const url = baseUrl || getBaseUrl()
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`${url}/api/v2/dynamic-data/batch`, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-hera-org': params.p_organization_id,
      ...authHeaders
    },
    credentials: 'include',
    body: JSON.stringify(params)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(`dynamic-data batch set failed: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

// Transaction operations
export async function getTransactions(params: {
  orgId: string
  transactionType?: string
  smartCode?: string
  fromEntityId?: string
  toEntityId?: string
  startDate?: string
  endDate?: string
}) {
  const qs = new URLSearchParams({
    p_organization_id: params.orgId
  })
  if (params.transactionType) qs.set('p_transaction_type', params.transactionType)
  if (params.smartCode) qs.set('p_smart_code', params.smartCode)
  if (params.fromEntityId) qs.set('p_from_entity_id', params.fromEntityId)
  if (params.toEntityId) qs.set('p_to_entity_id', params.toEntityId)
  if (params.startDate) qs.set('p_start_date', params.startDate)
  if (params.endDate) qs.set('p_end_date', params.endDate)

  const authHeaders = await getAuthHeaders()
  const res = await fetch(`/api/v2/transactions?${qs.toString()}`, {
    headers: { ...h(params.orgId), ...authHeaders },
    credentials: 'include'
  }).then(ok)

  const body = await res.json()

  // Support multiple response formats:
  // 1. Direct array: [...]
  // 2. { data: [...] }
  // 3. { transactions: [...] } (from txn-query endpoint)
  return Array.isArray(body) ? body : (body.transactions ?? body.data ?? [])
}

export async function createTransaction(
  orgId: string,
  body: {
    p_transaction_type: string
    p_smart_code: string
    p_total_amount?: number
    p_from_entity_id?: string | null
    p_to_entity_id?: string | null
    p_reference_entity_id?: string | null
    p_transaction_date?: string
    p_metadata?: Json
    p_lines?: Array<{
      line_type: string
      entity_id?: string | null
      quantity?: number | null
      unit_amount?: number | null
      line_amount?: number | null
      description?: string | null
      smart_code?: string
      metadata?: Json
      discount_amount?: number
      tax_amount?: number
      line_number?: number
    }>
  }
) {
  const authHeaders = await getAuthHeaders()

  // Map parameters to what the API expects
  const apiBody = {
    organization_id: orgId,
    transaction_type: body.p_transaction_type,
    smart_code: body.p_smart_code,
    transaction_date: body.p_transaction_date || new Date().toISOString(),
    source_entity_id: body.p_from_entity_id || null,
    target_entity_id: body.p_to_entity_id || null,
    total_amount: body.p_total_amount || 0, // ✅ FIX: Include total_amount
    business_context: body.p_metadata || {},
    metadata: body.p_metadata || {}, // ✅ CRITICAL FIX: txn-emit needs both business_context AND metadata
    // Use provided lines or add placeholder for appointments if no lines provided
    lines:
      body.p_lines && body.p_lines.length > 0
        ? body.p_lines
        : body.p_transaction_type === 'APPOINTMENT'
          ? [
              {
                line_type: 'service',
                quantity: 1,
                unit_amount: 0,
                line_amount: 0,
                description: 'Appointment placeholder - services to be added'
              }
            ]
          : []
  }

  const res = await fetch(`/api/v2/transactions`, {
    method: 'POST',
    headers: { ...h(orgId), ...authHeaders, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(apiBody)
  }).then(ok)

  const result = await res.json()

  // Return in consistent format: { data: transaction_id }
  return {
    data: result.transaction_id || result.data
  }
}

// Update transaction (for appointments and other transaction updates)
export async function updateTransaction(
  transactionId: string,
  orgId: string,
  body: {
    p_transaction_date?: string
    p_source_entity_id?: string
    p_target_entity_id?: string | null
    p_total_amount?: number
    p_status?: string
    p_metadata?: Json
    p_smart_code?: string
  }
) {
  const authHeaders = await getAuthHeaders()

  const apiBody: any = {
    p_organization_id: orgId
  }

  // Only include fields that are provided
  if (body.p_transaction_date !== undefined) apiBody.p_transaction_date = body.p_transaction_date
  if (body.p_source_entity_id !== undefined) apiBody.p_source_entity_id = body.p_source_entity_id
  if (body.p_target_entity_id !== undefined) apiBody.p_target_entity_id = body.p_target_entity_id
  if (body.p_total_amount !== undefined) apiBody.p_total_amount = body.p_total_amount
  if (body.p_status !== undefined) apiBody.p_status = body.p_status
  if (body.p_metadata !== undefined) apiBody.p_metadata = body.p_metadata
  if (body.p_smart_code !== undefined) apiBody.p_smart_code = body.p_smart_code

  const res = await fetch(`/api/v2/transactions/${transactionId}`, {
    method: 'PUT',
    headers: {
      ...h(orgId),
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-hera-api-version': 'v2'
    },
    credentials: 'include',
    body: JSON.stringify(apiBody)
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Update failed' }))
    console.error('[updateTransaction] Error response:', error)
    throw new Error(error.error || 'Failed to update transaction')
  }

  const result = await res.json()
  return result
}

// Delete transaction (for appointments and other transaction deletions)
export async function deleteTransaction(
  transactionId: string,
  orgId: string,
  options?: {
    force?: boolean
  }
) {
  const authHeaders = await getAuthHeaders()

  const queryParams = new URLSearchParams()
  if (options?.force) {
    queryParams.append('force', 'true')
  }

  const res = await fetch(`/api/v2/transactions/${transactionId}?${queryParams}`, {
    method: 'DELETE',
    headers: {
      ...h(orgId),
      ...authHeaders,
      'Content-Type': 'application/json',
      'x-hera-api-version': 'v2'
    },
    credentials: 'include'
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Delete failed' }))
    throw new Error(error.error || 'Failed to delete transaction')
  }

  return res.json()
}

// Relationship operations
export async function getRelationships(params: {
  orgId: string
  fromEntityId?: string
  toEntityId?: string
  relationshipType?: string
}) {
  const qs = new URLSearchParams({
    p_organization_id: params.orgId
  })
  if (params.fromEntityId) qs.set('p_from_entity_id', params.fromEntityId)
  if (params.toEntityId) qs.set('p_to_entity_id', params.toEntityId)
  if (params.relationshipType) qs.set('p_relationship_type', params.relationshipType)

  const authHeaders = await getAuthHeaders()
  const res = await fetch(`/api/v2/relationships?${qs.toString()}`, {
    headers: { ...h(params.orgId), ...authHeaders },
    credentials: 'include'
  }).then(ok)

  const body = await res.json()
  return Array.isArray(body) ? body : (body.data ?? [])
}

export async function createRelationship(
  orgId: string,
  body: {
    p_from_entity_id: string
    p_to_entity_id: string
    p_relationship_type: string
    p_smart_code: string
    p_relationship_data?: Json
  }
) {
  const authHeaders = await getAuthHeaders()
  const res = await fetch(`/api/v2/relationships`, {
    method: 'POST',
    headers: { ...h(orgId), ...authHeaders, 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ p_organization_id: orgId, ...body })
  }).then(ok)
  return await res.json()
}
