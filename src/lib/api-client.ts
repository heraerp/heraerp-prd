import type { OrgId, EntityId, TransactionId, SmartCode } from '@/types/common'
import type { ApiResponse, ApiError, ListQueryParams, Paginated, RequestHeaders } from '@/types/api'
import type { PlaybookDef, PlaybookListItem, PlaybookStepDef } from '@/types/playbooks'
import type { RunHeader, RunListItem, StepExecUpdate, StepCompleteRequest } from '@/types/runs'
import type {
  ProgramKpis,
  ProgramFilters,
  PaginatedPrograms,
  ProgramDetail,
  CreateProgramRequest,
  CreateGrantRoundRequest,
  GrantRoundLite,
  ExportProgramsRequest
} from '@/types/crm-programs'
import type {
  GrantKpis,
  GrantFilters,
  PaginatedGrants,
  GrantApplicationDetail,
  CreateGrantRequest,
  ReviewGrantRequest,
  ExportGrantsRequest
} from '@/types/crm-grants'

// Organization ID management
let currentOrgId: OrgId | null = null
const orgChangeListeners: Array<(orgId: OrgId | null) => void> = []

export function getOrgId(): OrgId | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem('organizationId')
  return stored ? (stored as OrgId) : null
}

export function setOrgId(orgId: OrgId | null): void {
  if (typeof window === 'undefined') return
  currentOrgId = orgId
  if (orgId) {
    localStorage.setItem('organizationId', orgId)
  } else {
    localStorage.removeItem('organizationId')
  }
  // Notify listeners
  orgChangeListeners.forEach(callback => callback(orgId))
}

export function onOrgChange(callback: (orgId: OrgId | null) => void): () => void {
  orgChangeListeners.push(callback)
  return () => {
    const index = orgChangeListeners.indexOf(callback)
    if (index > -1) {
      orgChangeListeners.splice(index, 1)
    }
  }
}

// Initialize from localStorage
if (typeof window !== 'undefined') {
  currentOrgId = getOrgId()
}

// Base configuration
const API_BASE = '/api/v1'

// Helper to build headers
function buildHeaders(orgId?: OrgId): RequestHeaders {
  const headers: RequestHeaders = {
    'Content-Type': 'application/json'
  }

  const effectiveOrgId = orgId || currentOrgId
  if (effectiveOrgId) {
    headers['X-Organization-Id'] = effectiveOrgId
  }

  return headers
}

// Helper to handle responses
async function handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
  if (!response.ok) {
    const error: ApiError = await response.json().catch(() => ({
      type: 'network_error',
      title: 'Network Error',
      status: response.status,
      detail: response.statusText
    }))
    throw error
  }

  return response.json()
}

// Playbooks API
export const playbooks = {
  async list(params?: ListQueryParams & { orgId?: OrgId }): Promise<Paginated<PlaybookListItem>> {
    const { orgId, ...queryParams } = params || {}
    const query = new URLSearchParams()

    if (queryParams.filter) {
      Object.entries(queryParams.filter).forEach(([key, value]) => {
        query.append(`filter[${key}]`, String(value))
      })
    }

    if (queryParams.sort) {
      query.append('sort', queryParams.sort)
    }

    if (queryParams.limit) {
      query.append('limit', String(queryParams.limit))
    }

    if (queryParams.offset) {
      query.append('offset', String(queryParams.offset))
    }

    const response = await fetch(`${API_BASE}/playbooks?${query}`, {
      headers: buildHeaders(orgId)
    })

    return handleResponse<Paginated<PlaybookListItem>>(response)
  },

  async get(id: EntityId, orgId?: OrgId): Promise<PlaybookDef> {
    const response = await fetch(`${API_BASE}/playbooks/${id}`, {
      headers: buildHeaders(orgId)
    })

    const result = await handleResponse<PlaybookDef>(response)
    return result
  },

  async create(data: Partial<PlaybookDef> & { organization_id: OrgId }): Promise<PlaybookDef> {
    const response = await fetch(`${API_BASE}/playbooks`, {
      method: 'POST',
      headers: buildHeaders(data.organization_id),
      body: JSON.stringify(data)
    })

    const result = await handleResponse<PlaybookDef>(response)
    return result
  },

  async update(id: EntityId, data: Partial<PlaybookDef>, orgId?: OrgId): Promise<PlaybookDef> {
    const response = await fetch(`${API_BASE}/playbooks/${id}`, {
      method: 'PUT',
      headers: buildHeaders(orgId),
      body: JSON.stringify(data)
    })

    const result = await handleResponse<PlaybookDef>(response)
    return result
  },

  async delete(id: EntityId, orgId?: OrgId): Promise<void> {
    const response = await fetch(`${API_BASE}/playbooks/${id}`, {
      method: 'DELETE',
      headers: buildHeaders(orgId)
    })

    await handleResponse<void>(response)
  },

  async publish(id: EntityId, orgId?: OrgId): Promise<PlaybookDef> {
    const response = await fetch(`${API_BASE}/playbooks/${id}/publish`, {
      method: 'POST',
      headers: buildHeaders(orgId)
    })

    const result = await handleResponse<PlaybookDef>(response)
    return result
  }
}

// Runs API
export const runs = {
  async list(params?: ListQueryParams & { orgId?: OrgId }): Promise<Paginated<RunListItem>> {
    const { orgId, ...queryParams } = params || {}
    const query = new URLSearchParams()

    if (queryParams.filter) {
      Object.entries(queryParams.filter).forEach(([key, value]) => {
        query.append(`filter[${key}]`, String(value))
      })
    }

    if (queryParams.sort) {
      query.append('sort', queryParams.sort)
    }

    if (queryParams.limit) {
      query.append('limit', String(queryParams.limit))
    }

    if (queryParams.offset) {
      query.append('offset', String(queryParams.offset))
    }

    const response = await fetch(`${API_BASE}/runs?${query}`, {
      headers: buildHeaders(orgId)
    })

    return handleResponse<Paginated<RunListItem>>(response)
  },

  async get(id: TransactionId, orgId?: OrgId): Promise<RunHeader> {
    const response = await fetch(`${API_BASE}/runs/${id}`, {
      headers: buildHeaders(orgId)
    })

    const result = await handleResponse<RunHeader>(response)
    return result
  },

  async create(data: {
    playbook_id: EntityId
    idempotency_key?: string
    subject_entity_id?: EntityId
    metadata?: Record<string, unknown>
    organization_id: OrgId
  }): Promise<RunHeader> {
    const response = await fetch(`${API_BASE}/runs`, {
      method: 'POST',
      headers: buildHeaders(data.organization_id),
      body: JSON.stringify(data)
    })

    const result = await handleResponse<RunHeader>(response)
    return result
  },

  async cancel(id: TransactionId, reason?: string, orgId?: OrgId): Promise<RunHeader> {
    const response = await fetch(`${API_BASE}/runs/${id}/cancel`, {
      method: 'POST',
      headers: buildHeaders(orgId),
      body: JSON.stringify({ reason })
    })

    const result = await handleResponse<RunHeader>(response)
    return result
  },

  async updateStep(
    runId: TransactionId,
    sequence: number,
    update: StepExecUpdate,
    orgId?: OrgId
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/runs/${runId}/steps/${sequence}`, {
      method: 'PATCH',
      headers: buildHeaders(orgId),
      body: JSON.stringify(update)
    })

    await handleResponse<void>(response)
  },

  async completeStep(
    runId: TransactionId,
    sequence: number,
    data: StepCompleteRequest,
    orgId?: OrgId
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/runs/${runId}/steps/${sequence}/complete`, {
      method: 'POST',
      headers: buildHeaders(orgId),
      body: JSON.stringify(data)
    })

    await handleResponse<void>(response)
  }
}

// Transactions API
export const transactions = {
  async create(data: {
    transaction_type: string
    smart_code: SmartCode
    transaction_code: string
    organization_id: OrgId
    total_amount: number
    metadata?: Record<string, unknown>
    ai_insights?: string
  }): Promise<any> {
    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: buildHeaders(data.organization_id),
      body: JSON.stringify(data)
    })

    return handleResponse<any>(response)
  }
}

// Organizations API
export const orgApi = {
  async listOrganizations(params: {
    q?: string
    type?: string
    stage?: string
    rm?: string
    tag?: string
    limit?: number
    cursor?: string
    orgId?: OrgId
  }): Promise<Paginated<any>> {
    const { orgId, ...queryParams } = params
    const query = new URLSearchParams()

    query.append('entity_type', 'organization')
    if (queryParams.q) query.append('q', queryParams.q)
    if (queryParams.type) query.append('type', queryParams.type)
    if (queryParams.stage) query.append('stage', queryParams.stage)
    if (queryParams.rm) query.append('rm', queryParams.rm)
    if (queryParams.tag) query.append('tag', queryParams.tag)
    if (queryParams.limit) query.append('limit', String(queryParams.limit))
    if (queryParams.cursor) query.append('cursor', queryParams.cursor)

    const effectiveOrgId = orgId || currentOrgId

    const response = await fetch(`${API_BASE}/entities?${query}`, {
      headers: buildHeaders(effectiveOrgId)
    })

    const result = await handleResponse<any>(response)
    // Transform the response to match expected format
    return {
      items: result.data || [],
      total: result.count || 0,
      hasMore: false,
      nextCursor: null
    }
  },

  async getOrganization(id: string, orgId?: OrgId): Promise<any> {
    const response = await fetch(`${API_BASE}/entities/${id}`, {
      headers: buildHeaders(orgId || currentOrgId)
    })

    return handleResponse<any>(response)
  },

  async createOrganization(payload: any): Promise<any> {
    const body = {
      entity_type: payload.entity_type || 'organization',
      entity_name: payload.entity_name || payload.name,
      entity_code: payload.entity_code,
      smart_code: payload.smart_code || 'HERA.CRM.ORGS.ENTITY.ORGANIZATION.v1',
      status: payload.status || 'active',
      properties: payload.metadata || payload.data || {}
    }

    const response = await fetch(`${API_BASE}/entities`, {
      method: 'POST',
      headers: {
        ...buildHeaders(payload.organization_id || currentOrgId),
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(body)
    })

    const result = await handleResponse<any>(response)
    return result.data || result
  },

  async updateOrganization(id: string, patch: any, orgId?: OrgId): Promise<any> {
    const response = await fetch(`${API_BASE}/entities/${id}`, {
      method: 'PATCH',
      headers: {
        ...buildHeaders(orgId),
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(patch)
    })

    return handleResponse<any>(response)
  },

  async listContacts(orgEntityId: string, orgId?: OrgId): Promise<Paginated<any>> {
    const query = new URLSearchParams()
    query.append('entity_type', 'person')
    query.append('org_entity_id', orgEntityId)
    query.append('limit', '50')

    const response = await fetch(`${API_BASE}/entities?${query}`, {
      headers: buildHeaders(orgId || currentOrgId)
    })

    const result = await handleResponse<any>(response)
    return {
      items: result.data || [],
      total: result.count || 0,
      hasMore: false,
      nextCursor: null
    }
  },

  async createContact(payload: any): Promise<any> {
    const body = {
      entity_type: 'person',
      entity_name: payload.entity_name || payload.name,
      smart_code: payload.smart_code || 'HERA.CRM.CONTACTS.ENTITY.PERSON.v1',
      status: 'active',
      properties: payload.metadata || payload.data || {}
    }

    const response = await fetch(`${API_BASE}/entities`, {
      method: 'POST',
      headers: {
        ...buildHeaders(payload.organization_id || currentOrgId),
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(body)
    })

    const result = await handleResponse<any>(response)
    return result.data || result
  },

  async linkRelationship(rel: any, orgId?: OrgId): Promise<void> {
    const response = await fetch(`${API_BASE}/relationships`, {
      method: 'POST',
      headers: {
        ...buildHeaders(orgId),
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify(rel)
    })

    await handleResponse<void>(response)
  },

  async logActivity(orgId: string, entityId: string, activity: any): Promise<void> {
    const smartCode =
      activity.type === 'email'
        ? 'HERA.CRM.ACTIVITY.EMAIL.SENT.v1'
        : activity.type === 'call'
          ? 'HERA.CRM.ACTIVITY.CALL.LOG.v1'
          : activity.type === 'meeting'
            ? 'HERA.CRM.ACTIVITY.MEETING.HELD.v1'
            : 'HERA.CRM.ACTIVITY.NOTE.v1'

    const response = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: {
        ...buildHeaders(orgId as OrgId),
        'Idempotency-Key': crypto.randomUUID()
      },
      body: JSON.stringify({
        organization_id: orgId,
        subject_entity_id: entityId,
        transaction_type: 'activity',
        smart_code: smartCode,
        transaction_code: `ACT-${Date.now()}`,
        total_amount: 0,
        metadata: activity
      })
    })

    await handleResponse<void>(response)
  }
}

// CRM Grants API
const crmGrants = {
  async getKpis(): Promise<GrantKpis> {
    const response = await fetch(`${API_BASE}/crm/grants/kpis`, {
      headers: buildHeaders()
    })
    return handleResponse<GrantKpis>(response)
  },

  async list(filters: GrantFilters = {}): Promise<PaginatedGrants> {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status?.length) params.set('status', filters.status.join(','))
    if (filters.round_id) params.set('round_id', filters.round_id)
    if (filters.program_id) params.set('program_id', filters.program_id)
    if (filters.amount_min !== undefined) params.set('amount_min', filters.amount_min.toString())
    if (filters.amount_max !== undefined) params.set('amount_max', filters.amount_max.toString())
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    params.set('page', (filters.page || 1).toString())
    params.set('page_size', (filters.page_size || 20).toString())

    const response = await fetch(`${API_BASE}/crm/grants?${params}`, {
      headers: buildHeaders()
    })
    return handleResponse<PaginatedGrants>(response)
  },

  async get(applicationId: string): Promise<GrantApplicationDetail> {
    const response = await fetch(`${API_BASE}/crm/grants/${applicationId}`, {
      headers: buildHeaders()
    })
    return handleResponse<GrantApplicationDetail>(response)
  },

  async create(data: CreateGrantRequest): Promise<GrantApplicationDetail> {
    const response = await fetch(`${API_BASE}/crm/grants`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse<GrantApplicationDetail>(response)
  },

  async review(applicationId: string, data: ReviewGrantRequest): Promise<GrantApplicationDetail> {
    const response = await fetch(`${API_BASE}/crm/grants/${applicationId}/review`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse<GrantApplicationDetail>(response)
  },

  async export(data: ExportGrantsRequest): Promise<Blob | any> {
    const response = await fetch(`${API_BASE}/crm/grants/export`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    })

    const contentType = response.headers.get('content-type')
    if (data.format === 'csv' && contentType?.includes('text/csv')) {
      return response.blob()
    }
    return handleResponse<any>(response)
  }
}

// CRM Programs API
const crmPrograms = {
  async getKpis(): Promise<ProgramKpis> {
    const response = await fetch(`${API_BASE}/crm/programs/kpis`, {
      headers: buildHeaders()
    })
    return handleResponse<ProgramKpis>(response)
  },

  async list(filters: ProgramFilters = {}): Promise<PaginatedPrograms> {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.status?.length) params.set('status', filters.status.join(','))
    if (filters.tags?.length) params.set('tags', filters.tags.join(','))
    if (filters.sponsor_org_id) params.set('sponsor_org_id', filters.sponsor_org_id)
    if (filters.budget_min !== undefined) params.set('budget_min', filters.budget_min.toString())
    if (filters.budget_max !== undefined) params.set('budget_max', filters.budget_max.toString())
    params.set('page', (filters.page || 1).toString())
    params.set('page_size', (filters.page_size || 20).toString())

    const response = await fetch(`${API_BASE}/crm/programs?${params}`, {
      headers: buildHeaders()
    })
    return handleResponse<PaginatedPrograms>(response)
  },

  async get(id: string): Promise<ProgramDetail> {
    const response = await fetch(`${API_BASE}/crm/programs/${id}`, {
      headers: buildHeaders()
    })
    return handleResponse<ProgramDetail>(response)
  },

  async create(data: CreateProgramRequest): Promise<ProgramDetail> {
    const response = await fetch(`${API_BASE}/crm/programs`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse<ProgramDetail>(response)
  },

  async createGrantRound(
    programId: string,
    data: CreateGrantRoundRequest
  ): Promise<GrantRoundLite> {
    const response = await fetch(`${API_BASE}/crm/programs/${programId}/grant-rounds`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    })
    return handleResponse<GrantRoundLite>(response)
  },

  async export(data: ExportProgramsRequest): Promise<Blob | any> {
    const response = await fetch(`${API_BASE}/crm/programs/export`, {
      method: 'POST',
      headers: buildHeaders(),
      body: JSON.stringify(data)
    })

    const contentType = response.headers.get('content-type')
    if (data.format === 'csv' && contentType?.includes('text/csv')) {
      return response.blob()
    }
    return handleResponse<any>(response)
  }
}

// Export unified api object
export const api = {
  playbooks,
  runs,
  transactions,
  orgApi,
  crm: {
    programs: crmPrograms,
    grants: crmGrants
  },
  // Organization helpers
  getOrgId,
  setOrgId,
  onOrgChange
}
