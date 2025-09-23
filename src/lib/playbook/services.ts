import { heraCode } from '@/lib/smart-codes'
import { pb, extractList, getDD, withBranch, pbLog } from './client'

export async function listServices(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  q?: string
  status?: 'active' | 'archived' | 'all'
  category_id?: string
  sort?: string
  limit?: number
  offset?: number
}) {
  try {
    const query = withBranch(
      {
        type: 'service',  // entity_type filter
        organization_id: params.organization_id,
        q: params.q,
        sort: params.sort || 'updated_at:desc',
        limit: params.limit ?? 25,
        offset: params.offset ?? 0,
        ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
        ...(params.category_id ? { category_id: params.category_id } : {}),
      },
      params.branch_id
    )

    pbLog('listServices request:', query)

    const json = await pb('/entities', { query })
    const result = extractList(json)

    pbLog('listServices success:', {
      count: result.items.length,
      total: result.total,
    })

    return { ok: true, data: result } as const
  } catch (error) {
    pbLog('listServices error:', error)
    return {
      ok: false,
      data: { items: [], total: 0 },
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function createService(payload: {
  organization_id: string
  name: string
  code?: string
  status?: 'active' | 'archived'
  duration_mins?: number
  category?: string
  metadata?: any
}) {
  try {
    const body = {
      ...payload,
      smart_code: heraCode('HERA.SALON.SVC.CATALOG.STANDARD.v1'),
      entity_type: 'service', // Ensure entity_type is 'service' not 'svc'
      status: payload.status || 'active',
    }

    pbLog('createService request:', body)

    const json = await pb('/entities', {
      method: 'POST',
      body,
    })

    pbLog('createService success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('createService error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function updateService(
  id: string,
  patch: Partial<{
    name: string
    code: string
    status: 'active' | 'archived'
    duration_mins: number
    category: string
    metadata: any
  }>
) {
  try {
    pbLog('updateService request:', { id, patch })

    // Get organization ID from cookie
    const orgId = typeof document !== 'undefined' ? 
      document.cookie.split('; ').find(row => row.startsWith('hera-organization-id='))?.split('=')[1] : 
      undefined

    if (!orgId) {
      throw new Error('Organization ID is required')
    }

    // Build the entity update payload
    const entityPayload: any = {}
    if (patch.name !== undefined) entityPayload.name = patch.name
    if (patch.code !== undefined) entityPayload.code = patch.code
    if (patch.status !== undefined) entityPayload.status = patch.status
    if (patch.metadata !== undefined) entityPayload.metadata = patch.metadata

    const json = await pb(`/entities/${id}?organization_id=${orgId}`, {
      method: 'PATCH',
      body: entityPayload,
    })

    pbLog('updateService success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('updateService error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function archiveService(id: string, archived = true) {
  return updateService(id, { status: archived ? 'archived' : 'active' })
}

export async function deleteService(id: string) {
  try {
    pbLog('deleteService request:', { id })

    // Get organization ID from cookie
    const orgId = typeof document !== 'undefined' ? 
      document.cookie.split('; ').find(row => row.startsWith('hera-organization-id='))?.split('=')[1] : 
      undefined

    if (!orgId) {
      throw new Error('Organization ID is required')
    }

    const json = await pb(`/entities/${id}?organization_id=${orgId}`, {
      method: 'DELETE'
    })

    pbLog('deleteService success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('deleteService error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function upsertDynamicData(entity_id: string, smart_code: string, data: any) {
  try {
    const body = {
      entity_id,
      smart_code,
      data,
    }

    pbLog('upsertDynamicData request:', body)

    const json = await pb('/dynamic_data/upsert', {
      method: 'POST',
      body,
    })

    pbLog('upsertDynamicData success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('upsertDynamicData error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function getDynamicData(entity_ids: string[], smart_code: string, organization_id?: string) {
  try {
    pbLog('getDynamicData request:', { entity_ids: entity_ids.length, smart_code, organization_id })

    // Get organization ID from cookie if not provided
    const orgId = organization_id || (typeof document !== 'undefined' ? 
      document.cookie.split('; ').find(row => row.startsWith('hera-organization-id='))?.split('=')[1] : 
      undefined)

    if (!orgId) {
      throw new Error('Organization ID is required')
    }

    const data = await getDD(entity_ids, smart_code, orgId)

    pbLog('getDynamicData success:', {
      entities: Object.keys(data).length,
    })

    return { ok: true, data } as const
  } catch (error) {
    pbLog('getDynamicData error:', error)
    return { ok: false, data: {}, error: String(error) } as const
  }
}