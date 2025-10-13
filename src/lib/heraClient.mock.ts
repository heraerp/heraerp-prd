// Simple in-memory/localStorage mock for HeraClient API
// Toggle via NEXT_PUBLIC_HERA_MOCK=1

import type {
  HeraAuth,
  ListParams,
  UpsertEntityInput,
  EmitTxnInput
} from '@/lib/heraClient'

type Entity = any
type Transaction = any

const LS_KEY = 'hera_mock_entities'
const LS_TX_KEY = 'hera_mock_txns'

function getStore(): Record<string, Entity[]> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}')
  } catch {
    return {}
  }
}

function setStore(data: Record<string, Entity[]>) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_KEY, JSON.stringify(data))
}

function txStore(): Transaction[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LS_TX_KEY) || '[]')
  } catch {
    return []
  }
}

function setTxStore(data: Transaction[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(LS_TX_KEY, JSON.stringify(data))
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

export class HeraClientMock {
  constructor(private auth: HeraAuth) {}

  async listEntities(p: ListParams) {
    const store = getStore()
    const key = `${p.organization_id}:${p.entity_type}`
    const items = (store[key] || []).filter(e => {
      if (p.search) {
        const q = p.search.toLowerCase()
        return (
          String(e.entity_name || '').toLowerCase().includes(q) ||
          String(e.entity_code || '').toLowerCase().includes(q)
        )
      }
      return true
    })
    const page = p.page || 1
    const size = p.page_size || items.length || 50
    const start = (page - 1) * size
    const slice = items.slice(start, start + size)
    return Promise.resolve({ items: slice, total: items.length })
  }

  async getEntity(p: { organization_id: string; entity_id: string }) {
    const store = getStore()
    const all = Object.values(store).flat()
    const found = all.find(e => e.id === p.entity_id || e.entity_id === p.entity_id)
    if (!found) throw new Error('Not found')
    return found
  }

  async upsertEntity(p: UpsertEntityInput) {
    const store = getStore()
    const key = `${p.organization_id}:${p.entity_type}`
    const list = store[key] || []
    const id = p.primary?.entity_id || p.primary?.id || uuid()
    const next = {
      id,
      entity_id: id,
      entity_type: p.entity_type,
      entity_name: p.primary?.name || p.primary?.entity_name || 'Unnamed',
      entity_code: p.primary?.sku || p.primary?.code,
      attributes: p.dynamic || {},
      metadata: p.primary?.metadata || {}
    }
    const idx = list.findIndex(e => e.id === id)
    if (idx >= 0) list[idx] = { ...list[idx], ...next }
    else list.push(next)
    store[key] = list
    setStore(store)
    return { entity_id: id }
  }

  async upsertRelationship(p: {
    organization_id: string
    from_id: string
    to_id: string
    relation_type: string
    metadata?: any
  }) {
    // No-op in mock beyond success response
    return { success: true, relationship_id: uuid(), ...p }
  }

  async emitTxn(p: EmitTxnInput) {
    const txs = txStore()
    const id = uuid()
    txs.push({ id, ...p })
    setTxStore(txs)
    return { transaction_id: id }
  }

  async reverseTxn(p: { organization_id: string; transaction_id: string; reason?: string }) {
    const id = uuid()
    return { reversed_transaction_id: id }
  }

  async getTxn(p: { organization_id: string; transaction_id: string }) {
    const txs = txStore()
    const t = txs.find(x => x.id === p.transaction_id)
    if (!t) throw new Error('Not found')
    return t
  }

  async txnQuery(p: {
    organization_id: string
    source_entity_id?: string
    target_entity_id?: string
    transaction_type?: string
    smart_code_like?: string
    date_from?: string
    date_to?: string
    limit?: number
    offset?: number
    include_lines?: boolean
  }) {
    const all = txStore().filter(t => t.organization_id === p.organization_id)
    const filtered = all.filter(t => {
      if (p.transaction_type && t.transaction_type !== p.transaction_type) return false
      if (p.smart_code_like && !(t.smart_code || '').includes(p.smart_code_like)) return false
      return true
    })
    const off = p.offset || 0
    const lim = p.limit || 50
    return {
      transactions: filtered.slice(off, off + lim),
      total: filtered.length,
      limit: lim,
      offset: off
    }
  }

  async ledgerReport(p: {
    organization_id: string
    report: 'TB' | 'PL' | 'BS'
    from: string
    to: string
    branch_id?: string
    dims?: any
  }) {
    // Return a stubbed series suitable for charts
    return {
      report: p.report,
      from: p.from,
      to: p.to,
      series: [
        { label: 'Revenue', value: 120000 },
        { label: 'COGS', value: 80000 },
        { label: 'Expenses', value: 25000 },
        { label: 'Net', value: 15000 }
      ]
    }
  }

  async analyticsTiles(p: { organization_id: string; from: string; to: string; branch_id?: string }) {
    return {
      tiles: [
        { key: 'SalesToday', value: 25, trend: 'up' },
        { key: 'OpenTickets', value: 7, trend: 'flat' },
        { key: 'LowStock', value: 12, trend: 'down' },
        { key: 'CashSnapshot', value: 542000, currency: 'INR' }
      ]
    }
  }

  async stockByBranch(p: { organization_id: string; branch_id?: string; search?: string }) {
    // Simple mock aggregation by branch
    return {
      items: [
        { branch_id: p.branch_id || 'BR-001', product_code: 'PROD-1', qty: 12 },
        { branch_id: p.branch_id || 'BR-001', product_code: 'PROD-2', qty: 5 },
        { branch_id: 'BR-002', product_code: 'PROD-1', qty: 7 }
      ]
    }
  }
}
