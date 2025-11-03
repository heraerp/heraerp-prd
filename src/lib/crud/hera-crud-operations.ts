/**
 * HERA CRUD Operations
 * Standardized CRUD operations for master data and transactions
 * Uses standard demo organization for consistency
 */

import { STANDARD_DEMO_ORGANIZATION, getStandardOrgId, getStandardUserId } from '@/lib/demo/standard-organization'

// HERA Smart Code Generator
export function generateSmartCode(module: string, type: string, subtype?: string): string {
  const segments = ['HERA', module.toUpperCase(), type.toUpperCase()]
  if (subtype) segments.push(subtype.toUpperCase())
  segments.push('v1')
  return segments.join('.')
}

// Generate unique code for entities
export function generateEntityCode(prefix: string): string {
  const timestamp = Date.now().toString().slice(-6)
  return `${prefix}${timestamp}`
}

// Base CRUD Operations Interface
export interface CrudOperations<T> {
  create(data: Partial<T>): Promise<T>
  read(id?: string): Promise<T | T[]>
  update(id: string, data: Partial<T>): Promise<T>
  delete(id: string): Promise<boolean>
}

// Master Data Entity Structure
export interface MasterDataEntity {
  id: string
  entity_type: string
  entity_code: string
  entity_name: string
  smart_code: string
  organization_id: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  core_dynamic_data?: Record<string, any>
}

// Transaction Structure
export interface TransactionEntity {
  id: string
  transaction_type: string
  transaction_code: string
  smart_code: string
  source_entity_id?: string
  target_entity_id?: string
  total_amount: number
  transaction_currency_code: string
  transaction_date: string
  transaction_status: string
  organization_id: string
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
  lines?: TransactionLine[]
}

export interface TransactionLine {
  id: string
  transaction_id: string
  line_number: number
  line_type: string
  entity_id?: string
  description: string
  quantity: number
  unit_amount: number
  line_amount: number
  smart_code: string
  organization_id: string
}

// Mock Database Store (In production, this would be replaced with actual database calls)
class MockDatabase {
  private entities: Map<string, MasterDataEntity> = new Map()
  private transactions: Map<string, TransactionEntity> = new Map()
  private transactionLines: Map<string, TransactionLine[]> = new Map()

  // Entity Operations
  saveEntity(entity: MasterDataEntity): MasterDataEntity {
    this.entities.set(entity.id, entity)
    return entity
  }

  getEntity(id: string): MasterDataEntity | undefined {
    return this.entities.get(id)
  }

  getAllEntities(organizationId?: string): MasterDataEntity[] {
    const entities = Array.from(this.entities.values())
    return organizationId 
      ? entities.filter(e => e.organization_id === organizationId)
      : entities
  }

  deleteEntity(id: string): boolean {
    return this.entities.delete(id)
  }

  // Transaction Operations
  saveTransaction(transaction: TransactionEntity): TransactionEntity {
    this.transactions.set(transaction.id, transaction)
    if (transaction.lines) {
      this.transactionLines.set(transaction.id, transaction.lines)
    }
    return transaction
  }

  getTransaction(id: string): TransactionEntity | undefined {
    const transaction = this.transactions.get(id)
    if (transaction) {
      transaction.lines = this.transactionLines.get(id) || []
    }
    return transaction
  }

  getAllTransactions(organizationId?: string): TransactionEntity[] {
    const transactions = Array.from(this.transactions.values())
    const filtered = organizationId 
      ? transactions.filter(t => t.organization_id === organizationId)
      : transactions
    
    // Attach lines to each transaction
    return filtered.map(t => ({
      ...t,
      lines: this.transactionLines.get(t.id) || []
    }))
  }

  deleteTransaction(id: string): boolean {
    this.transactionLines.delete(id)
    return this.transactions.delete(id)
  }
}

// Global mock database instance
const mockDb = new MockDatabase()

// Master Data CRUD Operations
export class MasterDataCrud implements CrudOperations<MasterDataEntity> {
  constructor(private entityType: string) {}

  async create(data: Partial<MasterDataEntity>): Promise<MasterDataEntity> {
    const now = new Date().toISOString()
    const entity: MasterDataEntity = {
      id: crypto.randomUUID(),
      entity_type: this.entityType,
      entity_code: data.entity_code || generateEntityCode(this.entityType.toUpperCase().slice(0, 4)),
      entity_name: data.entity_name || '',
      smart_code: data.smart_code || generateSmartCode('MASTER', this.entityType),
      organization_id: data.organization_id || getStandardOrgId(),
      created_by: data.created_by || getStandardUserId(),
      updated_by: data.updated_by || getStandardUserId(),
      created_at: now,
      updated_at: now,
      core_dynamic_data: data.core_dynamic_data || {}
    }

    return mockDb.saveEntity(entity)
  }

  async read(id?: string): Promise<MasterDataEntity | MasterDataEntity[]> {
    if (id) {
      const entity = mockDb.getEntity(id)
      if (!entity) throw new Error(`Entity with id ${id} not found`)
      return entity
    }
    
    return mockDb.getAllEntities(getStandardOrgId())
      .filter(e => e.entity_type === this.entityType)
  }

  async update(id: string, data: Partial<MasterDataEntity>): Promise<MasterDataEntity> {
    const existing = mockDb.getEntity(id)
    if (!existing) throw new Error(`Entity with id ${id} not found`)

    const updated: MasterDataEntity = {
      ...existing,
      ...data,
      id: existing.id, // Preserve ID
      updated_by: getStandardUserId(),
      updated_at: new Date().toISOString()
    }

    return mockDb.saveEntity(updated)
  }

  async delete(id: string): Promise<boolean> {
    const entity = mockDb.getEntity(id)
    if (!entity) throw new Error(`Entity with id ${id} not found`)
    
    return mockDb.deleteEntity(id)
  }
}

// Transaction CRUD Operations
export class TransactionCrud implements CrudOperations<TransactionEntity> {
  constructor(private transactionType: string) {}

  async create(data: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const now = new Date().toISOString()
    const transaction: TransactionEntity = {
      id: crypto.randomUUID(),
      transaction_type: this.transactionType,
      transaction_code: data.transaction_code || generateEntityCode('TXN'),
      smart_code: data.smart_code || generateSmartCode('TXN', this.transactionType),
      source_entity_id: data.source_entity_id,
      target_entity_id: data.target_entity_id,
      total_amount: data.total_amount || 0,
      transaction_currency_code: data.transaction_currency_code || 'AED',
      transaction_date: data.transaction_date || now,
      transaction_status: data.transaction_status || 'DRAFT',
      organization_id: data.organization_id || getStandardOrgId(),
      created_by: data.created_by || getStandardUserId(),
      updated_by: data.updated_by || getStandardUserId(),
      created_at: now,
      updated_at: now,
      lines: data.lines || []
    }

    return mockDb.saveTransaction(transaction)
  }

  async read(id?: string): Promise<TransactionEntity | TransactionEntity[]> {
    if (id) {
      const transaction = mockDb.getTransaction(id)
      if (!transaction) throw new Error(`Transaction with id ${id} not found`)
      return transaction
    }
    
    return mockDb.getAllTransactions(getStandardOrgId())
      .filter(t => t.transaction_type === this.transactionType)
  }

  async update(id: string, data: Partial<TransactionEntity>): Promise<TransactionEntity> {
    const existing = mockDb.getTransaction(id)
    if (!existing) throw new Error(`Transaction with id ${id} not found`)

    const updated: TransactionEntity = {
      ...existing,
      ...data,
      id: existing.id, // Preserve ID
      updated_by: getStandardUserId(),
      updated_at: new Date().toISOString()
    }

    return mockDb.saveTransaction(updated)
  }

  async delete(id: string): Promise<boolean> {
    const transaction = mockDb.getTransaction(id)
    if (!transaction) throw new Error(`Transaction with id ${id} not found`)
    
    return mockDb.deleteTransaction(id)
  }

  async addLine(transactionId: string, lineData: Partial<TransactionLine>): Promise<TransactionLine> {
    const transaction = mockDb.getTransaction(transactionId)
    if (!transaction) throw new Error(`Transaction with id ${transactionId} not found`)

    const line: TransactionLine = {
      id: crypto.randomUUID(),
      transaction_id: transactionId,
      line_number: lineData.line_number || (transaction.lines?.length || 0) + 1,
      line_type: lineData.line_type || 'ITEM',
      entity_id: lineData.entity_id,
      description: lineData.description || '',
      quantity: lineData.quantity || 1,
      unit_amount: lineData.unit_amount || 0,
      line_amount: lineData.line_amount || (lineData.quantity || 1) * (lineData.unit_amount || 0),
      smart_code: lineData.smart_code || generateSmartCode('TXN', this.transactionType, 'LINE'),
      organization_id: getStandardOrgId()
    }

    if (!transaction.lines) transaction.lines = []
    transaction.lines.push(line)
    
    // Recalculate total
    transaction.total_amount = transaction.lines.reduce((sum, l) => sum + l.line_amount, 0)
    
    mockDb.saveTransaction(transaction)
    return line
  }
}

// Pre-configured CRUD instances for common entities
export const customerCrud = new MasterDataCrud('customer')
export const vendorCrud = new MasterDataCrud('vendor')
export const productCrud = new MasterDataCrud('product')
export const glAccountCrud = new MasterDataCrud('gl_account')

// Pre-configured CRUD instances for common transactions
export const salesOrderCrud = new TransactionCrud('sales_order')
export const purchaseOrderCrud = new TransactionCrud('purchase_order')
export const invoiceCrud = new TransactionCrud('invoice')
export const paymentCrud = new TransactionCrud('payment')
export const journalEntryCrud = new TransactionCrud('journal_entry')

// Utility functions for testing
export async function initializeStandardData() {
  console.log('🔧 Initializing standard demo data...')
  
  // Create sample customers
  await customerCrud.create({
    entity_name: 'ABC Trading LLC',
    core_dynamic_data: {
      email: 'contact@abctrading.ae',
      phone: '+971-4-1234567',
      credit_limit: 50000,
      payment_terms: '30 days'
    }
  })

  // Create sample vendors
  await vendorCrud.create({
    entity_name: 'Office Supplies Co.',
    core_dynamic_data: {
      email: 'orders@officesupplies.ae',
      phone: '+971-4-3456789',
      payment_terms: '30 days'
    }
  })

  // Create sample products
  await productCrud.create({
    entity_name: 'Laptop Computer',
    core_dynamic_data: {
      description: 'High-performance business laptop',
      category: 'Electronics',
      unit_price: 3500,
      cost_price: 2800,
      stock_quantity: 25
    }
  })

  // Create sample GL accounts
  await glAccountCrud.create({
    entity_name: 'Cash - Main Account',
    entity_code: '1120',
    core_dynamic_data: {
      account_type: 'ASSET',
      account_category: 'CURRENT',
      normal_balance: 'DEBIT'
    }
  })

  console.log('✅ Standard demo data initialized')
}

// Test function to demonstrate CRUD operations
export async function testCrudOperations() {
  console.log('🧪 Testing HERA CRUD Operations...')

  try {
    // Initialize data
    await initializeStandardData()

    // Test customer creation
    const customer = await customerCrud.create({
      entity_name: 'Test Customer Inc.',
      core_dynamic_data: {
        email: 'test@customer.com',
        credit_limit: 25000
      }
    })
    console.log('✅ Customer created:', customer.entity_name)

    // Test reading customers
    const customers = await customerCrud.read() as MasterDataEntity[]
    console.log('✅ Found customers:', customers.length)

    // Test sales order creation
    const salesOrder = await salesOrderCrud.create({
      source_entity_id: customer.id,
      transaction_currency_code: 'AED',
      transaction_status: 'PENDING'
    })
    console.log('✅ Sales order created:', salesOrder.transaction_code)

    // Test adding transaction lines
    await salesOrderCrud.addLine(salesOrder.id, {
      description: 'Test Product',
      quantity: 2,
      unit_amount: 1000,
      line_amount: 2000
    })
    console.log('✅ Transaction line added')

    // Test reading updated transaction
    const updatedOrder = await salesOrderCrud.read(salesOrder.id) as TransactionEntity
    console.log('✅ Updated order total:', updatedOrder.total_amount)

    console.log('🎉 All CRUD operations completed successfully!')
    return true

  } catch (error) {
    console.error('❌ CRUD test failed:', error)
    return false
  }
}