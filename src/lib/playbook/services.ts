import { heraCode } from '@/lib/smart-codes'

// Use the server proxy instead of direct API calls
const PROXY = '/api/playbook'
const debug = !!process.env.NEXT_PUBLIC_DEBUG_PLAYBOOK

function buildUrl(path: string, query: Record<string, any> = {}) {
  const url = new URL(path, 'http://localhost') // base ignored by Next.js
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  })
  return url.pathname + url.search
}

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
    const query: any = {
      type: 'HERA.SALON.SERVICE.V1',
      organization_id: params.organization_id,
      q: params.q,
      sort: params.sort || 'updated_at:desc',
      limit: params.limit ?? 25,
      offset: params.offset ?? 0
    }

    // Only include branch_id if not "ALL"
    if (params.branch_id && params.branch_id !== 'ALL') {
      query.branch_id = params.branch_id
    }

    // Only include status if not "all"
    if (params.status && params.status !== 'all') {
      query.status = params.status
    }

    if (params.category_id) {
      query.category_id = params.category_id
    }

    const url = buildUrl(`${PROXY}/entities`, query)

    if (debug) {
      console.log('[Services] listServices request:', { url, query })
    }

    const res = await fetch(url, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) {
      const errorText = await res.text().catch(() => '')
      if (debug) {
        console.error('[Services] listServices failed:', res.status, errorText)
      }
      return {
        ok: false,
        data: { items: [], total: 0 },
        error: errorText || `Failed to list services: ${res.status}`
      } as const
    }

    const json = await res.json().catch(() => ({}))

    // Support different response shapes (items[], rows[], data[])
    const items = json.items ?? json.rows ?? json.data ?? []
    const total = json.total ?? json.count ?? items.length

    if (debug) {
      console.log('[Services] listServices success:', {
        count: items.length,
        total,
        hasItems: items.length > 0,
        firstItem: items[0]
      })
    }

    return {
      ok: true,
      data: { items, total }
    } as const
  } catch (error) {
    if (debug) {
      console.error('[Services] listServices error:', error)
    }
    return {
      ok: false,
      data: { items: [], total: 0 },
      error: String(error)
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
      smart_code: heraCode('HERA.SALON.SERVICE.V1'),
      status: payload.status || 'active'
    }

    if (debug) {
      console.log('[Services] createService request:', body)
    }

    const res = await fetch(`${PROXY}/entities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify(body)
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (debug) {
        console.error('[Services] createService failed:', res.status, json)
      }
      throw new Error(json.error || `Failed to create service: ${res.status}`)
    }

    if (debug) {
      console.log('[Services] createService success:', json)
    }

    return { ok: true, data: json } as const
  } catch (error) {
    if (debug) {
      console.error('[Services] createService error:', error)
    }
    return { ok: false, error: String(error) } as const
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
    if (debug) {
      console.log('[Services] updateService request:', { id, patch })
    }

    const res = await fetch(`${PROXY}/entities/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify(patch)
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (debug) {
        console.error('[Services] updateService failed:', res.status, json)
      }
      throw new Error(json.error || `Failed to update service: ${res.status}`)
    }

    if (debug) {
      console.log('[Services] updateService success:', json)
    }

    return { ok: true, data: json } as const
  } catch (error) {
    if (debug) {
      console.error('[Services] updateService error:', error)
    }
    return { ok: false, error: String(error) } as const
  }
}

export async function archiveService(id: string, archived = true) {
  return updateService(id, { status: archived ? 'archived' : 'active' })
}

export async function upsertDynamicData(entity_id: string, smart_code: string, data: any) {
  try {
    const body = {
      entity_id,
      smart_code,
      data
    }

    if (debug) {
      console.log('[Services] upsertDynamicData request:', body)
    }

    const res = await fetch(`${PROXY}/dynamic_data/upsert`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify(body)
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (debug) {
        console.error('[Services] upsertDynamicData failed:', res.status, json)
      }
      throw new Error(json.error || `Failed to upsert dynamic data: ${res.status}`)
    }

    if (debug) {
      console.log('[Services] upsertDynamicData success:', json)
    }

    return { ok: true, data: json } as const
  } catch (error) {
    if (debug) {
      console.error('[Services] upsertDynamicData error:', error)
    }
    return { ok: false, error: String(error) } as const
  }
}

export async function getDynamicData(entity_ids: string[], smart_code: string) {
  try {
    const body = {
      entity_ids,
      smart_code
    }

    if (debug) {
      console.log('[Services] getDynamicData request:', body)
    }

    const res = await fetch(`${PROXY}/dynamic_data/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      cache: 'no-store',
      body: JSON.stringify(body)
    })

    const json = await res.json().catch(() => ({}))

    if (!res.ok) {
      if (debug) {
        console.error('[Services] getDynamicData failed:', res.status, json)
      }
      throw new Error(json.error || `Failed to get dynamic data: ${res.status}`)
    }

    if (debug) {
      console.log('[Services] getDynamicData success:', json)
    }

    // Transform the response to expected format
    const result: Record<string, any> = {}
    if (json.data) {
      // Handle different response formats
      if (Array.isArray(json.data)) {
        json.data.forEach((item: any) => {
          if (item.entity_id && item.data) {
            result[item.entity_id] = item.data
          }
        })
      } else if (typeof json.data === 'object') {
        // Already in the expected format
        Object.assign(result, json.data)
      }
    }

    return { ok: true, data: result } as const
  } catch (error) {
    if (debug) {
      console.error('[Services] getDynamicData error:', error)
    }
    return { ok: false, data: {}, error: String(error) } as const
  }
}
