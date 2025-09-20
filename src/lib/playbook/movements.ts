import { Movement, MovementLine } from '@/schemas/inventory'

const BASE_URL = process.env.NEXT_PUBLIC_PLAYBOOK_BASE_URL
const API_KEY = process.env.NEXT_PUBLIC_PLAYBOOK_API_KEY
const hasEnv = Boolean(BASE_URL && API_KEY)

// In-memory store for mock data
const mockDataStore: {
  movements: Map<string, Movement[]> // organizationId -> movements array
  nextId: number
} = {
  movements: new Map(),
  nextId: 1000
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

// Generate mock movements
function generateMockMovements(count: number, organizationId: string, branchId: string): Movement[] {
  const types: Array<'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUST'> = ['RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUST']
  const movements: Movement[] = []
  
  for (let i = 0; i < count; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const id = `MVT-${String(mockDataStore.nextId++).padStart(6, '0')}`
    const itemCount = Math.floor(Math.random() * 5) + 1
    
    const movement: Movement = {
      id,
      organization_id: organizationId,
      smart_code: `HERA.INVENTORY.MOVE.${type}.V1`,
      transaction_code: `TXN-${Date.now()}-${i}`,
      when_ts: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      branch_id: branchId,
      status: 'posted',
      total_amount: 0,
      metadata: {
        type,
        reference: type === 'RECEIPT' ? `PO-${Math.floor(Math.random() * 1000)}` : 
                   type === 'ISSUE' ? `SO-${Math.floor(Math.random() * 1000)}` :
                   type === 'TRANSFER' ? `TRF-${Math.floor(Math.random() * 1000)}` :
                   `ADJ-${Math.floor(Math.random() * 1000)}`,
        posted_by: 'demo-user',
        posted_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString()
      },
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      lines: []
    }
    
    // Add transfer branches
    if (type === 'TRANSFER') {
      movement.from_entity_id = branchId
      movement.to_entity_id = `BRN-${String(Math.floor(Math.random() * 5) + 1).padStart(3, '0')}`
    }
    
    // Generate lines
    let totalAmount = 0
    for (let j = 0; j < itemCount; j++) {
      const qty = Math.floor(Math.random() * 20) + 1
      const unitCost = Math.floor(Math.random() * 100) + 10
      const amount = qty * unitCost
      totalAmount += amount
      
      const line: MovementLine = {
        id: `${id}-L${j + 1}`,
        transaction_id: id,
        line_no: j + 1,
        smart_code: 'HERA.INVENTORY.LINE.ITEM.V1',
        entity_id: `ITM-${String(Math.floor(Math.random() * 15) + 1).padStart(3, '0')}`,
        qty: type === 'ISSUE' ? -qty : qty, // Negative for issues
        uom: 'unit',
        unit_cost: unitCost,
        amount: type === 'ISSUE' ? -amount : amount,
        metadata: {
          item_name: `Item ${j + 1}`,
          note: `${type} movement line`
        }
      }
      
      movement.lines!.push(line)
    }
    
    movement.total_amount = totalAmount
    movements.push(movement)
  }
  
  return movements.sort((a, b) => b.when_ts.localeCompare(a.when_ts))
}

export async function listMovements(params: {
  organization_id: string
  branch_id?: string
  from?: Date
  to?: Date
  types?: string[]
  q?: string
  limit?: number
  offset?: number
}): Promise<{ items: Movement[], total: number }> {
  if (!hasEnv) {
    console.log('📦 Movements: Using mock data (no Playbook env)')
    
    const branchId = params.branch_id || 'BRN-001'
    
    // Initialize mock data if not exists
    if (!mockDataStore.movements.has(params.organization_id)) {
      const initialMovements = generateMockMovements(50, params.organization_id, branchId)
      mockDataStore.movements.set(params.organization_id, initialMovements)
    }
    
    let allMovements = mockDataStore.movements.get(params.organization_id) || []
    
    // Filter by branch
    if (params.branch_id) {
      allMovements = allMovements.filter(m => 
        m.branch_id === params.branch_id ||
        m.from_entity_id === params.branch_id ||
        m.to_entity_id === params.branch_id
      )
    }
    
    // Filter by type
    if (params.types && params.types.length > 0) {
      allMovements = allMovements.filter(m => 
        params.types!.includes(m.metadata?.type || '')
      )
    }
    
    // Filter by date range
    if (params.from) {
      allMovements = allMovements.filter(m => 
        new Date(m.when_ts) >= params.from!
      )
    }
    if (params.to) {
      allMovements = allMovements.filter(m => 
        new Date(m.when_ts) <= params.to!
      )
    }
    
    // Search
    if (params.q) {
      const query = params.q.toLowerCase()
      allMovements = allMovements.filter(m =>
        m.transaction_code.toLowerCase().includes(query) ||
        m.metadata?.reference?.toLowerCase().includes(query) ||
        m.lines?.some(l => l.metadata?.item_name?.toLowerCase().includes(query))
      )
    }
    
    // Paginate
    const offset = params.offset || 0
    const limit = params.limit || 50
    const items = allMovements.slice(offset, offset + limit)
    
    return { items, total: allMovements.length }
  }
  
  try {
    // Build smart code filter
    const smartCodeFilter = params.types && params.types.length > 0
      ? params.types.map(t => `HERA.INVENTORY.MOVE.${t}.V1`)
      : ['HERA.INVENTORY.MOVE.RECEIPT.V1', 'HERA.INVENTORY.MOVE.ISSUE.V1', 
         'HERA.INVENTORY.MOVE.TRANSFER.V1', 'HERA.INVENTORY.MOVE.ADJUST.V1']
    
    const url = withParams('/universal_transactions', {
      organization_id: params.organization_id,
      smart_code: `in(${smartCodeFilter.join(',')})`,
      branch_id: params.branch_id,
      'when_ts.gte': params.from?.toISOString(),
      'when_ts.lte': params.to?.toISOString(),
      q: params.q,
      limit: params.limit || 50,
      offset: params.offset || 0,
      sort: 'when_ts:desc'
    })
    
    console.log('📦 Movements: GET', url.toString())
    const res = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!res.ok) throw new Error(`Failed to list movements: ${res.status}`)
    const data = await res.json()
    
    return {
      items: data.items || data.rows || [],
      total: data.total || data.count || 0
    }
  } catch (error) {
    console.error('Failed to list movements:', error)
    throw error
  }
}

export async function postMovement(
  header: {
    organization_id: string
    smart_code: string
    when_ts: string
    branch_id: string
    status?: 'draft' | 'posted'
    metadata?: any
    from_entity_id?: string // For transfers
    to_entity_id?: string // For transfers
  },
  lines: Array<{
    line_no: number
    smart_code: string
    entity_id: string
    qty: number
    uom: string
    unit_cost: number
    amount: number
    metadata?: any
  }>
): Promise<Movement> {
  if (!hasEnv) {
    console.log('📝 PostMovement: Mock mode', { header, lines })
    
    const movement: Movement = {
      id: `MVT-${String(mockDataStore.nextId++).padStart(6, '0')}`,
      ...header,
      transaction_code: `TXN-${Date.now()}`,
      status: header.status || 'posted',
      total_amount: lines.reduce((sum, line) => sum + line.amount, 0),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      lines: lines.map((line, i) => ({
        id: `${header.organization_id}-L${i + 1}`,
        transaction_id: '',
        ...line
      }))
    }
    
    // Add to store
    const orgMovements = mockDataStore.movements.get(header.organization_id) || []
    orgMovements.unshift(movement)
    mockDataStore.movements.set(header.organization_id, orgMovements)
    
    console.log('📝 PostMovement: Added to mock store')
    
    return movement
  }
  
  try {
    const body = {
      ...header,
      transaction_code: `TXN-${Date.now()}`,
      total_amount: lines.reduce((sum, line) => sum + line.amount, 0),
      lines
    }
    
    console.log('📝 PostMovement:', body)
    const res = await fetch(`${BASE_URL}/universal_transactions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    })
    
    if (!res.ok) throw new Error(`Failed to post movement: ${res.status}`)
    return await res.json()
  } catch (error) {
    console.error('Failed to post movement:', error)
    throw error
  }
}

export async function postAccountingForMovement(movement: Movement): Promise<{
  journal_id: string
  entries: Array<{ account: string, debit?: number, credit?: number }>
}> {
  // This would integrate with Finance DNA to post journal entries
  // For now, we'll return a mock accounting entry
  
  const entries: Array<{ account: string, debit?: number, credit?: number }> = []
  
  switch (movement.metadata?.type) {
    case 'RECEIPT':
      // Dr Inventory / Cr GRNI
      entries.push(
        { account: '1330000', debit: movement.total_amount }, // Inventory
        { account: '2110000', credit: movement.total_amount } // GRNI
      )
      break
      
    case 'ISSUE':
      // Dr COGS / Cr Inventory
      entries.push(
        { account: '5110000', debit: Math.abs(movement.total_amount) }, // COGS
        { account: '1330000', credit: Math.abs(movement.total_amount) } // Inventory
      )
      break
      
    case 'TRANSFER':
      // No P&L impact, optionally use in-transit accounts
      if (movement.from_entity_id && movement.to_entity_id) {
        entries.push(
          { account: '1335000', debit: movement.total_amount }, // In-Transit Inventory
          { account: '1330000', credit: movement.total_amount } // Inventory (From)
        )
      }
      break
      
    case 'ADJUST':
      // Positive: Dr Inventory / Cr Variance
      // Negative: Dr Variance / Cr Inventory
      if (movement.total_amount > 0) {
        entries.push(
          { account: '1330000', debit: movement.total_amount }, // Inventory
          { account: '5910000', credit: movement.total_amount } // Inventory Variance (Income)
        )
      } else {
        entries.push(
          { account: '5920000', debit: Math.abs(movement.total_amount) }, // Inventory Variance (Expense)
          { account: '1330000', credit: Math.abs(movement.total_amount) } // Inventory
        )
      }
      break
  }
  
  if (!hasEnv) {
    console.log('📋 PostAccountingForMovement: Mock mode', { movement_id: movement.id, entries })
    return {
      journal_id: `JRN-${Date.now()}`,
      entries
    }
  }
  
  // In production, this would call Finance DNA API
  try {
    const journalHeader = {
      organization_id: movement.organization_id,
      smart_code: 'HERA.FINANCE.JOURNAL.INVENTORY.V1',
      when_ts: movement.when_ts,
      reference: `${movement.metadata?.type}/${movement.transaction_code}`,
      total_amount: movement.total_amount,
      status: 'posted',
      metadata: {
        source: 'inventory_movement',
        movement_id: movement.id,
        movement_type: movement.metadata?.type
      }
    }
    
    const journalLines = entries.map((entry, i) => ({
      line_no: i + 1,
      smart_code: 'HERA.FINANCE.JOURNAL.LINE.V1',
      account_code: entry.account,
      debit_amount: entry.debit || 0,
      credit_amount: entry.credit || 0,
      metadata: {
        movement_ref: movement.transaction_code
      }
    }))
    
    console.log('📋 PostAccountingForMovement:', { journalHeader, journalLines })
    
    // This would be the actual API call to Finance DNA
    // const journal = await postJournalEntry(journalHeader, journalLines)
    
    return {
      journal_id: `JRN-${Date.now()}`,
      entries
    }
  } catch (error) {
    console.error('Failed to post accounting for movement:', error)
    throw error
  }
}