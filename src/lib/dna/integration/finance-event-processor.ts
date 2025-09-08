/**
 * Universal Finance Event Processor
 * 
 * Central processor that all apps (restaurant, salon, etc.) use
 * to emit financial events that automatically post to GL
 */

import { FinanceDNALoader } from './finance-dna-loader'
import { FinanceDNAService, FinanceGuardrails } from './finance-integration-dna'
import type { UniversalFinanceEvent, UniversalFinanceLine } from './finance-integration-dna'

export class FinanceEventProcessor {
  private static instances = new Map<string, FinanceEventProcessor>()
  private financeService: FinanceDNAService
  private organizationId: string
  private isInitialized = false
  
  private constructor(organizationId: string) {
    this.organizationId = organizationId
    this.financeService = new FinanceDNAService(organizationId)
  }
  
  /**
   * Get or create processor instance for an organization
   */
  static async getInstance(organizationId: string): Promise<FinanceEventProcessor> {
    if (!this.instances.has(organizationId)) {
      const processor = new FinanceEventProcessor(organizationId)
      await processor.initialize()
      this.instances.set(organizationId, processor)
    }
    return this.instances.get(organizationId)!
  }
  
  private async initialize() {
    if (this.isInitialized) return
    
    // Load org config and posting rules
    await this.financeService.initialize()
    this.isInitialized = true
  }
  
  /**
   * Process any business event and automatically create GL postings
   */
  async processBusinessEvent(params: {
    smart_code: string
    source_system: string
    origin_txn_id: string
    currency: string
    metadata?: Record<string, any>
    lines: Array<{
      entity_id: string
      role: string
      amount: number
      type: 'debit' | 'credit'
      relationships?: Record<string, string>
      metadata?: Record<string, any>
    }>
  }): Promise<{
    success: boolean
    journal_code?: string
    status: 'posted' | 'staged' | 'rejected'
    message?: string
    gl_lines?: any[]
  }> {
    try {
      // Convert to universal finance event
      const event: UniversalFinanceEvent = {
        organization_id: this.organizationId,
        smart_code: params.smart_code,
        event_time: new Date().toISOString(),
        currency: params.currency,
        source_system: params.source_system,
        origin_txn_id: params.origin_txn_id,
        ai_confidence: 0.95, // Default high confidence
        metadata: params.metadata,
        lines: params.lines.map(line => ({
          entity_id: line.entity_id,
          role: line.role,
          dr: line.type === 'debit' ? line.amount : 0,
          cr: line.type === 'credit' ? line.amount : 0,
          relationships: line.relationships,
          metadata: line.metadata
        }))
      }
      
      // Process through finance DNA
      const result = await this.financeService.processEvent(event)
      
      if (result.outcome === 'posted') {
        return {
          success: true,
          journal_code: result.journal_code,
          status: 'posted',
          gl_lines: result.gl_lines
        }
      } else if (result.outcome === 'staged') {
        return {
          success: true,
          status: 'staged',
          message: 'Transaction staged for review',
          gl_lines: result.gl_lines
        }
      } else {
        return {
          success: false,
          status: 'rejected',
          message: result.reason
        }
      }
    } catch (error) {
      console.error('Finance event processing error:', error)
      return {
        success: false,
        status: 'rejected',
        message: error.message
      }
    }
  }
  
  /**
   * Helper method for simple revenue posting
   */
  async postRevenue(params: {
    amount: number
    currency: string
    payment_method: 'cash' | 'card' | 'transfer'
    revenue_type: string
    tax_amount?: number
    reference: string
    metadata?: Record<string, any>
  }) {
    const lines = [
      {
        entity_id: `PAYMENT:${params.payment_method}`,
        role: 'Payment Clearing',
        amount: params.amount,
        type: 'debit' as const
      },
      {
        entity_id: `REVENUE:${params.revenue_type}`,
        role: 'Revenue',
        amount: params.amount - (params.tax_amount || 0),
        type: 'credit' as const
      }
    ]
    
    if (params.tax_amount) {
      lines.push({
        entity_id: 'TAX:OUTPUT',
        role: 'Tax Payable',
        amount: params.tax_amount,
        type: 'credit' as const
      })
    }
    
    return this.processBusinessEvent({
      smart_code: `HERA.APP.REVENUE.${params.revenue_type.toUpperCase()}.v1`,
      source_system: 'APP',
      origin_txn_id: params.reference,
      currency: params.currency,
      metadata: params.metadata,
      lines
    })
  }
  
  /**
   * Helper method for simple expense posting
   */
  async postExpense(params: {
    amount: number
    currency: string
    payment_method: 'cash' | 'card' | 'ap'
    expense_type: string
    tax_amount?: number
    vendor?: string
    reference: string
    metadata?: Record<string, any>
  }) {
    const lines = [
      {
        entity_id: `EXPENSE:${params.expense_type}`,
        role: 'Expense',
        amount: params.amount - (params.tax_amount || 0),
        type: 'debit' as const
      }
    ]
    
    if (params.tax_amount) {
      lines.push({
        entity_id: 'TAX:INPUT',
        role: 'Tax Recoverable',
        amount: params.tax_amount,
        type: 'debit' as const
      })
    }
    
    if (params.payment_method === 'ap' && params.vendor) {
      lines.push({
        entity_id: `VENDOR:${params.vendor}`,
        role: 'Accounts Payable',
        amount: params.amount,
        type: 'credit' as const,
        relationships: { vendor_id: params.vendor }
      })
    } else {
      lines.push({
        entity_id: `PAYMENT:${params.payment_method}`,
        role: 'Payment Method',
        amount: params.amount,
        type: 'credit' as const
      })
    }
    
    return this.processBusinessEvent({
      smart_code: `HERA.APP.EXPENSE.${params.expense_type.toUpperCase()}.v1`,
      source_system: 'APP',
      origin_txn_id: params.reference,
      currency: params.currency,
      metadata: { ...params.metadata, vendor: params.vendor },
      lines
    })
  }
}

/**
 * React Hook for Finance Event Processing
 */
import { useState, useEffect } from 'react'

export function useFinanceProcessor(organizationId: string) {
  const [processor, setProcessor] = useState<FinanceEventProcessor | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    let mounted = true
    
    async function loadProcessor() {
      try {
        const proc = await FinanceEventProcessor.getInstance(organizationId)
        if (mounted) {
          setProcessor(proc)
          setLoading(false)
        }
      } catch (err) {
        if (mounted) {
          setError(err.message)
          setLoading(false)
        }
      }
    }
    
    loadProcessor()
    
    return () => {
      mounted = false
    }
  }, [organizationId])
  
  return { processor, loading, error }
}

/**
 * Example usage in a restaurant POS component:
 * 
 * const { processor } = useFinanceProcessor(organizationId)
 * 
 * const handleOrderComplete = async (order) => {
 *   const result = await processor.postRevenue({
 *     amount: order.total,
 *     currency: 'USD',
 *     payment_method: order.payment_method,
 *     revenue_type: 'RESTAURANT_SALE',
 *     tax_amount: order.tax,
 *     reference: order.id,
 *     metadata: {
 *       table_number: order.table,
 *       server: order.server_id
 *     }
 *   })
 *   
 *   if (result.success) {
 *     console.log('Posted to GL:', result.journal_code)
 *   }
 * }
 */