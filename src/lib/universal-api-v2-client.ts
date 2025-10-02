// Universal API v2 Client - RPC-first architecture with Smart Code Engine
// All calls go through Next routes that already invoke SmartCodeEngine/guardrails.
export type Json = Record<string, any>

// Dynamic field input types for batch operations
export type DynamicFieldInput =
  | { field_name: 'price'; field_type: 'number'; field_value_number: number | null }
  | { field_name: 'currency'; field_type: 'text'; field_value: string | null }
  | { field_name: 'qty_on_hand'; field_type: 'number'; field_value_number: number }
  | { field_name: 'category'; field_type: 'text'; field_value: string | null }
  | { field_name: 'requires_inventory'; field_type: 'boolean'; field_value_boolean: boolean }
  | { field_name: 'description'; field_type: 'text'; field_value: string | null }

function ok(res: Response) {
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res
}

const h = (orgId: string): HeadersInit => ({ 'x-hera-org': orgId })

export async function getEntities(
  baseUrl: string,
  params: {
    p_organization_id: string
    p_entity_type?: string
    p_smart_code?: string
    p_parent_entity_id?: string
    p_status?: string
  }
) {
  const qs = new URLSearchParams({
    p_organization_id: params.p_organization_id
  })
  if (params.p_entity_type) qs.set('p_entity_type', params.p_entity_type)
  if (params.p_smart_code) qs.set('p_smart_code', params.p_smart_code)
  if (params.p_parent_entity_id) qs.set('p_parent_entity_id', params.p_parent_entity_id)
  if (params.p_status) qs.set('p_status', params.p_status)

  const res = await fetch(`${baseUrl}/api/universal/entities?${qs.toString()}`, {
    headers: h(params.p_organization_id),
    credentials: 'include'
  }).then(ok)

  // Your entities route returns either array or {data:[]}; support both.
  const body = await res.json()
  return Array.isArray(body) ? body : (body.data ?? [])
}

export async function readEntity(orgId: string, entityId: string) {
  const res = await fetch(`/api/universal/entities/${entityId}?p_organization_id=${orgId}`, {
    headers: h(orgId),
    credentials: 'include'
  }).then(ok)
  return await res.json()
}

export async function deleteEntity(
  baseUrl: string,
  params: {
    p_organization_id: string
    p_entity_id: string
  }
) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
  ).toString()

  const res = await fetch(`${baseUrl}/api/universal/entities/${params.p_entity_id}?${qs}`, {
    method: 'DELETE',
    headers: h(params.p_organization_id),
    credentials: 'include'
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(`entity delete failed: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json()
}

export async function upsertEntity(
  baseUrl: string,
  body: {
    p_organization_id: string
    p_entity_type: string
    p_entity_name: string
    p_smart_code: string
    p_entity_code?: string | null
    p_entity_description?: string | null
    p_parent_entity_id?: string | null
    p_entity_id?: string | null // when updating
  }
) {
  const res = await fetch(`${baseUrl}/api/universal/entities`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hera-org': body.p_organization_id },
    credentials: 'include',
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.json().catch(() => null)
    throw new Error(`entity upsert failed: ${res.status} ${JSON.stringify(err)}`)
  }
  return res.json() // expect { success, data: { id, ... } }
}

// Dynamic data operations
export async function getDynamicData(
  baseUrl: string,
  params: {
    p_organization_id: string
    p_entity_id: string
    p_field_name?: string // optional filter
  }
) {
  const qs = new URLSearchParams(
    Object.fromEntries(
      Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
    )
  ).toString()

  const res = await fetch(`${baseUrl}/api/universal/dynamic-data?${qs}`, {
    headers: { 'x-hera-org': params.p_organization_id },
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
  const res = await fetch(`/api/universal/dynamic-data`, {
    method: 'POST',
    headers: { ...h(orgId), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ p_organization_id: orgId, ...body })
  }).then(ok)
  return await res.json()
}

export async function setDynamicDataBatch(
  baseUrl: string,
  params: {
    p_organization_id: string
    p_entity_id: string
    p_smart_code: string // e.g., 'HERA.SALON.PROD.DYN.V1'
    p_fields: DynamicFieldInput[]
  }
) {
  const res = await fetch(`${baseUrl}/api/universal/dynamic-data/batch`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-hera-org': params.p_organization_id },
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

  const res = await fetch(`/api/universal/transactions?${qs.toString()}`, {
    headers: h(params.orgId),
    credentials: 'include'
  }).then(ok)

  const body = await res.json()
  return Array.isArray(body) ? body : (body.data ?? [])
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
  }
) {
  const res = await fetch(`/api/universal/transactions`, {
    method: 'POST',
    headers: { ...h(orgId), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ p_organization_id: orgId, ...body })
  }).then(ok)
  return await res.json()
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

  const res = await fetch(`/api/universal/relationships?${qs.toString()}`, {
    headers: h(params.orgId),
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
  const res = await fetch(`/api/universal/relationships`, {
    method: 'POST',
    headers: { ...h(orgId), 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ p_organization_id: orgId, ...body })
  }).then(ok)
  return await res.json()
}
