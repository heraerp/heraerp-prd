import { heraCode } from '@/lib/smart-codes'
import { pb, extractList, getDD, withBranch, pbLog } from './client'

export async function listProducts(params: {
  organization_id: string
  branch_id?: string | 'ALL'
  q?: string
  status?: 'active' | 'archived' | 'all'
  category_id?: string
  brand_id?: string
  sort?: string
  limit?: number
  offset?: number
}) {
  try {
    const query = withBranch(
      {
        type: 'HERA.SALON.PRODUCT.V1',
        organization_id: params.organization_id,
        q: params.q,
        sort: params.sort || 'updated_at:desc',
        limit: params.limit ?? 25,
        offset: params.offset ?? 0,
        ...(params.status && params.status !== 'all' ? { status: params.status } : {}),
        ...(params.category_id ? { category_id: params.category_id } : {}),
        ...(params.brand_id ? { brand_id: params.brand_id } : {}),
      },
      params.branch_id
    )

    pbLog('listProducts request:', query)

    const json = await pb('/entities', { query })
    const result = extractList(json)

    pbLog('listProducts success:', {
      count: result.items.length,
      total: result.total,
    })

    return { ok: true, data: result } as const
  } catch (error) {
    pbLog('listProducts error:', error)
    return {
      ok: false,
      data: { items: [], total: 0 },
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function createProduct(payload: {
  organization_id: string
  name: string
  code?: string
  status?: 'active' | 'archived'
  metadata?: any
}) {
  try {
    const body = {
      ...payload,
      smart_code: heraCode('HERA.SALON.PRODUCT.V1'),
      status: payload.status || 'active',
    }

    pbLog('createProduct request:', body)

    const json = await pb('/entities', {
      method: 'POST',
      body,
    })

    pbLog('createProduct success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('createProduct error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function updateProduct(
  id: string,
  patch: Partial<{
    name: string
    code: string
    status: 'active' | 'archived'
    metadata: any
  }>
) {
  try {
    pbLog('updateProduct request:', { id, patch })

    const json = await pb(`/entities/${id}`, {
      method: 'PATCH',
      body: patch,
    })

    pbLog('updateProduct success:', json)

    return { ok: true, data: json } as const
  } catch (error) {
    pbLog('updateProduct error:', error)
    return {
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    } as const
  }
}

export async function archiveProduct(id: string, archived = true) {
  return updateProduct(id, { status: archived ? 'archived' : 'active' })
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