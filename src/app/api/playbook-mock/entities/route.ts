import { NextRequest, NextResponse } from 'next/server'

// Mock services data for Hair Talkz salon
const MOCK_SERVICES = [
  {
    id: 'a8af0d9a-132f-484a-9363-682be34d0ef0',
    entity_type: 'service',
    entity_code: 'SVC-SALON-001',
    entity_name: 'Haircut & Style',
    smart_code: 'HERA.SALON.SERVICE.V1',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    metadata: {
      duration: 45,
      price: 65.00,
      category: 'Hair Services',
      description: 'Professional haircut with styling'
    },
    status: 'active',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-21T10:00:00Z'
  },
  {
    id: 'f93d396d-b829-4464-97b8-133773bda071',
    entity_type: 'service',
    entity_code: 'SVC-SALON-002',
    entity_name: 'Hair Color',
    smart_code: 'HERA.SALON.SERVICE.V1',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    metadata: {
      duration: 120,
      price: 125.00,
      category: 'Color Services',
      description: 'Full hair color service with professional products'
    },
    status: 'active',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-21T10:00:00Z'
  },
  {
    id: 'd55b3a26-e1a8-40f7-8706-fbee9e169a2f',
    entity_type: 'service',
    entity_code: 'SVC-SALON-003',
    entity_name: 'Highlights',
    smart_code: 'HERA.SALON.SERVICE.V1',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    metadata: {
      duration: 180,
      price: 175.00,
      category: 'Color Services',
      description: 'Professional highlighting service'
    },
    status: 'active',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-21T10:00:00Z'
  },
  {
    id: 'a27355f3-6d80-4b82-8f18-d66083a20d1e',
    entity_type: 'service',
    entity_code: 'SVC-SALON-004',
    entity_name: 'Blow Dry',
    smart_code: 'HERA.SALON.SERVICE.V1',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    metadata: {
      duration: 30,
      price: 45.00,
      category: 'Hair Services',
      description: 'Professional blow dry and styling'
    },
    status: 'active',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-21T10:00:00Z'
  },
  {
    id: 'b3c4d5e6-f7a8-4b9c-0d1e-2f3a4b5c6d7e',
    entity_type: 'service',  
    entity_code: 'SVC-SALON-005',
    entity_name: 'Balayage',
    smart_code: 'HERA.SALON.SERVICE.V1',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    metadata: {
      duration: 240,
      price: 250.00,
      category: 'Color Services',
      description: 'Hand-painted highlighting technique for natural look'
    },
    status: 'active',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-21T10:00:00Z'
  },
  {
    id: 'c4d5e6f7-a8b9-5c0d-1e2f-3a4b5c6d7e8f',
    entity_type: 'service',
    entity_code: 'SVC-SALON-006',
    entity_name: 'Deep Conditioning',
    smart_code: 'HERA.SALON.SERVICE.V1',
    organization_id: '0fd09e31-d257-4329-97eb-7d7f522ed6f0',
    metadata: {
      duration: 30,
      price: 50.00,
      category: 'Hair Treatments',
      description: 'Intensive moisture treatment for damaged hair'
    },
    status: 'active',
    created_at: '2025-09-21T10:00:00Z',
    updated_at: '2025-09-21T10:00:00Z'
  }
]

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  
  const organizationId = searchParams.get('organization_id')
  const type = searchParams.get('type')
  const status = searchParams.get('status') || 'active'
  const limit = parseInt(searchParams.get('limit') || '25')
  const offset = parseInt(searchParams.get('offset') || '0')
  
  // Filter services
  let filtered = MOCK_SERVICES
  
  if (organizationId) {
    filtered = filtered.filter(s => s.organization_id === organizationId)
  }
  
  if (type) {
    filtered = filtered.filter(s => s.smart_code === type)
  }
  
  if (status && status !== 'all') {
    filtered = filtered.filter(s => s.status === status)
  }
  
  // Apply pagination
  const total = filtered.length
  const items = filtered.slice(offset, offset + limit)
  
  return NextResponse.json({
    items,
    total,
    page: Math.floor(offset / limit) + 1,
    pageSize: limit,
    totalPages: Math.ceil(total / limit)
  })
}