const BASE_URL = process.env.NEXT_PUBLIC_PLAYBOOK_BASE_URL
const API_KEY = process.env.NEXT_PUBLIC_PLAYBOOK_API_KEY
const hasEnv = Boolean(BASE_URL && API_KEY)

// In-memory store for mock data persistence
const mockDataStore: {
  services: Map<string, any[]> // organizationId -> services array
} = {
  services: new Map()
}

function withParams(path: string, params: Record<string, any>) {
  const url = new URL(path, BASE_URL || 'http://mock.local/')
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) {
      url.searchParams.set(k, String(v))
    }
  })
  return url
}

// Mock data generator
function generateMockServices(count: number, organizationId: string) {
  const categories = ['Hair', 'Color', 'Treatment', 'Styling', 'Nail', 'Spa']
  const services = [
    { name: 'Classic Cut', duration: 30, price: 60 },
    { name: 'Premium Cut & Style', duration: 45, price: 120 },
    { name: 'Balayage', duration: 180, price: 350 },
    { name: 'Full Color', duration: 120, price: 200 },
    { name: 'Highlights', duration: 150, price: 280 },
    { name: 'Keratin Treatment', duration: 180, price: 450 },
    { name: 'Deep Conditioning', duration: 45, price: 80 },
    { name: 'Blowout', duration: 45, price: 75 },
    { name: 'Updo', duration: 60, price: 150 },
    { name: 'Makeup Application', duration: 45, price: 120 },
    { name: 'Manicure', duration: 30, price: 45 },
    { name: 'Pedicure', duration: 45, price: 65 },
    { name: 'Gel Polish', duration: 45, price: 60 },
    { name: 'Facial', duration: 60, price: 180 },
    { name: 'Massage', duration: 60, price: 200 },
    { name: 'Eyebrow Threading', duration: 15, price: 25 },
    { name: 'Beard Trim', duration: 20, price: 35 },
    { name: 'Hair Extensions', duration: 240, price: 800 }
  ]

  return services.slice(0, count).map((svc, i) => ({
    id: `SRV-${String(i + 1).padStart(3, '0')}`,
    organization_id: organizationId,
    smart_code: 'HERA.SALON.SERVICE.V1',
    name: svc.name,
    code: `SVC${String(i + 1).padStart(3, '0')}`,
    status: i % 10 === 0 ? 'archived' : 'active',
    price: svc.price, // Include the price from the service data
    duration_mins: svc.duration,
    category: categories[Math.floor(Math.random() * categories.length)],
    created_at: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
    metadata: {
      requires_equipment: Math.random() > 0.7,
      popular: Math.random() > 0.6
    }
  }))
}

export async function listServices(params: {
  organization_id: string
  branch_id?: string
  q?: string
  status?: 'active' | 'archived' | 'all'
  category_id?: string
  sort?: string
  limit?: number
  offset?: number
}) {
  if (!hasEnv) {
    console.error('❌ Playbook API environment variables not configured')
    console.error('Please set NEXT_PUBLIC_PLAYBOOK_BASE_URL and NEXT_PUBLIC_PLAYBOOK_API_KEY')
    throw new Error('Playbook API not configured for production use')
  }

  try {
    const url = withParams('/entities', {
      type: 'HERA.SALON.SERVICE.V1',
      organization_id: params.organization_id,
      branch_id: params.branch_id,
      q: params.q,
      status: params.status === 'all' ? undefined : params.status,
      category_id: params.category_id,
      sort: params.sort || 'updated_at:desc',
      limit: params.limit || 25,
      offset: params.offset || 0
    })

    console.log('📦 Services: GET', url.toString())
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })

    if (!res.ok) throw new Error(`Failed to list services: ${res.status}`)
    const data = await res.json()

    return {
      items: data.items || data.rows || [],
      total: data.total || data.count || 0
    }
  } catch (error) {
    console.error('Failed to list services:', error)
    throw error
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
  if (!hasEnv) {
    throw new Error('Playbook API not configured for production use')
  }

  try {
    const body = {
      ...payload,
      smart_code: 'HERA.SALON.SERVICE.V1',
      status: payload.status || 'active'
    }

    console.log('✏️ CreateService:', body)
    const res = await fetch(`${BASE_URL}/entities`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })

    if (!res.ok) throw new Error(`Failed to create service: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to create service:', error)
    throw error
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
  if (!hasEnv) {
    throw new Error('Playbook API not configured for production use')
  }

  try {
    console.log('✏️ UpdateService:', id, patch)
    const res = await fetch(`${BASE_URL}/entities/${id}`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(patch)
    })

    if (!res.ok) throw new Error(`Failed to update service: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to update service:', error)
    throw error
  }
}

export async function archiveService(id: string, archived = true) {
  return updateService(id, { status: archived ? 'archived' : 'active' })
}

export async function upsertDynamicData(entity_id: string, smart_code: string, data: any) {
  if (!hasEnv) {
    throw new Error('Playbook API not configured for production use')
  }

  try {
    console.log('✏️ UpsertDynamicData:', { entity_id, smart_code, data })
    const res = await fetch(`${BASE_URL}/dynamic_data/upsert`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_id,
        smart_code,
        data
      })
    })

    if (!res.ok) throw new Error(`Failed to upsert dynamic data: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to upsert dynamic data:', error)
    throw error
  }
}

export async function getDynamicData(entity_ids: string[], smart_code: string) {
  if (!hasEnv) {
    throw new Error('Playbook API not configured for production use')
  }

  try {
    console.log('📦 GetDynamicData:', { entity_ids, smart_code })
    const res = await fetch(`${BASE_URL}/dynamic_data/query`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        entity_ids,
        smart_code
      })
    })

    if (!res.ok) throw new Error(`Failed to get dynamic data: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to get dynamic data:', error)
    throw error
  }
}
