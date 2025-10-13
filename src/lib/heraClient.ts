// Typed HERA client targeting Universal API v2 + RPCs
// Note: This maps the requested contracts onto existing `/api/v2/universal/*` endpoints in this repo.
// All calls include `organization_id` and bearer auth via fetch init passed by callers/hooks.

export type HeraAuth = {
  accessToken: string
  organization_id: string
  roles: string[]
}

export type ListParams = {
  organization_id: string
  entity_type: string
  filters?: any
  search?: string
  sort?: any
  page?: number
  page_size?: number
}

export type UpsertEntityInput = {
  organization_id: string
  entity_type: string
  primary: any
  dynamic?: any
  relationships?: any[]
}

export type EmitTxnInput = {
  organization_id: string
  smart_code: string
  transaction_type: string
  header: any
  lines: any[]
}

type ReqInit = RequestInit & { headers?: Record<string, string> }

export class HeraClient {
  constructor(private auth: HeraAuth, private baseUrl = '/api/v2') {}

  private async req<T>(path: string, init: ReqInit): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.auth.accessToken}`,
        'x-hera-org': this.auth.organization_id,
        'x-hera-api-version': 'v2',
        ...(init.headers || {})
      },
      cache: 'no-store'
    })
    if (!res.ok) {
      const details = await res.text().catch(() => '')
      throw new Error(`HERA ${path} ${res.status}: ${details}`)
    }
    return res.json() as Promise<T>
  }

  // Entities
  // Map to universal query/upsert endpoints in this repo
  listEntities(p: ListParams) {
    const body: any = {
      organization_id: p.organization_id,
      filters: { entity_type: p.entity_type, ...(p.filters || {}) },
      search: p.search,
      order_by: p.sort,
      limit: p.page_size,
      offset: p.page && p.page_size ? (p.page - 1) * p.page_size : undefined
    }
    return this.req('/universal/entity-query', { method: 'POST', body: JSON.stringify(body) })
  }

  getEntity(p: { organization_id: string; entity_id: string }) {
    const q = new URLSearchParams({
      organization_id: p.organization_id,
      entity_id: p.entity_id
    })
    return this.req(`/universal/entity-read?${q}`, { method: 'GET' })
  }

  upsertEntity(p: UpsertEntityInput) {
    const { primary, dynamic, relationships } = p
    const payload: any = {
      organization_id: p.organization_id,
      entity_type: p.entity_type,
      // Flatten a few common primaries
      id: primary?.entity_id || primary?.id,
      entity_id: primary?.entity_id,
      entity_name: primary?.name || primary?.entity_name,
      entity_code: primary?.sku || primary?.code || primary?.entity_code,
      smart_code: primary?.smart_code || `HERA.${p.entity_type}.ENTITY.UPSERT.V1`,
      metadata: primary?.metadata || {},
      attributes: dynamic || {}
    }

    // Attach relationships if provided (server expects bulk semantics)
    if (Array.isArray(relationships) && relationships.length) {
      payload.relationships = relationships
    }

    return this.req('/universal/entity-upsert', { method: 'POST', body: JSON.stringify(payload) })
  }

  // Relationships
  upsertRelationship(p: {
    organization_id: string
    from_id: string
    to_id: string
    relation_type: string
    metadata?: any
  }) {
    const body = {
      organization_id: p.organization_id,
      from_entity_id: p.from_id,
      to_entity_id: p.to_id,
      relationship_type: p.relation_type,
      metadata: p.metadata || {}
    }
    return this.req('/universal/relationship-upsert', {
      method: 'POST',
      body: JSON.stringify(body)
    })
  }

  // Transactions
  emitTxn(p: EmitTxnInput) {
    const body = {
      organization_id: p.organization_id,
      smart_code: p.smart_code,
      transaction_type: p.transaction_type,
      header: p.header,
      lines: p.lines
    }
    return this.req('/universal/txn-emit', { method: 'POST', body: JSON.stringify(body) })
  }

  reverseTxn(p: { organization_id: string; transaction_id: string; reason?: string }) {
    const body = {
      organization_id: p.organization_id,
      transaction_id: p.transaction_id,
      reason: p.reason
    }
    return this.req('/universal/txn-reverse', { method: 'POST', body: JSON.stringify(body) })
  }

  getTxn(p: { organization_id: string; transaction_id: string }) {
    const q = new URLSearchParams({
      organization_id: p.organization_id,
      transaction_id: p.transaction_id
    })
    return this.req(`/universal/txn-read?${q}`, { method: 'GET' })
  }

  // Reports/Analytics
  ledgerReport(p: {
    organization_id: string
    report: 'TB' | 'PL' | 'BS'
    from: string
    to: string
    branch_id?: string
    dims?: any
  }) {
    const body = {
      organization_id: p.organization_id,
      report: p.report,
      from: p.from,
      to: p.to,
      branch_id: p.branch_id,
      dims: p.dims
    }
    return this.req('/universal/ledger-report', { method: 'POST', body: JSON.stringify(body) })
  }

  analyticsTiles(p: { organization_id: string; from: string; to: string; branch_id?: string }) {
    const body = {
      organization_id: p.organization_id,
      from: p.from,
      to: p.to,
      branch_id: p.branch_id
    }
    return this.req('/universal/analytics-tiles', { method: 'POST', body: JSON.stringify(body) })
  }
}

